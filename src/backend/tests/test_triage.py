"""
Tests unitaires - US12 Triage Assistant Priorisé
Couvre: scoring catégories, calcul priorité, assignation juriste, endpoint /analyze
"""
import pytest
from datetime import datetime, timedelta

# Imports du module triage (sans FastAPI/DB requis)
import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from routes.triage import (
    _normalize,
    _score_categories,
    _detect_escalation,
    _compute_priority,
    _assign_jurist,
    _recommended_actions,
    _estimate_delay,
    PRIORITY_ORDER,
)


# ---------------------------------------------------------------------------
# _normalize
# ---------------------------------------------------------------------------

class TestNormalize:
    def test_lowercase(self):
        assert _normalize("Licenciement") == "licenciement"

    def test_accents_removed(self):
        result = _normalize("harcèlement éxpulsion")
        assert "harcelement" in result
        assert "explosion" not in result  # "expulsion" without accent → "expulsion"
        assert "expulsion" in result

    def test_cedilla(self):
        assert "c" in _normalize("façade")


# ---------------------------------------------------------------------------
# _score_categories
# ---------------------------------------------------------------------------

class TestScoreCategories:
    def test_travail_keywords(self):
        scores = _score_categories("J'ai été victime d'un licenciement abusif sans préavis")
        top = scores[0]
        assert top.category == "droit_travail"
        assert top.score >= 2

    def test_famille_keywords(self):
        scores = _score_categories(
            "Je veux divorcer et obtenir la pension alimentaire, peut-être demander l'adoption"
        )
        top = scores[0]
        assert top.category == "droit_famille"
        assert len(top.matched_keywords) >= 2

    def test_no_match_returns_zero_scores(self):
        scores = _score_categories("Je veux acheter un vélo rouge")
        assert scores[0].score == 0  # aucun mot-clé trouvé

    def test_returns_all_categories(self):
        from routes.triage import CATEGORY_KEYWORDS
        scores = _score_categories("quelque chose")
        assert len(scores) == len(CATEGORY_KEYWORDS)

    def test_sorted_descending(self):
        scores = _score_categories("licenciement divorce loyer expulsion")
        for i in range(len(scores) - 1):
            assert scores[i].score >= scores[i + 1].score


# ---------------------------------------------------------------------------
# _detect_escalation
# ---------------------------------------------------------------------------

class TestDetectEscalation:
    def test_urgent_keyword(self):
        assert _detect_escalation("C'est urgent, j'ai une audience demain") is True

    def test_normal_text(self):
        assert _detect_escalation("Je cherche de l'aide pour mon contrat") is False

    def test_huissier_keyword(self):
        assert _detect_escalation("Huissier ce soir, assignation sous 48h") is True


# ---------------------------------------------------------------------------
# _compute_priority
# ---------------------------------------------------------------------------

class TestComputePriority:
    def test_urgence_judiciaire_gives_critical(self):
        priority, score = _compute_priority("urgence_judiciaire", False, None)
        assert priority == "critical"
        assert score == 3

    def test_escalation_upgrades_priority(self):
        priority_base, _ = _compute_priority("droit_immobilier", False, None)
        priority_esc, _ = _compute_priority("droit_immobilier", True, None)
        assert PRIORITY_ORDER[priority_esc] > PRIORITY_ORDER[priority_base]

    def test_deadline_2_days_gives_critical(self):
        deadline = datetime.utcnow() + timedelta(days=1)
        priority, score = _compute_priority("droit_consommation", False, deadline)
        assert priority == "critical"

    def test_deadline_5_days_gives_high(self):
        deadline = datetime.utcnow() + timedelta(days=5)
        priority, score = _compute_priority("droit_consommation", False, deadline)
        assert PRIORITY_ORDER[priority] >= PRIORITY_ORDER["high"]

    def test_score_does_not_exceed_3(self):
        deadline = datetime.utcnow() + timedelta(days=1)
        _, score = _compute_priority("urgence_judiciaire", True, deadline)
        assert score <= 3


# ---------------------------------------------------------------------------
# _assign_jurist
# ---------------------------------------------------------------------------

class TestAssignJurist:
    def test_assigns_specialist_for_travail(self):
        result = _assign_jurist("droit_travail", "high")
        assert result is not None
        assert "droit_travail" in result.reason or "Spécialiste" in result.reason

    def test_assigns_jurist_for_unknown_category(self):
        result = _assign_jurist("autre", "low")
        assert result is not None  # retourne le moins chargé du pool

    def test_result_has_required_fields(self):
        result = _assign_jurist("droit_famille", "normal")
        assert result.jurist_id is not None
        assert result.jurist_name != ""
        assert result.reason != ""


