"""
Phase 1 — Script 2 of 3
========================
Parse Raw CSVs → Relational Database
--------------------------------------
Takes the Cricsheet CSV2 files extracted by script 01 and loads them into a
clean relational SQLite database (cricket.db).

Tables created:
  • matches        — one row per match (metadata, result, venue …)
  • deliveries     — ball-by-ball (every delivery in every match)
  • players        — canonical player registry with normalised names
  • player_matches — which players appeared in each match (with role)
  • venues         — stadium metadata + pitch archetype

Design decisions:
  • SQLite is chosen for zero-config setup; the schema is identical to
    PostgreSQL — just swap the SQLAlchemy connection string in config.py
    when you're ready to scale.
  • Player names are normalised via a lookup table to reconcile spelling
    differences across Cricsheet eras (e.g. "MS Dhoni" vs "M.S. Dhoni").
  • Rain-affected / very short matches are flagged rather than deleted so
    downstream scripts can choose to include or exclude them.

Usage:
  python 02_setup_database.py
  python 02_setup_database.py --formats t20           # only T20
  python 02_setup_database.py --rebuild               # drop & recreate tables
"""

import argparse
import re
import sys
from pathlib import Path
from datetime import datetime, date

import pandas as pd
from loguru import logger
from sqlalchemy import (
    create_engine, text,
    Column, Integer, String, Float, Boolean, Date, Text,
    ForeignKey, UniqueConstraint,
)
from sqlalchemy.orm import declarative_base, Session
from tqdm import tqdm

sys.path.insert(0, str(Path(__file__).parent))
from config import (
    RAW_DIR, DB_PATH, LOG_LEVEL,
    MIN_OVERS_T20, MIN_OVERS_ODI, MIN_OVERS_TEST,
    KNOWN_PITCH_TYPES,
)

logger.remove()
logger.add(sys.stderr, level=LOG_LEVEL,
           format="<green>{time:HH:mm:ss}</green> | <level>{level: <8}</level> | {message}")

Base = declarative_base()

# ─── ORM Models ─────────────────────────────────────────────────────────────

class Venue(Base):
    __tablename__ = "venues"
    id          = Column(Integer, primary_key=True, autoincrement=True)
    name        = Column(String(200), unique=True, nullable=False)
    city        = Column(String(100))
    country     = Column(String(100))
    pitch_type  = Column(String(50))   # flat | spin | seam | pace | balanced
    avg_first_innings_score = Column(Float)  # computed later in Phase 2


class Player(Base):
    __tablename__ = "players"
    id              = Column(Integer, primary_key=True, autoincrement=True)
    canonical_name  = Column(String(150), unique=True, nullable=False)
    # Pipe-separated list of name variants seen in source data
    name_variants   = Column(Text, default="")


class Match(Base):
    __tablename__ = "matches"
    id              = Column(String(20), primary_key=True)   # Cricsheet match id
    match_format    = Column(String(10))    # t20 | odi | test
    date            = Column(Date)
    venue_id        = Column(Integer, ForeignKey("venues.id"))
    team1           = Column(String(100))
    team2           = Column(String(100))
    toss_winner     = Column(String(100))
    toss_decision   = Column(String(20))    # bat | field
    winner          = Column(String(100))
    win_by_runs     = Column(Integer)
    win_by_wickets  = Column(Integer)
    total_overs     = Column(Float)         # actual overs bowled
    is_rain_affected = Column(Boolean, default=False)
    is_short_match  = Column(Boolean, default=False)   # below MIN_OVERS threshold


class PlayerMatch(Base):
    __tablename__ = "player_matches"
    __table_args__ = (UniqueConstraint("player_id", "match_id", "team"),)
    id        = Column(Integer, primary_key=True, autoincrement=True)
    player_id = Column(Integer, ForeignKey("players.id"), nullable=False)
    match_id  = Column(String(20), ForeignKey("matches.id"), nullable=False)
    team      = Column(String(100))
    role      = Column(String(30))   # BAT | BOWL | ALL | WK  (populated in Phase 2)


