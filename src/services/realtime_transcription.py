"""
Service de transcription en temps réel
Enregistrement audio + transcription simultanée avec affichage du texte
"""
import pyaudio
import wave
import threading
import queue
import time
import os
from typing import Callable, Optional
import speech_recognition as sr
from datetime import datetime

class RealtimeTranscription:
    """Gestion de la transcription en temps réel avec affichage"""
    
    def __init__(self):
        self.is_recording = False
        self.audio_queue = queue.Queue()
        self.text_queue = queue.Queue()
        self.recognizer = sr.Recognizer()
        self.microphone = None
        
        # Configuration audio
        self.CHUNK = 1024
        self.FORMAT = pyaudio.paInt16
        self.CHANNELS = 1
        self.RATE = 16000
        self.RECORD_SECONDS_CHUNK = 2  # Transcription tous les 2 secondes
        
        self.audio = pyaudio.PyAudio()
        self.frames = []
        self.full_transcript = ""
        self.temp_file = None
        
    def list_microphones(self):
        """Liste tous les microphones disponibles"""
        devices = []
        info = self.audio.get_host_api_info_by_index(0)
        numdevices = info.get('deviceCount')
        
        for i in range(0, numdevices):
            device_info = self.audio.get_device_info_by_host_api_device_index(0, i)
            if device_info.get('maxInputChannels') > 0:
                devices.append({
                    'index': i,
                    'name': device_info.get('name'),
                    'channels': device_info.get('maxInputChannels'),
                    'sample_rate': int(device_info.get('defaultSampleRate'))
                })
        
        return devices
    
    def start_recording(self, callback: Optional[Callable] = None, device_index: Optional[int] = None):
        """
        Démarre l'enregistrement et la transcription en temps réel
        
        Args:
            callback: Fonction appelée avec le texte transcrit (callback(text))
            device_index: Index du microphone à utiliser
        """
        if self.is_recording:
            return {"success": False, "error": "Enregistrement déjà en cours"}
        
        # Vérifier l'accès au microphone
        try:
            test_stream = self.audio.open(
                format=self.FORMAT,
                channels=self.CHANNELS,
                rate=self.RATE,
                input=True,
                input_device_index=device_index,
                frames_per_buffer=self.CHUNK
            )
            test_stream.close()
        except OSError as e:
            return {
                "success": False,
                "error": f"Impossible d'accéder au microphone: {str(e)}. Vérifiez les permissions système."
            }
        except Exception as e:
            return {
                "success": False,
                "error": f"Erreur microphone: {str(e)}"
            }
        
        self.is_recording = True
        self.frames = []
        self.full_transcript = ""
        self.text_callback = callback
        
        # Créer fichier temporaire
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        self.temp_file = f"temp_recording_{timestamp}.wav"
        
        # Démarrer threads
        self.recording_thread = threading.Thread(target=self._record_audio, args=(device_index,))
        self.transcription_thread = threading.Thread(target=self._transcribe_audio)
        
        self.recording_thread.start()
        self.transcription_thread.start()
        
        return {
            "success": True,
            "message": "Enregistrement démarré",
            "temp_file": self.temp_file
        }
    
    def stop_recording(self, output_file: Optional[str] = None):
        """
        Arrête l'enregistrement et retourne la transcription complète
        
        Args:
            output_file: Chemin du fichier audio final (optionnel)
        """
        if not self.is_recording:
            return {"success": False, "error": "Aucun enregistrement en cours"}
        
        self.is_recording = False
        
        # Attendre fin des threads
        if self.recording_thread:
            self.recording_thread.join(timeout=2)
        if self.transcription_thread:
            self.transcription_thread.join(timeout=2)
        
        # Sauvegarder audio
        audio_file = output_file or self.temp_file
        self._save_audio(audio_file)
        
        # Transcription finale complète (au cas où)
        final_transcript = self.full_transcript
        
        # Nettoyer
        if os.path.exists(self.temp_file) and output_file and output_file != self.temp_file:
            try:
                os.remove(self.temp_file)
            except:
                pass
        
        return {
            "success": True,
            "transcript": final_transcript,
            "audio_file": audio_file,
            "duration": len(self.frames) / self.RATE if self.frames else 0
        }
    
    def _record_audio(self, device_index: Optional[int] = None):
        """Thread d'enregistrement audio"""
        stream = None
        try:
            stream = self.audio.open(
                format=self.FORMAT,
                channels=self.CHANNELS,
                rate=self.RATE,
                input=True,
                input_device_index=device_index,
                frames_per_buffer=self.CHUNK
            )
            
            chunk_frames = []
            chunk_size = int(self.RATE / self.CHUNK * self.RECORD_SECONDS_CHUNK)
            
            while self.is_recording:
                try:
                    data = stream.read(self.CHUNK, exception_on_overflow=False)
                    self.frames.append(data)
                    chunk_frames.append(data)
                    
                    # Tous les N chunks, envoyer pour transcription
                    if len(chunk_frames) >= chunk_size:
                        self.audio_queue.put(chunk_frames.copy())
                        chunk_frames = []
                except Exception as read_error:
                    print(f"Erreur lecture audio: {read_error}")
                    time.sleep(0.1)
            
            # Envoyer dernier chunk
            if chunk_frames:
                self.audio_queue.put(chunk_frames.copy())
            
            stream.stop_stream()
            stream.close()
            
        except Exception as e:
            print(f"Erreur enregistrement: {e}")
            self.is_recording = False
    
    def _transcribe_audio(self):
        """Thread de transcription en temps réel"""
        while self.is_recording or not self.audio_queue.empty():
            try:
                # Attendre chunk audio
                chunk_frames = self.audio_queue.get(timeout=0.5)
                
                # Créer fichier WAV temporaire pour ce chunk
                chunk_file = f"chunk_{time.time()}.wav"
                with wave.open(chunk_file, 'wb') as wf:
                    wf.setnchannels(self.CHANNELS)
                    wf.setsampwidth(self.audio.get_sample_size(self.FORMAT))
                    wf.setframerate(self.RATE)
                    wf.writeframes(b''.join(chunk_frames))
                
                # Transcription avec speech_recognition
                try:
                    with sr.AudioFile(chunk_file) as source:
                        # Ajuster pour le bruit ambiant
                        self.recognizer.adjust_for_ambient_noise(source, duration=0.5)
                        audio_data = self.recognizer.record(source)
                        
                        # Utiliser OpenAI Whisper si API key disponible
                        text = None
                        openai_key = os.environ.get('OPENAI_API_KEY')
                        
                        if openai_key and openai_key.startswith('sk-'):
                            try:
                                # Utiliser Whisper API d'OpenAI
                                import openai
                                openai.api_key = openai_key
                                
                                # Convertir audio_data en fichier pour Whisper
                                with open(chunk_file, 'rb') as audio_file:
                                    response = openai.audio.transcriptions.create(
                                        model="whisper-1",
                                        file=audio_file,
                                        language="fr"
                                    )
                                    text = response.text
                            except Exception as whisper_error:
                                print(f"Whisper API error: {whisper_error}")
                                # Fallback to Google
                                try:
                                    text = self.recognizer.recognize_google(audio_data, language='fr-FR')
                                except:
                                    pass
                        else:
                            # Pas de clé OpenAI, utiliser Google
                            try:
                                text = self.recognizer.recognize_google(audio_data, language='fr-FR')
                            except (sr.UnknownValueError, sr.RequestError):
                                # Fallback vers reconnaissance offline si disponible
                                try:
                                    text = self.recognizer.recognize_sphinx(audio_data, language='fr-FR')
                                except:
                                    pass
                        
                        if text and text.strip():
                            self.full_transcript += " " + text
                            self.text_queue.put(text)
                            
                            # Callback si défini
                            if self.text_callback:
                                try:
                                    self.text_callback(text)
                                except Exception as cb_error:
                                    print(f"Erreur callback: {cb_error}")
                
                except sr.UnknownValueError:
                    pass  # Pas de parole détectée dans ce chunk
                except sr.RequestError as e:
                    print(f"Erreur API transcription: {e}")
                except Exception as e:
                    print(f"Erreur transcription chunk: {e}")
                
                # Nettoyer fichier chunk
                try:
                    os.remove(chunk_file)
                except:
                    pass
                
            except queue.Empty:
                continue
            except Exception as e:
                print(f"Erreur thread transcription: {e}")
    
    def _save_audio(self, filename: str):
        """Sauvegarde l'audio enregistré"""
        try:
            with wave.open(filename, 'wb') as wf:
                wf.setnchannels(self.CHANNELS)
                wf.setsampwidth(self.audio.get_sample_size(self.FORMAT))
                wf.setframerate(self.RATE)
                wf.writeframes(b''.join(self.frames))
        except Exception as e:
            print(f"Erreur sauvegarde audio: {e}")
    
    def get_current_transcript(self):
        """Récupère la transcription actuelle"""
        return self.full_transcript.strip()
    
    def get_latest_text(self):
        """Récupère le dernier texte transcrit (non-bloquant)"""
        try:
            return self.text_queue.get_nowait()
        except queue.Empty:
            return None
    
    def cleanup(self):
        """Nettoyage des ressources"""
        if self.is_recording:
            self.stop_recording()
        
        if self.audio:
            self.audio.terminate()
        
        # Nettoyer fichiers temporaires
        if self.temp_file and os.path.exists(self.temp_file):
            try:
                os.remove(self.temp_file)
            except:
                pass


