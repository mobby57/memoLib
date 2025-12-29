"""
SQLite Database Models - Free Solution
"""
from sqlalchemy import create_engine, Column, Integer, String, Text, DateTime, Boolean, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
from datetime import datetime
import os

# SQLite database path
DATABASE_PATH = os.path.join(os.path.dirname(__file__), '..', 'data', 'iapostemanager.db')
DATABASE_URL = f"sqlite:///{DATABASE_PATH}"

# Create engine
engine = create_engine(DATABASE_URL, echo=False)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    password = Column(String)
    name = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    emails = relationship("Email", back_populates="user")
    contacts = relationship("Contact", back_populates="user")
    templates = relationship("Template", back_populates="user")

class Email(Base):
    __tablename__ = "emails"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    recipient = Column(String)
    subject = Column(String)
    body = Column(Text)
    status = Column(String, default="draft")
    ai_generated = Column(Boolean, default=False)
    sent_at = Column(DateTime)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    user = relationship("User", back_populates="emails")

class Contact(Base):
    __tablename__ = "contacts"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    name = Column(String)
    email = Column(String)
    organization = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    user = relationship("User", back_populates="contacts")

class Template(Base):
    __tablename__ = "templates"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    name = Column(String)
    subject = Column(String)
    body = Column(Text)
    category = Column(String, default="general")
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    user = relationship("User", back_populates="templates")

def init_db():
    """Initialize database"""
    # Create data directory if not exists
    os.makedirs(os.path.dirname(DATABASE_PATH), exist_ok=True)
    
    # Create tables
    Base.metadata.create_all(bind=engine)
    
    # Create default user if not exists
    db = SessionLocal()
    try:
        existing_user = db.query(User).filter(User.email == "admin@iaposte.com").first()
        if not existing_user:
            from services.auth_service import hash_password
            default_user = User(
                email="admin@iaposte.com",
                password=hash_password("admin123"),
                name="Admin User"
            )
            db.add(default_user)
            db.commit()
            print("✅ Default user created: admin@iaposte.com / admin123")
    finally:
        db.close()

def get_db():
    """Get database session"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

if __name__ == "__main__":
    init_db()
    print("✅ SQLite database initialized")