"""
Integrations Routes - Third-party services management
For IA Poste Manager institutional platform
"""
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime
from enum import Enum

router = APIRouter(prefix="/api/integrations", tags=["integrations"])


class IntegrationCategory(str, Enum):
    MESSAGING = "messaging"
    LEGAL = "legal"
    PRODUCTIVITY = "productivity"
    CLOUD = "cloud"


class IntegrationStatus(str, Enum):
    CONNECTED = "connected"
    DISCONNECTED = "disconnected"
    PENDING = "pending"
    ERROR = "error"


class Integration(BaseModel):
    id: str
    name: str
    description: str
    category: IntegrationCategory
    status: IntegrationStatus
    icon: Optional[str] = None
    last_sync: Optional[datetime] = None
    config: Dict[str, Any] = {}
    stats: Dict[str, Any] = {}


class IntegrationConfig(BaseModel):
    api_key: Optional[str] = None
    api_secret: Optional[str] = None
    webhook_url: Optional[str] = None
    settings: Dict[str, Any] = {}


class SyncResult(BaseModel):
    success: bool
    items_synced: int
    errors: List[str] = []
    timestamp: datetime


# Mock integrations data
MOCK_INTEGRATIONS = [
    # Messaging
    {
        "id": "outlook",
        "name": "Microsoft Outlook",
        "description": "Synchronisation emails professionnels",
        "category": "messaging",
        "status": "connected",
        "icon": "📧",
        "last_sync": "2026-01-26T09:30:00",
        "config": {
            "account": "cabinet@avocats.fr",
            "auto_sync": True,
            "sync_interval": 5
        },
        "stats": {
            "emails_synced_today": 45,
            "total_synced": 12500
        }
    },
    {
        "id": "teams",
        "name": "Microsoft Teams",
        "description": "Messages et notifications Teams",
        "category": "messaging",
        "status": "connected",
        "icon": "💬",
        "last_sync": "2026-01-26T09:45:00",
        "config": {
            "tenant_id": "cabinet-tenant",
            "channels": ["Général", "Dossiers urgents"]
        },
        "stats": {
            "messages_today": 23
        }
    },
    {
        "id": "whatsapp",
        "name": "WhatsApp Business",
        "description": "Communications clients WhatsApp",
        "category": "messaging",
        "status": "connected",
        "icon": "📱",
        "last_sync": "2026-01-26T09:50:00",
        "config": {
            "phone_number": "+33612345678",
            "business_name": "Cabinet Avocats"
        },
        "stats": {
            "messages_today": 12,
            "active_conversations": 8
        }
    },
    {
        "id": "twilio",
        "name": "Twilio SMS",
        "description": "Envoi et réception SMS",
        "category": "messaging",
        "status": "connected",
        "icon": "📲",
        "last_sync": "2026-01-26T09:55:00",
        "config": {
            "phone_number": "+33700000000"
        },
        "stats": {
            "sms_sent_today": 5,
            "sms_received_today": 3
        }
    },
    # Legal
    {
        "id": "rpva",
        "name": "RPVA / e-Barreau",
        "description": "Réseau privé virtuel des avocats",
        "category": "legal",
        "status": "connected",
        "icon": "⚖️",
        "last_sync": "2026-01-26T08:00:00",
        "config": {
            "bar_association": "Barreau de Paris",
            "certificate_valid": True,
            "certificate_expiry": "2027-03-15"
        },
        "stats": {
            "messages_today": 3,
            "pending_notifications": 2
        }
    },
    {
        "id": "lexisnexis",
        "name": "LexisNexis",
        "description": "Base de données juridique",
        "category": "legal",
        "status": "connected",
        "icon": "📚",
        "last_sync": "2026-01-25T18:00:00",
        "config": {
            "subscription": "Premium",
            "databases": ["Jurisprudence", "Doctrine", "Codes"]
        },
        "stats": {
            "searches_this_month": 145
        }
    },
    {
        "id": "dalloz",
        "name": "Dalloz",
        "description": "Documentation juridique Dalloz",
        "category": "legal",
        "status": "disconnected",
        "icon": "📖",
        "last_sync": None,
        "config": {},
        "stats": {}
    },
    {
        "id": "infogreffe",
        "name": "Infogreffe",
        "description": "Registre du commerce et des sociétés",
        "category": "legal",
        "status": "connected",
        "icon": "🏛️",
        "last_sync": "2026-01-26T07:00:00",
        "config": {
            "auto_monitoring": True,
            "monitored_companies": 25
        },
        "stats": {
            "alerts_this_month": 3
        }
    },
    # Productivity
    {
        "id": "docusign",
        "name": "DocuSign",
        "description": "Signature électronique",
        "category": "productivity",
        "status": "connected",
        "icon": "✍️",
        "last_sync": "2026-01-26T09:00:00",
        "config": {
            "account_type": "Business Pro"
        },
        "stats": {
            "documents_signed_this_month": 28,
            "pending_signatures": 5
        }
    },
    {
        "id": "calendly",
        "name": "Calendly",
        "description": "Prise de rendez-vous en ligne",
        "category": "productivity",
        "status": "connected",
        "icon": "📅",
        "last_sync": "2026-01-26T09:30:00",
        "config": {
            "booking_page": "cabinet-avocats",
            "default_duration": 30
        },
        "stats": {
            "appointments_this_week": 12
        }
    },
    # Cloud
    {
        "id": "onedrive",
        "name": "OneDrive / SharePoint",
        "description": "Stockage documents Microsoft 365",
        "category": "cloud",
        "status": "connected",
        "icon": "☁️",
        "last_sync": "2026-01-26T09:45:00",
        "config": {
            "root_folder": "/Cabinet/Dossiers",
            "auto_backup": True
        },
        "stats": {
            "storage_used_gb": 45.2,
            "files_synced": 8500
        }
    },
    {
        "id": "azure_blob",
        "name": "Azure Blob Storage",
        "description": "Archivage sécurisé Azure",
        "category": "cloud",
        "status": "connected",
        "icon": "🔐",
        "last_sync": "2026-01-26T06:00:00",
        "config": {
            "container": "archives-cabinet",
            "encryption": "AES-256"
        },
        "stats": {
            "archived_files": 15000,
            "storage_used_gb": 120.5
        }
    },
    {
        "id": "google_drive",
        "name": "Google Drive",
        "description": "Stockage Google Workspace",
        "category": "cloud",
        "status": "disconnected",
        "icon": "📁",
        "last_sync": None,
        "config": {},
        "stats": {}
    }
]


