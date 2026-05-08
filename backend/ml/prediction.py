"""
ml/prediction.py
----------------
7-day consumption forecast using per-ingredient moving average.

If predicted total usage > current stock → emit alert message.
"""

from __future__ import annotations

import logging
from collections import defaultdict
from datetime import datetime, timedelta
from typing import Optional

logger = logging.getLogger("stockmanager.prediction")


def predict_7day_consumption(
    session,
    ingredient_name: str,
    lookback_days: int = 30,
) -> dict[str, float]:
    """
    Build a 7-day daily consumption forecast using a moving average.

    Args:
        session:          Active SQLAlchemy session.
        ingredient_name:  Canonical ingredient name.
        lookback_days:    Historical window for the average.

    Returns:
        Dict mapping ISO-date strings → predicted daily quantity.
        Empty dict when no history is available.
    """
    from backend.models import Ingredient, UsageLog

    ing = session.query(Ingredient).filter_by(name=ingredient_name).first()
    if not ing:
        return {}

    cutoff = datetime.utcnow() - timedelta(days=lookback_days)
    logs = (
        session.query(UsageLog)
        .filter(
            UsageLog.ingredient_id == ing.id,
            UsageLog.quantity.isnot(None),
            UsageLog.logged_at >= cutoff,
        )
        .all()
    )

    if not logs:
        return {}

    # Aggregate per day
    daily: dict[str, float] = defaultdict(float)
    for log in logs:
        day = log.logged_at.strftime("%Y-%m-%d")
        daily[day] += log.quantity or 0.0

    if not daily:
        return {}

    daily_avg = sum(daily.values()) / lookback_days   # spread over full window

    forecast: dict[str, float] = {}
    today = datetime.utcnow().date()
    for i in range(1, 8):
        day_label = (today + timedelta(days=i)).isoformat()
        forecast[day_label] = round(daily_avg, 4)

    return forecast


def build_alert(
    ingredient_name: str,
    current_stock: float,
    forecast: dict[str, float],
) -> Optional[str]:
    """
    Generate a low-stock alert string if forecast exceeds current stock.

    Returns alert string, or None if stock is sufficient.
    """
    if not forecast or current_stock <= 0:
        return None

    daily_vals = list(forecast.values())
    daily_avg  = sum(daily_vals) / len(daily_vals) if daily_vals else 0.0
    total_next7 = sum(daily_vals)

    if current_stock < total_next7 and daily_avg > 0:
        days_left = max(1, round(current_stock / daily_avg))
        return f"{ingredient_name} will run out in {days_left} day{'s' if days_left != 1 else ''}"

    return None


def forecast_report(session) -> list[dict]:
    """
    Generate a forecast + alert for every ingredient with usage history.

    Returns a list of dicts, one per ingredient.
    """
    from backend.models import Ingredient, Inventory

    ingredients = session.query(Ingredient).all()
    report = []
    for ing in ingredients:
        forecast = predict_7day_consumption(session, ing.name)
        if not forecast:
            continue

        inv = session.query(Inventory).filter_by(ingredient_id=ing.id).first()
        current_stock = inv.current_stock if inv else 0.0
        alert = build_alert(ing.name, current_stock, forecast)

        report.append({
            "ingredient":    ing.name,
            "current_stock": current_stock,
            "unit":          inv.unit if inv else ing.default_unit,
            "forecast":      forecast,
            "alert":         alert,
        })

    return report
