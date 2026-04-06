"""
MemoLib AI - API FastAPI pour l'analyse juridique
Endpoints: upload de documents, analyse, extraction de clauses, classification
"""

import io
import os
import re
import uuid
from datetime import datetime
from typing import Optional

from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI(
    title="MemoLib AI - API Juridique",
    version="1.0.0",
    description=(
        "API d'analyse de documents juridiques : contrats, jugements, "
        "extraction de clauses et classification d'affaires."
    ),
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Modèles Pydantic
# ---------------------------------------------------------------------------

class HealthResponse(BaseModel):
    status: str
    service: str
    version: str
    timestamp: str


class ClauseItem(BaseModel):
    type: str
    text: str
    confidence: float


class AnalysisResponse(BaseModel):
    document_id: str
    filename: str
    document_type: str
    clauses: list[ClauseItem]
    summary: str
    classification: str
    word_count: int
    analyzed_at: str


class ClassificationResponse(BaseModel):
    document_id: str
    classification: str
    confidence: float
    sub_categories: list[str]


# ---------------------------------------------------------------------------
# Logique d'analyse (heuristiques légères, sans dépendance IA externe)
# ---------------------------------------------------------------------------

CLAUSE_PATTERNS = {
    "obligation": [
        r"(?i)(doit|devra|est tenu[e]? de|s'engage à|obligation de)[^.]{5,120}",
    ],
    "pénalité": [
        r"(?i)(pénalité|pénalités|amende|sanction|dommages[- ]intérêts)[^.]{5,120}",
    ],
    "délai": [
        r"(?i)(dans un délai de|avant le|au plus tard le|sous \d+)[^.]{5,120}",
        r"(?i)(\d+ (jours?|mois|semaines?|ans?))[^.]{5,80}",
    ],
    "résiliation": [
        r"(?i)(résili(ation|er|é)|rupture du contrat|fin du contrat|résolution)[^.]{5,120}",
    ],
    "confidentialité": [
        r"(?i)(confidentialité|confidentiel|secret professionnel|ne pas divulguer)[^.]{5,120}",
    ],
    "juridiction": [
        r"(?i)(tribunal|juridiction compétente|loi applicable|droit français)[^.]{5,120}",
    ],
}

DOCUMENT_KEYWORDS = {
    "Contrat": ["contrat", "accord", "convention", "signataire", "parties", "clause"],
    "Jugement": ["jugement", "arrêt", "décision", "tribunal", "condamné", "relaxé"],
    "Plainte": ["plainte", "victime", "infraction", "dépôt de plainte"],
    "Acte notarié": ["notaire", "acte authentique", "étude notariale"],
    "Mise en demeure": ["mise en demeure", "sommation", "injonction"],
    "Testament": ["testament", "légataire", "héritier", "succession"],
}


def detect_document_type(text: str) -> str:
    """Détecte le type de document juridique à partir du contenu."""
    text_lower = text.lower()
    scores: dict[str, int] = {}
    for doc_type, keywords in DOCUMENT_KEYWORDS.items():
        scores[doc_type] = sum(1 for kw in keywords if kw in text_lower)
    best = max(scores, key=lambda k: scores[k])
    return best if scores[best] > 0 else "Document juridique"


def extract_clauses(text: str) -> list[ClauseItem]:
    """Extrait les clauses importantes du texte juridique."""
    clauses: list[ClauseItem] = []
    for clause_type, patterns in CLAUSE_PATTERNS.items():
        for pattern in patterns:
            for match in re.finditer(pattern, text):
                snippet = match.group(0).strip()[:200]
                clauses.append(
                    ClauseItem(
                        type=clause_type,
                        text=snippet,
                        confidence=round(0.70 + 0.05 * len(snippet) / 200, 2),
                    )
                )
    # Déduplique les clauses très proches
    seen: set[str] = set()
    unique: list[ClauseItem] = []
    for clause in clauses:
        key = clause.type + clause.text[:40]
        if key not in seen:
            seen.add(key)
            unique.append(clause)
    return unique[:20]


def classify_document(text: str, doc_type: str) -> tuple[str, float, list[str]]:
    """Classifie le document et retourne la catégorie principale + sous-catégories."""
    text_lower = text.lower()

    domain_keywords = {
        "Droit commercial": ["société", "commerce", "entreprise", "bail commercial", "fonds de commerce"],
        "Droit du travail": ["salarié", "employeur", "licenciement", "contrat de travail", "cdi", "cdd"],
        "Droit de la famille": ["divorce", "garde", "pension alimentaire", "mariage", "filiation"],
        "Droit immobilier": ["immeuble", "bail", "loyer", "hypothèque", "propriétaire"],
        "Droit pénal": ["infraction", "délit", "crime", "condamné", "acquitté", "peine"],
        "Droit administratif": ["administration", "préfecture", "autorisation", "recours", "état"],
    }

    sub_categories: list[str] = []
    scores: dict[str, int] = {}
    for domain, keywords in domain_keywords.items():
        count = sum(1 for kw in keywords if kw in text_lower)
        scores[domain] = count
        if count > 0:
            sub_categories.append(domain)

    best_domain = max(scores, key=lambda k: scores[k])
    max_score = scores[best_domain]
    confidence = min(0.95, 0.50 + max_score * 0.08) if max_score > 0 else 0.40

    return best_domain if max_score > 0 else "Non classifié", round(confidence, 2), sub_categories


def generate_summary(text: str, doc_type: str, clauses: list[ClauseItem]) -> str:
    """Génère un résumé structuré du document."""
    word_count = len(text.split())
    clause_types = list({c.type for c in clauses})
    clause_summary = (
        f"Clauses identifiées : {', '.join(clause_types)}." if clause_types else "Aucune clause spécifique détectée."
    )
    return (
        f"Document de type '{doc_type}' contenant {word_count} mots. "
        f"{clause_summary} "
        f"Analyse réalisée le {datetime.now().strftime('%d/%m/%Y à %H:%M')}."
    )


def read_text_from_upload(content: bytes, filename: str) -> str:
    """Extrait le texte brut depuis le contenu uploadé."""
    if filename.lower().endswith(".pdf"):
        try:
            import pypdf

            reader = pypdf.PdfReader(io.BytesIO(content))
            return "\n".join(page.extract_text() or "" for page in reader.pages)
        except ImportError:
            # pypdf non disponible : on tente un décodage basique
            pass
        except Exception:
            pass

    # Fichiers texte (txt, md, etc.) ou fallback PDF
    for encoding in ("utf-8", "latin-1", "cp1252"):
        try:
            return content.decode(encoding)
        except UnicodeDecodeError:
            continue

    return content.decode("utf-8", errors="replace")


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------


@app.get("/health", response_model=HealthResponse, summary="Statut de l'API")
async def health() -> HealthResponse:
    return HealthResponse(
        status="healthy",
        service="MemoLib AI - API Juridique",
        version="1.0.0",
        timestamp=datetime.now().isoformat(),
    )


@app.post(
    "/analyze",
    response_model=AnalysisResponse,
    summary="Analyse complète d'un document juridique",
    description=(
        "Upload un fichier PDF ou texte et retourne : type de document, "
        "clauses extraites, classification et résumé."
    ),
)
async def analyze_document(file: UploadFile = File(...)) -> AnalysisResponse:
    allowed_types = {
        "application/pdf",
        "text/plain",
        "text/markdown",
        "application/octet-stream",
    }
    if file.content_type and file.content_type not in allowed_types:
        # Accept anything ending in .pdf or .txt regardless of MIME
        name = file.filename or ""
        if not (name.endswith(".pdf") or name.endswith(".txt") or name.endswith(".md")):
            raise HTTPException(
                status_code=400,
                detail="Format non supporté. Utilisez PDF ou texte (.txt, .md).",
            )

    content = await file.read()
    if len(content) > 10 * 1024 * 1024:  # 10 MB limit
        raise HTTPException(status_code=413, detail="Fichier trop volumineux (max 10 Mo).")

    text = read_text_from_upload(content, file.filename or "")
    if not text.strip():
        raise HTTPException(status_code=422, detail="Impossible d'extraire le texte du document.")

    doc_type = detect_document_type(text)
    clauses = extract_clauses(text)
    classification, _, _ = classify_document(text, doc_type)
    summary = generate_summary(text, doc_type, clauses)

    return AnalysisResponse(
        document_id=str(uuid.uuid4()),
        filename=file.filename or "document",
        document_type=doc_type,
        clauses=clauses,
        summary=summary,
        classification=classification,
        word_count=len(text.split()),
        analyzed_at=datetime.now().isoformat(),
    )


@app.post(
    "/extract-clauses",
    summary="Extraction de clauses d'un contrat",
    description="Extrait uniquement les clauses importantes d'un document juridique.",
)
async def extract_clauses_endpoint(
    file: UploadFile = File(...),
) -> dict:
    content = await file.read()
    text = read_text_from_upload(content, file.filename or "")
    if not text.strip():
        raise HTTPException(status_code=422, detail="Impossible d'extraire le texte du document.")

    clauses = extract_clauses(text)
    return {
        "document_id": str(uuid.uuid4()),
        "filename": file.filename,
        "clauses_count": len(clauses),
        "clauses": [c.model_dump() for c in clauses],
        "extracted_at": datetime.now().isoformat(),
    }


@app.post(
    "/classify",
    response_model=ClassificationResponse,
    summary="Classification d'un document juridique",
    description="Détermine le domaine juridique principal du document.",
)
async def classify_document_endpoint(
    file: UploadFile = File(...),
) -> ClassificationResponse:
    content = await file.read()
    text = read_text_from_upload(content, file.filename or "")
    if not text.strip():
        raise HTTPException(status_code=422, detail="Impossible d'extraire le texte du document.")

    doc_type = detect_document_type(text)
    classification, confidence, sub_categories = classify_document(text, doc_type)

    return ClassificationResponse(
        document_id=str(uuid.uuid4()),
        classification=classification,
        confidence=confidence,
        sub_categories=sub_categories,
    )
