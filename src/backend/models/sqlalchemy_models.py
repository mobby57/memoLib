"""
Models SQLAlchemy pour IAPosteManager
Base de données PostgreSQL - Système Freemium + MDPH

Date: 26 décembre 2025
Version: 1.0
"""

from sqlalchemy import (
    Column, String, Integer, Boolean, DateTime, Date, Text, 
    DECIMAL, ARRAY, Enum as SQLEnum, ForeignKey, BigInteger, TIMESTAMP
)
from sqlalchemy.dialects.postgresql import UUID, JSONB, INET
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from datetime import datetime
import uuid
import enum

Base = declarative_base()

# ============================================
# ENUMS PYTHON
# ============================================

class PlanType(str, enum.Enum):
    FREE = "free"
    AIDANT = "aidant"
    PREMIUM = "premium"
    PRO = "pro"

class UserStatus(str, enum.Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"
    SUSPENDED = "suspended"
    DELETED = "deleted"

class DocumentStatus(str, enum.Enum):
    PENDING = "pending"
    ANALYZED = "analyzed"
    ERROR = "error"
    ARCHIVED = "archived"

class DocumentType(str, enum.Enum):
    COURRIER = "courrier"
    FACTURE = "facture"
    CONTRAT = "contrat"
    CERTIFICAT_MEDICAL = "certificat_medical"
    FORMULAIRE_MDPH = "formulaire_mdph"
    DECISION_MDPH = "decision_mdph"
    AVIS_IMPOSITION = "avis_imposition"
    JUSTIFICATIF = "justificatif"
    AUTRE = "autre"

class PriorityLevel(str, enum.Enum):
    LOW = "low"
    NORMAL = "normal"
    HIGH = "high"
    URGENT = "urgent"

class TodoStatus(str, enum.Enum):
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CANCELLED = "cancelled"

class NotificationType(str, enum.Enum):
    EMAIL = "email"
    PUSH = "push"
    SMS = "sms"
    WEBHOOK = "webhook"

class NotificationStatus(str, enum.Enum):
    PENDING = "pending"
    SENT = "sent"
    FAILED = "failed"
    CANCELLED = "cancelled"

class AccessibilityMode(str, enum.Enum):
    DEFAULT = "default"
    MALVOYANT = "malvoyant"
    DEFICIENCE_MOTRICE = "deficience_motrice"
    DYSLEXIE = "dyslexie"
    DEFICIENCE_AUDITIVE = "deficience_auditive"
    DEFICIENCE_INTELLECTUELLE = "deficience_intellectuelle"

class SubscriptionStatus(str, enum.Enum):
    ACTIVE = "active"
    PAST_DUE = "past_due"
    CANCELLED = "cancelled"
    UNPAID = "unpaid"
    TRIALING = "trialing"

class MDPHFormStatus(str, enum.Enum):
    DRAFT = "draft"
    IN_PROGRESS = "in_progress"
    READY = "ready"
    SUBMITTED = "submitted"
    UNDER_REVIEW = "under_review"
    APPROVED = "approved"
    REJECTED = "rejected"
    APPEALED = "appealed"

class MDPHAllocationType(str, enum.Enum):
    AAH = "aah"
    PCH = "pch"
    RQTH = "rqth"
    CMI_INVALIDITE = "cmi_invalidite"
    CMI_PRIORITE = "cmi_priorite"
    CMI_STATIONNEMENT = "cmi_stationnement"
    AEEH = "aeeh"
    AVS = "avs"


# ============================================
# TABLES PRINCIPALES
# ============================================

class User(Base):
    __tablename__ = 'users'
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String(254), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    full_name = Column(String(200))
    phone = Column(String(20))
    
    # Plan & Abonnement
    plan_type = Column(SQLEnum(PlanType), nullable=False, default=PlanType.FREE, index=True)
    plan_started_at = Column(TIMESTAMP(timezone=True), default=func.now())
    plan_expires_at = Column(TIMESTAMP(timezone=True))
    
    # Statut AAH (gratuit à vie)
    aah_beneficiary = Column(Boolean, default=False, index=True)
    aah_verified_at = Column(TIMESTAMP(timezone=True))
    
    # Limites plan (JSON dynamique)
    plan_limits = Column(JSONB, default={
        "documents_per_month": 50,
        "todos_active": 20,
        "notifications_per_month": 100,
        "ai_analyses_per_month": 30,
        "storage_mb": 100,
        "api_requests_per_day": 100,
        "mdph_forms_per_year": 2
    })
    
    # Fonctionnalités activées
    features_enabled = Column(JSONB, default=["basic_analysis", "email_notifications", "accessibility"])
    
    # Statut & Metadata
    status = Column(SQLEnum(UserStatus), default=UserStatus.ACTIVE, index=True)
    is_verified = Column(Boolean, default=False)
    verified_at = Column(TIMESTAMP(timezone=True))
    last_login_at = Column(TIMESTAMP(timezone=True))
    login_count = Column(Integer, default=0)
    
    # Stripe
    stripe_customer_id = Column(String(100), unique=True, index=True)
    stripe_subscription_id = Column(String(100))
    
    # Timestamps
    created_at = Column(TIMESTAMP(timezone=True), default=func.now(), nullable=False)
    updated_at = Column(TIMESTAMP(timezone=True), default=func.now(), onupdate=func.now())
    deleted_at = Column(TIMESTAMP(timezone=True))
    
    # Relations
    profile = relationship("UserProfile", back_populates="user", uselist=False, cascade="all, delete-orphan")
    accessibility = relationship("AccessibilitySettings", back_populates="user", uselist=False, cascade="all, delete-orphan")
    documents = relationship("Document", back_populates="user", cascade="all, delete-orphan")
    todos = relationship("Todo", back_populates="user", cascade="all, delete-orphan")
    notifications = relationship("Notification", back_populates="user", cascade="all, delete-orphan")


class UserProfile(Base):
    __tablename__ = 'user_profiles'
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey('users.id', ondelete='CASCADE'), unique=True, nullable=False)
    
    # Informations personnelles
    date_of_birth = Column(Date)
    gender = Column(String(20))
    address_line1 = Column(String(200))
    address_line2 = Column(String(200))
    city = Column(String(100))
    postal_code = Column(String(10), index=True)
    country = Column(String(2), default='FR')
    
    # Handicap
    disability_type = Column(String(100), index=True)
    disability_level = Column(String(50))
    has_rqth = Column(Boolean, default=False)
    rqth_expiry_date = Column(Date)
    has_aah = Column(Boolean, default=False)
    aah_amount = Column(DECIMAL(10, 2))
    has_pch = Column(Boolean, default=False)
    pch_hours_allocated = Column(Integer)
    has_cmi = Column(Boolean, default=False)
    cmi_types = Column(String(100))
    
    # Contact urgence
    emergency_contact_name = Column(String(200))
    emergency_contact_phone = Column(String(20))
    emergency_contact_relation = Column(String(100))
    
    # Préférences
    preferred_language = Column(String(5), default='fr')
    timezone = Column(String(50), default='Europe/Paris')
    
    # Timestamps
    created_at = Column(TIMESTAMP(timezone=True), default=func.now())
    updated_at = Column(TIMESTAMP(timezone=True), default=func.now(), onupdate=func.now())
    
    # Relations
    user = relationship("User", back_populates="profile")


