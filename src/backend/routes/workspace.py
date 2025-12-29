"""
Routes FastAPI pour gestion des Workspaces

Endpoints:
- POST /api/v1/workspaces/create-from-email
- GET /api/v1/workspaces/{workspace_id}
- GET /api/v1/workspaces/list
- POST /api/v1/workspaces/{workspace_id}/generate-questions
- POST /api/v1/workspaces/{workspace_id}/generate-response
- DELETE /api/v1/workspaces/{workspace_id}
"""

import logging
import uuid
from typing import Optional, List
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr, Field

from ..database_config import get_db
from ..models.sqlalchemy_models import User
from ..services.workspace_service import WorkspaceService, WorkspaceChannel, WorkspaceType
from ..services.human_thought_sim import HumanThoughtSimulator
from ..services.responder import ResponderService, ResponseTone, Language
from ..services.logger import log_workspace_action
from ..services.security import SecurityService
from .auth import get_current_user  # À créer séparément

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/workspaces", tags=["workspaces"])


# === MODELS PYDANTIC ===

class EmailAttachment(BaseModel):
    filename: str
    content_type: str
    size_bytes: int
    url: Optional[str] = None


class CreateWorkspaceRequest(BaseModel):
    email_content: str = Field(..., min_length=10, max_length=10000)
    email_subject: str = Field(..., min_length=1, max_length=500)
    sender_email: EmailStr
    channel: str = "email"
    attachments: Optional[List[EmailAttachment]] = []


class GenerateQuestionsRequest(BaseModel):
    accessibility_mode: Optional[str] = None
    language: str = "fr"


class GenerateResponseRequest(BaseModel):
    tone: str = "professional"
    language: Optional[str] = None
    include_questions: bool = True


class WorkspaceListFilters(BaseModel):
    workspace_type: Optional[str] = None
    channel: Optional[str] = None
    status: Optional[str] = None
    priority: Optional[str] = None
    limit: int = 50
    offset: int = 0


# === MIDDLEWARE QUOTA ===

