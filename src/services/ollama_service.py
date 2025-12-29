"""
Service Ollama - IA locale gratuite
Remplace OpenAI pour génération d'emails
"""

import requests
import json
import logging
import os
from typing import Optional, Dict, List

logger = logging.getLogger(__name__)

class OllamaService:
    """Service pour Ollama (IA locale)"""
    
    def __init__(self, base_url: str = None, model: str = None):
        self.base_url = base_url or os.getenv('OLLAMA_BASE_URL', 'http://localhost:11434')
        self.model = model or os.getenv('OLLAMA_MODEL', 'llama3.1:8b')
        
    def is_available(self) -> bool:
        """Vérifie si Ollama est disponible"""
        try:
            response = requests.get(f"{self.base_url}/api/tags", timeout=5)
            return response.status_code == 200
        except:
            return False
    
    def list_models(self) -> List[str]:
        """Liste les modèles disponibles"""
        try:
            response = requests.get(f"{self.base_url}/api/tags")
            if response.status_code == 200:
                data = response.json()
                return [model['name'] for model in data.get('models', [])]
        except:
            pass
        return []
    
    def generate_email(self, context: str, tone: str = 'professionnel') -> Optional[str]:
        """Génère un email avec Ollama"""
        
        prompt = f"""Rédige un email professionnel.

Contexte: {context}
Ton: {tone}

Format:
Objet: [objet]

[corps de l'email]

Cordialement"""

        try:
            payload = {
                "model": self.model,
                "prompt": prompt,
                "stream": False,
                "options": {
                    "temperature": 0.7,
                    "num_predict": 200,
                    "num_ctx": 1024
                }
            }
            
            response = requests.post(
                f"{self.base_url}/api/generate",
                json=payload,
                timeout=60
            )
            
            if response.status_code == 200:
                result = response.json()
                return result.get('response', '').strip()
            else:
                logger.error(f"Erreur Ollama: {response.status_code}")
                return None
                
        except Exception as e:
            logger.error(f"Erreur génération Ollama: {e}")
            return None

# Instance globale
ollama_service = OllamaService()