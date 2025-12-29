import speech_recognition as sr
import pyttsx3
import os
import json
import tempfile
from typing import Dict, Optional
import threading
import queue
import wave
import pyaudio

class VoiceService:
    def __init__(self):
        self.recognizer = sr.Recognizer()
        self.microphone = sr.Microphone()
        self.tts_engine = None
        self.is_listening = False
        self.audio_queue = queue.Queue()
        
        # Initialiser TTS
        try:
            self.tts_engine = pyttsx3.init()
            self._configure_tts()
        except:
            print("TTS non disponible")
    
    def _configure_tts(self):
        """Configurer le moteur TTS"""
        if self.tts_engine:
            # Vitesse de parole
            rate = self.tts_engine.getProperty('rate')
            self.tts_engine.setProperty('rate', rate - 50)
            
            # Volume
            self.tts_engine.setProperty('volume', 0.9)
            
            # Voix française si disponible
            voices = self.tts_engine.getProperty('voices')
            for voice in voices:
                if 'french' in voice.name.lower() or 'fr' in voice.id.lower():
                    self.tts_engine.setProperty('voice', voice.id)
                    break
    
    async def text_to_speech(self, text: str, save_file: bool = False) -> Dict:
        """Convertir texte en parole"""
        try:
            if not self.tts_engine:
                return {'error': 'TTS non disponible', 'success': False}
            
            if save_file:
                # Sauvegarder dans un fichier
                filename = f"temp_audio_{int(os.time())}.wav"
                filepath = os.path.join(tempfile.gettempdir(), filename)
                self.tts_engine.save_to_file(text, filepath)
                self.tts_engine.runAndWait()
                
                return {
                    'success': True,
                    'file_path': filepath,
                    'text': text,
                    'duration': self._get_audio_duration(filepath)
                }
            else:
                # Lecture directe
                self.tts_engine.say(text)
                self.tts_engine.runAndWait()
                
                return {
                    'success': True,
                    'text': text,
                    'played': True
                }
                
        except Exception as e:
            return {'error': str(e), 'success': False}
    
    async def speech_to_text(self, audio_file: str = None, timeout: int = 5) -> Dict:
        """Convertir parole en texte"""
        try:
            if audio_file:
                # Depuis un fichier audio
                with sr.AudioFile(audio_file) as source:
                    audio = self.recognizer.record(source)
            else:
                # Depuis le microphone
                with self.microphone as source:
                    self.recognizer.adjust_for_ambient_noise(source)
                    print("Parlez maintenant...")
                    audio = self.recognizer.listen(source, timeout=timeout)
            
            # Reconnaissance vocale
            try:
                # Essayer Google (français)
                text = self.recognizer.recognize_google(audio, language='fr-FR')
                return {
                    'success': True,
                    'text': text,
                    'confidence': 0.9,  # Google ne retourne pas de score
                    'language': 'fr-FR'
                }
            except sr.UnknownValueError:
                return {
                    'success': False,
                    'error': 'Parole non comprise',
                    'text': ''
                }
            except sr.RequestError as e:
                # Fallback vers reconnaissance offline si disponible
                try:
                    text = self.recognizer.recognize_sphinx(audio, language='fr-FR')
                    return {
                        'success': True,
                        'text': text,
                        'confidence': 0.7,
                        'language': 'fr-FR',
                        'method': 'offline'
                    }
                except:
                    return {
                        'success': False,
                        'error': f'Erreur de reconnaissance: {str(e)}',
                        'text': ''
                    }
                    
        except Exception as e:
            return {
                'success': False,
                'error': str(e),
                'text': ''
            }
    
    async def start_continuous_listening(self, callback_func=None) -> Dict:
        """Démarrer l'écoute continue"""
        if self.is_listening:
            return {'error': 'Écoute déjà en cours', 'success': False}
        
        self.is_listening = True
        
        def listen_continuously():
            while self.is_listening:
                try:
                    with self.microphone as source:
                        self.recognizer.adjust_for_ambient_noise(source, duration=0.5)
                        audio = self.recognizer.listen(source, timeout=1, phrase_time_limit=5)
                    
                    try:
                        text = self.recognizer.recognize_google(audio, language='fr-FR')
                        if callback_func:
                            callback_func(text)
                        else:
                            self.audio_queue.put({
                                'text': text,
                                'timestamp': os.time(),
                                'confidence': 0.9
                            })
                    except sr.UnknownValueError:
                        pass  # Pas de parole détectée
                    except sr.RequestError:
                        pass  # Erreur de service
                        
                except Exception:
                    pass  # Continuer l'écoute malgré les erreurs
        
        # Démarrer dans un thread séparé
        thread = threading.Thread(target=listen_continuously, daemon=True)
        thread.start()
        
        return {'success': True, 'message': 'Écoute continue démarrée'}
    
    def stop_continuous_listening(self) -> Dict:
        """Arrêter l'écoute continue"""
        self.is_listening = False
        return {'success': True, 'message': 'Écoute continue arrêtée'}
    
    def get_recognized_text(self) -> Optional[Dict]:
        """Récupérer le texte reconnu de la queue"""
        try:
            return self.audio_queue.get_nowait()
        except queue.Empty:
            return None
    
    def _get_audio_duration(self, filepath: str) -> float:
        """Obtenir la durée d'un fichier audio"""
        try:
            with wave.open(filepath, 'r') as wav_file:
                frames = wav_file.getnframes()
                rate = wav_file.getframerate()
                return frames / float(rate)
        except:
            return 0.0
    
    async def voice_command_processor(self, text: str) -> Dict:
        """Traiter les commandes vocales"""
        text = text.lower().strip()
        
        commands = {
            'nouveau message': 'compose_email',
            'envoyer email': 'send_email',
            'lire messages': 'read_emails',
            'historique': 'show_history',
            'aide': 'show_help',
            'arrêter': 'stop_listening'
        }
        
        for command, action in commands.items():
            if command in text:
                return {
                    'action': action,
                    'command': command,
                    'original_text': text,
                    'success': True
                }
        
        return {
            'action': 'unknown',
            'original_text': text,
            'success': False,
            'message': 'Commande non reconnue'
        }
    
    def get_voice_settings(self) -> Dict:
        """Obtenir les paramètres vocaux actuels"""
        if not self.tts_engine:
            return {'error': 'TTS non disponible'}
        
        return {
            'rate': self.tts_engine.getProperty('rate'),
            'volume': self.tts_engine.getProperty('volume'),
            'voice': self.tts_engine.getProperty('voice'),
            'available_voices': [v.id for v in self.tts_engine.getProperty('voices')],
            'is_listening': self.is_listening
        }
    
    def update_voice_settings(self, settings: Dict) -> Dict:
        """Mettre à jour les paramètres vocaux"""
        if not self.tts_engine:
            return {'error': 'TTS non disponible', 'success': False}
        
        try:
            if 'rate' in settings:
                self.tts_engine.setProperty('rate', settings['rate'])
            if 'volume' in settings:
                self.tts_engine.setProperty('volume', settings['volume'])
            if 'voice' in settings:
                self.tts_engine.setProperty('voice', settings['voice'])
            
            return {'success': True, 'message': 'Paramètres mis à jour'}
        except Exception as e:
            return {'error': str(e), 'success': False}