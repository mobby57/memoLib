"""
Compliance Routes - RGPD, Legal Deadlines, Audit
For IA Poste Manager institutional platform
"""
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime, date
from enum import Enum

router = APIRouter(prefix="/api/compliance", tags=["compliance"])


class ComplianceCategory(str, Enum):
    RGPD = "rgpd"
    LEGAL_DEADLINE = "legal_deadline"
    RETENTION = "retention"
    ACCESS_RIGHT = "access_right"
    AUDIT = "audit"


class ComplianceStatus(str, Enum):
    COMPLIANT = "compliant"
    WARNING = "warning"
    NON_COMPLIANT = "non_compliant"
    PENDING = "pending"


class RGPDRequest(BaseModel):
    id: str
    type: str  # access, rectification, deletion, portability
    requester_name: str
    requester_email: str
    request_date: date
    deadline: date
    status: str
    assigned_to: Optional[str] = None
    notes: Optional[str] = None


class LegalDeadline(BaseModel):
    id: str
    folder_id: str
    folder_reference: str
    description: str
    deadline: date
    days_remaining: int
    priority: str
    status: str
    responsible: Optional[str] = None


class AuditLogEntry(BaseModel):
    id: str
    timestamp: datetime
    user_email: str
    user_name: str
    action: str
    resource_type: str
    resource_id: str
    ip_address: str
    details: Optional[str] = None


class RetentionRule(BaseModel):
    id: str
    category: str
    description: str
    retention_period: str
    legal_basis: str
    auto_delete: bool
    documents_count: int


class ComplianceStats(BaseModel):
    rgpd_score: int
    pending_requests: int
    upcoming_deadlines: int
    audit_entries_today: int
    retention_alerts: int
    last_audit_date: Optional[date] = None


# Mock data
MOCK_RGPD_REQUESTS = [
    {
        "id": "rgpd-001",
        "type": "access",
        "requester_name": "Marie Lambert",
        "requester_email": "marie.lambert@email.com",
        "request_date": "2026-01-15",
        "deadline": "2026-02-14",
        "status": "pending",
        "assigned_to": "Me. Sophie Martin",
        "notes": "Client ancien - dossier 2024/045"
    },
    {
        "id": "rgpd-002",
        "type": "deletion",
        "requester_name": "Pierre Durand",
        "requester_email": "p.durand@email.com",
        "request_date": "2026-01-20",
        "deadline": "2026-02-19",
        "status": "in_progress",
        "assigned_to": "Me. Claire Leroy",
        "notes": "Vérifier obligations légales de conservation"
    }
]

MOCK_LEGAL_DEADLINES = [
    {
        "id": "dl-001",
        "folder_id": "folder-004",
        "folder_reference": "2025/089",
        "description": "Dépôt convention divorce",
        "deadline": "2026-01-30",
        "days_remaining": 4,
        "priority": "high",
        "status": "pending",
        "responsible": "Me. Claire Leroy"
    },
    {
        "id": "dl-002",
        "folder_id": "folder-001",
        "folder_reference": "2026/001",
        "description": "Conclusions en réponse",
        "deadline": "2026-01-28",
        "days_remaining": 2,
        "priority": "urgent",
        "status": "pending",
        "responsible": "Me. Sophie Martin"
    },
    {
        "id": "dl-003",
        "folder_id": "folder-003",
        "folder_reference": "2026/003",
        "description": "Immatriculation RCS",
        "deadline": "2026-02-10",
        "days_remaining": 15,
        "priority": "medium",
        "status": "pending",
        "responsible": "Me. Sophie Martin"
    },
    {
        "id": "dl-004",
        "folder_id": "folder-001",
        "folder_reference": "2026/001",
        "description": "Audience TGI Paris",
        "deadline": "2026-02-15",
        "days_remaining": 20,
        "priority": "high",
        "status": "pending",
        "responsible": "Me. Sophie Martin"
    }
]

