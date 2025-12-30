"""
API FastAPI pour système d'analyse documentaire IA
Endpoints: upload, analyze, todos, notifications, accès sécurisé
"""

from fastapi import FastAPI, File, UploadFile, HTTPException, Depends, Header
from fastapi.responses import JSONResponse, FileResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import os
import shutil
from datetime import datetime

# Imports des services
import sys
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from services.document_analyzer import DocumentAnalyzer
from services.todo_generator import TodoGenerator
from services.document_access import DocumentAccessManager

# Initialisation FastAPI
app = FastAPI(
    title="IAPosteManager - Document Analysis API",
    version="2.3.0",
    description="API d'analyse documentaire avec IA locale et gestion TODO automatique"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Services globaux
analyzer = DocumentAnalyzer(ollama_url="http://localhost:11434")
todo_gen = TodoGenerator()
access_mgr = DocumentAccessManager()

# Dossier uploads
UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)


# ============ MODÈLES PYDANTIC ============

class AnalysisResponse(BaseModel):
    success: bool
    document_id: int
    analysis: dict
    todo: dict
    message: str


class TodoCreate(BaseModel):
    user_id: int
    document_id: int
    title: str
    description: str
    due_date: str
    priority: int


class PermissionGrant(BaseModel):
    document_id: int
    user_id: int
    permissions: List[str]


class TokenRequest(BaseModel):
    user_id: int
    document_id: int
    permissions: List[str] = ['read']
    expires_hours: int = 24


# ============ DÉPENDANCES ============

def get_current_user_id(authorization: Optional[str] = Header(None)) -> int:
    """
    Extrait user_id depuis token Authorization
    En prod: vérifier vraiment le JWT
    """
    if not authorization:
        return 1  # User par défaut pour démo
    
    try:
        token = authorization.replace("Bearer ", "")
        token_data = access_mgr.verify_access_token(token)
        if token_data:
            return token_data['user_id']
    except:
        pass
    
    return 1  # Fallback


# ============ ENDPOINTS ============

@app.get("/")
def root():
    """Page d'accueil API"""
    return {
        "service": "IAPosteManager Document Analysis API",
        "version": "2.3.0",
        "status": "running",
        "endpoints": {
            "upload": "POST /api/documents/upload",
            "analyze": "POST /api/documents/{doc_id}/analyze",
            "todos": "GET /api/todos",
            "notifications": "GET /api/notifications",
            "access": "POST /api/access/token"
        }
    }


