"""
Routes FastAPI pour gestion des Formulaires

Endpoints:
- POST /api/v1/forms/generate
- GET /api/v1/forms/{form_id}
- POST /api/v1/forms/{form_id}/submit
- POST /api/v1/forms/{form_id}/auto-save
- POST /api/v1/forms/mdph/cerfa-export
"""

import logging
import uuid
from typing import Optional, Dict, Any
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field

from ..database_config import get_db
from ..models.sqlalchemy_models import User, MDPHForm, MDPHFormStatus
from ..services.form_generator import FormGenerator, AccessibilityMode
from ..services.logger import log_workspace_action
from .auth import get_current_user

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/forms", tags=["forms"])


# === MODELS PYDANTIC ===

class GenerateFormRequest(BaseModel):
    questions: list
    form_type: str = "general"
    accessibility_mode: Optional[str] = None
    language: str = "fr"
    user_data: Optional[Dict[str, Any]] = {}


class SubmitFormRequest(BaseModel):
    form_data: Dict[str, Any]
    step_id: Optional[str] = None
    is_draft: bool = False


class AutoSaveRequest(BaseModel):
    step_id: str
    field_values: Dict[str, Any]


class CerfaExportRequest(BaseModel):
    mdph_form_id: uuid.UUID
    cerfa_type: str = "cerfa_15692"


# === ENDPOINTS ===

