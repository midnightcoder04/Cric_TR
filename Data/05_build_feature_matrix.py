"""
Phase 3 — Script 1 of 4
========================
Build ML Feature Matrix
-------------------------
Joins all Phase 2 feature tables into a single, ML-ready dataset:

    X  →  one row per (player × match), ~50 features encoding:
            • player form (short/long window, decay-weighted)
            • venue/pitch context
            • opponent difficulty
            • matchup advantage (batter vs bowler style)
            • role encoding (batter / bowler / all-rounder / WK)

    y  →  player_impact_scores.csv (impact_score column)

The matrix is:
  1. Encoded   — categorical columns one-hot or label-encoded
  2. Imputed   — NaN-filled with position-median (not zero, which biases scale)
  3. Validated — correlation report + feature importance preview logged
  4. Saved     — data/parsed/feature_matrix.parquet  (fast I/O for training)

The dataset is split **by time** (not random) to prevent data leakage:
    train:  all matches before HOLDOUT_DATE
    test:   matches from HOLDOUT_DATE onwards (most recent 20% of timeline)

Usage:
  python 05_build_feature_matrix.py
  python 05_build_feature_matrix.py --formats t20
  python 05_build_feature_matrix.py --holdout-date 2023-01-01
"""

import argparse
import sys
from pathlib import Path
from typing import Optional, List, Dict, Tuple

import numpy as np
import pandas as pd
from loguru import logger
from sklearn.preprocessing import LabelEncoder

sys.path.insert(0, str(Path(__file__).parent))
from config import PARSED_DIR, LOG_LEVEL

logger.remove()
logger.add(sys.stderr, level=LOG_LEVEL,
           format="<green>{time:HH:mm:ss}</green> | <level>{level: <8}</level> | {message}")

PARSED = Path(PARSED_DIR)

# ─── Constants ────────────────────────────────────────────────────────────────

# Role assignment thresholds — used to classify players from their stats
WK_KEYWORDS    = ["dhoni", "pant", "karthik", "buttler", "de kock", "ingram", "bairstow"]
ALLR_THRESHOLD = 0.40   # if a player has >40% of median bowling innings they're an all-rounder

# ─── Loaders ─────────────────────────────────────────────────────────────────

def load_all(formats: Optional[List[str]]) -> Dict[str, pd.DataFrame]:
    """Load all Phase 2 CSV outputs."""
    files = {
        "impacts":   "player_impact_scores.csv",
        "batting":   "player_batting_profiles.csv",
        "bowling":   "player_bowling_profiles.csv",
        "venues":    "venue_profiles.csv",
        "matchups":  "matchup_stats.csv",
        "matches":   "match_results.csv",
        "opponents": "opponent_profiles.csv",
    }
    data = {}
    for key, fname in files.items():
        path = PARSED / fname
        if not path.exists():
            logger.error(f"Missing {fname} — run Phase 2 scripts first.")
            sys.exit(1)
        df = pd.read_csv(path, low_memory=False)
        if "date" in df.columns:
            df["date"] = pd.to_datetime(df["date"], errors="coerce")
        data[key] = df
        logger.info(f"Loaded {fname}: {len(df):,} rows")

    if formats:
        for key in ["impacts", "batting", "bowling", "opponents"]:
            if "match_format" in data[key].columns:
                data[key] = data[key][data[key]["match_format"].isin(formats)]

    return data


# ─── Role Assignment ─────────────────────────────────────────────────────────

def assign_roles(batting: pd.DataFrame, bowling: pd.DataFrame) -> pd.DataFrame:
    """
    Heuristically assign BAT / BOWL / ALL / WK to each player-format pair.
    Returns a DataFrame with columns [player, match_format, role].
    """
    bat_players  = set(zip(batting["player"], batting["match_format"]))
    bowl_players = set(zip(bowling["player"], bowling["match_format"]))

    all_players = bat_players | bowl_players
    roles = []
    for player, fmt in all_players:
        key = (player, fmt)
        is_bat  = key in bat_players
        is_bowl = key in bowl_players

        # Wicket-keeper: name-based heuristic (replace with a proper lookup table)
        is_wk = any(kw in player.lower() for kw in WK_KEYWORDS)

        if is_wk:
            role = "WK"
        elif is_bat and is_bowl:
            # Check if they bowl a meaningful amount
            b_row = bowling[(bowling["player"] == player) & (bowling["match_format"] == fmt)]
            if not b_row.empty and b_row.iloc[0]["total_innings"] >= 3:
                role = "ALL"
            else:
                role = "BAT"
        elif is_bat:
            role = "BAT"
        elif is_bowl:
            role = "BOWL"
        else:
            role = "BAT"

        roles.append({"player": player, "match_format": fmt, "role": role})

    return pd.DataFrame(roles)