# ---------------------------------------------------------------------------
# _recommended_actions
# ---------------------------------------------------------------------------

class TestRecommendedActions:
    def test_critical_has_urgent_action(self):
        actions = _recommended_actions("critical", "urgence_judiciaire", None)
        assert any("2 heure" in a or "urgent" in a.lower() for a in actions)

    def test_low_has_48h_action(self):
        actions = _recommended_actions("low", "droit_consommation", None)
        assert any("48" in a or "72" in a for a in actions)

    def test_deadline_appears_in_actions(self):
        deadline = datetime.utcnow() + timedelta(days=5)
        actions = _recommended_actions("high", "droit_travail", deadline)
        assert any("5 jour" in a for a in actions)

    def test_returns_list(self):
        actions = _recommended_actions("normal", "droit_famille", None)
        assert isinstance(actions, list)
        assert len(actions) >= 1


# ---------------------------------------------------------------------------
# _estimate_delay
# ---------------------------------------------------------------------------

class TestEstimateDelay:
    def test_critical_faster_than_low(self):
        assert _estimate_delay("droit_travail", "critical") < _estimate_delay("droit_travail", "low")

    def test_administrative_longer_than_travail(self):
        assert _estimate_delay("droit_administratif", "normal") > _estimate_delay("droit_travail", "normal")

    def test_returns_int(self):
        result = _estimate_delay("droit_famille", "high")
        assert isinstance(result, int)
        assert result > 0


# ---------------------------------------------------------------------------
# Tests d'intégration — endpoint FastAPI (TestClient)
# ---------------------------------------------------------------------------

try:
    from fastapi.testclient import TestClient
    from fastapi import FastAPI
    from routes.triage import router as triage_router

    _app = FastAPI()
    _app.include_router(triage_router)
    client = TestClient(_app)

    class TestTriageEndpoint:
        def test_analyze_travail(self):
            resp = client.post("/api/triage/analyze", json={
                "title": "Licenciement abusif",
                "description": "Mon employeur m'a licencié sans préavis après 10 ans. Je n'ai pas reçu mon solde de tout compte.",
            })
            assert resp.status_code == 200
            data = resp.json()
            assert data["detected_category"] == "droit_travail"
            assert "priority" in data
            assert "assigned_jurist" in data
            assert "recommended_actions" in data

        def test_analyze_requires_title(self):
            resp = client.post("/api/triage/analyze", json={
                "title": "ab",  # trop court
                "description": "description suffisamment longue pour passer la validation initiale",
            })
            assert resp.status_code == 422  # Unprocessable Entity

        def test_analyze_requires_description(self):
            resp = client.post("/api/triage/analyze", json={
                "title": "Dossier valide",
                "description": "court",  # trop court
            })
            assert resp.status_code == 422

        def test_categories_endpoint(self):
            resp = client.get("/api/triage/categories")
            assert resp.status_code == 200
            data = resp.json()
            assert "categories" in data
            assert len(data["categories"]) > 0

        def test_jurists_endpoint(self):
            resp = client.get("/api/triage/jurists")
            assert resp.status_code == 200
            data = resp.json()
            assert "jurists" in data
            assert len(data["jurists"]) > 0

        def test_urgent_escalates_priority(self):
            resp_normal = client.post("/api/triage/analyze", json={
                "title": "Problème de loyer",
                "description": "Mon propriétaire refuse de me rembourser le dépôt de garantie depuis 3 mois.",
                "client_urgency_claim": False,
            })
            resp_urgent = client.post("/api/triage/analyze", json={
                "title": "Problème de loyer urgent",
                "description": "Mon propriétaire refuse de me rembourser le dépôt de garantie depuis 3 mois, urgent.",
                "client_urgency_claim": True,
            })
            assert resp_normal.status_code == 200
            assert resp_urgent.status_code == 200
            prio_normal = PRIORITY_ORDER.get(resp_normal.json()["priority"], 0)
            prio_urgent = PRIORITY_ORDER.get(resp_urgent.json()["priority"], 0)
            assert prio_urgent >= prio_normal

        def test_triage_id_is_unique(self):
            payload = {
                "title": "Dossier famille",
                "description": "Je souhaite entamer une procédure de divorce avec garde partagée des enfants.",
            }
            ids = {client.post("/api/triage/analyze", json=payload).json()["triage_id"] for _ in range(3)}
            assert len(ids) == 3  # 3 UUIDs différents

except ImportError:
    pass  # httpx/starlette non installé, tests d'intégration sautés
