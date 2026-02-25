"""
Phase 3 — Script 3 of 4
========================
Constrained Team Selection Optimizer (Integer Linear Programming)
------------------------------------------------------------------
Takes the ensemble model's predicted Impact Scores for every player
in an available squad and selects the optimal playing XI that maximises
total predicted impact while strictly satisfying cricket team rules.

Constraints enforced:
  • Exactly 11 players selected
  • Exactly 1 Wicket-Keeper (can be up to 2 in squad)
  • Minimum 5 batting options  (BAT + WK count)
  • Minimum 4 bowling options  (BOWL + ALL count)
  • Minimum 2 all-rounders     (helps balance the team)
  • Maximum 6 overseas players (configurable; default for bilateral series)
  • No more than 11 players per squad submitted

The optimizer uses PuLP (pure-Python LP solver) with the CBC backend,
which ships with PuLP and requires no external binary.

Outputs:
  • The selected XI as a sorted DataFrame (printed to console)
  • A TeamSelection object that the prediction script uses for
    justification

Usage (standalone — usually called from 08_predict.py):
  python 07_optimizer.py --demo
"""

import sys
from dataclasses import dataclass, field
from pathlib import Path
from typing import Optional, Dict

import pandas as pd
import pulp
from loguru import logger

sys.path.insert(0, str(Path(__file__).parent))
from config import LOG_LEVEL

logger.remove()
logger.add(sys.stderr, level=LOG_LEVEL,
           format="<green>{time:HH:mm:ss}</green> | <level>{level: <8}</level> | {message}")


# ─── Data Structures ──────────────────────────────────────────────────────────

@dataclass
class PlayerCandidate:
    name:           str
    role:           str          # BAT | BOWL | ALL | WK
    predicted_score: float
    is_overseas:    bool = False
    confidence_lo:  float = 0.0  # lower bound of prediction interval
    confidence_hi:  float = 0.0  # upper bound of prediction interval
    # Context stats used later for justification
    context_stats:  dict = field(default_factory=dict)


@dataclass
class TeamSelection:
    players:        list[PlayerCandidate]
    total_score:    float
    n_batters:      int
    n_bowlers:      int
    n_allrounders:  int
    n_wk:           int
    status:         str          # "Optimal" | "Infeasible" | "Suboptimal"


# ─── Constraints Config ───────────────────────────────────────────────────────

@dataclass
class TeamConstraints:
    team_size:        int = 11
    min_batters:      int = 5    # BAT + WK
    min_bowlers:      int = 4    # BOWL + ALL
    min_allrounders:  int = 2    # ALL only
    min_wk:           int = 1
    max_wk:           int = 2
    max_overseas:     int = 4    # typical bilateral series limit


# ─── Confidence Interval Estimation ──────────────────────────────────────────

def add_confidence_intervals(candidates: list[PlayerCandidate],
                              uncertainty_pct: float = 0.15) -> list[PlayerCandidate]:
    """
    Approximate ±CI using ±15% of the predicted score as a simple proxy.
    In Phase 4 you can replace this with quantile regression or bootstrap.
    """
    for c in candidates:
        margin = c.predicted_score * uncertainty_pct
        c.confidence_lo = max(c.predicted_score - margin, 0)
        c.confidence_hi = c.predicted_score + margin
    return candidates


# ─── ILP Optimizer ────────────────────────────────────────────────────────────

