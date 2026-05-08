"""
ml/ml_model.py
--------------
TF-IDF + Logistic Regression ingredient classifier.

Training data comes from  backend/data/ingredient_training_data.csv
Model is persisted to     backend/ml/ingredient_model.joblib
"""

from __future__ import annotations

import csv
import logging
from pathlib import Path
from typing import Optional

logger = logging.getLogger("stockmanager.ml_model")

# ---------------------------------------------------------------------------
# Paths
# ---------------------------------------------------------------------------

_ML_DIR   = Path(__file__).resolve().parent
_DATA_DIR = _ML_DIR.parent / "data"
_TRAIN_CSV = _DATA_DIR / "ingredient_training_data.csv"
_MODEL_FILE = _ML_DIR / "ingredient_model.joblib"

# ---------------------------------------------------------------------------
# Lazy-load heavy deps
# ---------------------------------------------------------------------------

def _imports():
    import joblib
    from sklearn.linear_model import LogisticRegression
    from sklearn.pipeline import Pipeline
    from sklearn.feature_extraction.text import TfidfVectorizer
    return joblib, LogisticRegression, Pipeline, TfidfVectorizer


# ---------------------------------------------------------------------------
# Load / Train
# ---------------------------------------------------------------------------

_pipeline: Optional[object] = None   # cached in-memory pipeline


def load_model() -> object:
    """Return the trained pipeline, loading from disk or training if needed."""
    global _pipeline
    if _pipeline is not None:
        return _pipeline

    joblib, *_ = _imports()

    if _MODEL_FILE.exists():
        try:
            _pipeline = joblib.load(_MODEL_FILE)
            logger.info("[ML] model loaded from %s", _MODEL_FILE)
            return _pipeline
        except Exception:
            logger.warning("[ML] could not load model from disk, retraining…")

    _pipeline = train_model(save=True)
    return _pipeline


def train_model(save: bool = True) -> object:
    """
    Build and (optionally) save a TF-IDF → Logistic Regression pipeline.

    Reads training data from CSV.  Falls back to an empty model if no CSV.
    """
    global _pipeline

    joblib, LogisticRegression, Pipeline, TfidfVectorizer = _imports()

    texts, labels = _load_training_data()

    pipe = Pipeline([
        ("tfidf", TfidfVectorizer(
            analyzer="char_wb",
            ngram_range=(2, 4),
            min_df=1,
            sublinear_tf=True,
        )),
        ("clf", LogisticRegression(
            max_iter=1000,
            C=5.0,
            solver="lbfgs",
            multi_class="auto",
        )),
    ])

    if texts:
        pipe.fit(texts, labels)
        logger.info("[ML] trained on %d samples with %d unique classes", len(texts), len(set(labels)))
    else:
        logger.warning("[ML] no training data found — model untrained")

    if save:
        _MODEL_FILE.parent.mkdir(parents=True, exist_ok=True)
        joblib.dump(pipe, _MODEL_FILE)
        logger.info("[ML] model saved to %s", _MODEL_FILE)

    _pipeline = pipe
    return pipe


def predict(text: str) -> tuple[str, float]:
    """
    Predict ingredient name and confidence from *text*.

    Returns:
        (label, confidence_percent)
    """
    pipe = load_model()
    try:
        proba = pipe.predict_proba([text])[0]
        idx   = proba.argmax()
        label = pipe.classes_[idx]
        conf  = round(float(proba[idx]) * 100, 2)
        return label, conf
    except Exception as exc:
        logger.exception("[ML] predict failed: %s", exc)
        return "unmapped", 0.0


def retrain(new_text: str | None = None, new_label: str | None = None) -> None:
    """
    Optionally append a new (text, label) pair then retrain from full CSV.
    """
    if new_text and new_label:
        _append_training_row(new_text, new_label)

    train_model(save=True)
    logger.info("[ML] model retrained")


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _load_training_data() -> tuple[list[str], list[str]]:
    texts: list[str] = []
    labels: list[str] = []

    if not _TRAIN_CSV.exists():
        logger.warning("[ML] training CSV not found: %s", _TRAIN_CSV)
        return texts, labels

    with _TRAIN_CSV.open(newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            t = row.get("text", "").strip()
            l = row.get("label", "").strip()
            if t and l:
                texts.append(t)
                labels.append(l)

    return texts, labels


def _append_training_row(text: str, label: str) -> None:
    _DATA_DIR.mkdir(parents=True, exist_ok=True)
    write_header = not _TRAIN_CSV.exists()
    with _TRAIN_CSV.open("a", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=["text", "label"])
        if write_header:
            writer.writeheader()
        writer.writerow({"text": text, "label": label})
