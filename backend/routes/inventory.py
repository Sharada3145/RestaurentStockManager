"""
routes/inventory.py
-------------------
GET  /api/v1/inventory           – List all inventory items with low-stock alerts
POST /api/v1/inventory           – Update stock (absolute or delta)
GET  /api/v1/inventory/low-stock – Items below reorder threshold only
POST /api/v1/restock             – Add stock (replenishment event)
"""

from __future__ import annotations

import logging
from datetime import datetime
from typing import List, Optional

from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.exc import SQLAlchemyError

logger = logging.getLogger("stockmanager.routes.inventory")

router = APIRouter(tags=["Inventory"])


# ── Schemas ────────────────────────────────────────────────────────────────

class InventoryUpdateRequest(BaseModel):
    ingredient_name:   str
    change:            Optional[float] = None   # delta (positive = add, negative = remove)
    set_absolute:      Optional[float] = None   # set to exact value
    unit:              Optional[str]   = None
    reorder_threshold: Optional[float] = None


class RestockRequest(BaseModel):
    ingredient_name: str
    quantity:        float
    unit:            Optional[str] = None
    note:            Optional[str] = None


class InventoryItemResponse(BaseModel):
    ingredient:        str
    category:          str
    current_stock:     float
    opening_stock:     float
    used_today:        float
    unit:              str
    reorder_threshold: float
    last_updated:      datetime
    alert:             Optional[str] = None
    status:            str  # CRITICAL, WARNING, HEALTHY


class RestockResponse(BaseModel):
    message:       str
    ingredient:    str
    quantity_added: float
    new_stock:     float
    unit:          str


# ── Routes ─────────────────────────────────────────────────────────────────

@router.get(
    "/inventory",
    response_model=List[InventoryItemResponse],
    summary="Get full inventory with daily operation metrics",
)
def get_inventory():
    from sqlalchemy import func
    from backend.database import get_session
    from backend.models import Ingredient, Inventory, UsageLog, DailyStockBatch
    from backend.services.inventory_service import get_low_stock_alert

    session = get_session()
    try:
        today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
        items = session.query(Inventory).all()
        result = []
        for inv in items:
            ing = session.query(Ingredient).filter_by(id=inv.ingredient_id).first()
            if not ing:
                continue

            # Calculate usage today
            used_today = session.query(func.sum(UsageLog.quantity)).filter(
                UsageLog.ingredient_id == inv.ingredient_id,
                UsageLog.logged_at >= today_start
            ).scalar() or 0.0

            # Calculate purchases today
            purchased_today = session.query(func.sum(DailyStockBatch.purchased_quantity)).filter(
                DailyStockBatch.ingredient_id == inv.ingredient_id,
                DailyStockBatch.batch_date >= today_start
            ).scalar() or 0.0

            # Opening stock for today
            opening_stock = inv.current_stock + used_today - purchased_today

            # Determine status
            # Using opening_stock as the reference for percentage if possible, else reorder_threshold
            ref_value = max(opening_stock, inv.reorder_threshold * 2)
            ratio = inv.current_stock / ref_value if ref_value > 0 else 0
            
            if ratio < 0.1 or inv.current_stock <= inv.reorder_threshold * 0.5:
                status_str = "CRITICAL"
            elif ratio < 0.3 or inv.current_stock <= inv.reorder_threshold:
                status_str = "WARNING"
            else:
                status_str = "HEALTHY"

            alert = get_low_stock_alert(session, inv.ingredient_id, ing.name)
            
            result.append(InventoryItemResponse(
                ingredient=ing.name,
                category=ing.category,
                current_stock=inv.current_stock,
                opening_stock=opening_stock,
                used_today=used_today,
                unit=inv.unit,
                reorder_threshold=inv.reorder_threshold,
                last_updated=inv.last_updated,
                alert=alert,
                status=status_str
            ))
        return result
    finally:
        session.close()


@router.get(
    "/inventory/low-stock",
    response_model=List[InventoryItemResponse],
    summary="Get items below reorder threshold",
)
def get_low_stock():
    from backend.database import get_session
    from backend.models import Ingredient, Inventory
    from backend.services.inventory_service import get_low_stock_alert

    session = get_session()
    try:
        items = session.query(Inventory).all()
        result = []
        for inv in items:
            if inv.current_stock > inv.reorder_threshold:
                continue
            ing = session.query(Ingredient).filter_by(id=inv.ingredient_id).first()
            if not ing:
                continue
            alert = get_low_stock_alert(session, inv.ingredient_id, ing.name)
            result.append(InventoryItemResponse(
                ingredient=ing.name,
                category=ing.category,
                current_stock=inv.current_stock,
                unit=inv.unit,
                reorder_threshold=inv.reorder_threshold,
                last_updated=inv.last_updated,
                alert=alert,
            ))
        return result
    finally:
        session.close()


