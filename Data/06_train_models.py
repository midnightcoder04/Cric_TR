"""
Phase 3 — Script 2 of 4
========================
Model Training: XGBoost + Random Forest Ensemble
--------------------------------------------------
Trains two gradient-boosted/bagged regressors to predict each player's
Impact Score for an upcoming match given match context.

Architecture:
  • XGBoostRegressor    — captures non-linear feature interactions
  • RandomForestRegressor — provides diversity and handles missing features
  • Ensemble            — weighted average of both (weights tuned by CV RMSE)

Validation strategy:
  • TimeSeriesSplit cross-validation on the TRAIN set (5 folds)
  • Ensures no future data leaks into earlier folds
  • Final evaluation on held-out TEST set (most recent 20% of timeline)

Outputs (all in data/models/):
  • xgb_model.pkl         — trained XGBoost pipeline
  • rf_model.pkl          — trained RandomForest pipeline
  • ensemble_weights.json — {"xgb": w1, "rf": w2}
  • feature_importance.csv
  • cv_results.csv
  • evaluation_report.txt — RMSE, MAE, R², per-format breakdown

Usage:
  python 06_train_models.py
  python 06_train_models.py --formats t20
  python 06_train_models.py --quick   # fewer trees, fast iteration
"""

import argparse
import json
import pickle
import sys
from pathlib import Path
from typing import Optional, List, Tuple

import numpy as np
import pandas as pd
from loguru import logger
from scipy.optimize import minimize_scalar
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_squared_error, mean_absolute_error, r2_score
from sklearn.model_selection import TimeSeriesSplit
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler
from xgboost import XGBRegressor

sys.path.insert(0, str(Path(__file__).parent))
from config import PARSED_DIR, LOG_LEVEL

logger.remove()
logger.add(sys.stderr, level=LOG_LEVEL,
           format="<green>{time:HH:mm:ss}</green> | <level>{level: <8}</level> | {message}")

PARSED    = Path(PARSED_DIR)
MODEL_DIR = Path(__file__).parent / "data" / "models"
MODEL_DIR.mkdir(parents=True, exist_ok=True)

# ─── Feature Columns ──────────────────────────────────────────────────────────
# These are the columns we feed into the models. Derived from 05_build_feature_matrix.py.
# Keep this list in sync with the matrix builder.
FEATURE_COLS = [
    # Batting
    "career_avg_bat",         "career_sr",
    "form_avg_short",         "form_sr_short",
    "form_avg_long",          "form_sr_long",
    "weighted_avg_bat",       "weighted_sr",
    "batter_sr_this_pitch",
    # Bowling
    "career_wickets",
    "career_avg_bowl",        "career_economy",
    "form_eco_short",         "form_eco_long",
    "weighted_avg_bowl",      "weighted_economy",
    "bowler_eco_this_pitch",
    # Venue
    "avg_first_innings_score",
    # Matchup
    "matchup_avg_sr",         "matchup_avg_dismissal_rt",
    "matchup_bowl_avg_sr_conceded", "matchup_bowl_avg_dismiss_rt",
    # Context (encoded)
    "match_format_enc",       "pitch_type_enc",
    "role_enc",               "batting_first",
    # Raw performance fields (used as additional signals)
    "runs",                   "balls",          "strike_rate",
    "wickets",                "runs_conceded",  "balls_bowled",  "economy",
]

TARGET_COL = "impact_score"


def load_splits(formats: Optional[List[str]]) -> Tuple[pd.DataFrame, pd.DataFrame]:
    for fname in ("train.parquet", "test.parquet"):
        if not (PARSED / fname).exists():
            logger.error(f"{fname} not found. Run 05_build_feature_matrix.py first.")
            sys.exit(1)

    train = pd.read_parquet(PARSED / "train.parquet")
    test  = pd.read_parquet(PARSED / "test.parquet")

    if formats:
        train = train[train["match_format"].isin(formats)]
        test  = test[test["match_format"].isin(formats)]

    logger.info(f"Train: {len(train):,} | Test: {len(test):,}")
    return train, test


def get_Xy(df: pd.DataFrame) -> tuple[pd.DataFrame, pd.Series]:
    """Extract feature matrix X and target y from a split DataFrame."""
    available = [c for c in FEATURE_COLS if c in df.columns]
    missing   = [c for c in FEATURE_COLS if c not in df.columns]
    if missing:
        logger.warning(f"Missing feature columns (will be zero-filled): {missing}")
        for c in missing:
            df[c] = 0.0

    X = df[available + missing].copy().fillna(0)
    y = df[TARGET_COL].fillna(0)
    return X, y


# ─── Model Definitions ───────────────────────────────────────────────────────

def build_xgb_pipeline(quick: bool = False) -> Pipeline:
    params = dict(
        n_estimators     = 200 if not quick else 50,
        max_depth        = 6,
        learning_rate    = 0.05,
        subsample        = 0.8,
        colsample_bytree = 0.8,
        min_child_weight = 10,
        reg_alpha        = 0.1,
        reg_lambda       = 1.0,
        random_state     = 42,
        n_jobs           = -1,
        tree_method      = "hist",
    )
    return Pipeline([
        ("scaler", StandardScaler()),
        ("model",  XGBRegressor(**params)),
    ])


