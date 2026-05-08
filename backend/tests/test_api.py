"""
tests/test_api.py
-----------------
Integration tests for all REST API endpoints via FastAPI TestClient.
"""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[2]))

import pytest
from fastapi.testclient import TestClient

from backend.main import app

client = TestClient(app)


# ── Health ──────────────────────────────────────────────────────────────────

class TestHealth:

    def test_root(self):
        r = client.get("/")
        assert r.status_code == 200
        assert r.json()["status"] == "ok"

    def test_health_endpoint(self):
        r = client.get("/api/v1/health")
        assert r.status_code == 200
        data = r.json()
        assert "status" in data
        assert "database" in data

    def test_analytics_summary(self):
        r = client.get("/api/v1/analytics/summary")
        assert r.status_code == 200
        data = r.json()
        assert "total_entries" in data
        assert "accuracy_rate" in data
        assert "unique_chefs" in data


# ── Stock Entry ──────────────────────────────────────────────────────────────

class TestStockEntry:

    def test_single_item_entry(self):
        r = client.post("/api/v1/entry", json={
            "raw_text":     "2kg rice",
            "chef_name":    "Alice",
            "manager_name": "Bob",
        })
        assert r.status_code == 200
        data = r.json()
        assert "results" in data
        assert data["total_items"] >= 1

    def test_multi_item_entry(self):
        r = client.post("/api/v1/entry", json={
            "raw_text":     "1kg sugar and 500ml oil",
            "chef_name":    "Chef Marco",
            "manager_name": "Manager Sara",
        })
        assert r.status_code == 200
        assert r.json()["total_items"] >= 2

    def test_entry_returns_ingredient(self):
        r = client.post("/api/v1/entry", json={
            "raw_text":     "3 eggs",
            "chef_name":    "Alice",
            "manager_name": "Bob",
        })
        assert r.status_code == 200
        results = r.json()["results"]
        assert any("egg" in res["ingredient"].lower() or res["unit"] == "count" for res in results)

    def test_empty_raw_text_rejected(self):
        r = client.post("/api/v1/entry", json={
            "raw_text":     "   ",
            "chef_name":    "Alice",
            "manager_name": "Bob",
        })
        assert r.status_code in (400, 422)

    def test_missing_chef_name_rejected(self):
        r = client.post("/api/v1/entry", json={
            "raw_text": "2kg rice",
        })
        assert r.status_code == 422

    def test_comma_separated_items(self):
        r = client.post("/api/v1/entry", json={
            "raw_text":     "1kg flour, 2 liters milk, 5 eggs",
            "chef_name":    "Carlo",
            "manager_name": "Mario",
        })
        assert r.status_code == 200
        assert r.json()["total_items"] == 3


# ── Inventory ────────────────────────────────────────────────────────────────

class TestInventory:

    def test_get_inventory(self):
        r = client.get("/api/v1/inventory")
        assert r.status_code == 200
        assert isinstance(r.json(), list)

    def test_update_inventory_set_absolute(self):
        r = client.post("/api/v1/inventory", json={
            "ingredient_name": "rice",
            "set_absolute":    10.0,
            "unit":            "kg",
        })
        assert r.status_code == 200
        data = r.json()
        assert data["current_stock"] == pytest.approx(10.0)
        assert data["ingredient"] == "rice"

    def test_update_inventory_change(self):
        # First set to 5
        client.post("/api/v1/inventory", json={"ingredient_name": "sugar", "set_absolute": 5.0})
        # Then add 2
        r = client.post("/api/v1/inventory", json={"ingredient_name": "sugar", "change": 2.0})
        assert r.status_code == 200
        assert r.json()["current_stock"] == pytest.approx(7.0)

    def test_update_unknown_ingredient(self):
        r = client.post("/api/v1/inventory", json={
            "ingredient_name": "unicorn_dust",
            "set_absolute":    1.0,
        })
        assert r.status_code == 404


# ── Analytics ────────────────────────────────────────────────────────────────

class TestAnalytics:

    def test_get_usage(self):
        r = client.get("/api/v1/usage")
        assert r.status_code == 200
        data = r.json()
        assert "total_usage" in data
        assert "by_chef" in data

    def test_get_unmapped(self):
        r = client.get("/api/v1/unmapped")
        assert r.status_code == 200
        assert isinstance(r.json(), list)

    def test_get_activity(self):
        r = client.get("/api/v1/activity")
        assert r.status_code == 200
        assert isinstance(r.json(), list)


# ── Prediction ───────────────────────────────────────────────────────────────

class TestPrediction:

    def test_prediction_known_ingredient(self):
        # Seed a usage first so forecast has data
        client.post("/api/v1/entry", json={
            "raw_text": "2kg rice", "chef_name": "Alice", "manager_name": "Bob"
        })
        r = client.get("/api/v1/prediction?ingredient=rice")
        assert r.status_code == 200
        data = r.json()
        assert data["ingredient"] == "rice"
        assert isinstance(data["forecast"], dict)

    def test_prediction_unknown_ingredient(self):
        r = client.get("/api/v1/prediction?ingredient=doesnotexist")
        assert r.status_code == 404

    def test_forecasts_all(self):
        r = client.get("/api/v1/forecasts")
        assert r.status_code == 200
        assert isinstance(r.json(), list)
