"""
Prediction engine — wraps the existing XGBoost/RF ensemble from Data/.
Loads models once at startup and exposes a predict() function.
"""
import json
import pickle
import sys
import importlib.util
from pathlib import Path
from typing import List, Optional, Set, Dict

import numpy as np
import pandas as pd

DATA_DIR = Path(__file__).parent.parent / "Data"
PARSED_DIR = DATA_DIR / "data" / "parsed"
MODEL_DIR = DATA_DIR / "data" / "models"
PLAYERS_DIR = DATA_DIR / "players"

# Add Data dir to path so config.py is importable
sys.path.insert(0, str(DATA_DIR))


def _import_optimizer():
    spec = importlib.util.spec_from_file_location(
        "optimizer", DATA_DIR / "07_optimizer.py"
    )
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


_opt = _import_optimizer()
PlayerCandidate = _opt.PlayerCandidate
TeamConstraints = _opt.TeamConstraints
select_xi = _opt.select_xi
add_confidence_intervals = _opt.add_confidence_intervals
ROLE_ORDER = _opt.ROLE_ORDER

# ── Module-level singletons ──────────────────────────────────────────────────
_xgb_pipe = None
_rf_pipe = None
_xgb_w = None
_rf_w = None
_feature_cols = None
_profiles: Dict[str, pd.DataFrame] = {}


def _load_models():
    global _xgb_pipe, _rf_pipe, _xgb_w, _rf_w, _feature_cols
    with open(MODEL_DIR / "xgb_model.pkl", "rb") as f:
        _xgb_pipe = pickle.load(f)
    with open(MODEL_DIR / "rf_model.pkl", "rb") as f:
        _rf_pipe = pickle.load(f)
    with open(MODEL_DIR / "ensemble_weights.json") as f:
        meta = json.load(f)
    _xgb_w = meta["xgb"]
    _rf_w = meta["rf"]
    _feature_cols = meta["feature_cols"]


def _load_profiles():
    global _profiles
    files = {
        "batting":   "player_batting_profiles.csv",
        "bowling":   "player_bowling_profiles.csv",
        "venues":    "venue_profiles.csv",
        "matchups":  "matchup_stats.csv",
        "opponents": "opponent_profiles.csv",
        "impact":    "player_impact_scores.csv",
        "matches":   "match_results.csv",
    }
    for key, fname in files.items():
        path = PARSED_DIR / fname
        _profiles[key] = pd.read_csv(path, low_memory=False) if path.exists() else pd.DataFrame()


def startup():
    """Call once at app startup."""
    _load_models()
    _load_profiles()


def get_profiles():
    return _profiles


# ── Player list helpers ──────────────────────────────────────────────────────

INDIA_FORMAT_FILES = {
    "t20":  "p_T20.txt",
    "odi":  "p_ODI.txt",
    "test": "p_TEST.txt",
}

OPPONENT_FILES = {
    "Australia":    "p_AUSTRALIA.txt",
    "England":      "p_ENGLAND.txt",
    "Pakistan":     "p_PAKISTAN.txt",
    "South Africa": "p_SOUTH_AFRICA.txt",
    "New Zealand":  "p_NEW_ZEALAND.txt",
    "Sri Lanka":    "p_SRI_LANKA.txt",
    "Bangladesh":   "p_BANGLADESH.txt",
    "West Indies":  "p_WEST_INDIES.txt",
    "Zimbabwe":     "p_ZIMBABWE.txt",
    "Ireland":      "p_IRELAND.txt",
}


def _read_player_file(filename: str) -> List[str]:
    path = PLAYERS_DIR / filename
    if not path.exists():
        return []
    return [l.strip() for l in path.read_text().splitlines() if l.strip()]


def get_india_players(fmt: str) -> List[str]:
    fname = INDIA_FORMAT_FILES.get(fmt.lower())
    return _read_player_file(fname) if fname else []


def get_opponent_players(country: str) -> List[str]:
    fname = OPPONENT_FILES.get(country)
    return _read_player_file(fname) if fname else []


def get_opponents() -> List[str]:
    return list(OPPONENT_FILES.keys())


# ── Venue helpers ────────────────────────────────────────────────────────────