class AccessibilitySettings(Base):
    __tablename__ = 'accessibility_settings'
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey('users.id', ondelete='CASCADE'), unique=True, nullable=False)
    
    # Mode actif
    mode = Column(SQLEnum(AccessibilityMode), default=AccessibilityMode.DEFAULT, index=True)
    
    # Malvoyant
    high_contrast = Column(Boolean, default=False)
    large_font = Column(Boolean, default=False)
    font_size_multiplier = Column(DECIMAL(3, 2), default=1.00)
    screen_reader_enabled = Column(Boolean, default=False)
    voice_synthesis_enabled = Column(Boolean, default=False)
    voice_synthesis_speed = Column(DECIMAL(3, 2), default=1.00)
    
    # Déficience motrice
    keyboard_navigation_only = Column(Boolean, default=False)
    eye_tracking_enabled = Column(Boolean, default=False)
    large_buttons = Column(Boolean, default=False)
    no_double_click = Column(Boolean, default=False)
    voice_dictation_enabled = Column(Boolean, default=False)
    
    # Dyslexie
    dyslexia_font = Column(Boolean, default=False)
    line_spacing_multiplier = Column(DECIMAL(3, 2), default=1.00)
    line_highlight = Column(Boolean, default=False)
    text_simplification = Column(Boolean, default=False)
    
    # Déficience auditive
    visual_notifications = Column(Boolean, default=True)
    captions_enabled = Column(Boolean, default=False)
    sign_language_avatar = Column(Boolean, default=False)
    
    # Déficience intellectuelle
    easy_read_mode = Column(Boolean, default=False)
    pictograms_enabled = Column(Boolean, default=False)
    simplified_ui = Column(Boolean, default=False)
    
    # Timestamps
    created_at = Column(TIMESTAMP(timezone=True), default=func.now())
    updated_at = Column(TIMESTAMP(timezone=True), default=func.now(), onupdate=func.now())
    
    # Relations
    user = relationship("User", back_populates="accessibility")


