"""
database.py
-----------
SQLAlchemy engine, session factory, and database initialisation.
"""

from __future__ import annotations

import logging
from datetime import datetime
from pathlib import Path
from typing import Generator

from sqlalchemy import create_engine, inspect, text
from sqlalchemy.orm import Session, declarative_base, sessionmaker

# ---------------------------------------------------------------------------
# Paths & URL
# ---------------------------------------------------------------------------

BASE_DIR: Path = Path(__file__).resolve().parent
DB_PATH: Path  = BASE_DIR / "stockmanager.db"
DATABASE_URL    = f"sqlite:///{DB_PATH}"

# ---------------------------------------------------------------------------
# Engine & Session factory
# ---------------------------------------------------------------------------

engine = create_engine(
    DATABASE_URL,
    echo=False,
    connect_args={"check_same_thread": False},
)

SessionLocal = sessionmaker(
    bind=engine,
    autoflush=False,
    autocommit=False,
    future=True,
)

Base = declarative_base()

# ---------------------------------------------------------------------------
# Loggers
# ---------------------------------------------------------------------------

_log    = logging.getLogger("stockmanager.database")
db_log  = logging.getLogger("stockmanager.db")

for _logger in (_log, db_log):
    if not _logger.handlers:
        _h = logging.StreamHandler()
        _h.setFormatter(logging.Formatter("%(asctime)s %(levelname)s %(name)s — %(message)s"))
        _logger.addHandler(_h)
    _logger.setLevel(logging.INFO)

# ---------------------------------------------------------------------------
# Public helpers
# ---------------------------------------------------------------------------

def get_session() -> Session:
    """Return a new SQLAlchemy session (caller must close it)."""
    return SessionLocal()


def get_db() -> Generator[Session, None, None]:
    """FastAPI dependency: yield a session, then close it."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def get_db_path() -> str:
    return str(DB_PATH)


def rollback_and_log(session: Session, reason: str | None = None) -> None:
    try:
        session.rollback()
    finally:
        db_log.info("[DB] rollback%s", f" — {reason}" if reason else "")


# ---------------------------------------------------------------------------
# Schema migration helpers (lightweight, safe)
# ---------------------------------------------------------------------------

def _ensure_column(conn, table: str, column: str, definition: str) -> None:
    """Add *column* to *table* if it doesn't already exist."""
    with conn.begin_nested():
        conn.execute(text(f"ALTER TABLE {table} ADD COLUMN {column} {definition}"))
    db_log.info("[migration] added column %s.%s", table, column)


def _run_migrations(engine_) -> None:
    inspector = inspect(engine_)
    table_names = set(inspector.get_table_names())

    with engine_.connect() as conn:
        # usage_logs migrations
        if "usage_logs" in table_names:
            cols = {c["name"] for c in inspector.get_columns("usage_logs")}
            if "needs_review" not in cols:
                _ensure_column(conn, "usage_logs", "needs_review", "BOOLEAN NOT NULL DEFAULT 0")
            if "manager_name" not in cols:
                _ensure_column(conn, "usage_logs", "manager_name", "VARCHAR(100)")

        # inventory migrations
        if "inventory" in table_names:
            cols = {c["name"] for c in inspector.get_columns("inventory")}
            if "reorder_threshold" not in cols:
                _ensure_column(conn, "inventory", "reorder_threshold", "FLOAT NOT NULL DEFAULT 1.0")


# ---------------------------------------------------------------------------
# Seed data
# ---------------------------------------------------------------------------

_SEED_INGREDIENTS = [
    # (name, category, default_unit, reorder_threshold)
    ("rice",        "grain",   "kg",     5.0),
    ("wheat flour", "grain",   "kg",     5.0),
    ("sugar",       "dry",     "kg",     3.0),
    ("salt",        "dry",     "kg",     2.0),
    ("olive oil",   "oil",     "liters", 2.0),
    ("vegetable oil","oil",    "liters", 2.0),
    ("chicken",     "protein", "kg",     3.0),
    ("beef",        "protein", "kg",     3.0),
    ("lamb",        "protein", "kg",     2.0),
    ("onion",       "vegetable","count", 10.0),
    ("garlic",      "vegetable","count", 5.0),
    ("tomato",      "vegetable","count", 10.0),
    ("potato",      "vegetable","kg",    3.0),
    ("carrot",      "vegetable","count", 5.0),
    ("spinach",     "vegetable","kg",    1.0),
    ("lemon",       "fruit",   "count",  5.0),
    ("milk",        "dairy",   "liters", 3.0),
    ("butter",      "dairy",   "kg",     1.0),
    ("egg",         "dairy",   "count",  20.0),
    ("cheese",      "dairy",   "kg",     1.0),
    ("yogurt",      "dairy",   "liters", 2.0),
    ("cumin",       "spice",   "kg",     0.5),
    ("coriander",   "spice",   "kg",     0.5),
    ("turmeric",    "spice",   "kg",     0.5),
    ("paprika",     "spice",   "kg",     0.5),
    ("black pepper","spice",   "kg",     0.5),
    ("cinnamon",    "spice",   "kg",     0.3),
    ("ginger",      "spice",   "kg",     0.5),
    ("pasta",       "grain",   "kg",     2.0),
    ("lentils",     "legume",  "kg",     2.0),
    ("chickpeas",   "legume",  "kg",     2.0),
    ("tomato paste","sauce",   "kg",     1.0),
    ("cream",       "dairy",   "liters", 1.0),
]

