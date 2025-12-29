"""
Service IA externe pour génération de contenu
"""
import os
import json
import logging
from typing import Dict, Any, Optional
import openai
from dotenv import load_dotenv

load_dotenv()

class ExternalAIService:
    """Service pour interactions avec APIs IA externes"""
    
    def __init__(self):
        self.openai_key = os.getenv('OPENAI_API_KEY')
        self.client = openai.OpenAI(api_key=self.openai_key) if self.openai_key else None
        
    async def analyze_with_gpt4(self, prompt: str) -> Dict[str, Any]:
        """Analyse avec GPT-4"""
        if not self.client:
            return self._fallback_response()
            
        try:
            response = self.client.chat.completions.create(
                model="gpt-4",
                messages=[{"role": "user", "content": prompt}],
                max_tokens=500
            )
            
            content = response.choices[0].message.content
            return self._parse_json_response(content)
            
        except Exception as e:
            logging.error(f"GPT-4 error: {e}")
            return self._fallback_response()
    
    async def analyze_with_ollama(self, prompt: str) -> Dict[str, Any]:
        """Analyse avec Ollama (local)"""
        # Fallback simple pour Ollama
        return self._fallback_response()
    
    def _parse_json_response(self, content: str) -> Dict[str, Any]:
        """Parse réponse JSON de l'IA"""
        try:
            return json.loads(content)
        except:
            return {
                "greeting": "Bonjour,",
                "body": content,
                "closing": "Cordialement,",
                "signature": "IA Poste Manager"
            }
    
    def _fallback_response(self) -> Dict[str, Any]:
        """Réponse de secours"""
        return {
            "greeting": "Bonjour,",
            "body": "Nous avons bien reçu votre message et vous recontacterons rapidement.",
            "closing": "Cordialement,",
            "signature": "IA Poste Manager"
        }