class Document(Base):
    __tablename__ = 'documents'
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    
    # Fichier
    filename = Column(String(255), nullable=False)
    original_filename = Column(String(255), nullable=False)
    file_path = Column(Text, nullable=False)
    file_size_bytes = Column(BigInteger, nullable=False)
    mime_type = Column(String(100), nullable=False)
    file_hash = Column(String(64), index=True)
    
    # Métadonnées
    document_type = Column(SQLEnum(DocumentType), index=True)
    title = Column(String(500))
    description = Column(Text)
    tags = Column(ARRAY(Text), index=True)
    
    # Analyse IA
    status = Column(SQLEnum(DocumentStatus), default=DocumentStatus.PENDING, index=True)
    analyzed_at = Column(TIMESTAMP(timezone=True))
    analysis_model = Column(String(50))
    analysis_duration_ms = Column(Integer)
    
    # Résultats
    extracted_text = Column(Text)
    extracted_data = Column(JSONB)
    entities = Column(JSONB)
    confidence_score = Column(DECIMAL(5, 2))
    
    # Deadlines
    detected_deadlines = Column(ARRAY(Date))
    next_deadline = Column(Date, index=True)
    
    # Organisation
    folder = Column(String(200), default='Général', index=True)
    is_favorite = Column(Boolean, default=False)
    is_archived = Column(Boolean, default=False)
    archived_at = Column(TIMESTAMP(timezone=True))
    
    # Partage
    is_shared = Column(Boolean, default=False)
    share_token = Column(String(100), unique=True, index=True)
    share_expires_at = Column(TIMESTAMP(timezone=True))
    
    # Timestamps
    created_at = Column(TIMESTAMP(timezone=True), default=func.now(), index=True)
    updated_at = Column(TIMESTAMP(timezone=True), default=func.now(), onupdate=func.now())
    deleted_at = Column(TIMESTAMP(timezone=True))
    
    # Relations
    user = relationship("User", back_populates="documents")
    todos = relationship("Todo", back_populates="document")


class Todo(Base):
    __tablename__ = 'todos'
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    document_id = Column(UUID(as_uuid=True), ForeignKey('documents.id', ondelete='SET NULL'), index=True)
    
    # Tâche
    title = Column(String(500), nullable=False)
    description = Column(Text)
    notes = Column(Text)
    
    # Priorité & Statut
    priority = Column(SQLEnum(PriorityLevel), default=PriorityLevel.NORMAL, index=True)
    status = Column(SQLEnum(TodoStatus), default=TodoStatus.PENDING, index=True)
    
    # Dates
    due_date = Column(Date, index=True)
    reminder_date = Column(Date, index=True)
    completed_at = Column(TIMESTAMP(timezone=True))
    
    # Notifications
    notify_j_minus_7 = Column(Boolean, default=True)
    notify_j_minus_3 = Column(Boolean, default=True)
    notify_j_minus_1 = Column(Boolean, default=True)
    notify_jour_j = Column(Boolean, default=True)
    
    # Métadonnées
    is_auto_generated = Column(Boolean, default=True)
    auto_generation_confidence = Column(DECIMAL(5, 2))
    
    # Organisation
    category = Column(String(100))
    tags = Column(ARRAY(Text))
    
    # Timestamps
    created_at = Column(TIMESTAMP(timezone=True), default=func.now())
    updated_at = Column(TIMESTAMP(timezone=True), default=func.now(), onupdate=func.now())
    deleted_at = Column(TIMESTAMP(timezone=True))
    
    # Relations
    user = relationship("User", back_populates="todos")
    document = relationship("Document", back_populates="todos")
    notifications = relationship("Notification", back_populates="todo", cascade="all, delete-orphan")


