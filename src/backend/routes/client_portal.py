"""
Routes pour le Portail Client - US10/US11
Client Portal endpoints for case tracking and guided upload management
"""
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
from pathlib import Path
from pydantic import BaseModel, Field
import uuid

# Import models
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
from models import Case, User
from database import get_db

# Router
router = APIRouter(prefix="/api/client/portal", tags=["client-portal"])

# Pydantic Models
class CaseResponse(BaseModel):
    """Response model for Case"""
    id: int
    reference: str
    title: str
    description: Optional[str] = None
    status: str
    priority: str
    amount: Optional[float] = None
    deadline: Optional[datetime] = None
    notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class CaseDetailResponse(CaseResponse):
    """Detailed case response with client info"""
    client_name: Optional[str] = None
    client_email: Optional[str] = None


class UploadGuidedResponse(BaseModel):
    """US11 upload guided response payload"""
    upload_id: str
    filename: str
    content_type: str
    size_bytes: int
    status: str
    checklist_completed: List[str]
    checklist_missing: List[str]


# US11 upload constraints
MAX_UPLOAD_SIZE_BYTES = 10 * 1024 * 1024  # 10 MB
ALLOWED_EXTENSIONS = {".pdf", ".doc", ".docx", ".jpg", ".jpeg", ".png"}
ALLOWED_MIME_TYPES = {
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "image/jpeg",
    "image/png",
}
GUIDED_CHECKLIST = [
    "piece_identite",
    "justificatif_domicile",
    "document_principal_dossier",
]


# Routes
@router.get("/my-cases", response_model=List[CaseResponse])
async def get_my_cases(
    db: Session = Depends(get_db),
    status_filter: Optional[str] = None,
    priority_filter: Optional[str] = None,
    limit: int = 50,
    offset: int = 0
):
    """
    Get all cases for the authenticated client
    - **status_filter**: Filter by status (open, in_progress, pending, closed, archived)
    - **priority_filter**: Filter by priority (low, normal, high, critical)
    - **limit**: Maximum number of cases to return
    - **offset**: Number of cases to skip
    """
    try:
        # TODO: Get user_id from authentication context (currently demo mode)
        # For now, get all cases as demo
        query = db.query(Case).order_by(Case.updated_at.desc())

        # Apply filters
        if status_filter:
            query = query.filter(Case.status == status_filter)
        if priority_filter:
            query = query.filter(Case.priority == priority_filter)

        # Apply pagination
        cases = query.offset(offset).limit(limit).all()

        return cases
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error retrieving cases: {str(e)}"
        )


@router.get("/my-cases/{case_id}", response_model=CaseDetailResponse)
async def get_case_detail(
    case_id: int,
    db: Session = Depends(get_db)
):
    """Get detailed information about a specific case"""
    try:
        case = db.query(Case).filter(Case.id == case_id).first()

        if not case:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Case not found"
            )

        # Prepare response with client info
        response_data = {
            **vars(case),
            'client_name': case.user.name if case.user else None,
            'client_email': case.user.email if case.user else None
        }

        # Remove SQLAlchemy internals
        response_data.pop('_sa_instance_state', None)

        return CaseDetailResponse(**response_data)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error retrieving case: {str(e)}"
        )


@router.get("/my-cases/{case_id}/status")
async def get_case_status(
    case_id: int,
    db: Session = Depends(get_db)
):
    """Get current status of a case (quick endpoint for real-time updates)"""
    try:
        case = db.query(Case).filter(Case.id == case_id).first()

        if not case:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Case not found"
            )

        return {
            "id": case.id,
            "reference": case.reference,
            "status": case.status,
            "priority": case.priority,
            "updated_at": case.updated_at,
            "next_deadline": case.deadline
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error retrieving case status: {str(e)}"
        )


@router.get("/upload-checklist")
async def get_upload_checklist():
    """US11: Return guided checklist required by client upload flow"""
    return {
        "required_documents": GUIDED_CHECKLIST,
        "accepted_extensions": sorted(list(ALLOWED_EXTENSIONS)),
        "max_size_mb": int(MAX_UPLOAD_SIZE_BYTES / (1024 * 1024)),
    }


@router.post("/upload-guided", response_model=UploadGuidedResponse)
async def upload_guided_document(
    file: UploadFile = File(...),
    document_type: str = Form(...)
):
    """US11: Guided client upload with strict format/size validation"""
    try:
        extension = Path(file.filename or "").suffix.lower()
        if extension not in ALLOWED_EXTENSIONS:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Unsupported file extension: {extension}"
            )

        if file.content_type not in ALLOWED_MIME_TYPES:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Unsupported content type: {file.content_type}"
            )

        content = await file.read()
        size_bytes = len(content)
        if size_bytes > MAX_UPLOAD_SIZE_BYTES:
            raise HTTPException(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                detail=f"File too large. Max: {MAX_UPLOAD_SIZE_BYTES} bytes"
            )

        upload_id = str(uuid.uuid4())
        upload_dir = Path("uploads/client-portal")
        upload_dir.mkdir(parents=True, exist_ok=True)
        safe_name = f"{upload_id}_{Path(file.filename or 'document').name}"
        target = upload_dir / safe_name
        target.write_bytes(content)

        checklist_completed = [document_type] if document_type in GUIDED_CHECKLIST else []
        checklist_missing = [x for x in GUIDED_CHECKLIST if x not in checklist_completed]

        return UploadGuidedResponse(
            upload_id=upload_id,
            filename=file.filename or safe_name,
            content_type=file.content_type or "application/octet-stream",
            size_bytes=size_bytes,
            status="uploaded",
            checklist_completed=checklist_completed,
            checklist_missing=checklist_missing,
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error during guided upload: {str(e)}"
        )


@router.get("/stats")
async def get_portal_stats(db: Session = Depends(get_db)):
    """Get portal statistics for the client dashboard"""
    try:
        total_cases = db.query(Case).count()
        open_cases = db.query(Case).filter(Case.status == "open").count()
        in_progress_cases = db.query(Case).filter(Case.status == "in_progress").count()
        closed_cases = db.query(Case).filter(Case.status == "closed").count()

        # Get critical cases
        critical_cases = db.query(Case).filter(Case.priority == "critical").count()

        # Get cases with approaching deadline (next 7 days)
        from datetime import timedelta
        from sqlalchemy import and_
        seven_days_from_now = datetime.utcnow() + timedelta(days=7)
        approaching_deadline = db.query(Case).filter(
            and_(Case.deadline.isnot(None), Case.deadline <= seven_days_from_now)
        ).count()

        return {
            "total_cases": total_cases,
            "open_cases": open_cases,
            "in_progress_cases": in_progress_cases,
            "closed_cases": closed_cases,
            "critical_cases": critical_cases,
            "approaching_deadline": approaching_deadline
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error retrieving stats: {str(e)}"
        )
