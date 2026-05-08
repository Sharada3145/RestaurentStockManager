"""
tests/test_extraction.py
------------------------
Unit tests for the NLP quantity/unit extraction pipeline.
"""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[2]))

import pytest
from backend.ml.extraction import extract_count, extract_items, extract_quantity


# ── extract_quantity ───────────────────────────────────────────────────────

class TestExtractQuantity:

    def test_kg_numeric(self):
        qty, unit = extract_quantity("2kg rice")
        assert qty == pytest.approx(2.0)
        assert unit == "kg"

    def test_grams_to_kg(self):
        qty, unit = extract_quantity("500g chicken")
        assert qty == pytest.approx(0.5)
        assert unit == "kg"

    def test_decimal_kg(self):
        qty, unit = extract_quantity("2.5 kg flour")
        assert qty == pytest.approx(2.5)
        assert unit == "kg"

    def test_ml_to_liters(self):
        qty, unit = extract_quantity("250ml milk")
        assert qty == pytest.approx(0.25)
        assert unit == "liters"

    def test_liters(self):
        qty, unit = extract_quantity("2 liters oil")
        assert qty == pytest.approx(2.0)
        assert unit == "liters"

    def test_fraction_kg(self):
        qty, unit = extract_quantity("1/2 kg sugar")
        assert qty == pytest.approx(0.5)
        assert unit == "kg"

    def test_word_number_liters(self):
        qty, unit = extract_quantity("two liters milk")
        assert qty == pytest.approx(2.0)
        assert unit == "liters"

    def test_word_half_kg(self):
        qty, unit = extract_quantity("half kg salt")
        assert qty == pytest.approx(0.5)
        assert unit == "kg"

    def test_no_quantity(self):
        qty, unit = extract_quantity("some tomatoes")
        assert qty is None
        assert unit is None

    def test_gram_long_form(self):
        qty, unit = extract_quantity("300 grams beef")
        assert qty == pytest.approx(0.3)
        assert unit == "kg"

    def test_kilo_alias(self):
        qty, unit = extract_quantity("3 kilo rice")
        assert qty == pytest.approx(3.0)
        assert unit == "kg"


# ── extract_count ──────────────────────────────────────────────────────────

class TestExtractCount:

    def test_count_tomatoes(self):
        qty, unit = extract_count("3 tomatoes")
        assert qty == pytest.approx(3.0)
        assert unit == "count"

    def test_count_eggs(self):
        qty, unit = extract_count("12 eggs")
        assert qty == pytest.approx(12.0)
        assert unit == "count"

    def test_no_count_when_unit_exists(self):
        # "2kg" has a unit → count should NOT trigger
        qty, unit = extract_count("2kg rice")
        assert unit != "count"

    def test_count_onions(self):
        qty, unit = extract_count("5 onions")
        assert qty == pytest.approx(5.0)
        assert unit == "count"


# ── extract_items ──────────────────────────────────────────────────────────

class TestExtractItems:

    def test_comma_split(self):
        items = extract_items("2kg rice, 500g chicken")
        assert len(items) == 2
        assert "2kg rice" in items[0]

    def test_and_split(self):
        items = extract_items("1kg sugar and 2 liters oil")
        assert len(items) == 2

    def test_ampersand_split(self):
        items = extract_items("eggs & milk")
        assert len(items) == 2

    def test_mixed_split(self):
        items = extract_items("rice, chicken and 2kg onions & garlic")
        assert len(items) == 4

    def test_single_item(self):
        items = extract_items("500g sugar")
        assert len(items) == 1

    def test_empty_segments_filtered(self):
        items = extract_items("rice,,chicken")
        assert all(i.strip() for i in items)
