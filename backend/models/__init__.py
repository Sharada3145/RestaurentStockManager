"""
models/__init__.py
------------------
SQLAlchemy ORM models for the Restaurant Stock Intelligence System.

Tables:
    ingredients       – Master ingredient catalogue
    aliases           – Known alternative names per ingredient
    usage_logs        – Every kitchen stock-entry event
    unmapped_entries  – Entries the ML pipeline could not confidently map
    inventory         – Current stock level per ingredient
"""

from __future__ import annotations

from datetime import datetime

from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    String,
)
from sqlalchemy.orm import relationship

from backend.database import Base


# ---------------------------------------------------------------------------
# Ingredient
# ---------------------------------------------------------------------------

class Ingredient(Base):
    __tablename__ = "ingredients"

    id           = Column(Integer, primary_key=True, index=True)
    name         = Column(String(100), unique=True, nullable=False, index=True)
    category     = Column(String(50),  nullable=False, default="general")
    default_unit = Column(String(20),  nullable=False, default="kg")
    created_at   = Column(DateTime,    default=datetime.utcnow)

    aliases       = relationship("Alias",        back_populates="ingredient", cascade="all, delete-orphan")
    usage_logs    = relationship("UsageLog",     back_populates="ingredient", cascade="all, delete-orphan")
    daily_batches = relationship("DailyStockBatch", back_populates="ingredient", cascade="all, delete-orphan")
    inventory     = relationship("Inventory",    back_populates="ingredient", uselist=False, cascade="all, delete-orphan")


# ---------------------------------------------------------------------------
# Alias
# ---------------------------------------------------------------------------

class Alias(Base):
    __tablename__ = "aliases"

    id            = Column(Integer, primary_key=True, index=True)
    alias_name    = Column(String(100), unique=True, nullable=False, index=True)
    ingredient_id = Column(Integer, ForeignKey("ingredients.id"), nullable=False)
    source        = Column(String(50),  nullable=False, default="manual")
    created_at    = Column(DateTime,    default=datetime.utcnow)

    ingredient = relationship("Ingredient", back_populates="aliases")


# ---------------------------------------------------------------------------
# UsageLog
# ---------------------------------------------------------------------------

class UsageLog(Base):
    __tablename__ = "usage_logs"

    id             = Column(Integer, primary_key=True, index=True)
    ingredient_id  = Column(Integer, ForeignKey("ingredients.id"), nullable=False)
    chef_name      = Column(String(100), nullable=False)
    manager_name   = Column(String(100), nullable=True)
    quantity       = Column(Float,   nullable=True)
    unit           = Column(String(20), nullable=True)
    confidence     = Column(Float,   nullable=False, default=100.0)
    mapping_method = Column(String(50), nullable=False, default="exact")
    raw_text       = Column(String(500), nullable=True)
    logged_at      = Column(DateTime, default=datetime.utcnow, index=True)
    needs_review   = Column(Boolean,  nullable=False, default=False)

    ingredient = relationship("Ingredient", back_populates="usage_logs")


# ---------------------------------------------------------------------------
# UnmappedEntry
# ---------------------------------------------------------------------------

class UnmappedEntry(Base):
    __tablename__ = "unmapped_entries"

    id              = Column(Integer, primary_key=True, index=True)
    raw_text        = Column(String(500), nullable=False)
    chef_name       = Column(String(100), nullable=False)
    manager_name    = Column(String(100), nullable=True)
    quantity        = Column(Float,   nullable=True)
    unit            = Column(String(20), nullable=True)
    attempted_label = Column(String(100), nullable=True)
    manual_mapping  = Column(String(100), nullable=True, index=True)
    created_at      = Column(DateTime, default=datetime.utcnow, index=True)
    mapped_at       = Column(DateTime, nullable=True)


# ---------------------------------------------------------------------------
# DailyStockBatch
# ---------------------------------------------------------------------------

class DailyStockBatch(Base):
    __tablename__ = "daily_stock_batches"

    id                 = Column(Integer, primary_key=True, index=True)
    ingredient_id      = Column(Integer, ForeignKey("ingredients.id"), nullable=False)
    purchased_quantity = Column(Float,   nullable=False)
    allocated_quantity = Column(Float,   nullable=False, default=0.0)
    remaining_quantity = Column(Float,   nullable=False)
    unit               = Column(String(20), nullable=False)
    supplier_name      = Column(String(100), nullable=True)
    purchase_cost      = Column(Float,   nullable=True)
    batch_date         = Column(DateTime, default=datetime.utcnow, index=True)
    created_at         = Column(DateTime, default=datetime.utcnow)

    ingredient = relationship("Ingredient", back_populates="daily_batches")


# ---------------------------------------------------------------------------
# Inventory
# ---------------------------------------------------------------------------

class Inventory(Base):
    __tablename__ = "inventory"

    id                = Column(Integer, primary_key=True, index=True)
    ingredient_id     = Column(Integer, ForeignKey("ingredients.id"), nullable=False, unique=True)
    current_stock     = Column(Float,   nullable=False, default=0.0)
    unit              = Column(String(20), nullable=False)
    reorder_threshold = Column(Float,   nullable=False, default=1.0)
    last_updated      = Column(DateTime, default=datetime.utcnow)

    ingredient = relationship("Ingredient", back_populates="inventory")
