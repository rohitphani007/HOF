"""
PropFi Analytics Engine
- Risk Score (1-10 investment safety rating) via Random Forest Classifier
- Price Appreciation Forecast (% change in 3/6/12 months) via XGBoost Regressor
- Trained on same 200k geo-aware dataset as pricing model
"""

import os
import json
import time
import joblib
import numpy as np
import pandas as pd

from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.metrics import classification_report
from xgboost import XGBRegressor

import sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from data_gen import generate_all_india_land_data, GEO_CONFIG

ARTIFACTS_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "artifacts")
RISK_PIPELINE_PATH    = os.path.join(ARTIFACTS_DIR, "risk_pipeline.joblib")
FORECAST_PIPELINE_PATH = os.path.join(ARTIFACTS_DIR, "forecast_pipeline.joblib")

NUMERIC_FEATURES = [
    "land_area_sqft", "floor_area_ratio",
    "distance_to_highway_km", "distance_to_transit_km",
    "distance_to_city_center_km", "amenities_score",
    "is_rera_approved", "is_vaastu_compliant", "investment_horizon_yrs",
]
CATEGORICAL_FEATURES = ["city_tier", "land_use_type", "state", "micro_market"]
ALL_FEATURES = NUMERIC_FEATURES + CATEGORICAL_FEATURES


# ─────────────────────────────────────────────────────────────
#  FEATURE ENGINEERING
# ─────────────────────────────────────────────────────────────
def add_engineered_features(df: pd.DataFrame) -> pd.DataFrame:
    """Add risk label and appreciation rate to dataframe."""
    # Risk label (1=Very High Risk → 10=Very Low Risk = safe investment)
    # Factors: RERA, amenities, transit, tier
    tier_score = df["city_tier"].map({"Tier1": 4, "Tier2": 2, "Tier3": 1, "Rural": 0}).fillna(0)
    raw_risk = (
        df["is_rera_approved"] * 2.5
        + df["amenities_score"] * 0.3
        + tier_score * 0.8
        + (1 / (df["distance_to_transit_km"] + 0.1)) * 0.5
        - (df["distance_to_city_center_km"] * 0.02)
        + df["is_vaastu_compliant"] * 0.4
        + (df["floor_area_ratio"] * 0.3)
    )
    # Normalise to 1–10
    lo, hi = raw_risk.min(), raw_risk.max()
    df["risk_score"] = ((raw_risk - lo) / (hi - lo) * 9 + 1).round(1)
    df["risk_label"] = df["risk_score"].apply(
        lambda x: "Very Low Risk" if x >= 8 else
                  "Low Risk"      if x >= 6 else
                  "Medium Risk"   if x >= 4 else
                  "High Risk"     if x >= 2 else "Very High Risk"
    )

    # Annual appreciation rate (% p.a.) driven by geo + amenities
    tier_apprec = df["city_tier"].map({"Tier1": 8.0, "Tier2": 12.0, "Tier3": 15.0, "Rural": 6.0}).fillna(8.0)
    base_apprec = (
        tier_apprec
        + df["amenities_score"] * 0.4
        - df["distance_to_transit_km"] * 0.15
        - df["distance_to_city_center_km"] * 0.05
        + df["is_rera_approved"] * 1.5
        + df["floor_area_ratio"] * 0.5
    )
    noise = np.random.default_rng(99).normal(0, 1.5, len(df))
    df["annual_appreciation_pct"] = (base_apprec + noise).clip(1.0, 35.0).round(2)
    return df


# ─────────────────────────────────────────────────────────────
#  PREPROCESSING PIPELINE (shared)
# ─────────────────────────────────────────────────────────────
def make_preprocessor():
    return ColumnTransformer(
        transformers=[
            ("num", StandardScaler(), NUMERIC_FEATURES),
            ("cat", OneHotEncoder(handle_unknown="ignore", sparse_output=False), CATEGORICAL_FEATURES),
        ],
        remainder="drop",
    )


# ─────────────────────────────────────────────────────────────
#  TRAIN RISK CLASSIFIER
# ─────────────────────────────────────────────────────────────
def train_risk_model(df: pd.DataFrame):
    df = add_engineered_features(df.copy())
    # Discretise risk_score into 5 classes
    df["risk_class"] = pd.cut(
        df["risk_score"], bins=[0, 2, 4, 6, 8, 10],
        labels=["Very High Risk", "High Risk", "Medium Risk", "Low Risk", "Very Low Risk"]
    )
    X = df[ALL_FEATURES]
    y = df["risk_class"].astype(str)

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)

    pipeline = Pipeline([
        ("preprocessor", make_preprocessor()),
        ("model", RandomForestClassifier(
            n_estimators=400, max_depth=14, min_samples_leaf=5,
            class_weight="balanced", random_state=42, n_jobs=-1
        ))
    ])
    print("  Training Risk Classifier...")
    t0 = time.time()
    pipeline.fit(X_train, y_train)
    print(f"  Training time: {time.time()-t0:.1f}s")

    acc = pipeline.score(X_test, y_test)
    print(f"  Risk Model Accuracy: {acc:.4f}")
    # 5-fold CV
    cv = cross_val_score(pipeline, X_train, y_train, cv=5, scoring="accuracy", n_jobs=-1)
    print(f"  CV Accuracy: {cv.mean():.4f} +/- {cv.std():.4f}")

    joblib.dump(pipeline, RISK_PIPELINE_PATH, compress=3)
    print(f"  Saved: {RISK_PIPELINE_PATH}")
    return pipeline, acc, cv.mean()


