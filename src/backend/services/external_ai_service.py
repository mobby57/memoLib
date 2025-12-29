"""
External AI Service for IA Poste Manager

Handles integration with external AI services (OpenAI, Ollama)
"""

import logging
import asyncio
import json
import aiohttp
from typing import Dict, List, Any, Optional
from datetime import datetime
from enum import Enum

logger = logging.getLogger(__name__)


class AIProvider(str, Enum):
    """Fournisseurs IA disponibles"""
    OPENAI = "openai"
    OLLAMA = "ollama"
    FALLBACK = "fallback"


class AIModel(str, Enum):
    """Modèles IA disponibles"""
    GPT_3_5_TURBO = "gpt-3.5-turbo"
    GPT_4 = "gpt-4"
    LLAMA2 = "llama2"
    MISTRAL = "mistral"
    CODELLAMA = "codellama"


class ExternalAIService:
    """Service d'intégration avec les IA externes"""

    def __init__(self, openai_api_key: str = None, ollama_base_url: str = "http://localhost:11434"):
        self.openai_api_key = openai_api_key
        self.ollama_base_url = ollama_base_url
        self.request_timeout = 30
        self.max_retries = 3
        
        # Statistiques d'utilisation
        self.usage_stats = {
            'total_requests': 0,
            'successful_requests': 0,
            'failed_requests': 0,
            'total_tokens': 0,
            'providers_used': {}
        }

    async def analyze_with_ai(
        self,
        content: str,
        model: str = "gpt-3.5-turbo",
        provider: str = None,
        temperature: float = 0.7,
        max_tokens: int = 1000
    ) -> Dict[str, Any]:
        """
        Analyse du contenu avec IA
        
        Args:
            content: Contenu à analyser
            model: Modèle IA à utiliser
            provider: Fournisseur préféré
            temperature: Température de génération
            max_tokens: Nombre maximum de tokens
            
        Returns:
            Résultat de l'analyse IA
        """
        start_time = datetime.utcnow()
        
        try:
            # Déterminer le fournisseur
            if provider is None:
                provider = self._determine_provider(model)
            
            # Effectuer l'analyse selon le fournisseur
            if provider == AIProvider.OPENAI:
                result = await self._analyze_with_openai(
                    content, model, temperature, max_tokens
                )
            elif provider == AIProvider.OLLAMA:
                result = await self._analyze_with_ollama(
                    content, model, temperature, max_tokens
                )
            else:
                result = await self._analyze_with_fallback(content)
            
            # Calculer le temps de traitement
            processing_time = (datetime.utcnow() - start_time).total_seconds()
            
            # Mettre à jour les statistiques
            self._update_stats(provider, True, result.get('tokens_used', 0))
            
            return {
                **result,
                'provider_used': provider,
                'model_used': model,
                'processing_time': processing_time,
                'timestamp': datetime.utcnow().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Error in AI analysis: {str(e)}")
            self._update_stats(provider or 'unknown', False, 0)
            
            # Tentative de fallback
            if provider != AIProvider.FALLBACK:
                logger.info("Attempting fallback analysis...")
                return await self._analyze_with_fallback(content)
            
            raise

    async def _analyze_with_openai(
        self,
        content: str,
        model: str,
        temperature: float,
        max_tokens: int
    ) -> Dict[str, Any]:
        """Analyse avec OpenAI API"""
        
        if not self.openai_api_key:
            raise ValueError("OpenAI API key not configured")
        
        headers = {
            'Authorization': f'Bearer {self.openai_api_key}',
            'Content-Type': 'application/json'
        }
        
        payload = {
            'model': model,
            'messages': [
                {
                    'role': 'system',
                    'content': 'Tu es un assistant IA spécialisé dans l\'analyse d\'emails et la génération de réponses professionnelles.'
                },
                {
                    'role': 'user',
                    'content': content
                }
            ],
            'temperature': temperature,
            'max_tokens': max_tokens
        }
        
        async with aiohttp.ClientSession() as session:
            async with session.post(
                'https://api.openai.com/v1/chat/completions',
                headers=headers,
                json=payload,
                timeout=aiohttp.ClientTimeout(total=self.request_timeout)
            ) as response:
                
                if response.status != 200:
                    error_text = await response.text()
                    raise Exception(f"OpenAI API error {response.status}: {error_text}")
                
                data = await response.json()
                
                return {
                    'content': data['choices'][0]['message']['content'],
                    'tokens_used': data.get('usage', {}).get('total_tokens', 0),
                    'finish_reason': data['choices'][0].get('finish_reason'),
                    'provider': AIProvider.OPENAI
                }

    async def _analyze_with_ollama(
        self,
        content: str,
        model: str,
        temperature: float,
        max_tokens: int
    ) -> Dict[str, Any]:
        """Analyse avec Ollama local"""
        
        # Mapper les modèles OpenAI vers Ollama
        ollama_model_map = {
            'gpt-3.5-turbo': 'llama2',
            'gpt-4': 'mistral',
            'codellama': 'codellama'
        }
        
        ollama_model = ollama_model_map.get(model, 'llama2')
        
        payload = {
            'model': ollama_model,
            'prompt': content,
            'stream': False,
            'options': {
                'temperature': temperature,
                'num_predict': max_tokens
            }
        }
        
        async with aiohttp.ClientSession() as session:
            async with session.post(
                f'{self.ollama_base_url}/api/generate',
                json=payload,
                timeout=aiohttp.ClientTimeout(total=self.request_timeout)
            ) as response:
                
                if response.status != 200:
                    error_text = await response.text()
                    raise Exception(f"Ollama API error {response.status}: {error_text}")
                
                data = await response.json()
                
                return {
                    'content': data.get('response', ''),
                    'tokens_used': data.get('eval_count', 0),
                    'finish_reason': 'stop' if data.get('done') else 'length',
                    'provider': AIProvider.OLLAMA
                }

    async def _analyze_with_fallback(self, content: str) -> Dict[str, Any]:
        """Analyse de fallback (règles prédéfinies)"""
        
        # Analyse basique par mots-clés
        content_lower = content.lower()
        
        # Détection de complexité
        complexity_indicators = [
            'urgent', 'problème', 'erreur', 'réclamation', 
            'juridique', 'médical', 'handicap', 'mdph'
        ]
        
        complexity_score = 1.0
        for indicator in complexity_indicators:
            if indicator in content_lower:
                complexity_score += 1.0
        
        complexity_score = min(complexity_score, 10.0)
        
        # Détection de priorité
        if any(word in content_lower for word in ['urgent', 'immédiat', 'asap']):
            priority = 'urgent'
        elif any(word in content_lower for word in ['important', 'priorité']):
            priority = 'high'
        else:
            priority = 'medium'
        
        # Actions suggérées basiques
        suggested_actions = ['manual_review']
        if 'question' in content_lower or '?' in content:
            suggested_actions.append('provide_answer')
        if 'rendez-vous' in content_lower or 'rdv' in content_lower:
            suggested_actions.append('schedule_appointment')
        
        return {
            'content': json.dumps({
                'complexity_score': complexity_score,
                'priority': priority,
                'missing_info': [],
                'suggested_actions': suggested_actions,
                'response_type': 'answer',
                'estimated_processing_time': 300,
                'requires_human_review': complexity_score > 7.0
            }),
            'tokens_used': 0,
            'finish_reason': 'fallback',
            'provider': AIProvider.FALLBACK
        }

    async def generate_response(
        self,
        prompt: str,
        tone: str = "professional",
        model: str = "gpt-3.5-turbo",
        max_tokens: int = 500
    ) -> Dict[str, Any]:
        """
        Génère une réponse avec IA
        
        Args:
            prompt: Prompt de génération
            tone: Ton de la réponse
            model: Modèle à utiliser
            max_tokens: Nombre maximum de tokens
            
        Returns:
            Réponse générée
        """
        
        # Adapter le prompt selon le ton
        tone_prompts = {
            'professional': 'Réponds de manière professionnelle et courtoise.',
            'friendly': 'Réponds de manière amicale et chaleureuse.',
            'formal': 'Réponds de manière très formelle et respectueuse.',
            'casual': 'Réponds de manière décontractée mais respectueuse.'
        }
        
        system_prompt = tone_prompts.get(tone, tone_prompts['professional'])
        full_prompt = f"{system_prompt}\n\n{prompt}"
        
        return await self.analyze_with_ai(
            content=full_prompt,
            model=model,
            max_tokens=max_tokens,
            temperature=0.7
        )

    def _determine_provider(self, model: str) -> str:
        """Détermine le fournisseur optimal selon le modèle"""
        
        openai_models = ['gpt-3.5-turbo', 'gpt-4']
        ollama_models = ['llama2', 'mistral', 'codellama']
        
        if model in openai_models and self.openai_api_key:
            return AIProvider.OPENAI
        elif model in ollama_models:
            return AIProvider.OLLAMA
        else:
            return AIProvider.FALLBACK

    def _update_stats(self, provider: str, success: bool, tokens_used: int):
        """Met à jour les statistiques d'utilisation"""
        
        self.usage_stats['total_requests'] += 1
        
        if success:
            self.usage_stats['successful_requests'] += 1
        else:
            self.usage_stats['failed_requests'] += 1
        
        self.usage_stats['total_tokens'] += tokens_used
        
        if provider not in self.usage_stats['providers_used']:
            self.usage_stats['providers_used'][provider] = 0
        self.usage_stats['providers_used'][provider] += 1

    async def get_available_models(self) -> Dict[str, List[str]]:
        """Retourne la liste des modèles disponibles par fournisseur"""
        
        available_models = {
            'openai': [],
            'ollama': [],
            'fallback': ['basic_analysis']
        }
        
        # Vérifier OpenAI
        if self.openai_api_key:
            available_models['openai'] = ['gpt-3.5-turbo', 'gpt-4']
        
        # Vérifier Ollama
        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(
                    f'{self.ollama_base_url}/api/tags',
                    timeout=aiohttp.ClientTimeout(total=5)
                ) as response:
                    if response.status == 200:
                        data = await response.json()
                        available_models['ollama'] = [
                            model['name'] for model in data.get('models', [])
                        ]
        except Exception as e:
            logger.warning(f"Could not check Ollama models: {str(e)}")
        
        return available_models

    async def get_usage_stats(self) -> Dict[str, Any]:
        """Retourne les statistiques d'utilisation"""
        return {
            **self.usage_stats,
            'success_rate': (
                self.usage_stats['successful_requests'] / 
                max(self.usage_stats['total_requests'], 1)
            ) * 100,
            'average_tokens_per_request': (
                self.usage_stats['total_tokens'] / 
                max(self.usage_stats['successful_requests'], 1)
            )
        }