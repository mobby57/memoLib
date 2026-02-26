"""
Service d'Intelligence Artificielle - AIService
Intégration avec Ollama pour analyse de dossiers, génération de documents, etc.
"""

from typing import List, Optional, Dict
import logging
import httpx

logger = logging.getLogger(__name__)


class AIService:
    """Service d'intelligence artificielle (Ollama)"""
    
    def __init__(self, base_url: str = "http://localhost:11434", model: str = "llama3.2:3b"):
        """
        Initialiser le service IA
        
        Args:
            base_url: URL du serveur Ollama
            model: Modèle à utiliser (llama3.2:3b par défaut)
        """
        self.base_url = base_url
        self.model = model
        self.available = False
        
        logger.info(f"AIService initialized with model {model}")
    
    async def check_availability(self) -> bool:
        """Vérifier si Ollama est disponible"""
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(f"{self.base_url}/api/tags", timeout=5.0)
                self.available = response.status_code == 200
                logger.info(f"Ollama disponible: {self.available}")
                return self.available
        except Exception as e:
            logger.warning(f"Ollama non disponible: {e}")
            self.available = False
            return False
    
    async def generate(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        temperature: float = 0.7
    ) -> Dict[str, any]:
        """
        Générer une réponse avec l'IA
        
        Args:
            prompt: Prompt utilisateur
            system_prompt: Instructions système (optionnel)
            temperature: Température de génération (0.0-1.0)
            
        Returns:
            Réponse de l'IA avec métadonnées
        """
        if not self.available:
            await self.check_availability()
        
        if not self.available:
            logger.warning("Ollama non disponible - réponse par défaut")
            return {
                "response": "Service IA temporairement indisponible. Veuillez réessayer plus tard.",
                "model": "fallback",
                "available": False
            }
        
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                payload = {
                    "model": self.model,
                    "prompt": prompt,
                    "stream": False,
                    "options": {
                        "temperature": temperature
                    }
                }
                
                if system_prompt:
                    payload["system"] = system_prompt
                
                response = await client.post(
                    f"{self.base_url}/api/generate",
                    json=payload
                )
                
                if response.status_code == 200:
                    data = response.json()
                    return {
                        "response": data.get("response", ""),
                        "model": self.model,
                        "available": True,
                        "done": data.get("done", True)
                    }
                else:
                    logger.error(f"Erreur Ollama: {response.status_code}")
                    return {
                        "response": "Erreur lors de la génération.",
                        "model": "error",
                        "available": False
                    }
                    
        except Exception as e:
            logger.error(f"Erreur lors de la génération IA: {e}")
            return {
                "response": f"Erreur technique: {str(e)}",
                "model": "error",
                "available": False
            }
    
    async def analyze_dossier(self, dossier_data: Dict) -> Dict[str, any]:
        """
        Analyser un dossier CESEDA avec l'IA
        
        Args:
            dossier_data: Données du dossier à analyser
            
        Returns:
            Analyse complète avec recommandations
        """
        logger.info(f"Analyse IA du dossier {dossier_data.get('numero', 'N/A')}")
        
        system_prompt = """Tu es un assistant juridique spécialisé en droit des étrangers (CESEDA).
Analyse le dossier fourni et fournis:
1. Les points forts du dossier
2. Les risques identifiés
3. Les recommandations stratégiques
4. Les délais critiques à surveiller

Sois précis et professionnel."""
        
        prompt = f"""Analyse ce dossier CESEDA:
Type: {dossier_data.get('typeDossier', 'Non spécifié')}
Statut: {dossier_data.get('statut', 'Non spécifié')}
Priorité: {dossier_data.get('priorite', 'Non spécifié')}
Échéance: {dossier_data.get('dateEcheance', 'Non spécifié')}
Description: {dossier_data.get('description', 'Aucune description')}

Fournis une analyse structurée."""
        
        result = await self.generate(prompt, system_prompt)
        
        return {
            "dossier_id": dossier_data.get("id"),
            "analysis": result.get("response", ""),
            "model": result.get("model"),
            "confidence": 0.8 if result.get("available") else 0.0,
            "timestamp": "2026-01-20T12:00:00Z"
        }
    
    async def generate_document_draft(
        self,
        document_type: str,
        context: Dict
    ) -> Dict[str, any]:
        """
        Générer un brouillon de document juridique
        
        Args:
            document_type: Type de document (recours, courrier, etc.)
            context: Contexte pour la génération
            
        Returns:
            Brouillon généré avec métadonnées
        """
        logger.info(f"Génération document type: {document_type}")
        
        system_prompt = """Tu es un assistant juridique spécialisé en droit des étrangers.
Génère un brouillon professionnel de document juridique.
Respecte les formules de politesse et le ton formel.
Mentionne les articles de loi pertinents (CESEDA).
NE JAMAIS donner de conseil juridique définitif sans validation humaine."""
        
        prompt = f"""Génère un brouillon de {document_type} avec ce contexte:
{context}

Structure le document de manière professionnelle."""
        
        result = await self.generate(prompt, system_prompt, temperature=0.5)
        
        return {
            "document_type": document_type,
            "draft": result.get("response", ""),
            "status": "draft",
            "requires_validation": True,
            "validation_level": "REINFORCED",
            "timestamp": "2026-01-20T12:00:00Z"
        }
    
    async def suggest_actions(self, dossier_data: Dict) -> List[Dict]:
        """
        Suggérer des actions pour un dossier
        
        Args:
            dossier_data: Données du dossier
            
        Returns:
            Liste d'actions suggérées
        """
        logger.info("Génération de suggestions d'actions")
        
        # TODO: Utiliser l'IA pour suggestions intelligentes
        # Pour l'instant, règles simples
        suggestions = []
        
        if dossier_data.get("typeDossier") == "OQTF":
            suggestions.append({
                "action": "VERIFIER_DELAI_RECOURS",
                "priority": "critical",
                "description": "Vérifier le délai de recours contentieux (48h ou 30j)",
                "deadline": "urgent"
            })
        
        if not dossier_data.get("dateEcheance"):
            suggestions.append({
                "action": "DEFINIR_ECHEANCE",
                "priority": "high",
                "description": "Définir une échéance pour le dossier",
                "deadline": "7j"
            })
        
        return suggestions
    
    def get_status(self) -> Dict[str, any]:
        """Obtenir le statut du service"""
        return {
            "service": "AIService",
            "status": "operational" if self.available else "degraded",
            "model": self.model,
            "base_url": self.base_url,
            "available": self.available
        }