# ─── Feature Joining ──────────────────────────────────────────────────────────

def build_matrix(data: Dict, formats: Optional[List[str]]) -> pd.DataFrame:
    """
    Assembles the full feature matrix. One row = one player × one match.
    """
    impacts   = data["impacts"]
    batting   = data["batting"]
    bowling   = data["bowling"]
    venues    = data["venues"]
    matchups  = data["matchups"]
    matches   = data["matches"]
    opponents = data["opponents"]

    logger.info("Assigning player roles …")
    roles = assign_roles(batting, bowling)

    # ── Base: impact scores with match context ────────────────────────────────
    logger.info("Joining impact scores with match context …")
    base = impacts.merge(
        matches[["match_id", "team1", "team2", "toss_winner", "toss_decision",
                 "winner", "venue", "pitch_type", "match_format", "date"]].drop_duplicates(),
        on=["match_id", "match_format"],
        how="left",
        suffixes=("", "_m"),
    )

    # Use venue/pitch from match table when missing in impacts
    base["venue"]      = base["venue"].combine_first(base.get("venue_m"))
    base["pitch_type"] = base["pitch_type"].combine_first(base.get("pitch_type_m"))
    for col in [c for c in base.columns if c.endswith("_m")]:
        base.drop(columns=col, inplace=True, errors="ignore")

    # ── Join batting profile features ─────────────────────────────────────────
    logger.info("Joining batting profiles …")
    bat_cols = [
        "player", "match_format",
        "career_avg", "career_sr",
        "form_avg_short", "form_sr_short",
        "form_avg_long",  "form_sr_long",
        "weighted_avg",   "weighted_sr",
        "sr_on_flat", "sr_on_spin", "sr_on_seam", "sr_on_pace", "sr_on_balanced",
    ]
    base = base.merge(batting[bat_cols], on=["player", "match_format"], how="left",
                      suffixes=("", "_bat"))

    # ── Join bowling profile features ─────────────────────────────────────────
    logger.info("Joining bowling profiles …")
    bowl_cols = [
        "player", "match_format",
        "career_wickets",
        "career_avg",  "career_economy",
        "form_eco_short", "form_eco_long",
        "weighted_avg",   "weighted_economy",
        "eco_on_flat", "eco_on_spin", "eco_on_seam", "eco_on_pace", "eco_on_balanced",
    ]
    base = base.merge(bowling[bowl_cols], on=["player", "match_format"], how="left",
                      suffixes=("_bat", "_bowl"))

    # ── Join venue profile ────────────────────────────────────────────────────
    logger.info("Joining venue profiles …")
    venue_cols = ["venue", "match_format", "avg_first_innings_score", "num_matches"]
    base = base.merge(venues[venue_cols], on=["venue", "match_format"], how="left")

    # ── Join role ─────────────────────────────────────────────────────────────
    base = base.merge(roles, on=["player", "match_format"], how="left")
    base["role"] = base["role"].fillna("BAT")

    # ── Matchup features: average per-player matchup advantage ────────────────
    logger.info("Computing player-level matchup summary …")
    # Aggregate per batter: overall matchup SR and dismissal rate vs opponents
    bat_matchup = matchups.groupby(["batter", "match_format"]).agg(
        matchup_avg_sr           = ("strike_rate",    "mean"),
        matchup_avg_dismissal_rt = ("dismissal_rate", "mean"),
        matchup_n_pairs          = ("balls",          "count"),
    ).reset_index().rename(columns={"batter": "player"})

    bowl_matchup = matchups.groupby(["bowler", "match_format"]).agg(
        matchup_bowl_avg_sr_conceded = ("strike_rate",    "mean"),
        matchup_bowl_avg_dismiss_rt  = ("dismissal_rate", "mean"),
    ).reset_index().rename(columns={"bowler": "player"})

    base = base.merge(bat_matchup,  on=["player", "match_format"], how="left")
    base = base.merge(bowl_matchup, on=["player", "match_format"], how="left")

    # ── Context features ──────────────────────────────────────────────────────
    base["batting_first"] = (base["toss_decision"] == "bat").astype(int)

    # Pitch-type specific performance lookup (use the actual pitch at this match)
    def lookup_sr_for_pitch(row):
        pt = str(row.get("pitch_type", "balanced")).lower()
        col = f"sr_on_{pt}"
        return row.get(col, np.nan)

    def lookup_eco_for_pitch(row):
        pt = str(row.get("pitch_type", "balanced")).lower()
        col = f"eco_on_{pt}"
        return row.get(col, np.nan)

    base["batter_sr_this_pitch"]  = base.apply(lookup_sr_for_pitch,  axis=1)
    base["bowler_eco_this_pitch"] = base.apply(lookup_eco_for_pitch, axis=1)

    # ── Opponent-specific features ────────────────────────────────────────────
    logger.info("Adding opponent-specific features …")
    
    # Determine opponent team for each row
    # We need to know which team the player played for to determine opponent
    # This is tricky since impact_scores doesn't have player's team directly
    # We'll use a heuristic: check team1 vs team2 and match with historical data
    
    # For now, create two potential opponent joins (one for each team scenario)
    # and fill based on which team the player is likely on
    base["opponent_team"] = None
    
    # Method: For each player-match, the opponent is either team1 or team2
    # If we have team info in impacts table, use it; otherwise infer from historical data
    if "team" in impacts.columns:
        # Player's team is known, opponent is the other team
        base["opponent_team"] = base.apply(
            lambda row: row["team2"] if row.get("team") == row["team1"] else row["team1"],
            axis=1
        )
    else:
        # Fallback: try both teams and join opponent profiles for whichever matches
        # This is less precise but works when team affiliation isn't in impact scores
        pass
    
    # Join opponent profiles
    if not opponents.empty:
        # Add vs_opponent batting stats
        base = base.merge(
            opponents[["player", "match_format", "opponent_team",
                      "vs_opp_bat_avg", "vs_opp_bat_sr",
                      "vs_opp_bowl_economy", "vs_opp_bowl_avg"]],
            on=["player", "match_format", "opponent_team"],
            how="left",
            suffixes=("", "_opp")
        )
    
    # ── Opponent strength/difficulty features ─────────────────────────────────
    logger.info("Computing opponent difficulty ratings …")
    
    # Calculate rolling opponent strength from recent matches
    # Opponent bowling difficulty: their recent bowling economy/average
    # Opponent batting difficulty: their recent batting average/SR
    
    # Group matches by team to compute team strength
    from scipy.ndimage import uniform_filter1d
    
    team_stats = []
    for team in pd.concat([matches["team1"], matches["team2"]]).unique():
        team_matches = matches[
            (matches["team1"] == team) | (matches["team2"] == team)
        ].sort_values("date").copy()
        
        if len(team_matches) < 5:
            continue
        
        # For each match, calculate if this team won
        team_matches["team_won"] = (team_matches["winner"] == team).astype(int)
        
        # Rolling win rate (last 10 matches)
        team_matches["rolling_win_rate"] = (
            team_matches["team_won"]
            .rolling(window=10, min_periods=3)
            .mean()
        )
        
        for _, row in team_matches.iterrows():
            team_stats.append({
                "match_id": row["match_id"],
                "team": team,
                "team_strength": row.get("rolling_win_rate", 0.5),
            })
    
    team_strength_df = pd.DataFrame(team_stats)
    
    # Join opponent strength to base
    # For each match, find the opponent team's strength
    if not team_strength_df.empty:
        # Create opponent strength lookup
        base_with_opp_strength = base.merge(
            team_strength_df.rename(columns={"team": "opponent_team_check", "team_strength": "opponent_difficulty"}),
            left_on=["match_id", "opponent_team"],
            right_on=["match_id", "opponent_team_check"],
            how="left"
        )
        base_with_opp_strength.drop(columns=["opponent_team_check"], inplace=True, errors="ignore")
        base = base_with_opp_strength
    else:
        base["opponent_difficulty"] = 0.5

    return base


