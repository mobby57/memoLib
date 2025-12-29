import openai
import requests
import os
import json
from typing import Dict, List, Optional
from datetime import datetime

class AIService:
    def __init__(self):
        self.provider = os.getenv('AI_PROVIDER', 'ollama')
        self.openai_client = None
        self.ollama_url = os.getenv('OLLAMA_BASE_URL', 'http://localhost:11434')
        
        if self.provider == 'openai':
            api_key = os.getenv('OPENAI_API_KEY')
            if api_key:
                openai.api_key = api_key
                self.openai_client = openai
    
    async def generate_email(self, prompt: str, context: Dict = None) -> Dict:
        """Générer un email avec l'IA"""
        try:
            if self.provider == 'openai' and self.openai_client:
                return await self._generate_openai(prompt, context)
            else:
                return await self._generate_ollama(prompt, context)
        except Exception as e:
            return {
                'content': f"Erreur de génération: {str(e)}",
                'tokens_used': 0,
                'provider': self.provider,
                'error': True
            }
    
    async def _generate_openai(self, prompt: str, context: Dict = None) -> Dict:
        """Génération avec OpenAI"""
        system_prompt = """Tu es un assistant expert en rédaction d'emails professionnels.
        Génère des emails clairs, polis et efficaces selon le contexte fourni.
        Réponds uniquement avec le contenu de l'email, sans explications supplémentaires."""
        
        if context:
            system_prompt += f"\nContexte: {json.dumps(context, ensure_ascii=False)}"
        
        try:
            response = await self.openai_client.ChatCompletion.acreate(
                model="gpt-4",
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=1000,
                temperature=0.7
            )
            
            content = response.choices[0].message.content
            tokens_used = response.usage.total_tokens
            
            return {
                'content': content,
                'tokens_used': tokens_used,
                'provider': 'openai',
                'model': 'gpt-4',
                'generated_at': datetime.now().isoformat()
            }
            
        except Exception as e:
            raise Exception(f"Erreur OpenAI: {str(e)}")
    
    async def _generate_ollama(self, prompt: str, context: Dict = None) -> Dict:
        """Génération avec Ollama (local)"""
        model = os.getenv('OLLAMA_MODEL', 'llama3.1:8b')
        
        system_prompt = """Tu es un assistant expert en rédaction d'emails professionnels.
        Génère des emails clairs, polis et efficaces selon le contexte fourni.
        Réponds uniquement avec le contenu de l'email, sans explications supplémentaires."""
        
        if context:
            system_prompt += f"\nContexte: {json.dumps(context, ensure_ascii=False)}"
        
        full_prompt = f"{system_prompt}\n\nDemande: {prompt}"
        
        try:
            response = requests.post(
                f"{self.ollama_url}/api/generate",
                json={
                    "model": model,
                    "prompt": full_prompt,
                    "stream": False,
                    "options": {
                        "temperature": 0.7,
                        "top_p": 0.9
                    }
                },
                timeout=60
            )
            
            if response.status_code == 200:
                result = response.json()
                return {
                    'content': result.get('response', ''),
                    'tokens_used': result.get('eval_count', 0),
                    'provider': 'ollama',
                    'model': model,
                    'generated_at': datetime.now().isoformat()
                }
            else:
                raise Exception(f"Erreur Ollama: {response.status_code}")
                
        except requests.exceptions.RequestException as e:
            raise Exception(f"Connexion Ollama impossible: {str(e)}")
    
    async def enhance_email(self, content: str, style: str = "professionnel") -> Dict:
        """Améliorer un email existant"""
        prompt = f"""Améliore cet email pour le rendre plus {style}:

Email original:
{content}

Améliore le style, la clarté et l'efficacité tout en gardant le message principal."""
        
        return await self.generate_email(prompt)
    
    async def translate_email(self, content: str, target_language: str = "français") -> Dict:
        """Traduire un email"""
        prompt = f"""Traduis cet email en {target_language} en gardant le ton professionnel:

{content}"""
        
        return await self.generate_email(prompt)
    
    async def generate_response(self, original_email: str, response_type: str = "positive") -> Dict:
        """Générer une réponse à un email"""
        prompt = f"""Génère une réponse {response_type} à cet email:

Email reçu:
{original_email}

Génère une réponse appropriée et professionnelle."""
        
        return await self.generate_email(prompt)
    
    def get_available_models(self) -> List[str]:
        """Obtenir la liste des modèles disponibles"""
        if self.provider == 'ollama':
            try:
                response = requests.get(f"{self.ollama_url}/api/tags")
                if response.status_code == 200:
                    models = response.json().get('models', [])
                    return [model['name'] for model in models]
            except:
                pass
            return ['llama3.1:8b']
        else:
            return ['gpt-4', 'gpt-3.5-turbo']