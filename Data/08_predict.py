"""
Phase 3 — Script 4 of 4
========================
End-to-End Prediction & Justification Engine
---------------------------------------------
The main entry point for the cricket analytics system.

Given:
  • An upcoming match context (venue, pitch type, two teams, format)
  • A list of available squad players (with roles)

This script:
  1. Loads the trained ensemble (XGBoost + RF)
  2. Retrieves each player's features from the Phase 2 CSVs
  3. Predicts an Impact Score for every player in the squad
  4. Feeds predictions into the ILP optimizer (07_optimizer.py)
  5. Generates human-readable justifications for every selected player
  6. Prints a final match report

Usage:
  python 08_predict.py \
    --team1-file p_ODI.txt \
    --team2-file p_AUSTRALIA.txt \
    --venue "Wankhede Stadium" \
    --pitch flat \
    --format odi

The script will load player lists from the specified files in the parent directory.
"""

# ══════════════════════════════════════════════════════════════════════════════
# CONFIGURATION — EDIT THESE VARIABLES TO SET YOUR MATCH CONTEXT
# ══════════════════════════════════════════════════════════════════════════════

# Match Format (choose one)
MATCH_FORMAT = "t20"      # Active format
# MATCH_FORMAT = "odi"    # Uncomment to use ODI
# MATCH_FORMAT = "test"   # Uncomment to use Test

# Teams (player list files)
TEAM1_FILE = "p_T20.txt"           # Your team's player list file
TEAM2_FILE = "p_AUSTRALIA.txt"     # Opponent team's player list file

# Other available opponent files:
# TEAM2_FILE = "p_ENGLAND.txt"
# TEAM2_FILE = "p_PAKISTAN.txt"
# TEAM2_FILE = "p_SOUTH_AFRICA.txt"
# TEAM2_FILE = "p_NEW_ZEALAND.txt"
# TEAM2_FILE = "p_SRI_LANKA.txt"
# TEAM2_FILE = "p_BANGLADESH.txt"
# TEAM2_FILE = "p_WEST_INDIES.txt"
# TEAM2_FILE = "p_ZIMBABWE.txt"
# TEAM2_FILE = "p_IRELAND.txt"

# Venue Information
VENUE = "Wankhede Stadium"
# VENUE = "Melbourne Cricket Ground"
# VENUE = "Lord's Cricket Ground"
# VENUE = "Eden Gardens"

# Pitch Type (choose one)
PITCH_TYPE = "flat"        # Active pitch type
# PITCH_TYPE = "spin"      # Spin-friendly pitch
# PITCH_TYPE = "seam"      # Seam-friendly pitch
# PITCH_TYPE = "pace"      # Pace-friendly pitch
# PITCH_TYPE = "balanced"  # Balanced pitch

# Team Names (for display purposes)
TEAM1_NAME = "India"
TEAM2_NAME = "Australia"

# Overseas Players (optional - list player names who are overseas/foreign)
OVERSEAS_PLAYERS = []
# OVERSEAS_PLAYERS = ["Player Name 1", "Player Name 2"]

# ══════════════════════════════════════════════════════════════════════════════

import argparse
import json
import pickle
import sys
from pathlib import Path
from typing import Optional, List, Dict, Set, List, Dict, Set

import numpy as np
import pandas as pd
from loguru import logger

sys.path.insert(0, str(Path(__file__).parent))
from config import PARSED_DIR, LOG_LEVEL

# Python doesn't allow importing from files starting with digits using normal import.
# We use importlib as a workaround.
import importlib.util as ilu

def _import_optimizer():
    spec = ilu.spec_from_file_location(
        "optimizer",
        Path(__file__).parent / "07_optimizer.py",
    )
    mod = ilu.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod

_opt = _import_optimizer()
PlayerCandidate          = _opt.PlayerCandidate
TeamConstraints          = _opt.TeamConstraints
TeamSelection            = _opt.TeamSelection
select_xi                = _opt.select_xi
display_xi               = _opt.display_xi
add_confidence_intervals = _opt.add_confidence_intervals
ROLE_ORDER               = _opt.ROLE_ORDER

logger.remove()
logger.add(sys.stderr, level=LOG_LEVEL,
           format="<green>{time:HH:mm:ss}</green> | <level>{level: <8}</level> | {message}")

PARSED    = Path(PARSED_DIR)
MODEL_DIR = Path(__file__).parent / "data" / "models"