def get_venues() -> List[str]:
    if _profiles.get("venues") is None or _profiles["venues"].empty:
        return []
    return sorted(_profiles["venues"]["venue"].dropna().unique().tolist())


PITCH_TYPES = ["flat", "spin", "seam", "pace", "balanced"]


# ── Feature building (mirrors 08_predict.py logic) ──────────────────────────

WK_KEYWORDS = ["dhoni", "pant", "karthik", "buttler", "de kock", "bairstow", "rahul"]

FORMAT_ENC = {"t20": 2, "odi": 1, "test": 0}
PITCH_ENC  = {"flat": 1, "spin": 4, "seam": 3, "pace": 2, "balanced": 0}
ROLE_ENC   = {"BAT": 0, "BOWL": 1, "ALL": 2, "WK": 3}


def _get_role(player: str, fmt: str) -> str:
    if any(kw in player.lower() for kw in WK_KEYWORDS):
        return "WK"
    has_bowl = not _profiles["bowling"].empty and not _profiles["bowling"][
        (_profiles["bowling"]["player"] == player) &
        (_profiles["bowling"]["match_format"] == fmt)
    ].empty
    has_bat = not _profiles["batting"].empty and not _profiles["batting"][
        (_profiles["batting"]["player"] == player) &
        (_profiles["batting"]["match_format"] == fmt)
    ].empty
    if has_bat and has_bowl:
        return "ALL"
    if has_bowl:
        return "BOWL"
    return "BAT"


def _build_feature_row(player: str, fmt: str, venue: str,
                        pitch: str, opponent: Optional[str]) -> tuple:
    row = {col: np.nan for col in _feature_cols}

    # Batting
    bat_df = _profiles["batting"]
    if not bat_df.empty:
        b = bat_df[(bat_df["player"] == player) & (bat_df["match_format"] == fmt)]
        if not b.empty:
            b = b.iloc[0]
            row["career_avg_bat"]   = b.get("career_avg", np.nan)
            row["career_sr"]        = b.get("career_sr",  np.nan)
            row["form_avg_short"]   = b.get("form_avg_short", np.nan)
            row["form_sr_short"]    = b.get("form_sr_short",  np.nan)
            row["form_avg_long"]    = b.get("form_avg_long",  np.nan)
            row["form_sr_long"]     = b.get("form_sr_long",   np.nan)
            row["weighted_avg_bat"] = b.get("weighted_avg",   np.nan)
            row["weighted_sr"]      = b.get("weighted_sr",    np.nan)
            row["batter_sr_this_pitch"] = b.get(f"sr_on_{pitch.lower()}", np.nan)

    # Bowling
    bowl_df = _profiles["bowling"]
    if not bowl_df.empty:
        bw = bowl_df[(bowl_df["player"] == player) & (bowl_df["match_format"] == fmt)]
        if not bw.empty:
            bw = bw.iloc[0]
            row["career_wickets"]    = bw.get("career_wickets",  np.nan)
            row["career_avg_bowl"]   = bw.get("career_avg",      np.nan)
            row["career_economy"]    = bw.get("career_economy",  np.nan)
            row["form_eco_short"]    = bw.get("form_eco_short",  np.nan)
            row["form_eco_long"]     = bw.get("form_eco_long",   np.nan)
            row["weighted_avg_bowl"] = bw.get("weighted_avg",    np.nan)
            row["weighted_economy"]  = bw.get("weighted_economy",np.nan)
            row["bowler_eco_this_pitch"] = bw.get(f"eco_on_{pitch.lower()}", np.nan)

    # Venue
    ven_df = _profiles["venues"]
    if not ven_df.empty:
        v = ven_df[(ven_df["venue"] == venue) & (ven_df["match_format"] == fmt)]
        if not v.empty:
            row["avg_first_innings_score"] = v.iloc[0].get("avg_first_innings_score", np.nan)

    # Matchups
    mu_df = _profiles["matchups"]
    if not mu_df.empty:
        bat_mu = mu_df[(mu_df["batter"] == player) & (mu_df["match_format"] == fmt)]
        if not bat_mu.empty:
            row["matchup_avg_sr"]           = bat_mu["strike_rate"].mean()
            row["matchup_avg_dismissal_rt"] = bat_mu["dismissal_rate"].mean()
        bowl_mu = mu_df[(mu_df["bowler"] == player) & (mu_df["match_format"] == fmt)]
        if not bowl_mu.empty:
            row["matchup_bowl_avg_sr_conceded"] = bowl_mu["strike_rate"].mean()
            row["matchup_bowl_avg_dismiss_rt"]  = bowl_mu["dismissal_rate"].mean()

    # Opponent-specific
    if opponent:
        opp_df = _profiles["opponents"]
        if not opp_df.empty:
            opp = opp_df[
                (opp_df["player"] == player) &
                (opp_df["match_format"] == fmt) &
                (opp_df["opponent_team"] == opponent)
            ]
            if not opp.empty:
                o = opp.iloc[0]
                row["vs_opp_bat_avg"]      = o.get("vs_opp_bat_avg", np.nan)
                row["vs_opp_bat_sr"]       = o.get("vs_opp_bat_sr", np.nan)
                row["vs_opp_bowl_economy"] = o.get("vs_opp_bowl_economy", np.nan)
                row["vs_opp_bowl_avg"]     = o.get("vs_opp_bowl_avg", np.nan)

    row["opponent_difficulty"] = 0.5
    role = _get_role(player, fmt)
    row["match_format_enc"] = FORMAT_ENC.get(fmt, 2)
    row["pitch_type_enc"]   = PITCH_ENC.get(pitch.lower(), 0)
    row["role_enc"]         = ROLE_ENC.get(role, 0)
    row["batting_first"]    = 0

    for col in _feature_cols:
        if col not in row or (isinstance(row.get(col), float) and np.isnan(row[col])):
            row[col] = 0.0

    return row, role


