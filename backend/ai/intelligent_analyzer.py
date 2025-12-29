"""
Module IntelligentAnalyzer - Analyse avancée d'emails avec IA
Propriété: MS CONSEILS - Sarra Boudjellal
Version: 2.3 Production Ready
"""

import openai
import spacy
import re
import json
import logging
from datetime import datetime
from typing import Dict, List, Tuple, Optional, Any
from dataclasses import dataclass
import hashlib
import asyncio
from concurrent.futures import ThreadPoolExecutor
import time

@dataclass
class AnalysisResult:
    """Structure de résultat d'analyse"""
    sentiment: float
    urgency: str
    category: str
    language: str
    entities: List[Dict]
    complexity: int
    keywords: List[str]
    suggested_response_tone: str
    confidence_score: float
    processing_time: float

class EmailAnalyzer:
    """Analyseur intelligent d'emails avec IA OpenAI et modèles locaux"""
    
    def __init__(self, openai_key: str, model: str = "gpt-4"):
        self.client = openai.OpenAI(api_key=openai_key)
        self.model = model
        self.logger = self._setup_logger()
        
        # Chargement des modèles locaux
        try:
            self.nlp = spacy.load("fr_core_news_sm")
        except OSError:
            self.logger.warning("Modèle spaCy français non trouvé, utilisation du modèle anglais")
            self.nlp = spacy.load("en_core_web_sm")
        
        # Cache pour optimiser les performances
        self.analysis_cache = {}
        self.cache_ttl = 3600  # 1 heure
        
        # Patterns de détection avancés
        self.patterns = {
            "urgency_indicators": {
                "critical": ["urgent", "critique", "immédiat", "asap", "emergency"],
                "high": ["important", "priorité", "rapidement", "vite"],
                "normal": ["normal", "standard", "habituel"],
                "low": ["quand possible", "pas urgent", "à votre convenance"]
            },
            "sentiment_indicators": {
                "positive": ["merci", "excellent", "parfait", "satisfait", "content"],
                "negative": ["problème", "erreur", "bug", "mécontent", "déçu", "frustré"],
                "neutral": ["information", "question", "demande", "besoin"]
            },
            "category_indicators": {
                "support": ["aide", "problème", "bug", "erreur", "panne", "dysfonctionnement"],
                "commercial": ["devis", "prix", "tarif", "achat", "commande", "vente"],
                "complaint": ["plainte", "réclamation", "insatisfait", "remboursement"],
                "request": ["demande", "besoin", "souhaite", "voudrais", "pourrais"],
                "info": ["information", "renseignement", "question", "clarification"]
            }
        }
    
    def _setup_logger(self) -> logging.Logger:
        """Configure le logging pour l'analyseur"""
        logger = logging.getLogger("email_analyzer")
        logger.setLevel(logging.INFO)
        
        if not logger.handlers:
            handler = logging.StreamHandler()
            formatter = logging.Formatter(
                '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
            )
            handler.setFormatter(formatter)
            logger.addHandler(handler)
        
        return logger
    
    def analyze_content(self, email_text: str, attachments: List = None, metadata: Dict = None) -> Dict:
        """
        Analyse complète du contenu email avec IA
        
        Args:
            email_text: Contenu textuel de l'email
            attachments: Liste des pièces jointes
            metadata: Métadonnées additionnelles
        
        Returns:
            Dict avec analyse complète
        """
        start_time = time.time()
        
        try:
            # Vérification du cache
            cache_key = self._generate_cache_key(email_text)
            if cache_key in self.analysis_cache:
                cached_result = self.analysis_cache[cache_key]
                if time.time() - cached_result['timestamp'] < self.cache_ttl:
                    self.logger.info("Résultat d'analyse récupéré du cache")
                    return cached_result['result']
            
            # Analyse locale rapide
            local_analysis = self._local_analysis(email_text)
            
            # Analyse IA avancée
            ai_analysis = self._ai_analysis(email_text)
            
            # Analyse des entités avec spaCy
            entities_analysis = self._extract_entities(email_text)
            
            # Analyse des pièces jointes si présentes
            attachments_analysis = self._analyze_attachments(attachments) if attachments else {}
            
            # Fusion des résultats
            combined_result = self._combine_analyses(
                local_analysis, ai_analysis, entities_analysis, attachments_analysis
            )
            
            # Calcul du score de confiance
            combined_result['confidence_score'] = self._calculate_confidence(combined_result)
            combined_result['processing_time'] = time.time() - start_time
            
            # Mise en cache
            self.analysis_cache[cache_key] = {
                'result': combined_result,
                'timestamp': time.time()
            }
            
            self.logger.info(f"Analyse terminée en {combined_result['processing_time']:.2f}s")
            return combined_result
            
        except Exception as e:
            self.logger.error(f"Erreur lors de l'analyse: {e}")
            return self._fallback_analysis(email_text, time.time() - start_time)
    
    def _local_analysis(self, text: str) -> Dict:
        """Analyse locale sans IA pour rapidité"""
        analysis = {
            "word_count": len(text.split()),
            "char_count": len(text),
            "sentence_count": len(re.split(r'[.!?]+', text)),
            "paragraph_count": len(text.split('\n\n')),
            "detected_patterns": {},
            "local_sentiment": 0.0,
            "local_urgency": "normal",
            "local_category": "info"
        }
        
        # Détection de patterns locaux
        text_lower = text.lower()
        
        # Analyse de l'urgence
        urgency_scores = {}
        for level, indicators in self.patterns["urgency_indicators"].items():
            score = sum(1 for indicator in indicators if indicator in text_lower)
            urgency_scores[level] = score
        
        analysis["local_urgency"] = max(urgency_scores, key=urgency_scores.get) if urgency_scores else "normal"
        
        # Analyse du sentiment
        positive_count = sum(1 for word in self.patterns["sentiment_indicators"]["positive"] if word in text_lower)
        negative_count = sum(1 for word in self.patterns["sentiment_indicators"]["negative"] if word in text_lower)
        
        if positive_count > negative_count:
            analysis["local_sentiment"] = 0.5
        elif negative_count > positive_count:
            analysis["local_sentiment"] = -0.5
        else:
            analysis["local_sentiment"] = 0.0
        
        # Analyse de catégorie
        category_scores = {}
        for category, indicators in self.patterns["category_indicators"].items():
            score = sum(1 for indicator in indicators if indicator in text_lower)
            category_scores[category] = score
        
        analysis["local_category"] = max(category_scores, key=category_scores.get) if category_scores else "info"
        
        return analysis
    
    def _ai_analysis(self, text: str) -> Dict:
        """Analyse avancée avec OpenAI GPT-4"""
        try:
            prompt = f"""
            Analyse cet email professionnel et fournis une analyse JSON détaillée:
            
            Email: {text[:2000]}
            
            Retourne un JSON avec:
            {{
                "sentiment": float entre -1 et 1,
                "urgency": "low" | "normal" | "high" | "critical",
                "category": "support" | "commercial" | "complaint" | "request" | "info",
                "language": "fr" | "en" | "es" | "de" | "it",
                "entities": [
                    {{"type": "person|organization|location|date|money", "text": "entité", "confidence": float}}
                ],
                "complexity": int 1-5,
                "keywords": ["mot1", "mot2", "mot3"],
                "suggested_response_tone": "formal" | "friendly" | "apologetic" | "informative",
                "intent": "question" | "complaint" | "request" | "information" | "feedback",
                "emotional_state": "calm" | "frustrated" | "angry" | "satisfied" | "confused",
                "requires_human_intervention": boolean,
                "priority_factors": ["facteur1", "facteur2"]
            }}
            """
            
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {
                        "role": "system", 
                        "content": "Tu es un expert en analyse d'emails professionnels. Réponds uniquement en JSON valide et structuré."
                    },
                    {"role": "user", "content": prompt}
                ],
                temperature=0.3,  # Plus déterministe pour l'analyse
                max_tokens=1000,
                timeout=30
            )
            
            ai_result = json.loads(response.choices[0].message.content)
            ai_result["ai_model_used"] = self.model
            ai_result["ai_analysis_timestamp"] = datetime.utcnow().isoformat()
            
            return ai_result
            
        except json.JSONDecodeError as e:
            self.logger.warning(f"Erreur parsing JSON IA: {e}")
            return self._fallback_ai_analysis()
        except Exception as e:
            self.logger.error(f"Erreur analyse IA: {e}")
            return self._fallback_ai_analysis()
    
    def _extract_entities(self, text: str) -> Dict:
        """Extraction d'entités avec spaCy"""
        try:
            doc = self.nlp(text)
            
            entities = []
            for ent in doc.ents:
                entities.append({
                    "text": ent.text,
                    "label": ent.label_,
                    "start": ent.start_char,
                    "end": ent.end_char,
                    "confidence": 0.8  # spaCy ne fournit pas de score de confiance direct
                })
            
            # Extraction de patterns spécifiques
            email_pattern = r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'
            phone_pattern = r'\b(?:\+33|0)[1-9](?:[0-9]{8})\b'
            
            emails = re.findall(email_pattern, text)
            phones = re.findall(phone_pattern, text)
            
            for email in emails:
                entities.append({
                    "text": email,
                    "label": "EMAIL",
                    "confidence": 0.9
                })
            
            for phone in phones:
                entities.append({
                    "text": phone,
                    "label": "PHONE",
                    "confidence": 0.9
                })
            
            return {
                "entities": entities,
                "entity_count": len(entities),
                "spacy_model": self.nlp.meta["name"]
            }
            
        except Exception as e:
            self.logger.error(f"Erreur extraction entités: {e}")
            return {"entities": [], "entity_count": 0, "error": str(e)}
    
    def _analyze_attachments(self, attachments: List) -> Dict:
        """Analyse des pièces jointes"""
        if not attachments:
            return {"has_attachments": False}
        
        analysis = {
            "has_attachments": True,
            "attachment_count": len(attachments),
            "attachment_types": [],
            "total_size": 0,
            "security_risk": False
        }
        
        risky_extensions = ['.exe', '.bat', '.cmd', '.scr', '.pif', '.com']
        
        for attachment in attachments:
            if isinstance(attachment, dict):
                filename = attachment.get('filename', '')
                size = attachment.get('size', 0)
                
                analysis["attachment_types"].append({
                    "filename": filename,
                    "extension": filename.split('.')[-1] if '.' in filename else '',
                    "size": size
                })
                
                analysis["total_size"] += size
                
                # Vérification sécurité
                if any(filename.lower().endswith(ext) for ext in risky_extensions):
                    analysis["security_risk"] = True
        
        return analysis
    
    def _combine_analyses(self, local: Dict, ai: Dict, entities: Dict, attachments: Dict) -> Dict:
        """Combine tous les résultats d'analyse"""
        combined = {
            # Résultats principaux (priorité à l'IA)
            "sentiment": ai.get("sentiment", local.get("local_sentiment", 0.0)),
            "urgency": ai.get("urgency", local.get("local_urgency", "normal")),
            "category": ai.get("category", local.get("local_category", "info")),
            "language": ai.get("language", "fr"),
            "complexity": ai.get("complexity", 2),
            "keywords": ai.get("keywords", []),
            "suggested_response_tone": ai.get("suggested_response_tone", "professional"),
            
            # Nouvelles données IA
            "intent": ai.get("intent", "question"),
            "emotional_state": ai.get("emotional_state", "calm"),
            "requires_human_intervention": ai.get("requires_human_intervention", False),
            "priority_factors": ai.get("priority_factors", []),
            
            # Entités
            "entities": entities.get("entities", []),
            "entity_count": entities.get("entity_count", 0),
            
            # Statistiques locales
            "word_count": local.get("word_count", 0),
            "char_count": local.get("char_count", 0),
            "sentence_count": local.get("sentence_count", 0),
            
            # Pièces jointes
            "attachments_analysis": attachments,
            
            # Métadonnées
            "analysis_timestamp": datetime.utcnow().isoformat(),
            "analysis_version": "2.3",
            "models_used": {
                "ai_model": ai.get("ai_model_used", self.model),
                "nlp_model": entities.get("spacy_model", "unknown")
            }
        }
        
        return combined
    
    def _calculate_confidence(self, analysis: Dict) -> float:
        """Calcule un score de confiance global"""
        confidence_factors = []
        
        # Confiance basée sur la longueur du texte
        word_count = analysis.get("word_count", 0)
        if word_count > 50:
            confidence_factors.append(0.9)
        elif word_count > 20:
            confidence_factors.append(0.7)
        else:
            confidence_factors.append(0.5)
        
        # Confiance basée sur les entités détectées
        entity_count = analysis.get("entity_count", 0)
        if entity_count > 3:
            confidence_factors.append(0.8)
        elif entity_count > 0:
            confidence_factors.append(0.6)
        else:
            confidence_factors.append(0.4)
        
        # Confiance basée sur la cohérence des analyses
        if analysis.get("urgency") != "normal" and analysis.get("sentiment", 0) < 0:
            confidence_factors.append(0.8)  # Cohérent
        else:
            confidence_factors.append(0.6)
        
        return sum(confidence_factors) / len(confidence_factors)
    
    def _generate_cache_key(self, text: str) -> str:
        """Génère une clé de cache pour le texte"""
        return hashlib.md5(text.encode()).hexdigest()
    
    def _fallback_analysis(self, text: str, processing_time: float) -> Dict:
        """Analyse de fallback en cas d'erreur"""
        return {
            "sentiment": 0.0,
            "urgency": "normal",
            "category": "info",
            "language": "fr",
            "entities": [],
            "complexity": 2,
            "keywords": text.split()[:5],
            "suggested_response_tone": "professional",
            "intent": "question",
            "emotional_state": "calm",
            "requires_human_intervention": False,
            "word_count": len(text.split()),
            "char_count": len(text),
            "confidence_score": 0.3,
            "processing_time": processing_time,
            "fallback": True,
            "analysis_timestamp": datetime.utcnow().isoformat()
        }
    
    def _fallback_ai_analysis(self) -> Dict:
        """Analyse IA de fallback"""
        return {
            "sentiment": 0.0,
            "urgency": "normal",
            "category": "info",
            "language": "fr",
            "entities": [],
            "complexity": 2,
            "keywords": [],
            "suggested_response_tone": "professional",
            "intent": "question",
            "emotional_state": "calm",
            "requires_human_intervention": False,
            "priority_factors": [],
            "ai_fallback": True
        }