class Delivery(Base):
    __tablename__ = "deliveries"
    id             = Column(Integer, primary_key=True, autoincrement=True)
    match_id       = Column(String(20), ForeignKey("matches.id"), nullable=False)
    innings        = Column(Integer)
    over           = Column(Integer)
    ball           = Column(Integer)
    batting_team   = Column(String(100))
    batter_id      = Column(Integer, ForeignKey("players.id"))
    non_striker_id = Column(Integer, ForeignKey("players.id"))
    bowler_id      = Column(Integer, ForeignKey("players.id"))
    runs_batter    = Column(Integer, default=0)
    runs_extras    = Column(Integer, default=0)
    runs_total     = Column(Integer, default=0)
    wicket_kind    = Column(String(50))     # null if no wicket
    player_out_id  = Column(Integer, ForeignKey("players.id"))
    is_wide        = Column(Boolean, default=False)
    is_noball      = Column(Boolean, default=False)


# ─── Name Normalisation Helpers ──────────────────────────────────────────────

# Extend this dict to patch any remaining mismatches you encounter.
NAME_PATCHES = {
    "ms dhoni":         "MS Dhoni",
    "m.s. dhoni":       "MS Dhoni",
    "m dhoni":          "MS Dhoni",
    "v kohli":          "V Kohli",
    "virat kohli":      "V Kohli",
    "rohit sharma":     "RG Sharma",
    "r sharma":         "RG Sharma",
    "shikhar dhawan":   "S Dhawan",
    "da warner":        "DA Warner",
    "david warner":     "DA Warner",
    "ab de villiers":   "AB de Villiers",
    "a de villiers":    "AB de Villiers",
}


def normalise_name(raw: str) -> str:
    """Return a canonical player name, applying known patches."""
    if not isinstance(raw, str):
        return ""
    key = raw.strip().lower()
    if key in NAME_PATCHES:
        return NAME_PATCHES[key]
    # Title-case as fallback
    return raw.strip().title()


# ─── Database Helpers ────────────────────────────────────────────────────────

def get_or_create_player(session: Session, cache: dict, raw_name: str) -> int:
    """Return player.id, creating the row if it doesn't exist. Uses in-memory cache."""
    canonical = normalise_name(raw_name)
    if canonical in cache:
        return cache[canonical]

    player = session.query(Player).filter_by(canonical_name=canonical).first()
    if player is None:
        player = Player(canonical_name=canonical, name_variants=raw_name)
        session.add(player)
        session.flush()
    else:
        # Append variant if new
        variants = set(player.name_variants.split("|")) if player.name_variants else set()
        if raw_name not in variants:
            variants.add(raw_name)
            player.name_variants = "|".join(variants)

    cache[canonical] = player.id
    return player.id


def get_or_create_venue(session: Session, cache: dict, name: str, city: str = "", country: str = "") -> int:
    if name in cache:
        return cache[name]
    venue = session.query(Venue).filter_by(name=name).first()
    if venue is None:
        venue = Venue(
            name=name,
            city=city,
            country=country,
            pitch_type=KNOWN_PITCH_TYPES.get(name, "balanced"),
        )
        session.add(venue)
        session.flush()
    cache[name] = venue.id
    return venue.id


# ─── Info File Parser ────────────────────────────────────────────────────────

def parse_info_file(info_path: Path) -> dict | None:
    """
    Parse a Cricsheet *_info.csv file and return a dict of match metadata.
    Returns None if the file is malformed.
    """
    rows = pd.read_csv(info_path, header=None, names=["type", "key", "value"])
    info = {}
    for _, row in rows.iterrows():
        if row["type"] == "info":
            key = str(row["key"]).strip()
            val = str(row["value"]).strip() if pd.notna(row["value"]) else ""
            # Multi-value keys (like team, player) become lists
            if key in info:
                if isinstance(info[key], list):
                    info[key].append(val)
                else:
                    info[key] = [info[key], val]
            else:
                info[key] = val
    return info if info else None


def min_overs_threshold(fmt: str) -> float:
    return {"t20": MIN_OVERS_T20, "odi": MIN_OVERS_ODI, "test": MIN_OVERS_TEST}.get(fmt, 0)


# ─── Main Ingestion Logic ────────────────────────────────────────────────────

