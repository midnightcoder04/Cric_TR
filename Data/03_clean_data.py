"""
Phase 1 — Script 3 of 3
========================
Data Cleaning & Validation
----------------------------
Runs a series of cleaning passes on the database and exports validated
flat-file CSVs that Phase 2 (feature engineering) will read directly.

Passes performed:
  1. Drop / flag statistically insignificant matches
       - Rain-affected or short matches are flagged (already in DB); here we
         produce a "clean" subset that excludes them for modelling purposes.
  2. Player name de-duplication
       - After ingestion, there may still be near-duplicate player rows
         (e.g. "R Sharma" vs "RG Sharma"). We use fuzzy-matching to surface
         candidates so you can review and merge them in NAME_PATCHES in config.
  3. Outlier detection in batting/bowling aggregates
       - Flag any single-innings batting/bowling figure that looks like a
         data entry error (e.g. 10 wickets in an innings).
  4. Export clean CSVs
       - deliveries_clean.csv  — filtered, joined delivery-level data
       - match_results.csv     — clean match metadata
       - player_registry.csv   — de-duplicated player roster

Usage:
  python 03_clean_data.py
  python 03_clean_data.py --no-fuzzy   # skip fuzzy-match pass (faster)
"""

import argparse
import sys
from pathlib import Path

import pandas as pd
import numpy as np
from loguru import logger
from sqlalchemy import create_engine, text

sys.path.insert(0, str(Path(__file__).parent))
from config import DB_PATH, PARSED_DIR, LOG_LEVEL, MIN_BATTING_INNINGS, MIN_BOWLING_INNINGS

logger.remove()
logger.add(sys.stderr, level=LOG_LEVEL,
           format="<green>{time:HH:mm:ss}</green> | <level>{level: <8}</level> | {message}")

PARSED = Path(PARSED_DIR)
PARSED.mkdir(parents=True, exist_ok=True)


# ─── Pass 1: Build Clean Match List ─────────────────────────────────────────

def build_clean_matches(engine) -> pd.DataFrame:
    """
    Returns a DataFrame of matches that pass quality filters:
      - Not rain-affected
      - Not short (below minimum overs threshold)
      - Has a known winner (no tie/no-result)
    """
    query = """
        SELECT
            m.id         AS match_id,
            m.match_format,
            m.date,
            m.team1,
            m.team2,
            m.winner,
            m.toss_winner,
            m.toss_decision,
            m.win_by_runs,
            m.win_by_wickets,
            m.total_overs,
            m.is_rain_affected,
            m.is_short_match,
            v.name       AS venue,
            v.city,
            v.country,
            v.pitch_type
        FROM matches m
        LEFT JOIN venues v ON m.venue_id = v.id
    """
    df = pd.read_sql(query, engine)

    before = len(df)
    clean = df[
        (~df["is_rain_affected"]) &
        (~df["is_short_match"])   &
        (df["winner"].notna())    &
        (df["winner"] != "")      &
        (df["winner"] != "nan")
    ].copy()

    logger.info(
        f"Pass 1 — match filtering: {before:,} total → {len(clean):,} clean "
        f"({before - len(clean):,} dropped)"
    )
    return clean


# ─── Pass 2: Fuzzy Name De-duplication ──────────────────────────────────────

