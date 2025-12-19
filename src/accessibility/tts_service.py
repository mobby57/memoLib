import threading
import logging

# TTS is optional - gracefully handle missing dependencies
try:
    import pyttsx3
    TTS_AVAILABLE = True
except (ImportError, OSError) as e:
    TTS_AVAILABLE = False
    logging.warning(f"TTS not available: {e}")

class TTSService:
    def __init__(self):
        self.engine = None
        if TTS_AVAILABLE:
            try:
                self.engine = pyttsx3.init()
                self.engine.setProperty('rate', 150)
                self.engine.setProperty('volume', 0.8)
            except (OSError, RuntimeError) as e:
                logging.warning(f"Failed to initialize TTS engine: {e}")
                self.engine = None
    
    def speak(self, text):
        if not self.engine:
            logging.debug(f"TTS not available, would speak: {text}")
            return
            
        def _speak():
            try:
                self.engine.say(text)
                self.engine.runAndWait()
            except Exception as e:
                logging.error(f"TTS error: {e}")
        
        thread = threading.Thread(target=_speak)
        thread.daemon = True
        thread.start()
    
    def set_voice(self, voice_id=0):
        if not self.engine:
            return
            
        try:
            voices = self.engine.getProperty('voices')
            if voices and len(voices) > voice_id:
                self.engine.setProperty('voice', voices[voice_id].id)
        except Exception as e:
            logging.error(f"Failed to set voice: {e}")