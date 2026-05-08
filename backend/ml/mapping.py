"""
ml/mapping.py
-------------
3-stage hybrid ingredient mapping pipeline:

    Stage 1: Exact alias match         → confidence 100
    Stage 2: Fuzzy match (RapidFuzz)   → confidence proportional to score
    Stage 3: ML fallback (TF-IDF LR)   → confidence from predict_proba

Confidence thresholds:
    > 90 → auto-mapped,   needs_review=False
    70–90 → mapped,       needs_review=True
    < 70  → unmapped

Returns: (ingredient_name, confidence, status, method, needs_review)
"""

from __future__ import annotations

import logging
import re
from typing import Optional

logger = logging.getLogger("stockmanager.mapping")

# Confidence bands
_AUTO_THRESHOLD   = 90.0
_REVIEW_THRESHOLD = 70.0

# ---------------------------------------------------------------------------
# Public
# ---------------------------------------------------------------------------

def map_ingredient(
    text: str,
    session=None,
) -> tuple[str, float, str, str, bool]:
    """
    Map *text* to a canonical ingredient name.

    Args:
        text:    Pre-processed kitchen note segment.
        session: Optional SQLAlchemy session.  When provided, alias lookup
                 reads live data.  When None, only ML is used.

    Returns:
        (ingredient, confidence, status, method, needs_review)
        status ∈ {"mapped", "unmapped"}
        method ∈ {"exact", "fuzzy", "ml", "none"}
    """
    # Build alias map once per call (cheap for SQLite)
    alias_map = _load_aliases(session) if session else {}

    # ── Stage 1: Exact alias match ──────────────────────────────────
    result = _exact_match(text, alias_map)
    if result:
        ingredient, conf = result
        return ingredient, conf, "mapped", "exact", False

    # ── Stage 2: Fuzzy match ────────────────────────────────────────
    result = _fuzzy_match(text, alias_map)
    if result:
        ingredient, conf = result
        needs_review = conf < _AUTO_THRESHOLD
        if conf >= _REVIEW_THRESHOLD:
            return ingredient, conf, "mapped", "fuzzy", needs_review

    # ── Stage 3: ML fallback ────────────────────────────────────────
    result = _ml_match(text)
    if result:
        ingredient, conf = result
        needs_review = conf < _AUTO_THRESHOLD
        if conf >= _REVIEW_THRESHOLD:
            return ingredient, conf, "mapped", "ml", needs_review

    # ── Unmapped ────────────────────────────────────────────────────
    best_label = (result[0] if result else None) or _ml_best_guess(text)
    return best_label or "unmapped", 0.0, "unmapped", "none", False


# ---------------------------------------------------------------------------
# Stage implementations
# ---------------------------------------------------------------------------

def _exact_match(text: str, alias_map: dict[str, str]) -> Optional[tuple[str, float]]:
    """Check if text (or a cleaned version) exactly matches an alias."""
    cleaned = _strip_quantities(text).strip()
    for alias, ingredient in alias_map.items():
        if cleaned == alias or text == alias:
            return ingredient, 100.0
    return None


def _fuzzy_match(text: str, alias_map: dict[str, str]) -> Optional[tuple[str, float]]:
    """RapidFuzz token_set_ratio against all aliases."""
    try:
        from rapidfuzz import process, fuzz

        cleaned = _strip_quantities(text).strip()
        if not cleaned or not alias_map:
            return None

        best = process.extractOne(
            cleaned,
            alias_map.keys(),
            scorer=fuzz.token_set_ratio,
            score_cutoff=50,
        )
        if best:
            alias, score, _ = best
            ingredient = alias_map[alias]
            return ingredient, round(float(score), 2)
    except ImportError:
        logger.warning("[mapping] rapidfuzz not installed, skipping fuzzy stage")
    return None


def _ml_match(text: str) -> Optional[tuple[str, float]]:
    """TF-IDF + LR prediction."""
    try:
        from backend.ml.ml_model import predict
        label, conf = predict(_strip_quantities(text).strip() or text)
        if label and label != "unmapped":
            return label, conf
    except Exception:
        logger.exception("[mapping] ML stage failed")
    return None


def _ml_best_guess(text: str) -> Optional[str]:
    """Return ML label even if confidence is low (for attempted_label)."""
    try:
        from backend.ml.ml_model import predict
        label, _ = predict(_strip_quantities(text).strip() or text)
        return label if label != "unmapped" else None
    except Exception:
        return None


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _load_aliases(session) -> dict[str, str]:
    """Return {alias_name: ingredient_name} from DB."""
    from backend.models import Alias, Ingredient

    rows = (
        session.query(Alias.alias_name, Ingredient.name)
        .join(Ingredient, Alias.ingredient_id == Ingredient.id)
        .all()
    )
    result = {row.alias_name.lower(): row.name for row in rows}
    # Also add canonical ingredient names as self-aliases
    for ing in session.query(Ingredient).all():
        result.setdefault(ing.name.lower(), ing.name)
    return result


def _strip_quantities(text: str) -> str:
    """Remove numeric/unit tokens to isolate the ingredient phrase."""
    cleaned = re.sub(
        r"\b(\d+(?:[./]\d+)?)\s*"
        r"(kg|kgs|g|grams?|ml|liters?|litres?|l|pcs?|pieces?|units?|dozen|count|kilo|kilos?)\b",
        " ",
        text,
        flags=re.IGNORECASE,
    )
    cleaned = re.sub(r"\b\d+(?:\.\d+)?\b", " ", cleaned)
    return re.sub(r"\s+", " ", cleaned).strip()