# ─── Player List Loading ──────────────────────────────────────────────────────

def load_player_list(filename: str) -> List[str]:
    """
    Load player names from a text file.
    Each line should contain one player name.
    Skips empty lines and strips whitespace.
    """
    # Search for file in multiple locations:
    # 1. Parent directory
    # 2. Current directory's players/ subdirectory  
    # 3. Parent directory's players/ subdirectory
    # 4. Current directory
    
    search_paths = [
        Path(__file__).parent.parent / filename,                    # Parent dir
        Path(__file__).parent / "players" / filename,              # Current/players/
        Path(__file__).parent.parent / "players" / filename,       # Parent/players/
        Path(__file__).parent / filename,                           # Current dir
    ]
    
    file_path = None
    for path in search_paths:
        if path.exists():
            file_path = path
            break
    
    if not file_path:
        logger.error(f"Player list file not found: {filename}")
        logger.error(f"Searched in:")
        for path in search_paths:
            logger.error(f"  - {path}")
        sys.exit(1)
    
    players = []
    with open(file_path, 'r') as f:
        for line in f:
            player = line.strip()
            if player:  # Skip empty lines
                players.append(player)
    
    logger.info(f"Loaded {len(players)} players from {file_path.name}")
    return players


def extract_team_name(filename: str) -> str:
    """
    Extract team name from filename.
    Examples: p_T20.txt -> T20, p_AUSTRALIA.txt -> Australia
    """
    # Remove extension and p_ prefix
    name = filename.replace('.txt', '').replace('p_', '')
    
    # Convert underscores to spaces and title case
    name = name.replace('_', ' ').title()
    
    # Handle special cases
    if name == 'T20' or name == 'Odi' or name == 'Test':
        return 'India'  # Assume these are Indian team formats
    
    return name


# ─── Model Loading ────────────────────────────────────────────────────────────

def load_models() -> tuple:
    """Load trained pipelines and ensemble weights from disk."""
    for fname in ("xgb_model.pkl", "rf_model.pkl", "ensemble_weights.json"):
        if not (MODEL_DIR / fname).exists():
            logger.error(f"Missing {fname}. Run 06_train_models.py first.")
            sys.exit(1)

    with open(MODEL_DIR / "xgb_model.pkl", "rb") as f:
        xgb_pipe = pickle.load(f)
    with open(MODEL_DIR / "rf_model.pkl", "rb") as f:
        rf_pipe = pickle.load(f)
    with open(MODEL_DIR / "ensemble_weights.json") as f:
        meta = json.load(f)

    xgb_w       = meta["xgb"]
    rf_w        = meta["rf"]
    feature_cols = meta["feature_cols"]

    logger.info(f"Models loaded. Ensemble: XGB×{xgb_w:.2f} + RF×{rf_w:.2f}")
    return xgb_pipe, rf_pipe, xgb_w, rf_w, feature_cols


# ─── Feature Retrieval ────────────────────────────────────────────────────────

def load_profiles() -> Dict[str, pd.DataFrame]:
    """Load all Phase 2 player/venue CSVs into memory once."""
    files = {
        "batting":   "player_batting_profiles.csv",
        "bowling":   "player_bowling_profiles.csv",
        "venues":    "venue_profiles.csv",
        "matchups":  "matchup_stats.csv",
        "opponents": "opponent_profiles.csv",
        "roles":     "player_impact_scores.csv",   # to infer role distribution
    }
    profiles = {}
    for key, fname in files.items():
        path = PARSED / fname
        if path.exists():
            profiles[key] = pd.read_csv(path, low_memory=False)
        else:
            logger.warning(f"Profile file not found: {fname}")
            profiles[key] = pd.DataFrame()
    return profiles


def get_player_role(player: str, match_format: str, profiles: dict) -> str:
    """
    Infer a player's role from their career profile:
      - Has bowling profile + enough wickets → BOWL or ALL
      - Has batting profile only → BAT
      - Name contains known WK keywords → WK
    """
    WK_KEYWORDS = ["dhoni", "pant", "karthik", "buttler", "de kock", "bairstow", "rahul"]

    if any(kw in player.lower() for kw in WK_KEYWORDS):
        return "WK"

    has_bowl = False
    if not profiles["bowling"].empty:
        bowl_row = profiles["bowling"][
            (profiles["bowling"]["player"] == player) &
            (profiles["bowling"]["match_format"] == match_format)
        ]
        has_bowl = not bowl_row.empty

    has_bat = False
    if not profiles["batting"].empty:
        bat_row = profiles["batting"][
            (profiles["batting"]["player"] == player) &
            (profiles["batting"]["match_format"] == match_format)
        ]
        has_bat = not bat_row.empty

    if has_bat and has_bowl:
        return "ALL"
    elif has_bowl:
        return "BOWL"
    return "BAT"