@router.post(
    "/inventory",
    response_model=InventoryItemResponse,
    summary="Update ingredient stock",
)
def update_inventory(payload: InventoryUpdateRequest):
    from backend.database import get_session, rollback_and_log
    from backend.models import Ingredient, Inventory
    from backend.services.inventory_service import (
        adjust_stock, get_low_stock_alert, set_stock,
    )

    session = None
    try:
        session = get_session()
        with session.begin():
            ing = session.query(Ingredient).filter_by(name=payload.ingredient_name).first()
            if not ing:
                raise HTTPException(status_code=404, detail=f"Ingredient '{payload.ingredient_name}' not found")

            if payload.set_absolute is not None:
                set_stock(session, ing.id, payload.set_absolute, payload.unit)
            elif payload.change is not None:
                adjust_stock(session, ing.id, payload.change, payload.unit)

            if payload.reorder_threshold is not None:
                inv = session.query(Inventory).filter_by(ingredient_id=ing.id).first()
                if inv:
                    inv.reorder_threshold = payload.reorder_threshold

        # After commit, we need a fresh query or refresh if we want to return the updated object
        # since it was committed and potentially expired.
        ing = session.query(Ingredient).filter_by(name=payload.ingredient_name).first()
        inv = session.query(Inventory).filter_by(ingredient_id=ing.id).first()
        alert = get_low_stock_alert(session, ing.id, ing.name)

        return InventoryItemResponse(
            ingredient=ing.name,
            category=ing.category,
            current_stock=inv.current_stock if inv else 0.0,
            unit=inv.unit if inv else ing.default_unit,
            reorder_threshold=inv.reorder_threshold if inv else 1.0,
            last_updated=inv.last_updated if inv else datetime.utcnow(),
            alert=alert,
        )

    except HTTPException:
        if session:
            rollback_and_log(session, "HTTPException in update_inventory")
        raise
    except SQLAlchemyError as exc:
        if session:
            rollback_and_log(session, "SQLAlchemyError in update_inventory")
        raise HTTPException(status_code=500, detail="Database failure") from exc
    finally:
        if session:
            session.close()


@router.post(
    "/restock",
    response_model=RestockResponse,
    summary="Add stock for an ingredient (replenishment event)",
)
def restock_ingredient(payload: RestockRequest):
    """
    Dedicated replenishment endpoint — always adds to current stock
    (as opposed to /inventory POST which can set absolute or delta).
    Logs the restock event and returns updated stock level.
    """
    from backend.database import get_session, rollback_and_log
    from backend.models import Ingredient, Inventory
    from backend.services.inventory_service import adjust_stock

    if payload.quantity <= 0:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="quantity must be greater than zero",
        )

    session = None
    try:
        session = get_session()
        with session.begin():
            ing = session.query(Ingredient).filter_by(name=payload.ingredient_name.lower().strip()).first()
            if not ing:
                raise HTTPException(
                    status_code=404,
                    detail=f"Ingredient '{payload.ingredient_name}' not found",
                )

            result = adjust_stock(session, ing.id, payload.quantity, payload.unit)

        # Re-fetch after commit
        ing = session.query(Ingredient).filter_by(id=ing.id).first()
        inv = session.query(Inventory).filter_by(ingredient_id=ing.id).first()
        logger.info(
            "[restock] +%.4f %s for '%s' → %.4f",
            payload.quantity, payload.unit or "units", ing.name, result["current_stock"],
        )

        return RestockResponse(
            message=f"Restocked {ing.name} successfully",
            ingredient=ing.name,
            quantity_added=payload.quantity,
            new_stock=result["current_stock"],
            unit=result["unit"],
        )

    except HTTPException:
        if session:
            rollback_and_log(session, "HTTPException in restock")
        raise
    except SQLAlchemyError as exc:
        if session:
            rollback_and_log(session, "SQLAlchemyError in restock")
        raise HTTPException(status_code=500, detail="Database failure") from exc
    finally:
        if session:
            session.close()