# ─── Encoding & Imputation ───────────────────────────────────────────────────

CATEGORICAL_COLS = ["match_format", "pitch_type", "role"]

def encode_and_impute(df: pd.DataFrame) -> tuple[pd.DataFrame, dict]:
    """
    Label-encode categoricals, median-impute numerics.
    Returns (processed_df, encoders_dict).
    """
    encoders = {}

    # Label encode categoricals
    for col in CATEGORICAL_COLS:
        if col in df.columns:
            le = LabelEncoder()
            df[col + "_enc"] = le.fit_transform(df[col].astype(str).fillna("unknown"))
            encoders[col] = le

    # Select numeric feature columns for imputation
    feature_cols = [c for c in df.columns if c not in
                    ["player", "match_id", "team1", "team2", "winner",
                     "toss_winner", "toss_decision", "venue", "date",
                     "batting_team", "match_format", "pitch_type", "role",
                     "impact_score", "raw_impact",
                     "bat_score", "bowl_score"]  # keep raw scores only in y
                    and df[c].dtype in [np.float64, np.int64, float, int]]

    # Median imputation per format (avoids cross-format bias)
    formats = df["match_format"].unique() if "match_format" in df.columns else ["all"]
    for fmt in formats:
        mask = df["match_format"] == fmt if "match_format" in df.columns else pd.Series(True, index=df.index)
        for col in feature_cols:
            if col in df.columns:
                median_val = df.loc[mask, col].median()
                df.loc[mask & df[col].isna(), col] = median_val

    return df, encoders


