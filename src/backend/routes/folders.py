"""
Folders (Dossiers) Routes - Client folder management
For IA Poste Manager institutional platform
"""
from fastapi import APIRouter, HTTPException, Depends, Query
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime, date
from enum import Enum

router = APIRouter(prefix="/api/folders", tags=["folders"])


class FolderStatus(str, Enum):
    ACTIVE = "active"
    PENDING = "pending"
    CLOSED = "closed"
    ARCHIVED = "archived"


class FolderType(str, Enum):
    LITIGATION = "litigation"  # Contentieux
    COUNSEL = "counsel"  # Conseil
    REAL_ESTATE = "real_estate"  # Immobilier
    CORPORATE = "corporate"  # Droit des sociétés
    FAMILY = "family"  # Droit de la famille
    CRIMINAL = "criminal"  # Pénal
    LABOR = "labor"  # Droit du travail
    OTHER = "other"


class Folder(BaseModel):
    id: str
    reference: str
    name: str
    client_name: str
    folder_type: FolderType
    status: FolderStatus
    created_at: datetime
    updated_at: datetime
    deadline: Optional[date] = None
    deadline_label: Optional[str] = None
    progress: int = 0  # 0-100
    messages_count: int = 0
    documents_count: int = 0
    assigned_to: Optional[str] = None
    ai_insights: Optional[str] = None
    tags: List[str] = []


class FolderListResponse(BaseModel):
    folders: List[Folder]
    total: int
    page: int
    per_page: int
    stats: dict


class FolderCreateRequest(BaseModel):
    reference: str
    name: str
    client_name: str
    folder_type: FolderType
    deadline: Optional[date] = None
    assigned_to: Optional[str] = None
    tags: List[str] = []


class FolderUpdateRequest(BaseModel):
    name: Optional[str] = None
    status: Optional[FolderStatus] = None
    deadline: Optional[date] = None
    progress: Optional[int] = None
    assigned_to: Optional[str] = None
    tags: Optional[List[str]] = None


# Mock data
MOCK_FOLDERS = [
    {
        "id": "folder-001",
        "reference": "2026/001",
        "name": "LEFEBVRE c/ MARTIN - Contentieux commercial",
        "client_name": "Jean Lefebvre",
        "folder_type": "litigation",
        "status": "active",
        "created_at": "2025-11-15T10:00:00",
        "updated_at": "2026-01-26T09:30:00",
        "deadline": "2026-02-15",
        "deadline_label": "Audience TGI",
        "progress": 65,
        "messages_count": 47,
        "documents_count": 23,
        "assigned_to": "Me. Sophie Martin",
        "ai_insights": "Dossier en phase finale. Conclusions à déposer avant le 28/01. Chances de succès estimées à 72%.",
        "tags": ["urgent", "tribunal", "commercial"]
    },
    {
        "id": "folder-002",
        "reference": "2026/002",
        "name": "SCI DES LILAS - Acquisition immobilière",
        "client_name": "SCI Des Lilas",
        "folder_type": "real_estate",
        "status": "active",
        "created_at": "2026-01-10T14:00:00",
        "updated_at": "2026-01-25T16:00:00",
        "deadline": "2026-02-28",
        "deadline_label": "Signature acte",
        "progress": 45,
        "messages_count": 18,
        "documents_count": 12,
        "assigned_to": "Me. Pierre Duval",
        "ai_insights": "En attente du certificat d'urbanisme. Relancer la mairie.",
        "tags": ["immobilier", "achat"]
    },
    {
        "id": "folder-003",
        "reference": "2026/003",
        "name": "SARL TECH INNOV - Constitution société",
        "client_name": "Marc Dubois",
        "folder_type": "corporate",
        "status": "pending",
        "created_at": "2026-01-20T09:00:00",
        "updated_at": "2026-01-24T11:00:00",
        "deadline": "2026-02-10",
        "deadline_label": "Immatriculation RCS",
        "progress": 30,
        "messages_count": 8,
        "documents_count": 5,
        "assigned_to": "Me. Sophie Martin",
        "ai_insights": "Statuts en cours de rédaction. Attente capital social.",
        "tags": ["création", "société"]
    },
    {
        "id": "folder-004",
        "reference": "2025/089",
        "name": "DUPONT - Divorce par consentement mutuel",
        "client_name": "Marie et Paul Dupont",
        "folder_type": "family",
        "status": "active",
        "created_at": "2025-10-05T10:00:00",
        "updated_at": "2026-01-22T14:30:00",
        "deadline": "2026-01-30",
        "deadline_label": "Dépôt convention",
        "progress": 85,
        "messages_count": 35,
        "documents_count": 18,
        "assigned_to": "Me. Claire Leroy",
        "ai_insights": "Convention signée. Prêt pour dépôt au greffe.",
        "tags": ["famille", "divorce"]
    },
    {
        "id": "folder-005",
        "reference": "2025/075",
        "name": "ENTREPRISE ABC - Licenciement abusif",
        "client_name": "Entreprise ABC",
        "folder_type": "labor",
        "status": "closed",
        "created_at": "2025-08-20T09:00:00",
        "updated_at": "2026-01-15T16:00:00",
        "deadline": None,
        "deadline_label": None,
        "progress": 100,
        "messages_count": 62,
        "documents_count": 28,
        "assigned_to": "Me. Pierre Duval",
        "ai_insights": "Affaire gagnée. Indemnités obtenues. Dossier clôturé.",
        "tags": ["travail", "gagné"]
    }
]


