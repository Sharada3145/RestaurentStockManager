"""
ml/preprocessing.py
--------------------
Text normalisation utilities for kitchen stock entries.
"""

from __future__ import annotations

import re
import unicodedata


# Unicode fractions → ASCII equivalents
_UNICODE_FRACTIONS: dict[str, str] = {
    "½": "1/2",
    "⅓": "1/3",
    "¼": "1/4",
    "¾": "3/4",
    "⅔": "2/3",
    "⅛": "1/8",
    "⅜": "3/8",
    "⅝": "5/8",
    "⅞": "7/8",
}

# Noise phrases to strip from kitchen notes
_NOISE_PHRASES = re.compile(
    r"\b(received|used|consumed|added|from supplier|from the supplier|"
    r"by chef|submitted by|ordered|please add|we need|we used|note:|"
    r"fyi|update|for today|today's)\b",
    re.IGNORECASE,
)


def preprocess(text: str) -> str:
    """
    Normalise a raw kitchen note for downstream NLP.

    Steps:
        1. Unicode normalise + replace special fractions
        2. Lowercase
        3. Strip noise phrases
        4. Remove non-alphanumeric except / . ,
        5. Collapse whitespace

    Args:
        text: Raw input string.

    Returns:
        Cleaned, lowercase string.
    """
    if not text:
        return ""

    # 1. Unicode normalise (NFKD → ASCII where possible)
    text = unicodedata.normalize("NFKD", text)

    # Replace unicode fraction characters
    for uf, ascii_f in _UNICODE_FRACTIONS.items():
        text = text.replace(uf, ascii_f)

    # 2. Lowercase
    text = text.lower()

    # 3. Strip noise phrases
    text = _NOISE_PHRASES.sub("", text)

    # 4. Remove special characters (keep alphanumeric, spaces, . / ,)
    text = re.sub(r"[^\w\s./,&]", " ", text)

    # 5. Collapse whitespace
    text = re.sub(r"\s+", " ", text).strip()

    return text
