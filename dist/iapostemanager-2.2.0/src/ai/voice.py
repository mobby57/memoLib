#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Module de transcription vocale avec OpenAI Whisper
"""
import os

def transcrire_audio(audio_path, api_key):
    """Transcrit un fichier audio en texte avec Whisper"""
    try:
        from openai import OpenAI
        client = OpenAI(api_key=api_key)
        
        with open(audio_path, 'rb') as audio_file:
            transcription = client.audio.transcriptions.create(
                model="whisper-1",
                file=audio_file,
                language="fr"
            )
        return transcription.text
    except Exception as e:
        raise Exception(f"Erreur transcription: {e}")

def enregistrer_audio(duree=10):
    """Enregistre l'audio depuis le micro"""
    try:
        import sounddevice as sd
        import soundfile as sf
        import tempfile
        
        print(f"🎤 Enregistrement pendant {duree} secondes...")
        samplerate = 16000
        audio = sd.rec(int(duree * samplerate), samplerate=samplerate, channels=1)
        sd.wait()
        
        temp_file = tempfile.NamedTemporaryFile(delete=False, suffix='.wav')
        sf.write(temp_file.name, audio, samplerate)
        print("✓ Enregistrement terminé")
        return temp_file.name
    except Exception as e:
        raise Exception(f"Erreur enregistrement: {e}")
