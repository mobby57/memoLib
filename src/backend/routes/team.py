"""
Team Routes - User and access management
For IA Poste Manager institutional platform
"""
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
from enum import Enum

router = APIRouter(prefix="/api/team", tags=["team"])


class UserRole(str, Enum):
    ADMIN = "admin"
    PARTNER = "partner"  # Associé
    LAWYER = "lawyer"  # Collaborateur
    PARALEGAL = "paralegal"  # Assistant juridique
    INTERN = "intern"  # Stagiaire
    EXTERNAL = "external"  # Intervenant externe


class UserStatus(str, Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"
    PENDING = "pending"


class TeamMember(BaseModel):
    id: str
    email: str
    name: str
    role: UserRole
    department: Optional[str] = None
    status: UserStatus
    folders_count: int = 0
    last_activity: Optional[datetime] = None
    is_online: bool = False
    permissions: List[str] = []
    created_at: datetime


class TeamMemberCreate(BaseModel):
    email: str
    name: str
    role: UserRole
    department: Optional[str] = None
    permissions: List[str] = []


class TeamMemberUpdate(BaseModel):
    name: Optional[str] = None
    role: Optional[UserRole] = None
    department: Optional[str] = None
    status: Optional[UserStatus] = None
    permissions: Optional[List[str]] = None


class ActivityLogEntry(BaseModel):
    id: str
    user_id: str
    user_name: str
    action: str
    timestamp: datetime
    details: Optional[str] = None


# Permission definitions
PERMISSIONS = {
    "admin": [
        "manage_users", "manage_settings", "view_audit", "manage_integrations",
        "view_all_folders", "edit_all_folders", "delete_folders",
        "view_all_messages", "export_data", "manage_compliance"
    ],
    "partner": [
        "view_all_folders", "edit_all_folders", "view_all_messages",
        "assign_folders", "view_team_activity", "export_data", "view_audit"
    ],
    "lawyer": [
        "view_assigned_folders", "edit_assigned_folders",
        "view_assigned_messages", "classify_messages", "create_folders"
    ],
    "paralegal": [
        "view_assigned_folders", "view_assigned_messages",
        "classify_messages", "upload_documents"
    ],
    "intern": [
        "view_assigned_folders", "view_assigned_messages"
    ],
    "external": [
        "view_shared_folders", "view_shared_messages"
    ]
}

# Mock data
MOCK_TEAM_MEMBERS = [
    {
        "id": "user-001",
        "email": "admin@cabinet.fr",
        "name": "Administrateur Cabinet",
        "role": "admin",
        "department": "Direction",
        "status": "active",
        "folders_count": 0,
        "last_activity": "2026-01-26T10:00:00",
        "is_online": True,
        "permissions": PERMISSIONS["admin"],
        "created_at": "2024-01-01T09:00:00"
    },
    {
        "id": "user-002",
        "email": "sophie.martin@cabinet.fr",
        "name": "Me. Sophie Martin",
        "role": "partner",
        "department": "Droit des affaires",
        "status": "active",
        "folders_count": 25,
        "last_activity": "2026-01-26T09:45:00",
        "is_online": True,
        "permissions": PERMISSIONS["partner"],
        "created_at": "2024-03-15T09:00:00"
    },
    {
        "id": "user-003",
        "email": "pierre.duval@cabinet.fr",
        "name": "Me. Pierre Duval",
        "role": "partner",
        "department": "Droit social",
        "status": "active",
        "folders_count": 18,
        "last_activity": "2026-01-26T09:30:00",
        "is_online": True,
        "permissions": PERMISSIONS["partner"],
        "created_at": "2024-05-20T09:00:00"
    },
    {
        "id": "user-004",
        "email": "claire.leroy@cabinet.fr",
        "name": "Me. Claire Leroy",
        "role": "lawyer",
        "department": "Droit de la famille",
        "status": "active",
        "folders_count": 12,
        "last_activity": "2026-01-26T08:15:00",
        "is_online": False,
        "permissions": PERMISSIONS["lawyer"],
        "created_at": "2024-09-01T09:00:00"
    },
    {
        "id": "user-005",
        "email": "marie.petit@cabinet.fr",
        "name": "Marie Petit",
        "role": "paralegal",
        "department": "Secrétariat juridique",
        "status": "active",
        "folders_count": 8,
        "last_activity": "2026-01-26T09:50:00",
        "is_online": True,
        "permissions": PERMISSIONS["paralegal"],
        "created_at": "2025-02-01T09:00:00"
    },
    {
        "id": "user-006",
        "email": "lucas.bernard@cabinet.fr",
        "name": "Lucas Bernard",
        "role": "intern",
        "department": "Stage - Droit des affaires",
        "status": "active",
        "folders_count": 3,
        "last_activity": "2026-01-25T17:30:00",
        "is_online": False,
        "permissions": PERMISSIONS["intern"],
        "created_at": "2025-11-01T09:00:00"
    },
    {
        "id": "user-007",
        "email": "expert.comptable@externe.fr",
        "name": "Cabinet Comptable XYZ",
        "role": "external",
        "department": "Comptabilité",
        "status": "active",
        "folders_count": 2,
        "last_activity": "2026-01-20T14:00:00",
        "is_online": False,
        "permissions": PERMISSIONS["external"],
        "created_at": "2025-06-15T09:00:00"
    }
]

MOCK_ACTIVITY_LOG = [
    {
        "id": "act-001",
        "user_id": "user-002",
        "user_name": "Me. Sophie Martin",
        "action": "Consultation dossier",
        "timestamp": "2026-01-26T09:45:00",
        "details": "Dossier 2026/001 - LEFEBVRE"
    },
    {
        "id": "act-002",
        "user_id": "user-005",
        "user_name": "Marie Petit",
        "action": "Classification message",
        "timestamp": "2026-01-26T09:40:00",
        "details": "Email tribunal classé dans Procédures"
    },
    {
        "id": "act-003",
        "user_id": "user-003",
        "user_name": "Me. Pierre Duval",
        "action": "Export dossier",
        "timestamp": "2026-01-26T09:30:00",
        "details": "Dossier 2025/075 - Affaire ABC"
    }
]


@router.get("/members", response_model=List[TeamMember])
async def get_team_members(
    role: Optional[UserRole] = Query(None, description="Filter by role"),
    status: Optional[UserStatus] = Query(None, description="Filter by status"),
    department: Optional[str] = Query(None, description="Filter by department"),
    search: Optional[str] = Query(None, description="Search by name or email")
):
    """Get team members with filters"""
    members = MOCK_TEAM_MEMBERS.copy()

    if role:
        members = [m for m in members if m["role"] == role.value]
    if status:
        members = [m for m in members if m["status"] == status.value]
    if department:
        members = [m for m in members if department.lower() in m.get("department", "").lower()]
    if search:
        search_lower = search.lower()
        members = [m for m in members if
            search_lower in m["name"].lower() or
            search_lower in m["email"].lower()
        ]

    return [
        TeamMember(
            **{
                **m,
                "last_activity": datetime.fromisoformat(m["last_activity"]) if m.get("last_activity") else None,
                "created_at": datetime.fromisoformat(m["created_at"])
            }
        ) for m in members
    ]


@router.get("/members/{member_id}")
async def get_team_member(member_id: str):
    """Get single team member"""
    for m in MOCK_TEAM_MEMBERS:
        if m["id"] == member_id:
            return TeamMember(
                **{
                    **m,
                    "last_activity": datetime.fromisoformat(m["last_activity"]) if m.get("last_activity") else None,
                    "created_at": datetime.fromisoformat(m["created_at"])
                }
            )
    raise HTTPException(status_code=404, detail="Member not found")


@router.post("/members")
async def create_team_member(request: TeamMemberCreate):
    """Create a new team member"""
    # Check if email already exists
    for m in MOCK_TEAM_MEMBERS:
        if m["email"] == request.email:
            raise HTTPException(status_code=400, detail="Email already exists")

    new_member = {
        "id": f"user-{len(MOCK_TEAM_MEMBERS) + 1:03d}",
        "email": request.email,
        "name": request.name,
        "role": request.role.value,
        "department": request.department,
        "status": "pending",
        "folders_count": 0,
        "last_activity": None,
        "is_online": False,
        "permissions": request.permissions or PERMISSIONS.get(request.role.value, []),
        "created_at": datetime.now().isoformat()
    }
    MOCK_TEAM_MEMBERS.append(new_member)
    return {"success": True, "member_id": new_member["id"], "message": "Invitation sent"}


@router.patch("/members/{member_id}")
async def update_team_member(member_id: str, request: TeamMemberUpdate):
    """Update a team member"""
    for m in MOCK_TEAM_MEMBERS:
        if m["id"] == member_id:
            if request.name:
                m["name"] = request.name
            if request.role:
                m["role"] = request.role.value
                # Update permissions based on role
                m["permissions"] = PERMISSIONS.get(request.role.value, [])
            if request.department:
                m["department"] = request.department
            if request.status:
                m["status"] = request.status.value
            if request.permissions is not None:
                m["permissions"] = request.permissions
            return {"success": True, "message": "Member updated"}
    raise HTTPException(status_code=404, detail="Member not found")


@router.delete("/members/{member_id}")
async def deactivate_team_member(member_id: str):
    """Deactivate a team member"""
    for m in MOCK_TEAM_MEMBERS:
        if m["id"] == member_id:
            m["status"] = "inactive"
            m["is_online"] = False
            return {"success": True, "message": "Member deactivated"}
    raise HTTPException(status_code=404, detail="Member not found")


@router.get("/activity", response_model=List[ActivityLogEntry])
async def get_team_activity(
    user_id: Optional[str] = Query(None, description="Filter by user"),
    limit: int = Query(20, ge=1, le=100)
):
    """Get team activity log"""
    activities = MOCK_ACTIVITY_LOG.copy()

    if user_id:
        activities = [a for a in activities if a["user_id"] == user_id]

    activities = activities[:limit]

    return [
        ActivityLogEntry(
            **{**a, "timestamp": datetime.fromisoformat(a["timestamp"])}
        ) for a in activities
    ]


@router.get("/stats")
async def get_team_stats():
    """Get team statistics"""
    return {
        "total_members": len(MOCK_TEAM_MEMBERS),
        "active_members": len([m for m in MOCK_TEAM_MEMBERS if m["status"] == "active"]),
        "online_now": len([m for m in MOCK_TEAM_MEMBERS if m["is_online"]]),
        "by_role": {
            "admin": len([m for m in MOCK_TEAM_MEMBERS if m["role"] == "admin"]),
            "partner": len([m for m in MOCK_TEAM_MEMBERS if m["role"] == "partner"]),
            "lawyer": len([m for m in MOCK_TEAM_MEMBERS if m["role"] == "lawyer"]),
            "paralegal": len([m for m in MOCK_TEAM_MEMBERS if m["role"] == "paralegal"]),
            "intern": len([m for m in MOCK_TEAM_MEMBERS if m["role"] == "intern"]),
            "external": len([m for m in MOCK_TEAM_MEMBERS if m["role"] == "external"])
        },
        "by_department": {
            "Direction": 1,
            "Droit des affaires": 2,
            "Droit social": 1,
            "Droit de la famille": 1,
            "Secrétariat juridique": 1,
            "Externe": 1
        }
    }


@router.get("/roles")
async def get_available_roles():
    """Get available roles and their permissions"""
    return {
        "roles": [
            {
                "id": "admin",
                "name": "Administrateur",
                "description": "Accès complet au système",
                "permissions": PERMISSIONS["admin"]
            },
            {
                "id": "partner",
                "name": "Associé",
                "description": "Gestion de tous les dossiers et équipe",
                "permissions": PERMISSIONS["partner"]
            },
            {
                "id": "lawyer",
                "name": "Collaborateur",
                "description": "Gestion des dossiers assignés",
                "permissions": PERMISSIONS["lawyer"]
            },
            {
                "id": "paralegal",
                "name": "Assistant juridique",
                "description": "Support sur les dossiers assignés",
                "permissions": PERMISSIONS["paralegal"]
            },
            {
                "id": "intern",
                "name": "Stagiaire",
                "description": "Consultation des dossiers assignés",
                "permissions": PERMISSIONS["intern"]
            },
            {
                "id": "external",
                "name": "Intervenant externe",
                "description": "Accès limité aux dossiers partagés",
                "permissions": PERMISSIONS["external"]
            }
        ]
    }


@router.get("/permissions")
async def get_all_permissions():
    """Get all available permissions"""
    return {
        "permissions": [
            {"id": "manage_users", "name": "Gérer les utilisateurs", "category": "Administration"},
            {"id": "manage_settings", "name": "Gérer les paramètres", "category": "Administration"},
            {"id": "view_audit", "name": "Consulter les audits", "category": "Administration"},
            {"id": "manage_integrations", "name": "Gérer les intégrations", "category": "Administration"},
            {"id": "view_all_folders", "name": "Voir tous les dossiers", "category": "Dossiers"},
            {"id": "edit_all_folders", "name": "Modifier tous les dossiers", "category": "Dossiers"},
            {"id": "view_assigned_folders", "name": "Voir dossiers assignés", "category": "Dossiers"},
            {"id": "edit_assigned_folders", "name": "Modifier dossiers assignés", "category": "Dossiers"},
            {"id": "view_shared_folders", "name": "Voir dossiers partagés", "category": "Dossiers"},
            {"id": "create_folders", "name": "Créer des dossiers", "category": "Dossiers"},
            {"id": "delete_folders", "name": "Supprimer des dossiers", "category": "Dossiers"},
            {"id": "assign_folders", "name": "Assigner des dossiers", "category": "Dossiers"},
            {"id": "view_all_messages", "name": "Voir tous les messages", "category": "Messages"},
            {"id": "view_assigned_messages", "name": "Voir messages assignés", "category": "Messages"},
            {"id": "view_shared_messages", "name": "Voir messages partagés", "category": "Messages"},
            {"id": "classify_messages", "name": "Classifier les messages", "category": "Messages"},
            {"id": "upload_documents", "name": "Téléverser documents", "category": "Documents"},
            {"id": "export_data", "name": "Exporter des données", "category": "Données"},
            {"id": "view_team_activity", "name": "Voir activité équipe", "category": "Équipe"},
            {"id": "manage_compliance", "name": "Gérer la conformité", "category": "Conformité"}
        ]
    }
