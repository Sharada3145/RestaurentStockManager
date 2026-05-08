"""
ml/extraction.py
----------------
Quantity, unit, and count extraction from normalised kitchen notes.

Supported formats:
    • 2kg / 2.5 kg / 500g / 1/2 kg / half kg / two liters
    • Count items: 3 tomatoes, 5 eggs  → unit="count"
    • Unit normalisation: g→kg, ml→liters
"""

from __future__ import annotations

import re
from typing import Optional

# ---------------------------------------------------------------------------
# Word → number mapping
# ---------------------------------------------------------------------------

_WORD_NUMBERS: dict[str, float] = {
    "zero": 0, "half": 0.5, "one": 1, "two": 2, "three": 3,
    "four": 4, "five": 5, "six": 6, "seven": 7, "eight": 8,
    "nine": 9, "ten": 10, "eleven": 11, "twelve": 12,
    "thirteen": 13, "fourteen": 14, "fifteen": 15, "sixteen": 16,
    "seventeen": 17, "eighteen": 18, "nineteen": 19, "twenty": 20,
    "thirty": 30, "forty": 40, "fifty": 50, "hundred": 100,
}

# ---------------------------------------------------------------------------
# Unit normalisation
# ---------------------------------------------------------------------------

_UNIT_MAP: dict[str, str] = {
    # mass → kg
    "g":     "kg",
    "gram":  "kg",
    "grams": "kg",
    "kg":    "kg",
    "kgs":   "kg",
    "kilogram":  "kg",
    "kilograms": "kg",
    "kilo":  "kg",
    "kilos": "kg",
    # volume → liters
    "ml":        "liters",
    "milliliter": "liters",
    "millilitre": "liters",
    "milliliters": "liters",
    "millilitres": "liters",
    "l":          "liters",
    "liter":      "liters",
    "liters":     "liters",
    "litre":      "liters",
    "litres":     "liters",
    # count
    "piece":   "count",
    "pieces":  "count",
    "pcs":     "count",
    "unit":    "count",
    "units":   "count",
    "count":   "count",
    "dozen":   "count",
}

# Conversion factors to standard unit
_CONVERSION: dict[str, float] = {
    "g":     0.001,   # → kg
    "gram":  0.001,
    "grams": 0.001,
    "ml":       0.001,   # → liters
    "milliliter":  0.001,
    "millilitre":  0.001,
    "milliliters": 0.001,
    "millilitres": 0.001,
    "dozen": 12.0,    # → count
}

# ---------------------------------------------------------------------------
# Regex patterns
# ---------------------------------------------------------------------------

# Fraction like  1/2
_RE_FRACTION = re.compile(r"(\d+)\s*/\s*(\d+)")

# Main quantity+unit pattern: optional fraction or decimal/int, then optional space, then unit
_UNIT_TOKENS = "|".join(
    sorted(_UNIT_MAP.keys(), key=len, reverse=True)   # longest first for greedy match
)
_RE_QTY_UNIT = re.compile(
    rf"(\d+(?:\.\d+)?)\s*({_UNIT_TOKENS})\b",
    re.IGNORECASE,
)

# Word-number + unit: "two liters", "half kg"
_WORD_NUM_TOKENS = "|".join(sorted(_WORD_NUMBERS.keys(), key=len, reverse=True))
_RE_WORD_QTY = re.compile(
    rf"\b({_WORD_NUM_TOKENS})\s+({_UNIT_TOKENS})\b",
    re.IGNORECASE,
)

# Pure fraction + unit: "1/2 kg"
_RE_FRAC_UNIT = re.compile(
    rf"(\d+)\s*/\s*(\d+)\s*({_UNIT_TOKENS})\b",
    re.IGNORECASE,
)


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def extract_quantity(text: str) -> tuple[Optional[float], Optional[str]]:
    """
    Extract the first quantity + standardised unit from *text*.

    Returns:
        (quantity, unit)  – both None when nothing recognised.
    """
    # 1. Fraction + unit: "1/2 kg"
    m = _RE_FRAC_UNIT.search(text)
    if m:
        num   = int(m.group(1)) / int(m.group(2))
        raw_unit = m.group(3).lower()
        return _normalise(num, raw_unit)

    # 2. Numeric + unit: "2kg", "2.5 kg"
    m = _RE_QTY_UNIT.search(text)
    if m:
        num      = float(m.group(1))
        raw_unit = m.group(2).lower()
        return _normalise(num, raw_unit)

    # 3. Word number + unit: "two liters"
    m = _RE_WORD_QTY.search(text)
    if m:
        num      = _WORD_NUMBERS[m.group(1).lower()]
        raw_unit = m.group(2).lower()
        return _normalise(num, raw_unit)

    return None, None


def extract_items(raw_text: str) -> list[str]:
    """
    Split a multi-item kitchen note into individual segments.

    Splits on commas, ' and ', ' & '.

    Args:
        raw_text: Full raw kitchen note (NOT pre-processed).

    Returns:
        List of non-empty segment strings (still raw, for caller to preprocess).
    """
    segments = re.split(r",|\band\b|&", raw_text, flags=re.IGNORECASE)
    return [s.strip() for s in segments if s.strip()]


def extract_count(text: str) -> tuple[Optional[float], Optional[str]]:
    """
    Try to extract a plain count (e.g. '3 tomatoes', '12 eggs').

    Returns (count, 'count') or (None, None).
    """
    # Numeric count: "3 tomatoes"
    m = re.search(r"\b(\d+(?:\.\d+)?)\b", text)
    if m:
        # Only treat as count if no unit was extracted by extract_quantity
        qty, unit = extract_quantity(text)
        if unit is None:
            return float(m.group(1)), "count"
    return None, None


# ---------------------------------------------------------------------------
# Internal helpers
# ---------------------------------------------------------------------------

def _normalise(value: float, raw_unit: str) -> tuple[float, str]:
    """Apply conversion factor and map to standard unit."""
    factor   = _CONVERSION.get(raw_unit, 1.0)
    std_unit = _UNIT_MAP.get(raw_unit, raw_unit)
    return round(value * factor, 6), std_unit
