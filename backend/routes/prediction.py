"""
routes/prediction.py
--------------------
GET /api/v1/prediction   – 7-day forecast for one ingredient
GET /api/v1/forecasts    – Forecast report for all ingredients
"""

from __future__ import annotations

import logging
from typing import List, Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

logger = logging.getLogger("stockmanager.routes.prediction")

router = APIRouter(tags=["Forecasting"])


class PredictionResponse(BaseModel):
    ingredient:    str
    current_stock: Optional[float] = None
    unit:          Optional[str]   = None
    forecast:      dict
    alert:         Optional[str]   = None


class ForecastReportItem(BaseModel):
    ingredient:    str
    current_stock: float
    unit:          str
    forecast:      dict
    alert:         Optional[str] = None


@router.get(
    "/prediction",
    response_model=PredictionResponse,
    summary="7-day consumption forecast for a specific ingredient",
)
def get_prediction(ingredient: str, lookback_days: int = 30):
    from backend.database import get_session
    from backend.models import Ingredient, Inventory
    from backend.ml.prediction import build_alert, predict_7day_consumption

    session = get_session()
    try:
        ing = session.query(Ingredient).filter_by(name=ingredient).first()
        if not ing:
            raise HTTPException(status_code=404, detail=f"Ingredient '{ingredient}' not found")

        forecast = predict_7day_consumption(session, ingredient, lookback_days=lookback_days)

        inv = session.query(Inventory).filter_by(ingredient_id=ing.id).first()
        current_stock = inv.current_stock if inv else None
        unit          = inv.unit if inv else ing.default_unit
        alert         = build_alert(ingredient, current_stock or 0.0, forecast) if current_stock is not None else None

        return PredictionResponse(
            ingredient=ingredient,
            current_stock=current_stock,
            unit=unit,
            forecast=forecast,
            alert=alert,
        )
    finally:
        session.close()


@router.get(
    "/forecasts",
    response_model=List[ForecastReportItem],
    summary="Forecast report for all tracked ingredients",
)
def get_all_forecasts():
    from backend.database import get_session
    from backend.ml.prediction import forecast_report

    session = get_session()
    try:
        report = forecast_report(session)
        return [ForecastReportItem(**item) for item in report]
    finally:
        session.close()