class ResponseGenerator:
    """Générateur de réponses IA adaptatif"""
    
    def __init__(self, openai_key: str, model: str = "gpt-4"):
        self.client = openai.OpenAI(api_key=openai_key)
        self.model = model
        self.logger = logging.getLogger("response_generator")
        
        # Templates de réponse par catégorie
        self.response_templates = {
            "support": {
                "greeting": "Bonjour,\n\nMerci de nous avoir contactés concernant votre demande de support.",
                "body_template": "Nous avons bien pris en compte votre problème concernant {subject}. Notre équipe technique va examiner votre demande et vous proposer une solution dans les plus brefs délais.",
                "closing": "Nous restons à votre disposition pour toute question complémentaire.\n\nCordialement,\nL'équipe Support"
            },
            "commercial": {
                "greeting": "Bonjour,\n\nNous vous remercions pour votre intérêt pour nos services.",
                "body_template": "Concernant votre demande {subject}, nous serions ravis de vous accompagner dans votre projet.",
                "closing": "N'hésitez pas à nous contacter pour discuter de vos besoins spécifiques.\n\nCordialement,\nL'équipe Commerciale"
            },
            "complaint": {
                "greeting": "Bonjour,\n\nNous vous présentons nos excuses pour les désagréments rencontrés.",
                "body_template": "Nous prenons votre réclamation concernant {subject} très au sérieux et allons enquêter immédiatement sur cette situation.",
                "closing": "Nous vous tiendrons informé de l'avancement de notre enquête.\n\nCordialement,\nLe Service Client"
            }
        }
    
    def generate_response(self, email_data: Dict, tone: str = "professional", template_type: str = "auto") -> Dict:
        """Génère une réponse adaptée au contexte"""
        try:
            analysis = email_data.get('analysis', {})
            original_content = email_data.get('content', '')
            
            # Détermination automatique du type de template
            if template_type == "auto":
                template_type = analysis.get('category', 'support')
            
            # Construction du prompt contextuel
            context_prompt = self._build_context_prompt(email_data, tone, template_type)
            
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {
                        "role": "system",
                        "content": f"Tu es un assistant professionnel expert en communication client. Génère des réponses {tone} et adaptées au contexte."
                    },
                    {"role": "user", "content": context_prompt}
                ],
                temperature=0.7,
                max_tokens=800
            )
            
            generated_text = response.choices[0].message.content
            
            # Post-traitement et validation
            processed_response = self._post_process_response(generated_text, email_data)
            
            return {
                "response_text": processed_response,
                "tone": tone,
                "template_type": template_type,
                "language": analysis.get('language', 'fr'),
                "word_count": len(processed_response.split()),
                "generated_at": datetime.utcnow().isoformat(),
                "quality_score": self._assess_quality(processed_response),
                "model_used": self.model
            }
            
        except Exception as e:
            self.logger.error(f"Erreur génération réponse: {e}")
            return self._fallback_response(email_data, tone)
    
    def _build_context_prompt(self, email_data: Dict, tone: str, template_type: str) -> str:
        """Construit le prompt contextuel pour la génération"""
        analysis = email_data.get('analysis', {})
        original_content = email_data.get('content', '')
        
        prompt = f"""
        Génère une réponse professionnelle à cet email:
        
        EMAIL ORIGINAL:
        {original_content[:1500]}
        
        CONTEXTE D'ANALYSE:
        - Catégorie: {analysis.get('category', 'info')}
        - Urgence: {analysis.get('urgency', 'normal')}
        - Sentiment: {analysis.get('sentiment', 0)}
        - État émotionnel: {analysis.get('emotional_state', 'calm')}
        - Intention: {analysis.get('intent', 'question')}
        
        INSTRUCTIONS:
        - Ton: {tone}
        - Type de réponse: {template_type}
        - Langue: {analysis.get('language', 'fr')}
        - Personnaliser selon le contexte et l'urgence
        - Proposer des solutions concrètes si possible
        - Être empathique et professionnel
        - Inclure une signature appropriée
        
        LONGUEUR: 150-400 mots selon la complexité
        """
        
        return prompt
    
    def _post_process_response(self, response_text: str, email_data: Dict) -> str:
        """Post-traite la réponse générée"""
        # Nettoyage basique
        response_text = response_text.strip()
        
        # Ajout de la signature si manquante
        if not any(closing in response_text.lower() for closing in ['cordialement', 'regards', 'salutations']):
            response_text += "\n\nCordialement,\nL'équipe MS CONSEILS"
        
        return response_text
    
    def _assess_quality(self, response_text: str) -> float:
        """Évalue la qualité de la réponse"""
        quality_score = 0.5
        
        word_count = len(response_text.split())
        if 100 <= word_count <= 500:
            quality_score += 0.2
        
        if any(greeting in response_text.lower() for greeting in ['bonjour', 'hello']):
            quality_score += 0.1
        
        if any(closing in response_text.lower() for closing in ['cordialement', 'regards']):
            quality_score += 0.1
        
        if 'merci' in response_text.lower():
            quality_score += 0.1
        
        return min(1.0, quality_score)
    
    def _fallback_response(self, email_data: Dict, tone: str) -> Dict:
        """Réponse de fallback"""
        return {
            "response_text": "Bonjour,\n\nMerci pour votre message. Nous avons bien reçu votre demande et reviendrons vers vous rapidement avec une réponse détaillée.\n\nCordialement,\nL'équipe MS CONSEILS",
            "tone": tone,
            "template_type": "generic",
            "language": "fr",
            "generated_at": datetime.utcnow().isoformat(),
            "fallback": True
        }