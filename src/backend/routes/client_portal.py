"""
Routes pour le Portail Client - US10
Client Portal endpoints for case tracking and management
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel, Field

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
