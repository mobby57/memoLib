"""Gestionnaire principal d'accessibilité"""
import logging
from enum import Enum
from .tts_service import TTSService
from .transcription_service import TranscriptionService

logger = logging.getLogger(__name__)

class ModeAccessibilite(Enum):
    STANDARD = "standard"
    SOURD_MUET = "sourd_muet"
    AVEUGLE = "aveugle"
    COMPLET = "complet"

class AccessibilityManager:
    def __init__(self):
        self.tts = TTSService()
        self.transcription = TranscriptionService()
        self.mode = ModeAccessibilite.STANDARD
    
    def set_mode(self, mode):
        """Définit le mode d'accessibilité"""
        if isinstance(mode, str):
            self.mode = ModeAccessibilite(mode)
        else:
            self.mode = mode
        logger.info(f"Mode accessibilité: {self.mode.value}")
    
    def traiter_email_entrant(self, email_data):
        """Traite un email selon le mode d'accessibilité"""
        resultat = {'texte': email_data, 'audio': None}
        
        if self.mode in [ModeAccessibilite.AVEUGLE, ModeAccessibilite.COMPLET]:
            audio_path = f"temp_audio_{email_data.get('id', 'email')}.wav"
            if self.tts.sauvegarder_audio(
                f"{email_data.get('objet', '')} {email_data.get('corps', '')}", 
                audio_path
            ):
                resultat['audio'] = audio_path
        
        return resultat
    
    def traiter_commande_vocale(self):
        """Capture et transcrit une commande vocale"""
        if self.mode in [ModeAccessibilite.SOURD_MUET, ModeAccessibilite.COMPLET]:
            return self.transcription.transcrire_microphone()
        return None
    
    def feedback_vocal(self, message):
        """Donne un feedback vocal si nécessaire"""
        if self.mode in [ModeAccessibilite.AVEUGLE, ModeAccessibilite.COMPLET]:
            self.tts.lire_texte(message)
    
    def generer_email_accessible(self, contexte, mode_saisie='texte'):
        """Génère un email avec support vocal"""
        if mode_saisie == 'vocal':
            self.feedback_vocal("Parlez maintenant pour dicter votre email")
            texte = self.transcription.transcrire_microphone()
            if texte:
                self.feedback_vocal(f"Vous avez dit: {texte}")
                return texte
        return contexte