class RealtimeTranscriptionWebSocket:
    """Version WebSocket pour streaming temps réel vers frontend"""
    
    def __init__(self, socketio):
        self.socketio = socketio
        self.transcription = RealtimeTranscription()
        self.session_active = False
    
    def start_session(self, device_index: Optional[int] = None):
        """Démarre une session de transcription WebSocket"""
        if self.session_active:
            return {"success": False, "error": "Session déjà active"}
        
        def emit_text(text):
            """Émet le texte transcrit via WebSocket"""
            self.socketio.emit('transcription_update', {
                'text': text,
                'timestamp': datetime.now().isoformat()
            })
        
        result = self.transcription.start_recording(callback=emit_text, device_index=device_index)
        
        if result['success']:
            self.session_active = True
        
        return result
    
    def stop_session(self, output_file: Optional[str] = None):
        """Arrête la session de transcription"""
        if not self.session_active:
            return {"success": False, "error": "Aucune session active"}
        
        result = self.transcription.stop_recording(output_file)
        self.session_active = False
        
        # Émettre transcription finale
        if result['success']:
            self.socketio.emit('transcription_complete', {
                'transcript': result['transcript'],
                'audio_file': result['audio_file'],
                'duration': result['duration']
            })
        
        return result
    
    def get_devices(self):
        """Liste les périphériques audio disponibles"""
        return self.transcription.list_microphones()