def build_player_feature_row(
    player:        str,
    match_format:  str,
    venue:         str,
    pitch_type:    str,
    profiles:      dict,
    feature_cols:  List[str],
    opponent_team: Optional[str] = None,
) -> dict:
    """
    Assemble the feature vector for a single player in the upcoming match context.
    Missing values are filled with format-level medians (same logic as Phase 2 imputation).
    """
    row = {col: np.nan for col in feature_cols}

    # ── Batting features ──────────────────────────────────────────────────────
    if not profiles["batting"].empty:
        bat = profiles["batting"][
            (profiles["batting"]["player"] == player) &
            (profiles["batting"]["match_format"] == match_format)
        ]
        if not bat.empty:
            b = bat.iloc[0]
            row["career_avg_bat"]   = b.get("career_avg", np.nan)
            row["career_sr"]        = b.get("career_sr",  np.nan)
            row["form_avg_short"]   = b.get("form_avg_short", np.nan)
            row["form_sr_short"]    = b.get("form_sr_short",  np.nan)
            row["form_avg_long"]    = b.get("form_avg_long",  np.nan)
            row["form_sr_long"]     = b.get("form_sr_long",   np.nan)
            row["weighted_avg_bat"] = b.get("weighted_avg",   np.nan)
            row["weighted_sr"]      = b.get("weighted_sr",    np.nan)
            pitch_col = f"sr_on_{pitch_type.lower()}"
            row["batter_sr_this_pitch"] = b.get(pitch_col, np.nan)

    # ── Bowling features ──────────────────────────────────────────────────────
    if not profiles["bowling"].empty:
        bowl = profiles["bowling"][
            (profiles["bowling"]["player"] == player) &
            (profiles["bowling"]["match_format"] == match_format)
        ]
        if not bowl.empty:
            bw = bowl.iloc[0]
            row["career_wickets"]    = bw.get("career_wickets",  np.nan)
            row["career_avg_bowl"]   = bw.get("career_avg",      np.nan)
            row["career_economy"]    = bw.get("career_economy",  np.nan)
            row["form_eco_short"]    = bw.get("form_eco_short",  np.nan)
            row["form_eco_long"]     = bw.get("form_eco_long",   np.nan)
            row["weighted_avg_bowl"] = bw.get("weighted_avg",    np.nan)
            row["weighted_economy"]  = bw.get("weighted_economy",np.nan)
            pitch_col = f"eco_on_{pitch_type.lower()}"
            row["bowler_eco_this_pitch"] = bw.get(pitch_col, np.nan)

    # ── Venue features ────────────────────────────────────────────────────────
    if not profiles["venues"].empty:
        ven = profiles["venues"][
            (profiles["venues"]["venue"] == venue) &
            (profiles["venues"]["match_format"] == match_format)
        ]
        if not ven.empty:
            row["avg_first_innings_score"] = ven.iloc[0].get("avg_first_innings_score", np.nan)

    # ── Matchup features (aggregate over all known opponents) ─────────────────
    if not profiles["matchups"].empty:
        bat_mu = profiles["matchups"][
            (profiles["matchups"]["batter"] == player) &
            (profiles["matchups"]["match_format"] == match_format)
        ]
        if not bat_mu.empty:
            row["matchup_avg_sr"]          = bat_mu["strike_rate"].mean()
            row["matchup_avg_dismissal_rt"] = bat_mu["dismissal_rate"].mean()

        bowl_mu = profiles["matchups"][
            (profiles["matchups"]["bowler"] == player) &
            (profiles["matchups"]["match_format"] == match_format)
        ]
        if not bowl_mu.empty:
            row["matchup_bowl_avg_sr_conceded"] = bowl_mu["strike_rate"].mean()
            row["matchup_bowl_avg_dismiss_rt"]  = bowl_mu["dismissal_rate"].mean()

    # ── Opponent-specific features ────────────────────────────────────────────
    if opponent_team and not profiles["opponents"].empty:
        opp = profiles["opponents"][
            (profiles["opponents"]["player"] == player) &
            (profiles["opponents"]["match_format"] == match_format) &
            (profiles["opponents"]["opponent_team"] == opponent_team)
        ]
        if not opp.empty:
            o = opp.iloc[0]
            row["vs_opp_bat_avg"]      = o.get("vs_opp_bat_avg", np.nan)
            row["vs_opp_bat_sr"]       = o.get("vs_opp_bat_sr", np.nan)
            row["vs_opp_bowl_economy"] = o.get("vs_opp_bowl_economy", np.nan)
            row["vs_opp_bowl_avg"]     = o.get("vs_opp_bowl_avg", np.nan)
    
    # Set opponent difficulty as a placeholder (would be calculated from recent team performance)
    # For prediction, we can use a default value or compute from match_results
    row["opponent_difficulty"] = 0.5   # neutral difficulty by default

    # ── Categorical encodings (simple integer maps matching training) ──────────
    FORMAT_ENC  = {"t20": 2, "odi": 1, "test": 0}
    PITCH_ENC   = {"flat": 1, "spin": 4, "seam": 3, "pace": 2, "balanced": 0}
    ROLE_ENC    = {"BAT": 0, "BOWL": 1, "ALL": 2, "WK": 3}

    role = get_player_role(player, match_format, profiles)
    row["match_format_enc"] = FORMAT_ENC.get(match_format, 2)
    row["pitch_type_enc"]   = PITCH_ENC.get(pitch_type.lower(), 0)
    row["role_enc"]         = ROLE_ENC.get(role, 0)
    row["batting_first"]    = 0   # unknown at prediction time

    # Fill NaN feature values with 0 (median-imputed during training)
    for col in feature_cols:
        if col not in row or (isinstance(row[col], float) and np.isnan(row[col])):
            row[col] = 0.0

    return row, role


