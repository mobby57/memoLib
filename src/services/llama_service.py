"""
Llama 3.1 Local Service - Alternative GRATUITE à OpenAI
Utilise Ollama pour exécuter Llama 3.1 localement
"""

import os
import json
import requests
from typing import Optional, Dict, Any
from functools import lru_cache


class LlamaService:
    """Service pour génération de contenu avec Llama 3.1 via Ollama"""
    
    def __init__(self):
        self.base_url = os.getenv('OLLAMA_BASE_URL', 'http://localhost:11434')
        self.model = os.getenv('LLAMA_MODEL', 'llama3.1:8b')
        self.timeout = int(os.getenv('LLAMA_TIMEOUT', '120'))  # Augmenté à 2 minutes
        
        # Optimisations de performance
        self.default_options = {
            "temperature": 0.7,
            "top_p": 0.9,
            "top_k": 40,
            "num_ctx": 2048,  # Contexte réduit pour plus de vitesse
            "num_predict": 500,  # Limite les tokens générés
            "repeat_penalty": 1.1,
            "seed": -1,
            "tfs_z": 1.0,
            "num_thread": -1  # Utilise tous les CPU disponibles
        }
        
    def is_available(self) -> bool:
        """Vérifie si Ollama est disponible"""
        try:
            response = requests.get(f"{self.base_url}/api/tags", timeout=5)
            return response.status_code == 200
        except (requests.RequestException, Exception):
            return False
    
    def list_models(self) -> list:
        """Liste les modèles disponibles dans Ollama"""
        try:
            response = requests.get(f"{self.base_url}/api/tags", timeout=5)
            if response.status_code == 200:
                data = response.json()
                return [model['name'] for model in data.get('models', [])]
            return []
        except requests.RequestException:
            return []
    
    @lru_cache(maxsize=100)
    def generate_email(
        self, 
        context: str, 
        tone: str = "professionnel",
        max_tokens: int = 500
    ) -> Optional[str]:
        """
        Génère un email avec Llama 3.1 - VERSION OPTIMISÉE
        
        Args:
            context: Contexte/sujet de l'email
            tone: Ton de l'email (professionnel, formel, amical)
            max_tokens: Nombre maximum de tokens
            
        Returns:
            Email généré ou None si erreur
        """
        prompt = self._build_prompt(context, tone)
        
        # Options optimisées pour la vitesse
        options = self.default_options.copy()
        options["num_predict"] = min(max_tokens, 500)  # Limiter pour plus de vitesse
        
        try:
            print(f"🚀 Génération Llama en cours... (modèle: {self.model})")
            
            response = requests.post(
                f"{self.base_url}/api/generate",
                json={
                    "model": self.model,
                    "prompt": prompt,
                    "stream": False,
                    "options": options
                },
                timeout=self.timeout
            )
            
            if response.status_code == 200:
                result = response.json()
                generated_text = self._clean_response(result.get('response', ''))
                print(f"✅ Email généré avec succès ({len(generated_text)} caractères)")
                return generated_text
            else:
                print(f"❌ Erreur Llama: {response.status_code} - {response.text}")
                return None
                
        except requests.RequestException as e:
            print(f"❌ Erreur de connexion Llama: {e}")
            return None
    
    def generate_email_streaming(
        self,
        context: str,
        tone: str = "professionnel",
        max_tokens: int = 500
    ):
        """
        Génère un email en mode streaming (pour interface temps réel)
        
        Yields:
            Morceaux de texte au fur et à mesure de la génération
        """
        prompt = self._build_prompt(context, tone)
        
        try:
            response = requests.post(
                f"{self.base_url}/api/generate",
                json={
                    "model": self.model,
                    "prompt": prompt,
                    "stream": True,
                    "options": {
                        "temperature": 0.7,
                        "num_predict": max_tokens,
                        "top_p": 0.9,
                        "top_k": 40
                    }
                },
                stream=True,
                timeout=self.timeout
            )
            
            for line in response.iter_lines():
                if line:
                    try:
                        data = json.loads(line)
                        if 'response' in data:
                            yield data['response']
                    except json.JSONDecodeError:
                        continue
                        
        except requests.RequestException as e:
            print(f"Erreur streaming Llama: {e}")
            yield None
    
    def _build_prompt(self, context: str, tone: str) -> str:
        """Construit le prompt pour Llama"""
        tone_instructions = {
            "professionnel": "Utilise un ton professionnel et courtois.",
            "formel": "Utilise un ton très formel et respectueux, avec vouvoiement.",
            "amical": "Utilise un ton amical et chaleureux, tout en restant professionnel.",
            "urgent": "Utilise un ton urgent mais professionnel.",
            "persuasif": "Utilise un ton persuasif et convaincant."
        }
        
        instruction = tone_instructions.get(tone.lower(), tone_instructions["professionnel"])
        
        return f"""Tu es un assistant expert en rédaction d'emails professionnels.

Contexte: {context}

Instructions:
- {instruction}
- Rédige un email complet avec objet, salutation, corps et signature
- Structure claire avec paragraphes
- Longueur: 150-300 mots
- Format professionnel français

Email:"""
    
    def _clean_response(self, response: str) -> str:
        """Nettoie la réponse de Llama"""
        # Enlever les préfixes/suffixes inutiles
        response = response.strip()
        
        # Enlever les balises markdown si présentes
        if response.startswith('```'):
            lines = response.split('\n')
            response = '\n'.join(lines[1:-1]) if len(lines) > 2 else response
        
        return response
    
    def get_model_info(self) -> Dict[str, Any]:
        """Récupère les infos sur le modèle actuel"""
        try:
            response = requests.post(
                f"{self.base_url}/api/show",
                json={"name": self.model},
                timeout=5
            )
            if response.status_code == 200:
                return response.json()
            return {}
        except requests.RequestException:
            return {}
    
    def pull_model(self, model_name: str = None) -> bool:
        """
        Télécharge un modèle Llama si pas déjà présent
        
        Args:
            model_name: Nom du modèle (par défaut: llama3.1:8b)
            
        Returns:
            True si succès, False sinon
        """
        model = model_name or self.model
        
        try:
            print(f"Téléchargement du modèle {model}...")
            response = requests.post(
                f"{self.base_url}/api/pull",
                json={"name": model},
                stream=True,
                timeout=600  # 10 minutes pour téléchargement
            )
            
            for line in response.iter_lines():
                if line:
                    try:
                        data = json.loads(line)
                        status = data.get('status', '')
                        if 'completed' in status.lower():
                            print(f"✅ {model} téléchargé avec succès")
                            return True
                        elif status:
                            print(f"📥 {status}")
                    except json.JSONDecodeError:
                        continue
            
            return True
            
        except (requests.RequestException, Exception) as e:
            print(f"❌ Erreur téléchargement: {e}")
            return False


# Instance globale
llama_service = LlamaService()


# Fonction de compatibilité avec OpenAI service
def generate_email_content(context: str, tone: str = "professionnel") -> Optional[str]:
    """
    Fonction compatible avec l'interface openai_service
    Permet de remplacer OpenAI par Llama sans changer le code
    """
    return llama_service.generate_email(context, tone)


if __name__ == "__main__":
    # Test rapide
    service = LlamaService()
    
    print("🔍 Vérification Ollama...")
    if service.is_available():
        print("✅ Ollama disponible")
        print(f"📦 Modèles installés: {service.list_models()}")
        
        # Test génération
        print("\n🧪 Test génération email...")
        email = service.generate_email(
            context="Demande de congés pour la semaine prochaine",
            tone="professionnel"
        )
        if email:
            print("\n✅ Email généré:")
            print("-" * 50)
            print(email)
            print("-" * 50)
        else:
            print("❌ Échec génération")
    else:
        print("❌ Ollama non disponible")
        print("💡 Installez Ollama: https://ollama.ai/download")
