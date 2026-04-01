"""
Routes Triage Assistant Priorisé - US12
Auto-catégorisation et scoring des dossiers entrants
Attribution intelligente aux juristes disponibles
"""
from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, Field
from typing import List, Optional, Dict
from datetime import datetime
import re

router = APIRouter(prefix="/api/triage", tags=["triage"])

# ---------------------------------------------------------------------------
# Constantes de scoring
# ---------------------------------------------------------------------------

# Mots-clés par catégorie (domaine juridique)
CATEGORY_KEYWORDS: Dict[str, List[str]] = {
    "droit_travail": [
        "licenciement", "rupture conventionnelle", "harcèlement", "prud'hommes",
        "salaire", "heures supplémentaires", "accident travail", "arrêt maladie",
        "préavis", "solde tout compte", "mutuelle", "congés",
    ],
    "droit_famille": [
        "divorce", "garde enfant", "pension alimentaire", "adoption",
        "succession", "héritage", "testament", "mariage", "séparation",
        "autorité parentale", "tutelle", "curatelle",
    ],
    "droit_immobilier": [
        "loyer", "bail", "expulsion", "propriétaire", "locataire", "travaux",
        "copropriété", "vente immobilière", "hypothèque", "syndicat",
        "état des lieux", "caution", "dépôt garantie",
    ],
    "droit_consommation": [
        "remboursement", "garantie", "vice caché", "arnaque", "fraude",
        "banque", "crédit", "surendettement", "assurance", "refus bancaire",
        "litige commercial", "contrat abusif",
    ],
    "droit_administratif": [
        "préfecture", "titre de séjour", "recours", "décision administrative",
        "fonctionnaire", "marché public", "permis", "autorisation", "subvention",
        "naturalisation", "expulsion",
    ],
    "urgence_judiciaire": [
        "assignation", "convocation", "huissier", "jugement", "tribunal",
        "audience", "délai", "prescription", "contrainte", "saisie",
        "référé", "appel",
    ],
}

# Niveau de priorité selon catégorie (base)
CATEGORY_BASE_PRIORITY: Dict[str, str] = {
    "urgence_judiciaire": "critical",
    "droit_travail": "high",
    "droit_famille": "high",
    "droit_immobilier": "normal",
    "droit_consommation": "normal",
    "droit_administratif": "normal",
    "autre": "low",
}

# Mots-clés qui élèvent la priorité d'un niveau
ESCALATION_KEYWORDS = [
    "urgent", "urgente", "urgence", "immédiat", "immédiatement",
    "délai imminent", "date limite", "demain", "aujourd'hui",
    "menace", "huissier", "assignation sous",
]

# Juristes disponibles (pool simulé — à remplacer par lecture DB en prod)
JURISTS_POOL: List[Dict] = [
    {"id": 1, "name": "Me. Sophie Durand", "specialties": ["droit_travail", "droit_famille"], "workload": 3},
    {"id": 2, "name": "Me. Thomas Bernard", "specialties": ["droit_immobilier", "droit_consommation"], "workload": 5},
    {"id": 3, "name": "Me. Amina Khelifa", "specialties": ["droit_administratif", "urgence_judiciaire"], "workload": 2},
    {"id": 4, "name": "Me. Lucas Petit", "specialties": ["droit_travail", "droit_consommation"], "workload": 4},
]

PRIORITY_ORDER = {"low": 0, "normal": 1, "high": 2, "critical": 3}

# ---------------------------------------------------------------------------
# Modèles Pydantic
# ---------------------------------------------------------------------------

class TriageRequest(BaseModel):
    """Payload d'analyse d'un dossier entrant"""
    title: str = Field(..., min_length=3, max_length=255, description="Titre du dossier")
    description: str = Field(..., min_length=10, max_length=5000, description="Description du problème")
    client_urgency_claim: Optional[bool] = Field(
        False, description="Le client a coché 'urgent'"
    )
    deadline: Optional[datetime] = Field(None, description="Echéance si connue")


class CategoryScore(BaseModel):
    """Score par catégorie juridique"""
    category: str
    score: int
    matched_keywords: List[str]


class JuristAssignment(BaseModel):
    """Assignation d'un juriste"""
    jurist_id: int
    jurist_name: str
    reason: str


