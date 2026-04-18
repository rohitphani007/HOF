"""
Pydantic Schemas — strict validation for All-India Land Pricing API
"""

from typing import Literal, Optional, List
from pydantic import BaseModel, Field, field_validator
from enum import Enum


class CityTier(str, Enum):
    TIER1 = "Tier1"
    TIER2 = "Tier2"
    TIER3 = "Tier3"
    RURAL = "Rural"


class LandUseType(str, Enum):
    RESIDENTIAL    = "Residential"
    COMMERCIAL     = "Commercial"
    AGRICULTURAL   = "Agricultural-NA"
    INDUSTRIAL     = "Industrial"
    MIXED          = "Mixed-Use"


class LandPredictRequest(BaseModel):
    city_tier:                  CityTier
    state:                      str = Field(..., min_length=2, max_length=50, example="Maharashtra")
    micro_market:               str = Field(..., min_length=2, max_length=80, example="Bandra West")
    land_use_type:              LandUseType
    land_area_sqft:             float = Field(..., gt=0, le=10_000_000, example=5000.0)
    floor_area_ratio:           float = Field(..., gt=0.0, le=10.0,     example=2.5)
    distance_to_highway_km:     float = Field(..., ge=0.0, le=200.0,    example=2.0)
    distance_to_transit_km:     float = Field(..., ge=0.0, le=100.0,    example=0.8)
    distance_to_city_center_km: float = Field(..., ge=0.0, le=200.0,    example=5.0)
    amenities_score:            int   = Field(..., ge=1,   le=10,        example=8)
    is_rera_approved:           bool  = Field(..., example=True)
    is_vaastu_compliant:        bool  = Field(..., example=True)
    investment_horizon_yrs:     int   = Field(..., ge=1,  le=30,        example=5)

    @field_validator("land_area_sqft")
    @classmethod
    def area_must_be_positive(cls, v: float) -> float:
        if v <= 0:
            raise ValueError("land_area_sqft must be greater than 0")
        return round(v, 2)

    @field_validator("floor_area_ratio")
    @classmethod
    def far_must_be_valid(cls, v: float) -> float:
        if v <= 0:
            raise ValueError("floor_area_ratio must be greater than 0")
        return round(v, 2)

    def to_model_dict(self) -> dict:
        return {
            "city_tier":                  self.city_tier.value,
            "state":                      self.state,
            "micro_market":               self.micro_market,
            "land_use_type":              self.land_use_type.value,
            "land_area_sqft":             self.land_area_sqft,
            "floor_area_ratio":           self.floor_area_ratio,
            "distance_to_highway_km":     self.distance_to_highway_km,
            "distance_to_transit_km":     self.distance_to_transit_km,
            "distance_to_city_center_km": self.distance_to_city_center_km,
            "amenities_score":            self.amenities_score,
            "is_rera_approved":           int(self.is_rera_approved),
            "is_vaastu_compliant":        int(self.is_vaastu_compliant),
            "investment_horizon_yrs":     self.investment_horizon_yrs,
        }

    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "city_tier":                  "Tier1",
                    "state":                      "Maharashtra",
                    "micro_market":               "Bandra West",
                    "land_use_type":              "Residential",
                    "land_area_sqft":             5000,
                    "floor_area_ratio":           2.5,
                    "distance_to_highway_km":     2.0,
                    "distance_to_transit_km":     0.8,
                    "distance_to_city_center_km": 5.0,
                    "amenities_score":            9,
                    "is_rera_approved":           True,
                    "is_vaastu_compliant":        True,
                    "investment_horizon_yrs":     5,
                }
            ]
        }
    }


class PricePrediction(BaseModel):
    price_per_sqft_inr:     float
    total_estimated_price:  float
    lower_bound_per_sqft:   float
    upper_bound_per_sqft:   float
    lower_bound_total:      float
    upper_bound_total:      float
    rental_yield_pct:       float
    annual_rental_income:   float
    formatted: dict


class LandPredictResponse(BaseModel):
    status:     str = "success"
    prediction: PricePrediction
    input:      dict


class PropertyImage(BaseModel):
    label: str
    url:   str