async def check_quota(
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Vérifie quotas utilisateur avant action"""
    
    workspace_service = WorkspaceService(db)
    
    if not workspace_service._check_quotas(current_user):
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail={
                'error': 'quota_exceeded',
                'message': f'Quota mensuel atteint pour plan {current_user.plan}',
                'upgrade_url': '/pricing',
                'current_plan': current_user.plan,
                'suggested_plan': 'AIDANT' if current_user.plan == 'FREE' else 'PREMIUM'
            }
        )
    
    return current_user


# === ENDPOINTS ===

@router.post("/create-from-email", status_code=status.HTTP_201_CREATED)
async def create_workspace_from_email(
    payload: CreateWorkspaceRequest,
    request: Request,
    current_user: User = Depends(check_quota),
    db: Session = Depends(get_db)
):
    """
    Crée un workspace dynamique à partir d'un email reçu
    
    Workflow:
    1. Analyse email avec IA (Ollama/GPT-4)
    2. Détecte informations manquantes
    3. Crée document + todos automatiques
    4. Génère formulaire MDPH si applicable
    5. Envoie notification multi-canal
    """
    try:
        workspace_service = WorkspaceService(db)
        
        result = await workspace_service.create_workspace_from_email(
            user_id=current_user.id,
            email_content=payload.email_content,
            email_subject=payload.email_subject,
            sender_email=payload.sender_email,
            channel=WorkspaceChannel(payload.channel),
            attachments=[att.dict() for att in payload.attachments]
        )
        
        # Log action
        await log_workspace_action(
            db=db,
            user_id=current_user.id,
            action="workspace_created_from_email",
            details={
                'workspace_id': result['workspace_id'],
                'channel': payload.channel,
                'has_attachments': len(payload.attachments) > 0
            },
            ip_address=request.client.host
        )
        
        return {
            'success': True,
            'workspace': result,
            'next_steps': [
                {
                    'action': 'complete_missing_info',
                    'url': f'/workspaces/{result["workspace_id"]}/questions'
                },
                {
                    'action': 'view_workspace',
                    'url': f'/workspaces/{result["workspace_id"]}'
                }
            ]
        }
        
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        logger.error(f"Error creating workspace: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create workspace"
        )


@router.get("/{workspace_id}")
async def get_workspace(
    workspace_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Récupère le statut complet d'un workspace"""
    try:
        workspace_service = WorkspaceService(db)
        
        workspace = await workspace_service.get_workspace_status(
            workspace_id=workspace_id,
            user_id=current_user.id
        )
        
        return {
            'success': True,
            'workspace': workspace
        }
        
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except Exception as e:
        logger.error(f"Error fetching workspace: {str(e)}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR)


@router.get("/list")
async def list_workspaces(
    filters: WorkspaceListFilters = Depends(),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Liste tous les workspaces avec filtres"""
    try:
        workspace_service = WorkspaceService(db)
        
        workspaces = await workspace_service.list_workspaces(
            user_id=current_user.id,
            workspace_type=WorkspaceType(filters.workspace_type) if filters.workspace_type else None,
            channel=WorkspaceChannel(filters.channel) if filters.channel else None,
            limit=filters.limit,
            offset=filters.offset
        )
        
        return {
            'success': True,
            'workspaces': workspaces,
            'total': len(workspaces),
            'limit': filters.limit,
            'offset': filters.offset
        }
        
    except Exception as e:
        logger.error(f"Error listing workspaces: {str(e)}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR)


@router.post("/{workspace_id}/generate-questions")
async def generate_questions(
    workspace_id: uuid.UUID,
    payload: GenerateQuestionsRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Génère questions humaines pour informations manquantes"""
    try:
        # Récupérer workspace
        workspace_service = WorkspaceService(db)
        workspace = await workspace_service.get_workspace_status(workspace_id, current_user.id)
        
        # Générer questions
        simulator = HumanThoughtSimulator()
        
        missing_info = workspace['analysis'].get('missing_info', [])
        
        questions = await simulator.generate_questions(
            missing_info=missing_info,
            email_content=workspace['analysis'].get('summary', ''),
            workspace_type=workspace['type'],
            user_language=payload.language,
            accessibility_mode=payload.accessibility_mode
        )
        
        return {
            'success': True,
            'questions': questions,
            'total_questions': len(questions),
            'estimated_time_minutes': len(questions) * 2
        }
        
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except Exception as e:
        logger.error(f"Error generating questions: {str(e)}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR)


@router.post("/{workspace_id}/generate-response")
async def generate_response(
    workspace_id: uuid.UUID,
    payload: GenerateResponseRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Génère une réponse IA pour le workspace"""
    try:
        # Récupérer workspace
        workspace_service = WorkspaceService(db)
        workspace = await workspace_service.get_workspace_status(workspace_id, current_user.id)
        
        # Générer réponse
        responder = ResponderService()
        
        response = await responder.generate_response(
            email_content=workspace.get('content', ''),
            email_subject=workspace.get('title', ''),
            workspace_analysis=workspace['analysis'],
            tone=ResponseTone(payload.tone),
            language=Language(payload.language) if payload.language else None,
            user_plan=current_user.plan
        )
        
        return {
            'success': True,
            'response': response,
            'requires_validation': response['requires_validation'],
            'validation_url': f'/workspaces/{workspace_id}/validate-response' if response['requires_validation'] else None
        }
        
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except Exception as e:
        logger.error(f"Error generating response: {str(e)}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR)


@router.delete("/{workspace_id}")
async def delete_workspace(
    workspace_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Supprime un workspace (soft delete)"""
    try:
        from ..models.sqlalchemy_models import Document
        
        document = db.query(Document).filter(
            Document.id == workspace_id,
            Document.user_id == current_user.id
        ).first()
        
        if not document:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Workspace not found")
        
        # Soft delete
        document.deleted_at = datetime.utcnow()
        db.commit()
        
        # Log
        await log_workspace_action(
            db=db,
            user_id=current_user.id,
            action="workspace_deleted",
            details={'workspace_id': str(workspace_id)}
        )
        
        return {
            'success': True,
            'message': 'Workspace deleted successfully'
        }
        
    except Exception as e:
        logger.error(f"Error deleting workspace: {str(e)}")
        db.rollback()
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR)


# === WEBHOOKS (pour intégration multi-canal) ===

@router.post("/webhooks/email-received")
async def webhook_email_received(
    request: Request,
    db: Session = Depends(get_db)
):
    """
    Webhook pour emails entrants (Resend, SendGrid, etc.)
    
    Authentification via API key dans headers
    """
    try:
        # Vérifier API key
        api_key = request.headers.get('X-API-Key')
        if not api_key or api_key != os.getenv('WEBHOOK_API_KEY'):
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid API key")
        
        # Parser payload email
        payload = await request.json()
        
        # Identifier utilisateur par email
        from ..models.sqlalchemy_models import User
        user = db.query(User).filter(User.email == payload.get('to')).first()
        
        if not user:
            logger.warning(f"Email received for unknown user: {payload.get('to')}")
            return {'success': False, 'error': 'user_not_found'}
        
        # Créer workspace automatiquement
        workspace_service = WorkspaceService(db)
        
        result = await workspace_service.create_workspace_from_email(
            user_id=user.id,
            email_content=payload.get('body', ''),
            email_subject=payload.get('subject', ''),
            sender_email=payload.get('from'),
            channel=WorkspaceChannel.EMAIL
        )
        
        return {
            'success': True,
            'workspace_id': result['workspace_id']
        }
        
    except Exception as e:
        logger.error(f"Webhook error: {str(e)}")
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={'success': False, 'error': str(e)}
        )
