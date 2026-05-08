"""
main.py
-------
FastAPI application entry point for the Restaurant Stock Intelligence System.

Start server:
    cd backend
    uvicorn main:app --reload --host 0.0.0.0 --port 8000

Docs:
    http://localhost:8000/docs
"""

from __future__ import annotations

import os
import logging
import sys
from pathlib import Path

# Ensure the project root is on sys.path when run directly
_ROOT = Path(__file__).resolve().parent.parent
if str(_ROOT) not in sys.path:
    sys.path.insert(0, str(_ROOT))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.database import init_db

# ── Logging ─────────────────────────────────────────────────────────────────

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)-8s %(name)s — %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)],
)
logger = logging.getLogger("stockmanager.main")

# ── App ──────────────────────────────────────────────────────────────────────

app = FastAPI(
    title="Restaurant Stock Intelligence System",
    description=(
        "AI-powered inventory management for restaurants. "
        "Submit kitchen notes in natural language; the system extracts ingredients, "
        "quantities, and automatically updates stock with ML-assisted mapping."
    ),
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# ── CORS ─────────────────────────────────────────────────────────────────────

default_cors_origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

render_cors_origins = [
    origin.strip()
    for origin in os.getenv("CORS_ORIGINS", "").split(",")
    if origin.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=default_cors_origins + render_cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routes ────────────────────────────────────────────────────────────────────

from backend.routes.health       import router as health_router
from backend.routes.stock        import router as stock_router
from backend.routes.inventory    import router as inventory_router
from backend.routes.analytics    import router as analytics_router
from backend.routes.prediction   import router as prediction_router
from backend.routes.ingredients  import router as ingredients_router

PREFIX = "/api/v1"

app.include_router(health_router,      prefix=PREFIX)
app.include_router(stock_router,       prefix=PREFIX)
app.include_router(inventory_router,   prefix=PREFIX)
app.include_router(analytics_router,   prefix=PREFIX)
app.include_router(prediction_router,  prefix=PREFIX)
app.include_router(ingredients_router, prefix=PREFIX)


# ── Root ─────────────────────────────────────────────────────────────────────

@app.get("/", tags=["Health"], summary="Liveness probe")
def root():
    return {
        "service": "restaurant-stock-intelligence",
        "version": "1.0.0",
        "status":  "ok",
        "docs":    "/docs",
    }


# ── Startup ───────────────────────────────────────────────────────────────────

@app.on_event("startup")
def on_startup():
    logger.info("Starting up — initialising database…")
    init_db()
    logger.info("Database ready.")

    # Warm up ML model
    try:
        from backend.ml.ml_model import load_model
        load_model()
        logger.info("ML model loaded.")
    except Exception:
        logger.warning("ML model could not be loaded at startup (will train on first request).")
