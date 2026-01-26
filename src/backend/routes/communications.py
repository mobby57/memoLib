"""
Communications Routes - Unified Inbox (Email, WhatsApp, SMS)
For IA Poste Manager institutional platform
"""
from fastapi import APIRouter, HTTPException, Depends, Query
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
from enum import Enum

router = APIRouter(prefix="/api/communications", tags=["communications"])


class ChannelType(str, Enum):
    EMAIL = "email"
    WHATSAPP = "whatsapp"
    SMS = "sms"
    ALL = "all"


class PriorityLevel(str, Enum):
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"


class MessageStatus(str, Enum):
    UNREAD = "unread"
    READ = "read"
    ARCHIVED = "archived"
    CLASSIFIED = "classified"


class Message(BaseModel):
    id: str
    channel: ChannelType
    sender: str
    sender_name: Optional[str] = None
    subject: Optional[str] = None
    preview: str
    content: str
    timestamp: datetime
    priority: PriorityLevel
    status: MessageStatus
    folder_id: Optional[str] = None
    folder_name: Optional[str] = None
    has_attachments: bool = False
    attachments: Optional[List[dict]] = None
    ai_summary: Optional[str] = None
    ai_classification: Optional[str] = None
    ai_suggested_actions: Optional[List[str]] = None


class MessageListResponse(BaseModel):
    messages: List[Message]
    total: int
    page: int
    per_page: int
    channels_count: dict


class AIAnalysisResponse(BaseModel):
    summary: str
    classification: str
    priority: PriorityLevel
    suggested_folder: Optional[str] = None
    key_dates: List[str] = []
    entities: List[str] = []
    suggested_actions: List[str] = []


# Mock data for demonstration
MOCK_MESSAGES = [
    {
        "id": "msg-001",
        "channel": "email",
        "sender": "tribunal.paris@justice.fr",
        "sender_name": "Tribunal de Paris",
        "subject": "Convocation audience 15/02/2026",
        "preview": "Vous êtes convoqué à l'audience du 15 février 2026 à 14h00...",
        "content": "Madame, Monsieur,\n\nVous êtes convoqué à l'audience du 15 février 2026 à 14h00 au Tribunal de Paris, Chambre 4-1.\n\nDossier: 2026/001234\nAffaire: LEFEBVRE c/ MARTIN\n\nVeuillez vous présenter muni de cette convocation.\n\nLe Greffier",
        "timestamp": "2026-01-26T09:30:00",
        "priority": "high",
        "status": "unread",
        "folder_id": "folder-001",
        "folder_name": "Procédures",
        "has_attachments": True,
        "attachments": [{"name": "convocation.pdf", "size": 125000}],
        "ai_summary": "Convocation audience TGI Paris - Affaire LEFEBVRE c/ MARTIN - 15/02/2026 14h00",
        "ai_classification": "Procédure judiciaire",
        "ai_suggested_actions": ["Ajouter au calendrier", "Préparer dossier", "Confirmer présence"]
    },
    {
        "id": "msg-002",
        "channel": "whatsapp",
        "sender": "+33612345678",
        "sender_name": "Me. Sophie Durand",
        "subject": None,
        "preview": "Bonjour, avez-vous reçu les conclusions adverses ?",
        "content": "Bonjour,\n\nAvez-vous reçu les conclusions adverses pour le dossier Martin ?\n\nJe dois finaliser ma réponse avant vendredi.\n\nCordialement,\nMe. Durand",
        "timestamp": "2026-01-26T08:45:00",
        "priority": "medium",
        "status": "unread",
        "folder_id": None,
        "folder_name": None,
        "has_attachments": False,
        "ai_summary": "Demande conclusions adverses - Dossier Martin - Délai vendredi",
        "ai_classification": "Correspondance confrère",
        "ai_suggested_actions": ["Vérifier dossier Martin", "Répondre sous 24h"]
    },
    {
        "id": "msg-003",
        "channel": "email",
        "sender": "client.martin@email.com",
        "sender_name": "Jean Martin",
        "subject": "RE: Point sur mon dossier",
        "preview": "Maître, je souhaiterais faire un point sur l'avancement de mon dossier...",
        "content": "Maître,\n\nJe souhaiterais faire un point sur l'avancement de mon dossier.\n\nQuand serait-il possible de convenir d'un rendez-vous ?\n\nCordialement,\nJean Martin",
        "timestamp": "2026-01-26T07:20:00",
        "priority": "low",
        "status": "read",
        "folder_id": "folder-002",
        "folder_name": "Clients - Martin",
        "has_attachments": False,
        "ai_summary": "Demande RDV client Martin - Point dossier",
        "ai_classification": "Relation client",
        "ai_suggested_actions": ["Proposer créneaux RDV", "Préparer synthèse dossier"]
    },
    {
        "id": "msg-004",
        "channel": "sms",
        "sender": "+33698765432",
        "sender_name": None,
        "subject": None,
        "preview": "RDV confirmé pour demain 10h. Cordialement.",
        "content": "RDV confirmé pour demain 10h. Cordialement.",
        "timestamp": "2026-01-25T16:30:00",
        "priority": "low",
        "status": "classified",
        "folder_id": "folder-003",
        "folder_name": "Rendez-vous",
        "has_attachments": False,
        "ai_summary": "Confirmation RDV demain 10h",
        "ai_classification": "Agenda",
        "ai_suggested_actions": ["Vérifier calendrier"]
    },
    {
        "id": "msg-005",
        "channel": "email",
        "sender": "greffe.tribunal@justice.fr",
        "sender_name": "Greffe TGI",
        "subject": "URGENT - Délai de réponse 48h",
        "preview": "Vous disposez de 48h pour déposer vos conclusions en réponse...",
        "content": "Maître,\n\nSuite à la communication des pièces adverses du 24/01/2026, vous disposez de 48h pour déposer vos conclusions en réponse.\n\nPassé ce délai, l'affaire sera mise en délibéré.\n\nLe Greffe",
        "timestamp": "2026-01-26T06:00:00",
        "priority": "high",
        "status": "unread",
        "folder_id": "folder-001",
        "folder_name": "Procédures",
        "has_attachments": True,
        "attachments": [{"name": "pieces_adverses.pdf", "size": 2500000}],
        "ai_summary": "⚠️ URGENT - Délai 48h conclusions - Affaire en délibéré si non-réponse",
        "ai_classification": "Délai procédure",
        "ai_suggested_actions": ["Traiter immédiatement", "Rédiger conclusions", "Déposer RPVA"]
    }
]