class PropertyFeatures(BaseModel):
    city_tier:                  str
    state:                      str
    micro_market:               str
    land_use_type:              str
    land_area_sqft:             float
    floor_area_ratio:           float
    distance_to_highway_km:     float
    distance_to_transit_km:     float
    distance_to_city_center_km: float
    amenities_score:            int
    is_rera_approved:           bool
    is_vaastu_compliant:        bool


class PropertyItem(BaseModel):
    id:                 int
    title:              str
    type:               str
    address:            str
    city:               str
    state:              str
    lat:                float
    lng:                float
    price_range:        str
    price_per_sqft_range: str
    rental_yield_pct:   str
    builder:            str
    description:        str
    features:           PropertyFeatures
    images:             List[PropertyImage]
    tags:               List[str]


class FeaturedPropertiesResponse(BaseModel):
    status:     str = "success"
    count:      int
    properties: List[PropertyItem]


class HealthResponse(BaseModel):
    status:          str
    model_loaded:    bool
    price_r2:        Optional[float]
    price_mape_pct:  Optional[float]
    cv_r2_mean:      Optional[float]
    model_version:   str = "v2.0-xgb-india"


# ─────────────────────────────────────────────────────────────
#  ANALYZE — PropFi Investment Analysis
# ─────────────────────────────────────────────────────────────

class AnalyzeRequest(BaseModel):
    """Request body for full property investment analysis.
    Accepts the same 13 features as the predict endpoint plus an optional property_id.
    """
    property_id:                Optional[int]  = Field(None, example=3)
    city_tier:                  CityTier
    state:                      str = Field(..., min_length=2, max_length=50, example="Karnataka")
    micro_market:               str = Field(..., min_length=2, max_length=80, example="Whitefield")
    land_use_type:              LandUseType
    land_area_sqft:             float = Field(..., gt=0, le=10_000_000, example=4000.0)
    floor_area_ratio:           float = Field(..., gt=0.0, le=10.0,     example=2.0)
    distance_to_highway_km:     float = Field(..., ge=0.0, le=200.0,    example=3.0)
    distance_to_transit_km:     float = Field(..., ge=0.0, le=100.0,    example=1.5)
    distance_to_city_center_km: float = Field(..., ge=0.0, le=200.0,    example=12.0)
    amenities_score:            int   = Field(..., ge=1,   le=10,        example=8)
    is_rera_approved:           bool  = Field(..., example=True)
    is_vaastu_compliant:        bool  = Field(..., example=False)
    investment_horizon_yrs:     int   = Field(..., ge=1,  le=30,        example=5)

    def to_model_dict(self) -> dict:
        return {
            "city_tier":                  self.city_tier.value,
            "state":                      self.state,
            "micro_market":               self.micro_market,
            "land_use_type":              self.land_use_type.value,
            "land_area_sqft":             self.land_area_sqft,
            "floor_area_ratio":           self.floor_area_ratio,
            "distance_to_highway_km":     self.distance_to_highway_km,
            "distance_to_transit_km":     self.distance_to_transit_km,
            "distance_to_city_center_km": self.distance_to_city_center_km,
            "amenities_score":            self.amenities_score,
            "is_rera_approved":           int(self.is_rera_approved),
            "is_vaastu_compliant":        int(self.is_vaastu_compliant),
            "investment_horizon_yrs":     self.investment_horizon_yrs,
        }

    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "property_id": 3,
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
                    "is_rera_approved": True,
                    "is_vaastu_compliant": False,
                    "investment_horizon_yrs": 5,
                }
            ]
        }
    }


class ForecastBreakdown(BaseModel):
    three_months_pct:  float = Field(..., alias="3_months_pct")
    six_months_pct:    float = Field(..., alias="6_months_pct")
    twelve_months_pct: float = Field(..., alias="12_months_pct")

    model_config = {"populate_by_name": True}


class AnalyzeResponse(BaseModel):
    status:                   str = "success"
    property_id:              Optional[int]
    # Pricing
    price_per_sqft_inr:       float
    total_estimated_price:    float
    formatted_price:          str
    formatted_confidence:     str
    rental_yield_pct:         float
    annual_rental_income:     float
    # Risk
    risk_score:               float
    risk_label:               str
    risk_icon:                str
    # Forecast
    annual_appreciation_pct:  float
    forecast:                 ForecastBreakdown
    # Verdict
    recommendation:           str
    recommendation_color:     str
    summary:                  str
    input:                    dict