class Notification(Base):
    __tablename__ = 'notifications'
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    todo_id = Column(UUID(as_uuid=True), ForeignKey('todos.id', ondelete='CASCADE'), index=True)
    
    # Type
    type = Column(SQLEnum(NotificationType), nullable=False)
    channel = Column(String(50), index=True)
    
    # Contenu
    title = Column(String(500), nullable=False)
    message = Column(Text, nullable=False)
    action_url = Column(Text)
    
    # Planification
    scheduled_for = Column(TIMESTAMP(timezone=True), nullable=False, index=True)
    sent_at = Column(TIMESTAMP(timezone=True))
    status = Column(SQLEnum(NotificationStatus), default=NotificationStatus.PENDING, index=True)
    
    # Résultat
    provider = Column(String(50))
    provider_message_id = Column(String(255), index=True)
    error_message = Column(Text)
    retry_count = Column(Integer, default=0)
    
    # Interaction
    read_at = Column(TIMESTAMP(timezone=True))
    clicked_at = Column(TIMESTAMP(timezone=True))
    
    # Timestamps
    created_at = Column(TIMESTAMP(timezone=True), default=func.now())
    updated_at = Column(TIMESTAMP(timezone=True), default=func.now(), onupdate=func.now())
    
    # Relations
    user = relationship("User", back_populates="notifications")
    todo = relationship("Todo", back_populates="notifications")


# ============================================
# TABLES FREEMIUM
# ============================================

class Subscription(Base):
    __tablename__ = 'subscriptions'
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    
    # Plan
    plan_type = Column(SQLEnum(PlanType), nullable=False)
    billing_interval = Column(String(20))
    
    # Prix
    amount_cents = Column(Integer, nullable=False)
    currency = Column(String(3), default='EUR')
    
    # Stripe
    stripe_subscription_id = Column(String(100), unique=True, index=True)
    stripe_price_id = Column(String(100))
    stripe_payment_method_id = Column(String(100))
    
    # Statut
    status = Column(SQLEnum(SubscriptionStatus), default=SubscriptionStatus.ACTIVE, index=True)
    trial_ends_at = Column(TIMESTAMP(timezone=True))
    current_period_start = Column(TIMESTAMP(timezone=True), nullable=False)
    current_period_end = Column(TIMESTAMP(timezone=True), nullable=False, index=True)
    cancel_at_period_end = Column(Boolean, default=False)
    cancelled_at = Column(TIMESTAMP(timezone=True))
    cancellation_reason = Column(Text)
    
    # Metadata
    metadata = Column(JSONB, default={})
    
    # Timestamps
    created_at = Column(TIMESTAMP(timezone=True), default=func.now())
    updated_at = Column(TIMESTAMP(timezone=True), default=func.now(), onupdate=func.now())


class UserQuota(Base):
    __tablename__ = 'user_quotas'
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    
    # Période
    period_start = Column(Date, nullable=False)
    period_end = Column(Date, nullable=False, index=True)
    
    # Usage
    usage_data = Column(JSONB, default={
        "documents_uploaded": 0,
        "ai_analyses": 0,
        "notifications_sent": 0,
        "api_requests": 0,
        "mdph_forms": 0,
        "storage_used_mb": 0
    })
    
    # Alertes
    alert_80_sent = Column(Boolean, default=False)
    alert_90_sent = Column(Boolean, default=False)
    alert_100_sent = Column(Boolean, default=False)
    
    # Timestamps
    created_at = Column(TIMESTAMP(timezone=True), default=func.now())
    updated_at = Column(TIMESTAMP(timezone=True), default=func.now(), onupdate=func.now())


# ============================================
# TABLES MDPH
# ============================================