class TriageResult(BaseModel):
    """Résultat complet du triage"""
    triage_id: str
    analyzed_at: datetime
    detected_category: str
    confidence: float
    priority: str
    priority_score: int
    justification: List[str]
    all_categories: List[CategoryScore]
    assigned_jurist: Optional[JuristAssignment]
    recommended_actions: List[str]
    estimated_delay_days: Optional[int]


# ---------------------------------------------------------------------------
# Logique de triage
# ---------------------------------------------------------------------------

def _normalize(text: str) -> str:
    """Minuscules + suppression des accents pour comparaison souple"""
    text = text.lower()
    replacements = {
        "é": "e", "è": "e", "ê": "e", "ë": "e",
        "à": "a", "â": "a", "ä": "a",
        "ù": "u", "û": "u", "ü": "u",
        "î": "i", "ï": "i",
        "ô": "o", "ö": "o",
        "ç": "c",
    }
    for src, dst in replacements.items():
        text = text.replace(src, dst)
    return text


def _score_categories(text: str) -> List[CategoryScore]:
    """Calcule un score de correspondance pour chaque catégorie"""
    normalized = _normalize(text)
    scores: List[CategoryScore] = []

    for category, keywords in CATEGORY_KEYWORDS.items():
        matched = []
        for kw in keywords:
            kw_norm = _normalize(kw)
            if re.search(r"\b" + re.escape(kw_norm) + r"\b", normalized):
                matched.append(kw)
        scores.append(CategoryScore(
            category=category,
            score=len(matched),
            matched_keywords=matched,
        ))

    scores.sort(key=lambda x: x.score, reverse=True)
    return scores


def _detect_escalation(text: str) -> bool:
    """Détecte les mots-clés d'escalade de priorité"""
    normalized = _normalize(text)
    return any(_normalize(kw) in normalized for kw in ESCALATION_KEYWORDS)


def _compute_priority(category: str, escalate: bool, deadline: Optional[datetime]) -> tuple[str, int]:
    """
    Retourne (priority_label, priority_score).
    Score: low=0, normal=1, high=2, critical=3
    """
    base = CATEGORY_BASE_PRIORITY.get(category, "low")
    score = PRIORITY_ORDER[base]

    if escalate:
        score = min(score + 1, 3)

    if deadline:
        delta = (deadline - datetime.utcnow()).days
        if delta <= 2:
            score = 3  # critical
        elif delta <= 7:
            score = max(score, 2)  # high

    labels = {v: k for k, v in PRIORITY_ORDER.items()}
    return labels[score], score


def _assign_jurist(category: str, priority: str) -> Optional[JuristAssignment]:
    """
    Sélectionne le juriste le plus approprié :
    1. Priorité aux juristes spécialisés dans la catégorie
    2. Parmi eux, le moins chargé
    3. Si aucun spécialiste, prend le juriste global le moins chargé
    """
    specialists = [j for j in JURISTS_POOL if category in j["specialties"]]
    candidates = specialists if specialists else JURISTS_POOL

    if not candidates:
        return None

    best = min(candidates, key=lambda j: j["workload"])

    reason = (
        f"Spécialiste {category}" if best in specialists else "Juriste généraliste disponible"
    )
    return JuristAssignment(
        jurist_id=best["id"],
        jurist_name=best["name"],
        reason=reason,
    )


def _recommended_actions(priority: str, category: str, deadline: Optional[datetime]) -> List[str]:
    actions = []

    if priority == "critical":
        actions.append("Contactez le client dans les 2 heures")
        actions.append("Vérifier la date d'audience ou d'assignation")
    elif priority == "high":
        actions.append("Rappeler le client sous 24 h")
    else:
        actions.append("Répondre au client sous 48-72 h")

    if category == "urgence_judiciaire":
        actions.append("Demander immédiatement les actes de procédure")
    elif category == "droit_travail":
        actions.append("Vérifier l'existence d'une rupture conventionnelle ou licenciement")
    elif category == "droit_famille":
        actions.append("Recueillir les actes d'état civil")
    elif category == "droit_immobilier":
        actions.append("Demander le bail et les dernières quittances")
    elif category == "droit_administratif":
        actions.append("Vérifier la date de la décision administrative (délais de recours)")

    if deadline:
        delta = (deadline - datetime.utcnow()).days
        if delta > 0:
            actions.append(f"Echéance dans {delta} jour(s) — planifier en priorité")

    return actions


