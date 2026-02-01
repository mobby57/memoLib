"""
FastAPI Server minimal pour Windows
Version simplifiée sans dépendances complexes
"""
import sys
import os

# Ajouter le répertoire racine au path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# Configuration simple
class Settings:
    APP_NAME = "IAPosteManager"
    APP_VERSION = "4.0.0"
    API_PREFIX = "/api"
    CORS_ORIGINS = ["http://localhost:3000", "http://localhost:3001", "http://localhost:3003", "http://localhost:5173"]

settings = Settings()

# App FastAPI
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="Assistant IA pour gestion emails"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Modèles
class EmailRequest(BaseModel):
    username: str
    display_name: str = ""

class AvailabilityRequest(BaseModel):
    username: str

# Routes
@app.get("/")
async def root():
    return {"app": settings.APP_NAME, "version": settings.APP_VERSION, "status": "running"}

@app.get("/health")
async def health():
    return {"status": "healthy", "version": settings.APP_VERSION}

@app.get(f"{settings.API_PREFIX}/test")
async def test():
    return {"message": "API Windows fonctionnelle"}

@app.post(f"{settings.API_PREFIX}/email/check-availability")
async def check_availability(request: AvailabilityRequest):
    username = request.username.lower()
    return {
        "available": True,
        "suggestions": [f"{username}1", f"{username}2", f"{username}_pro"]
    }

@app.post(f"{settings.API_PREFIX}/email/create")
async def create_email(request: EmailRequest):
    return {
        "success": True,
        "email": f"{request.username}@tonapp.ai",
        "password": "temp123456",
        "imap_server": "imap.gmail.com",
        "smtp_server": "smtp.gmail.com"
    }

@app.get(f"{settings.API_PREFIX}/email/my-accounts")
async def get_accounts():
    return {
        "accounts": [
            {
                "email": "contact@tonapp.ai",
                "display_name": "Contact",
                "created_at": "2024-01-01T00:00:00Z"
            }
        ]
    }

if __name__ == "__main__":
    import uvicorn
    print("🚀 Démarrage serveur Windows...")
    print("📍 URL: http://127.0.0.1:8000")
    print("📚 Docs: http://127.0.0.1:8000/docs")
    uvicorn.run(app, host="127.0.0.1", port=8000, reload=True)