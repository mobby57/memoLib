"""SQLAlchemy Base Models"""
from sqlalchemy import create_engine, Column, Integer, String, DateTime, Boolean, Text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from datetime import datetime
import os

Base = declarative_base()

class User(Base):
    __tablename__ = 'users'
    
    id = Column(Integer, primary_key=True)
    email = Column(String(254), unique=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    is_active = Column(Boolean, default=True)

class Email(Base):
    __tablename__ = 'emails'
    
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, nullable=False)
    recipient = Column(String(254), nullable=False)
    subject = Column(String(500), nullable=False)
    body = Column(Text, nullable=False)
    status = Column(String(50), default='draft')
    created_at = Column(DateTime, default=datetime.utcnow)
    sent_at = Column(DateTime, nullable=True)

class Template(Base):
    __tablename__ = 'templates'
    
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, nullable=False)
    name = Column(String(200), nullable=False)
    subject = Column(String(500), nullable=False)
    body = Column(Text, nullable=False)
    category = Column(String(100), default='general')
    created_at = Column(DateTime, default=datetime.utcnow)

def get_engine():
    db_url = os.environ.get('DATABASE_URL', 'sqlite:///data/app.db')
    return create_engine(db_url)

def get_session():
    engine = get_engine()
    Session = sessionmaker(bind=engine)
    return Session()

def init_db():
    engine = get_engine()
    Base.metadata.create_all(engine)
