"""
Email Routes - FastAPI
"""
from fastapi import APIRouter, HTTPException, Depends, status
from pydantic import BaseModel, EmailStr
from typing import List, Optional
from datetime import datetime
from sqlalchemy.orm import Session
import sys
import os

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from src.backend.database import get_db
from src.backend.models import Email, User
from src.backend.dependencies import get_current_user

router = APIRouter(prefix="/api", tags=["emails"])

# Pydantic models
class EmailSend(BaseModel):
    to: EmailStr
    subject: str
    body: str
    cc: Optional[List[EmailStr]] = None
    bcc: Optional[List[EmailStr]] = None
    attachments: Optional[List[str]] = None

class EmailResponse(BaseModel):
    id: str
    to: str
    subject: str
    body: str
    status: str
    sent_at: datetime
    created_at: datetime

@router.get("/email-history", response_model=List[EmailResponse])
async def get_email_history(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get email history"""
    user_id = current_user.id
    
    emails = db.query(Email).filter(Email.user_id == user_id).order_by(Email.created_at.desc()).all()
    return [
        EmailResponse(
            id=str(e.id),
            to=e.to_email,
            subject=e.subject,
            body=e.body,
            status=e.status,
            sent_at=e.sent_at,
            created_at=e.created_at
        )
        for e in emails
    ]

@router.post("/emails", response_model=EmailResponse, status_code=status.HTTP_201_CREATED)
async def send_email(
    email: EmailSend,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Send email"""
    user_id = current_user.id
    
    # TODO: Implémenter envoi réel via service email
    now = datetime.utcnow()
    
    new_email = Email(
        user_id=user_id,
        to_email=email.to,
        subject=email.subject,
        body=email.body,
        cc=",".join(email.cc) if email.cc else None,
        bcc=",".join(email.bcc) if email.bcc else None,
        status="sent",
        sent_at=now
    )
    
    db.add(new_email)
    db.commit()
    db.refresh(new_email)
    
    return EmailResponse(
        id=str(new_email.id),
        to=new_email.to_email,
        subject=new_email.subject,
        body=new_email.body,
        status=new_email.status,
        sent_at=new_email.sent_at,
        created_at=new_email.created_at
    )

@router.get("/emails/{email_id}", response_model=EmailResponse)
async def get_email(
    email_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get email by ID"""
    email = db.query(Email).filter(
        Email.id == int(email_id),
        Email.user_id == current_user.id
    ).first()
    if not email:
        raise HTTPException(status_code=404, detail="Email not found")
    
    return EmailResponse(
        id=str(email.id),
        to=email.to_email,
        subject=email.subject,
        body=email.body,
        status=email.status,
        sent_at=email.sent_at,
        created_at=email.created_at
    )

