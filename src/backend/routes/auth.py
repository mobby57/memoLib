"""
Authentication Routes
"""
from fastapi import APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from typing import Optional
from sqlalchemy.orm import Session
import sys
import os

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from src.backend.database import get_db
from src.backend.models import User
from src.backend.services.auth_service import (
    hash_password, verify_password, 
    create_access_token, create_refresh_token, verify_token
)

router = APIRouter(prefix="/api/auth", tags=["auth"])
security = HTTPBearer()

# Pydantic models
class LoginRequest(BaseModel):
    email: str
    password: str

class RegisterRequest(BaseModel):
    email: str
    password: str
    name: Optional[str] = None

class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"

@router.post("/login", response_model=TokenResponse)
async def login(request: LoginRequest, db: Session = Depends(get_db)):
    """Login endpoint"""
    # Récupérer utilisateur depuis la base de données
    user = db.query(User).filter(User.email == request.email).first()
    
    if not user or not verify_password(request.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials"
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is disabled"
        )
    
    access_token = create_access_token(data={"sub": user.email})
    refresh_token = create_refresh_token(data={"sub": user.email})
    
    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token
    )

@router.post("/register", response_model=TokenResponse)
async def register(request: RegisterRequest, db: Session = Depends(get_db)):
    """Register endpoint"""
    # Vérifier si l'email existe déjà
    existing_user = db.query(User).filter(User.email == request.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Créer nouvel utilisateur
    new_user = User(
        email=request.email,
        name=request.name or "User",
        hashed_password=hash_password(request.password),
        is_active=True
    )
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    access_token = create_access_token(data={"sub": new_user.email})
    refresh_token = create_refresh_token(data={"sub": new_user.email})
    
    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token
    )

@router.post("/refresh")
async def refresh_token(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Refresh token endpoint"""
    try:
        payload = verify_token(credentials.credentials)
        if payload.get("type") != "refresh":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid refresh token"
            )
        
        access_token = create_access_token(data={"sub": payload["sub"]})
        return {"access_token": access_token, "token_type": "bearer"}
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token"
        )

@router.post("/logout")
async def logout():
    """Logout endpoint"""
    return {"message": "Logged out successfully"}

@router.get("/me")
async def get_current_user_info(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
):
    """Get current user info"""
    from src.backend.dependencies import get_current_user
    
    user = await get_current_user(credentials, db)
    
    return {
        "id": str(user.id),
        "email": user.email,
        "name": user.name,
        "is_active": user.is_active,
        "is_admin": user.is_admin
    }