@router.get("/messages", response_model=MessageListResponse)
async def get_messages(
    channel: ChannelType = Query(ChannelType.ALL, description="Filter by channel"),
    status: Optional[MessageStatus] = Query(None, description="Filter by status"),
    priority: Optional[PriorityLevel] = Query(None, description="Filter by priority"),
    folder_id: Optional[str] = Query(None, description="Filter by folder"),
    search: Optional[str] = Query(None, description="Search query"),
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100)
):
    """Get messages with filters"""
    messages = MOCK_MESSAGES.copy()

    # Apply filters
    if channel != ChannelType.ALL:
        messages = [m for m in messages if m["channel"] == channel.value]

    if status:
        messages = [m for m in messages if m["status"] == status.value]

    if priority:
        messages = [m for m in messages if m["priority"] == priority.value]

    if folder_id:
        messages = [m for m in messages if m.get("folder_id") == folder_id]

    if search:
        search_lower = search.lower()
        messages = [m for m in messages if
            search_lower in m.get("subject", "").lower() or
            search_lower in m.get("preview", "").lower() or
            search_lower in m.get("sender", "").lower() or
            search_lower in m.get("sender_name", "").lower()
        ]

    # Count by channel
    channels_count = {
        "email": len([m for m in MOCK_MESSAGES if m["channel"] == "email"]),
        "whatsapp": len([m for m in MOCK_MESSAGES if m["channel"] == "whatsapp"]),
        "sms": len([m for m in MOCK_MESSAGES if m["channel"] == "sms"])
    }

    # Pagination
    total = len(messages)
    start = (page - 1) * per_page
    end = start + per_page
    paginated_messages = messages[start:end]

    # Convert to Message objects
    message_objects = [
        Message(
            **{**m, "timestamp": datetime.fromisoformat(m["timestamp"])}
        ) for m in paginated_messages
    ]

    return MessageListResponse(
        messages=message_objects,
        total=total,
        page=page,
        per_page=per_page,
        channels_count=channels_count
    )


@router.get("/messages/{message_id}")
async def get_message(message_id: str):
    """Get single message by ID"""
    for m in MOCK_MESSAGES:
        if m["id"] == message_id:
            return Message(**{**m, "timestamp": datetime.fromisoformat(m["timestamp"])})
    raise HTTPException(status_code=404, detail="Message not found")


@router.post("/messages/{message_id}/classify")
async def classify_message(message_id: str, folder_id: str):
    """Classify message to a folder"""
    for m in MOCK_MESSAGES:
        if m["id"] == message_id:
            m["folder_id"] = folder_id
            m["status"] = "classified"
            return {"success": True, "message": "Message classified"}
    raise HTTPException(status_code=404, detail="Message not found")


@router.post("/messages/{message_id}/analyze")
async def analyze_message(message_id: str) -> AIAnalysisResponse:
    """AI analysis of a message"""
    for m in MOCK_MESSAGES:
        if m["id"] == message_id:
            return AIAnalysisResponse(
                summary=m.get("ai_summary", "Analyse en cours..."),
                classification=m.get("ai_classification", "Non classifié"),
                priority=PriorityLevel(m.get("priority", "low")),
                suggested_folder=m.get("folder_name"),
                key_dates=["15/02/2026", "28/01/2026"] if "délai" in m.get("subject", "").lower() else [],
                entities=["Tribunal de Paris", "Me. Durand"] if "tribunal" in m.get("sender", "").lower() else [],
                suggested_actions=m.get("ai_suggested_actions", [])
            )
    raise HTTPException(status_code=404, detail="Message not found")


@router.get("/stats")
async def get_communications_stats():
    """Get communication statistics"""
    return {
        "total_messages": len(MOCK_MESSAGES),
        "unread": len([m for m in MOCK_MESSAGES if m["status"] == "unread"]),
        "pending_classification": len([m for m in MOCK_MESSAGES if not m.get("folder_id")]),
        "high_priority": len([m for m in MOCK_MESSAGES if m["priority"] == "high"]),
        "by_channel": {
            "email": len([m for m in MOCK_MESSAGES if m["channel"] == "email"]),
            "whatsapp": len([m for m in MOCK_MESSAGES if m["channel"] == "whatsapp"]),
            "sms": len([m for m in MOCK_MESSAGES if m["channel"] == "sms"])
        },
        "today_received": 5,
        "week_trend": "+12%"
    }