def build_rf_pipeline(quick: bool = False) -> Pipeline:
    params = dict(
        n_estimators = 200 if not quick else 50,
        max_depth    = 12,
        min_samples_leaf = 15,
        max_features = "sqrt",
        random_state = 42,
        n_jobs       = -1,
    )
    return Pipeline([
        ("model", RandomForestRegressor(**params)),
    ])


# ─── Cross-Validation ────────────────────────────────────────────────────────

def cross_validate_model(pipeline, X: pd.DataFrame, y: pd.Series,
                         label: str, n_splits: int = 5) -> dict:
    """
    TimeSeriesSplit CV on training data.
    Returns per-fold and mean metrics.
    """
    tscv = TimeSeriesSplit(n_splits=n_splits)
    fold_results = []

    for fold, (tr_idx, val_idx) in enumerate(tscv.split(X), 1):
        X_tr, X_val = X.iloc[tr_idx], X.iloc[val_idx]
        y_tr, y_val = y.iloc[tr_idx], y.iloc[val_idx]

        pipeline.fit(X_tr, y_tr)
        preds = pipeline.predict(X_val)

        rmse = np.sqrt(mean_squared_error(y_val, preds))
        mae  = mean_absolute_error(y_val, preds)
        r2   = r2_score(y_val, preds)

        fold_results.append({"fold": fold, "rmse": rmse, "mae": mae, "r2": r2})
        logger.debug(f"  {label} fold {fold}: RMSE={rmse:.3f}  MAE={mae:.3f}  R²={r2:.3f}")

    df = pd.DataFrame(fold_results)
    mean = df.mean(numeric_only=True).to_dict()
    logger.info(
        f"{label:20s} CV mean — RMSE: {mean['rmse']:.3f}  "
        f"MAE: {mean['mae']:.3f}  R²: {mean['r2']:.3f}"
    )
    return {"per_fold": fold_results, "mean": mean}


# ─── Ensemble Weight Tuning ──────────────────────────────────────────────────

def find_best_ensemble_weight(xgb_preds: np.ndarray, rf_preds: np.ndarray,
                               y_true: np.ndarray) -> float:
    """
    Find the scalar w ∈ [0, 1] that minimises RMSE of:
        ensemble = w * xgb + (1-w) * rf
    """
    def objective(w):
        blend = w * xgb_preds + (1 - w) * rf_preds
        return np.sqrt(mean_squared_error(y_true, blend))

    result = minimize_scalar(objective, bounds=(0.0, 1.0), method="bounded")
    return float(result.x)


# ─── Feature Importance ──────────────────────────────────────────────────────

def extract_feature_importance(xgb_pipe, rf_pipe, feature_names: list[str]) -> pd.DataFrame:
    xgb_imp = xgb_pipe.named_steps["model"].feature_importances_
    rf_imp  = rf_pipe.named_steps["model"].feature_importances_

    df = pd.DataFrame({
        "feature":       feature_names,
        "xgb_importance": xgb_imp,
        "rf_importance":  rf_imp,
        "mean_importance": (xgb_imp + rf_imp) / 2,
    }).sort_values("mean_importance", ascending=False)

    return df


# ─── Evaluation Report ───────────────────────────────────────────────────────

def evaluate_on_test(xgb_pipe, rf_pipe, xgb_w: float,
                     X_test: pd.DataFrame, y_test: pd.Series,
                     test_df: pd.DataFrame) -> dict:
    xgb_preds = xgb_pipe.predict(X_test)
    rf_preds  = rf_pipe.predict(X_test)
    ens_preds = xgb_w * xgb_preds + (1 - xgb_w) * rf_preds

    results = {}
    for name, preds in [("XGBoost", xgb_preds), ("RandomForest", rf_preds), ("Ensemble", ens_preds)]:
        rmse = np.sqrt(mean_squared_error(y_test, preds))
        mae  = mean_absolute_error(y_test, preds)
        r2   = r2_score(y_test, preds)
        results[name] = {"rmse": rmse, "mae": mae, "r2": r2}

    # Per-format breakdown for ensemble
    if "match_format" in test_df.columns:
        for fmt in test_df["match_format"].unique():
            mask = (test_df["match_format"] == fmt).values
            if mask.sum() < 10:
                continue
            fmt_preds = ens_preds[mask]
            fmt_true  = y_test.values[mask]
            results[f"Ensemble_{fmt}"] = {
                "rmse": np.sqrt(mean_squared_error(fmt_true, fmt_preds)),
                "mae":  mean_absolute_error(fmt_true, fmt_preds),
                "r2":   r2_score(fmt_true, fmt_preds),
                "n":    int(mask.sum()),
            }

    return results


