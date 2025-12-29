"""
Modèles PostgreSQL avec Supabase
Généré par Amazon Q Developer
"""
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy.dialects.postgresql import UUID
import uuid
from datetime import datetime

db = SQLAlchemy()

class User(db.Model):
    __tablename__ = 'users'
    
    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = db.Column(db.String(255), unique=True, nullable=False, index=True)
    name = db.Column(db.String(100), nullable=False)
    company = db.Column(db.String(100))
    plan = db.Column(db.String(20), default='starter', index=True)
    is_active = db.Column(db.Boolean, default=True, index=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, index=True)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relations optimisées
    emails = db.relationship('Email', backref='user', lazy='dynamic', cascade='all, delete-orphan')
    templates = db.relationship('Template', backref='user', lazy='dynamic', cascade='all, delete-orphan')
    contacts = db.relationship('Contact', backref='user', lazy='dynamic', cascade='all, delete-orphan')
    
    def __repr__(self):
        return f'<User {self.email}>'

class Email(db.Model):
    __tablename__ = 'emails'
    
    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = db.Column(UUID(as_uuid=True), db.ForeignKey('users.id'), nullable=False, index=True)
    to_email = db.Column(db.String(255), nullable=False, index=True)
    subject = db.Column(db.String(500), nullable=False)
    content = db.Column(db.Text, nullable=False)
    status = db.Column(db.String(20), default='pending', index=True)
    provider = db.Column(db.String(50), default='smtp')
    error_message = db.Column(db.Text)
    sent_at = db.Column(db.DateTime, index=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, index=True)
    
    # Index composé pour performance
    __table_args__ = (
        db.Index('idx_user_status_created', 'user_id', 'status', 'created_at'),
    )

class Template(db.Model):
    __tablename__ = 'templates'
    
    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = db.Column(UUID(as_uuid=True), db.ForeignKey('users.id'), nullable=False, index=True)
    name = db.Column(db.String(100), nullable=False)
    subject = db.Column(db.String(500), nullable=False)
    content = db.Column(db.Text, nullable=False)
    variables = db.Column(db.JSON)  # Variables disponibles
    category = db.Column(db.String(50), index=True)
    is_public = db.Column(db.Boolean, default=False, index=True)
    usage_count = db.Column(db.Integer, default=0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, index=True)

class Contact(db.Model):
    __tablename__ = 'contacts'
    
    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = db.Column(UUID(as_uuid=True), db.ForeignKey('users.id'), nullable=False, index=True)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(255), nullable=False, index=True)
    company = db.Column(db.String(100))
    phone = db.Column(db.String(20))
    tags = db.Column(db.JSON)
    custom_fields = db.Column(db.JSON)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, index=True)
    
    __table_args__ = (
        db.UniqueConstraint('user_id', 'email', name='unique_user_contact'),
        db.Index('idx_user_email', 'user_id', 'email'),
    )

# Configuration Supabase
SUPABASE_CONFIG = {
    'url': 'https://your-project.supabase.co',
    'key': 'your-anon-key',
    'database_url': 'postgresql://postgres:password@db.supabase.co:5432/postgres'
}