@router.get("/", response_model=List[Integration])
async def get_integrations(
    category: Optional[IntegrationCategory] = Query(None, description="Filter by category"),
    status: Optional[IntegrationStatus] = Query(None, description="Filter by status")
):
    """Get all integrations with optional filters"""
    integrations = MOCK_INTEGRATIONS.copy()

    if category:
        integrations = [i for i in integrations if i["category"] == category.value]
    if status:
        integrations = [i for i in integrations if i["status"] == status.value]

    return [
        Integration(
            **{
                **i,
                "last_sync": datetime.fromisoformat(i["last_sync"]) if i.get("last_sync") else None
            }
        ) for i in integrations
    ]


@router.get("/{integration_id}")
async def get_integration(integration_id: str):
    """Get single integration details"""
    for i in MOCK_INTEGRATIONS:
        if i["id"] == integration_id:
            return Integration(
                **{
                    **i,
                    "last_sync": datetime.fromisoformat(i["last_sync"]) if i.get("last_sync") else None
                }
            )
    raise HTTPException(status_code=404, detail="Integration not found")


@router.post("/{integration_id}/connect")
async def connect_integration(integration_id: str, config: IntegrationConfig):
    """Connect/configure an integration"""
    for i in MOCK_INTEGRATIONS:
        if i["id"] == integration_id:
            i["status"] = "connected"
            i["config"] = {**i.get("config", {}), **config.settings}
            i["last_sync"] = datetime.now().isoformat()
            return {
                "success": True,
                "message": f"Integration {i['name']} connected successfully",
                "status": "connected"
            }
    raise HTTPException(status_code=404, detail="Integration not found")


