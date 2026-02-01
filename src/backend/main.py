from fastapi import FastAPI, HTTPException, Depends, status, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel, EmailStr
from typing import List, Optional, Dict, Any
import os
import sys
from datetime import datetime
import json

# Ajouter le chemin des services
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'services'))

from email_service import EmailService
from ai_service import AIService
from voice_service import VoiceService

# Initialize FastAPI
app = FastAPI(
    title="IAPosteManager API",
    description="Production-ready email automation API with AI and Voice",
    version="2.3.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Initialize services
email_service = EmailService()
ai_service = AIService()
voice_service = VoiceService()

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3001", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Security
security = HTTPBearer()

# Models
class EmailRequest(BaseModel):
    to: EmailStr
    subject: str
    content: str
    ai_enhance: bool = False
    provider: str = 'smtp'
    attachments: Optional[List[str]] = None

class EmailResponse(BaseModel):
    id: str
    status: str
    sent_at: datetime
    provider: str
    message_id: Optional[str] = None

class AIRequest(BaseModel):
    prompt: str
    context: Optional[Dict[str, Any]] = None
    style: Optional[str] = 'professionnel'

class AIResponse(BaseModel):
    content: str
    tokens_used: int
    provider: str
    model: str
    generated_at: datetime

class VoiceRequest(BaseModel):
    text: str
    save_file: bool = False

class VoiceResponse(BaseModel):
    success: bool
    text: Optional[str] = None
    file_path: Optional[str] = None
    error: Optional[str] = None

class HealthResponse(BaseModel):
    status: str
    version: str
    timestamp: datetime
    services: Dict[str, str]

# Routes
@app.get("/health", response_model=HealthResponse)
async def health_check():
    services_status = {
        'email': 'healthy',
        'ai': 'healthy' if ai_service.provider else 'unavailable',
        'voice': 'healthy' if voice_service.tts_engine else 'unavailable'
    }

    return HealthResponse(
        status="healthy",
        version="2.3.0",
        timestamp=datetime.now(),
        services=services_status
    )

# EMAIL ENDPOINTS
@app.post("/api/emails/send", response_model=EmailResponse)
async def send_email(
    email: EmailRequest,
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    try:
        # Amélioration IA si demandée
        content = email.content
        if email.ai_enhance:
            ai_result = await ai_service.enhance_email(content)
            if not ai_result.get('error'):
                content = ai_result['content']

        # Envoi de l'email
        result = await email_service.send_email(
            to=email.to,
            subject=email.subject,
            content=content,
            provider=email.provider,
            attachments=email.attachments
        )

        return EmailResponse(
            id=result['message_id'],
            status=result['status'],
            sent_at=datetime.now(),
            provider=email.provider,
            message_id=result['message_id']
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/emails/history")
async def get_email_history(
    limit: int = 50,
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    try:
        history = await email_service.get_history(limit)
        return {"emails": history, "total": len(history)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# AI ENDPOINTS
@app.post("/api/ai/generate", response_model=AIResponse)
async def generate_content(
    request: AIRequest,
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    try:
        result = await ai_service.generate_email(request.prompt, request.context)

        if result.get('error'):
            raise HTTPException(status_code=500, detail=result.get('content', 'Erreur IA'))

        return AIResponse(
            content=result['content'],
            tokens_used=result['tokens_used'],
            provider=result['provider'],
            model=result['model'],
            generated_at=datetime.fromisoformat(result['generated_at'])
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/ai/enhance")
async def enhance_email(
    content: str,
    style: str = "professionnel",
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    try:
        result = await ai_service.enhance_email(content, style)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/ai/translate")
async def translate_email(
    content: str,
    target_language: str = "français",
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    try:
        result = await ai_service.translate_email(content, target_language)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/ai/models")
async def get_ai_models(
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    try:
        models = ai_service.get_available_models()
        return {"models": models, "current_provider": ai_service.provider}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# VOICE ENDPOINTS
@app.post("/api/voice/tts", response_model=VoiceResponse)
async def text_to_speech(
    request: VoiceRequest,
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    try:
        result = await voice_service.text_to_speech(request.text, request.save_file)

        return VoiceResponse(
            success=result['success'],
            text=result.get('text'),
            file_path=result.get('file_path'),
            error=result.get('error')
        )

    except Exception as e:
        return VoiceResponse(success=False, error=str(e))

@app.post("/api/voice/stt")
async def speech_to_text(
    audio_file: UploadFile = File(None),
    timeout: int = 5,
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    try:
        if audio_file:
            # Sauvegarder le fichier temporairement
            temp_path = f"/tmp/{audio_file.filename}"
            with open(temp_path, "wb") as f:
                content = await audio_file.read()
                f.write(content)

            result = await voice_service.speech_to_text(temp_path)

            # Nettoyer le fichier temporaire
            os.remove(temp_path)
        else:
            # Utiliser le microphone
            result = await voice_service.speech_to_text(timeout=timeout)

        return result

    except Exception as e:
        return {"success": False, "error": str(e)}

@app.post("/api/voice/start-listening")
async def start_voice_listening(
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    try:
        result = await voice_service.start_continuous_listening()
        return result
    except Exception as e:
        return {"success": False, "error": str(e)}

@app.post("/api/voice/stop-listening")
async def stop_voice_listening(
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    try:
        result = voice_service.stop_continuous_listening()
        return result
    except Exception as e:
        return {"success": False, "error": str(e)}

@app.get("/api/voice/recognized")
async def get_recognized_text(
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    try:
        result = voice_service.get_recognized_text()
        return result or {"text": None}
    except Exception as e:
        return {"error": str(e)}

@app.get("/api/voice/settings")
async def get_voice_settings(
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    try:
        settings = voice_service.get_voice_settings()
        return settings
    except Exception as e:
        return {"error": str(e)}

@app.post("/api/voice/settings")
async def update_voice_settings(
    settings: Dict[str, Any],
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    try:
        result = voice_service.update_voice_settings(settings)
        return result
    except Exception as e:
        return {"success": False, "error": str(e)}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5000, reload=True)
