"""
Models pour IAPosteManager v4.0
Architecture MCP + Ollama
"""
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, EmailStr, Field
from enum import Enum


# ==================== ENUMS ====================

class DocumentType(str, Enum):
    COURRIER_OFFICIEL = "courrier_officiel"
    FACTURE = "facture"
    NOTIFICATION = "notification"
    AUTRE = "autre"


class StatutDossier(str, Enum):
    NOUVEAU = "nouveau"
    EN_ANALYSE = "en_analyse"
    EMAIL_GENERE = "email_genere"
    EN_ATTENTE_VALIDATION = "en_attente_validation"
    VALIDE = "valide"
    ENVOYE = "envoye"
    CLOTURE = "cloture"


class Urgence(int, Enum):
    TRES_FAIBLE = 1
    FAIBLE = 2
    NORMALE = 3
    IMPORTANTE = 4
    CRITIQUE = 5


class ActionType(str, Enum):
    UPLOAD_DOCUMENT = "upload_document"
    TRANSCRIPTION_AUDIO = "transcription_audio"
    ANALYSE_DOCUMENT = "analyse_document"
    GENERATION_EMAIL = "generation_email"
    VALIDATION_EMAIL = "validation_email"
    ENVOI_EMAIL = "envoi_email"
    RECEPTION_EMAIL = "reception_email"


# ==================== USER ====================

class UserBase(BaseModel):
    email: EmailStr
    prenom: str
    nom: str


class UserCreate(UserBase):
    password: str


class User(UserBase):
    id: int
    email_auto: str  # prenom.nom@tonapp.ai
    created_at: datetime
    is_active: bool = True

    class Config:
        from_attributes = True


# ==================== DOCUMENT ====================

class DocumentBase(BaseModel):
    nom_fichier: str
    type_mime: str


class DocumentCreate(DocumentBase):
    fichier_path: str


class Document(DocumentBase):
    id: int
    user_id: int
    fichier_path: str
    texte_extrait: Optional[str] = None
    date_upload: datetime

    class Config:
        from_attributes = True


# ==================== ANALYSE ====================

class AnalyseDocument(BaseModel):
    """Résultat de l'analyse par MCP_AGENT_ANALYSE"""
    type_document: DocumentType
    organisme: str
    sujet: str
    date_limite: Optional[datetime] = None
    urgence: Urgence
    actions_requises: List[str]
    montant: Optional[float] = None
    confiance: float = Field(ge=0.0, le=1.0)  # Score 0-1


class AnalyseComplete(BaseModel):
    document_id: int
    analyse: AnalyseDocument
    explication_ia: str
    timestamp: datetime


# ==================== EMAIL ====================

class EmailProposition(BaseModel):
    """Une proposition d'email générée par l'IA"""
    variante: str  # "formel", "standard", "simple"
    sujet: str
    corps: str
    destinataire: EmailStr
    explication: str


class EmailGenere(BaseModel):
    """3 propositions d'emails"""
    propositions: List[EmailProposition]
    document_id: int
    analyse_id: int
    timestamp: datetime


class EmailValidation(BaseModel):
    """Validation humaine obligatoire"""
    email_id: int
    proposition_choisie: str  # "formel", "standard", "simple"
    modifications: Optional[str] = None
    validateur_id: int
    timestamp: datetime
    signature: str  # Hash de validation


class EmailEnvoye(BaseModel):
    """Email effectivement envoyé"""
    id: int
    dossier_id: int
    sujet: str
    corps: str
    destinataire: EmailStr
    expediteur: str  # prenom.nom@tonapp.ai
    date_envoi: datetime
    message_id: str  # ID SMTP
    statut: str  # "envoyé", "erreur", "bounced"


# ==================== DOSSIER ====================

class DossierBase(BaseModel):
    user_id: int
    type_document: DocumentType
    organisme: str
    urgent: bool = False


class DossierCreate(DossierBase):
    pass


class Dossier(DossierBase):
    id: int
    statut: StatutDossier
    date_creation: datetime
    date_modification: datetime
    documents: List[Document] = []
    emails: List[EmailEnvoye] = []

    class Config:
        from_attributes = True


# ==================== TRANSCRIPTION ====================

class TranscriptionAudio(BaseModel):
    """Résultat MCP_TRANSCRIPTION"""
    fichier_audio: str
    texte: str
    langue: str = "fr"
    confiance: float
    timestamps: Optional[List[dict]] = None
    duree_secondes: float


# ==================== LOGS ====================

class LogAction(BaseModel):
    """Log traçable juridiquement"""
    timestamp: datetime
    user_id: int
    action: ActionType
    dossier_id: Optional[int] = None
    data_before: Optional[dict] = None
    data_after: Optional[dict] = None
    hash: str  # SHA-256 du log
    ip_address: Optional[str] = None


# ==================== ARCHIVAGE ====================

class ArchiveDossier(BaseModel):
    """Archive complète d'un dossier"""
    dossier_id: int
    documents_originaux: List[str]  # Paths
    transcriptions: List[TranscriptionAudio]
    analyses: List[AnalyseComplete]
    emails: List[EmailEnvoye]
    logs: List[LogAction]
    date_archivage: datetime
    hash_archive: str  # Hash de tout le dossier
