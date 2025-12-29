"""
Module d'intégration des modèles IA locaux avec iaPostemanage
Utilise Ollama pour l'analyse de documents et l'assistance administrative
"""

import requests
import json
from typing import Optional, Dict, List
import logging

logger = logging.getLogger(__name__)


class OllamaClient:
    """Client pour interagir avec les modèles IA locaux via Ollama"""
    
    def __init__(self, base_url: str = "http://localhost:11434"):
        self.base_url = base_url
        self.models = {
            "general": "qwen2.5:32b",        # Meilleur pour documents français
            "code": "deepseek-coder-v2:16b", # Meilleur pour code
            "fast": "mistral:7b-instruct",   # Réponses rapides
            "reasoning": "phi4",              # Raisonnement logique
            "analysis": "gemma2:9b"          # Analyse et créativité
        }
    
    def chat(self, 
             prompt: str, 
             model: str = None, 
             system: str = None,
             stream: bool = False) -> Dict:
        """
        Envoie un message au modèle IA
        
        Args:
            prompt: Le message/question à envoyer
            model: Le modèle à utiliser (par défaut: general)
            system: Instructions système pour le modèle
            stream: Si True, retourne un générateur
            
        Returns:
            Dict avec la réponse du modèle
        """
        if model is None:
            model = self.models["general"]
        
        url = f"{self.base_url}/api/generate"
        
        data = {
            "model": model,
            "prompt": prompt,
            "stream": stream
        }
        
        if system:
            data["system"] = system
        
        try:
            response = requests.post(url, json=data)
            response.raise_for_status()
            
            if stream:
                return self._handle_stream(response)
            else:
                return response.json()
                
        except requests.exceptions.RequestException as e:
            logger.error(f"Erreur lors de la communication avec Ollama: {e}")
            return {"error": str(e)}
    
    def _handle_stream(self, response):
        """Gère les réponses en streaming"""
        for line in response.iter_lines():
            if line:
                yield json.loads(line)
    
    def analyze_document(self, text: str, document_type: str = "courrier") -> Dict:
        """
        Analyse un document administratif
        
        Args:
            text: Le texte du document à analyser
            document_type: Type de document (courrier, contrat, facture, etc.)
            
        Returns:
            Dict avec l'analyse du document
        """
        system_prompt = f"""Tu es un assistant spécialisé dans l'analyse de documents administratifs français.
Tu analyses des {document_type}s et extrais les informations importantes.
Réponds toujours en français, de manière claire et structurée."""
        
        prompt = f"""Analyse ce document et extrais les informations suivantes:
1. Type de document
2. Expéditeur et destinataire
3. Date
4. Objet principal
5. Points clés
6. Actions requises
7. Échéances importantes

Document:
{text}

Fournis une analyse structurée en JSON."""
        
        response = self.chat(
            prompt=prompt,
            model=self.models["general"],
            system=system_prompt
        )
        
        return response
    
    def generate_response(self, 
                         context: str, 
                         request_type: str = "information") -> str:
        """
        Génère une réponse de courrier automatique
        
        Args:
            context: Le contexte de la demande
            request_type: Type de demande (information, réclamation, etc.)
            
        Returns:
            str: La réponse générée
        """
        system_prompt = """Tu es un assistant de rédaction pour des courriers administratifs officiels français.
Tu rédiges des réponses professionnelles, courtoises et conformes aux standards administratifs."""
        
        prompt = f"""Rédige une réponse de type '{request_type}' pour cette demande:

Contexte: {context}

La réponse doit être:
- Professionnelle et courtoise
- Claire et concise
- Conforme aux standards administratifs français
- Inclure les formules de politesse appropriées"""
        
        response = self.chat(
            prompt=prompt,
            model=self.models["general"],
            system=system_prompt
        )
        
        if "response" in response:
            return response["response"]
        return response.get("error", "Erreur de génération")
    
    def extract_entities(self, text: str) -> Dict:
        """
        Extrait les entités nommées d'un texte
        
        Args:
            text: Le texte à analyser
            
        Returns:
            Dict avec les entités extraites
        """
        prompt = f"""Extrais les entités suivantes de ce texte:
- Personnes (noms, prénoms)
- Organisations
- Lieux
- Dates
- Montants
- Références (numéros de dossier, etc.)

Texte:
{text}

Réponds en JSON avec ces catégories."""
        
        response = self.chat(
            prompt=prompt,
            model=self.models["fast"]
        )
        
        return response
    
    def summarize(self, text: str, max_sentences: int = 3) -> str:
        """
        Résume un texte
        
        Args:
            text: Le texte à résumer
            max_sentences: Nombre maximum de phrases
            
        Returns:
            str: Le résumé
        """
        prompt = f"""Résume ce texte en maximum {max_sentences} phrases claires et informatives:

{text}"""
        
        response = self.chat(
            prompt=prompt,
            model=self.models["fast"]
        )
        
        if "response" in response:
            return response["response"]
        return ""
    
    def classify_document(self, text: str) -> Dict:
        """
        Classifie un document selon son type
        
        Args:
            text: Le texte du document
            
        Returns:
            Dict avec le type et la confiance
        """
        prompt = f"""Classifie ce document parmi ces catégories:
- Courrier officiel
- Facture
- Contrat
- Réclamation
- Demande d'information
- Notification
- Attestation
- Autre

Document:
{text}

Réponds uniquement avec la catégorie (une seule) et un score de confiance entre 0 et 1 en JSON."""
        
        response = self.chat(
            prompt=prompt,
            model=self.models["analysis"]
        )
        
        return response
    
    def check_spelling(self, text: str) -> Dict:
        """
        Vérifie l'orthographe et la grammaire
        
        Args:
            text: Le texte à vérifier
            
        Returns:
            Dict avec les corrections suggérées
        """
        prompt = f"""Vérifie l'orthographe et la grammaire de ce texte français.
Liste les erreurs trouvées et propose des corrections.

Texte:
{text}

Réponds en JSON avec: {{"erreurs": [{{"position": "...", "erreur": "...", "correction": "..."}}]}}"""
        
        response = self.chat(
            prompt=prompt,
            model=self.models["general"]
        )
        
        return response
    
    def generate_code(self, description: str, language: str = "python") -> str:
        """
        Génère du code selon une description
        
        Args:
            description: Description de ce que le code doit faire
            language: Langage de programmation
            
        Returns:
            str: Le code généré
        """
        prompt = f"""Génère du code {language} pour: {description}

Fournis uniquement le code, bien commenté et suivant les bonnes pratiques."""
        
        response = self.chat(
            prompt=prompt,
            model=self.models["code"]
        )
        
        if "response" in response:
            return response["response"]
        return ""
    
    def list_models(self) -> List[str]:
        """Liste tous les modèles disponibles"""
        try:
            response = requests.get(f"{self.base_url}/api/tags")
            response.raise_for_status()
            models = response.json()
            return [m["name"] for m in models.get("models", [])]
        except Exception as e:
            logger.error(f"Erreur lors de la récupération des modèles: {e}")
            return []


