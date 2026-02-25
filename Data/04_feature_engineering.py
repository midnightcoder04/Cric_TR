"""
Phase 2 — Feature Engineering
==============================
Translates raw cricket data into the "context parameters" needed by the ML engine.

Features produced (all saved as CSVs in data/parsed/):

  1. player_batting_profiles.csv
       - Career and format-specific averages, strike rates
       - Rolling short/long window form metrics (configurable)
       - Time-decay weighted averages (recent matches count more)

  2. player_bowling_profiles.csv
       - Career and format averages, economy rates, wicket rates
       - Same rolling + decay windows

  3. venue_profiles.csv
       - Average first innings score per venue
       - Batting / bowling pitch archetype (from config + computed data)
       - Spin-wicket%, pace-wicket% (helps encode pitch friendliness)

  4. matchup_stats.csv
       - Head-to-head batter vs bowler records (runs, balls, dismissals, SR)
       - Batter vs bowling-style records (off-spin, left-arm-pace, etc.)
       - Only included if a batter has faced a bowler 10+ deliveries (noise filter)

  5. player_impact_scores.csv
       - The TARGET VARIABLE for the ML model
       - A weighted composite of batting and bowling contributions per match
       - Normalised to 0–100 scale within each format

Usage:
  python 04_feature_engineering.py
  python 04_feature_engineering.py --formats t20 odi
"""

import argparse
import sys
from pathlib import Path
from typing import Optional, List

import numpy as np
import pandas as pd
from loguru import logger

sys.path.insert(0, str(Path(__file__).parent))
from config import (
    PARSED_DIR, LOG_LEVEL,
    FORM_SHORT_WINDOW, FORM_LONG_WINDOW, DECAY_HALF_LIFE_DAYS,
    BATTING_WEIGHTS, BOWLING_WEIGHTS,
    MIN_BATTING_INNINGS, MIN_BOWLING_INNINGS,
)

logger.remove()
logger.add(sys.stderr, level=LOG_LEVEL,
           format="<green>{time:HH:mm:ss}</green> | <level>{level: <8}</level> | {message}")

PARSED = Path(PARSED_DIR)


# ─── Data Loading ─────────────────────────────────────────────────────────────

def load_deliveries(formats: Optional[List[str]] = None) -> pd.DataFrame:
    path = PARSED / "deliveries_clean.csv"
    if not path.exists():
        logger.error(f"deliveries_clean.csv not found at {path}. Run 03_clean_data.py first.")
        sys.exit(1)

    logger.info("Loading deliveries_clean.csv …")
    df = pd.read_csv(path, parse_dates=["date"], low_memory=False)

    if formats:
        df = df[df["match_format"].isin(formats)]
        logger.info(f"Filtered to formats: {formats} → {len(df):,} deliveries")

    return df


# ─── Decay Weights ────────────────────────────────────────────────────────────

def compute_decay_weight(dates: pd.Series, reference_date: pd.Timestamp,
                         half_life_days: int = DECAY_HALF_LIFE_DAYS) -> pd.Series:
    """
    Returns an array of weights in (0, 1] where the most recent match = 1.0
    and weight halves every *half_life_days* days.
    """
    days_ago = (reference_date - dates).dt.days.clip(lower=0).astype(float)
    return np.exp(-np.log(2) * days_ago / half_life_days)


# ─── Feature 1: Batting Profiles ─────────────────────────────────────────────

