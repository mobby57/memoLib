"""
Point d'entrée FastAPI pour IAPosteManager v4.0
Architecture unique MCP + Ollama
"""
import sys
import os

# Ajouter le répertoire racine au path Python
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from contextlib import asynccontextmanager
import asyncio

try:
    from src.backend.config_fastapi import settings
    from src.backend.services.ollama_service import ollama_service
    from src.backend.database import init_db
    from src.backend.routes import auth, contacts, emails, document_analysis
    # 📊 MONITORING: Prometheus metrics
    from src.monitoring.prometheus import (
        PrometheusMiddleware, 
        metrics_endpoint, 
        metrics_collector
    )
    # 📮 POSTAL ROUTES: Gestion postale (optionnel)
    try:
        from src.routes.postal_routes import router as postal_router
        POSTAL_ROUTES_AVAILABLE = True
    except ImportError:
        POSTAL_ROUTES_AVAILABLE = False
    # 🗺️ ROUTES DATA API: CRUD routes (optionnel)
    try:
        from src.routes.routes_data_api import router as routes_data_router
        DATA_ROUTES_AVAILABLE = True
    except ImportError:
        DATA_ROUTES_AVAILABLE = False
except ImportError as e:
    print(f"❌ Erreur d'import: {e}")
    print("💡 Assurez-vous d'être dans le répertoire racine du projet")
    print("💡 Ou utilisez: python -m src.backend.main_fastapi")
    sys.exit(1)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifecycle events"""
    # Startup
    print("🚀 Démarrage IAPosteManager v4.0")
    print(f"📍 Ollama host: {settings.OLLAMA_HOST}")
    
    # Initialiser base de données
    init_db()
    print("✅ Base de données initialisée")
    
    # 📊 Démarrer collection métriques système en background
    try:
        asyncio.create_task(metrics_collector.start_background_collection())
        print("✅ Prometheus metrics collection démarrée")
    except Exception as e:
        print(f"⚠️ Prometheus metrics non disponible: {e}")
    
    # Test connexion Ollama
    status = await ollama_service.test_connexion()
    if status.get("ollama_running"):
        print("✅ Ollama connecté")
        print(f"   llama3: {'✓' if status.get('llama3') else '✗'}")
        print(f"   whisper: {'✓' if status.get('whisper') else '✗'}")
        print(f"   embed: {'✓' if status.get('embed') else '✗'}")
    else:
        print("⚠️  Ollama non disponible:", status.get("error"))
    
    yield
    
    # Shutdown
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

# 📊 MONITORING: Prometheus middleware
try:
    app.add_middleware(PrometheusMiddleware)
    print("✅ Prometheus middleware activé")
except Exception as e:
    print(f"⚠️ Prometheus middleware non disponible: {e}")


# ==================== ROUTES MODULES ====================

# Routes Workspace
try:
    from routes.workspace_routes import router as workspace_router
    app.include_router(workspace_router, prefix="/api/workspace", tags=["workspace"])
    print("✅ Routes workspace activées")
except ImportError:
    print("⚠️ Routes workspace non disponibles")

# Routes AI
try:
    from routes.ai_routes import router as ai_router
    app.include_router(ai_router, prefix="/api/ai", tags=["ai"])
    print("✅ Routes AI activées")
except ImportError:
    print("⚠️ Routes AI non disponibles")

# Routes Authentication
app.include_router(auth.router)

# Routes Contacts
app.include_router(contacts.router)

# Routes Emails
app.include_router(emails.router)

# Routes Document Analysis
app.include_router(document_analysis.router, prefix=settings.API_PREFIX)

# Routes Postal Management (optional)
if POSTAL_ROUTES_AVAILABLE:
    app.include_router(postal_router)
    print("✅ Routes postales activées")

# Routes Data API (CRUD - optional)
if DATA_ROUTES_AVAILABLE:
    app.include_router(routes_data_router)
    print("✅ API Routes Data activée")


# ==================== ROUTES HEALTH ====================

@app.get("/")
async def root():
    """Route racine"""
    return {
        "app": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "status": "running",
        "message": "Interface unique MCP + Ollama"
    }


@app.get("/health")
async def health_check():
    """Health check complet"""
    ollama_status = await ollama_service.test_connexion()
    
    return {
        "status": "healthy",
        "ollama": ollama_status,
        "version": settings.APP_VERSION
    }

@app.get("/metrics")
async def metrics():
    """📊 Prometheus metrics endpoint"""
    try:
        return metrics_endpoint()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Metrics unavailable: {e}")


# ==================== ROUTES API ====================

@app.get(f"{settings.API_PREFIX}/test")
async def test_api():
    """Test API basique"""
    return {"message": "API v4.0 fonctionnelle"}


@app.get(f"{settings.API_PREFIX}/ollama/test")
async def test_ollama():
    """Test connexion Ollama"""
    status = await ollama_service.test_connexion()
    
    if not status.get("ollama_running"):
        raise HTTPException(status_code=503, detail="Ollama non disponible")
    
    return status


class GenerateRequest(BaseModel):
    prompt: str

class AnalyzeRequest(BaseModel):
    texte: str

class EmailRequest(BaseModel):
    contexte: str
    instruction: str


@app.post(f"{settings.API_PREFIX}/ollama/generate")
async def generate_text(request: GenerateRequest):
    """Test génération de texte"""
    try:
        response = await ollama_service.generate_text(request.prompt)
        return {"prompt": request.prompt, "response": response}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post(f"{settings.API_PREFIX}/analyze")
async def analyze_document(request: AnalyzeRequest):
    """Test analyse de document"""
    try:
        analyse = await ollama_service.analyze_document(request.texte)
        return analyse
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post(f"{settings.API_PREFIX}/generate-email")
async def generate_email(request: EmailRequest):
    """Test génération d'emails"""
    try:
        variants = await ollama_service.generate_3_email_variants(request.contexte, request.instruction)
        return {"variants": variants}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ==================== ADDITIONAL ENDPOINTS ====================

@app.get(f"{settings.API_PREFIX}/inbox/messages")
async def get_inbox_messages():
    """Get inbox messages"""
    # TODO: Implémenter récupération inbox
    return {"messages": []}

@app.get(f"{settings.API_PREFIX}/templates")
async def get_templates():
    """Get email templates"""
    # TODO: Implémenter récupération templates
    return {"templates": []}

@app.post(f"{settings.API_PREFIX}/templates")
async def create_template(template: dict):
    """Create email template"""
    # TODO: Implémenter création template
    return {"id": "1", "status": "created"}

@app.put(f"{settings.API_PREFIX}/templates/{{template_id}}")
async def update_template(template_id: str, template: dict):
    """Update email template"""
    # TODO: Implémenter mise à jour template
    return {"id": template_id, "status": "updated"}

@app.delete(f"{settings.API_PREFIX}/templates/{{template_id}}")
async def delete_template(template_id: str):
    """Delete email template"""
    # TODO: Implémenter suppression template
    return {"id": template_id, "status": "deleted"}


# ==================== ERROR HANDLERS ====================

@app.exception_handler(HTTPException)
async def http_exception_handler(request, exc):
    return JSONResponse(
        status_code=exc.status_code,
        content={"error": exc.detail}
    )


@app.exception_handler(Exception)
async def general_exception_handler(request, exc):
    return JSONResponse(
        status_code=500,
        content={"error": "Erreur interne du serveur", "detail": str(exc)}
    )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "src.backend.main_fastapi:app",
        host="0.0.0.0",
        port=8000,
        reload=True
    )
