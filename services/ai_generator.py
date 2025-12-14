# -*- coding: utf-8 -*-
import os
import json
import logging
from openai import OpenAI

logger = logging.getLogger(__name__)

def generate_email_from_text(text, user_name=""):
    api_key = os.getenv('OPENAI_API_KEY')
    
    if not api_key:
        lines = [l.strip() for l in text.splitlines() if l.strip()]
        subject = lines[0] if lines else "Demande administrative"
        body = text.strip()
        return subject, body
    
    try:
        client = OpenAI(api_key=api_key)
        prompt = f"""Tu es un assistant qui redige des emails administratifs formels.
Utilisateur: {user_name}
Texte brut: {text}

Retourne un JSON avec:
{{"subject": "...", "body": "..."}}
"""
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "Tu rediges des emails administratifs formels."},
                {"role": "user", "content": prompt}
            ],
            max_tokens=600
        )
        
        content = response.choices[0].message.content
        data = json.loads(content)
        return data.get("subject", "Demande administrative"), data.get("body", text)
    except Exception as e:
        logger.error(f"Erreur generation IA: {type(e).__name__}")
        lines = [l.strip() for l in text.splitlines() if l.strip()]
        return lines[0] if lines else "Demande", text

def generate_email(context, tone='professionnel'):
    """Genere email structure pour API"""
    subject, body = generate_email_from_text(context)
    return {'subject': subject, 'body': body}