# ─────────────────────────────────────────────────────────────
#  TRAIN APPRECIATION FORECASTER
# ─────────────────────────────────────────────────────────────
def train_forecast_model(df: pd.DataFrame):
    df = add_engineered_features(df.copy())
    X = df[ALL_FEATURES]
    y = df["annual_appreciation_pct"].values

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    pipeline = Pipeline([
        ("preprocessor", make_preprocessor()),
        ("model", XGBRegressor(
            n_estimators=600, learning_rate=0.05, max_depth=7,
            subsample=0.8, colsample_bytree=0.8,
            tree_method="hist", random_state=42, n_jobs=-1
        ))
    ])
    print("  Training Appreciation Forecaster...")
    t0 = time.time()
    pipeline.fit(X_train, y_train)
    print(f"  Training time: {time.time()-t0:.1f}s")

    from sklearn.metrics import r2_score, mean_absolute_error
    y_pred = pipeline.predict(X_test)
    r2  = r2_score(y_test, y_pred)
    mae = mean_absolute_error(y_test, y_pred)
    print(f"  Forecast R2={r2:.4f}  MAE={mae:.2f}%")

    joblib.dump(pipeline, FORECAST_PIPELINE_PATH, compress=3)
    print(f"  Saved: {FORECAST_PIPELINE_PATH}")
    return pipeline, r2


# ─────────────────────────────────────────────────────────────
#  INFERENCE INTERFACE (used by API)
# ─────────────────────────────────────────────────────────────
_risk_pipeline     = None
_forecast_pipeline = None


def load_analytics_pipelines():
    global _risk_pipeline, _forecast_pipeline
    _risk_pipeline     = joblib.load(RISK_PIPELINE_PATH)
    _forecast_pipeline = joblib.load(FORECAST_PIPELINE_PATH)
    print("Analytics pipelines loaded.")


RISK_EMOJI = {
    "Very Low Risk": "🟢", "Low Risk": "🟡",
    "Medium Risk": "🟠", "High Risk": "🔴", "Very High Risk": "⛔"
}
RISK_SCORE_MAP = {
    "Very Low Risk": 9.2, "Low Risk": 7.1,
    "Medium Risk": 5.0, "High Risk": 3.0, "Very High Risk": 1.5
}


def analyze_investment(features: dict) -> dict:
    """
    Full PropFi investment analysis:
    - Risk score (1-10) + label
    - Price appreciation forecast (3 / 6 / 12 months)
    - Investment recommendation
    """
    if _risk_pipeline is None:
        load_analytics_pipelines()

    df = pd.DataFrame([features])

    risk_label  = _risk_pipeline.predict(df)[0]
    risk_score  = RISK_SCORE_MAP.get(risk_label, 5.0)
    risk_icon   = RISK_EMOJI.get(risk_label, "🟠")

    annual_apprec = float(_forecast_pipeline.predict(df)[0])
    annual_apprec = round(max(annual_apprec, 0.5), 2)

    apprec_3m  = round(annual_apprec / 4, 2)
    apprec_6m  = round(annual_apprec / 2, 2)
    apprec_12m = annual_apprec

    # Recommendation
    if risk_score >= 7 and annual_apprec >= 10:
        recommendation = "Strong Buy"
        rec_color = "green"
    elif risk_score >= 5 and annual_apprec >= 6:
        recommendation = "Buy"
        rec_color = "blue"
    elif risk_score >= 4:
        recommendation = "Hold"
        rec_color = "yellow"
    else:
        recommendation = "Caution"
        rec_color = "red"

    return {
        "risk_score":         round(risk_score, 1),
        "risk_label":         risk_label,
        "risk_icon":          risk_icon,
        "annual_appreciation_pct":  apprec_12m,
        "forecast": {
            "3_months_pct":  apprec_3m,
            "6_months_pct":  apprec_6m,
            "12_months_pct": apprec_12m,
        },
        "recommendation":  recommendation,
        "recommendation_color": rec_color,
        "summary": (
            f"{risk_icon} {risk_label} | "
            f"Expected +{apprec_6m}% in 6 months | "
            f"{recommendation}"
        ),
    }


# ─────────────────────────────────────────────────────────────
if __name__ == "__main__":
    print("=" * 60)
    print("  PROPFI ANALYTICS MODEL TRAINING")
    print("=" * 60)

    print("\nGenerating 200,000 rows...")
    df = generate_all_india_land_data(200_000)

    print("\n[1/2] Risk Classifier")
    risk_pipe, risk_acc, risk_cv = train_risk_model(df)

    print("\n[2/2] Appreciation Forecaster")
    forecast_pipe, forecast_r2 = train_forecast_model(df)

    print("\n" + "=" * 60)
    print(f"  Risk Accuracy : {risk_acc:.4f}  |  CV: {risk_cv:.4f}")
    print(f"  Forecast R2   : {forecast_r2:.4f}")
    print("=" * 60)

    # Sanity check
    sample = {
        "city_tier": "Tier2", "state": "Goa", "micro_market": "Assagao",
        "land_use_type": "Residential", "land_area_sqft": 6500,
        "floor_area_ratio": 0.6, "distance_to_highway_km": 2.5,
        "distance_to_transit_km": 15.0, "distance_to_city_center_km": 12.0,
        "amenities_score": 9, "is_rera_approved": 1,
        "is_vaastu_compliant": 0, "investment_horizon_yrs": 7,
    }
    result = analyze_investment(sample)
    print(f"\nSample Analysis - Assagao, Goa:")
    print(f"  Risk         : [{result['risk_label']}] Score={result['risk_score']}/10")
    print(f"  +6m Forecast : +{result['forecast']['6_months_pct']}%")
    print(f"  +12m Forecast: +{result['forecast']['12_months_pct']}%")
    print(f"  Verdict      : {result['recommendation']}")
