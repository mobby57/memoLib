"""
Configuration FastAPI pour IAPosteManager
Architecture unique avec Ollama
"""
import os
from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    # Application
    APP_NAME: str = "IAPosteManager"
    APP_VERSION: str = "4.0.0"
    DEBUG: bool = os.getenv("DEBUG", "false").lower() == "true"
    
    # API
    API_PREFIX: str = "/api"
    CORS_ORIGINS: list = ["http://localhost:3000"]
    
    # Database
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///iapostemanager.db")
    
    # Ollama Configuration
    OLLAMA_HOST: str = os.getenv("OLLAMA_HOST", "http://localhost:11434")
    OLLAMA_MODEL_LLM: str = os.getenv("OLLAMA_MODEL_LLM", "llama3")
    OLLAMA_MODEL_WHISPER: str = os.getenv("OLLAMA_MODEL_WHISPER", "whisper")
    OLLAMA_MODEL_EMBED: str = os.getenv("OLLAMA_MODEL_EMBED", "nomic-embed-text")
    
    # JWT Authentication - SÉCURISÉ : utilise variables d'environnement
    JWT_SECRET_KEY: str = os.getenv("JWT_SECRET_KEY", "")
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRATION_MINUTES: int = int(os.getenv("JWT_EXPIRATION_MINUTES", "30"))
    
    # Email Configuration - SÉCURISÉ : utilise variables d'environnement
    EMAIL_DOMAIN: str = os.getenv("EMAIL_DOMAIN", "tonapp.ai")
    SMTP_HOST: str = os.getenv("SMTP_HOST", "smtp.gmail.com")
    SMTP_PORT: int = int(os.getenv("SMTP_PORT", "587"))
    SMTP_USER: str = os.getenv("SMTP_USERNAME", "")
    SMTP_PASSWORD: str = os.getenv("SMTP_PASSWORD", "")
    
    # File Storage
    UPLOAD_DIR: str = os.getenv("UPLOAD_FOLDER", "uploads")
    MAX_UPLOAD_SIZE: int = int(os.getenv("MAX_UPLOAD_SIZE_MB", "10")) * 1024 * 1024
    
    # MCP Configuration
    MCP_SERVERS_DIR: str = os.getenv("MCP_SERVERS_DIR", "mcp_servers")
    
    class Config:
        """Configuration Pydantic"""
        env_file = ".env"
        case_sensitive = True


@lru_cache()
def get_settings() -> Settings:
    """Récupère les settings avec validation de sécurité"""
    settings = Settings()
    
    # Validation de sécurité en production
    if not settings.DEBUG and not settings.JWT_SECRET_KEY:
        raise ValueError(
            "JWT_SECRET_KEY est obligatoire en production. "
            "Définissez-la dans .env ou variables d'environnement"
        )
    
    return settings


settings = get_settings()