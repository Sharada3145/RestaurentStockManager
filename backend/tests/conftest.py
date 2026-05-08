"""
tests/conftest.py
-----------------
Session-scoped in-memory database for all API integration tests.

Strategy: monkeypatch backend.database before any route handler touches the
real SQLite file.  Because the TestClient triggers `startup` the first time
it makes a request (not at import time), we patch the module-level engine
and SessionLocal before the first request.
"""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[2]))

import pytest
from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker

from sqlalchemy.pool import StaticPool

# ------------------------------------------------------------------
# 1.  Build an in-memory engine BEFORE anything else runs
# ------------------------------------------------------------------
_TEST_ENGINE = create_engine(
    "sqlite:///:memory:",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
_TestSession = sessionmaker(
    bind=_TEST_ENGINE,
    autoflush=False,
    autocommit=False,
    future=True,
)

# ------------------------------------------------------------------
# 2.  Monkey-patch database module immediately at import time
#     (before TestClient triggers the startup event)
# ------------------------------------------------------------------
import backend.database as _db

_db.engine       = _TEST_ENGINE
_db.SessionLocal = _TestSession
_db.DB_PATH      = Path(":memory:")

# ------------------------------------------------------------------
# 3.  Import models so their metadata registers against Base
# ------------------------------------------------------------------
import backend.models  # noqa: F401  – populates Base.metadata

# ------------------------------------------------------------------
# 4.  Create all tables once for the session
# ------------------------------------------------------------------
from backend.database import Base, _seed_database

Base.metadata.create_all(bind=_TEST_ENGINE)

_seed_session = _TestSession()
try:
    _seed_database(_seed_session)
finally:
    _seed_session.close()


# ------------------------------------------------------------------
# 5.  Session-scoped fixture so tests can reference it if needed
# ------------------------------------------------------------------
@pytest.fixture(scope="session")
def test_engine():
    yield _TEST_ENGINE
    _TEST_ENGINE.dispose()