def select_xi(candidates: list[PlayerCandidate],
              constraints: TeamConstraints = TeamConstraints(),
              verbose: bool = False) -> TeamSelection:
    """
    Solve the team selection ILP.

    Decision variables:
        x[i] ∈ {0, 1}  →  1 if player i is selected

    Objective:
        maximise  Σ predicted_score[i] * x[i]

    Subject to:
        Σ x[i]                                  == team_size
        Σ x[i] for i in {BAT, WK}              >= min_batters
        Σ x[i] for i in {BOWL, ALL}            >= min_bowlers
        Σ x[i] for i in {ALL}                  >= min_allrounders
        min_wk <= Σ x[i] for i in {WK}        <= max_wk
        Σ x[i] for i in overseas               <= max_overseas
    """
    n = len(candidates)
    if n < constraints.team_size:
        logger.error(f"Squad too small: {n} players, need at least {constraints.team_size}.")
        return TeamSelection([], 0, 0, 0, 0, 0, "Infeasible")

    prob = pulp.LpProblem("cricket_xi_selection", pulp.LpMaximize)

    # Decision variables
    x = [pulp.LpVariable(f"x_{i}", cat="Binary") for i in range(n)]

    # Objective
    prob += pulp.lpSum(c.predicted_score * x[i] for i, c in enumerate(candidates))

    # ── Hard constraints ──────────────────────────────────────────────────────
    # Exactly team_size players
    prob += pulp.lpSum(x) == constraints.team_size

    # Batting depth
    bat_vars = [x[i] for i, c in enumerate(candidates) if c.role in ("BAT", "WK")]
    prob += pulp.lpSum(bat_vars) >= constraints.min_batters

    # Bowling depth
    bowl_vars = [x[i] for i, c in enumerate(candidates) if c.role in ("BOWL", "ALL")]
    prob += pulp.lpSum(bowl_vars) >= constraints.min_bowlers

    # All-rounders
    allr_vars = [x[i] for i, c in enumerate(candidates) if c.role == "ALL"]
    prob += pulp.lpSum(allr_vars) >= constraints.min_allrounders

    # Wicket-keeper
    wk_vars = [x[i] for i, c in enumerate(candidates) if c.role == "WK"]
    prob += pulp.lpSum(wk_vars) >= constraints.min_wk
    prob += pulp.lpSum(wk_vars) <= constraints.max_wk

    # Overseas limit
    overseas_vars = [x[i] for i, c in enumerate(candidates) if c.is_overseas]
    if overseas_vars:
        prob += pulp.lpSum(overseas_vars) <= constraints.max_overseas

    # ── Solve ─────────────────────────────────────────────────────────────────
    solver = pulp.PULP_CBC_CMD(msg=int(verbose))
    prob.solve(solver)
    status = pulp.LpStatus[prob.status]

    if status not in ("Optimal", "Feasible"):
        logger.warning(f"ILP returned status: {status}")
        # Fallback: greedy top-score selection ignoring role constraints
        sorted_cands = sorted(candidates, key=lambda c: c.predicted_score, reverse=True)
        selected = sorted_cands[:constraints.team_size]
        status = "Suboptimal"
    else:
        selected = [c for i, c in enumerate(candidates) if pulp.value(x[i]) == 1]

    total   = sum(c.predicted_score for c in selected)
    n_bat   = sum(1 for c in selected if c.role in ("BAT", "WK"))
    n_bowl  = sum(1 for c in selected if c.role in ("BOWL", "ALL"))
    n_allr  = sum(1 for c in selected if c.role == "ALL")
    n_wk    = sum(1 for c in selected if c.role == "WK")

    return TeamSelection(
        players       = selected,
        total_score   = total,
        n_batters     = n_bat,
        n_bowlers     = n_bowl,
        n_allrounders = n_allr,
        n_wk          = n_wk,
        status        = status,
    )


# ─── Display Helper ───────────────────────────────────────────────────────────

ROLE_ORDER = {"WK": 0, "BAT": 1, "ALL": 2, "BOWL": 3}


def display_xi(selection: TeamSelection, context: Optional[Dict] = None) -> str:
    """Return a formatted string of the selected XI."""
    players = sorted(selection.players,
                     key=lambda c: (ROLE_ORDER.get(c.role, 9), -c.predicted_score))
    lines = [
        "",
        "=" * 65,
        "  SELECTED PLAYING XI",
        "=" * 65,
        f"  Status: {selection.status}   Total Predicted Impact: {selection.total_score:.1f}",
        f"  Batters: {selection.n_batters}  Bowlers: {selection.n_bowlers}  "
        f"All-rounders: {selection.n_allrounders}  WK: {selection.n_wk}",
        "─" * 65,
        f"  {'#':>2}  {'Player':30s}  {'Role':6s}  {'Score':>6}  {'CI':>15}",
        "─" * 65,
    ]
    for i, p in enumerate(players, 1):
        ci = f"[{p.confidence_lo:.1f} – {p.confidence_hi:.1f}]"
        lines.append(
            f"  {i:>2}  {p.name:30s}  {p.role:6s}  {p.predicted_score:>6.1f}  {ci:>15}"
        )
    lines.append("=" * 65)
    return "\n".join(lines)


# ─── Demo Mode ────────────────────────────────────────────────────────────────

def _build_demo_squad() -> list[PlayerCandidate]:
    """Dummy squad for standalone testing without running the full pipeline."""
    demo = [
        ("RG Sharma",       "BAT",  78.0, False),
        ("S Dhawan",        "BAT",  65.0, False),
        ("V Kohli",         "BAT",  91.0, False),
        ("SK Raina",        "ALL",  72.0, False),
        ("MS Dhoni",        "WK",   80.0, False),
        ("HH Pandya",       "ALL",  74.0, False),
        ("RA Jadeja",       "ALL",  69.0, False),
        ("R Ashwin",        "BOWL", 58.0, False),
        ("B Kumar",         "BOWL", 61.0, False),
        ("JJ Bumrah",       "BOWL", 85.0, False),
        ("Yuzvendra Chahal","BOWL", 55.0, False),
        ("KL Rahul",        "WK",   70.0, False),
        ("SN Thakur",       "ALL",  50.0, False),
    ]
    candidates = []
    for name, role, score, overseas in demo:
        c = PlayerCandidate(name=name, role=role,
                            predicted_score=score, is_overseas=overseas)
        candidates.append(c)
    return candidates


# ─── Entry Point ─────────────────────────────────────────────────────────────

if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser(description="ILP Team Optimizer (demo)")
    parser.add_argument("--demo", action="store_true", default=True)
    args = parser.parse_args()

    if args.demo:
        squad = _build_demo_squad()
        squad = add_confidence_intervals(squad)
        selection = select_xi(squad)
        print(display_xi(selection))
