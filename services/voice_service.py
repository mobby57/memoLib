# -*- coding: utf-8 -*-
import logging
from openai import OpenAI

logger = logging.getLogger(__name__)

def text_to_speech(texte, api_key, voice="alloy"):
    """Convertit du texte en parole avec OpenAI TTS"""
    try:
        client = OpenAI(api_key=api_key)
        response = client.audio.speech.create(
            model="tts-1",
            voice=voice,
            input=texte
        )
        return response.content
    except Exception as e:
        logger.error(f"Erreur TTS: {type(e).__name__}")
        return None

def speech_to_text(audio_file, api_key):
    """Convertit de la parole en texte avec OpenAI Whisper"""
    try:
        client = OpenAI(api_key=api_key)
        transcription = client.audio.transcriptions.create(
            model="whisper-1",
            file=audio_file
        )
        return transcription.text
    except Exception as e:
        logger.error(f"Erreur STT: {type(e).__name__}")
        return None
