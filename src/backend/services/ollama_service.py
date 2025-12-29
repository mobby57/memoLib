"""
Service d'intégration Ollama pour IAPosteManager
Interface avec llama3, whisper, nomic-embed-text
"""
import httpx
import json
from typing import Optional, List, Dict, Any
from src.backend.config_fastapi import settings


class OllamaService:
    """Service d'interface avec Ollama pour tous les modèles"""
    
    def __init__(self):
        self.base_url = settings.OLLAMA_HOST
        self.model_llm = settings.OLLAMA_MODEL_LLM
        self.model_whisper = settings.OLLAMA_MODEL_WHISPER
        self.model_embed = settings.OLLAMA_MODEL_EMBED
        
    async def test_connexion(self) -> Dict[str, bool]:
        """Tester la connexion à Ollama et les modèles"""
        async with httpx.AsyncClient() as client:
            try:
                response = await client.get(f"{self.base_url}/api/tags")
                if response.status_code == 200:
                    models = response.json().get("models", [])
                    model_names = [m["name"] for m in models]
                    
                    return {
                        "ollama_running": True,
                        "llama3": self.model_llm in model_names,
                        "whisper": self.model_whisper in model_names,
                        "embed": self.model_embed in model_names
                    }
            except Exception as e:
                return {
                    "ollama_running": False,
                    "error": str(e)
                }
    
    async def generate_text(
        self, 
        prompt: str, 
        system_prompt: Optional[str] = None,
        temperature: float = 0.7,
        max_tokens: int = 2000
    ) -> str:
        """Génération de texte avec llama3"""
        async with httpx.AsyncClient(timeout=120.0) as client:
            payload = {
                "model": self.model_llm,
                "prompt": prompt,
                "stream": False,
                "options": {
                    "temperature": temperature,
                    "num_predict": max_tokens
                }
            }
            
            if system_prompt:
                payload["system"] = system_prompt
            
            response = await client.post(
                f"{self.base_url}/api/generate",
                json=payload
            )
            
            if response.status_code == 200:
                return response.json()["response"]
            else:
                raise Exception(f"Ollama error: {response.status_code}")
    
    async def generate_structured(
        self,
        prompt: str,
        system_prompt: str,
        format_json: bool = True
    ) -> Dict[str, Any]:
        """Génération avec sortie JSON structurée"""
        if format_json:
            prompt = f"{prompt}\n\nRéponds UNIQUEMENT avec un JSON valide."
        
        response = await self.generate_text(prompt, system_prompt)
        
        try:
            # Nettoyer la réponse pour extraire le JSON
            json_start = response.find('{')
            json_end = response.rfind('}') + 1
            json_str = response[json_start:json_end]
            return json.loads(json_str)
        except json.JSONDecodeError:
            # Fallback si pas de JSON
            return {"raw_response": response}
    
    async def analyze_document(self, texte: str) -> Dict[str, Any]:
        """Analyser un document avec le prompt maître"""
        system_prompt = """Tu es un assistant administratif professionnel expert.
Tu analyses des documents officiels et extrais des informations structurées."""
        
        prompt = f"""Analyse ce document et extrais ces informations en JSON :
{{
  "type_document": "courrier_officiel | facture | notification | autre",
  "organisme": "nom de l'organisme émetteur",
  "sujet": "sujet principal",
  "date_limite": "YYYY-MM-DD ou null",
  "urgence": 1-5,
  "actions_requises": ["action1", "action2"],
  "montant": nombre ou null,
  "confiance": 0.0-1.0
}}

Document:
{texte}

JSON:"""
        
        return await self.generate_structured(prompt, system_prompt)
    
    async def generate_email(
        self,
        contexte: str,
        instruction: str,
        variante: str = "standard"
    ) -> Dict[str, str]:
        """Générer un email selon une variante"""
        
        tone_instructions = {
            "formel": "Rédige un email très formel, professionnel, avec formules de politesse complètes",
            "standard": "Rédige un email professionnel standard, courtois mais pas trop formel",
            "simple": "Rédige un email simple, direct, phrases courtes et claires"
        }
        
        system_prompt = f"""Tu es un assistant de rédaction d'emails administratifs.
{tone_instructions.get(variante, tone_instructions['standard'])}"""
        
        prompt = f"""Contexte: {contexte}

Demande de l'utilisateur: {instruction}

Rédige l'email complet avec:
1. Un sujet clair
2. Le corps de l'email
3. Une signature appropriée

Format JSON:
{{
  "sujet": "...",
  "corps": "...",
  "explication": "pourquoi ce choix de formulation"
}}"""
        
        return await self.generate_structured(prompt, system_prompt)
    
    async def generate_3_email_variants(
        self,
        contexte: str,
        instruction: str
    ) -> List[Dict[str, str]]:
        """Générer les 3 variantes d'emails"""
        variants = []
        for variante in ["formel", "standard", "simple"]:
            email = await self.generate_email(contexte, instruction, variante)
            email["variante"] = variante
            variants.append(email)
        return variants
    
    async def transcribe_audio(self, audio_path: str) -> Dict[str, Any]:
        """Transcrire un fichier audio avec Whisper"""
        # Note: Ollama Whisper nécessite une implémentation spécifique
        # Pour l'instant, retour placeholder
        return {
            "texte": "Transcription placeholder - implémenter Whisper API",
            "langue": "fr",
            "confiance": 0.95,
            "duree_secondes": 0.0
        }
    
    async def generate_embeddings(self, texts: List[str]) -> List[List[float]]:
        """Générer des embeddings avec nomic-embed-text"""
        embeddings = []
        
        async with httpx.AsyncClient() as client:
            for text in texts:
                response = await client.post(
                    f"{self.base_url}/api/embeddings",
                    json={
                        "model": self.model_embed,
                        "prompt": text
                    }
                )
                
                if response.status_code == 200:
                    embeddings.append(response.json()["embedding"])
        
        return embeddings
    
    async def simplify_text(self, texte: str) -> str:
        """Simplifier un texte complexe en langage simple"""
        system_prompt = """Tu es un expert en simplification de texte.
Traduis les textes complexes en langage simple, accessible à tous."""
        
        prompt = f"""Simplifie ce texte:
- Phrases courtes
- Mots simples
- Pas de jargon
- Garde le sens exact

Texte original:
{texte}

Version simplifiée:"""
        
        return await self.generate_text(prompt, system_prompt)
    
    async def explain_decision(self, decision: str, context: str) -> str:
        """Expliquer une décision de l'IA de manière transparente"""
        system_prompt = "Tu expliques clairement pourquoi tu as pris une décision."
        
        prompt = f"""Contexte: {context}

Décision prise: {decision}

Explique en 2-3 phrases simples POURQUOI tu as fait ce choix."""
        
        return await self.generate_text(prompt, system_prompt, temperature=0.5)


# Instance globale
ollama_service = OllamaService()