def fuzzy_deduplicate_players(engine, threshold: float = 0.82) -> pd.DataFrame:
    """
    Uses SequenceMatcher to flag player pairs whose names are suspiciously
    similar. Writes candidates to players_dedup_candidates.csv for manual review.
    Does NOT auto-merge — that is a human decision.
    Returns the current player DataFrame.
    """
    from difflib import SequenceMatcher

    players = pd.read_sql("SELECT id, canonical_name FROM players ORDER BY canonical_name", engine)
    names   = players["canonical_name"].tolist()

    candidates = []
    n = len(names)
    logger.info(f"Pass 2 — fuzzy name check across {n:,} players …")

    # O(n²) is fine up to ~10 000 players; above that, use rapidfuzz.
    for i in range(n):
        for j in range(i + 1, n):
            ratio = SequenceMatcher(None, names[i].lower(), names[j].lower()).ratio()
            if ratio >= threshold:
                candidates.append({
                    "id_a":   players.iloc[i]["id"],
                    "name_a": names[i],
                    "id_b":   players.iloc[j]["id"],
                    "name_b": names[j],
                    "similarity": round(ratio, 3),
                })

    cand_df = pd.DataFrame(candidates).sort_values("similarity", ascending=False)
    out = PARSED / "players_dedup_candidates.csv"
    cand_df.to_csv(out, index=False)

    if len(cand_df):
        logger.warning(
            f"  Found {len(cand_df)} potential duplicate player pairs. "
            f"Review: {out}\n"
            f"  Add confirmed duplicates to NAME_PATCHES in config.py, "
            f"then re-run 02_setup_database.py --rebuild."
        )
    else:
        logger.success("  No suspicious duplicates found.")

    return players


# ─── Pass 3: Outlier Detection ───────────────────────────────────────────────

def detect_outliers(engine) -> None:
    """
    Flags extreme single-match aggregates that likely indicate bad data.
    Writes outliers_batting.csv and outliers_bowling.csv for review.
    """

    # Batting: individual innings > 300 runs (only Don Bradman-level in tests)
    bat_query = """
        SELECT
            d.match_id,
            m.match_format,
            p.canonical_name   AS batter,
            SUM(d.runs_batter) AS innings_runs,
            COUNT(d.id)        AS balls_faced
        FROM deliveries d
        JOIN matches m  ON d.match_id  = m.id
        JOIN players p  ON d.batter_id = p.id
        WHERE d.is_wide = 0
        GROUP BY d.match_id, d.innings, d.batter_id
        HAVING innings_runs > 300 OR balls_faced > 500
    """
    bat_outliers = pd.read_sql(bat_query, engine)
    if len(bat_outliers):
        out = PARSED / "outliers_batting.csv"
        bat_outliers.to_csv(out, index=False)
        logger.warning(f"  {len(bat_outliers)} suspicious batting innings → {out}")
    else:
        logger.success("  No batting outliers detected.")

    # Bowling: > 10 wickets in an innings (impossible)
    bowl_query = """
        SELECT
            d.match_id,
            m.match_format,
            p.canonical_name    AS bowler,
            COUNT(d.wicket_kind) AS wickets,
            COUNT(d.id)          AS balls_bowled
        FROM deliveries d
        JOIN matches m  ON d.match_id   = m.id
        JOIN players p  ON d.bowler_id  = p.id
        WHERE d.wicket_kind IS NOT NULL
          AND d.wicket_kind NOT IN ('run out', 'retired hurt', 'obstructing the field')
        GROUP BY d.match_id, d.innings, d.bowler_id
        HAVING wickets > 10
    """
    bowl_outliers = pd.read_sql(bowl_query, engine)
    if len(bowl_outliers):
        out = PARSED / "outliers_bowling.csv"
        bowl_outliers.to_csv(out, index=False)
        logger.warning(f"  {len(bowl_outliers)} suspicious bowling innings → {out}")
    else:
        logger.success("  No bowling outliers detected.")


# ─── Pass 4: Export Clean CSVs ───────────────────────────────────────────────

