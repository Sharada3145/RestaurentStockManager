"""
services/inventory_service.py
------------------------------
Inventory deduction, reorder-threshold alerts, and stock management helpers.
"""

from __future__ import annotations

import logging
from datetime import datetime
from typing import Optional

logger = logging.getLogger("stockmanager.inventory")


def deduct_stock(
    session,
    ingredient_id: int,
    quantity: float,
    unit: str,
) -> Optional[float]:
    """
    Subtract *quantity* from the inventory row for *ingredient_id*.

    Clamps to 0 (stock can never go negative).

    Returns:
        New current_stock value, or None if no inventory row exists.
    """
    from backend.models import Inventory

    inv = session.query(Inventory).filter_by(ingredient_id=ingredient_id).first()
    if inv is None:
        logger.debug("[inventory] no inventory row for ingredient_id=%s", ingredient_id)
        return None

    if inv.current_stock < float(quantity):
        logger.warning(
            "[inventory] insufficient stock for ingredient_id=%s: need %.4f, have %.4f",
            ingredient_id, quantity, inv.current_stock
        )
        raise ValueError(f"Insufficient stock: {inv.current_stock:.2f} available, {quantity:.2f} requested")

    prev_stock = inv.current_stock
    inv.current_stock = max(0.0, prev_stock - float(quantity))
    inv.last_updated  = datetime.utcnow()

    logger.info(
        "[inventory] deducted %.4f %s from ingredient_id=%s  %.4f → %.4f",
        quantity, unit, ingredient_id, prev_stock, inv.current_stock,
    )
    return inv.current_stock


def get_low_stock_alert(
    session,
    ingredient_id: int,
    ingredient_name: str,
) -> Optional[str]:
    """
    Return a low-stock alert string if current stock ≤ reorder_threshold.

    Also checks 7-day forecast to provide a 'will run out in N days' message
    when forecast usage exceeds current stock.
    """
    from backend.models import Inventory
    from backend.ml.prediction import predict_7day_consumption, build_alert

    inv = session.query(Inventory).filter_by(ingredient_id=ingredient_id).first()
    if inv is None:
        return None

    # Threshold-based alert (immediate)
    if inv.current_stock <= inv.reorder_threshold:
        return f"⚠ Low stock: {ingredient_name} ({inv.current_stock:.2f} {inv.unit} remaining)"

    # Forecast-based alert
    forecast = predict_7day_consumption(session, ingredient_name)
    return build_alert(ingredient_name, inv.current_stock, forecast)


def set_stock(
    session,
    ingredient_id: int,
    absolute_value: float,
    unit: Optional[str] = None,
) -> dict:
    """
    Set inventory to an absolute value, creating the row if needed.
    """
    from backend.models import Ingredient, Inventory

    ing = session.query(Ingredient).filter_by(id=ingredient_id).first()
    inv = session.query(Inventory).filter_by(ingredient_id=ingredient_id).first()

    if inv is None:
        inv = Inventory(
            ingredient_id=ingredient_id,
            current_stock=0.0,
            unit=unit or (ing.default_unit if ing else "kg"),
            reorder_threshold=1.0,
        )
        session.add(inv)

    inv.current_stock = max(0.0, float(absolute_value))
    inv.last_updated  = datetime.utcnow()
    if unit:
        inv.unit = unit

    logger.info(
        "[inventory] set ingredient_id=%s → %.4f %s",
        ingredient_id, inv.current_stock, inv.unit,
    )
    return {
        "ingredient_id":  ingredient_id,
        "current_stock":  inv.current_stock,
        "unit":           inv.unit,
    }


def adjust_stock(
    session,
    ingredient_id: int,
    change: float,
    unit: Optional[str] = None,
) -> dict:
    """
    Add (positive) or subtract (negative) *change* from current stock.
    """
    from backend.models import Ingredient, Inventory

    ing = session.query(Ingredient).filter_by(id=ingredient_id).first()
    inv = session.query(Inventory).filter_by(ingredient_id=ingredient_id).first()

    if inv is None:
        inv = Inventory(
            ingredient_id=ingredient_id,
            current_stock=0.0,
            unit=unit or (ing.default_unit if ing else "kg"),
            reorder_threshold=1.0,
        )
        session.add(inv)

    inv.current_stock = max(0.0, inv.current_stock + float(change))
    inv.last_updated  = datetime.utcnow()
    if unit:
        inv.unit = unit

    return {
        "ingredient_id":  ingredient_id,
        "current_stock":  inv.current_stock,
        "unit":           inv.unit,
    }
