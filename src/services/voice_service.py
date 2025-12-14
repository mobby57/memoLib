"""Service vocal pour IAPosteManager"""

import os
import tempfile
import speech_recognition as sr
import pyttsx3
from typing import Optional, Dict, Any
import logging

logger = logging.getLogger(__name__)

class VoiceService:
    """Service de reconnaissance vocale et synthèse vocale"""
    
    def __init__(self):
        self.recognizer = sr.Recognizer()
        self.microphone = sr.Microphone()
        self.tts_engine = None
        self._init_tts()
        
    def _init_tts(self):
        """Initialise le moteur TTS"""
        try:
            self.tts_engine = pyttsx3.init()
            # Configuration par défaut
            self.tts_engine.setProperty('rate', 150)
            self.tts_engine.setProperty('volume', 0.8)
        except Exception as e:
            logger.error(f"Erreur initialisation TTS: {e}")
            self.tts_engine = None
    
    def speak(self, text: str) -> bool:
        """Prononce un texte"""
        try:
            if not self.tts_engine:
                logger.warning("Moteur TTS non disponible")
                return False
                
            self.tts_engine.say(text)
            self.tts_engine.runAndWait()
            return True
        except Exception as e:
            logger.error(f"Erreur TTS: {e}")
            return False
    
    def listen(self, timeout: int = 5) -> Optional[str]:
        """Écoute et transcrit la voix"""
        try:
            with self.microphone as source:
                # Ajustement du bruit ambiant
                self.recognizer.adjust_for_ambient_noise(source, duration=1)
                logger.info("Écoute en cours...")
                
                # Enregistrement
                audio = self.recognizer.listen(source, timeout=timeout)
                
                # Reconnaissance
                text = self.recognizer.recognize_google(audio, language='fr-FR')
                logger.info(f"Texte reconnu: {text}")
                return text
                
        except sr.WaitTimeoutError:
            logger.warning("Timeout - aucun son détecté")
            return None
        except sr.UnknownValueError:
            logger.warning("Impossible de comprendre l'audio")
            return None
        except sr.RequestError as e:
            logger.error(f"Erreur service reconnaissance: {e}")
            return None
        except Exception as e:
            logger.error(f"Erreur écoute: {e}")
            return None
    
    def transcribe_file(self, audio_file_path: str) -> Optional[str]:
        """Transcrit un fichier audio"""
        try:
            with sr.AudioFile(audio_file_path) as source:
                audio = self.recognizer.record(source)
                text = self.recognizer.recognize_google(audio, language='fr-FR')
                return text
        except Exception as e:
            logger.error(f"Erreur transcription fichier: {e}")
            return None
    
    def get_microphone_list(self) -> list:
        """Retourne la liste des microphones disponibles"""
        try:
            return sr.Microphone.list_microphone_names()
        except Exception as e:
            logger.error(f"Erreur liste microphones: {e}")
            return []
    
    def set_microphone(self, device_index: int) -> bool:
        """Définit le microphone à utiliser"""
        try:
            self.microphone = sr.Microphone(device_index=device_index)
            return True
        except Exception as e:
            logger.error(f"Erreur sélection microphone: {e}")
            return False
    
    def configure_tts(self, rate: int = 150, volume: float = 0.8, voice_id: int = 0) -> bool:
        """Configure les paramètres TTS"""
        try:
            if not self.tts_engine:
                return False
                
            self.tts_engine.setProperty('rate', rate)
            self.tts_engine.setProperty('volume', volume)
            
            # Sélection de la voix
            voices = self.tts_engine.getProperty('voices')
            if voices and voice_id < len(voices):
                self.tts_engine.setProperty('voice', voices[voice_id].id)
            
            return True
        except Exception as e:
            logger.error(f"Erreur configuration TTS: {e}")
            return False
    
    def get_available_voices(self) -> list:
        """Retourne les voix disponibles"""
        try:
            if not self.tts_engine:
                return []
            
            voices = self.tts_engine.getProperty('voices')
            return [{'id': i, 'name': voice.name, 'lang': voice.languages} 
                   for i, voice in enumerate(voices)] if voices else []
        except Exception as e:
            logger.error(f"Erreur liste voix: {e}")
            return []
    
    def save_speech_to_file(self, text: str, filename: str) -> bool:
        """Sauvegarde la synthèse vocale dans un fichier"""
        try:
            if not self.tts_engine:
                return False
                
            self.tts_engine.save_to_file(text, filename)
            self.tts_engine.runAndWait()
            return True
        except Exception as e:
            logger.error(f"Erreur sauvegarde audio: {e}")
            return False
    
    def voice_command_processor(self, command: str) -> Dict[str, Any]:
        """Traite une commande vocale"""
        command = command.lower().strip()
        
        # Commandes de base
        if "composer" in command or "écrire" in command:
            return {"action": "compose", "data": {"mode": "voice"}}
        
        elif "envoyer" in command:
            return {"action": "send", "data": {"mode": "voice"}}
        
        elif "historique" in command:
            return {"action": "history", "data": {}}
        
        elif "aide" in command or "help" in command:
            return {"action": "help", "data": {}}
        
        elif "quitter" in command or "fermer" in command:
            return {"action": "quit", "data": {}}
        
        else:
            return {"action": "unknown", "data": {"command": command}}
    
    def get_voice_feedback(self, action: str, success: bool = True) -> str:
        """Génère un feedback vocal pour une action"""
        feedbacks = {
            "compose": "Mode composition activé. Dictez votre message.",
            "send": "Email envoyé avec succès." if success else "Erreur lors de l'envoi.",
            "history": "Affichage de l'historique des emails.",
            "help": "Commandes disponibles: composer, envoyer, historique, aide, quitter.",
            "quit": "Au revoir !",
            "unknown": "Commande non reconnue. Dites 'aide' pour voir les commandes disponibles."
        }
        
        return feedbacks.get(action, "Action terminée.")