# Instance globale pour faciliter l'utilisation
ollama = OllamaClient()


# Exemples d'utilisation
if __name__ == "__main__":
    # Test de connexion
    print("🔍 Test de connexion à Ollama...")
    models = ollama.list_models()
    print(f"✅ Modèles disponibles: {models}\n")
    
    # Test d'analyse de document
    print("📄 Test d'analyse de document...")
    sample_text = """
    Monsieur le Directeur,
    
    Je vous écris pour faire suite à votre courrier du 15 décembre 2025 concernant 
    ma demande d'attestation fiscale pour l'année 2024.
    
    Je souhaiterais obtenir cette attestation dans les meilleurs délais afin de 
    compléter mon dossier de déclaration d'impôts.
    
    Je vous prie d'agréer, Monsieur le Directeur, l'expression de mes salutations distinguées.
    
    Jean Dupont
    """
    
    result = ollama.summarize(sample_text, max_sentences=2)
    print(f"Résumé: {result}\n")
    
    # Test de classification
    print("🏷️ Test de classification...")
    classification = ollama.classify_document(sample_text)
    print(f"Classification: {classification}\n")
    
    # Test de génération de code
    print("💻 Test de génération de code...")
    code = ollama.generate_code("Fonction pour calculer la TVA à partir d'un montant HT")
    print(f"Code généré:\n{code}")
