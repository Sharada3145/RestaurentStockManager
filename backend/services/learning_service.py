"""
services/learning_service.py
-----------------------------
Continuous-learning pipeline: map an unmapped entry, persist the alias,
append a training row, and retrain the ML model.
"""

from __future__ import annotations

import logging
from datetime import datetime

logger = logging.getLogger("stockmanager.learning")


def map_unmapped_entry(
    session,
    unmapped_id: int,
    ingredient_name: str,
) -> None:
    """
    Manually map an UnmappedEntry to a canonical ingredient.

    Steps:
        1. Verify entry and ingredient exist.
        2. Save / update alias in the aliases table.
        3. Mark the entry as mapped.
        4. Append raw_text to training CSV.
        5. Retrain the ML model.

    Raises:
        ValueError: When unmapped_id or ingredient_name not found.
    """
    from backend.models import Alias, Ingredient, UnmappedEntry

    entry = session.query(UnmappedEntry).filter_by(id=unmapped_id).first()
    if entry is None:
        raise ValueError(f"UnmappedEntry id={unmapped_id} not found")

    ingredient = session.query(Ingredient).filter_by(name=ingredient_name).first()
    if ingredient is None:
        raise ValueError(f"Ingredient '{ingredient_name}' not found")

    # ── 2. Save alias ────────────────────────────────────────────────────────
    raw = entry.raw_text.strip().lower()
    existing_alias = session.query(Alias).filter_by(alias_name=raw).first()
    if existing_alias is None:
        alias = Alias(
            alias_name=raw,
            ingredient_id=ingredient.id,
            source="user_correction",
        )
        session.add(alias)
        logger.info("[learning] new alias '%s' → '%s'", raw, ingredient_name)
    else:
        # Update to correct ingredient
        existing_alias.ingredient_id = ingredient.id
        logger.info("[learning] updated alias '%s' → '%s'", raw, ingredient_name)

    # ── 3. Mark entry as mapped ──────────────────────────────────────────────
    entry.manual_mapping = ingredient_name
    entry.mapped_at      = datetime.utcnow()

    session.flush()

    # ── 4 + 5. Append to CSV and retrain ────────────────────────────────────
    try:
        from backend.ml.ml_model import retrain
        retrain(new_text=raw, new_label=ingredient_name)
        logger.info("[learning] model retrained after mapping id=%s", unmapped_id)
    except Exception:
        logger.exception("[learning] retraining failed — alias saved but model not updated")