# ─── Prediction ───────────────────────────────────────────────────────────────

def predict_squad(
    squad_names:  List[str],
    format_str:   str,
    venue:        str,
    pitch_type:   str,
    xgb_pipe,
    rf_pipe,
    xgb_w:        float,
    rf_w:         float,
    feature_cols: List[str],
    profiles:     dict,
    team1:        Optional[str] = None,
    team2:        Optional[str] = None,
    overseas_players: Optional[Set[str]] = None,
) -> List[PlayerCandidate]:
    """
    Runs the ensemble model over every player in the squad and returns
    a list of PlayerCandidate objects with predicted scores and context stats.
    
    If team1 and team2 are provided, will look up opponent-specific stats
    for each player (assuming squad plays for team1 vs team2).
    """
    if overseas_players is None:
        overseas_players = set()

    # Determine opponent team for squad (assume squad is from team1)
    opponent_team = team2 if (team1 and team2) else None

    rows   = []
    roles  = []
    for name in squad_names:
        row, role = build_player_feature_row(
            name, format_str, venue, pitch_type, profiles, feature_cols,
            opponent_team=opponent_team
        )
        rows.append(row)
        roles.append(role)

    X  = pd.DataFrame(rows)[feature_cols].fillna(0)
    xgb_scores = xgb_pipe.predict(X)
    rf_scores  = rf_pipe.predict(X)
    ens_scores = xgb_w * xgb_scores + rf_w * rf_scores
    ens_scores = np.clip(ens_scores, 0, 100)

    candidates = []
    for i, name in enumerate(squad_names):
        c = PlayerCandidate(
            name            = name,
            role            = roles[i],
            predicted_score = float(ens_scores[i]),
            is_overseas     = name in overseas_players,
            context_stats   = rows[i],
        )
        candidates.append(c)

    return candidates


# ─── Justification Generation ─────────────────────────────────────────────────

