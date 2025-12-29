"""
Intégration Rate Limiting dans routes document_analysis
Application du limiteur créé aux endpoints coûteux
"""
import os
from fastapi import APIRouter, File, UploadFile, HTTPException, Depends, Request
from src.backend.rate_limiter_simple import RateLimiter, RateLimitExceeded
from src.services.fast_document_analyzer import FastDocumentAnalyzer
from src.services.auth_manager import get_current_user_dependency

router = APIRouter(prefix="/api/documents", tags=["documents"])

# Rate limiter: 10 analyses/minute par user
limiter = RateLimiter(
    redis_url=os.getenv("REDIS_URL", "redis://localhost:6379/0"),
    default_limit=10,
    default_period=60
)

# Analyseur
analyzer = FastDocumentAnalyzer()


@router.post("/analyze")
@limiter.limit(max_requests=10, period=60, key_func=lambda r: r.state.user_id)
async def analyze_document(
    request: Request,
    file: UploadFile = File(...),
    current_user = Depends(get_current_user_dependency)
):
    """
    📄 Analyser document avec rate limiting
    
    Rate limit: 10 analyses/minute par utilisateur
    """
    try:
        # Stocker user_id pour key_func
        request.state.user_id = current_user.get("user_id", "anonymous")
        
        # Lire contenu
        content = await file.read()
        text = content.decode("utf-8")
        
        # Analyser
        result = await analyzer.analyze_quick(text)
        
        return {
            "status": "success",
            "analysis": result,
            "file_name": file.filename
        }
        
    except RateLimitExceeded as e:
        raise HTTPException(status_code=429, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analysis failed: {e}")


@router.get("/")
@limiter.limit(max_requests=30, period=60)
async def list_documents(
    request: Request,
    current_user = Depends(get_current_user_dependency)
):
    """
    📋 Lister documents utilisateur
    
    Rate limit: 30 requêtes/minute
    """
    try:
        # TODO: Implémenter récupération documents DB
        return {
            "status": "success",
            "documents": []
        }
    except RateLimitExceeded as e:
        raise HTTPException(status_code=429, detail=str(e))


@router.delete("/{document_id}")
@limiter.limit(max_requests=20, period=60)
async def delete_document(
    request: Request,
    document_id: str,
    current_user = Depends(get_current_user_dependency)
):
    """
    🗑️ Supprimer document
    
    Rate limit: 20 requêtes/minute
    """
    try:
        # TODO: Implémenter suppression DB
        return {
            "status": "success",
            "message": f"Document {document_id} deleted"
        }
    except RateLimitExceeded as e:
        raise HTTPException(status_code=429, detail=str(e))