def build_batting_profiles(df: pd.DataFrame) -> pd.DataFrame:
    """
    One row per (batter, match_format) with career stats + form metrics.
    """
    logger.info("Building batting profiles …")

    # Legal deliveries faced (exclude wides which bowlers concede, not batters face)
    balls = df[df["is_wide"] == 0].copy()
    balls["is_dismissal"] = balls["player_dismissed"] == balls["batter"]

    grp = balls.groupby(["batter", "match_format", "match_id", "date", "venue", "pitch_type"])
    innings = grp.agg(
        runs   = ("runs_batter", "sum"),
        balls  = ("runs_batter", "count"),
        outs   = ("is_dismissal", "sum"),
    ).reset_index()
    
    logger.debug(f"Total innings aggregated: {len(innings)}")

    innings["strike_rate"] = (innings["runs"] / innings["balls"].clip(lower=1)) * 100

    # Reference date = latest match in dataset
    ref_date = df["date"].max()
    logger.debug(f"Reference date for decay weights: {ref_date}, type: {type(ref_date)}")
    
    if pd.isna(ref_date):
        logger.warning("No valid dates found in dataset - skipping decay weights")
        innings["decay_w"] = 1.0
    else:
        innings["decay_w"] = compute_decay_weight(innings["date"], ref_date)

    profiles = []
    total_player_formats = len(innings.groupby(["batter", "match_format"]))
    filtered_count = 0
    
    for (batter, fmt), grp_df in innings.groupby(["batter", "match_format"]):
        grp_df = grp_df.sort_values("date")

        if len(grp_df) < MIN_BATTING_INNINGS:
            filtered_count += 1
            continue

        career_runs  = grp_df["runs"].sum()
        career_balls = grp_df["balls"].sum()
        career_outs  = grp_df["outs"].sum()

        career_avg = career_runs / max(career_outs, 1)
        career_sr  = (career_runs / max(career_balls, 1)) * 100

        # Short rolling form (last N innings)
        recent_s = grp_df.tail(FORM_SHORT_WINDOW)
        form_sr_short = (recent_s["runs"].sum() / max(recent_s["balls"].sum(), 1)) * 100
        form_avg_short = recent_s["runs"].sum() / max(recent_s["outs"].sum(), 1)

        # Long rolling form
        recent_l = grp_df.tail(FORM_LONG_WINDOW)
        form_sr_long  = (recent_l["runs"].sum() / max(recent_l["balls"].sum(), 1)) * 100
        form_avg_long = recent_l["runs"].sum() / max(recent_l["outs"].sum(), 1)

        # Decay-weighted average
        w = grp_df["decay_w"]
        weighted_runs = (grp_df["runs"] * w).sum()
        weighted_outs = (grp_df["outs"] * w).sum()
        weighted_avg  = weighted_runs / max(weighted_outs, 1)
        weighted_sr   = (weighted_runs / max((grp_df["balls"] * w).sum(), 1)) * 100

        # Venue performance (mean SR across venues in dataset)
        venue_perf = (
            grp_df.groupby("pitch_type")
            .apply(lambda x: (x["runs"].sum() / max(x["balls"].sum(), 1)) * 100, include_groups=False)
            .to_dict()
        )

        profiles.append({
            "player":           batter,
            "match_format":     fmt,
            "total_innings":    len(grp_df),
            "career_runs":      career_runs,
            "career_avg":       round(career_avg, 2),
            "career_sr":        round(career_sr, 2),
            "form_avg_short":   round(form_avg_short, 2),
            "form_sr_short":    round(form_sr_short, 2),
            "form_avg_long":    round(form_avg_long, 2),
            "form_sr_long":     round(form_sr_long, 2),
            "weighted_avg":     round(weighted_avg, 2),
            "weighted_sr":      round(weighted_sr, 2),
            # Pitch-type SRs (may be NaN if no innings on that pitch type)
            "sr_on_flat":       round(venue_perf.get("flat",     np.nan), 2),
            "sr_on_spin":       round(venue_perf.get("spin",     np.nan), 2),
            "sr_on_seam":       round(venue_perf.get("seam",     np.nan), 2),
            "sr_on_pace":       round(venue_perf.get("pace",     np.nan), 2),
            "sr_on_balanced":   round(venue_perf.get("balanced", np.nan), 2),
        })

    logger.debug(f"Built {len(profiles)} profiles from {total_player_formats} player-format combinations ({filtered_count} filtered out for < {MIN_BATTING_INNINGS} innings)")
    
    result = pd.DataFrame(profiles)
    out = PARSED / "player_batting_profiles.csv"
    result.to_csv(out, index=False)
    logger.success(f"  {len(result):,} batting profiles → {out}")
    return result


# ─── Feature 2: Bowling Profiles ─────────────────────────────────────────────

