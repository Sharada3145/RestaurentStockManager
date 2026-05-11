"""
routes/stock.py
---------------
POST /api/v1/entry — Multi-item NLP stock entry submission.
"""

from __future__ import annotations

import logging
import re
from datetime import datetime
from typing import List, Optional

from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy.exc import SQLAlchemyError

logger = logging.getLogger("stockmanager.routes.stock")

router = APIRouter(tags=["Stock"])


# ── Schemas ────────────────────────────────────────────────────────────────

class StockEntryRequest(BaseModel):
    raw_text:     str = Field(..., min_length=1, description="Free-form kitchen note")
    chef_name:    str = Field(..., min_length=1)
    manager_name: str = Field(..., min_length=1)


class ItemResult(BaseModel):
    cleaned_text:   str
    quantity:       Optional[float] = None
    unit:           Optional[str]   = None
    ingredient:     str
    confidence:     float
    status:         str
    mapping_method: str
    needs_review:   bool


class StockEntryResponse(BaseModel):
    results: List[ItemResult]
    total_items: int


# ── Route ──────────────────────────────────────────────────────────────────

@router.post(
    "/entry",
    response_model=StockEntryResponse,
    status_code=status.HTTP_200_OK,
    summary="Submit a stock entry (supports multiple items in one note)",
)
def create_entry(payload: StockEntryRequest) -> StockEntryResponse:
    """
    Process a raw kitchen note.  Supports multiple items separated by
    commas, 'and', or '&'.

    **Pipeline per segment:**
    1. Preprocess (normalise text)
    2. Extract quantity + unit
    3. Map to canonical ingredient (exact → fuzzy → ML)
    4. Persist to usage_logs / unmapped_entries
    5. Deduct from inventory if mapped
    """
    from backend.database import get_session, rollback_and_log
    from backend.ml.extraction import extract_count, extract_items, extract_quantity
    from backend.ml.mapping import map_ingredient
    from backend.ml.preprocessing import preprocess
    from backend.models import Ingredient, Inventory, UnmappedEntry, UsageLog
    from backend.services.inventory_service import deduct_stock

    segments = extract_items(payload.raw_text)
    if not segments:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="raw_text produced no valid segments",
        )

    results: list[ItemResult] = []
    session = None

    try:
        session = get_session()
        with session.begin():
            for seg in segments:
                cleaned = preprocess(seg)
                quantity, unit = extract_quantity(cleaned)

                # Fall back to count extraction if no unit found
                if unit is None:
                    quantity, unit = extract_count(cleaned)

                ingredient, confidence, map_status, method, needs_review = map_ingredient(
                    cleaned, session=session
                )

                logger.info(
                    "segment='%s' ingredient=%s conf=%.1f status=%s method=%s",
                    seg, ingredient, confidence, map_status, method,
                )

                if map_status == "mapped" and ingredient != "unmapped":
                    ing_record = session.query(Ingredient).filter_by(name=ingredient).first()
                    if ing_record:
                        log = UsageLog(
                            ingredient_id=ing_record.id,
                            chef_name=payload.chef_name,
                            manager_name=payload.manager_name,
                            quantity=quantity,
                            unit=unit,
                            raw_text=seg,
                            confidence=confidence,
                            mapping_method=method,
                            needs_review=needs_review,
                        )
                        session.add(log)
                        session.flush()

                        if quantity is not None:
                            deduct_stock(session, ing_record.id, quantity, unit or "")
                else:
                    unmapped = UnmappedEntry(
                        raw_text=seg,
                        chef_name=payload.chef_name,
                        manager_name=payload.manager_name,
                        quantity=quantity,
                        unit=unit,
                        attempted_label=ingredient if ingredient != "unmapped" else None,
                    )
                    session.add(unmapped)
                    session.flush()

                results.append(ItemResult(
                    cleaned_text=cleaned,
                    quantity=quantity,
                    unit=unit,
                    ingredient=ingredient,
                    confidence=confidence,
                    status=map_status,
                    mapping_method=method,
                    needs_review=needs_review,
                ))

        if not results:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No valid items found in the entry",
            )

        return StockEntryResponse(results=results, total_items=len(results))

    except HTTPException:
        if session:
            rollback_and_log(session, "HTTPException in create_entry")
        raise
    except ValueError as exc:
        if session:
            rollback_and_log(session, f"Insufficient stock error: {str(exc)}")
        raise HTTPException(status_code=422, detail=str(exc))
    except SQLAlchemyError as exc:
        if session:
            rollback_and_log(session, "SQLAlchemyError in create_entry")
        logger.exception("DB failure in create_entry")
        raise HTTPException(status_code=500, detail="Database failure") from exc
    except Exception as exc:
        if session:
            rollback_and_log(session, "Unexpected error in create_entry")
        logger.exception("Unexpected error in create_entry")
        raise HTTPException(status_code=500, detail="Internal server error") from exc
    finally:
        if session:
            session.close()
