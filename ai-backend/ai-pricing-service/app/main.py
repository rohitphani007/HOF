"""
FastAPI Main Application — All-India Land Pricing Service
Async, type-checked, CORS-enabled, auto-documented via Swagger at /docs
"""

import os
import sys
import json

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "ml"))

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager

from schemas import (
    LandPredictRequest,
    LandPredictResponse,
    PricePrediction,
    FeaturedPropertiesResponse,
    PropertyItem,
    HealthResponse,
    AnalyzeRequest,
    AnalyzeResponse,
    ForecastBreakdown,
)
from ml.model import predict_land, load_pipelines, PIPELINE_PATH, FEATURE_META_PATH
from ml.analytics import (
    analyze_investment,
    load_analytics_pipelines,
    RISK_PIPELINE_PATH,
    FORECAST_PIPELINE_PATH,
)

# ─────────────────────────────────────────────────────────────
#  DATA FILES
# ─────────────────────────────────────────────────────────────
DATA_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "data")
PROPERTIES_JSON = os.path.join(DATA_DIR, "sample_properties.json")


# ─────────────────────────────────────────────────────────────
#  LIFESPAN — load model on startup
# ─────────────────────────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    print("[Startup] Loading ML pipelines...")
    if os.path.exists(PIPELINE_PATH):
        load_pipelines()
        print("[Startup] Pricing pipelines loaded.")
    else:
        print("[Startup] WARNING: Pricing pipeline not found. Run model.py first.")

    if os.path.exists(RISK_PIPELINE_PATH) and os.path.exists(FORECAST_PIPELINE_PATH):
        load_analytics_pipelines()
        print("[Startup] Analytics pipelines loaded.")
    else:
        print("[Startup] WARNING: Analytics pipelines not found. Run analytics.py first.")
    yield
    print("[Shutdown] Cleaning up.")


