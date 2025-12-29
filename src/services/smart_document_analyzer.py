"""
🤖 Service d'Analyse Intelligente de Documents avec IA Locale (Ollama)
Extrait automatiquement délais, urgences et génère TODOs/Notifications
"""
import httpx
import json
import re
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
from enum import Enum


class UrgencyLevel(str, Enum):
    LOW = "faible"
    MEDIUM = "moyenne"
    HIGH = "haute"
    CRITICAL = "critique"


class DocumentType(str, Enum):
    AMENDE = "amende"
    IMPOTS = "impots"
    FACTURE = "facture"
    COURRIER_OFFICIEL = "courrier_officiel"
    JURIDIQUE = "juridique"
    ADMINISTRATIF = "administratif"
    AUTRE = "autre"


class SmartDocumentAnalyzer:
    """Analyseur de documents avec Ollama pour extraction automatique"""
    
    def __init__(self, ollama_url: str = "http://localhost:11434"):
        self.ollama_url = ollama_url
        self.model = "llama3"
    
    async def analyze_document(self, document_text: str, metadata: Optional[Dict] = None) -> Dict[str, Any]:
        """
        Analyse complète d'un document officiel
        
        Returns:
            {
                "type": DocumentType,
                "emetteur": str,
                "reference": str,
                "montant": float | None,
                "date_limite": str (ISO),
                "delai_jours": int,
                "objet": str,
                "action_requise": str,
                "urgence": UrgencyLevel,
                "todos": [{"task": str, "deadline": str, "priority": str}],
                "notifications": [{"type": str, "message": str, "alert_date": str}],
                "pieces_jointes_requises": [str],
                "risques": [str],
                "conseils": [str]
            }
        """
        
        # Prompt ULTRA-CONCIS pour vitesse maximale
        prompt = f"""Analyse ce document administratif français et extrais en JSON:

DOCUMENT:
{document_text[:1500]}  # Limite à 1500 chars pour vitesse

JSON (STRICT):
{{
  "type_document": "amende|impots|facture|courrier_officiel|juridique|administratif|autre",
  "emetteur": "organisme",
  "reference": "numéro",
  "montant": number|null,
  "date_limite": "YYYY-MM-DD"|null,
  "objet": "résumé court",
  "action_requise": "action concrète",
  "urgence": "faible|moyenne|haute|critique",
  "pieces_jointes_requises": ["liste"],
  "risques": ["liste"],
  "conseils": ["liste"]
}}

Réponds UNIQUEMENT avec le JSON, rien d'autre."""

        # Appel à Ollama
        analysis = await self._call_ollama(prompt)
        
        # Post-traitement et enrichissement
        enriched = await self._enrich_analysis(analysis, document_text)
        
        return enriched
    
    async def _call_ollama(self, prompt: str, temperature: float = 0.1) -> Dict[str, Any]:
        """Appelle Ollama pour génération structurée (OPTIMISÉ VITESSE)"""
        async with httpx.AsyncClient(timeout=45.0) as client:  # Réduit de 120s à 45s
            payload = {
                "model": self.model,
                "prompt": prompt,
                "stream": False,
                "format": "json",  # Force JSON output
                "options": {
                    "temperature": temperature,  # 0.1 = plus rapide
                    "num_predict": 1000,  # Réduit de 2000 à 1000
                    "num_ctx": 2048,  # Limite contexte
                    "top_k": 10,  # Réduit pour vitesse
                    "top_p": 0.9
                }
            }
            
            try:
                response = await client.post(
                    f"{self.ollama_url}/api/generate",
                    json=payload
                )
                
                if response.status_code == 200:
                    result = response.json()
                    response_text = result.get("response", "{}")
                    
                    # Extraire JSON proprement
                    return self._extract_json(response_text)
                else:
                    raise Exception(f"Ollama error: {response.status_code}")
                    
            except Exception as e:
                print(f"❌ Erreur Ollama: {e}")
                return self._fallback_analysis()
    
    def _extract_json(self, text: str) -> Dict[str, Any]:
        """Extrait JSON proprement du texte"""
        try:
            # Essayer de parser directement
            return json.loads(text)
        except json.JSONDecodeError:
            # Chercher le JSON dans le texte
            json_match = re.search(r'\{.*\}', text, re.DOTALL)
            if json_match:
                try:
                    return json.loads(json_match.group())
                except:
                    pass
            
            return self._fallback_analysis()
    
    async def _enrich_analysis(self, analysis: Dict[str, Any], document_text: str) -> Dict[str, Any]:
        """Enrichit l'analyse avec TODOs, notifications et calculs"""
        
        # Calculer délai en jours
        date_limite = analysis.get("date_limite")
        delai_jours = None
        
        if date_limite:
            try:
                deadline = datetime.fromisoformat(date_limite)
                now = datetime.now()
                delai_jours = (deadline - now).days
            except:
                delai_jours = None
        
        # Générer TODOs automatiques
        todos = self._generate_todos(analysis, delai_jours)
        
        # Générer notifications
        notifications = self._generate_notifications(analysis, delai_jours)
        
        # Score de risque
        risk_score = self._calculate_risk_score(analysis, delai_jours)
        
        return {
            "type": analysis.get("type_document", "autre"),
            "emetteur": analysis.get("emetteur", "Non identifié"),
            "reference": analysis.get("reference", "N/A"),
            "montant": analysis.get("montant"),
            "date_limite": date_limite,
            "delai_jours": delai_jours,
            "objet": analysis.get("objet", ""),
            "action_requise": analysis.get("action_requise", ""),
            "urgence": analysis.get("urgence", UrgencyLevel.MEDIUM),
            "todos": todos,
            "notifications": notifications,
            "pieces_jointes_requises": analysis.get("pieces_jointes_requises", []),
            "risques": analysis.get("risques", []),
            "conseils": analysis.get("conseils", []),
            "risk_score": risk_score,
            "analyzed_at": datetime.now().isoformat()
        }
    
    def _generate_todos(self, analysis: Dict, delai_jours: Optional[int]) -> List[Dict]:
        """Génère automatiquement les TODOs basés sur l'analyse"""
        todos = []
        
        # TODO 1: Action principale
        action = analysis.get("action_requise", "")
        if action:
            deadline_str = analysis.get("date_limite", "")
            priority = self._map_urgency_to_priority(analysis.get("urgence", "moyenne"))
            
            todos.append({
                "id": f"todo_{datetime.now().timestamp()}",
                "task": action,
                "deadline": deadline_str,
                "priority": priority,
                "status": "pending",
                "created_at": datetime.now().isoformat()
            })
        
        # TODO 2: Rassembler pièces justificatives
        pieces = analysis.get("pieces_jointes_requises", [])
        if pieces:
            # Deadline 2-3 jours avant la deadline principale
            if delai_jours and delai_jours > 3:
                prep_deadline = (datetime.now() + timedelta(days=delai_jours - 3)).date().isoformat()
            else:
                prep_deadline = analysis.get("date_limite", "")
            
            todos.append({
                "id": f"todo_{datetime.now().timestamp() + 1}",
                "task": f"Rassembler les pièces justificatives: {', '.join(pieces)}",
                "deadline": prep_deadline,
                "priority": "high",
                "status": "pending",
                "created_at": datetime.now().isoformat()
            })
        
        # TODO 3: Vérification si montant à payer
        montant = analysis.get("montant")
        if montant:
            todos.append({
                "id": f"todo_{datetime.now().timestamp() + 2}",
                "task": f"Prévoir le paiement de {montant}€",
                "deadline": analysis.get("date_limite", ""),
                "priority": "high",
                "status": "pending",
                "created_at": datetime.now().isoformat()
            })
        
        return todos
    
    def _generate_notifications(self, analysis: Dict, delai_jours: Optional[int]) -> List[Dict]:
        """Génère les notifications d'alerte basées sur les délais"""
        notifications = []
        
        if not delai_jours:
            return notifications
        
        urgence = analysis.get("urgence", "moyenne")
        date_limite = analysis.get("date_limite")
        
        # Notification CRITIQUE si délai < 3 jours
        if delai_jours <= 3:
            notifications.append({
                "type": "critical",
                "message": f"⚠️ URGENT: Il reste seulement {delai_jours} jour(s) pour {analysis.get('action_requise', 'agir')}",
                "alert_date": datetime.now().isoformat(),
                "priority": "immediate"
            })
        
        # Notification WARNING si délai < 7 jours
        elif delai_jours <= 7:
            notifications.append({
                "type": "warning",
                "message": f"⚡ Attention: Il reste {delai_jours} jours avant la deadline du {date_limite}",
                "alert_date": datetime.now().isoformat(),
                "priority": "high"
            })
        
        # Notification INFO si délai < 14 jours
        elif delai_jours <= 14:
            notifications.append({
                "type": "info",
                "message": f"📅 Rappel: Deadline dans {delai_jours} jours ({date_limite})",
                "alert_date": datetime.now().isoformat(),
                "priority": "medium"
            })
        
        # Notification de risques si présents
        risques = analysis.get("risques", [])
        if risques:
            notifications.append({
                "type": "warning",
                "message": f"⚠️ Risques identifiés: {'; '.join(risques[:2])}",
                "alert_date": datetime.now().isoformat(),
                "priority": "high"
            })
        
        return notifications
    
    def _calculate_risk_score(self, analysis: Dict, delai_jours: Optional[int]) -> int:
        """Calcule un score de risque 0-100"""
        score = 0
        
        # Urgence
        urgence_scores = {
            "critique": 40,
            "haute": 30,
            "moyenne": 15,
            "faible": 5
        }
        score += urgence_scores.get(analysis.get("urgence", "moyenne"), 15)
        
        # Délai
        if delai_jours is not None:
            if delai_jours <= 2:
                score += 35
            elif delai_jours <= 7:
                score += 25
            elif delai_jours <= 14:
                score += 15
            else:
                score += 5
        else:
            score += 10  # Incertain = risque moyen
        
        # Risques identifiés
        risques_count = len(analysis.get("risques", []))
        score += min(risques_count * 5, 15)
        
        # Montant
        montant = analysis.get("montant", 0)
        if montant:
            if montant > 1000:
                score += 10
            elif montant > 500:
                score += 5
        
        return min(score, 100)
    
    def _map_urgency_to_priority(self, urgence: str) -> str:
        """Mappe l'urgence vers priorité TODO"""
        mapping = {
            "critique": "critical",
            "haute": "high",
            "moyenne": "medium",
            "faible": "low"
        }
        return mapping.get(urgence, "medium")
    
    def _fallback_analysis(self) -> Dict[str, Any]:
        """Analyse de fallback si Ollama échoue"""
        return {
            "type_document": "autre",
            "emetteur": "Non identifié",
            "reference": "N/A",
            "montant": None,
            "date_limite": None,
            "objet": "Analyse automatique indisponible",
            "action_requise": "Analyser manuellement le document",
            "urgence": "moyenne",
            "pieces_jointes_requises": [],
            "risques": ["Analyse automatique échouée"],
            "conseils": ["Vérifier manuellement le document"]
        }


# Instance globale
smart_document_analyzer = SmartDocumentAnalyzer()
