"""
routes/analytics.py
-------------------
GET  /api/v1/usage              – Usage stats + chef breakdown
GET  /api/v1/unmapped           – Unmapped entry queue
POST /api/v1/map                – Manually map + retrain
GET  /api/v1/activity           – Recent activity feed
GET  /api/v1/analytics/summary  – Dashboard KPIs
GET  /api/v1/analytics/timeline – Daily usage trend (last N days)
GET  /api/v1/analytics/category – Usage by ingredient category
"""

from __future__ import annotations

import logging
from datetime import datetime
from typing import List, Optional

from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel

logger = logging.getLogger("stockmanager.routes.analytics")

router = APIRouter(tags=["Analytics"])


# ── Schemas ────────────────────────────────────────────────────────────────

class UsageStatsResponse(BaseModel):
    total_usage: dict
    by_chef:     dict


class UnmappedEntryResponse(BaseModel):
    id:              int
    raw_text:        str
    chef_name:       str
    manager_name:    Optional[str] = None
    quantity:        Optional[float] = None
    unit:            Optional[str]   = None
    attempted_label: Optional[str]   = None
    created_at:      datetime


class MapUnmappedRequest(BaseModel):
    ingredient_name: str


class MappingStatusResponse(BaseModel):
    message:         str
    unmapped_id:     int
    ingredient_name: str


class ActivityItem(BaseModel):
    id:              int
    ingredient:      str
    chef_name:       str
    manager_name:    Optional[str] = None
    quantity:        Optional[float] = None
    unit:            Optional[str]   = None
    confidence:      float
    mapping_method:  str
    needs_review:    bool
    raw_text:        Optional[str] = None
    logged_at:       Optional[str] = None


class AnalyticsSummaryResponse(BaseModel):
    total_entries:  int
    mapped_entries: int
    unmapped_count: int
    accuracy_rate:  float
    unique_chefs:   int
    top_ingredient: Optional[str] = None
    alert_count:    int


class TimelinePoint(BaseModel):
    date:     str
    quantity: float


class CategoryUsageResponse(BaseModel):
    category: str
    quantity: float


# ── Routes ─────────────────────────────────────────────────────────────────

@router.get("/usage", response_model=UsageStatsResponse, summary="Get usage statistics")
def get_usage(days: Optional[int] = None):
    from backend.database import get_session
    from backend.utils.aggregation import total_usage_by_ingredient, usage_by_chef

    session = get_session()
    try:
        return UsageStatsResponse(
            total_usage=total_usage_by_ingredient(session, days=days),
            by_chef=usage_by_chef(session, days=days),
        )
    finally:
        session.close()


@router.get(
    "/unmapped",
    response_model=List[UnmappedEntryResponse],
    summary="Get unmapped entry queue",
)
def get_unmapped(limit: int = 50):
    from backend.database import get_session
    from backend.models import UnmappedEntry

    session = get_session()
    try:
        entries = (
            session.query(UnmappedEntry)
            .filter_by(mapped_at=None)
            .order_by(UnmappedEntry.created_at.desc())
            .limit(limit)
            .all()
        )
        return [
            UnmappedEntryResponse(
                id=e.id,
                raw_text=e.raw_text,
                chef_name=e.chef_name,
                manager_name=e.manager_name,
                quantity=e.quantity,
                unit=e.unit,
                attempted_label=e.attempted_label,
                created_at=e.created_at,
            )
            for e in entries
        ]
    finally:
        session.close()


@router.post(
    "/map",
    response_model=MappingStatusResponse,
    summary="Manually map an unmapped entry and retrain the model",
)
def map_unmapped(unmapped_id: int, payload: MapUnmappedRequest):
    from backend.database import get_session
    from backend.services.learning_service import map_unmapped_entry

    session = get_session()
    try:
        with session.begin():
            map_unmapped_entry(session, unmapped_id, payload.ingredient_name)
        return MappingStatusResponse(
            message="Entry mapped and model retrained",
            unmapped_id=unmapped_id,
            ingredient_name=payload.ingredient_name,
        )
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except Exception as exc:
        logger.exception("map_unmapped failed")
        raise HTTPException(status_code=500, detail="Internal server error") from exc
    finally:
        session.close()


@router.get(
    "/activity",
    response_model=List[ActivityItem],
    summary="Recent activity feed",
)
def get_activity(limit: int = 20):
    from backend.database import get_session
    from backend.utils.aggregation import recent_activity

    session = get_session()
    try:
        items = recent_activity(session, limit=limit)
        return [ActivityItem(**item) for item in items]
    finally:
        session.close()


@router.get(
    "/analytics/summary",
    response_model=AnalyticsSummaryResponse,
    summary="Dashboard KPI summary",
)
def get_analytics_summary():
    """
    Returns aggregated KPIs:
      - total / mapped / unmapped entry counts
      - ML accuracy rate
      - unique chef count
      - top ingredient by volume
      - low-stock alert count
    """
    from backend.database import get_session
    from backend.utils.aggregation import dashboard_summary

    session = get_session()
    try:
        summary = dashboard_summary(session)
        return AnalyticsSummaryResponse(**summary)
    finally:
        session.close()


@router.get(
    "/analytics/timeline",
    response_model=List[TimelinePoint],
    summary="Daily usage timeline for trend charts",
)
def get_timeline(days: int = 30, ingredient: Optional[str] = None):
    """
    Returns one data point per day for the last `days` days.
    Optionally filtered to a single ingredient.
    """
    from backend.database import get_session
    from backend.utils.aggregation import daily_usage_timeline

    session = get_session()
    try:
        points = daily_usage_timeline(session, days=days, ingredient_name=ingredient)
        return [TimelinePoint(**p) for p in points]
    finally:
        session.close()


@router.get(
    "/analytics/category",
    response_model=List[CategoryUsageResponse],
    summary="Usage breakdown by ingredient category",
)
def get_category_usage(days: Optional[int] = None):
    """
    Returns total consumption grouped by ingredient category (grain, protein, vegetable, etc.)
    """
    from backend.database import get_session
    from backend.utils.aggregation import usage_by_category

    session = get_session()
    try:
        by_cat = usage_by_category(session, days=days)
        return [
            CategoryUsageResponse(category=cat, quantity=round(qty, 4))
            for cat, qty in sorted(by_cat.items(), key=lambda x: x[1], reverse=True)
        ]
    finally:
        session.close()