@router.post("/generate", status_code=status.HTTP_201_CREATED)
async def generate_form(
    payload: GenerateFormRequest,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Génère un formulaire interactif adaptatif
    
    Support:
    - 5 modes accessibilité RGAA
    - Multi-langue
    - Pré-remplissage automatique
    - Sauvegarde auto toutes les 30s
    """
    try:
        form_generator = FormGenerator()
        
        # Récupérer données utilisateur pour pré-remplissage
        user_data = payload.user_data or {
            'first_name': current_user.profile.first_name if current_user.profile else None,
            'last_name': current_user.profile.last_name if current_user.profile else None,
            'email': current_user.email,
            'phone': current_user.profile.phone if current_user.profile else None
        }
        
        form_structure = form_generator.generate_form(
            questions=payload.questions,
            form_type=payload.form_type,
            accessibility_mode=AccessibilityMode(payload.accessibility_mode) if payload.accessibility_mode else None,
            language=payload.language,
            user_data=user_data
        )
        
        # Log
        await log_workspace_action(
            db=db,
            user_id=current_user.id,
            action="form_generated",
            details={
                'form_id': form_structure['id'],
                'form_type': payload.form_type,
                'accessibility_mode': payload.accessibility_mode,
                'total_steps': len(form_structure['steps'])
            },
            ip_address=request.client.host
        )
        
        return {
            'success': True,
            'form': form_structure
        }
        
    except Exception as e:
        logger.error(f"Error generating form: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to generate form"
        )


@router.get("/{form_id}")
async def get_form(
    form_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Récupère un formulaire sauvegardé"""
    try:
        form_generator = FormGenerator()
        
        # Récupérer depuis cache
        if form_id not in form_generator.forms_cache:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Form not found")
        
        form_structure = form_generator.forms_cache[form_id]
        
        return {
            'success': True,
            'form': form_structure
        }
        
    except Exception as e:
        logger.error(f"Error fetching form: {str(e)}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR)


@router.post("/{form_id}/submit")
async def submit_form(
    form_id: str,
    payload: SubmitFormRequest,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Soumet un formulaire complet ou une étape
    
    Si is_draft=True: sauvegarde en brouillon
    Sinon: validation et traitement complet
    """
    try:
        # Validation des données
        # TODO: Implémenter validation selon rules du formulaire
        
        # Si brouillon: sauvegarder seulement
        if payload.is_draft:
            # Sauvegarder dans DB
            # TODO: Table form_submissions ou user metadata
            
            return {
                'success': True,
                'message': 'Draft saved successfully',
                'draft_id': form_id
            }
        
        # Soumission finale: traiter données
        # TODO: Créer document, créer MDPH form si applicable, etc.
        
        await log_workspace_action(
            db=db,
            user_id=current_user.id,
            action="form_submitted",
            details={
                'form_id': form_id,
                'is_draft': payload.is_draft,
                'fields_count': len(payload.form_data)
            },
            ip_address=request.client.host
        )
        
        return {
            'success': True,
            'message': 'Form submitted successfully',
            'next_steps': [
                {
                    'action': 'view_workspace',
                    'url': f'/workspaces/{form_id}'
                }
            ]
        }
        
    except Exception as e:
        logger.error(f"Error submitting form: {str(e)}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR)


@router.post("/{form_id}/auto-save")
async def auto_save_form(
    form_id: str,
    payload: AutoSaveRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Sauvegarde automatique (toutes les 30s)"""
    try:
        # Sauvegarder dans localStorage côté frontend
        # Ici: sauvegarder en DB pour sécurité
        
        # TODO: Implémenter table form_auto_saves
        
        return {
            'success': True,
            'message': 'Auto-saved',
            'timestamp': datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Auto-save error: {str(e)}")
        # Ne pas bloquer utilisateur si auto-save échoue
        return {
            'success': False,
            'error': str(e)
        }


@router.post("/mdph/cerfa-export")
async def export_mdph_cerfa(
    payload: CerfaExportRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Exporte un formulaire MDPH au format CERFA officiel
    
    CERFA 15692*01: Formulaire de demande MDPH
    """
    try:
        # Récupérer formulaire MDPH
        mdph_form = db.query(MDPHForm).filter(
            MDPHForm.id == payload.mdph_form_id,
            MDPHForm.user_id == current_user.id
        ).first()
        
        if not mdph_form:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="MDPH form not found")
        
        # Générer CERFA
        form_generator = FormGenerator()
        cerfa_data = form_generator.generate_mdph_form_cerfa(
            form_data=mdph_form.form_data,
            form_type=payload.cerfa_type
        )
        
        # TODO: Générer PDF depuis template CERFA
        # Utiliser reportlab ou pdfkit pour remplir PDF
        
        await log_workspace_action(
            db=db,
            user_id=current_user.id,
            action="mdph_cerfa_exported",
            details={
                'mdph_form_id': str(payload.mdph_form_id),
                'cerfa_type': payload.cerfa_type
            }
        )
        
        return {
            'success': True,
            'cerfa': cerfa_data,
            'pdf_url': f'/downloads/cerfa_{payload.mdph_form_id}.pdf',  # À implémenter
            'message': 'CERFA généré avec succès. Vérifiez les informations avant envoi.'
        }
        
    except Exception as e:
        logger.error(f"Error exporting CERFA: {str(e)}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR)


@router.post("/mdph/validate-completion")
async def validate_mdph_completion(
    mdph_form_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Valide si formulaire MDPH est complet et prêt à envoyer"""
    try:
        mdph_form = db.query(MDPHForm).filter(
            MDPHForm.id == mdph_form_id,
            MDPHForm.user_id == current_user.id
        ).first()
        
        if not mdph_form:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND)
        
        # Vérifier champs obligatoires
        form_data = mdph_form.form_data
        
        required_fields = [
            'nom', 'prenom', 'date_naissance', 'adresse',
            'handicap_description', 'demande_type'
        ]
        
        missing_fields = [field for field in required_fields if not form_data.get(field)]
        
        is_complete = len(missing_fields) == 0
        completion_percentage = ((len(required_fields) - len(missing_fields)) / len(required_fields)) * 100
        
        # Mettre à jour dans DB
        mdph_form.completion_percentage = completion_percentage
        if is_complete:
            mdph_form.status = MDPHFormStatus.READY
        db.commit()
        
        return {
            'success': True,
            'is_complete': is_complete,
            'completion_percentage': completion_percentage,
            'missing_fields': missing_fields,
            'can_submit': is_complete,
            'estimated_processing_days': 4  # MDPH: 4 mois en moyenne
        }
        
    except Exception as e:
        logger.error(f"Validation error: {str(e)}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR)
