"""
Workspace API Routes
"""

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
from uuid import UUID

from ..database import get_db
from ..models.workspace import Workspace, WorkspaceFile
from ..services.workspace_service import WorkspaceService

router = APIRouter()

# Pydantic models
class WorkspaceCreate(BaseModel):
    name: str
    description: Optional[str] = None

class WorkspaceResponse(BaseModel):
    id: UUID
    name: str
    description: Optional[str]
    status: str
    created_at: str

@router.post("/create", response_model=WorkspaceResponse)
async def create_workspace(
    workspace: WorkspaceCreate,
    db: Session = Depends(get_db)
):
    """Create new workspace"""
    service = WorkspaceService(db)
    return await service.create_workspace(workspace.dict())

@router.get("/{workspace_id}", response_model=WorkspaceResponse)
async def get_workspace(
    workspace_id: UUID,
    db: Session = Depends(get_db)
):
    """Get workspace by ID"""
    service = WorkspaceService(db)
    workspace = await service.get_workspace(workspace_id)
    if not workspace:
        raise HTTPException(status_code=404, detail="Workspace not found")
    return workspace

@router.get("/", response_model=List[WorkspaceResponse])
async def list_workspaces(
    db: Session = Depends(get_db)
):
    """List all workspaces"""
    service = WorkspaceService(db)
    return await service.list_workspaces()

@router.post("/{workspace_id}/upload")
async def upload_file(
    workspace_id: UUID,
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """Upload file to workspace"""
    service = WorkspaceService(db)
    return await service.upload_file(workspace_id, file)

@router.post("/{workspace_id}/process")
async def process_workspace(
    workspace_id: UUID,
    db: Session = Depends(get_db)
):
    """Process workspace with AI"""
    service = WorkspaceService(db)
    return await service.process_workspace(workspace_id)