def ingest_format(fmt: str, session: Session,
                  player_cache: dict, venue_cache: dict) -> tuple[int, int]:
    """
    Ingest all matches for a given *fmt* (t20/odi/test).
    Returns (matches_loaded, deliveries_loaded).
    """
    fmt_dir   = Path(RAW_DIR) / fmt
    info_files = sorted(fmt_dir.glob("*_info.csv"))

    if not info_files:
        logger.warning(f"No *_info.csv files found in {fmt_dir}. Run 01_download_data.py first.")
        return 0, 0

    logger.info(f"Ingesting {len(info_files)} {fmt.upper()} matches …")
    min_overs   = min_overs_threshold(fmt)
    n_matches   = 0
    n_deliveries = 0

    for info_path in tqdm(info_files, desc=f"{fmt.upper()}", ncols=80):
        match_id = info_path.stem.replace("_info", "")
        delivery_path = info_path.with_name(f"{match_id}.csv")

        # ── skip if already loaded ──────────────────────────────────────────
        if session.get(Match, match_id):
            continue

        # ── parse metadata ──────────────────────────────────────────────────
        info = parse_info_file(info_path)
        if not info:
            logger.debug(f"Skipping malformed info file: {info_path.name}")
            continue

        teams   = info.get("team", [])
        team1   = teams[0] if len(teams) > 0 else ""
        team2   = teams[1] if len(teams) > 1 else ""

        raw_date = info.get("date", "")
        try:
            # Cricsheet dates can be "2023-01-15" or list for multi-day
            match_date = datetime.strptime(
                raw_date if isinstance(raw_date, str) else raw_date[0],
                "%Y-%m-%d"
            ).date()
        except (ValueError, IndexError):
            match_date = None

        venue_name = info.get("venue", "Unknown Venue")
        city       = info.get("city", "")
        venue_id   = get_or_create_venue(session, venue_cache, venue_name, city)

        outcome        = info.get("outcome", {})
        winner         = info.get("winner", "")
        win_by_runs    = int(info.get("by_runs", 0) or 0)
        win_by_wickets = int(info.get("by_wickets", 0) or 0)

        # ── load deliveries file ────────────────────────────────────────────
        if not delivery_path.exists():
            logger.debug(f"Missing delivery file: {delivery_path.name}, skipping match.")
            continue

        try:
            df = pd.read_csv(delivery_path, low_memory=False)
        except Exception as e:
            logger.debug(f"Failed to read {delivery_path.name}: {e}")
            continue

        # Compute actual overs bowled (innings 1 is enough for the flag)
        inn1 = df[df.get("innings", pd.Series(dtype=int)) == 1] if "innings" in df.columns else df
        max_over      = inn1["over"].max() if "over" in inn1.columns else 0
        total_overs   = float(max_over) if pd.notna(max_over) else 0.0
        is_short      = total_overs < min_overs
        is_rain       = "rain" in str(info.get("method", "")).lower() or \
                        "d/l" in str(info.get("result", "")).lower()

        match = Match(
            id=match_id,
            match_format=fmt,
            date=match_date,
            venue_id=venue_id,
            team1=team1,
            team2=team2,
            toss_winner=info.get("toss_winner", ""),
            toss_decision=info.get("toss", {}) if isinstance(info.get("toss"), str) else info.get("toss_decision", ""),
            winner=winner,
            win_by_runs=win_by_runs,
            win_by_wickets=win_by_wickets,
            total_overs=total_overs,
            is_rain_affected=is_rain,
            is_short_match=is_short,
        )
        session.add(match)

        # ── register players appearing in this match ────────────────────────
        all_players_raw = info.get("player", [])
        if isinstance(all_players_raw, str):
            all_players_raw = [all_players_raw]

        for p_name in all_players_raw:
            pid = get_or_create_player(session, player_cache, p_name)
            # Determine which team this player belongs to
            # (Cricsheet info files list teams before players so we approximate)
            pm = PlayerMatch(player_id=pid, match_id=match_id, team="")
            session.add(pm)

        # ── insert deliveries ───────────────────────────────────────────────
        expected_cols = {
            "innings", "over", "ball", "batting_team",
            "striker", "non_striker", "bowler",
            "runs_off_bat", "extras", "runs_off_bat",
        }
        # Normalise column names (Cricsheet uses slightly different names in some packs)
        col_map = {
            "runs_off_bat": "runs_batter",
            "extras":       "runs_extras",
        }
        df.rename(columns=col_map, inplace=True)

        for _, row in df.iterrows():
            batter_id       = get_or_create_player(session, player_cache, str(row.get("striker",      "")))
            non_striker_id  = get_or_create_player(session, player_cache, str(row.get("non_striker",  "")))
            bowler_id       = get_or_create_player(session, player_cache, str(row.get("bowler",       "")))

            wicket_kind = str(row.get("wicket_type", ""))  if pd.notna(row.get("wicket_type"))  else None
            player_out_raw  = str(row.get("player_dismissed", "")) if pd.notna(row.get("player_dismissed")) else None
            player_out_id   = get_or_create_player(session, player_cache, player_out_raw) if player_out_raw else None

            delivery = Delivery(
                match_id       = match_id,
                innings        = int(row.get("innings", 1) or 1),
                over           = int(row.get("over", 0) or 0),
                ball           = int(row.get("ball", 0) or 0),
                batting_team   = str(row.get("batting_team", "") or ""),
                batter_id      = batter_id,
                non_striker_id = non_striker_id,
                bowler_id      = bowler_id,
                runs_batter    = int(row.get("runs_batter", 0) or 0),
                runs_extras    = int(row.get("runs_extras", 0) or 0),
                runs_total     = int(row.get("runs_total",
                                    (row.get("runs_batter", 0) or 0) +
                                    (row.get("runs_extras", 0) or 0)) or 0),
                wicket_kind    = wicket_kind if wicket_kind else None,
                player_out_id  = player_out_id,
                is_wide        = bool(row.get("wides", 0)),
                is_noball      = bool(row.get("noballs", 0)),
            )
            session.add(delivery)
            n_deliveries += 1

        n_matches += 1

        # Commit every 200 matches to avoid huge in-memory transactions
        if n_matches % 200 == 0:
            session.commit()
            logger.debug(f"  … {n_matches} matches committed")

    session.commit()
    logger.success(f"{fmt.upper()}: {n_matches} matches, {n_deliveries:,} deliveries loaded.")
    return n_matches, n_deliveries