def export_deliveries_clean(engine, clean_match_ids: list) -> None:
    """
    Exports a joined, flat deliveries CSV for the clean match subset.
    Includes player names, venue, format — everything Phase 2 needs.
    """
    logger.info("Exporting deliveries_clean.csv …")

    # SQLite doesn't like huge IN clauses; chunk if needed
    chunk_size = 5000
    parts = []

    id_chunks = [clean_match_ids[i:i+chunk_size]
                 for i in range(0, len(clean_match_ids), chunk_size)]

    for chunk in id_chunks:
        placeholders = ",".join(f"'{mid}'" for mid in chunk)
        query = f"""
            SELECT
                d.id            AS delivery_id,
                d.match_id,
                m.match_format,
                m.date,
                m.team1,
                m.team2,
                m.winner,
                v.name          AS venue,
                v.pitch_type,
                d.innings,
                d.over,
                d.ball,
                d.batting_team,
                pb.canonical_name  AS batter,
                pnb.canonical_name AS non_striker,
                pw.canonical_name  AS bowler,
                d.runs_batter,
                d.runs_extras,
                d.runs_total,
                d.wicket_kind,
                po.canonical_name  AS player_dismissed,
                d.is_wide,
                d.is_noball
            FROM deliveries d
            JOIN matches m          ON d.match_id       = m.id
            LEFT JOIN venues v      ON m.venue_id        = v.id
            LEFT JOIN players pb    ON d.batter_id       = pb.id
            LEFT JOIN players pnb   ON d.non_striker_id  = pnb.id
            LEFT JOIN players pw    ON d.bowler_id       = pw.id
            LEFT JOIN players po    ON d.player_out_id   = po.id
            WHERE d.match_id IN ({placeholders})
        """
        parts.append(pd.read_sql(query, engine))

    if not parts:
        logger.warning("No deliveries to export.")
        return

    df = pd.concat(parts, ignore_index=True)
    df["date"] = pd.to_datetime(df["date"])
    df.sort_values(["date", "match_id", "innings", "over", "ball"], inplace=True)

    out = PARSED / "deliveries_clean.csv"
    df.to_csv(out, index=False)
    logger.success(f"  {len(df):,} deliveries → {out}")


def export_match_results(clean_df: pd.DataFrame) -> None:
    out = PARSED / "match_results.csv"
    clean_df.to_csv(out, index=False)
    logger.success(f"  {len(clean_df):,} matches → {out}")


def export_player_registry(engine) -> None:
    players = pd.read_sql(
        "SELECT id, canonical_name, name_variants FROM players ORDER BY canonical_name",
        engine
    )
    out = PARSED / "player_registry.csv"
    players.to_csv(out, index=False)
    logger.success(f"  {len(players):,} players → {out}")


# ─── Entry Point ─────────────────────────────────────────────────────────────

def main() -> None:
    parser = argparse.ArgumentParser(description="Clean & export cricket data")
    parser.add_argument("--no-fuzzy", action="store_true",
                        help="Skip fuzzy name deduplication (saves time on large datasets).")
    args = parser.parse_args()

    db_path = Path(DB_PATH)
    if not db_path.exists():
        logger.error(f"Database not found at {db_path}. Run 02_setup_database.py first.")
        sys.exit(1)

    engine = create_engine(f"sqlite:///{db_path}", echo=False)

    print("\n" + "─" * 60)
    print("  PASS 1 — Match Quality Filtering")
    print("─" * 60)
    clean_matches = build_clean_matches(engine)

    print("\n" + "─" * 60)
    print("  PASS 2 — Player Name De-duplication")
    print("─" * 60)
    if args.no_fuzzy:
        logger.info("Skipped (--no-fuzzy).")
    else:
        fuzzy_deduplicate_players(engine)

    print("\n" + "─" * 60)
    print("  PASS 3 — Outlier Detection")
    print("─" * 60)
    detect_outliers(engine)

    print("\n" + "─" * 60)
    print("  PASS 4 — Export Clean CSVs")
    print("─" * 60)
    clean_ids = clean_matches["match_id"].tolist()
    export_deliveries_clean(engine, clean_ids)
    export_match_results(clean_matches)
    export_player_registry(engine)

    print("\n" + "─" * 60)
    print("  SUMMARY")
    print("─" * 60)
    for f in sorted(PARSED.glob("*.csv")):
        rows = sum(1 for _ in open(f)) - 1
        print(f"  {f.name:40s}  {rows:>10,} rows")
    print("─" * 60 + "\n")

    logger.success("Phase 1 / Step 3 complete. Proceed to 04_feature_engineering.py")


if __name__ == "__main__":
    main()
