"""
Cricket Analytics Engine - Central Configuration
================================================
Adjust paths, weights, and parameters here without touching the scripts.
"""

import os

# ── Paths ──────────────────────────────────────────────────────────────────
BASE_DIR   = os.path.dirname(os.path.abspath(__file__))
DATA_DIR   = os.path.join(BASE_DIR, "data")
RAW_DIR    = os.path.join(DATA_DIR, "raw")          # downloaded zip/yaml files
PARSED_DIR = os.path.join(DATA_DIR, "parsed")       # intermediate CSVs
DB_PATH    = os.path.join(DATA_DIR, "cricket.db")   # SQLite database

# ── Cricsheet Download URLs ────────────────────────────────────────────────
# All three formats; comment out any you don't need.
CRICSHEET_URLS = {
    "t20":  "https://cricsheet.org/downloads/t20s_male_csv2.zip",
    "odi":  "https://cricsheet.org/downloads/odis_male_csv2.zip",
    "test": "https://cricsheet.org/downloads/tests_male_csv2.zip",
}

# ── Data Filtering ─────────────────────────────────────────────────────────
# Drop matches shorter than this many overs (rain/DLS-reduced games are noisy)
MIN_OVERS_T20  = 10
MIN_OVERS_ODI  = 20
MIN_OVERS_TEST = 0   # Tests rarely need filtering on overs

# Minimum innings a player must have batted / bowled to be included in profiles
MIN_BATTING_INNINGS = 5
MIN_BOWLING_INNINGS = 5

# ── Form Weights (recent-form rolling windows) ─────────────────────────────
# Short window: last N matches; long window: last M matches
FORM_SHORT_WINDOW = 5
FORM_LONG_WINDOW  = 15

# Exponential decay for time-weighted averages (higher = faster decay)
# Applied so matches in the last 6 months count ~2× matches from 2+ years ago.
DECAY_HALF_LIFE_DAYS = 180

# ── Impact Score Weights ───────────────────────────────────────────────────
# These define how the "Player Impact Score" is assembled (Phase 2 output).
# Weights must sum to 1.0 within each role group.
BATTING_WEIGHTS = {
    "average":      0.35,
    "strike_rate":  0.35,
    "recent_form":  0.20,
    "venue_bonus":  0.10,
}

BOWLING_WEIGHTS = {
    "average":       0.35,
    "economy_rate":  0.30,
    "recent_form":   0.20,
    "venue_bonus":   0.15,
}

# ── Venue Encoding ─────────────────────────────────────────────────────────
# Rough pitch archetypes – enriched automatically from match-level stats,
# but you can pre-seed known venues here.
KNOWN_PITCH_TYPES = {
    "Wankhede Stadium":          "flat",
    "Eden Gardens":              "flat",
    "Chepauk":                   "spin",
    "Chinnaswamy Stadium":       "flat",
    "Feroz Shah Kotla":          "spin",
    "Headingley":                "seam",
    "Lord's Cricket Ground":     "seam",
    "MCG":                       "pace",
    "SCG":                       "balanced",
    "The Oval":                  "seam",
    "SuperSport Park":           "pace",
    "Newlands":                  "pace",
}

# ── Logging ────────────────────────────────────────────────────────────────
LOG_LEVEL = "DEBUG"   # DEBUG | INFO | WARNING | ERROR