@router.get("/", response_model=FolderListResponse)
async def get_folders(
    status: Optional[FolderStatus] = Query(None, description="Filter by status"),
    folder_type: Optional[FolderType] = Query(None, description="Filter by type"),
    assigned_to: Optional[str] = Query(None, description="Filter by assignee"),
    search: Optional[str] = Query(None, description="Search query"),
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100)
):
    """Get folders with filters"""
    folders = MOCK_FOLDERS.copy()

    # Apply filters
    if status:
        folders = [f for f in folders if f["status"] == status.value]

    if folder_type:
        folders = [f for f in folders if f["folder_type"] == folder_type.value]

    if assigned_to:
        folders = [f for f in folders if f.get("assigned_to") == assigned_to]

    if search:
        search_lower = search.lower()
        folders = [f for f in folders if
            search_lower in f["name"].lower() or
            search_lower in f["client_name"].lower() or
            search_lower in f["reference"].lower()
        ]

    # Stats
    stats = {
        "total": len(MOCK_FOLDERS),
        "active": len([f for f in MOCK_FOLDERS if f["status"] == "active"]),
        "pending": len([f for f in MOCK_FOLDERS if f["status"] == "pending"]),
        "closed": len([f for f in MOCK_FOLDERS if f["status"] == "closed"]),
        "with_deadline": len([f for f in MOCK_FOLDERS if f.get("deadline")]),
        "urgent": len([f for f in MOCK_FOLDERS if "urgent" in f.get("tags", [])])
    }

    # Pagination
    total = len(folders)
    start = (page - 1) * per_page
    end = start + per_page
    paginated_folders = folders[start:end]

    # Convert to Folder objects
    folder_objects = [
        Folder(
            **{
                **f,
                "created_at": datetime.fromisoformat(f["created_at"]),
                "updated_at": datetime.fromisoformat(f["updated_at"]),
                "deadline": date.fromisoformat(f["deadline"]) if f.get("deadline") else None
            }
        ) for f in paginated_folders
    ]

    return FolderListResponse(
        folders=folder_objects,
        total=total,
        page=page,
        per_page=per_page,
        stats=stats
    )