@app.post("/api/documents/upload", response_model=AnalysisResponse)
async def upload_and_analyze_document(
    file: UploadFile = File(...),
    user_id: int = Depends(get_current_user_id)
):
    """
    Upload un document et l'analyse automatiquement avec IA
    
    - Extraction texte (PDF, images via OCR, txt)
    - Analyse IA locale (Ollama)
    - Génération TODO automatique
    - Création notifications programmées
    
    Returns:
        Analyse complète + TODO créé + notifications
    """
    try:
        # 1. Sauvegarder fichier
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"{timestamp}_{file.filename}"
        filepath = os.path.join(UPLOAD_DIR, filename)
        
        with open(filepath, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        print(f"📤 Fichier uploadé: {filepath}")
        
        # 2. Analyser document
        analysis = analyzer.process_document(filepath)
        
        if 'error' in analysis:
            raise HTTPException(status_code=400, detail=analysis['error'])
        
        # 3. Générer document_id
        document_id = len(os.listdir(UPLOAD_DIR))
        
        # 4. Générer TODO automatique
        todo_result = todo_gen.generate_from_analysis(
            analysis, 
            user_id=user_id,
            document_id=document_id
        )
        
        # 5. Accorder permissions au propriétaire
        access_mgr.grant_permission(
            document_id, 
            user_id, 
            ['read', 'write', 'delete', 'share'],
            granted_by=user_id
        )
        
        return {
            "success": True,
            "document_id": document_id,
            "analysis": analysis,
            "todo": todo_result,
            "message": f"Document analysé avec succès. TODO créé avec {todo_result['notifications_created']} notifications."
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur analyse: {str(e)}")


@app.get("/api/todos")
def get_todos(
    status: Optional[str] = None,
    user_id: int = Depends(get_current_user_id)
):
    """
    Récupère les TODOs de l'utilisateur
    
    Query params:
        - status: 'pending', 'completed', 'cancelled'
    """
    todos = todo_gen.get_todos(user_id=user_id, status=status)
    
    return {
        "success": True,
        "count": len(todos),
        "todos": todos
    }


@app.put("/api/todos/{todo_id}/status")
def update_todo_status(
    todo_id: int,
    status: str,
    user_id: int = Depends(get_current_user_id)
):
    """
    Met à jour le statut d'un TODO
    
    Status: 'pending', 'completed', 'cancelled'
    """
    todo_gen.update_todo_status(todo_id, status)
    
    return {
        "success": True,
        "todo_id": todo_id,
        "new_status": status,
        "message": f"TODO {todo_id} mis à jour"
    }


@app.get("/api/notifications/pending")
def get_pending_notifications(user_id: int = Depends(get_current_user_id)):
    """
    Récupère les notifications en attente d'envoi
    """
    notifications = todo_gen.get_notifications_to_send()
    
    # Filtrer par user_id
    user_notifs = [n for n in notifications if n['user_id'] == user_id]
    
    return {
        "success": True,
        "count": len(user_notifs),
        "notifications": user_notifs
    }


@app.post("/api/notifications/{notification_id}/send")
def send_notification(notification_id: int):
    """
    Marque une notification comme envoyée
    En prod: envoyer vraiment l'email/push/SMS
    """
    todo_gen.mark_notification_sent(notification_id)
    
    return {
        "success": True,
        "notification_id": notification_id,
        "message": "Notification envoyée"
    }


@app.post("/api/access/token")
def create_access_token(request: TokenRequest):
    """
    Crée un token JWT pour accès temporaire à un document
    
    Body:
        - user_id: ID utilisateur
        - document_id: ID document
        - permissions: ['read', 'write', 'delete', 'share']
        - expires_hours: durée validité (défaut 24h)
    """
    token = access_mgr.create_access_token(
        user_id=request.user_id,
        document_id=request.document_id,
        permissions=request.permissions,
        expires_hours=request.expires_hours
    )
    
    return {
        "success": True,
        "token": token,
        "expires_in_hours": request.expires_hours
    }


@app.post("/api/access/verify")
def verify_access_token(token: str):
    """
    Vérifie la validité d'un token d'accès
    """
    token_data = access_mgr.verify_access_token(token)
    
    if not token_data:
        raise HTTPException(status_code=401, detail="Token invalide ou expiré")
    
    return {
        "success": True,
        "valid": True,
        "data": token_data
    }


@app.post("/api/access/grant")
def grant_permission(request: PermissionGrant, user_id: int = Depends(get_current_user_id)):
    """
    Accorde des permissions sur un document
    
    Body:
        - document_id: ID du document
        - user_id: ID utilisateur à qui donner accès
        - permissions: ['read', 'write', 'delete', 'share']
    """
    access_mgr.grant_permission(
        document_id=request.document_id,
        user_id=request.user_id,
        permissions=request.permissions,
        granted_by=user_id
    )
    
    return {
        "success": True,
        "message": f"Permissions accordées à user {request.user_id}"
    }


@app.delete("/api/access/revoke/{document_id}/{user_id}")
def revoke_permission(document_id: int, user_id: int):
    """
    Révoque toutes les permissions d'un utilisateur sur un document
    """
    access_mgr.revoke_permission(document_id, user_id)
    
    return {
        "success": True,
        "message": f"Accès révoqué pour user {user_id}"
    }


@app.get("/api/access/share/{document_id}")
def generate_share_link(
    document_id: int,
    expires_hours: int = 48,
    user_id: int = Depends(get_current_user_id)
):
    """
    Génère un lien de partage public pour un document
    
    Query params:
        - expires_hours: durée de validité (défaut 48h)
    """
    # Vérifier que user a permission 'share'
    if not access_mgr.has_permission(user_id, document_id, 'share'):
        raise HTTPException(status_code=403, detail="Vous n'avez pas la permission de partager ce document")
    
    share_url = access_mgr.generate_share_link(
        document_id=document_id,
        permissions=['read'],
        expires_hours=expires_hours
    )
    
    return {
        "success": True,
        "share_url": share_url,
        "expires_in_hours": expires_hours
    }


@app.get("/api/access/logs")
def get_access_logs(
    document_id: Optional[int] = None,
    limit: int = 100,
    user_id: int = Depends(get_current_user_id)
):
    """
    Récupère les logs d'accès pour audit
    
    Query params:
        - document_id: filtrer par document
        - limit: nombre max de logs (défaut 100)
    """
    logs = access_mgr.get_access_logs(
        user_id=user_id,
        document_id=document_id,
        limit=limit
    )
    
    return {
        "success": True,
        "count": len(logs),
        "logs": logs
    }


@app.get("/api/documents/{document_id}")
def get_document(
    document_id: int,
    token: Optional[str] = None,
    user_id: int = Depends(get_current_user_id)
):
    """
    Récupère un document (nécessite permission 'read')
    
    Query params:
        - token: token d'accès JWT (optionnel)
    """
    # Vérifier permission
    if not access_mgr.has_permission(user_id, document_id, 'read', token):
        raise HTTPException(status_code=403, detail="Accès interdit")
    
    # En prod: récupérer vraiment le fichier depuis BDD
    files = sorted(os.listdir(UPLOAD_DIR))
    if document_id >= len(files):
        raise HTTPException(status_code=404, detail="Document non trouvé")
    
    filepath = os.path.join(UPLOAD_DIR, files[document_id])
    
    return FileResponse(
        filepath,
        media_type="application/octet-stream",
        filename=os.path.basename(filepath)
    )


@app.get("/health")
def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "services": {
            "analyzer": "running",
            "todo_generator": "running",
            "access_manager": "running"
        }
    }


# ============ LANCEMENT ============

if __name__ == "__main__":
    import uvicorn
    
    print("="*60)
    print("🚀 IAPosteManager - Document Analysis API")
    print("="*60)
    print(f"📍 URL: http://localhost:8000")
    print(f"📖 Docs: http://localhost:8000/docs")
    print(f"📁 Uploads: {os.path.abspath(UPLOAD_DIR)}")
    print("="*60)
    
    uvicorn.run(
        "api_document_analysis:app",
        host="0.0.0.0",
        port=8000,
        reload=True
    )
