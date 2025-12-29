"""
Contacts Routes - FastAPI
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
from src.backend.models import Contact, User
from src.backend.dependencies import get_current_user

router = APIRouter(prefix="/api/contacts", tags=["contacts"])

# Pydantic models
class ContactCreate(BaseModel):
    name: str
    email: EmailStr
    phone: Optional[str] = None
    company: Optional[str] = None
    notes: Optional[str] = None

class ContactUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    company: Optional[str] = None
    notes: Optional[str] = None

class ContactResponse(BaseModel):
    id: str
    name: str
    email: str
    phone: Optional[str] = None
    company: Optional[str] = None
    notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime

@router.get("", response_model=List[ContactResponse])
async def get_contacts(db: Session = Depends(get_db)):
    """Get all contacts"""
    contacts = db.query(Contact).all()
    return [
        ContactResponse(
            id=str(c.id),
            name=c.name,
            email=c.email,
            phone=c.phone,
            company=c.company,
            notes=c.notes,
            created_at=c.created_at,
            updated_at=c.updated_at
        )
        for c in contacts
    ]

@router.get("/{contact_id}", response_model=ContactResponse)
async def get_contact(
    contact_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get contact by ID"""
    contact = db.query(Contact).filter(
        Contact.id == int(contact_id),
        Contact.user_id == current_user.id
    ).first()
    if not contact:
        raise HTTPException(status_code=404, detail="Contact not found")
    
    return ContactResponse(
        id=str(contact.id),
        name=contact.name,
        email=contact.email,
        phone=contact.phone,
        company=contact.company,
        notes=contact.notes,
        created_at=contact.created_at,
        updated_at=contact.updated_at
    )

@router.post("", response_model=ContactResponse, status_code=status.HTTP_201_CREATED)
async def create_contact(
    contact: ContactCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create new contact"""
    user_id = current_user.id
    
    new_contact = Contact(
        user_id=user_id,
        name=contact.name,
        email=contact.email,
        phone=contact.phone,
        company=contact.company,
        notes=contact.notes
    )
    
    db.add(new_contact)
    db.commit()
    db.refresh(new_contact)
    
    return ContactResponse(
        id=str(new_contact.id),
        name=new_contact.name,
        email=new_contact.email,
        phone=new_contact.phone,
        company=new_contact.company,
        notes=new_contact.notes,
        created_at=new_contact.created_at,
        updated_at=new_contact.updated_at
    )

@router.put("/{contact_id}", response_model=ContactResponse)
async def update_contact(
    contact_id: str,
    contact: ContactUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update contact"""
    db_contact = db.query(Contact).filter(
        Contact.id == int(contact_id),
        Contact.user_id == current_user.id
    ).first()
    if not db_contact:
        raise HTTPException(status_code=404, detail="Contact not found")
    
    update_data = contact.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_contact, field, value)
    
    db.commit()
    db.refresh(db_contact)
    
    return ContactResponse(
        id=str(db_contact.id),
        name=db_contact.name,
        email=db_contact.email,
        phone=db_contact.phone,
        company=db_contact.company,
        notes=db_contact.notes,
        created_at=db_contact.created_at,
        updated_at=db_contact.updated_at
    )

@router.delete("/{contact_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_contact(
    contact_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete contact"""
    contact = db.query(Contact).filter(
        Contact.id == int(contact_id),
        Contact.user_id == current_user.id
    ).first()
    if not contact:
        raise HTTPException(status_code=404, detail="Contact not found")
    
    db.delete(contact)
    db.commit()
    return None

