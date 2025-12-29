"""
🚀 API Routes pour Document Analysis, TODOs et Notifications
Compatible avec authentification de haut niveau
"""
from fastapi import APIRouter, Depends, HTTPException, File, UploadFile, Header
from fastapi.responses import JSONResponse
from typing import Optional, List
from pydantic import BaseModel
from datetime import datetime

from src.services.smart_document_analyzer import smart_document_analyzer
from src.services.fast_document_analyzer import fast_analyzer  # RAPIDE
from src.services.todo_notification_manager import todo_notification_manager, TodoStatus
from src.services.auth_manager import auth_manager, Permission, DocumentAccessLevel

router = APIRouter()


# ========== MODELS ==========

class DocumentAnalysisRequest(BaseModel):
    document_text: str
    metadata: Optional[dict] = None


class TodoCreateRequest(BaseModel):
    task: str
    deadline: Optional[str] = None
    priority: str = "medium"
    description: Optional[str] = None
    document_id: Optional[str] = None


class TodoUpdateRequest(BaseModel):
    status: str


class NotificationCreateRequest(BaseModel):
    message: str
    type: str = "info"
    priority: str = "medium"
    todo_id: Optional[str] = None


# ========== AUTH DEPENDENCY ==========

async def get_current_user(authorization: Optional[str] = Header(None)):
    """Dépendance pour récupérer l'utilisateur authentifié"""
    if not authorization:
        raise HTTPException(status_code=401, detail="Token d'authentification requis")
    
    try:
        token = authorization.replace("Bearer ", "")
        user = auth_manager.verify_token(token)
        
        if not user:
            raise HTTPException(status_code=401, detail="Token invalide ou expiré")
        
        return user
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Erreur d'authentification: {str(e)}")


def require_permission(permission: Permission):
    """Dépendance pour vérifier une permission"""
    async def check_permission(user: dict = Depends(get_current_user)):
        if not auth_manager.has_permission(user["user_id"], permission):
            raise HTTPException(status_code=403, detail=f"Permission refusée: {permission.value}")
        return user
    return check_permission


# ========== DOCUMENT ANALYSIS ROUTES ==========

