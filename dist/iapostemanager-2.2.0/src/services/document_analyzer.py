import os
import speech_recognition as sr
from pydub import AudioSegment
import PyPDF2
import docx

class DocumentAnalyzer:
    def __init__(self):
        self.recognizer = sr.Recognizer()
    
    def extract_text_from_pdf(self, file_path):
        text = ""
        with open(file_path, 'rb') as file:
            reader = PyPDF2.PdfReader(file)
            for page in reader.pages:
                text += page.extract_text()
        return text
    
    def extract_text_from_docx(self, file_path):
        doc = docx.Document(file_path)
        return '\n'.join([paragraph.text for paragraph in doc.paragraphs])
    
    def extract_text_from_txt(self, file_path):
        with open(file_path, 'r', encoding='utf-8') as file:
            return file.read()
    
    def transcribe_audio(self, file_path):
        try:
            # Convertir en WAV si nécessaire
            if not file_path.endswith('.wav'):
                audio = AudioSegment.from_file(file_path)
                wav_path = file_path.rsplit('.', 1)[0] + '.wav'
                audio.export(wav_path, format="wav")
                file_path = wav_path
            
            with sr.AudioFile(file_path) as source:
                audio = self.recognizer.record(source)
                return self.recognizer.recognize_google(audio, language='fr-FR')
        except:
            return "Erreur transcription audio"
    
    def analyze_document(self, file_path):
        ext = os.path.splitext(file_path)[1].lower()
        
        if ext == '.pdf':
            return self.extract_text_from_pdf(file_path)
        elif ext == '.docx':
            return self.extract_text_from_docx(file_path)
        elif ext == '.txt':
            return self.extract_text_from_txt(file_path)
        elif ext in ['.mp3', '.wav', '.m4a']:
            return self.transcribe_audio(file_path)
        else:
            return "Format non supporté"