def generate_justification(player: PlayerCandidate, venue: str,
                            pitch_type: str, match_format: str) -> str:
    """
    Algorithmic logic layer: explains WHY a player was selected.
    Builds a sentence from the top 2-3 most influential stats.
    """
    stats = player.context_stats
    reasons = []

    # ── Batting reasons ───────────────────────────────────────────────────────
    if player.role in ("BAT", "WK", "ALL"):
        sr  = stats.get("career_sr", 0) or 0
        avg = stats.get("career_avg_bat", 0) or 0
        form_sr = stats.get("form_sr_short", 0) or 0

        pitch_sr_col = f"sr_on_{pitch_type.lower()}"
        pitch_sr = stats.get("batter_sr_this_pitch", 0) or 0

        if form_sr > sr * 1.10 and form_sr > 0:
            reasons.append(
                f"excellent recent batting form (SR {form_sr:.0f} in last 5 innings, "
                f"vs career {sr:.0f})"
            )
        elif sr > 0:
            reasons.append(f"career strike rate of {sr:.0f} in {match_format.upper()}")

        if avg > 0:
            reasons.append(f"batting average of {avg:.1f}")

        if pitch_sr > sr * 1.10 and pitch_sr > 0:
            reasons.append(
                f"strong record on {pitch_type} pitches (SR {pitch_sr:.0f})"
            )

    # ── Bowling reasons ───────────────────────────────────────────────────────
    if player.role in ("BOWL", "ALL"):
        eco   = stats.get("career_economy", 0) or 0
        wkts  = stats.get("career_wickets", 0) or 0
        f_eco = stats.get("form_eco_short", 0) or 0
        p_eco = stats.get("bowler_eco_this_pitch", 0) or 0

        format_avg_eco = {"t20": 8.0, "odi": 5.5, "test": 3.0}.get(match_format, 8.0)

        if f_eco > 0 and f_eco < eco * 0.90:
            reasons.append(
                f"improving bowling economy (recent {f_eco:.1f} vs career {eco:.1f})"
            )
        elif eco > 0:
            reasons.append(f"career economy of {eco:.1f}")

        if p_eco > 0 and p_eco < format_avg_eco:
            reasons.append(
                f"effective on {pitch_type} pitches (economy {p_eco:.1f})"
            )

        if wkts > 0:
            reasons.append(f"{int(wkts)} career wickets in {match_format.upper()}")

    # ── Venue reasons ─────────────────────────────────────────────────────────
    venue_score = stats.get("avg_first_innings_score", 0) or 0
    if venue_score > 0 and player.role in ("BAT", "WK", "ALL"):
        reasons.append(f"venue average of {venue_score:.0f} at {venue} favours batters")

    # ── WK reasons ────────────────────────────────────────────────────────────
    if player.role == "WK":
        reasons.append("provides wicket-keeping cover")

    if not reasons:
        reasons.append(f"highest predicted impact score ({player.predicted_score:.1f}) in their role")

    # Build sentence
    if len(reasons) == 1:
        justification = f"Selected due to {reasons[0]}."
    elif len(reasons) == 2:
        justification = f"Selected due to {reasons[0]} and {reasons[1]}."
    else:
        justification = f"Selected due to {reasons[0]}, {reasons[1]}, and {reasons[2]}."

    return justification


# ─── Report Printing ──────────────────────────────────────────────────────────

def print_full_report(
    selection:    "TeamSelection",
    candidates:   List[PlayerCandidate],
    context:      dict,
) -> None:
    players = sorted(selection.players,
                     key=lambda c: (ROLE_ORDER.get(c.role, 9), -c.predicted_score))

    print("\n" + "=" * 70)
    print("  CRICKET ANALYTICS ENGINE — MATCH PREDICTION REPORT")
    print("=" * 70)
    print(f"  Teams   : {context['team1']}  vs  {context['team2']}")
    print(f"  Venue   : {context['venue']}  ({context['pitch_type']} pitch)")
    print(f"  Format  : {context['match_format'].upper()}")
    print(f"  Status  : {selection.status}   Total Predicted Impact: {selection.total_score:.1f}")
    print("─" * 70)

    print(f"\n  {'#':>2}  {'Player':30s}  {'Role':6s}  {'Score':>6}  {'CI':>18}")
    print("─" * 70)
    for i, p in enumerate(players, 1):
        ci = f"[{p.confidence_lo:5.1f} – {p.confidence_hi:5.1f}]"
        print(f"  {i:>2}  {p.name:30s}  {p.role:6s}  {p.predicted_score:>6.1f}  {ci:>18}")

    print("\n" + "─" * 70)
    print("  JUSTIFICATIONS")
    print("─" * 70)
    for p in players:
        just = generate_justification(p, context["venue"],
                                      context["pitch_type"], context["match_format"])
        print(f"\n  {p.name} ({p.role}):")
        print(f"    {just}")

    print("\n" + "─" * 70)
    print("  FULL SQUAD RANKINGS (all players, sorted by predicted impact)")
    print("─" * 70)
    all_sorted = sorted(candidates, key=lambda c: c.predicted_score, reverse=True)
    selected_names = {p.name for p in selection.players}
    for rank, p in enumerate(all_sorted, 1):
        tag = "✓ XI" if p.name in selected_names else "    "
        print(f"  {rank:>2}  {tag}  {p.name:30s}  {p.role:6s}  {p.predicted_score:>6.1f}")

    print("\n" + "=" * 70 + "\n")


