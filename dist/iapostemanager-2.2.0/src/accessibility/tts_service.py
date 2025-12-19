import pyttsx3
import threading

class TTSService:
    def __init__(self):
        self.engine = pyttsx3.init()
        self.engine.setProperty('rate', 150)
        self.engine.setProperty('volume', 0.8)
    
    def speak(self, text):
        def _speak():
            self.engine.say(text)
            self.engine.runAndWait()
        
        thread = threading.Thread(target=_speak)
        thread.daemon = True
        thread.start()
    
    def set_voice(self, voice_id=0):
        voices = self.engine.getProperty('voices')
        if voices and len(voices) > voice_id:
            self.engine.setProperty('voice', voices[voice_id].id)