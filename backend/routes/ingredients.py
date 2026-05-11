"""
routes/ingredients.py
---------------------
GET  /api/v1/ingredients              – Catalogue of all ingredients
POST /api/v1/ingredients              – Add new ingredient + aliases
GET  /api/v1/ingredients/{name}/aliases – List aliases for one ingredient
POST /api/v1/ingredients/{name}/aliases – Add alias(es) to an ingredient
DELETE /api/v1/ingredients/{name}      – Delete ingredient and all related data
"""

from __future__ import annotations

import logging
from typing import List, Optional

from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.exc import IntegrityError, SQLAlchemyError

logger = logging.getLogger("stockmanager.routes.ingredients")

router = APIRouter(tags=["Ingredients"])


# ── Schemas ────────────────────────────────────────────────────────────────

class AliasItem(BaseModel):
    alias_name: str
    source: str


class IngredientResponse(BaseModel):
    id: int
    name: str
    category: str
    default_unit: str
    alias_count: int
    current_stock: Optional[float] = None
    unit: Optional[str] = None


class AddIngredientRequest(BaseModel):
    name: str
    category: str = "general"
    default_unit: str = "kg"
    reorder_threshold: float = 1.0
    aliases: List[str] = []


class AddAliasRequest(BaseModel):
    aliases: List[str]


class AddIngredientResponse(BaseModel):
    message: str
    id: int
    name: str
    aliases_added: int


# ── Routes ─────────────────────────────────────────────────────────────────

@router.get(
    "/ingredients",
    response_model=List[IngredientResponse],
    summary="List all ingredients with stock and alias count",
)
def list_ingredients():
    from backend.database import get_session
    from backend.models import Alias, Ingredient, Inventory

    session = get_session()
    try:
        ingredients = session.query(Ingredient).order_by(Ingredient.category, Ingredient.name).all()
        result = []
        for ing in ingredients:
            alias_count = session.query(Alias).filter_by(ingredient_id=ing.id).count()
            inv = session.query(Inventory).filter_by(ingredient_id=ing.id).first()
            result.append(IngredientResponse(
                id=ing.id,
                name=ing.name,
                category=ing.category,
                default_unit=ing.default_unit,
                alias_count=alias_count,
                current_stock=inv.current_stock if inv else 0.0,
                unit=inv.unit if inv else ing.default_unit,
            ))
        return result
    finally:
        session.close()


@router.post(
    "/ingredients",
    response_model=AddIngredientResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Add a new ingredient with optional aliases",
)
def add_ingredient(payload: AddIngredientRequest):
    from backend.database import get_session, rollback_and_log
    from backend.models import Alias, Ingredient, Inventory

    session = None
    try:
        session = get_session()
        with session.begin():
            # Check duplicate
            existing = session.query(Ingredient).filter_by(name=payload.name.lower().strip()).first()
            if existing:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail=f"Ingredient '{payload.name}' already exists",
                )

            ing = Ingredient(
                name=payload.name.lower().strip(),
                category=payload.category.lower().strip(),
                default_unit=payload.default_unit.lower().strip(),
            )
            session.add(ing)
            session.flush()

            # Inventory row
            inv = Inventory(
                ingredient_id=ing.id,
                current_stock=0.0,
                unit=payload.default_unit.lower().strip(),
                reorder_threshold=payload.reorder_threshold,
            )
            session.add(inv)

            # Aliases
            aliases_added = 0
            for alias_str in payload.aliases:
                alias_clean = alias_str.lower().strip()
                if alias_clean:
                    try:
                        session.add(Alias(
                            alias_name=alias_clean,
                            ingredient_id=ing.id,
                            source="manual",
                        ))
                        session.flush()
                        aliases_added += 1
                    except IntegrityError:
                        session.rollback()
                        logger.warning("[ingredients] alias '%s' already exists, skipping", alias_clean)

        logger.info("[ingredients] added '%s' with %d aliases", payload.name, aliases_added)
        return AddIngredientResponse(
            message="Ingredient created successfully",
            id=ing.id,
            name=ing.name,
            aliases_added=aliases_added,
        )

    except HTTPException:
        if session:
            rollback_and_log(session, "HTTPException in add_ingredient")
        raise
    except SQLAlchemyError as exc:
        if session:
            rollback_and_log(session, "SQLAlchemyError in add_ingredient")
        raise HTTPException(status_code=500, detail="Database failure") from exc
    finally:
        if session:
            session.close()


@router.get(
    "/ingredients/{name}/aliases",
    response_model=List[AliasItem],
    summary="Get all aliases for a specific ingredient",
)
def get_aliases(name: str):
    from backend.database import get_session
    from backend.models import Alias, Ingredient

    session = get_session()
    try:
        ing = session.query(Ingredient).filter_by(name=name.lower().strip()).first()
        if not ing:
            raise HTTPException(status_code=404, detail=f"Ingredient '{name}' not found")
        aliases = session.query(Alias).filter_by(ingredient_id=ing.id).all()
        return [AliasItem(alias_name=a.alias_name, source=a.source) for a in aliases]
    finally:
        session.close()


@router.post(
    "/ingredients/{name}/aliases",
    summary="Add aliases to an existing ingredient",
)
def add_aliases(name: str, payload: AddAliasRequest):
    from backend.database import get_session, rollback_and_log
    from backend.models import Alias, Ingredient

    session = None
    try:
        session = get_session()
        with session.begin():
            ing = session.query(Ingredient).filter_by(name=name.lower().strip()).first()
            if not ing:
                raise HTTPException(status_code=404, detail=f"Ingredient '{name}' not found")

            added = 0
            for alias_str in payload.aliases:
                alias_clean = alias_str.lower().strip()
                if alias_clean:
                    existing = session.query(Alias).filter_by(alias_name=alias_clean).first()
                    if not existing:
                        session.add(Alias(
                            alias_name=alias_clean,
                            ingredient_id=ing.id,
                            source="manual",
                        ))
                        added += 1

        return {"message": f"Added {added} alias(es) to '{name}'", "aliases_added": added}

    except HTTPException:
        raise
    except SQLAlchemyError as exc:
        if session:
            rollback_and_log(session, "SQLAlchemyError in add_aliases")
        raise HTTPException(status_code=500, detail="Database failure") from exc
    finally:
        if session:
            session.close()


@router.delete(
    "/ingredients/{name}",
    summary="Delete an ingredient from the catalog",
)
def delete_ingredient(name: str):
    from backend.database import get_session, rollback_and_log
    from backend.models import Ingredient

    session = None
    try:
        session = get_session()
        with session.begin():
            ing = session.query(Ingredient).filter_by(name=name.lower().strip()).first()
            if not ing:
                raise HTTPException(status_code=404, detail=f"Ingredient '{name}' not found")

            # Relationships are configured with cascade="all, delete-orphan", 
            # so session.delete(ing) will remove Inventory, Alias, UsageLog, and DailyStockBatch records.
            session.delete(ing)

        logger.info("[ingredients] deleted '%s'", name)
        return {"message": f"Ingredient '{name}' deleted successfully"}

    except HTTPException:
        if session:
            rollback_and_log(session, "HTTPException in delete_ingredient")
        raise
    except SQLAlchemyError as exc:
        if session:
            rollback_and_log(session, "SQLAlchemyError in delete_ingredient")
        logger.exception("Delete failure")
        raise HTTPException(status_code=500, detail="Database failure") from exc
    finally:
        if session:
            session.close()
