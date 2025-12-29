"""
AI Router - Orchestration intelligente multi-modèles
Route vers Ollama, GPT-4, Claude selon contexte
"""
import os
import asyncio
from typing import Dict, List, Optional, Any
from enum import Enum
import hashlib
import json


class AIModel(str, Enum):
    """Modèles IA disponibles"""
    OLLAMA_LLAMA3 = "ollama:llama3:8b"
    OPENAI_GPT4 = "openai:gpt-4o-mini"
    ANTHROPIC_CLAUDE = "anthropic:claude-3-haiku"


class RoutingStrategy(str, Enum):
    """Stratégies de routage"""
    COST_OPTIMIZED = "cost"      # Préfère Ollama gratuit
    SPEED_OPTIMIZED = "speed"    # Préfère le plus rapide
    QUALITY_OPTIMIZED = "quality"  # Préfère le plus précis
    CONSENSUS = "consensus"      # Vote multi-modèles


class IntelligentAIRouter:
    """Router qui choisit le meilleur modèle selon contexte"""
    
    def __init__(self):
        # Coûts par 1k tokens (USD)
        self.costs = {
            AIModel.OLLAMA_LLAMA3: 0.0,      # Gratuit (local)
            AIModel.OPENAI_GPT4: 0.00015,    # $0.15/1M tokens
            AIModel.ANTHROPIC_CLAUDE: 0.00025  # $0.25/1M tokens
        }
        
        # Latences moyennes (secondes)
        self.avg_latency = {
            AIModel.OLLAMA_LLAMA3: 5.0,
            AIModel.OPENAI_GPT4: 2.0,
            AIModel.ANTHROPIC_CLAUDE: 3.0
        }
        
        # Score qualité (0-100)
        self.quality_score = {
            AIModel.OLLAMA_LLAMA3: 75,
            AIModel.OPENAI_GPT4: 92,
            AIModel.ANTHROPIC_CLAUDE: 88
        }
        
        # Stats utilisation
        self.usage_stats = {
            model: {'calls': 0, 'tokens': 0, 'cost': 0.0}
            for model in AIModel
        }
    
    async def route_analysis(
        self,
        document: str,
        context: Dict[str, Any],
        strategy: RoutingStrategy = RoutingStrategy.COST_OPTIMIZED
    ) -> Dict[str, Any]:
        """
        Router intelligent vers meilleur modèle
        
        Args:
            document: Texte à analyser
            context: Métadonnées (priority, type, etc.)
            strategy: Stratégie routage
            
        Returns:
            Résultat analyse avec métadonnées modèle
        """
        
        # Choisir modèle selon stratégie
        model = self._select_model(document, context, strategy)
        
        print(f"🤖 AI Router: {model} sélectionné (stratégie: {strategy})")
        
        # Analyser avec modèle choisi
        if model == AIModel.OLLAMA_LLAMA3:
            result = await self._analyze_ollama(document)
        elif model == AIModel.OPENAI_GPT4:
            result = await self._analyze_gpt4(document)
        elif model == AIModel.ANTHROPIC_CLAUDE:
            result = await self._analyze_claude(document)
        
        # Enrichir avec métadonnées
        result['_metadata'] = {
            'model': model,
            'strategy': strategy,
            'cost_usd': self._calculate_cost(model, len(document)),
            'routing_reason': self._get_routing_reason(document, context, model)
        }
        
        # Mettre à jour stats
        self._update_stats(model, len(document))
        
        return result
    
    def _select_model(
        self,
        document: str,
        context: Dict,
        strategy: RoutingStrategy
    ) -> AIModel:
        """Sélection modèle selon règles"""
        
        doc_length = len(document)
        priority = context.get('priority', 'normal')
        doc_type = context.get('type', 'unknown')
        
        # Règles de routage
        
        # CONSENSUS pour documents critiques
        if context.get('critical') or doc_type == 'legal':
            # Consensus sera géré par route_consensus()
            return AIModel.OPENAI_GPT4  # Fallback GPT-4
        
        # SPEED pour urgences
        if strategy == RoutingStrategy.SPEED_OPTIMIZED or priority == 'urgent':
            return AIModel.OPENAI_GPT4  # Plus rapide
        
        # QUALITY pour juridique/complexe
        if strategy == RoutingStrategy.QUALITY_OPTIMIZED or doc_type in ['legal', 'contract']:
            return AIModel.OPENAI_GPT4  # Meilleure qualité
        
        # COST pour le reste (défaut)
        if doc_length < 3000:
            return AIModel.OLLAMA_LLAMA3  # Gratuit et rapide pour courts docs
        elif doc_length < 10000:
            return AIModel.OPENAI_GPT4  # Bon compromis longs docs
        else:
            return AIModel.ANTHROPIC_CLAUDE  # Meilleur context window
    
    async def route_consensus(
        self,
        document: str,
        context: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Consensus multi-modèles pour documents critiques
        Vote majoritaire sur deadline/urgence
        """
        print("🔮 AI Router: Mode CONSENSUS activé - 3 modèles")
        
        # Analyser avec 3 modèles en parallèle
        results = await asyncio.gather(
            self._analyze_ollama(document),
            self._analyze_gpt4(document),
            self._analyze_claude(document),
            return_exceptions=True
        )
        
        # Filtrer erreurs
        valid_results = [r for r in results if not isinstance(r, Exception)]
        
        if len(valid_results) < 2:
            raise ValueError("Consensus impossible: moins de 2 modèles disponibles")
        
        # Merger résultats par vote majoritaire
        consensus = self._merge_consensus(valid_results)
        
        consensus['_metadata'] = {
            'model': 'consensus',
            'models_used': [AIModel.OLLAMA_LLAMA3, AIModel.OPENAI_GPT4, AIModel.ANTHROPIC_CLAUDE],
            'confidence': len(valid_results) / 3.0,
            'cost_usd': sum(self._calculate_cost(m, len(document)) for m in AIModel)
        }
        
        return consensus
    
    def _merge_consensus(self, results: List[Dict]) -> Dict:
        """Vote majoritaire sur champs clés"""
        consensus = {}
        
        # Vote sur urgence
        urgences = [r.get('urgence') for r in results if 'urgence' in r]
        if urgences:
            consensus['urgence'] = max(set(urgences), key=urgences.count)
        
        # Moyenne délais
        delais = [r.get('delai_jours') for r in results if 'delai_jours' in r]
        if delais:
            consensus['delai_jours'] = int(sum(delais) / len(delais))
        
        # Vote type document
        types = [r.get('type_document') for r in results if 'type_document' in r]
        if types:
            consensus['type_document'] = max(set(types), key=types.count)
        
        # Merger objets (prendre le plus détaillé)
        objets = [r.get('objet', '') for r in results]
        consensus['objet'] = max(objets, key=len)
        
        # Merger TODOs (union)
        all_todos = []
        for r in results:
            all_todos.extend(r.get('todos', []))
        consensus['todos'] = all_todos[:5]  # Top 5
        
        return consensus
    
    async def _analyze_ollama(self, document: str) -> Dict:
        """Analyser avec Ollama local"""
        from src.services.fast_document_analyzer import fast_analyzer
        result = await fast_analyzer.analyze_quick(document)
        return result
    
    async def _analyze_gpt4(self, document: str) -> Dict:
        """Analyser avec GPT-4 (à implémenter si API key disponible)"""
        # Placeholder - implémentation réelle nécessite openai SDK
        import httpx
        
        api_key = os.getenv('OPENAI_API_KEY')
        if not api_key:
            raise ValueError("OPENAI_API_KEY non configuré")
        
        async with httpx.AsyncClient(timeout=30) as client:
            response = await client.post(
                'https://api.openai.com/v1/chat/completions',
                headers={'Authorization': f'Bearer {api_key}'},
                json={
                    'model': 'gpt-4o-mini',
                    'messages': [
                        {'role': 'system', 'content': 'Analyse ce document. Retourne JSON avec: urgence, delai_jours, type_document, objet.'},
                        {'role': 'user', 'content': document[:2000]}
                    ],
                    'temperature': 0.1,
                    'max_tokens': 500
                }
            )
            
            data = response.json()
            content = data['choices'][0]['message']['content']
            
            # Parser JSON
            import json
            return json.loads(content)
    
    async def _analyze_claude(self, document: str) -> Dict:
        """Analyser avec Claude (à implémenter si API key disponible)"""
        # Placeholder similaire à GPT-4
        api_key = os.getenv('ANTHROPIC_API_KEY')
        if not api_key:
            raise ValueError("ANTHROPIC_API_KEY non configuré")
        
        # Implémentation Anthropic SDK
        raise NotImplementedError("Claude integration à implémenter")
    
    def _calculate_cost(self, model: AIModel, text_length: int) -> float:
        """Calculer coût approximatif"""
        # 1 token ≈ 4 caractères
        tokens = text_length / 4
        cost_per_1k = self.costs[model]
        return (tokens / 1000) * cost_per_1k
    
    def _update_stats(self, model: AIModel, text_length: int):
        """Mettre à jour statistiques usage"""
        tokens = text_length / 4
        cost = self._calculate_cost(model, text_length)
        
        self.usage_stats[model]['calls'] += 1
        self.usage_stats[model]['tokens'] += tokens
        self.usage_stats[model]['cost'] += cost
    
    def _get_routing_reason(self, document: str, context: Dict, model: AIModel) -> str:
        """Expliquer pourquoi ce modèle"""
        doc_length = len(document)
        
        if context.get('critical'):
            return "Document critique → modèle haute qualité"
        elif context.get('priority') == 'urgent':
            return "Urgence → modèle rapide"
        elif doc_length > 5000:
            return "Document long → modèle meilleur context"
        elif model == AIModel.OLLAMA_LLAMA3:
            return "Document standard → coût optimisé (local)"
        else:
            return "Routage par défaut"
    
    def get_usage_stats(self) -> Dict:
        """Récupérer statistiques usage"""
        return {
            'by_model': self.usage_stats,
            'total_cost': sum(s['cost'] for s in self.usage_stats.values()),
            'total_calls': sum(s['calls'] for s in self.usage_stats.values())
        }


# Instance globale
ai_router = IntelligentAIRouter()
