"""
generate_events.py

Étape finale: Génération des EventLog immuables
- Crée les EventLog pour chaque décision
- Enrichit avec justification complète
- Signe avec checksum SHA-256
- Transmet à l'API Next.js pour insertion Prisma
"""

import hashlib
import json
from datetime import datetime
from typing import Any, Dict, List

import requests

from ..schemas.models import (
    ActorTypeEnum,
    ClassificationResultSchema,
    DuplicateDetectionSchema,
    EventLogSchema,
    EventTypeEnum,
)


class EventLogger:
    """Génère et persiste les EventLog immuables"""

    def __init__(self, api_base_url: str = "http://localhost:3000"):
        self.api_base_url = api_base_url

    def generate_classification_event(
        self,
        classification: ClassificationResultSchema,
        tenant_id: str,
    ) -> EventLogSchema:
        """
        Génère un EventLog pour une classification

        EventType: FLOW_CLASSIFIED
        """
        # Construit la justification
        justification = {
            "base_priority": classification.base_priority.value,
            "final_priority": classification.final_priority.value,
            "priority_score": classification.priority_score,
            "applied_rules": [
                {
                    "rule_id": rule.rule_id,
                    "rule_name": rule.rule_name,
                    "priority_boost": rule.priority_boost,
                    "legal_basis": rule.legal_basis,
                    "justification": rule.justification,
                    "confidence_score": rule.confidence_score,
                }
                for rule in classification.applied_rules
            ],
            "requires_human_validation": (classification.requires_human_validation),
        }

        # Métadonnées complètes
        metadata = {
            "classification_timestamp": (
                classification.classification_timestamp.isoformat()
            ),
            "justification": justification,
            "source": "analysis_pipeline",
            "pipeline_version": "1.0",
        }

        # Sérialise et signe
        metadata_json = json.dumps(metadata, sort_keys=True)
        checksum = hashlib.sha256(metadata_json.encode()).hexdigest()

        return EventLogSchema(
            id=self._generate_event_id(),
            tenant_id=tenant_id,
            timestamp=datetime.now(),
            event_type=EventTypeEnum.FLOW_CLASSIFIED,
            entity_type="information_unit",
            entity_id=classification.information_unit_id,
            actor_type=ActorTypeEnum.SYSTEM,
            actor_id=None,
            metadata=metadata,
            immutable=True,
            checksum=checksum,
            previous_event_id=None,
        )

    def generate_duplicate_event(
        self,
        duplicate: DuplicateDetectionSchema,
        tenant_id: str,
    ) -> EventLogSchema:
        """
        Génère un EventLog pour une détection de doublon

        EventType: DUPLICATE_DETECTED
        """
        justification = {
            "detection_method": duplicate.detection_method,
            "similarity_score": duplicate.similarity_score,
            "match_criteria": duplicate.match_criteria,
            "time_window_applied": duplicate.time_window_applied,
            "rule_applied": duplicate.rule_applied,
        }

        metadata = {
            "primary_unit_id": duplicate.primary_unit_id,
            "duplicate_unit_id": duplicate.duplicate_unit_id,
            "justification": justification,
            "action_status": "PROPOSED_FOR_LINKING",
            "action_options": [
                "LINK_AND_PRIORITIZE_ORIGINAL",
                "LINK_AND_PRIORITIZE_NEW",
                "LINK_AND_MERGE_METADATA",
                "DISMISS_DUPLICATE_CLAIM",
            ],
            "human_action_required": True,
            "source": "duplicate_detector",
        }

        metadata_json = json.dumps(metadata, sort_keys=True)
        checksum = hashlib.sha256(metadata_json.encode()).hexdigest()

        return EventLogSchema(
            id=self._generate_event_id(),
            tenant_id=tenant_id,
            timestamp=duplicate.timestamp,
            event_type=EventTypeEnum.DUPLICATE_DETECTED,
            entity_type="information_unit",
            entity_id=duplicate.duplicate_unit_id,
            actor_type=ActorTypeEnum.SYSTEM,
            actor_id=None,
            metadata=metadata,
            immutable=True,
            checksum=checksum,
            previous_event_id=None,
        )

    def generate_deadline_event(
        self,
        entity_id: str,
        deadline_data: Dict[str, Any],
        event_type: EventTypeEnum,
        tenant_id: str,
    ) -> EventLogSchema:
        """
        Génère un EventLog pour un événement de délai

        EventType: DEADLINE_CRITICAL | DEADLINE_APPROACHING | DEADLINE_MISSED
        """
        justification = {
            "rule": deadline_data.get("rule", "RULE-DEADLINE-*"),
            "legal_basis": deadline_data.get("legal_basis"),
            "days_remaining": deadline_data.get("days_remaining"),
            "procedure_type": deadline_data.get("procedure_type"),
            "reference_date": deadline_data.get("reference_date"),
            "due_date": deadline_data.get("due_date"),
        }

        metadata = {
            "deadline_data": deadline_data,
            "justification": justification,
            "automatic_detection": True,
            "human_action_recommended": True,
            "source": "deadline_monitor",
        }

        metadata_json = json.dumps(metadata, sort_keys=True)
        checksum = hashlib.sha256(metadata_json.encode()).hexdigest()

        return EventLogSchema(
            id=self._generate_event_id(),
            tenant_id=tenant_id,
            timestamp=datetime.now(),
            event_type=event_type,
            entity_type="deadline",
            entity_id=entity_id,
            actor_type=ActorTypeEnum.SYSTEM,
            actor_id=None,
            metadata=metadata,
            immutable=True,
            checksum=checksum,
            previous_event_id=None,
        )

    def persist_events(
        self,
        events: List[EventLogSchema],
        tenant_id: str,
    ) -> Dict[str, Any]:
        """
        Persiste les EventLog dans Prisma (via API Next.js)

        Endpoint: POST /api/analysis/create-events

        Returns:
            {
                "success": bool,
                "created_count": int,
                "failed_count": int,
                "errors": [...]
            }
        """
        if not events:
            return {"success": True, "created_count": 0, "failed_count": 0}

        endpoint = f"{self.api_base_url}/api/analysis/create-events"

        payload = {
            "tenantId": tenant_id,
            "events": [
                {
                    "id": event.id,
                    "timestamp": event.timestamp.isoformat(),
                    "eventType": event.event_type.value,
                    "entityType": event.entity_type,
                    "entityId": event.entity_id,
                    "actorType": event.actor_type.value,
                    "actorId": event.actor_id,
                    "metadata": event.metadata,
                    "immutable": event.immutable,
                    "checksum": event.checksum,
                    "previousEventId": event.previous_event_id,
                }
                for event in events
            ],
        }

        try:
            response = requests.post(
                endpoint,
                json=payload,
                timeout=30,
            )
            response.raise_for_status()

            result = response.json()
            print(f"\n✅ EventLog: {result.get('created_count', 0)} créés")

            if result.get("failed_count", 0) > 0:
                print(f"⚠️  {result.get('failed_count', 0)} erreurs d'insertion")
                for error in result.get("errors", []):
                    print(f"   - {error}")

            return result

        except requests.RequestException as e:
            print(f"❌ Erreur persistence EventLog: {e}")
            return {
                "success": False,
                "created_count": 0,
                "failed_count": len(events),
                "errors": [str(e)],
            }

    @staticmethod
    def _generate_event_id() -> str:
        """Génère un ID d'événement unique (CUID-like)"""
        import uuid

        return str(uuid.uuid4()).replace("-", "")[:24]


# ===========================
# Utilités
# ===========================


def create_event_audit_report(
    events_persisted: int,
    events_failed: int,
    classifications: int,
    duplicates: int,
) -> Dict[str, Any]:
    """Crée un rapport d'audit pour la run du pipeline"""
    return {
        "timestamp": datetime.now().isoformat(),
        "events_persisted": events_persisted,
        "events_failed": events_failed,
        "classifications_processed": classifications,
        "duplicates_detected": duplicates,
        "status": "SUCCESS" if events_failed == 0 else "PARTIAL",
    }