MOCK_AUDIT_LOG = [
    {
        "id": "audit-001",
        "timestamp": "2026-01-26T09:45:00",
        "user_email": "sophie.martin@cabinet.fr",
        "user_name": "Me. Sophie Martin",
        "action": "VIEW",
        "resource_type": "folder",
        "resource_id": "folder-001",
        "ip_address": "192.168.1.45",
        "details": "Consultation dossier LEFEBVRE"
    },
    {
        "id": "audit-002",
        "timestamp": "2026-01-26T09:30:00",
        "user_email": "claire.leroy@cabinet.fr",
        "user_name": "Me. Claire Leroy",
        "action": "DOWNLOAD",
        "resource_type": "document",
        "resource_id": "doc-015",
        "ip_address": "192.168.1.52",
        "details": "Téléchargement convention divorce"
    },
    {
        "id": "audit-003",
        "timestamp": "2026-01-26T09:15:00",
        "user_email": "pierre.duval@cabinet.fr",
        "user_name": "Me. Pierre Duval",
        "action": "EXPORT",
        "resource_type": "folder",
        "resource_id": "folder-005",
        "ip_address": "192.168.1.60",
        "details": "Export dossier clôturé ABC"
    },
    {
        "id": "audit-004",
        "timestamp": "2026-01-26T08:45:00",
        "user_email": "admin@cabinet.fr",
        "user_name": "Administrateur",
        "action": "LOGIN",
        "resource_type": "system",
        "resource_id": "auth",
        "ip_address": "192.168.1.1",
        "details": "Connexion réussie"
    }
]

MOCK_RETENTION_RULES = [
    {
        "id": "ret-001",
        "category": "Correspondance client",
        "description": "Emails et messages avec les clients",
        "retention_period": "10 ans",
        "legal_basis": "Article L. 134-2 Code du Commerce",
        "auto_delete": False,
        "documents_count": 1250
    },
    {
        "id": "ret-002",
        "category": "Pièces de procédure",
        "description": "Documents judiciaires et conclusions",
        "retention_period": "30 ans",
        "legal_basis": "Décret 2005-790 - Archives judiciaires",
        "auto_delete": False,
        "documents_count": 450
    },
    {
        "id": "ret-003",
        "category": "Données RH",
        "description": "Informations sur le personnel",
        "retention_period": "5 ans après départ",
        "legal_basis": "RGPD Art. 17 + Code du travail",
        "auto_delete": True,
        "documents_count": 85
    },
    {
        "id": "ret-004",
        "category": "Comptabilité",
        "description": "Factures et pièces comptables",
        "retention_period": "10 ans",
        "legal_basis": "Article L. 123-22 Code du Commerce",
        "auto_delete": False,
        "documents_count": 320
    },
    {
        "id": "ret-005",
        "category": "Prospects",
        "description": "Données de prospection commerciale",
        "retention_period": "3 ans",
        "legal_basis": "RGPD - Consentement",
        "auto_delete": True,
        "documents_count": 150
    }
]


@router.get("/stats", response_model=ComplianceStats)
async def get_compliance_stats():
    """Get compliance statistics overview"""
    return ComplianceStats(
        rgpd_score=98,
        pending_requests=len([r for r in MOCK_RGPD_REQUESTS if r["status"] == "pending"]),
        upcoming_deadlines=len([d for d in MOCK_LEGAL_DEADLINES if d["days_remaining"] <= 7]),
        audit_entries_today=len(MOCK_AUDIT_LOG),
        retention_alerts=2,
        last_audit_date=date(2026, 1, 15)
    )


@router.get("/rgpd-requests", response_model=List[RGPDRequest])
async def get_rgpd_requests(
    status: Optional[str] = Query(None, description="Filter by status"),
    type: Optional[str] = Query(None, description="Filter by request type")
):
    """Get RGPD requests"""
    requests = MOCK_RGPD_REQUESTS.copy()

    if status:
        requests = [r for r in requests if r["status"] == status]
    if type:
        requests = [r for r in requests if r["type"] == type]

    return [
        RGPDRequest(
            **{
                **r,
                "request_date": date.fromisoformat(r["request_date"]),
                "deadline": date.fromisoformat(r["deadline"])
            }
        ) for r in requests
    ]


@router.post("/rgpd-requests/{request_id}/complete")
async def complete_rgpd_request(request_id: str, response_notes: str = ""):
    """Mark RGPD request as completed"""
    for r in MOCK_RGPD_REQUESTS:
        if r["id"] == request_id:
            r["status"] = "completed"
            r["notes"] = f"{r.get('notes', '')} | Traité le {datetime.now().strftime('%d/%m/%Y')}: {response_notes}"
            return {"success": True, "message": "Request marked as completed"}
    raise HTTPException(status_code=404, detail="Request not found")


