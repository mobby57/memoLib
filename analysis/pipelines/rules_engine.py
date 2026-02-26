"""
Legal rules engine

Each rule is:
- Deterministic (no ML, pure logic)
- Traceable (complete justification)
- Testable (unit cases)
- Legal (with juridical reference)
"""

import hashlib
import re
from datetime import datetime, timedelta
from difflib import SequenceMatcher
from enum import Enum
from typing import Any, Dict, List, Optional, Tuple

from ..schemas.models import (
    InformationUnitSchema,
    JustificationSchema,
    PriorityEnum,
    RuleApplicationSchema,
)


class RuleEngine:
    """Legal rules application engine"""

    def __init__(self):
        self.rules = {
            "RULE-DEADLINE-CRITICAL": self.rule_deadline_critical,
            "RULE-ACTOR-TYPE-PRIORITY": self.rule_actor_type_priority,
            "RULE-DEADLINE-SEMANTIC": self.rule_deadline_semantic,
            "RULE-REPETITION-ALERT": self.rule_repetition_alert,
        }

        # Deadline detection patterns
        self.deadline_patterns = {
            "OQTF": {
                "regex": r"obligation de quitter le territoire|OQTF",
                "legal_days": 30,
                "escalation": 90,
                "legal_basis": "CESEDA Art. L.532-1",
                "procedure_type": "OQTF",
            },
            "RECOURS_TA": {
                "regex": r"recours contentieux|référé|tribunal administratif",
                "legal_days": 2,  # Référé urgent
                "escalation": 60,  # Recours au fond
                "legal_basis": "CJA Art. L.521-1 (référé) / L.311-1 (au fond)",
                "procedure_type": "RECOURS_CONTENTIEUX",
            },
            "APPEL_CAA": {
                "regex": r"appel|cours administrat|CAA",
                "legal_days": 30,
                "escalation": None,
                "legal_basis": "CJA Art. L.311-1",
                "procedure_type": "APPEL",
            },
        }

        # Actor types
        self.actor_types = {
            "INSTITUTION": {
                "domains": [
                    "tribunal-administratif",
                    "cour-administrative-appel",
                    "conseil-etat.fr",
                    "ofii.fr",
                    "ants.gouv.fr",
                    "justice.fr",
                ],
                "priority_boost": 2,
            },
            "AVOCAT": {
                "domains": ["avocat", "cabinet"],
                "priority_boost": 1,
            },
            "CLIENT": {
                "domains": [],
                "priority_boost": 0,
            },
            "TIERS": {
                "domains": [],
                "priority_boost": -1,
            },
        }

    def apply_all_rules(
        self,
        unit: InformationUnitSchema,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> Tuple[PriorityEnum, List[RuleApplicationSchema], int]:
        """
        Apply ALL rules to an information unit

        Returns:
            (final_priority, applied_rules, priority_score)
        """
        applied_rules = []
        priority_score = 1  # MEDIUM = 1

        # Execute each rule
        for rule_id, rule_func in self.rules.items():
            result = rule_func(unit, metadata)
            if result:
                applied_rules.append(result)
                priority_score += result.priority_boost

        # Convert score to enum
        priority_score = max(0, min(3, priority_score))  # Clamp 0-3
        priority_map = {
            0: PriorityEnum.LOW,
            1: PriorityEnum.MEDIUM,
            2: PriorityEnum.HIGH,
            3: PriorityEnum.CRITICAL,
        }
        final_priority = priority_map[priority_score]

        return final_priority, applied_rules, priority_score

    # =============================
    # RULE 1: CRITICAL DEADLINE (3 days)
    # =============================

    def rule_deadline_critical(
        self,
        unit: InformationUnitSchema,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> Optional[RuleApplicationSchema]:
        """
        RULE-DEADLINE-CRITICAL:
        If a legal deadline expires within ≤ 3 days → CRITICAL
        """
        if not metadata or "deadline" not in metadata:
            return None

        deadline_data = metadata["deadline"]
        due_date = deadline_data.get("due_date")

        if not due_date:
            return None

        if isinstance(due_date, str):
            due_date = datetime.fromisoformat(due_date)

        days_remaining = (due_date - datetime.now()).days

        if days_remaining <= 3 and days_remaining > 0:
            return RuleApplicationSchema(
                rule_id="RULE-DEADLINE-CRITICAL",
                rule_name="Critical deadline (≤3 days)",
                matched=True,
                priority_boost=2,
                legal_basis=deadline_data.get("legal_basis"),
                justification={
                    "days_remaining": days_remaining,
                    "due_date": due_date.isoformat(),
                    "procedure_type": deadline_data.get("procedure_type"),
                    "reference_date": deadline_data.get("reference_date"),
                },
                confidence_score=1.0,
            )

        return None

    # =============================
    # RULE 2: ACTOR TYPE
    # =============================

    def rule_actor_type_priority(
        self,
        unit: InformationUnitSchema,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> Optional[RuleApplicationSchema]:
        """
        RULE-ACTOR-TYPE-PRIORITY:
        Source = public institution → priority + 1
        Source = lawyer → priority + 0.5
        Source = client → no boost
        """
        if not metadata or "sender_email" not in metadata:
            return None

        sender_email = metadata.get("sender_email", "").lower()

        # Détection du type d'acteur
        actor_type = "CLIENT"
        priority_boost = 0

        for actor, config in self.actor_types.items():
            for domain in config["domains"]:
                if domain.lower() in sender_email:
                    actor_type = actor
                    priority_boost = config["priority_boost"]
                    break
            if priority_boost != 0:
                break

        if priority_boost == 0:
            return None

        return RuleApplicationSchema(
            rule_id="RULE-ACTOR-TYPE-PRIORITY",
            rule_name=f"Type d'acteur: {actor_type}",
            matched=True,
            priority_boost=priority_boost,
            justification={
                "actor_type": actor_type,
                "sender_email": sender_email,
                "priority_boost": priority_boost,
            },
            confidence_score=0.9,  # Email can be spoofed
        )

    # =============================
    # RULE 3: DÉTECTION SÉMANTIQUE DE DÉLAI
    # =============================

    def rule_deadline_semantic(
        self,
        unit: InformationUnitSchema,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> Optional[RuleApplicationSchema]:
        """
        RULE-DEADLINE-SEMANTIC:
        Détecte les patterns de délais légaux dans le contenu textuel
        """
        detected_patterns = []

        for pattern_name, pattern_config in self.deadline_patterns.items():
            regex = pattern_config["regex"]

            if re.search(regex, unit.content, re.IGNORECASE):
                detected_patterns.append(
                    {
                        "pattern": pattern_name,
                        "legal_basis": pattern_config["legal_basis"],
                        "legal_days": pattern_config["legal_days"],
                        "procedure_type": pattern_config["procedure_type"],
                    }
                )

        if not detected_patterns:
            return None

        # Si on détecte un pattern → HIGH priority au minimum
        priority_boost = 1 if len(detected_patterns) == 1 else 2

        return RuleApplicationSchema(
            rule_id="RULE-DEADLINE-SEMANTIC",
            rule_name="Détection sémantique de délai",
            matched=True,
            priority_boost=priority_boost,
            justification={
                "detected_patterns": detected_patterns,
                "extraction_method": "semantic_pattern_matching",
                "confidence": "high" if len(detected_patterns) > 0 else "low",
            },
            confidence_score=0.95,
        )

    # =============================
    # RULE 4: RÉPÉTITION DÉTECTÉE
    # =============================

    def rule_repetition_alert(
        self,
        unit: InformationUnitSchema,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> Optional[RuleApplicationSchema]:
        """
        RULE-REPETITION-ALERT:
        Si le même type de document a été reçu 2+ fois en 30 jours
        """
        if not metadata or "repetition_count" not in metadata:
            return None

        repetition_count = metadata.get("repetition_count", 0)
        repetition_window = metadata.get("repetition_window_days", 30)

        if repetition_count >= 2:
            return RuleApplicationSchema(
                rule_id="RULE-REPETITION-ALERT",
                rule_name=f"Répétition détectée ({repetition_count}x)",
                matched=True,
                priority_boost=1,
                justification={
                    "repetition_count": repetition_count,
                    "window_days": repetition_window,
                    "alert": "MULTIPLE_INSTANCES",
                },
                confidence_score=1.0,
            )

        return None


# ===========================
# Utilitaires
# ===========================


class DeadlineExtractor:
    """Extrait les délais légaux du texte"""

    # Patterns pour extraction de dates
    DATE_PATTERNS = [
        r"(\d{1,2})/(\d{1,2})/(\d{4})",  # JJ/MM/AAAA
        r"(\d{4})-(\d{1,2})-(\d{1,2})",  # AAAA-MM-JJ
        r"(\d{1,2})\s+(?:janvier|février|mars|avril|mai|juin|juillet|août|septembre|octobre|novembre|décembre)\s+(\d{4})",  # JJ mois AAAA
    ]

    @staticmethod
    def extract_deadlines(content: str) -> List[Dict[str, Any]]:
        """Extrait tous les délais détectés"""
        extracted = []

        # Cherche les patterns de délai + date
        for date_pattern in DeadlineExtractor.DATE_PATTERNS:
            matches = re.finditer(date_pattern, content, re.IGNORECASE)
            for match in matches:
                extracted.append(
                    {
                        "matched_text": match.group(0),
                        "position": match.start(),
                        "context": content[
                            max(0, match.start() - 100) : match.end() + 100
                        ],
                    }
                )

        return extracted


class DuplicateDetector:
    """Détecte les doublons par checksum et fuzzy matching"""

    @staticmethod
    def checksum_match(content1: str, content2: str) -> bool:
        """Exact match par SHA-256"""
        hash1 = hashlib.sha256(content1.encode()).hexdigest()
        hash2 = hashlib.sha256(content2.encode()).hexdigest()
        return hash1 == hash2

    @staticmethod
    def fuzzy_match(content1: str, content2: str, threshold: float = 0.95) -> float:
        """Fuzzy match (Levenshtein-like) via SequenceMatcher"""
        ratio = SequenceMatcher(None, content1, content2).ratio()
        return ratio

    @staticmethod
    def metadata_match(
        metadata1: Dict[str, Any],
        metadata2: Dict[str, Any],
        time_window_seconds: int = 300,
    ) -> bool:
        """
        Match basé sur métadonnées:
        - Same sender
        - Same timestamp (±5min)
        - Same content hash
        """
        if metadata1.get("sender_email") != metadata2.get("sender_email"):
            return False

        time1 = metadata1.get("received_at")
        time2 = metadata2.get("received_at")

        if time1 and time2:
            time_diff = abs((time1 - time2).total_seconds())
            if time_diff > time_window_seconds:
                return False

        return True