# ─── Entry Point ─────────────────────────────────────────────────────────────

def main() -> None:
    parser = argparse.ArgumentParser(description="Predict Playing XI for a match")
    
    # File-based input (new default mode)
    parser.add_argument("--team1-file", default=None,
                        help="Path to Team 1 player list file (e.g., p_T20.txt)")
    parser.add_argument("--team2-file", default=None,
                        help="Path to Team 2 player list file (e.g., p_AUSTRALIA.txt)")
    
    # Legacy arguments (still supported)
    parser.add_argument("--team1",   default=None, help="Team 1 name (legacy)")
    parser.add_argument("--team2",   default=None, help="Team 2 name (legacy)")
    parser.add_argument("--venue",   default=None, help="Venue name")
    parser.add_argument("--pitch",   default=None,
                        choices=["flat", "spin", "seam", "pace", "balanced"],
                        help="Pitch type")
    parser.add_argument("--format",  default=None,
                        choices=["t20", "odi", "test"],
                        help="Match format")
    parser.add_argument("--squad",   default=None,
                        help="Comma-separated player names (legacy)")
    parser.add_argument("--overseas", default="",
                        help="Comma-separated overseas player names")
    
    args = parser.parse_args()

    # Use configuration constants if args not provided
    team1_file = args.team1_file or TEAM1_FILE
    team2_file = args.team2_file or TEAM2_FILE
    venue = args.venue or VENUE
    pitch_type = args.pitch or PITCH_TYPE
    match_format = args.format or MATCH_FORMAT
    
    # Load player lists from files
    logger.info("Loading player lists from files...")
    team1_squad = load_player_list(team1_file)
    team2_squad = load_player_list(team2_file)
    
    # Extract team names from filenames or use configured names
    team1_name = args.team1 or TEAM1_NAME or extract_team_name(team1_file)
    team2_name = args.team2 or TEAM2_NAME or extract_team_name(team2_file)
    
    # Parse overseas players
    if args.overseas:
        overseas_set = set(s.strip() for s in args.overseas.split(",") if s.strip())
    else:
        overseas_set = set(OVERSEAS_PLAYERS)
    
    # Build context
    ctx = {
        "team1":        team1_name,
        "team2":        team2_name,
        "venue":        venue,
        "pitch_type":   pitch_type,
        "match_format": match_format,
        "squad":        team1_squad,  # Team 1 is the squad we're selecting
        "overseas":     list(overseas_set),
    }
    
    logger.info(f"Match: {ctx['team1']} vs {ctx['team2']}")
    logger.info(f"Venue: {ctx['venue']} ({ctx['pitch_type']} pitch)")
    logger.info(f"Format: {ctx['match_format'].upper()}")
    logger.info(f"Squad size: {len(ctx['squad'])} players")

    xgb_pipe, rf_pipe, xgb_w, rf_w, feature_cols = load_models()
    profiles = load_profiles()

    logger.info(f"Predicting for squad of {len(ctx['squad'])} players …")
    candidates = predict_squad(
        squad_names  = ctx["squad"],
        format_str   = ctx["match_format"],
        venue        = ctx["venue"],
        pitch_type   = ctx["pitch_type"],
        xgb_pipe     = xgb_pipe,
        rf_pipe      = rf_pipe,
        xgb_w        = xgb_w,
        rf_w         = rf_w,
        feature_cols = feature_cols,
        profiles     = profiles,
        team1        = ctx.get("team1"),
        team2        = ctx.get("team2"),
        overseas_players = set(ctx.get("overseas", [])),
    )

    candidates = add_confidence_intervals(candidates)

    constraints = TeamConstraints()
    selection   = select_xi(candidates, constraints)

    print_full_report(selection, candidates, ctx)


if __name__ == "__main__":
    main()