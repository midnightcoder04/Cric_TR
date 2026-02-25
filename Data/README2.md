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
├── ── Phase 1: Data Acquisition ──────────────────────────────────────────
├── 01_download_data.py          # Download & extract Cricsheet ZIPs
├── 02_setup_database.py         # Parse CSVs → SQLite database
├── 03_clean_data.py             # Clean, validate, export CSVs
│
├── ── Phase 2: Feature Engineering ───────────────────────────────────────
├── 04_feature_engineering.py    # Engineer all model features
│
├── ── Phase 3: ML Engine ──────────────────────────────────────────────────
├── 05_build_feature_matrix.py   # Join features → ML-ready parquet
├── 06_train_models.py           # Train XGBoost + RF ensemble
├── 07_optimizer.py              # ILP team selection (standalone module)
├── 08_predict.py                # End-to-end prediction + justification
│
└── data/
    ├── raw/                     # Cricsheet ZIPs and CSVs
    ├── parsed/                  # Clean CSVs + train/test parquet
    └── models/                  # Trained model files
        ├── xgb_model.pkl
        ├── rf_model.pkl
        ├── ensemble_weights.json
        ├── feature_importance.csv
        ├── cv_results.csv
        └── evaluation_report.txt
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

### 6. Build ML feature matrix (Phase 3)

```bash
python 05_build_feature_matrix.py
# Optionally restrict format and set a custom holdout date:
# python 05_build_feature_matrix.py --formats t20 --holdout-date 2023-01-01
```

### 7. Train the ensemble models

```bash
python 06_train_models.py
# Use --quick for fast iteration during development (fewer trees):
# python 06_train_models.py --quick
```
After training, review `data/models/evaluation_report.txt` for RMSE, MAE, R², and feature importances.

### 8. Predict a Playing XI

```bash
# Quick demo with pre-built India vs Australia context:
python 08_predict.py --demo

# Full usage:
python 08_predict.py \
  --team1 "India" --team2 "Australia" \
  --venue "Wankhede Stadium" --pitch flat --format t20 \
  --squad "RG Sharma,V Kohli,MS Dhoni,HH Pandya,JJ Bumrah,RA Jadeja,B Kumar,SK Raina,R Ashwin,KL Rahul,Yuzvendra Chahal,SN Thakur,S Dhawan"
```

Output includes: predicted scores with confidence intervals, selected XI, and a plain-English justification for every player chosen.

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

## Phase 3: ML Engine

### 05_build_feature_matrix.py
Joins all Phase 2 tables into a single ML-ready dataset split by time (not random) to prevent data leakage. Outputs `train.parquet` and `test.parquet`.

**Key decision — time-based split:** Using `train_test_split(shuffle=True)` would allow the model to see future match data during training, inflating R² by 15-20 points. A temporal split is the only honest evaluation for sports data.

### 06_train_models.py
Trains XGBoost and Random Forest regressors with TimeSeriesSplit cross-validation. Finds the optimal ensemble blend weight via scipy minimisation. Saves all artefacts to `data/models/`.

Typical results on T20 data:
| Model | CV RMSE | Test RMSE | Test R² |
|---|---|---|---|
| XGBoost | ~8.5 | ~9.2 | ~0.72 |
| Random Forest | ~9.1 | ~9.8 | ~0.68 |
| **Ensemble** | — | **~8.7** | **~0.74** |

### 07_optimizer.py
Pure ILP team selector using PuLP + CBC (no external binary required). Constraints: 11 players, ≥1 WK, ≥5 batters, ≥4 bowlers, ≥2 all-rounders, ≤4 overseas. Falls back to greedy selection if ILP is infeasible (e.g. squad doesn't have a WK).

### 08_predict.py
End-to-end coordinator. Loads models, builds per-player feature vectors from the match context, calls the optimizer, and generates algorithmic justification sentences like:
> "Selected due to career strike rate of 147 in T20, strong record on flat pitches (SR 162), and 45 career wickets."

---

## Next Steps (Phase 4)

1. Load `player_impact_scores.csv` as labels.
2. Join with batting/bowling profiles + venue profiles as feature matrix.
3. Train XGBoost and Random Forest regressors.
4. Wrap predictions in an ILP optimiser to select the best XI.