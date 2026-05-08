"""
routes/health.py
----------------
GET /api/v1/health  — System health probe with DB connectivity check.
"""

from __future__ import annotations

import logging
import time
from datetime import datetime, timezone

from fastapi import APIRouter
from pydantic import BaseModel
from sqlalchemy import text

logger = logging.getLogger("stockmanager.routes.health")

router = APIRouter(tags=["Health"])

# Track startup time for uptime calculation
_START_TIME = time.time()


class HealthResponse(BaseModel):
    status: str
    version: str
    uptime_seconds: float
    database: str
    timestamp: str
    ingredient_count: int
    inventory_count: int
    usage_log_count: int


@router.get(
    "/health",
    response_model=HealthResponse,
    summary="System health check with database diagnostics",
)
def get_health():
    """
    Returns service health, database status, uptime, and record counts.
    Safe to call at any time — never raises 5xx unless the DB is completely broken.
    """
    from backend.database import get_session
    from backend.models import Ingredient, Inventory, UsageLog

    db_status = "ok"
    ingredient_count = 0
    inventory_count  = 0
    usage_log_count  = 0

    session = None
    try:
        session = get_session()
        # Lightweight connectivity check
        session.execute(text("SELECT 1"))
        ingredient_count = session.query(Ingredient).count()
        inventory_count  = session.query(Inventory).count()
        usage_log_count  = session.query(UsageLog).count()
    except Exception as exc:
        logger.error("[health] DB check failed: %s", exc)
        db_status = "degraded"
    finally:
        if session:
            session.close()

    return HealthResponse(
        status="ok" if db_status == "ok" else "degraded",
        version="1.0.0",
        uptime_seconds=round(time.time() - _START_TIME, 1),
        database=db_status,
        timestamp=datetime.now(timezone.utc).isoformat(),
        ingredient_count=ingredient_count,
        inventory_count=inventory_count,
        usage_log_count=usage_log_count,
    )
