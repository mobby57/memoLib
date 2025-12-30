from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import os
from dotenv import load_dotenv
import openai
import json
from datetime import datetime

load_dotenv()

app = FastAPI(title="IA Poste Manager", version="2.3")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# OpenAI client
openai_api_key = os.getenv('OPENAI_API_KEY')
if openai_api_key:
    client = openai.OpenAI(api_key=openai_api_key)
else:
    client = None

# Models
class EmailRequest(BaseModel):
    prompt: str

class EmailSend(BaseModel):
    to: str
    subject: str
    content: str

# Storage
emails = []
templates = []
contacts = []

@app.get("/")
def read_root():
    return {"message": "IA Poste Manager v2.3", "status": "running"}

@app.post("/api/generate")
def generate_email(request: EmailRequest):
    if not request.prompt or len(request.prompt) > 500:
        raise HTTPException(status_code=400, detail="Invalid prompt")
    
    try:
        if client:
            response = client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[
                    {"role": "system", "content": "Tu es un assistant IA pour générer des emails professionnels en français."},
                    {"role": "user", "content": f"Génère un email professionnel pour: {request.prompt}"}
                ],
                max_tokens=300
            )
            content = response.choices[0].message.content
        else:
            content = f"Objet: {request.prompt}\n\nBonjour,\n\nJe vous contacte concernant votre demande.\n\nCordialement,\nMS CONSEILS"
        
        return {"content": content}
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to generate email")

@app.post("/api/send-email")
def send_email(email: EmailSend):
    email_record = {
        'id': len(emails) + 1,
        'to': email.to,
        'subject': email.subject,
        'content': email.content,
        'date': datetime.now().isoformat()
    }
    emails.append(email_record)
    return {"success": True, "message": "Email enregistré avec succès!"}

@app.get("/api/emails")
def get_emails():
    return emails

@app.get("/health")
def health():
    return {"status": "healthy", "service": "IA Poste Manager v2.3"}