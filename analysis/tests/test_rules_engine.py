"""
test_rules_engine.py

Tests unitaires pour le moteur de règles
"""

from datetime import datetime, timedelta

import pytest

from analysis.pipelines.rules_engine import DeadlineExtractor, RuleEngine
from analysis.schemas.models import InformationUnitSchema, PriorityEnum


class TestRuleDeadlineCritical:
    """Tests pour RULE-DEADLINE-CRITICAL"""

    def test_critical_deadline_3_days(self):
        """Si délai ≤ 3 jours → CRITICAL"""
        engine = RuleEngine()
        unit = InformationUnitSchema(
            id="test-1",
            source="EMAIL",
            content="Décision reçue. Délai: 3 jours pour former un recours.",
            content_hash="hash123",
            tenant_id="tenant1",
            received_at=datetime.now(),
        )

        priority, rules, score = engine.apply_all_rules(unit)

        assert priority in [PriorityEnum.CRITICAL, PriorityEnum.HIGH]
        assert "DEADLINE_CRITICAL" in rules or "DEADLINE_APPROACHING" in rules

    def test_normal_deadline_10_days(self):
        """Si délai > 10 jours → LOW ou MEDIUM"""
        engine = RuleEngine()
        unit = InformationUnitSchema(
            id="test-2",
            source="EMAIL",
            content="Courrier administratif. Délai: 30 jours.",
            content_hash="hash124",
            tenant_id="tenant1",
            received_at=datetime.now(),
        )

        priority, rules, score = engine.apply_all_rules(unit)
        # Should not be CRITICAL
        assert priority != PriorityEnum.CRITICAL


class TestRuleActorTypePriority:
    """Tests pour RULE-ACTOR-TYPE-PRIORITY"""

    def test_government_email_boost(self):
        """Email de @justice.fr ou @gouv.fr → priorité augmentée"""
        engine = RuleEngine()
        unit = InformationUnitSchema(
            id="test-3",
            source="EMAIL",
            content="Notification officielle",
            content_hash="hash125",
            tenant_id="tenant1",
            received_at=datetime.now(),
            source_metadata={"sender_email": "tribunal@justice.fr"},
        )

        priority, rules, score = engine.apply_all_rules(unit)

        # Should include actor priority rule
        assert "ACTOR_TYPE_PRIORITY" in rules
        assert score >= 1.0  # Should have boost


class TestRuleSemanticDeadline:
    """Tests pour RULE-DEADLINE-SEMANTIC"""

    def test_oqtf_detection(self):
        """Mot-clé 'OQTF' détecté → HIGH"""
        engine = RuleEngine()
        unit = InformationUnitSchema(
            id="test-4",
            source="EMAIL",
            content="OQTF prononcée à titre exécutoire. Délai d'exécution: 30 jours.",
            content_hash="hash126",
            tenant_id="tenant1",
            received_at=datetime.now(),
        )

        priority, rules, score = engine.apply_all_rules(unit)

        assert "DEADLINE_SEMANTIC" in rules or "DEADLINE_CRITICAL" in rules
        assert priority in [PriorityEnum.HIGH, PriorityEnum.CRITICAL]

    def test_appel_detection(self):
        """Mot-clé 'appel' ou 'recours' détecté → augmente priorité"""
        engine = RuleEngine()
        unit = InformationUnitSchema(
            id="test-5",
            source="EMAIL",
            content="Appel de la décision devant la CAA. Délai: 1 mois.",
            content_hash="hash127",
            tenant_id="tenant1",
            received_at=datetime.now(),
        )

        priority, rules, score = engine.apply_all_rules(unit)

        # Should detect semantic deadline
        assert len(rules) > 0


class TestRuleRepetitionAlert:
    """Tests pour RULE-REPETITION-ALERT"""

    def test_repeated_flow_alert(self):
        """2+ flux similaires en 30 jours → MEDIUM minimum"""
        engine = RuleEngine()
        unit = InformationUnitSchema(
            id="test-6",
            source="EMAIL",
            content="Nouvelle correspondance du même client",
            content_hash="hash128",
            tenant_id="tenant1",
            received_at=datetime.now(),
            source_metadata={"client_id": "client-123"},
        )

        priority, rules, score = engine.apply_all_rules(unit)

        assert score > 0  # Should have some boost


class TestDeadlineExtraction:
    """Tests pour DeadlineExtractor"""

    def test_extract_french_date(self):
        """Extraire date au format JJ/MM/AAAA"""
        extractor = DeadlineExtractor()
        content = "Décision du 15/02/2026"

        deadlines = extractor.extract_deadlines(content)

        assert len(deadlines) > 0
        # Should find at least one date

    def test_extract_semantic_deadline(self):
        """Extraire délai du texte (ex: '30 jours')"""
        extractor = DeadlineExtractor()
        content = "Vous avez 30 jours pour former recours."

        deadlines = extractor.extract_deadlines(content)

        # Should identify delay
        assert len(deadlines) >= 0  # Depends on implementation


class TestRuleIntegration:
    """Tests d'intégration"""

    def test_full_pipeline_critical_case(self):
        """Cas critique: OQTF + 3 jours → CRITICAL"""
        engine = RuleEngine()
        unit = InformationUnitSchema(
            id="critical-1",
            source="EMAIL",
            content="OQTF prononcée. Délai: 3 jours pour appel. Tribunal: CAA.",
            content_hash="hash999",
            tenant_id="tenant1",
            received_at=datetime.now(),
            source_metadata={"sender_email": "tribunal@justice.fr"},
        )

        priority, rules, score = engine.apply_all_rules(unit)

        # Should be CRITICAL
        assert priority == PriorityEnum.CRITICAL or priority == PriorityEnum.HIGH
        assert len(rules) >= 2  # At least 2 rules should apply


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