class MDPHForm(Base):
    __tablename__ = 'mdph_forms'
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    
    # Formulaire
    form_type = Column(String(50), nullable=False)
    form_version = Column(String(20), default='2024')
    
    # Statut
    status = Column(SQLEnum(MDPHFormStatus), default=MDPHFormStatus.DRAFT, index=True)
    completion_percentage = Column(Integer, default=0, index=True)
    
    # Données
    form_data = Column(JSONB, default={})
    
    # IA
    ai_generated = Column(Boolean, default=False)
    ai_model = Column(String(50))
    ai_confidence_score = Column(DECIMAL(5, 2))
    ai_suggestions = Column(JSONB, default=[])
    
    # ML prédiction
    acceptance_score = Column(DECIMAL(5, 2))
    acceptance_factors = Column(JSONB, default=[])
    
    # Projet de vie
    life_project = Column(Text)
    life_project_ai_optimized = Column(Boolean, default=False)
    
    # Documents
    required_documents = Column(ARRAY(Text), default=[
        'Certificat médical',
        'Pièce identité',
        'Justificatif domicile',
        'Avis imposition'
    ])
    uploaded_documents = Column(ARRAY(UUID(as_uuid=True)))
    documents_complete = Column(Boolean, default=False)
    
    # Soumission
    submitted_at = Column(TIMESTAMP(timezone=True))
    submitted_to = Column(String(200))
    submission_method = Column(String(50))
    tracking_number = Column(String(100), index=True)
    
    # Décision
    decision_date = Column(Date)
    decision_result = Column(String(50))
    decision_details = Column(Text)
    decision_document_id = Column(UUID(as_uuid=True), ForeignKey('documents.id'))
    
    # Recours
    appeal_filed = Column(Boolean, default=False)
    appeal_date = Column(Date)
    appeal_reason = Column(Text)
    
    # Renouvellement
    is_renewal = Column(Boolean, default=False)
    previous_form_id = Column(UUID(as_uuid=True), ForeignKey('mdph_forms.id'))
    renewal_due_date = Column(Date, index=True)
    
    # Timestamps
    created_at = Column(TIMESTAMP(timezone=True), default=func.now())
    updated_at = Column(TIMESTAMP(timezone=True), default=func.now(), onupdate=func.now())
    deleted_at = Column(TIMESTAMP(timezone=True))


class MDPHAllocation(Base):
    __tablename__ = 'mdph_allocations'
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    form_id = Column(UUID(as_uuid=True), ForeignKey('mdph_forms.id', ondelete='SET NULL'))
    
    # Type
    allocation_type = Column(SQLEnum(MDPHAllocationType), nullable=False, index=True)
    
    # Montant
    monthly_amount_cents = Column(Integer)
    currency = Column(String(3), default='EUR')
    
    # Heures PCH
    monthly_hours = Column(Integer)
    
    # Statut
    is_active = Column(Boolean, default=True, index=True)
    
    # Dates
    granted_date = Column(Date, nullable=False)
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, index=True)
    renewal_alert_date = Column(Date, index=True)
    
    # Taux RQTH
    disability_rate = Column(Integer)
    
    # Organisme
    paying_organization = Column(String(200))
    payment_frequency = Column(String(20), default='monthly')
    
    # Suivi paiements
    last_payment_date = Column(Date)
    next_payment_date = Column(Date)
    
    # Consommation PCH
    hours_consumed_this_month = Column(Integer, default=0)
    hours_remaining_this_month = Column(Integer)
    
    # Optimisation IA
    ai_optimization_suggestions = Column(JSONB, default=[])
    potential_increase_euros = Column(Integer)
    
    # Documents
    decision_document_id = Column(UUID(as_uuid=True), ForeignKey('documents.id'))
    payment_proof_ids = Column(ARRAY(UUID(as_uuid=True)))
    
    # Timestamps
    created_at = Column(TIMESTAMP(timezone=True), default=func.now())
    updated_at = Column(TIMESTAMP(timezone=True), default=func.now(), onupdate=func.now())


# ============================================
# FONCTIONS UTILITAIRES
# ============================================

def init_db(engine):
    """Créer toutes les tables dans la base de données"""
    Base.metadata.create_all(engine)


def drop_all_tables(engine):
    """Supprimer toutes les tables (ATTENTION!)"""
    Base.metadata.drop_all(engine)
