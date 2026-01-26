"""
AI Analysis endpoints - NLP, entity extraction, classification
"""

from datetime import datetime
from enum import Enum
from typing import Any, Dict, List, Optional

import structlog
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

router = APIRouter()
logger = structlog.get_logger()


class UrgencyLevel(str, Enum):
    """Urgency classification levels"""

    CRITICAL = "critical"
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"


class DocumentCategory(str, Enum):
    """Document type categories"""

    LEGAL_BRIEF = "legal_brief"
    CONTRACT = "contract"
    COURT_DECISION = "court_decision"
    CORRESPONDENCE = "correspondence"
    INVOICE = "invoice"
    ADMINISTRATIVE = "administrative"
    OTHER = "other"


class AnalysisRequest(BaseModel):
    """Request for text analysis"""

    text: str = Field(..., min_length=1, max_length=50000)
    analyze_entities: bool = True
    analyze_urgency: bool = True
    analyze_sentiment: bool = False
    language: str = "fr"


class Entity(BaseModel):
    """Extracted entity"""

    text: str
    type: str  # PERSON, ORG, DATE, MONEY, etc.
    start: int
    end: int
    confidence: float


class AnalysisResponse(BaseModel):
    """Response with analysis results"""

    id: str
    summary: str
    category: DocumentCategory
    urgency: UrgencyLevel
    entities: List[Entity] = []
    key_dates: List[Dict[str, Any]] = []
    key_amounts: List[Dict[str, Any]] = []
    sentiment: Optional[Dict[str, float]] = None
    suggested_actions: List[str] = []
    processing_time_ms: int
    timestamp: datetime = Field(default_factory=datetime.utcnow)


class SummarizeRequest(BaseModel):
    """Request for text summarization"""

    text: str = Field(..., min_length=100, max_length=100000)
    max_length: int = Field(default=500, ge=50, le=2000)
    style: str = Field(default="professional", pattern="^(professional|simple|bullet)$")


class SummarizeResponse(BaseModel):
    """Response with summary"""

    summary: str
    original_length: int
    summary_length: int
    compression_ratio: float
    key_points: List[str] = []


@router.post("/analyze", response_model=AnalysisResponse)
async def analyze_text(request: AnalysisRequest) -> AnalysisResponse:
    """
    Analyze text content for entities, urgency, and classification

    Uses NLP to extract:
    - Named entities (persons, organizations, dates, amounts)
    - Document category
    - Urgency level
    - Suggested actions
    """
    import time
    import uuid

    start_time = time.time()

    logger.info(
        "analysis_started",
        text_length=len(request.text),
        language=request.language,
    )

    # TODO: Implement actual NLP analysis with spaCy/OpenAI
    # For now, return structured mock response

    entities = []
    if request.analyze_entities:
        entities = _extract_entities_mock(request.text)

    urgency = UrgencyLevel.MEDIUM
    if request.analyze_urgency:
        urgency = _classify_urgency_mock(request.text)

    processing_time = int((time.time() - start_time) * 1000)

    return AnalysisResponse(
        id=str(uuid.uuid4()),
        summary=request.text[:200] + "..." if len(request.text) > 200 else request.text,
        category=DocumentCategory.CORRESPONDENCE,
        urgency=urgency,
        entities=entities,
        key_dates=[],
        key_amounts=[],
        suggested_actions=["Répondre sous 48h", "Transférer au dossier concerné"],
        processing_time_ms=processing_time,
    )


@router.post("/summarize", response_model=SummarizeResponse)
async def summarize_text(request: SummarizeRequest) -> SummarizeResponse:
    """
    Generate a summary of the provided text

    Uses AI to create concise summaries in different styles
    """
    logger.info(
        "summarization_started",
        text_length=len(request.text),
        max_length=request.max_length,
        style=request.style,
    )

    # TODO: Implement actual summarization with OpenAI
    # Mock response for now
    summary = request.text[: request.max_length]

    return SummarizeResponse(
        summary=summary,
        original_length=len(request.text),
        summary_length=len(summary),
        compression_ratio=len(summary) / len(request.text),
        key_points=["Point clé 1", "Point clé 2", "Point clé 3"],
    )


@router.post("/classify")
async def classify_document(text: str) -> Dict[str, Any]:
    """Classify document type and category"""
    return {
        "category": DocumentCategory.CORRESPONDENCE.value,
        "confidence": 0.87,
        "subcategories": ["legal", "client_communication"],
    }


def _extract_entities_mock(text: str) -> List[Entity]:
    """Mock entity extraction"""
    # In production, use spaCy or OpenAI
    return [
        Entity(text="Cabinet Martin", type="ORG", start=0, end=15, confidence=0.95),
        Entity(text="15 janvier 2026", type="DATE", start=50, end=65, confidence=0.98),
    ]


def _classify_urgency_mock(text: str) -> UrgencyLevel:
    """Mock urgency classification"""
    urgent_keywords = ["urgent", "immédiat", "délai", "expiration", "impératif"]
    text_lower = text.lower()

    if any(kw in text_lower for kw in urgent_keywords):
        return UrgencyLevel.HIGH
    return UrgencyLevel.MEDIUM
