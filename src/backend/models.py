"""
SQLAlchemy Models pour IAPosteManager
"""
from sqlalchemy import Column, Integer, String, Text, DateTime, Boolean, ForeignKey, Float
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from datetime import datetime

Base = declarative_base()


class User(Base):
    """Modèle utilisateur"""
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    name = Column(String(255), nullable=True)
    hashed_password = Column(String(255), nullable=False)
    is_active = Column(Boolean, default=True)
    is_admin = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relations
    contacts = relationship("Contact", back_populates="user", cascade="all, delete-orphan")
    emails = relationship("Email", back_populates="user", cascade="all, delete-orphan")
    templates = relationship("Template", back_populates="user", cascade="all, delete-orphan")


class Contact(Base):
    """Modèle contact"""
    __tablename__ = "contacts"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    name = Column(String(255), nullable=False)
    email = Column(String(255), nullable=False, index=True)
    phone = Column(String(50), nullable=True)
    company = Column(String(255), nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relations
    user = relationship("User", back_populates="contacts")


class Email(Base):
    """Modèle email (historique)"""
    __tablename__ = "emails"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    to_email = Column(String(255), nullable=False, index=True)
    subject = Column(String(500), nullable=False)
    body = Column(Text, nullable=False)
    cc = Column(Text, nullable=True)  # JSON array
    bcc = Column(Text, nullable=True)  # JSON array
    status = Column(String(50), default="sent")  # sent, failed, draft
    sent_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relations
    user = relationship("User", back_populates="emails")


class Template(Base):
    """Modèle template email"""
    __tablename__ = "templates"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    name = Column(String(255), nullable=False)
    subject = Column(String(500), nullable=False)
    body = Column(Text, nullable=False)
    category = Column(String(100), nullable=True)
    is_default = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relations
    user = relationship("User", back_populates="templates")


class Document(Base):
    """Modèle document analysé"""
    __tablename__ = "documents"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    filename = Column(String(255), nullable=False)
    file_path = Column(String(500), nullable=False)
    file_type = Column(String(50), nullable=False)  # pdf, docx, image
    document_type = Column(String(100), nullable=True)  # facture, devis, contrat
    content_text = Column(Text, nullable=True)
    analysis_result = Column(Text, nullable=True)  # JSON
    amount = Column(Float, nullable=True)
    due_date = Column(DateTime, nullable=True)
    status = Column(String(50), default="pending")  # pending, processed, archived
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class Case(Base):
    """Modèle dossier juridique client - US10 Portail client suivi"""
    __tablename__ = "cases"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)  # Client propriétaire
    reference = Column(String(50), unique=True, index=True, nullable=False)  # EX: CASE-2024-001
    title = Column(String(255), nullable=False)  # Titre du dossier
    description = Column(Text, nullable=True)  # Description détaillée
    status = Column(String(50), default="open")  # open, in_progress, pending, closed, archived
    priority = Column(String(20), default="normal")  # low, normal, high, critical
    amount = Column(Float, nullable=True)  # Montant du dossier
    deadline = Column(DateTime, nullable=True)  # Deadline importante
    notes = Column(Text, nullable=True)  # Notes privées
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, index=True)

    # Relations
    user = relationship("User", backref="cases")


class Todo(Base):
    """Modèle TODO généré automatiquement"""
    __tablename__ = "todos"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    document_id = Column(Integer, ForeignKey("documents.id"), nullable=True)
    task = Column(String(500), nullable=False)
    description = Column(Text, nullable=True)
    priority = Column(String(20), default="medium")  # low, medium, high, critical
    status = Column(String(20), default="pending")  # pending, in_progress, completed, cancelled
    deadline = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class Notification(Base):
    """Modèle notification"""
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    todo_id = Column(Integer, ForeignKey("todos.id"), nullable=True)
    message = Column(Text, nullable=False)
    type = Column(String(50), default="info")  # info, warning, error, success
    priority = Column(String(20), default="medium")
    is_read = Column(Boolean, default=False)
    read_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class PaymentEvent(Base):
    """Evenement de paiement persistant pour audit et idempotence webhook."""
    __tablename__ = "payment_events"

    id = Column(Integer, primary_key=True, index=True)
    case_id = Column(Integer, ForeignKey("cases.id"), nullable=False, index=True)
    provider = Column(String(30), nullable=False, index=True)  # stripe, mock, etc.
    provider_event_id = Column(String(255), unique=True, index=True, nullable=True)
    provider_session_id = Column(String(255), index=True, nullable=True)
    payment_status = Column(String(30), nullable=False, index=True)
    source = Column(String(50), nullable=False)  # stripe_webhook, manual_confirm
    payload_json = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)

    # Relations
    case = relationship("Case", backref="payment_events")
