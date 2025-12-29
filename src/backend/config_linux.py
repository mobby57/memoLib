"""
Configuration FastAPI pour Linux - Version simplifiée
"""
import os
from typing import List

class Settings:
    # Application
    APP_NAME: str = "IAPosteManager"
    APP_VERSION: str = "4.0.0"
    DEBUG: bool = True
    
    # API
    API_PREFIX: str = "/api"
    CORS_ORIGINS: List[str] = [
        "http://localhost:3000", 
        "http://localhost:5173", 
        "http://localhost:3001", 
        "http://localhost:3003"
    ]
    
    # Database
    DATABASE_URL: str = "sqlite:///iapostemanager.db"
    
    # Ollama Configuration
    OLLAMA_HOST: str = os.getenv("OLLAMA_HOST", "http://localhost:11434")
    OLLAMA_MODEL_LLM: str = "llama3"
    OLLAMA_MODEL_WHISPER: str = "whisper"
    OLLAMA_MODEL_EMBED: str = "nomic-embed-text"
    
    # JWT Authentication
    JWT_SECRET_KEY: str = os.getenv("JWT_SECRET_KEY", "your-secret-key-change-in-production")
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRATION_MINUTES: int = 30
    
    # Email Configuration
    EMAIL_DOMAIN: str = "tonapp.ai"
    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USER: str = os.getenv("SMTP_USER", "")
    SMTP_PASSWORD: str = os.getenv("SMTP_PASSWORD", "")
    
    # File Storage
    UPLOAD_DIR: str = "uploads"
    MAX_UPLOAD_SIZE: int = 10 * 1024 * 1024  # 10MB
    
    # MCP Configuration
    MCP_SERVERS_DIR: str = "mcp_servers"

settings = Settings()