# ─────────────────────────────────────────────────────────────
#  APP
# ─────────────────────────────────────────────────────────────
app = FastAPI(
    title="HOF All-India Land Pricing API",
    description="""
## AI-Powered Land Valuation — Pan India Coverage

This microservice predicts **land prices** (price per sqft + total value) and **rental yields**
for any plot across **all 28 Indian states and 8 UTs**.

### Model
- **XGBoost Regressor** trained on 200,000 geo-calibrated synthetic records
- **5-fold Cross Validation** with 80/20 train-test split
- **13 India-specific features** including city tier, micro-market premium, FAR, RERA, Vaastu

### Endpoints
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/v1/predict` | Predict land price + rental yield |
| POST | `/api/v1/analyze` | Full PropFi investment analysis (price + risk + forecast) |
| GET | `/api/v1/properties/featured` | 15-20 rich sample land parcels |
| GET | `/api/v1/health` | Model status + accuracy metrics |
""",
    version="2.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ─────────────────────────────────────────────────────────────
#  HELPERS
# ─────────────────────────────────────────────────────────────
def fmt_inr(amount: float) -> str:
    """Format a number as Indian Rupee string (Cr / L / K)."""
    if amount >= 1e7:
        return f"INR {amount/1e7:.2f} Cr"
    elif amount >= 1e5:
        return f"INR {amount/1e5:.2f} L"
    elif amount >= 1e3:
        return f"INR {amount/1e3:.1f} K"
    return f"INR {amount:,.0f}"


# ─────────────────────────────────────────────────────────────
#  ROUTES
# ─────────────────────────────────────────────────────────────

@app.get("/api/v1/health", response_model=HealthResponse, tags=["System"])
async def health_check():
    """Health check endpoint — returns model load status and accuracy metrics."""
    meta = {}
    if os.path.exists(FEATURE_META_PATH):
        with open(FEATURE_META_PATH) as f:
            meta = json.load(f)

    from ml.model import _price_pipeline
    return HealthResponse(
        status="healthy",
        model_loaded=_price_pipeline is not None,
        price_r2=meta.get("price_metrics", {}).get("test_r2"),
        price_mape_pct=meta.get("price_metrics", {}).get("test_mape_pct"),
        cv_r2_mean=meta.get("price_metrics", {}).get("cv_r2_mean"),
    )


@app.post("/api/v1/predict", response_model=LandPredictResponse, tags=["Prediction"])
async def predict_price(request: LandPredictRequest):
    """
    **Predict land price and rental yield** for a given plot.

    Provide the 13 land features and receive:
    - Price per sqft (INR)
    - Total estimated land value (INR)
    - 95% confidence range
    - Estimated rental yield (%)
    - Annual rental income estimate
    """
    from ml.model import _price_pipeline
    if _price_pipeline is None:
        raise HTTPException(
            status_code=503,
            detail="Model not loaded. Please train the model first by running model.py."
        )

    try:
        features = request.to_model_dict()
        result = predict_land(features)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction error: {str(e)}")

    prediction = PricePrediction(
        **result,
        formatted={
            "price_per_sqft":    fmt_inr(result["price_per_sqft_inr"]),
            "total_price":       fmt_inr(result["total_estimated_price"]),
            "lower_bound":       fmt_inr(result["lower_bound_total"]),
            "upper_bound":       fmt_inr(result["upper_bound_total"]),
            "annual_income":     fmt_inr(result["annual_rental_income"]),
            "rental_yield":      f"{result['rental_yield_pct']:.2f}%",
            "confidence_range":  f"{fmt_inr(result['lower_bound_total'])} – {fmt_inr(result['upper_bound_total'])}",
        }
    )
    return LandPredictResponse(prediction=prediction, input=request.model_dump())


@app.get("/api/v1/properties/featured", response_model=FeaturedPropertiesResponse, tags=["Properties"])
async def featured_properties():
    """
    **Returns 15-20 curated land parcels** across India with rich metadata,
    coordinates, builder info, and high-quality Unsplash image sets.
    """
    if not os.path.exists(PROPERTIES_JSON):
        raise HTTPException(status_code=503, detail="Sample properties data not found.")

    with open(PROPERTIES_JSON, encoding="utf-8") as f:
        data = json.load(f)

    properties = [PropertyItem(**p) for p in data]
    return FeaturedPropertiesResponse(count=len(properties), properties=properties)


@app.post("/api/v1/analyze", response_model=AnalyzeResponse, tags=["Analysis"])
async def analyze_property(request: AnalyzeRequest):
    """
    **Full PropFi Investment Analysis** — single call returns everything the frontend needs:

    | Output | Description |
    |--------|-------------|
    | Price per sqft + total value | XGBoost pricing model (R²=0.992) |
    | 95% confidence range | Bootstrap uncertainty estimate |
    | Rental yield % | Annual income if developed |
    | Risk score (1-10) | Random Forest safety rating |
    | Appreciation forecast | 3 / 6 / 12-month % growth |
    | Recommendation | Strong Buy / Buy / Hold / Caution |

    Pass the same 13 land features as `/api/v1/predict`.
    """
    from ml.model import _price_pipeline
    from ml.analytics import _risk_pipeline

    if _price_pipeline is None:
        raise HTTPException(status_code=503, detail="Pricing model not loaded. Run model.py first.")
    if _risk_pipeline is None:
        raise HTTPException(status_code=503, detail="Analytics models not loaded. Run analytics.py first.")

    features = request.to_model_dict()

    # 1. Pricing prediction
    try:
        pricing = predict_land(features)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Pricing error: {e}")

    # 2. Risk + Forecast analysis
    try:
        analysis = analyze_investment(features)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analytics error: {e}")

    forecast_raw = analysis["forecast"]

    return AnalyzeResponse(
        property_id=request.property_id,
        # Pricing
        price_per_sqft_inr=pricing["price_per_sqft_inr"],
        total_estimated_price=pricing["total_estimated_price"],
        formatted_price=fmt_inr(pricing["total_estimated_price"]),
        formatted_confidence=(
            f"{fmt_inr(pricing['lower_bound_total'])} – {fmt_inr(pricing['upper_bound_total'])}"
        ),
        rental_yield_pct=pricing["rental_yield_pct"],
        annual_rental_income=pricing["annual_rental_income"],
        # Risk
        risk_score=analysis["risk_score"],
        risk_label=analysis["risk_label"],
        risk_icon=analysis["risk_icon"],
        # Forecast
        annual_appreciation_pct=analysis["annual_appreciation_pct"],
        forecast=ForecastBreakdown(
            **{
                "3_months_pct":  forecast_raw["3_months_pct"],
                "6_months_pct":  forecast_raw["6_months_pct"],
                "12_months_pct": forecast_raw["12_months_pct"],
            }
        ),
        # Verdict
        recommendation=analysis["recommendation"],
        recommendation_color=analysis["recommendation_color"],
        summary=analysis["summary"],
        input=request.model_dump(),
    )


# ─────────────────────────────────────────────────────────────
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
