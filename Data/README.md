# Cricket Analytics Engine — Data Pipeline

## Overview

This repository contains the **Phase 1 & 2** data pipeline for a cricket player recommendation system.  
It ingests ball-by-ball data from Cricsheet, stores it in a relational database, cleans it, and engineers all features needed by the Phase 3 ML engine.

---

## Project Structure

```
cricket_analytics/
├── config.py                    # All tuneable parameters live here
├── requirements.txt
│
├── 01_download_data.py          # Phase 1 — Download & extract Cricsheet ZIPs
├── 02_setup_database.py         # Phase 1 — Parse CSVs → SQLite database
├── 03_clean_data.py             # Phase 1 — Clean, validate, export CSVs
├── 04_feature_engineering.py    # Phase 2 — Engineer all model features
│
└── data/
    ├── raw/
    │   ├── t20/                 # Cricsheet T20 CSV files (created by script 01)
    │   ├── odi/
    │   └── test/
    └── parsed/                  # Clean CSVs ready for modelling (created by scripts 03/04)
        ├── deliveries_clean.csv
        ├── match_results.csv
        ├── player_registry.csv
        ├── player_batting_profiles.csv
        ├── player_bowling_profiles.csv
        ├── venue_profiles.csv
        ├── matchup_stats.csv
        └── player_impact_scores.csv   ← TARGET VARIABLE for Phase 3
```

---

## Quick Start

### 1. Install dependencies

```bash
pip install -r requirements.txt
```

### 2. Download data (~150 MB total for all three formats)

```bash
python 01_download_data.py
# Only T20 to start fast:
# python 01_download_data.py --formats t20
```

### 3. Parse into the database

```bash
python 02_setup_database.py
# Rebuild from scratch if you've patched NAME_PATCHES in config.py:
# python 02_setup_database.py --rebuild
```

### 4. Clean & validate

```bash
python 03_clean_data.py
# Review data/parsed/players_dedup_candidates.csv for name duplicates
# Add confirmed duplicates to NAME_PATCHES in config.py, then re-run with --rebuild
```

### 5. Engineer features

```bash
python 04_feature_engineering.py
# T20 only:
# python 04_feature_engineering.py --formats t20
```

---

## Key Design Decisions

### Why Cricsheet instead of ESPNcricinfo scraping?
- **Free, structured, legal** — no scraping, no rate-limiting, no TOS risk.
- Ball-by-ball CSV2 format is already in a join-ready two-file structure.
- Updated regularly; the same download URL always points to the latest data.

### Why SQLite instead of PostgreSQL?
- Zero-config — runs on any machine without a database server.
- The ORM schema (SQLAlchemy) is **identical** to PostgreSQL.  
  To migrate: change one line in `config.py`:
  ```python
  DB_PATH = "postgresql://user:pass@localhost/cricket"
  ```
- For production / multi-user deployment, switch to PostgreSQL at Phase 4.

### Why a target variable defined by rules (not labels)?
- We don't have coach-labelled "good performance" data.
- The Impact Score formula is **transparent and tunable** — coaches can see exactly how it's computed and adjust `config.py` weights before training.
- It can be replaced with supervised labels (match award data, coach ratings) without changing any other script.

---

## Configuration Reference (`config.py`)

| Parameter | Default | Purpose |
|---|---|---|
| `FORM_SHORT_WINDOW` | 5 | Recent innings for short-form rolling average |
| `FORM_LONG_WINDOW` | 15 | Innings for long-form rolling average |
| `DECAY_HALF_LIFE_DAYS` | 180 | Time-decay half-life (~6 months) |
| `MIN_BATTING_INNINGS` | 5 | Minimum innings to include a batter in profiles |
| `BATTING_WEIGHTS` | see config | Impact score composition for batters |
| `KNOWN_PITCH_TYPES` | see config | Pre-seeded venue archetypes |

---

## Output Files for Phase 3 (ML Engine)

| File | Rows (approx) | Used For |
|---|---|---|
| `player_impact_scores.csv` | ~500k | **Target variable (y)** |
| `player_batting_profiles.csv` | ~10k | Batter features |
| `player_bowling_profiles.csv` | ~10k | Bowler features |
| `venue_profiles.csv` | ~500 | Venue/pitch context features |
| `matchup_stats.csv` | ~50k | Head-to-head matchup features |

---

## Next Steps (Phase 3)

1. Load `player_impact_scores.csv` as labels.
2. Join with batting/bowling profiles + venue profiles as feature matrix.
3. Train XGBoost and Random Forest regressors.
4. Wrap predictions in an ILP optimiser to select the best XI.