@router.get("/legal-deadlines", response_model=List[LegalDeadline])
async def get_legal_deadlines(
    priority: Optional[str] = Query(None, description="Filter by priority"),
    days_ahead: int = Query(30, description="Show deadlines within N days")
):
    """Get upcoming legal deadlines"""
    deadlines = [d for d in MOCK_LEGAL_DEADLINES if d["days_remaining"] <= days_ahead]

    if priority:
        deadlines = [d for d in deadlines if d["priority"] == priority]

    # Sort by days remaining
    deadlines.sort(key=lambda x: x["days_remaining"])

    return [
        LegalDeadline(
            **{**d, "deadline": date.fromisoformat(d["deadline"])}
        ) for d in deadlines
    ]


@router.get("/audit-log", response_model=List[AuditLogEntry])
async def get_audit_log(
    user_email: Optional[str] = Query(None, description="Filter by user"),
    action: Optional[str] = Query(None, description="Filter by action type"),
    resource_type: Optional[str] = Query(None, description="Filter by resource type"),
    start_date: Optional[date] = Query(None, description="Start date"),
    end_date: Optional[date] = Query(None, description="End date"),
    page: int = Query(1, ge=1),
    per_page: int = Query(50, ge=1, le=200)
):
    """Get audit log entries"""
    entries = MOCK_AUDIT_LOG.copy()

    if user_email:
        entries = [e for e in entries if e["user_email"] == user_email]
    if action:
        entries = [e for e in entries if e["action"] == action]
    if resource_type:
        entries = [e for e in entries if e["resource_type"] == resource_type]

    # Pagination
    start = (page - 1) * per_page
    end = start + per_page
    paginated = entries[start:end]

    return [
        AuditLogEntry(
            **{**e, "timestamp": datetime.fromisoformat(e["timestamp"])}
        ) for e in paginated
    ]


@router.get("/retention-rules", response_model=List[RetentionRule])
async def get_retention_rules():
    """Get data retention rules"""
    return [RetentionRule(**r) for r in MOCK_RETENTION_RULES]


@router.get("/retention-alerts")
async def get_retention_alerts():
    """Get documents approaching retention deadline"""
    return {
        "alerts": [
            {
                "category": "Prospects",
                "documents_to_review": 45,
                "oldest_date": "2023-01-15",
                "action_required": "Review and delete or archive"
            },
            {
                "category": "Données RH",
                "documents_to_review": 12,
                "oldest_date": "2020-06-30",
                "action_required": "Anciens employés - à supprimer"
            }
        ],
        "total_alerts": 2
    }


@router.get("/certifications")
async def get_certifications():
    """Get compliance certifications status"""
    return {
        "certifications": [
            {
                "name": "RGPD",
                "status": "compliant",
                "last_audit": "2025-12-15",
                "next_audit": "2026-06-15",
                "score": 98
            },
            {
                "name": "CNIL",
                "status": "registered",
                "registration_date": "2024-03-20",
                "registration_number": "2024-FR-0012345"
            },
            {
                "name": "eIDAS",
                "status": "compliant",
                "certificate_valid_until": "2027-03-15"
            },
            {
                "name": "HDS",
                "status": "not_required",
                "notes": "Hébergement données de santé non applicable"
            }
        ]
    }


@router.post("/audit-log")
async def create_audit_entry(
    action: str,
    resource_type: str,
    resource_id: str,
    details: Optional[str] = None
):
    """Create an audit log entry"""
    new_entry = {
        "id": f"audit-{len(MOCK_AUDIT_LOG) + 1:03d}",
        "timestamp": datetime.now().isoformat(),
        "user_email": "system@cabinet.fr",  # In real implementation, get from auth
        "user_name": "System",
        "action": action,
        "resource_type": resource_type,
        "resource_id": resource_id,
        "ip_address": "127.0.0.1",
        "details": details
    }
    MOCK_AUDIT_LOG.insert(0, new_entry)
    return {"success": True, "entry_id": new_entry["id"]}