def build_bowling_profiles(df: pd.DataFrame) -> pd.DataFrame:
    logger.info("Building bowling profiles …")

    # Bowler-credit wickets (exclude run-outs which are fielding events)
    valid_wickets = {"caught", "bowled", "lbw", "stumped",
                     "caught and bowled", "hit wicket", "hit the ball twice"}

    balls = df.copy()
    balls["bowler_wicket"] = (
        balls["wicket_kind"].str.lower().isin(valid_wickets) &
        balls["player_dismissed"].notna()
    )
    # Legal balls for economy (wides & no-balls DO count)
    # But for strike rate and average, exclude wides
    legal = balls[(balls["is_wide"] == 0) & (balls["is_noball"] == 0)].copy()

    grp = balls.groupby(["bowler", "match_format", "match_id", "date", "venue", "pitch_type"])
    innings = grp.agg(
        runs_conceded = ("runs_total", "sum"),
        balls_bowled  = ("runs_total", "count"),   # all balls incl wides
        wickets       = ("bowler_wicket", "sum"),
    ).reset_index()

    innings["economy"]  = (innings["runs_conceded"] / (innings["balls_bowled"] / 6)).clip(lower=0)
    innings["bowl_avg"] = innings["runs_conceded"] / innings["wickets"].clip(lower=1)

    ref_date = df["date"].max()
    innings["decay_w"] = compute_decay_weight(innings["date"], ref_date)

    profiles = []
    for (bowler, fmt), grp_df in innings.groupby(["bowler", "match_format"]):
        grp_df = grp_df.sort_values("date")

        if len(grp_df) < MIN_BOWLING_INNINGS:
            continue

        total_runs    = grp_df["runs_conceded"].sum()
        total_balls   = grp_df["balls_bowled"].sum()
        total_wickets = grp_df["wickets"].sum()

        career_economy = (total_runs / (total_balls / 6)) if total_balls else 0
        career_avg     = total_runs / max(total_wickets, 1)
        career_sr      = total_balls / max(total_wickets, 1)

        recent_s = grp_df.tail(FORM_SHORT_WINDOW)
        recent_l = grp_df.tail(FORM_LONG_WINDOW)

        form_eco_short = (recent_s["runs_conceded"].sum() /
                          (recent_s["balls_bowled"].sum() / 6 + 1e-9))
        form_eco_long  = (recent_l["runs_conceded"].sum() /
                          (recent_l["balls_bowled"].sum() / 6 + 1e-9))

        w = grp_df["decay_w"]
        w_runs    = (grp_df["runs_conceded"] * w).sum()
        w_balls   = (grp_df["balls_bowled"]  * w).sum()
        w_wickets = (grp_df["wickets"]       * w).sum()

        weighted_eco = w_runs / (w_balls / 6 + 1e-9)
        weighted_avg = w_runs / max(w_wickets, 1)

        pitch_eco = (
            grp_df.groupby("pitch_type")
            .apply(lambda x: x["runs_conceded"].sum() / (x["balls_bowled"].sum() / 6 + 1e-9), include_groups=False)
            .to_dict()
        )

        profiles.append({
            "player":             bowler,
            "match_format":       fmt,
            "total_innings":      len(grp_df),
            "career_wickets":     int(total_wickets),
            "career_avg":         round(career_avg, 2),
            "career_economy":     round(career_economy, 2),
            "career_sr":          round(career_sr, 2),
            "form_eco_short":     round(form_eco_short, 2),
            "form_eco_long":      round(form_eco_long, 2),
            "weighted_avg":       round(weighted_avg, 2),
            "weighted_economy":   round(weighted_eco, 2),
            "eco_on_flat":        round(pitch_eco.get("flat",     np.nan), 2),
            "eco_on_spin":        round(pitch_eco.get("spin",     np.nan), 2),
            "eco_on_seam":        round(pitch_eco.get("seam",     np.nan), 2),
            "eco_on_pace":        round(pitch_eco.get("pace",     np.nan), 2),
            "eco_on_balanced":    round(pitch_eco.get("balanced", np.nan), 2),
        })

    result = pd.DataFrame(profiles)
    out = PARSED / "player_bowling_profiles.csv"
    result.to_csv(out, index=False)
    logger.success(f"  {len(result):,} bowling profiles → {out}")
    return result


# ─── Feature 3: Venue Profiles ───────────────────────────────────────────────

def build_venue_profiles(df: pd.DataFrame) -> pd.DataFrame:
    logger.info("Building venue profiles …")

    # Average first-innings score per venue + format
    inn1 = df[df["innings"] == 1]
    venue_scores = (
        inn1.groupby(["venue", "match_format", "match_id"])["runs_total"]
        .sum()
        .reset_index()
        .groupby(["venue", "match_format"])["runs_total"]
        .agg(avg_first_innings_score="mean", num_matches="count")
        .reset_index()
    )

    # Pace vs spin wicket percentage per venue
    wicket_balls = df[df["wicket_kind"].notna()].copy()
    wicket_balls["wicket_kind_lower"] = wicket_balls["wicket_kind"].str.lower()

    # We don't have bowling-style in raw data; use bowler name heuristics
    # A proper implementation would look up bowler style from a separate table.
    # Here we leave the columns as NaN to be filled in Phase 3 when we enrich
    # with a bowler-style reference table.
    venue_scores["pitch_type"] = df.groupby("venue")["pitch_type"].first().reindex(
        venue_scores["venue"]).values

    out = PARSED / "venue_profiles.csv"
    venue_scores.to_csv(out, index=False)
    logger.success(f"  {len(venue_scores):,} venue-format combinations → {out}")
    return venue_scores