# ── Public predict function ──────────────────────────────────────────────────

def predict(
    squad: List[str],
    fmt: str,
    venue: str,
    pitch: str,
    opponent: Optional[str] = None,
    batting_first: bool = True,
) -> dict:
    """
    Returns a dict with:
      - all_players: list of {name, role, score, confidence_lo, confidence_hi}
      - selected_xi: same structure but only selected players
      - status: optimizer status string
      - total_score: float
    """
    rows, roles = [], []
    for name in squad:
        row, role = _build_feature_row(name, fmt, venue, pitch, opponent)
        row["batting_first"] = 1 if batting_first else 0
        rows.append(row)
        roles.append(role)

    X = pd.DataFrame(rows)[_feature_cols].fillna(0)
    xgb_scores = _xgb_pipe.predict(X)
    rf_scores  = _rf_pipe.predict(X)
    ens = np.clip(_xgb_w * xgb_scores + _rf_w * rf_scores, 0, 100)

    candidates = []
    for i, name in enumerate(squad):
        c = PlayerCandidate(
            name=name,
            role=roles[i],
            predicted_score=float(ens[i]),
            is_overseas=False,
            context_stats=rows[i],
        )
        candidates.append(c)

    candidates = add_confidence_intervals(candidates)
    constraints = TeamConstraints()
    selection = select_xi(candidates, constraints)

    selected_names = {p.name for p in selection.players}

    def to_dict(c):
        return {
            "name": c.name,
            "role": c.role,
            "score": round(c.predicted_score, 1),
            "confidence_lo": round(getattr(c, "confidence_lo", c.predicted_score * 0.85), 1),
            "confidence_hi": round(getattr(c, "confidence_hi", c.predicted_score * 1.15), 1),
            "selected": c.name in selected_names,
        }

    all_players = sorted([to_dict(c) for c in candidates], key=lambda x: -x["score"])
    selected = sorted([p for p in all_players if p["selected"]],
                      key=lambda x: ({"BAT": 0, "WK": 1, "ALL": 2, "BOWL": 3}.get(x["role"], 4), -x["score"]))

    return {
        "all_players": all_players,
        "selected_xi": selected,
        "status": selection.status,
        "total_score": round(selection.total_score, 1),
    }


# ── Stats helpers ────────────────────────────────────────────────────────────