def _estimate_delay(category: str, priority: str) -> int:
    """Délai de traitement estimé en jours ouvrés"""
    base = {"critical": 1, "high": 3, "normal": 7, "low": 14}
    extra = {
        "urgence_judiciaire": 0,
        "droit_travail": 0,
        "droit_famille": 2,
        "droit_immobilier": 3,
        "droit_consommation": 5,
        "droit_administratif": 7,
        "autre": 10,
    }
    return base.get(priority, 7) + extra.get(category, 0)


def _build_justification(
    all_scores: List[CategoryScore],
    escalate: bool,
    deadline: Optional[datetime],
    client_urgency: bool,
) -> List[str]:
    justification = []
    top = all_scores[0] if all_scores else None

    if top and top.score > 0:
        justification.append(
            f"Catégorie détectée '{top.category}' — {top.score} mot(s) clé(s) : "
            + ", ".join(top.matched_keywords[:5])
        )
    else:
        justification.append("Aucune catégorie précise détectée — classification générique")

    if escalate:
        justification.append("Mots-clés d'urgence présents dans le texte")

    if client_urgency:
        justification.append("Client a indiqué une urgence explicite")

    if deadline:
        delta = (deadline - datetime.utcnow()).days
        justification.append(f"Echéance fournie dans {delta} jour(s)")

    return justification


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@router.post("/analyze", response_model=TriageResult, status_code=status.HTTP_200_OK)
async def analyze_case(request: TriageRequest) -> TriageResult:
    """
    US12 — Analyse et priorise automatiquement un dossier entrant.

    - Détecte la catégorie juridique (scoring par mots-clés)
    - Calcule la priorité (base catégorie + escalade + deadline)
    - Assigne un juriste disponible
    - Retourne un plan d'action recommandé
    """
    full_text = f"{request.title} {request.description}"

    # 1. Scoring des catégories
    all_scores = _score_categories(full_text)
    top_score = all_scores[0] if all_scores else None

    if top_score and top_score.score > 0:
        detected_category = top_score.category
        # Confidence = score normalisé, plafonné à 1.0
        max_possible = len(CATEGORY_KEYWORDS.get(detected_category, []))
        confidence = round(min(top_score.score / max(max_possible, 1), 1.0), 2)
    else:
        detected_category = "autre"
        confidence = 0.0

    # 2. Escalade et priorité
    escalate = _detect_escalation(full_text) or bool(request.client_urgency_claim)
    priority, priority_score = _compute_priority(detected_category, escalate, request.deadline)

    # 3. Assignation juriste
    assigned = _assign_jurist(detected_category, priority)

    # 4. Actions & délai
    actions = _recommended_actions(priority, detected_category, request.deadline)
    delay = _estimate_delay(detected_category, priority)

    # 5. Justification
    justification = _build_justification(
        all_scores,
        escalate,
        request.deadline,
        bool(request.client_urgency_claim),
    )

    import uuid as _uuid
    triage_id = str(_uuid.uuid4())

    return TriageResult(
        triage_id=triage_id,
        analyzed_at=datetime.utcnow(),
        detected_category=detected_category,
        confidence=confidence,
        priority=priority,
        priority_score=priority_score,
        justification=justification,
        all_categories=all_scores,
        assigned_jurist=assigned,
        recommended_actions=actions,
        estimated_delay_days=delay,
    )


@router.get("/categories", status_code=status.HTTP_200_OK)
async def list_categories():
    """Retourne les catégories juridiques supportées et leurs mots-clés"""
    return {
        "categories": [
            {
                "id": cat,
                "label": cat.replace("_", " ").title(),
                "base_priority": CATEGORY_BASE_PRIORITY.get(cat, "low"),
                "keywords_count": len(kws),
            }
            for cat, kws in CATEGORY_KEYWORDS.items()
        ]
    }


@router.get("/jurists", status_code=status.HTTP_200_OK)
async def list_jurists():
    """Retourne la liste des juristes disponibles (pool simulé)"""
    return {
        "jurists": [
            {
                "id": j["id"],
                "name": j["name"],
                "specialties": j["specialties"],
                "current_workload": j["workload"],
            }
            for j in JURISTS_POOL
        ]
    }
