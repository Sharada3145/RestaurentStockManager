"""
tests/test_mapping.py
---------------------
Unit tests for the 3-stage ingredient mapping pipeline.
"""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[2]))

import pytest
from unittest.mock import patch, MagicMock
from backend.ml.mapping import _strip_quantities, map_ingredient


class TestStripQuantities:

    def test_strips_kg(self):
        result = _strip_quantities("2kg rice")
        assert "2" not in result
        assert "rice" in result

    def test_strips_grams(self):
        result = _strip_quantities("500g chicken")
        assert "500" not in result

    def test_no_quantity(self):
        result = _strip_quantities("tomatoes")
        assert result == "tomatoes"


class TestExactMatch:
    """Exact alias matching via mock session."""

    def _make_session(self, alias_map: dict):
        """Build a mock session that returns alias_map from _load_aliases."""
        session = MagicMock()
        return session

    def test_exact_ingredient_name(self):
        """Canonical ingredient names should self-match."""
        session = MagicMock()
        # Patch _load_aliases to return a known map
        with patch("backend.ml.mapping._load_aliases", return_value={"rice": "rice", "jeera": "cumin"}):
            ingredient, conf, status, method, needs_review = map_ingredient("rice", session=session)
        assert ingredient == "rice"
        assert conf == 100.0
        assert status == "mapped"
        assert method == "exact"
        assert needs_review is False

    def test_alias_match(self):
        with patch("backend.ml.mapping._load_aliases", return_value={"jeera": "cumin", "cumin": "cumin"}):
            ingredient, conf, status, method, needs_review = map_ingredient("jeera", session=MagicMock())
        assert ingredient == "cumin"
        assert method == "exact"


class TestFuzzyMatch:

    def test_fuzzy_close_match(self):
        """'chiken breast' (typo) should map to 'chicken' via fuzzy or ML."""
        alias_map = {"chicken": "chicken", "murgh": "chicken",
                     "chicken breast": "chicken", "chicken thigh": "chicken"}
        with patch("backend.ml.mapping._load_aliases", return_value=alias_map):
            ingredient, conf, status, method, needs_review = map_ingredient("chiken breast", session=MagicMock())
        assert ingredient == "chicken"
        assert method in ("exact", "fuzzy", "ml")

    def test_fuzzy_partial(self):
        alias_map = {"tomato": "tomato", "tomatoes": "tomato"}
        with patch("backend.ml.mapping._load_aliases", return_value=alias_map):
            ingredient, _, _, method, _ = map_ingredient("fresh tomatos", session=MagicMock())
        assert ingredient == "tomato"


class TestMLFallback:

    def test_ml_called_when_no_alias(self):
        """When alias map is empty, ML stage should be used."""
        with patch("backend.ml.mapping._load_aliases", return_value={}):
            with patch("backend.ml.mapping._ml_match", return_value=("rice", 85.0)) as mock_ml:
                ingredient, conf, status, method, _ = map_ingredient("basmati", session=MagicMock())
        mock_ml.assert_called_once()

    def test_unmapped_when_low_confidence(self):
        """Items below threshold → unmapped status."""
        with patch("backend.ml.mapping._load_aliases", return_value={}):
            with patch("backend.ml.mapping._ml_match", return_value=None):
                with patch("backend.ml.mapping._fuzzy_match", return_value=None):
                    ingredient, conf, status, method, _ = map_ingredient("xyzqrs unknown", session=MagicMock())
        assert status == "unmapped"


class TestConfidenceThresholds:

    def test_high_confidence_no_review(self):
        with patch("backend.ml.mapping._load_aliases", return_value={"sugar": "sugar"}):
            _, conf, _, _, needs_review = map_ingredient("sugar", session=MagicMock())
        assert needs_review is False

    def test_mid_confidence_needs_review(self):
        with patch("backend.ml.mapping._load_aliases", return_value={}):
            with patch("backend.ml.mapping._fuzzy_match", return_value=("rice", 75.0)):
                _, conf, status, method, needs_review = map_ingredient("rce", session=MagicMock())
        assert status == "mapped"
        assert needs_review is True