@router.post("/api/analyze-document")
async def analyze_document(
    request: DocumentAnalysisRequest,
    user: dict = Depends(require_permission(Permission.CREATE_DOCUMENT))
):
    """
    Analyse un document avec IA locale (Ollama) - VERSION RAPIDE
    Temps: 3-8s (vs 15-30s avant)
    Extrait automatiquement délais, urgence, génère TODOs et notifications
    """
    try:
        # Analyse RAPIDE avec cache et optimisations
        analysis = await fast_analyzer.analyze_quick(request.document_text)
        
        # Sauvegarder l'analyse
        document_id = todo_notification_manager.save_document_analysis(
            user["user_id"],
            analysis
        )
        
        # Accorder accès au document au créateur
        auth_manager.grant_document_access(
            document_id,
            user["user_id"],
            DocumentAccessLevel.PRIVATE,
            user["user_id"]
        )
        
        # Créer les TODOs automatiquement
        created_todos = []
        for todo in analysis.get("todos", []):
            todo_id = todo_notification_manager.create_todo(
                user_id=user["user_id"],
                task=todo["task"],
                deadline=todo.get("deadline"),
                priority=todo.get("priority", "medium"),
                document_id=document_id
            )
            created_todos.append({"id": todo_id, **todo})
        
        # Créer les notifications automatiquement
        created_notifications = []
        for notif in analysis.get("notifications", []):
            notif_id = todo_notification_manager.create_notification(
                user_id=user["user_id"],
                message=notif["message"],
                type=notif.get("type", "info"),
                priority=notif.get("priority", "medium"),
                document_id=document_id
            )
            created_notifications.append({"id": notif_id, **notif})
        
        return {
            "success": True,
            "document_id": document_id,
            "analysis": analysis,
            "todos_created": len(created_todos),
            "todos": created_todos,
            "notifications_created": len(created_notifications),
            "notifications": created_notifications
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur analyse: {str(e)}")


@router.get("/api/documents")
async def get_user_documents(
    limit: int = 50,
    user: dict = Depends(require_permission(Permission.READ_DOCUMENT))
):
    """Récupère les documents analysés de l'utilisateur"""
    try:
        documents = todo_notification_manager.get_user_documents(
            user["user_id"],
            limit
        )
        
        return {
            "success": True,
            "count": len(documents),
            "documents": documents
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/api/documents/deadlines")
async def get_documents_with_deadlines(
    days_ahead: int = 30,
    user: dict = Depends(require_permission(Permission.READ_DOCUMENT))
):
    """Récupère les documents avec deadlines approchantes"""
    try:
        documents = todo_notification_manager.get_documents_with_deadlines(
            user["user_id"],
            days_ahead
        )
        
        return {
            "success": True,
            "count": len(documents),
            "documents": documents
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ========== TODO ROUTES ==========

@router.post("/api/todos")
async def create_todo(
    request: TodoCreateRequest,
    user: dict = Depends(require_permission(Permission.CREATE_TODO))
):
    """Crée un nouveau TODO"""
    try:
        todo_id = todo_notification_manager.create_todo(
            user_id=user["user_id"],
            task=request.task,
            deadline=request.deadline,
            priority=request.priority,
            document_id=request.document_id,
            description=request.description
        )
        
        return {
            "success": True,
            "todo_id": todo_id,
            "message": "TODO créé avec succès"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/api/todos")
async def get_todos(
    status: Optional[str] = None,
    include_completed: bool = False,
    user: dict = Depends(require_permission(Permission.READ_TODO))
):
    """Récupère les TODOs de l'utilisateur"""
    try:
        todos = todo_notification_manager.get_user_todos(
            user["user_id"],
            status,
            include_completed
        )
        
        return {
            "success": True,
            "count": len(todos),
            "todos": todos
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/api/todos/overdue")
async def get_overdue_todos(
    user: dict = Depends(require_permission(Permission.READ_TODO))
):
    """Récupère les TODOs en retard"""
    try:
        todos = todo_notification_manager.get_overdue_todos(user["user_id"])
        
        return {
            "success": True,
            "count": len(todos),
            "todos": todos
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/api/todos/upcoming")
async def get_upcoming_todos(
    days: int = 7,
    user: dict = Depends(require_permission(Permission.READ_TODO))
):
    """Récupère les TODOs à venir"""
    try:
        todos = todo_notification_manager.get_upcoming_todos(user["user_id"], days)
        
        return {
            "success": True,
            "count": len(todos),
            "todos": todos
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.patch("/api/todos/{todo_id}")
async def update_todo_status(
    todo_id: str,
    request: TodoUpdateRequest,
    user: dict = Depends(require_permission(Permission.UPDATE_TODO))
):
    """Met à jour le statut d'un TODO"""
    try:
        success = todo_notification_manager.update_todo_status(
            todo_id,
            request.status,
            user["user_id"]
        )
        
        if not success:
            raise HTTPException(status_code=404, detail="TODO non trouvé")
        
        return {
            "success": True,
            "message": "TODO mis à jour"
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/api/todos/{todo_id}")
async def delete_todo(
    todo_id: str,
    user: dict = Depends(require_permission(Permission.DELETE_TODO))
):
    """Supprime un TODO"""
    try:
        success = todo_notification_manager.delete_todo(todo_id, user["user_id"])
        
        if not success:
            raise HTTPException(status_code=404, detail="TODO non trouvé")
        
        return {
            "success": True,
            "message": "TODO supprimé"
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ========== NOTIFICATION ROUTES ==========

@router.get("/api/notifications")
async def get_notifications(
    unread_only: bool = False,
    limit: int = 50,
    user: dict = Depends(require_permission(Permission.READ_NOTIFICATION))
):
    """Récupère les notifications de l'utilisateur"""
    try:
        notifications = todo_notification_manager.get_user_notifications(
            user["user_id"],
            unread_only,
            limit
        )
        
        return {
            "success": True,
            "count": len(notifications),
            "notifications": notifications
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.patch("/api/notifications/{notif_id}/read")
async def mark_notification_read(
    notif_id: str,
    user: dict = Depends(require_permission(Permission.READ_NOTIFICATION))
):
    """Marque une notification comme lue"""
    try:
        success = todo_notification_manager.mark_notification_read(
            notif_id,
            user["user_id"]
        )
        
        if not success:
            raise HTTPException(status_code=404, detail="Notification non trouvée")
        
        return {
            "success": True,
            "message": "Notification marquée comme lue"
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.patch("/api/notifications/{notif_id}/dismiss")
async def dismiss_notification(
    notif_id: str,
    user: dict = Depends(require_permission(Permission.READ_NOTIFICATION))
):
    """Dismiss une notification"""
    try:
        success = todo_notification_manager.dismiss_notification(
            notif_id,
            user["user_id"]
        )
        
        if not success:
            raise HTTPException(status_code=404, detail="Notification non trouvée")
        
        return {
            "success": True,
            "message": "Notification dismissed"
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ========== STATS ROUTE ==========

@router.get("/api/dashboard/stats")
async def get_dashboard_stats(
    user: dict = Depends(get_current_user)
):
    """Récupère les statistiques du dashboard"""
    try:
        stats = todo_notification_manager.get_user_stats(user["user_id"])
        
        # Ajouter des infos supplémentaires
        stats["user"] = {
            "username": user["username"],
            "role": user["role"]
        }
        stats["timestamp"] = datetime.now().isoformat()
        
        return {
            "success": True,
            "stats": stats
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ========== DOCUMENT ACCESS MANAGEMENT ==========

@router.post("/api/documents/{document_id}/share")
async def share_document(
    document_id: str,
    target_user_id: str,
    access_level: str = "restricted",
    expires_at: Optional[str] = None,
    user: dict = Depends(require_permission(Permission.SHARE_DOCUMENT))
):
    """Partage un document avec un autre utilisateur"""
    try:
        # Vérifier que l'utilisateur peut partager ce document
        if not auth_manager.can_access_document(user["user_id"], document_id):
            raise HTTPException(status_code=403, detail="Accès refusé au document")
        
        auth_manager.grant_document_access(
            document_id,
            target_user_id,
            DocumentAccessLevel(access_level),
            user["user_id"],
            expires_at
        )
        
        return {
            "success": True,
            "message": f"Document partagé avec l'utilisateur {target_user_id}"
        }
    except ValueError:
        raise HTTPException(status_code=400, detail="Niveau d'accès invalide")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/api/documents/{document_id}/share/{target_user_id}")
async def revoke_document_access(
    document_id: str,
    target_user_id: str,
    user: dict = Depends(require_permission(Permission.SHARE_DOCUMENT))
):
    """Révoque l'accès à un document"""
    try:
        if not auth_manager.can_access_document(user["user_id"], document_id):
            raise HTTPException(status_code=403, detail="Accès refusé au document")
        
        auth_manager.revoke_document_access(
            document_id,
            target_user_id,
            user["user_id"]
        )
        
        return {
            "success": True,
            "message": f"Accès révoqué pour l'utilisateur {target_user_id}"
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
