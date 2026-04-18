# PropFi AI Pricing & Analytics Service

This repository contains the enterprise-grade AI property pricing and risk analytics model built with **FastAPI** and **XGBoost**. It powers the core valuation and analytics for the PropFi fractional real estate platform.

## Setup & Running the API

### Prerequisites
- Python 3.8+ installed

### Setup

1. **Activate the virtual environment**:
   ```bash
   .\venv\Scripts\activate
   ```

2. **Install requirements**:
   ```bash
   pip install -r ai-pricing-service/requirements.txt
   ```

3. **Start the server**:
   ```bash
   cd ai-pricing-service
   python -m uvicorn app.main:app --host 0.0.0.0 --port 8001 --reload
   ```
   The API will start at `http://localhost:8001/`.
   Swagger Documentation is automatically available at: `http://localhost:8001/docs`

---

## API Endpoints

### 1. Health Check
Check if the API and the ML models are loaded successfully.

**Endpoint**: `GET /api/v1/health`

**Example Response**:
```json
{
  "status": "healthy",
  "model_loaded": true,
  "price_r2": 0.992,
  "price_mape_pct": 6.08,
  "cv_r2_mean": 0.9921,
  "model_version": "v2.0-xgb-india"
}
```

### 2. Get Featured Properties
Returns a list of 15 rich, diverse Indian land parcels with coordinates, metadata, and high-quality images.

**Endpoint**: `GET /api/v1/properties/featured`

### 3. Full Investment Analysis (Analyze)
Takes 13 property features and returns a full PropFi investor dashboard analysis, including Pricing, Risk, Yield, and Appreciation forecasts.

**Endpoint**: `POST /api/v1/analyze`

**Content-Type**: `application/json`

**Payload**:
```json
{
    "property_id": 7,
    "city_tier": "Tier1",
    "state": "Karnataka",
    "micro_market": "Whitefield",
    "land_use_type": "Residential",
    "land_area_sqft": 4000,
    "floor_area_ratio": 2.0,
    "distance_to_highway_km": 3.0,
    "distance_to_transit_km": 1.5,
    "distance_to_city_center_km": 12.0,
    "amenities_score": 8,
    "is_rera_approved": true,
    "is_vaastu_compliant": false,
    "investment_horizon_yrs": 5
}
```

**Example Response**:
```json
{
  "status": "success",
  "property_id": 7,
  "price_per_sqft_inr": 9947.50,
  "total_estimated_price": 39790000.0,
  "formatted_price": "INR 3.98 Cr",
  "formatted_confidence": "INR 3.66 Cr – INR 4.30 Cr",
  "rental_yield_pct": 3.541,
  "annual_rental_income": 1408963.9,
  "risk_score": 7.1,
  "risk_label": "Low Risk",
  "risk_icon": "🟡",
  "annual_appreciation_pct": 13.21,
  "forecast": {
    "3_months_pct": 3.3,
    "6_months_pct": 6.6,
    "12_months_pct": 13.21
  },
  "recommendation": "Strong Buy",
  "recommendation_color": "green",
  "summary": "🟡 Low Risk | Expected +6.6% in 6 months | Strong Buy",
  "input": { ... }
}
```

---

## Integration Handoff Notes

### For Person 3 (Frontend)
- View the interactive Swagger UI at `http://localhost:8001/docs` to test endpoints and see exact schemas.
- Use the `POST /api/v1/analyze` endpoint when an investor views a property details page to populate the pricing graph, the risk gauge (use `risk_score` / 10), and the investment recommendation banner.

### For Person 4 (Integration / Smart Contracts)
- The tokenization logic should use the `total_estimated_price` as the base NAV (Net Asset Value) for the property liquidity pool.
- Rental yields (`annual_rental_income`) should guide the APY distributed to fractional token holders.