# ─── Feature 4: Matchup Stats (Batter vs Bowler) ─────────────────────────────

MIN_MATCHUP_BALLS = 10   # ignore matchups with fewer balls (too noisy)


def build_matchup_stats(df: pd.DataFrame) -> pd.DataFrame:
    logger.info("Building batter-vs-bowler matchup stats …")

    balls = df[df["is_wide"] == 0].copy()
    balls["is_dismissal"] = (
        (balls["player_dismissed"] == balls["batter"]) &
        (balls["wicket_kind"].notna()) &
        (~balls["wicket_kind"].str.lower().isin(["run out", "retired hurt"]))
    )

    grp = balls.groupby(["batter", "bowler", "match_format"]).agg(
        balls      = ("runs_batter", "count"),
        runs       = ("runs_batter", "sum"),
        dismissals = ("is_dismissal", "sum"),
    ).reset_index()

    # Filter out small sample matchups
    grp = grp[grp["balls"] >= MIN_MATCHUP_BALLS].copy()
    grp["strike_rate"]      = (grp["runs"] / grp["balls"].clip(lower=1)) * 100
    grp["dismissal_rate"]   = grp["dismissals"] / grp["balls"].clip(lower=1)
    grp["batting_avg"]      = grp["runs"] / grp["dismissals"].clip(lower=1)

    grp = grp.round(2)
    out = PARSED / "matchup_stats.csv"
    grp.to_csv(out, index=False)
    logger.success(f"  {len(grp):,} matchup pairs (min {MIN_MATCHUP_BALLS} balls) → {out}")
    return grp


# ─── Feature 5: Opponent-Specific Profiles ────────────────────────────────────

MIN_OPPONENT_INNINGS = 3   # minimum innings vs an opponent to include


