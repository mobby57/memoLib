"""Tests de non-regression pour le service predictive_ai."""

from __future__ import annotations

import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from services.predictive_ai import PredictiveLegalAI  # noqa: E402


def test_fallback_prediction_shape() -> None:
    ai = PredictiveLegalAI()

    result = ai.predict_case_success(
        "Je suis en France depuis 10 ans, je travaille et j'ai des enfants.",
        procedure_type="procedure_inconnue",
    )

    assert "success_probability" in result
    assert "confidence" in result
    assert "key_factors" in result
    assert "recommendations" in result
    assert result["procedure_type"] == "procedure_inconnue"


def test_get_model_stats_returns_dict() -> None:
    ai = PredictiveLegalAI()
    stats = ai.get_model_stats()
    assert isinstance(stats, dict)
