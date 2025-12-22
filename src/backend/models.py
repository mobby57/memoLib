"""
Modèles SQLAlchemy pour Alembic
"""
from sqlalchemy import create_engine, Column, Integer, String, DateTime, Boolean, Text, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from datetime import datetime

Base = declarative_base()

class User(Base):
    """Utilisateurs de l'application"""
    __tablename__ = 'users'
    
    id = Column(Integer, primary_key=True)
    email = Column(String(255), unique=True, nullable=False)
    username = Column(String(100), unique=True, nullable=False)
    password_hash = Column(String(255))
    is_active = Column(Boolean, default=True)
    is_admin = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class EmailAccount(Base):
    """Comptes email provisionnés"""
    __tablename__ = 'email_accounts'
    
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    email_address = Column(String(255), unique=True, nullable=False)
    username = Column(String(100), nullable=False)
    display_name = Column(String(255))
    
    # Configuration SMTP
    smtp_server = Column(String(255))
    smtp_port = Column(Integer)
    smtp_username = Column(String(255))
    
    # Métadonnées
    provider = Column(String(50))
    status = Column(String(20), default='active')
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Quotas
    emails_sent_today = Column(Integer, default=0)
    emails_sent_month = Column(Integer, default=0)
    daily_limit = Column(Integer, default=500)
    monthly_limit = Column(Integer, default=10000)
    
    # Relations
    user = relationship('User', backref='email_accounts')


class EmailProvisioningLog(Base):
    """Log des opérations de provisioning"""
    __tablename__ = 'email_provisioning_logs'
    
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    email_account_id = Column(Integer, ForeignKey('email_accounts.id'))
    action = Column(String(50))
    status = Column(String(20))
    error_message = Column(String(500))
    ip_address = Column(String(45))
    user_agent = Column(String(255))
    created_at = Column(DateTime, default=datetime.utcnow)


class Email(Base):
    """Emails stockés"""
    __tablename__ = 'emails'
    
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey('users.id'))
    sender = Column(String(255))
    recipient = Column(String(255))
    subject = Column(String(500))
    body = Column(Text)
    status = Column(String(20), default='draft')
    created_at = Column(DateTime, default=datetime.utcnow)
    sent_at = Column(DateTime)
    
    user = relationship('User', backref='emails')
