"""
routes/daily_batches.py
-----------------------
POST /api/v1/batches - Add a new daily stock batch.
GET /api/v1/batches/today - Summary of today's purchased stock.
"""

from __future__ import annotations

import logging
from datetime import datetime, time
from typing import List, Optional

from fastapi import APIRouter, HTTPException, Depends, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from sqlalchemy import func

from backend.database import get_db
from backend.models import DailyStockBatch, Ingredient, Inventory

logger = logging.getLogger("stockmanager.routes.batches")

router = APIRouter(tags=["Daily Batches"])

# ── Schemas ────────────────────────────────────────────────────────────────

class BatchCreateRequest(BaseModel):
    ingredient_id:      int
    purchased_quantity: float
    unit:               str
    supplier_name:      Optional[str] = None
    purchase_cost:      Optional[float] = None

class BatchResponse(BaseModel):
    id:                 int
    ingredient_id:      int
    ingredient_name:    str
    purchased_quantity: float
    remaining_quantity: float
    unit:               str
    supplier_name:      Optional[str]
    purchase_cost:      Optional[float]
    batch_date:         datetime

    class Config:
        from_attributes = True

# ── Routes ──────────────────────────────────────────────────────────────────

@router.post("/", response_model=BatchResponse, status_code=status.HTTP_201_CREATED)
def create_batch(payload: BatchCreateRequest, db: Session = Depends(get_db)):
    """
    Add a new daily stock batch and update inventory.
    """
    ingredient = db.query(Ingredient).filter(Ingredient.id == payload.ingredient_id).first()
    if not ingredient:
        raise HTTPException(status_code=404, detail="Ingredient not found")

    try:
        # Create the batch
        new_batch = DailyStockBatch(
            ingredient_id=payload.ingredient_id,
            purchased_quantity=payload.purchased_quantity,
            remaining_quantity=payload.purchased_quantity,  # Initially all is remaining
            allocated_quantity=0.0,
            unit=payload.unit,
            supplier_name=payload.supplier_name,
            purchase_cost=payload.purchase_cost,
            batch_date=datetime.utcnow()
        )
        db.add(new_batch)
        
        # Update Inventory
        inv = db.query(Inventory).filter(Inventory.ingredient_id == payload.ingredient_id).first()
        if not inv:
            inv = Inventory(
                ingredient_id=payload.ingredient_id,
                current_stock=0.0,
                unit=payload.unit,
                reorder_threshold=1.0
            )
            db.add(inv)
        
        inv.current_stock += payload.purchased_quantity
        inv.last_updated = datetime.utcnow()
        
        db.commit()
        db.refresh(new_batch)
        
        # Construct response manually to avoid Pydantic validation errors
        return BatchResponse(
            id=new_batch.id,
            ingredient_id=new_batch.ingredient_id,
            ingredient_name=ingredient.name,
            purchased_quantity=new_batch.purchased_quantity,
            remaining_quantity=new_batch.remaining_quantity,
            unit=new_batch.unit,
            supplier_name=new_batch.supplier_name,
            purchase_cost=new_batch.purchase_cost,
            batch_date=new_batch.batch_date
        )
        
    except Exception as e:
        db.rollback()
        logger.exception("Failed to create batch")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/today", response_model=List[BatchResponse])
def get_today_batches(db: Session = Depends(get_db)):
    """
    Get all batches created today.
    """
    today_start = datetime.combine(datetime.utcnow().date(), time.min)
    batches = db.query(DailyStockBatch).filter(DailyStockBatch.batch_date >= today_start).all()
    
    results = []
    for b in batches:
        ing_name = db.query(Ingredient.name).filter(Ingredient.id == b.ingredient_id).scalar()
        resp = BatchResponse(
            id=b.id,
            ingredient_id=b.ingredient_id,
            ingredient_name=ing_name or "Unknown",
            purchased_quantity=b.purchased_quantity,
            remaining_quantity=b.remaining_quantity,
            unit=b.unit,
            supplier_name=b.supplier_name,
            purchase_cost=b.purchase_cost,
            batch_date=b.batch_date
        )
        results.append(resp)
        
    return results