@router.get("/{folder_id}")
async def get_folder(folder_id: str):
    """Get single folder by ID"""
    for f in MOCK_FOLDERS:
        if f["id"] == folder_id:
            return Folder(
                **{
                    **f,
                    "created_at": datetime.fromisoformat(f["created_at"]),
                    "updated_at": datetime.fromisoformat(f["updated_at"]),
                    "deadline": date.fromisoformat(f["deadline"]) if f.get("deadline") else None
                }
            )
    raise HTTPException(status_code=404, detail="Folder not found")


@router.post("/")
async def create_folder(request: FolderCreateRequest):
    """Create a new folder"""
    new_folder = {
        "id": f"folder-{len(MOCK_FOLDERS) + 1:03d}",
        "reference": request.reference,
        "name": request.name,
        "client_name": request.client_name,
        "folder_type": request.folder_type.value,
        "status": "active",
        "created_at": datetime.now().isoformat(),
        "updated_at": datetime.now().isoformat(),
        "deadline": request.deadline.isoformat() if request.deadline else None,
        "deadline_label": None,
        "progress": 0,
        "messages_count": 0,
        "documents_count": 0,
        "assigned_to": request.assigned_to,
        "ai_insights": None,
        "tags": request.tags
    }
    MOCK_FOLDERS.append(new_folder)
    return {"success": True, "folder_id": new_folder["id"]}


@router.patch("/{folder_id}")
async def update_folder(folder_id: str, request: FolderUpdateRequest):
    """Update a folder"""
    for f in MOCK_FOLDERS:
        if f["id"] == folder_id:
            if request.name:
                f["name"] = request.name
            if request.status:
                f["status"] = request.status.value
            if request.deadline:
                f["deadline"] = request.deadline.isoformat()
            if request.progress is not None:
                f["progress"] = request.progress
            if request.assigned_to:
                f["assigned_to"] = request.assigned_to
            if request.tags is not None:
                f["tags"] = request.tags
            f["updated_at"] = datetime.now().isoformat()
            return {"success": True, "message": "Folder updated"}
    raise HTTPException(status_code=404, detail="Folder not found")


@router.get("/{folder_id}/messages")
async def get_folder_messages(folder_id: str):
    """Get messages associated with a folder"""
    # In a real implementation, this would query the communications table
    return {
        "folder_id": folder_id,
        "messages": [],
        "total": 0
    }


@router.get("/{folder_id}/documents")
async def get_folder_documents(folder_id: str):
    """Get documents in a folder"""
    return {
        "folder_id": folder_id,
        "documents": [
            {"id": "doc-001", "name": "Assignation.pdf", "size": 125000, "uploaded_at": "2026-01-20T10:00:00"},
            {"id": "doc-002", "name": "Conclusions.docx", "size": 85000, "uploaded_at": "2026-01-25T14:30:00"},
            {"id": "doc-003", "name": "Pièces adverses.pdf", "size": 2500000, "uploaded_at": "2026-01-26T06:00:00"}
        ],
        "total": 3
    }


@router.get("/stats/overview")
async def get_folders_stats():
    """Get folder statistics overview"""
    return {
        "total_folders": len(MOCK_FOLDERS),
        "active_folders": len([f for f in MOCK_FOLDERS if f["status"] == "active"]),
        "pending_folders": len([f for f in MOCK_FOLDERS if f["status"] == "pending"]),
        "closed_this_month": 3,
        "total_clients": 45,
        "upcoming_deadlines": [
            {"folder_id": "folder-004", "reference": "2025/089", "deadline": "2026-01-30", "label": "Dépôt convention", "days_remaining": 4},
            {"folder_id": "folder-001", "reference": "2026/001", "deadline": "2026-02-15", "label": "Audience TGI", "days_remaining": 20},
            {"folder_id": "folder-003", "reference": "2026/003", "deadline": "2026-02-10", "label": "Immatriculation RCS", "days_remaining": 15}
        ],
        "by_type": {
            "litigation": 1,
            "real_estate": 1,
            "corporate": 1,
            "family": 1,
            "labor": 1
        }
    }