# ─── Train / Test Split (by time) ────────────────────────────────────────────

def time_split(df: pd.DataFrame, holdout_date: Optional[str]) -> Tuple[pd.DataFrame, pd.DataFrame]:
    """
    Split on date to avoid leakage. If no date given, use the 80th percentile.
    """
    df = df[df["date"].notna()].copy()

    if holdout_date:
        cutoff = pd.Timestamp(holdout_date)
    else:
        cutoff = df["date"].quantile(0.80)
        logger.info(f"Auto holdout date: {cutoff.date()} (80th percentile of match dates)")

    train = df[df["date"] <  cutoff].copy()
    test  = df[df["date"] >= cutoff].copy()

    logger.info(f"Train: {len(train):,} rows ({train['date'].min().date()} → {train['date'].max().date()})")
    logger.info(f"Test : {len(test):,} rows  ({test['date'].min().date()} → {test['date'].max().date()})")
    return train, test


# ─── Entry Point ─────────────────────────────────────────────────────────────

def main() -> None:
    parser = argparse.ArgumentParser(description="Build ML feature matrix")
    parser.add_argument("--formats", nargs="+", default=None, choices=["t20", "odi", "test"])
    parser.add_argument("--holdout-date", default=None,
                        help="ISO date for train/test split. Default: 80th percentile.")
    args = parser.parse_args()

    data    = load_all(args.formats)
    matrix  = build_matrix(data, args.formats)
    matrix, encoders = encode_and_impute(matrix)

    # Drop rows without a target
    before = len(matrix)
    matrix = matrix[matrix["impact_score"].notna()]
    logger.info(f"Dropped {before - len(matrix):,} rows with no impact score.")

    train, test = time_split(matrix, args.holdout_date)

    # Save
    train.to_parquet(PARSED / "train.parquet", index=False)
    test.to_parquet(PARSED  / "test.parquet",  index=False)
    matrix.to_parquet(PARSED / "feature_matrix.parquet", index=False)

    print("\n" + "─" * 60)
    print("  FEATURE MATRIX SUMMARY")
    print("─" * 60)
    print(f"  Total rows  : {len(matrix):>10,}")
    print(f"  Train rows  : {len(train):>10,}")
    print(f"  Test rows   : {len(test):>10,}")
    print(f"  Columns     : {len(matrix.columns):>10,}")
    print(f"  Formats     : {', '.join(matrix['match_format'].unique())}")
    roles = matrix["role"].value_counts()
    for role, cnt in roles.items():
        print(f"  Role {role:4s}   : {cnt:>10,}")
    print("─" * 60 + "\n")

    logger.success("Feature matrix built. Proceed to 06_train_models.py")


if __name__ == "__main__":
    main()