# ─── Entry Point ─────────────────────────────────────────────────────────────

def main() -> None:
    parser = argparse.ArgumentParser(description="Parse Cricsheet CSVs into the database")
    parser.add_argument("--formats", nargs="+", default=["t20", "odi", "test"],
                        choices=["t20", "odi", "test"])
    parser.add_argument("--rebuild", action="store_true",
                        help="Drop all tables and rebuild from scratch.")
    args = parser.parse_args()

    db_path = Path(DB_PATH)
    db_path.parent.mkdir(parents=True, exist_ok=True)

    engine = create_engine(f"sqlite:///{db_path}", echo=False)

    if args.rebuild:
        logger.warning("--rebuild flag set: dropping all existing tables.")
        Base.metadata.drop_all(engine)

    Base.metadata.create_all(engine)
    logger.info(f"Database at: {db_path}")

    # Shared caches to avoid repeated SELECT queries
    player_cache: dict[str, int] = {}
    venue_cache:  dict[str, int] = {}

    total_matches    = 0
    total_deliveries = 0

    with Session(engine) as session:
        for fmt in args.formats:
            m, d = ingest_format(fmt, session, player_cache, venue_cache)
            total_matches    += m
            total_deliveries += d

    # Summary
    print("\n" + "─" * 60)
    print("  DATABASE SUMMARY")
    print("─" * 60)
    with engine.connect() as conn:
        for table in ["matches", "deliveries", "players", "venues", "player_matches"]:
            count = conn.execute(text(f"SELECT COUNT(*) FROM {table}")).scalar()
            print(f"  {table:20s}  {count:>10,} rows")
    print("─" * 60)
    print(f"\n  ✓ {total_matches:,} new matches ingested")
    print(f"  ✓ {total_deliveries:,} new deliveries ingested")
    print(f"  ✓ DB path: {db_path}\n")

    logger.success("Phase 1 / Step 2 complete. Proceed to 03_clean_data.py")


if __name__ == "__main__":
    main()