_SEED_ALIASES = {
    "rice":         ["basmati", "white rice", "brown rice", "jasmine rice", "chawal"],
    "wheat flour":  ["flour", "maida", "atta", "all purpose flour", "bread flour"],
    "sugar":        ["white sugar", "caster sugar", "granulated sugar", "cheeni"],
    "salt":         ["sea salt", "rock salt", "table salt", "namak"],
    "olive oil":    ["extra virgin olive oil", "evoo"],
    "vegetable oil":["cooking oil", "sunflower oil", "canola oil", "refined oil", "oil"],
    "chicken":      ["murgh", "chicken breast", "chicken thigh", "boneless chicken", "whole chicken"],
    "beef":         ["gosht", "ground beef", "minced beef", "beef steak", "brisket"],
    "lamb":         ["mutton", "lamb chop", "lamb mince", "sheep meat"],
    "onion":        ["onions", "red onion", "white onion", "spring onion", "shallot", "pyaz"],
    "garlic":       ["garlic cloves", "minced garlic", "garlic paste", "lahsun"],
    "tomato":       ["tomatoes", "cherry tomato", "plum tomato", "tamatar"],
    "potato":       ["potatoes", "aloo", "sweet potato", "baby potato"],
    "carrot":       ["carrots", "gajar"],
    "spinach":      ["palak", "baby spinach"],
    "lemon":        ["lemons", "lime", "nimbu"],
    "milk":         ["full cream milk", "skimmed milk", "doodh", "whole milk"],
    "butter":       ["salted butter", "unsalted butter", "makhan"],
    "egg":          ["eggs", "anda", "egg yolk", "egg white"],
    "cheese":       ["cheddar", "mozzarella", "parmesan", "paneer", "cottage cheese"],
    "yogurt":       ["dahi", "curd", "greek yogurt", "plain yogurt"],
    "cumin":        ["jeera", "cumin seeds", "ground cumin"],
    "coriander":    ["dhania", "coriander seeds", "ground coriander", "cilantro"],
    "turmeric":     ["haldi", "ground turmeric"],
    "paprika":      ["red chilli powder", "chili powder", "lal mirch"],
    "black pepper": ["pepper", "kali mirch", "ground pepper"],
    "cinnamon":     ["dalchini", "cinnamon sticks", "ground cinnamon"],
    "ginger":       ["adrak", "ginger paste", "fresh ginger", "ground ginger"],
    "pasta":        ["spaghetti", "penne", "macaroni", "fettuccine", "lasagna sheets"],
    "lentils":      ["dal", "masoor", "moong", "toor dal", "chana dal"],
    "chickpeas":    ["chana", "garbanzo beans", "kabuli chana"],
    "tomato paste": ["tomato puree", "tomato sauce", "tomato concentrate"],
    "cream":        ["heavy cream", "whipping cream", "double cream", "fresh cream"],
}


def _seed_database(session: Session) -> None:
    """Insert seed ingredients + aliases only if the table is empty."""
    from backend.models import Alias, Ingredient, Inventory  # local import avoids circular
    if session.query(Ingredient).count() > 0:
        db_log.info("[seed] ingredients already present — skipping seed")
        return

    db_log.info("[seed] seeding %d ingredients…", len(_SEED_INGREDIENTS))
    for name, category, unit, reorder in _SEED_INGREDIENTS:
        ing = Ingredient(name=name, category=category, default_unit=unit)
        session.add(ing)
        session.flush()

        # inventory row
        inv = Inventory(
            ingredient_id=ing.id,
            current_stock=0.0,
            unit=unit,
            reorder_threshold=reorder,
        )
        session.add(inv)

        # aliases
        for alias in _SEED_ALIASES.get(name, []):
            session.add(Alias(alias_name=alias, ingredient_id=ing.id, source="seed"))

    session.commit()
    db_log.info("[seed] done")


# ---------------------------------------------------------------------------
# init_db (called at startup)
# ---------------------------------------------------------------------------

def init_db() -> None:
    """Create all tables, run migrations, and seed if empty."""
    # Import models so metadata is populated before create_all
    import backend.models  # noqa: F401

    Base.metadata.create_all(bind=engine)
    db_log.info("[DB] SQLite path: %s", DB_PATH)

    _run_migrations(engine)

    session = SessionLocal()
    try:
        _seed_database(session)
    finally:
        session.close()
