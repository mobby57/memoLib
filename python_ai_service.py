#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
SERVICE PYTHON IA OPTIMISÉ
Traitement IA lourd, NLP, analyse prédictive
"""

from fastapi import FastAPI, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
import asyncio
import aioredis
import asyncpg
from concurrent.futures import ProcessPoolExecutor, ThreadPoolExecutor
import numpy as np
from typing import List, Dict, Optional
import json
import time
from datetime import datetime
import logging

# Configuration logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class OptimizedLegalAI:
    def __init__(self):
        self.app = FastAPI(title="Legal AI Service", version="2.0.0")
        self.setup_middleware()
        self.setup_routes()
        
        # Pools d'exécution
        self.process_pool = ProcessPoolExecutor(max_workers=4)
        self.thread_pool = ThreadPoolExecutor(max_workers=8)
        
        # Connexions async
        self.redis = None
        self.db_pool = None
        
        # Cache modèles IA
        self.models_cache = {}
        
    def setup_middleware(self):
        self.app.add_middleware(
            CORSMiddleware,
            allow_origins=["*"],
            allow_credentials=True,
            allow_methods=["*"],
            allow_headers=["*"],
        )

    def setup_routes(self):
        @self.app.on_event("startup")
        async def startup():
            await self.initialize_services()
        
        @self.app.get("/health")
        async def health():
            return {
                "status": "OK",
                "service": "Legal AI Python",
                "timestamp": datetime.now().isoformat(),
                "models_loaded": len(self.models_cache)
            }
        
        @self.app.post("/analyze-email")
        async def analyze_email(email_data: dict):
            return await self.analyze_email_optimized(email_data)
        
        @self.app.post("/batch-analyze")
        async def batch_analyze(emails_data: dict):
            return await self.batch_analyze_emails(emails_data["emails"])
        
        @self.app.post("/clients")
        async def create_client(client_data: dict):
            return await self.create_client_profile(client_data)
        
        @self.app.get("/dashboard/stats")
        async def dashboard_stats():
            return await self.get_dashboard_statistics()
        
        @self.app.post("/predict-case-success")
        async def predict_success(case_data: dict):
            return await self.predict_case_success(case_data)

    async def initialize_services(self):
        """Initialisation services async"""
        try:
            # Redis
            self.redis = aioredis.from_url("redis://localhost:6379")
            
            # PostgreSQL (simulation)
            # self.db_pool = await asyncpg.create_pool("postgresql://...")
            
            # Pré-charger modèles IA
            await self.preload_ai_models()
            
            logger.info("✅ Services initialisés")
        except Exception as e:
            logger.error(f"❌ Erreur initialisation: {e}")

    async def preload_ai_models(self):
        """Pré-charger modèles IA pour performance"""
        try:
            # Simulation chargement modèles
            self.models_cache = {
                "urgency_detector": "model_urgency_loaded",
                "procedure_classifier": "model_procedure_loaded",
                "sentiment_analyzer": "model_sentiment_loaded",
                "success_predictor": "model_success_loaded"
            }
            logger.info("🤖 Modèles IA pré-chargés")
        except Exception as e:
            logger.error(f"❌ Erreur chargement modèles: {e}")

    async def analyze_email_optimized(self, email_data: dict) -> dict:
        """Analyse email optimisée avec cache et parallélisation"""
        start_time = time.time()
        
        try:
            # Vérifier cache Redis
            cache_key = f"email_analysis:{email_data.get('id', 'unknown')}"
            cached = await self.redis.get(cache_key)
            
            if cached:
                logger.info(f"📋 Cache hit pour email {email_data.get('id')}")
                return json.loads(cached)
            
            # Analyse parallèle
            tasks = [
                self.detect_urgency_async(email_data),
                self.detect_procedure_async(email_data),
                self.analyze_sentiment_async(email_data),
                self.extract_entities_async(email_data)
            ]
            
            urgency, procedure, sentiment, entities = await asyncio.gather(*tasks)
            
            # Calcul priorité
            priority = self.calculate_priority(urgency, procedure, sentiment)
            
            # Actions suggérées
            actions = await self.generate_actions_async(urgency, procedure, entities)
            
            result = {
                "email_id": email_data.get('id'),
                "priority": priority,
                "urgency_score": urgency,
                "procedure_type": procedure,
                "sentiment": sentiment,
                "entities": entities,
                "suggested_actions": actions,
                "processing_time": time.time() - start_time,
                "timestamp": datetime.now().isoformat()
            }
            
            # Cache résultat (5 minutes)
            await self.redis.setex(cache_key, 300, json.dumps(result))
            
            logger.info(f"✅ Email {email_data.get('id')} analysé en {result['processing_time']:.2f}s")
            return result
            
        except Exception as e:
            logger.error(f"❌ Erreur analyse email: {e}")
            return {"error": str(e), "email_id": email_data.get('id')}

    async def batch_analyze_emails(self, emails: List[dict]) -> dict:
        """Analyse batch optimisée"""
        start_time = time.time()
        
        try:
            # Traitement par chunks pour éviter surcharge
            chunk_size = 10
            results = []
            
            for i in range(0, len(emails), chunk_size):
                chunk = emails[i:i + chunk_size]
                
                # Analyse parallèle du chunk
                chunk_tasks = [self.analyze_email_optimized(email) for email in chunk]
                chunk_results = await asyncio.gather(*chunk_tasks, return_exceptions=True)
                
                results.extend(chunk_results)
                
                # Petite pause entre chunks
                if i + chunk_size < len(emails):
                    await asyncio.sleep(0.1)
            
            processing_time = time.time() - start_time
            
            logger.info(f"✅ Batch de {len(emails)} emails analysé en {processing_time:.2f}s")
            
            return {
                "results": results,
                "total_emails": len(emails),
                "processing_time": processing_time,
                "emails_per_second": len(emails) / processing_time
            }
            
        except Exception as e:
            logger.error(f"❌ Erreur batch analyse: {e}")
            return {"error": str(e)}

    async def detect_urgency_async(self, email_data: dict) -> float:
        """Détection urgence avec IA"""
        try:
            content = email_data.get('content', '') + ' ' + email_data.get('subject', '')
            
            # Mots-clés urgence
            urgent_keywords = ['oqtf', 'expulsion', 'urgent', 'délai', 'échéance', 'tribunal']
            
            # Score basique (remplacer par vraie IA)
            score = 0.0
            for keyword in urgent_keywords:
                if keyword.lower() in content.lower():
                    score += 0.2
            
            # Détection délais
            import re
            delai_pattern = r'(\d+)\s*(jour|semaine|mois)'
            delais = re.findall(delai_pattern, content.lower())
            
            for delai, unite in delais:
                jours = int(delai)
                if unite == 'semaine':
                    jours *= 7
                elif unite == 'mois':
                    jours *= 30
                
                if jours <= 7:
                    score += 0.4
                elif jours <= 30:
                    score += 0.2
            
            return min(score, 1.0)
            
        except Exception as e:
            logger.error(f"Erreur détection urgence: {e}")
            return 0.0

    async def detect_procedure_async(self, email_data: dict) -> str:
        """Classification procédure"""
        try:
            content = email_data.get('content', '') + ' ' + email_data.get('subject', '')
            content_lower = content.lower()
            
            procedures = {
                'oqtf': ['oqtf', 'expulsion', 'recours'],
                'carte_sejour': ['carte séjour', 'titre séjour', 'renouvellement'],
                'naturalisation': ['naturalisation', 'français', 'citoyenneté'],
                'regroupement_familial': ['regroupement familial', 'famille', 'conjoint']
            }
            
            scores = {}
            for proc, keywords in procedures.items():
                score = sum(1 for kw in keywords if kw in content_lower)
                if score > 0:
                    scores[proc] = score
            
            if scores:
                return max(scores, key=scores.get)
            return 'autre'
            
        except Exception as e:
            logger.error(f"Erreur détection procédure: {e}")
            return 'autre'

    async def analyze_sentiment_async(self, email_data: dict) -> dict:
        """Analyse sentiment"""
        try:
            # Simulation analyse sentiment
            content = email_data.get('content', '')
            
            # Mots positifs/négatifs basiques
            positive_words = ['merci', 'content', 'satisfait', 'bien']
            negative_words = ['urgent', 'problème', 'inquiet', 'stress']
            
            pos_count = sum(1 for word in positive_words if word in content.lower())
            neg_count = sum(1 for word in negative_words if word in content.lower())
            
            if neg_count > pos_count:
                return {"sentiment": "négatif", "score": 0.3}
            elif pos_count > neg_count:
                return {"sentiment": "positif", "score": 0.7}
            else:
                return {"sentiment": "neutre", "score": 0.5}
                
        except Exception as e:
            logger.error(f"Erreur analyse sentiment: {e}")
            return {"sentiment": "neutre", "score": 0.5}

    async def extract_entities_async(self, email_data: dict) -> dict:
        """Extraction entités"""
        try:
            content = email_data.get('content', '')
            
            # Extraction basique (remplacer par NER)
            import re
            
            # Dates
            date_pattern = r'\d{1,2}[/-]\d{1,2}[/-]\d{2,4}'
            dates = re.findall(date_pattern, content)
            
            # Numéros
            number_pattern = r'\b\d{4,}\b'
            numbers = re.findall(number_pattern, content)
            
            return {
                "dates": dates,
                "numbers": numbers,
                "has_attachment": "pièce jointe" in content.lower()
            }
            
        except Exception as e:
            logger.error(f"Erreur extraction entités: {e}")
            return {}

    def calculate_priority(self, urgency: float, procedure: str, sentiment: dict) -> str:
        """Calcul priorité intelligente"""
        try:
            if urgency >= 0.8 or procedure == 'oqtf':
                return 'critique'
            elif urgency >= 0.6 or sentiment.get('sentiment') == 'négatif':
                return 'urgent'
            elif urgency >= 0.3:
                return 'important'
            else:
                return 'normal'
        except:
            return 'normal'

    async def generate_actions_async(self, urgency: float, procedure: str, entities: dict) -> List[str]:
        """Génération actions suggérées"""
        try:
            actions = []
            
            if procedure == 'oqtf':
                actions.extend([
                    "Créer dossier urgent OQTF",
                    "Planifier RDV dans 24h",
                    "Préparer documents recours",
                    "Alerter avocat senior"
                ])
            
            if urgency >= 0.7:
                actions.append("Traitement prioritaire")
            
            if entities.get('dates'):
                actions.append("Vérifier délais mentionnés")
            
            if not actions:
                actions = ["Traitement standard", "Réponse sous 48h"]
            
            return actions
            
        except Exception as e:
            logger.error(f"Erreur génération actions: {e}")
            return ["Traitement standard"]

    async def create_client_profile(self, client_data: dict) -> dict:
        """Création profil client optimisée"""
        try:
            # Validation
            if not client_data.get('nom') or not client_data.get('email'):
                return {"error": "Nom et email requis"}
            
            # Création profil (simulation)
            profile = {
                "id": f"client_{int(time.time())}",
                "nom": client_data['nom'],
                "email": client_data['email'],
                "procedure": client_data.get('procedure', 'autre'),
                "situation": client_data.get('situation', {}),
                "created_at": datetime.now().isoformat()
            }
            
            # Cache profil
            cache_key = f"client_profile:{profile['email']}"
            await self.redis.setex(cache_key, 3600, json.dumps(profile))
            
            logger.info(f"✅ Profil client créé: {profile['nom']}")
            return profile
            
        except Exception as e:
            logger.error(f"❌ Erreur création profil: {e}")
            return {"error": str(e)}

    async def get_dashboard_statistics(self) -> dict:
        """Statistiques dashboard optimisées"""
        try:
            # Cache stats
            cache_key = "dashboard_stats"
            cached = await self.redis.get(cache_key)
            
            if cached:
                return json.loads(cached)
            
            # Calcul stats (simulation)
            stats = {
                "emails_today": 24,
                "urgent_emails": 5,
                "processing_time_avg": 0.8,
                "ai_accuracy": 94.2,
                "clients_active": 12,
                "dossiers_urgent": 3,
                "timestamp": datetime.now().isoformat()
            }
            
            # Cache 1 minute
            await self.redis.setex(cache_key, 60, json.dumps(stats))
            
            return stats
            
        except Exception as e:
            logger.error(f"❌ Erreur stats dashboard: {e}")
            return {"error": str(e)}

    async def predict_case_success(self, case_data: dict) -> dict:
        """Prédiction succès dossier"""
        try:
            # Simulation prédiction IA
            procedure = case_data.get('procedure', 'autre')
            
            # Facteurs de succès simulés
            success_rates = {
                'oqtf': 0.73,
                'carte_sejour': 0.89,
                'naturalisation': 0.91,
                'regroupement_familial': 0.82
            }
            
            base_rate = success_rates.get(procedure, 0.65)
            
            # Ajustements selon situation
            if case_data.get('famille_france'):
                base_rate += 0.1
            if case_data.get('travail_declare'):
                base_rate += 0.05
            if case_data.get('delai_court'):
                base_rate -= 0.1
            
            success_rate = min(max(base_rate, 0.1), 0.95)
            
            return {
                "success_probability": success_rate,
                "confidence": 0.87,
                "factors": case_data,
                "recommendation": "Fort potentiel" if success_rate > 0.8 else "Dossier à renforcer"
            }
            
        except Exception as e:
            logger.error(f"❌ Erreur prédiction: {e}")
            return {"error": str(e)}

# Démarrage
if __name__ == "__main__":
    import uvicorn
    
    ai_service = OptimizedLegalAI()
    
    uvicorn.run(
        ai_service.app,
        host="0.0.0.0",
        port=8000,
        workers=1,  # 1 worker pour dev, plus en prod
        log_level="info"
    )