def build_opponent_profiles(df: pd.DataFrame) -> pd.DataFrame:
    """
    Build per-player stats grouped by opponent team.
    Returns batting and bowling performance vs each specific opponent nation.
    
    Output columns:
      - player, match_format, opponent_team
      - vs_opp_bat_innings, vs_opp_bat_runs, vs_opp_bat_avg, vs_opp_bat_sr
      - vs_opp_bowl_innings, vs_opp_bowl_wickets, vs_opp_bowl_economy, vs_opp_bowl_avg
    """
    logger.info("Building opponent-specific profiles …")
    
    # First, determine opponent team for each delivery
    df_opp = df.copy()
    
    # For batters: opponent is the fielding team (not their batting team)
    # batting_team is the team batting, so opponent is team1 if batting_team==team2, else team2
    df_opp["batter_opponent"] = df_opp.apply(
        lambda row: row["team2"] if row["batting_team"] == row["team1"] else row["team1"],
        axis=1
    )
    
    # For bowlers: opponent is the batting team (they bowl to the batting side)
    df_opp["bowler_opponent"] = df_opp["batting_team"]
    
    # ── BATTING vs opponent ───────────────────────────────────────────────────
    bat_balls = df_opp[df_opp["is_wide"] == 0].copy()
    bat_balls["is_dismissal"] = bat_balls["player_dismissed"] == bat_balls["batter"]
    
    bat_grp = bat_balls.groupby(
        ["batter", "match_format", "batter_opponent", "match_id", "date"]
    ).agg(
        runs  = ("runs_batter", "sum"),
        balls = ("runs_batter", "count"),
        outs  = ("is_dismissal", "sum"),
    ).reset_index()
    
    # Aggregate by player × format × opponent
    bat_profiles = []
    for (player, fmt, opp), grp_df in bat_grp.groupby(["batter", "match_format", "batter_opponent"]):
        if len(grp_df) < MIN_OPPONENT_INNINGS:
            continue
            
        total_runs  = grp_df["runs"].sum()
        total_balls = grp_df["balls"].sum()
        total_outs  = grp_df["outs"].sum()
        
        avg = total_runs / max(total_outs, 1)
        sr  = (total_runs / max(total_balls, 1)) * 100
        
        bat_profiles.append({
            "player":           player,
            "match_format":     fmt,
            "opponent_team":    opp,
            "vs_opp_bat_innings": len(grp_df),
            "vs_opp_bat_runs":    total_runs,
            "vs_opp_bat_avg":     round(avg, 2),
            "vs_opp_bat_sr":      round(sr, 2),
        })
    
    bat_df = pd.DataFrame(bat_profiles)
    logger.debug(f"  Built {len(bat_df):,} batting vs opponent records")
    
    # ── BOWLING vs opponent ───────────────────────────────────────────────────
    valid_wickets = {"caught", "bowled", "lbw", "stumped",
                     "caught and bowled", "hit wicket", "hit the ball twice"}
    
    bowl_balls = df_opp.copy()
    bowl_balls["bowler_wicket"] = (
        bowl_balls["wicket_kind"].str.lower().isin(valid_wickets) &
        bowl_balls["player_dismissed"].notna()
    )
    
    bowl_grp = bowl_balls.groupby(
        ["bowler", "match_format", "bowler_opponent", "match_id", "date"]
    ).agg(
        runs_conceded = ("runs_total", "sum"),
        balls_bowled  = ("runs_total", "count"),
        wickets       = ("bowler_wicket", "sum"),
    ).reset_index()
    
    # Aggregate by player × format × opponent
    bowl_profiles = []
    for (player, fmt, opp), grp_df in bowl_grp.groupby(["bowler", "match_format", "bowler_opponent"]):
        if len(grp_df) < MIN_OPPONENT_INNINGS:
            continue
            
        total_runs    = grp_df["runs_conceded"].sum()
        total_balls   = grp_df["balls_bowled"].sum()
        total_wickets = grp_df["wickets"].sum()
        
        economy = (total_runs / (total_balls / 6)) if total_balls else 0
        avg     = total_runs / max(total_wickets, 1)
        
        bowl_profiles.append({
            "player":              player,
            "match_format":        fmt,
            "opponent_team":       opp,
            "vs_opp_bowl_innings": len(grp_df),
            "vs_opp_bowl_wickets": total_wickets,
            "vs_opp_bowl_economy": round(economy, 2),
            "vs_opp_bowl_avg":     round(avg, 2),
        })
    
    bowl_df = pd.DataFrame(bowl_profiles)
    logger.debug(f"  Built {len(bowl_df):,} bowling vs opponent records")
    
    # ── Merge batting and bowling opponent profiles ──────────────────────────
    merged = bat_df.merge(
        bowl_df, 
        on=["player", "match_format", "opponent_team"], 
        how="outer"
    )
    
    # Fill NaN for players who only bat or only bowl vs an opponent
    for col in merged.columns:
        if col.startswith("vs_opp_"):
            merged[col] = merged[col].fillna(0)
    
    out = PARSED / "opponent_profiles.csv"
    merged.to_csv(out, index=False)
    logger.success(f"  {len(merged):,} player × opponent profiles → {out}")
    return merged


# ─── Feature 6: Player Impact Score (Target Variable) ────────────────────────

