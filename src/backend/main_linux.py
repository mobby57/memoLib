#!/usr/bin/env python3
"""
FastAPI Server minimal pour développement Linux
"""
import sys
import os

# Ajouter le répertoire racine au path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from contextlib import asynccontextmanager

try:
    from src.backend.config_linux import settings
except ImportError:
    print("❌ Erreur: config_linux.py non trouvé")
    sys.exit(1)

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifecycle events"""
    print("🚀 Démarrage IAPosteManager v4.0 (Linux)")
    print(f"📍 Ollama host: {settings.OLLAMA_HOST}")
    yield
    print("👋 Arrêt IAPosteManager")

# Création app FastAPI
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="Assistant IA pour gestion courriers & emails",
    lifespan=lifespan
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routes de base
@app.get("/")
async def root():
    return {
        "app": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "status": "running",
        "message": "Serveur Linux opérationnel"
    }

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "version": settings.APP_VERSION,
        "platform": "linux"
    }

@app.get(f"{settings.API_PREFIX}/test")
async def test_api():
    return {"message": "API Linux fonctionnelle"}

# Modèles Pydantic
class GenerateRequest(BaseModel):
    prompt: str

class EmailRequest(BaseModel):
    contexte: str
    instruction: str

@app.post(f"{settings.API_PREFIX}/generate")
async def generate_text(request: GenerateRequest):
    """Test génération de texte"""
    return {
        "prompt": request.prompt,
        "response": f"Réponse générée pour: {request.prompt}",
        "status": "mock"
    }

@app.post(f"{settings.API_PREFIX}/email/create")
async def create_email(request: EmailRequest):
    """Mock création email"""
    return {
        "success": True,
        "email": f"test@{settings.EMAIL_DOMAIN}",
        "password": "temp123",
        "imap_server": "imap.gmail.com",
        "smtp_server": "smtp.gmail.com"
    }

@app.get(f"{settings.API_PREFIX}/email/my-accounts")
async def get_my_accounts():
    """Mock comptes email"""
    return {
        "accounts": [
            {
                "email": f"contact@{settings.EMAIL_DOMAIN}",
                "display_name": "Contact",
                "created_at": "2024-01-01T00:00:00Z"
            }
        ]
    }

@app.post(f"{settings.API_PREFIX}/email/check-availability")
async def check_availability(data: dict):
    """Mock vérification disponibilité"""
    username = data.get("username", "")
    return {
        "available": True,
        "suggestions": [f"{username}1", f"{username}2", f"{username}_pro"]
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main_linux:app",
        host="0.0.0.0",
        port=8000,
        reload=True
    )