@router.post("/{integration_id}/disconnect")
async def disconnect_integration(integration_id: str):
    """Disconnect an integration"""
    for i in MOCK_INTEGRATIONS:
        if i["id"] == integration_id:
            i["status"] = "disconnected"
            return {
                "success": True,
                "message": f"Integration {i['name']} disconnected",
                "status": "disconnected"
            }
    raise HTTPException(status_code=404, detail="Integration not found")


@router.post("/{integration_id}/sync")
async def sync_integration(integration_id: str) -> SyncResult:
    """Trigger manual sync for an integration"""
    for i in MOCK_INTEGRATIONS:
        if i["id"] == integration_id:
            if i["status"] != "connected":
                raise HTTPException(status_code=400, detail="Integration not connected")

            # Simulate sync
            i["last_sync"] = datetime.now().isoformat()

            return SyncResult(
                success=True,
                items_synced=15,  # Mock value
                errors=[],
                timestamp=datetime.now()
            )
    raise HTTPException(status_code=404, detail="Integration not found")


@router.get("/{integration_id}/logs")
async def get_integration_logs(
    integration_id: str,
    limit: int = Query(50, ge=1, le=200)
):
    """Get sync logs for an integration"""
    # Check if integration exists
    found = False
    for i in MOCK_INTEGRATIONS:
        if i["id"] == integration_id:
            found = True
            break

    if not found:
        raise HTTPException(status_code=404, detail="Integration not found")

    # Mock logs
    return {
        "integration_id": integration_id,
        "logs": [
            {
                "timestamp": "2026-01-26T09:45:00",
                "level": "info",
                "message": "Synchronisation réussie",
                "items_synced": 12
            },
            {
                "timestamp": "2026-01-26T09:00:00",
                "level": "info",
                "message": "Synchronisation réussie",
                "items_synced": 8
            },
            {
                "timestamp": "2026-01-25T18:00:00",
                "level": "warning",
                "message": "Délai de réponse élevé",
                "items_synced": 15
            }
        ]
    }


@router.get("/stats/overview")
async def get_integrations_stats():
    """Get integrations statistics overview"""
    connected = len([i for i in MOCK_INTEGRATIONS if i["status"] == "connected"])
    total = len(MOCK_INTEGRATIONS)

    return {
        "total_integrations": total,
        "connected": connected,
        "disconnected": total - connected,
        "by_category": {
            "messaging": len([i for i in MOCK_INTEGRATIONS if i["category"] == "messaging"]),
            "legal": len([i for i in MOCK_INTEGRATIONS if i["category"] == "legal"]),
            "productivity": len([i for i in MOCK_INTEGRATIONS if i["category"] == "productivity"]),
            "cloud": len([i for i in MOCK_INTEGRATIONS if i["category"] == "cloud"])
        },
        "last_sync_errors": 0,
        "sync_health": "healthy"
    }


@router.get("/webhooks")
async def get_webhooks():
    """Get configured webhooks"""
    return {
        "webhooks": [
            {
                "id": "wh-001",
                "integration": "outlook",
                "event": "new_email",
                "url": "https://api.iapostemanager.com/webhooks/outlook",
                "status": "active",
                "last_triggered": "2026-01-26T09:30:00"
            },
            {
                "id": "wh-002",
                "integration": "rpva",
                "event": "new_notification",
                "url": "https://api.iapostemanager.com/webhooks/rpva",
                "status": "active",
                "last_triggered": "2026-01-26T08:00:00"
            },
            {
                "id": "wh-003",
                "integration": "docusign",
                "event": "document_signed",
                "url": "https://api.iapostemanager.com/webhooks/docusign",
                "status": "active",
                "last_triggered": "2026-01-25T16:30:00"
            }
        ]
    }
