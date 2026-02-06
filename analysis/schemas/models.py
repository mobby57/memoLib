"""
Pydantic schemas for the analysis pipeline

Definition of immutable data structures for:
- InformationUnit ingestion
- Classification by rules
- EventLog generation
"""

from datetime import datetime
from enum import Enum
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field


class ActorTypeEnum(str, Enum):
    """Actor types - must match Prisma"""

    USER = "USER"
    SYSTEM = "SYSTEM"
    AI = "AI"


class EventTypeEnum(str, Enum):
    """Event types - subset of Prisma types"""

    FLOW_RECEIVED = "FLOW_RECEIVED"
    FLOW_NORMALIZED = "FLOW_NORMALIZED"
    FLOW_CLASSIFIED = "FLOW_CLASSIFIED"
    DUPLICATE_DETECTED = "DUPLICATE_DETECTED"
    DEADLINE_CRITICAL = "DEADLINE_CRITICAL"
    DEADLINE_APPROACHING = "DEADLINE_APPROACHING"
    DEADLINE_MISSED = "DEADLINE_MISSED"
    FLOW_SCORED = "FLOW_SCORED"


class PriorityEnum(str, Enum):
    """Niveaux de priorité"""

    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"


class InformationUnitSchema(BaseModel):
    """Schéma normalisé d'une InformationUnit entrante"""

    id: str
    tenant_id: str
    source: str  # EMAIL, UPLOAD, API, etc.
    content: str
    content_hash: str  # SHA-256

    received_at: datetime
    classified_at: Optional[datetime] = None
    analyzed_at: Optional[datetime] = None

    source_metadata: Optional[Dict[str, Any]] = None
    linked_workspace_id: Optional[str] = None

    class Config:
        use_enum_values = True


class RuleApplicationSchema(BaseModel):
    """Résultat d'application d'une règle"""

    rule_id: str  # ex: "RULE-DEADLINE-CRITICAL"
    rule_name: str
    matched: bool
    priority_boost: int = 0  # -1, 0, +1, +2
    justification: Dict[str, Any]
    legal_basis: Optional[str] = None
    confidence_score: float = 1.0  # 0.0 à 1.0

    class Config:
        use_enum_values = True


class ClassificationResultSchema(BaseModel):
    """Résultat final de la classification"""

    information_unit_id: str
    tenant_id: str

    base_priority: PriorityEnum = PriorityEnum.MEDIUM
    applied_rules: List[RuleApplicationSchema]

    final_priority: PriorityEnum
    priority_score: int  # 0-4 (LOW=0, MEDIUM=1, HIGH=2, CRITICAL=3, +boosts)

    classification_timestamp: datetime
    requires_human_validation: bool = False

    class Config:
        use_enum_values = True


class DuplicateDetectionSchema(BaseModel):
    """Résultat de détection de doublon"""

    primary_unit_id: str
    duplicate_unit_id: str

    detection_method: str  # "EXACT_MATCH", "FUZZY_MATCH", "METADATA_MATCH"
    similarity_score: float  # 0.0 à 1.0

    match_criteria: Dict[str, Any]
    time_window_applied: str  # ex: "5_minutes", "7_days"

    timestamp: datetime
    rule_applied: str = "RULE-DUPLICATE-DETECTION"


class EventLogSchema(BaseModel):
    """Schéma d'un EventLog à insérer dans Prisma"""

    id: str
    tenant_id: str

    timestamp: datetime
    event_type: EventTypeEnum

    entity_type: str  # 'flow', 'dossier', 'deadline', etc.
    entity_id: str

    actor_type: ActorTypeEnum
    actor_id: Optional[str] = None  # userId if actorType=USER

    # Métadonnées (JSON dans Prisma)
    metadata: Dict[str, Any]

    # Immuabilité
    immutable: bool = True
    checksum: str  # SHA-256
    previous_event_id: Optional[str] = None

    class Config:
        use_enum_values = True


class JustificationSchema(BaseModel):
    """Justification juridique complète d'une décision"""

    rule: str  # ID de la règle appliquée
    legal_basis: Optional[str] = None  # Article/code cité

    # Détails spécifiques à la règle
    details: Dict[str, Any]

    # Extraction de features
    extracted_features: Optional[Dict[str, Any]] = None

    # Confiance
    confidence_score: Optional[float] = None
    extraction_method: Optional[str] = None  # "regex", "semantic", "checksum", etc.

    # Validation requise?
    human_validation_required: bool = False
    validation_status: Optional[str] = None  # AUTO_CONFIDENCE_HIGH, PENDING_REVIEW


class PipelineResultSchema(BaseModel):
    """Résultat complet d'une exécution du pipeline"""

    execution_id: str
    tenant_id: str
    timestamp: datetime

    # Ingestion
    units_ingested: int
    units_normalized: int

    # Classification
    units_classified: int
    classifications: List[ClassificationResultSchema]

    # Doublons
    duplicates_detected: int
    duplicates: List[DuplicateDetectionSchema]

    # Événements générés
    events_generated: int
    events: List[EventLogSchema]

    # Métriques
    processing_time_seconds: float
    errors: List[Dict[str, str]] = []

    class Config:
        use_enum_values = True
