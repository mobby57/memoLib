"""
Intégration du pipeline d'analyse dans Flask local

Ce fichier ajoute les endpoints pour:
- Exécuter le pipeline
- Monitorer les runs
- Tester les règles

À ajouter dans backend-python/app.py (ou importer)
"""

import json
from datetime import datetime

from flask import Blueprint, jsonify, request

# Import du pipeline (si localisé dans le même projet)
# from analysis.pipelines.pipeline import AnalysisPipeline

analysis_bp = Blueprint("analysis", __name__, url_prefix="/analysis")


@analysis_bp.route("/health", methods=["GET"])
def health():
    """Vérifie que le module d'analyse est disponible"""
    return jsonify(
        {
            "status": "ok",
            "module": "analysis_pipeline",
            "version": "1.0",
            "timestamp": datetime.now().isoformat(),
        }
    )


@analysis_bp.route("/execute", methods=["POST"])
def execute_pipeline():
    """
    Exécute le pipeline d'analyse

    Body:
    {
        "tenant_id": "tenant_001",
        "unit_status": "RECEIVED",
        "limit": 100,
        "persist": true
    }

    Returns:
    {
        "execution_id": "exec_20260204_150000",
        "status": "success",
        "units_classified": 100,
        "events_generated": 105,
        "duplicates_detected": 5,
        "processing_time_seconds": 12.5
    }
    """
    try:
        payload = request.get_json()
        tenant_id = payload.get("tenant_id")
        unit_status = payload.get("unit_status", "RECEIVED")
        limit = payload.get("limit", 100)
        persist = payload.get("persist", True)

        if not tenant_id:
            return jsonify({"error": "tenant_id required"}), 400

        # Exécute le pipeline
        # pipeline = AnalysisPipeline(
        #     tenant_id=tenant_id,
        #     api_base_url="http://localhost:3000"
        # )
        # result = pipeline.execute(
        #     unit_status=unit_status,
        #     limit=limit,
        #     persist=persist
        # )

        # Pour le test, retourne un résultat simulé
        return jsonify(
            {
                "execution_id": f"exec_{datetime.now().strftime('%Y%m%d_%H%M%S')}",
                "status": "success",
                "tenant_id": tenant_id,
                "units_ingested": 100,
                "units_classified": 100,
                "duplicates_detected": 5,
                "events_generated": 105,
                "processing_time_seconds": 12.5,
                "message": "Pipeline execution completed successfully",
            }
        )

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@analysis_bp.route("/test-rules", methods=["POST"])
def test_rules():
    """
    Teste les règles sur une unité d'information unique

    Body:
    {
        "content": "OQTF received on 01/12/2025...",
        "sender_email": "client@example.com",
        "received_at": "2026-02-04T10:00:00Z"
    }

    Returns:
    {
        "applied_rules": [
            {
                "rule_id": "RULE-DEADLINE-SEMANTIC",
                "matched": true,
                "priority_boost": 1,
                "legal_basis": "CESEDA Art. L.532-1"
            }
        ],
        "final_priority": "HIGH",
        "confidence_score": 0.95
    }
    """
    try:
        payload = request.get_json()
        content = payload.get("content")
        sender_email = payload.get("sender_email", "")

        if not content:
            return jsonify({"error": "content required"}), 400

        # Crée une unité simulée
        from analysis.pipelines.rules_engine import RuleEngine
        from analysis.schemas.models import InformationUnitSchema

        unit = InformationUnitSchema(
            id="test_unit",
            tenant_id="test",
            source="EMAIL",
            content=content,
            content_hash="test",
            received_at=datetime.now(),
            source_metadata={"sender_email": sender_email},
        )

        # Applique les règles
        rule_engine = RuleEngine()
        final_priority, applied_rules, score = rule_engine.apply_all_rules(unit)

        return jsonify(
            {
                "content_snippet": (
                    content[:100] + "..." if len(content) > 100 else content
                ),
                "sender_email": sender_email,
                "applied_rules": [
                    {
                        "rule_id": rule.rule_id,
                        "rule_name": rule.rule_name,
                        "matched": rule.matched,
                        "priority_boost": rule.priority_boost,
                        "legal_basis": rule.legal_basis,
                        "confidence_score": rule.confidence_score,
                    }
                    for rule in applied_rules
                ],
                "final_priority": final_priority.value,
                "priority_score": score,
            }
        )

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@analysis_bp.route("/stats", methods=["GET"])
def get_stats():
    """
    Retourne les statistiques du pipeline

    À implémenter avec requêtes à la DB
    """
    return jsonify(
        {
            "units_processed_today": 47,
            "units_processed_this_week": 312,
            "average_processing_time_ms": 125,
            "duplicates_detected_today": 3,
            "events_generated_today": 47,
            "rules_active": 4,
            "last_execution": datetime.now().isoformat(),
        }
    )


# À ajouter dans backend-python/app.py:
# app.register_blueprint(analysis_bp)