def get_player_batting_stats(fmt: str) -> List[dict]:
    df = _profiles["batting"]
    if df.empty:
        return []
    sub = df[df["match_format"] == fmt.lower()].copy()
    cols = [
        "player", "match_format", "total_innings",
        "career_avg", "career_sr",
        "form_avg_short", "form_sr_short",
        "form_avg_long", "form_sr_long",
        "weighted_avg", "weighted_sr",
        "sr_on_flat", "sr_on_spin", "sr_on_seam", "sr_on_pace", "sr_on_balanced",
    ]
    existing = [c for c in cols if c in sub.columns]
    return sub[existing].fillna(0).round(2).to_dict(orient="records")


def get_player_bowling_stats(fmt: str) -> List[dict]:
    df = _profiles["bowling"]
    if df.empty:
        return []
    sub = df[df["match_format"] == fmt.lower()].copy()
    cols = [
        "player", "match_format", "total_innings",
        "career_wickets", "career_avg", "career_economy",
        "form_eco_short", "form_eco_long",
        "weighted_avg", "weighted_economy",
        "eco_on_flat", "eco_on_spin", "eco_on_seam", "eco_on_pace", "eco_on_balanced",
    ]
    existing = [c for c in cols if c in sub.columns]
    return sub[existing].fillna(0).round(2).to_dict(orient="records")


def get_player_form(players: List[str], fmt: Optional[str] = None, n: int = 5) -> List[dict]:
    """Last n matches for each player from impact scores."""
    df = _profiles["impact"]
    if df.empty:
        return []
    mask = df["player"].isin(players)
    if fmt:
        mask &= df["match_format"] == fmt.lower()
    sub = df[mask].sort_values("date", ascending=False)
    result = []
    for player in players:
        pdata = sub[sub["player"] == player].head(n)
        for _, row in pdata.iterrows():
            result.append({
                "player": row.get("player"),
                "date":   str(row.get("date", "")),
                "format": row.get("match_format", ""),
                "venue":  row.get("venue", ""),
                "impact_score": round(float(row.get("impact_score", 0)), 1),
                "bat_score":    round(float(row.get("bat_score", 0)), 1),
                "bowl_score":   round(float(row.get("bowl_score", 0)), 1),
                "runs":         int(row.get("runs", 0) or 0),
                "wickets":      int(row.get("wickets", 0) or 0),
                "strike_rate":  round(float(row.get("strike_rate", 0) or 0), 1),
                "economy":      round(float(row.get("economy", 0) or 0), 1),
            })
    return result


def get_team_stats() -> List[dict]:
    """Win rates and match counts per team across formats."""
    df = _profiles["matches"]
    if df.empty:
        return []
    all_teams = set(df["team1"].dropna().unique()) | set(df["team2"].dropna().unique())
    results = []
    for team in sorted(all_teams):
        team_matches = df[(df["team1"] == team) | (df["team2"] == team)]
        wins = (df["winner"] == team).sum()
        total = len(team_matches)
        win_rate = round(wins / total * 100, 1) if total > 0 else 0
        results.append({
            "team": team,
            "total_matches": int(total),
            "wins": int(wins),
            "win_rate": win_rate,
        })
    return sorted(results, key=lambda x: -x["win_rate"])


def get_player_categories(fmt: str) -> dict:
    """
    Categorise India squad players into A / B / C based on versatility.
    A = has both batting AND bowling profiles (all-rounders / most flexible)
    B = has one profile + some contribution in the other
    C = pure specialist (only one profile)
    """
    players = get_india_players(fmt)
    bat_df  = _profiles["batting"]
    bowl_df = _profiles["bowling"]

    team_a, team_b, team_c = [], [], []
    for p in players:
        has_bat  = not bat_df.empty and not bat_df[
            (bat_df["player"] == p) & (bat_df["match_format"] == fmt.lower())
        ].empty
        has_bowl = not bowl_df.empty and not bowl_df[
            (bowl_df["player"] == p) & (bowl_df["match_format"] == fmt.lower())
        ].empty

        role = _get_role(p, fmt.lower())

        if has_bat and has_bowl:
            team_a.append({"name": p, "role": role})
        elif has_bat or has_bowl:
            team_b.append({"name": p, "role": role})
        else:
            team_c.append({"name": p, "role": role})

    return {"team_a": team_a, "team_b": team_b, "team_c": team_c}
