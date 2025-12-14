"""Service de transcription vocale (Speech-to-Text) pour sourds/muets"""
import speech_recognition as sr
import logging
from pathlib import Path

logger = logging.getLogger(__name__)

class TranscriptionService:
    def __init__(self):
        self.recognizer = sr.Recognizer()
    
    def transcrire_microphone(self, langue='fr-FR'):
        """Transcrit l'audio du microphone en temps réel"""
        try:
            with sr.Microphone() as source:
                logger.info("Écoute en cours...")
                self.recognizer.adjust_for_ambient_noise(source, duration=1)
                audio = self.recognizer.listen(source, timeout=10)
                texte = self.recognizer.recognize_google(audio, language=langue)
                return texte
        except sr.WaitTimeoutError:
            logger.warning("Timeout: aucun son détecté")
            return None
        except sr.UnknownValueError:
            logger.warning("Audio incompréhensible")
            return None
        except Exception as e:
            logger.error(f"Erreur transcription: {e}")
            return None
    
    def transcrire_fichier(self, fichier_audio, langue='fr-FR'):
        """Transcrit un fichier audio en texte"""
        try:
            with sr.AudioFile(str(fichier_audio)) as source:
                audio = self.recognizer.record(source)
                texte = self.recognizer.recognize_google(audio, language=langue)
                return texte
        except Exception as e:
            logger.error(f"Erreur transcription fichier: {e}")
            return None