def format_report(cv_xgb: dict, cv_rf: dict, test_results: dict,
                  xgb_w: float, feat_imp: pd.DataFrame) -> str:
    lines = [
        "=" * 65,
        "  CRICKET ANALYTICS ENGINE — MODEL EVALUATION REPORT",
        "=" * 65,
        "",
        "── Cross-Validation (TimeSeriesSplit, 5 folds, TRAIN set) ──────",
        f"  XGBoost      RMSE: {cv_xgb['mean']['rmse']:.3f}  "
        f"MAE: {cv_xgb['mean']['mae']:.3f}  R²: {cv_xgb['mean']['r2']:.3f}",
        f"  RandomForest RMSE: {cv_rf['mean']['rmse']:.3f}  "
        f"MAE: {cv_rf['mean']['mae']:.3f}  R²: {cv_rf['mean']['r2']:.3f}",
        "",
        "── Held-Out Test Set Performance ──────────────────────────────",
    ]
    for model, metrics in test_results.items():
        n_str = f"  (n={metrics['n']:,})" if "n" in metrics else ""
        lines.append(
            f"  {model:20s} RMSE: {metrics['rmse']:.3f}  "
            f"MAE: {metrics['mae']:.3f}  R²: {metrics['r2']:.3f}{n_str}"
        )
    lines += [
        "",
        f"── Ensemble Weights ───────────────────────────────────────────",
        f"  XGBoost weight  : {xgb_w:.3f}",
        f"  RandomForest wt : {1 - xgb_w:.3f}",
        "",
        "── Top 20 Features by Mean Importance ─────────────────────────",
    ]
    for _, row in feat_imp.head(20).iterrows():
        bar = "█" * int(row["mean_importance"] * 200)
        lines.append(f"  {row['feature']:35s} {row['mean_importance']:.4f}  {bar}")
    lines += ["", "=" * 65]
    return "\n".join(lines)


# ─── Entry Point ─────────────────────────────────────────────────────────────

def main() -> None:
    parser = argparse.ArgumentParser(description="Train XGBoost + RF ensemble")
    parser.add_argument("--formats", nargs="+", default=None, choices=["t20", "odi", "test"])
    parser.add_argument("--quick", action="store_true",
                        help="Use fewer trees for fast iteration during development.")
    args = parser.parse_args()

    train_df, test_df = load_splits(args.formats)

    X_train, y_train = get_Xy(train_df)
    X_test,  y_test  = get_Xy(test_df)

    feature_names = list(X_train.columns)

    print("\n" + "─" * 65)
    print("  TRAINING XGBOOST")
    print("─" * 65)
    xgb_pipe = build_xgb_pipeline(args.quick)
    cv_xgb   = cross_validate_model(xgb_pipe, X_train, y_train, label="XGBoost")
    # Final fit on full train set
    xgb_pipe.fit(X_train, y_train)

    print("\n" + "─" * 65)
    print("  TRAINING RANDOM FOREST")
    print("─" * 65)
    rf_pipe  = build_rf_pipeline(args.quick)
    cv_rf    = cross_validate_model(rf_pipe,  X_train, y_train, label="RandomForest")
    rf_pipe.fit(X_train, y_train)

    print("\n" + "─" * 65)
    print("  TUNING ENSEMBLE WEIGHTS")
    print("─" * 65)
    xgb_w = find_best_ensemble_weight(
        xgb_pipe.predict(X_train),
        rf_pipe.predict(X_train),
        y_train.values,
    )
    logger.info(f"Optimal XGBoost weight: {xgb_w:.3f}  RF weight: {1-xgb_w:.3f}")

    print("\n" + "─" * 65)
    print("  EVALUATING ON HELD-OUT TEST SET")
    print("─" * 65)
    test_results = evaluate_on_test(xgb_pipe, rf_pipe, xgb_w,
                                    X_test, y_test, test_df)
    feat_imp     = extract_feature_importance(xgb_pipe, rf_pipe, feature_names)

    # ── Save artefacts ────────────────────────────────────────────────────────
    with open(MODEL_DIR / "xgb_model.pkl", "wb") as f:
        pickle.dump(xgb_pipe, f)
    with open(MODEL_DIR / "rf_model.pkl",  "wb") as f:
        pickle.dump(rf_pipe, f)
    with open(MODEL_DIR / "ensemble_weights.json", "w") as f:
        json.dump({"xgb": xgb_w, "rf": 1 - xgb_w, "feature_cols": feature_names}, f, indent=2)

    feat_imp.to_csv(MODEL_DIR / "feature_importance.csv", index=False)

    cv_df = pd.DataFrame({
        "model":  ["XGBoost"] * len(cv_xgb["per_fold"]) + ["RandomForest"] * len(cv_rf["per_fold"]),
        **{k: [d[k] for d in cv_xgb["per_fold"]] + [d[k] for d in cv_rf["per_fold"]]
           for k in ["fold", "rmse", "mae", "r2"]},
    })
    cv_df.to_csv(MODEL_DIR / "cv_results.csv", index=False)

    report = format_report(cv_xgb, cv_rf, test_results, xgb_w, feat_imp)
    print("\n" + report)
    (MODEL_DIR / "evaluation_report.txt").write_text(report)

    logger.success(
        f"Models saved to {MODEL_DIR}\n"
        f"  xgb_model.pkl | rf_model.pkl | ensemble_weights.json\n"
        "Proceed to 07_optimizer.py"
    )


if __name__ == "__main__":
    main()