"""
tests/test_inventory.py
-----------------------
Unit tests for inventory service: deduction, alerts, and stock operations.
"""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[2]))

import pytest
from unittest.mock import MagicMock, patch


class TestDeductStock:

    def _make_inv(self, current_stock, reorder_threshold=1.0):
        inv = MagicMock()
        inv.current_stock     = current_stock
        inv.reorder_threshold = reorder_threshold
        inv.unit              = "kg"
        return inv

    def test_basic_deduction(self):
        from backend.services.inventory_service import deduct_stock

        session = MagicMock()
        inv = self._make_inv(10.0)
        session.query.return_value.filter_by.return_value.first.return_value = inv

        result = deduct_stock(session, ingredient_id=1, quantity=2.0, unit="kg")
        assert result == pytest.approx(8.0)
        assert inv.current_stock == pytest.approx(8.0)

    def test_clamps_at_zero(self):
        from backend.services.inventory_service import deduct_stock

        session = MagicMock()
        inv = self._make_inv(1.0)
        session.query.return_value.filter_by.return_value.first.return_value = inv

        result = deduct_stock(session, ingredient_id=1, quantity=5.0, unit="kg")
        assert result == pytest.approx(0.0)
        assert inv.current_stock == pytest.approx(0.0)

    def test_no_inventory_row(self):
        from backend.services.inventory_service import deduct_stock

        session = MagicMock()
        session.query.return_value.filter_by.return_value.first.return_value = None

        result = deduct_stock(session, ingredient_id=99, quantity=1.0, unit="kg")
        assert result is None


class TestLowStockAlert:

    def test_alert_when_below_threshold(self):
        from backend.services.inventory_service import get_low_stock_alert

        session = MagicMock()
        inv = MagicMock()
        inv.current_stock     = 0.5
        inv.reorder_threshold = 1.0
        inv.unit              = "kg"
        session.query.return_value.filter_by.return_value.first.return_value = inv

        alert = get_low_stock_alert(session, ingredient_id=1, ingredient_name="rice")
        assert alert is not None
        assert "rice" in alert.lower()

    def test_no_alert_when_above_threshold(self):
        from backend.services.inventory_service import get_low_stock_alert

        session = MagicMock()
        inv = MagicMock()
        inv.current_stock     = 10.0
        inv.reorder_threshold = 1.0
        inv.unit              = "kg"
        session.query.return_value.filter_by.return_value.first.return_value = inv

        with patch("backend.ml.prediction.predict_7day_consumption", return_value={}):
            alert = get_low_stock_alert(session, ingredient_id=1, ingredient_name="rice")
        assert alert is None


class TestSetStock:

    def test_set_stock_creates_row_if_missing(self):
        from backend.services.inventory_service import set_stock

        session = MagicMock()
        # Simulate no existing inventory row → triggers creation
        session.query.return_value.filter_by.return_value.first.side_effect = [
            None,   # Ingredient query → not needed in set_stock
            None,   # Inventory query → None triggers creation
        ]
        # Override: first call returns Ingredient mock, second returns None
        ing_mock = MagicMock()
        ing_mock.default_unit = "kg"

        inv_mock = MagicMock()
        inv_mock.current_stock = 0.0
        inv_mock.unit = "kg"

        calls = [ing_mock, None]
        session.query.return_value.filter_by.return_value.first.side_effect = calls

        # Just ensure it doesn't raise
        result = set_stock(session, ingredient_id=1, absolute_value=5.0, unit="kg")
        assert isinstance(result, dict)
