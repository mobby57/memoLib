"""
API FastAPI pour l'intégration des modèles IA locaux
Endpoints pour utiliser les modèles Ollama dans iaPostemanage
"""

from fastapi import APIRouter, HTTPException, Body
from pydantic import BaseModel
from typing import Optional, Dict, List
import sys
from pathlib import Path

# Ajouter le chemin src au PYTHONPATH
sys.path.insert(0, str(Path(__file__).parent.parent))

from services.ollama_integration import ollama

router = APIRouter(prefix="/api/ia", tags=["IA Locale"])


class ChatRequest(BaseModel):
    prompt: str
    model: Optional[str] = None
    system: Optional[str] = None


class DocumentAnalysisRequest(BaseModel):
    text: str
    document_type: str = "courrier"


class ResponseGenerationRequest(BaseModel):
    context: str
    request_type: str = "information"


class SummaryRequest(BaseModel):
    text: str
    max_sentences: int = 3


class CodeGenerationRequest(BaseModel):
    description: str
    language: str = "python"


@router.post("/chat")
async def chat_with_ai(request: ChatRequest):
    """
    Chat avec un modèle IA local
    
    - **prompt**: Votre question ou message
    - **model**: Modèle à utiliser (optionnel, par défaut: qwen2.5:32b)
    - **system**: Instructions système (optionnel)
    """
    try:
        response = ollama.chat(
            prompt=request.prompt,
            model=request.model,
            system=request.system
        )
        
        if "error" in response:
            raise HTTPException(status_code=500, detail=response["error"])
        
        return {
            "success": True,
            "response": response.get("response", ""),
            "model": request.model or ollama.models["general"]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/analyze-document")
async def analyze_document(request: DocumentAnalysisRequest):
    """
    Analyse un document administratif
    
    - **text**: Le texte du document
    - **document_type**: Type de document (courrier, facture, contrat...)
    """
    try:
        result = ollama.analyze_document(
            text=request.text,
            document_type=request.document_type
        )
        
        return {
            "success": True,
            "analysis": result,
            "document_type": request.document_type
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/generate-response")
async def generate_response(request: ResponseGenerationRequest):
    """
    Génère une réponse de courrier automatique
    
    - **context**: Le contexte de la demande
    - **request_type**: Type de demande (information, réclamation...)
    """
    try:
        response = ollama.generate_response(
            context=request.context,
            request_type=request.request_type
        )
        
        return {
            "success": True,
            "response": response,
            "type": request.request_type
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/extract-entities")
async def extract_entities(text: str = Body(..., embed=True)):
    """
    Extrait les entités nommées d'un texte
    
    - **text**: Le texte à analyser
    """
    try:
        entities = ollama.extract_entities(text)
        
        return {
            "success": True,
            "entities": entities
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/summarize")
async def summarize_text(request: SummaryRequest):
    """
    Résume un texte
    
    - **text**: Le texte à résumer
    - **max_sentences**: Nombre maximum de phrases (défaut: 3)
    """
    try:
        summary = ollama.summarize(
            text=request.text,
            max_sentences=request.max_sentences
        )
        
        return {
            "success": True,
            "summary": summary,
            "original_length": len(request.text),
            "summary_length": len(summary)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/classify")
async def classify_document(text: str = Body(..., embed=True)):
    """
    Classifie un document selon son type
    
    - **text**: Le texte du document
    """
    try:
        classification = ollama.classify_document(text)
        
        return {
            "success": True,
            "classification": classification
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/check-spelling")
async def check_spelling(text: str = Body(..., embed=True)):
    """
    Vérifie l'orthographe et la grammaire
    
    - **text**: Le texte à vérifier
    """
    try:
        corrections = ollama.check_spelling(text)
        
        return {
            "success": True,
            "corrections": corrections
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/generate-code")
async def generate_code(request: CodeGenerationRequest):
    """
    Génère du code selon une description
    
    - **description**: Description de ce que le code doit faire
    - **language**: Langage de programmation (défaut: python)
    """
    try:
        code = ollama.generate_code(
            description=request.description,
            language=request.language
        )
        
        return {
            "success": True,
            "code": code,
            "language": request.language
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/models")
async def list_available_models():
    """
    Liste tous les modèles IA disponibles
    """
    try:
        models = ollama.list_models()
        
        return {
            "success": True,
            "models": models,
            "recommended": ollama.models,
            "count": len(models)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/health")
async def health_check():
    """
    Vérifie que Ollama est accessible
    """
    try:
        models = ollama.list_models()
        
        return {
            "success": True,
            "status": "healthy",
            "ollama_url": ollama.base_url,
            "models_count": len(models)
        }
    except Exception as e:
        return {
            "success": False,
            "status": "unhealthy",
            "error": str(e)
        }