def build_impact_scores(df: pd.DataFrame) -> pd.DataFrame:
    """
    Computes a per-player-per-match 'Impact Score' that combines batting and
    bowling contributions into a single number, normalised 0–100 within format.

    Batting contribution:
        bat_raw = runs + (strike_rate - format_avg_sr) * alpha

    Bowling contribution:
        bowl_raw = wickets * 25 + (format_avg_eco - economy) * balls_bowled / 6

    These are then weighted and scaled.

    This is a transparent, rule-based target variable that you can tune before
    switching to a self-supervised or label-based approach in Phase 3.
    """
    logger.info("Computing Player Impact Scores …")

    # ── Batting aggregates per player per match ──────────────────────────────
    bat = (
        df[df["is_wide"] == 0]
        .groupby(["batter", "match_id", "match_format", "date", "batting_team", "venue", "pitch_type"])
        .agg(runs=("runs_batter", "sum"), balls=("runs_batter", "count"))
        .reset_index()
        .rename(columns={"batter": "player", "batting_team": "team"})
    )
    bat["strike_rate"] = (bat["runs"] / bat["balls"].clip(lower=1)) * 100

    # ── Bowling aggregates per player per match ──────────────────────────────
    valid_wickets = {"caught", "bowled", "lbw", "stumped",
                     "caught and bowled", "hit wicket"}
    bowl_df = df.copy()
    bowl_df["bowler_wicket"] = bowl_df["wicket_kind"].str.lower().isin(valid_wickets)

    bowl = (
        bowl_df.groupby(["bowler", "match_id", "match_format", "date",
                         "batting_team", "venue", "pitch_type"])
        .agg(
            runs_conceded = ("runs_total", "sum"),
            balls_bowled  = ("runs_total", "count"),
            wickets       = ("bowler_wicket", "sum"),
        )
        .reset_index()
        .rename(columns={"bowler": "player"})
    )
    bowl["economy"] = bowl["runs_conceded"] / (bowl["balls_bowled"] / 6).clip(lower=0.01)
    # Identify the opposing team (the batting team the bowler bowled against)
    bowl["team"] = ""   # will be resolved from match metadata if needed

    # ── Format-level benchmarks ──────────────────────────────────────────────
    format_bench = {
        "t20":  {"avg_sr": 130.0, "avg_eco": 8.0},
        "odi":  {"avg_sr":  80.0, "avg_eco": 5.5},
        "test": {"avg_sr":  50.0, "avg_eco": 3.0},
    }

    def batting_score(row):
        bench = format_bench.get(row["match_format"], format_bench["t20"])
        raw = row["runs"] + (row["strike_rate"] - bench["avg_sr"]) * 0.2
        return max(raw, 0)

    def bowling_score(row):
        bench = format_bench.get(row["match_format"], format_bench["t20"])
        overs = row["balls_bowled"] / 6
        raw = row["wickets"] * 25 + (bench["avg_eco"] - row["economy"]) * overs * 6
        return max(raw, 0)

    bat["bat_score"]  = bat.apply(batting_score, axis=1)
    bowl["bowl_score"] = bowl.apply(bowling_score, axis=1)

    # ── Merge batting and bowling per player-match ───────────────────────────
    bat_s  = bat[["player", "match_id", "match_format", "date", "venue",
                  "pitch_type", "bat_score", "runs", "balls", "strike_rate"]]
    bowl_s = bowl[["player", "match_id", "bowl_score", "wickets",
                   "runs_conceded", "balls_bowled", "economy"]]

    merged = bat_s.merge(bowl_s, on=["player", "match_id"], how="outer")
    merged["bat_score"]  = merged["bat_score"].fillna(0)
    merged["bowl_score"] = merged["bowl_score"].fillna(0)
    merged["raw_impact"] = merged["bat_score"] + merged["bowl_score"]

    # ── Normalise to 0–100 within each format ───────────────────────────────
    for fmt in merged["match_format"].dropna().unique():
        mask = merged["match_format"] == fmt
        vals = merged.loc[mask, "raw_impact"]
        lo, hi = vals.quantile(0.01), vals.quantile(0.99)
        merged.loc[mask, "impact_score"] = ((vals - lo) / (hi - lo + 1e-9)).clip(0, 1) * 100

    merged["impact_score"] = merged["impact_score"].round(2)
    merged = merged.sort_values(["date", "match_id", "impact_score"], ascending=[True, True, False])

    out = PARSED / "player_impact_scores.csv"
    merged.to_csv(out, index=False)
    logger.success(f"  {len(merged):,} player-match impact scores → {out}")

    # Print a quick sanity check
    top5 = merged.nlargest(5, "impact_score")[["player", "date", "match_format",
                                                "impact_score", "runs", "wickets"]]
    print("\n  Top 5 Impact Scores in dataset:")
    print(top5.to_string(index=False))

    return merged


# ─── Entry Point ─────────────────────────────────────────────────────────────

def main() -> None:
    parser = argparse.ArgumentParser(description="Phase 2: Feature Engineering")
    parser.add_argument("--formats", nargs="+", default=None,
                        choices=["t20", "odi", "test"],
                        help="Restrict to specific formats (default: all).")
    args = parser.parse_args()

    df = load_deliveries(args.formats)

    print("\n" + "─" * 60)
    print("  FEATURE ENGINEERING")
    print("─" * 60)

    build_batting_profiles(df)
    build_bowling_profiles(df)
    build_venue_profiles(df)
    build_matchup_stats(df)
    build_opponent_profiles(df)
    build_impact_scores(df)

    print("\n" + "─" * 60)
    print("  OUTPUT FILES")
    print("─" * 60)
    for f in sorted(PARSED.glob("*.csv")):
        size_kb = f.stat().st_size // 1024
        print(f"  {f.name:45s}  {size_kb:>8} KB")
    print("─" * 60 + "\n")

    logger.success(
        "Phase 2 complete. All features are in data/parsed/.\n"
        "You are ready to proceed to Phase 3 (ML modelling)."
    )


if __name__ == "__main__":
    main()
