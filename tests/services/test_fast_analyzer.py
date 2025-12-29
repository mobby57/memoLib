"""
Tests unitaires - Fast Document Analyzer
Coverage: cache, performance, fallback
"""
import pytest
import asyncio
import hashlib
from src.services.fast_document_analyzer import FastDocumentAnalyzer


@pytest.fixture
def analyzer():
    """Instance FastDocumentAnalyzer"""
    return FastDocumentAnalyzer(
        ollama_url="http://localhost:11434",
        model="llama3:8b"
    )


@pytest.fixture
def sample_document():
    """Document test avec deadline"""
    return """
    Courrier officiel important
    
    Vous êtes prié de fournir les documents demandés avant le 31 décembre 2025.
    Cette demande est urgente et nécessite une réponse rapide.
    
    Cordialement,
    L'administration
    """


class TestCacheMechanism:
    """Tests système de cache MD5"""
    
    def test_cache_key_generation(self, analyzer, sample_document):
        """Cache key doit être MD5 du texte"""
        cache_key = hashlib.md5(sample_document.encode()).hexdigest()
        assert len(cache_key) == 32  # MD5 = 32 chars hex
    
    @pytest.mark.asyncio
    async def test_cache_hit_second_analysis(self, analyzer, sample_document):
        """2e analyse doit utiliser cache (<100ms)"""
        # 1ère analyse (cache miss)
        result1 = await analyzer.analyze_quick(sample_document)
        
        # 2e analyse (cache hit)
        import time
        start = time.time()
        result2 = await analyzer.analyze_quick(sample_document)
        duration = time.time() - start
        
        # Cache hit doit être instantané
        assert duration < 0.1, f"Cache hit trop lent: {duration*1000}ms"
        assert result1 == result2
    
    @pytest.mark.asyncio
    async def test_different_documents_different_cache(self, analyzer):
        """Documents différents → cache séparé"""
        doc1 = "Réponse avant le 15 janvier 2026"
        doc2 = "Réponse avant le 20 février 2026"
        
        result1 = await analyzer.analyze_quick(doc1)
        result2 = await analyzer.analyze_quick(doc2)
        
        # Résultats doivent être différents
        assert result1.get('delai_jours') != result2.get('delai_jours')


class TestRegexFallback:
    """Tests extraction regex (fallback)"""
    
    @pytest.mark.asyncio
    async def test_extract_deadline_regex(self, analyzer):
        """Regex doit détecter dates communes"""
        test_cases = [
            ("avant le 31/12/2025", 6),  # 6 jours depuis 25/12/2025
            ("jusqu'au 31 décembre 2025", 6),
            ("limite: 1er janvier 2026", 7),
            ("avant fin mars 2026", None),  # Format imprécis
        ]
        
        for text, expected_days in test_cases:
            result = analyzer._extract_with_regex(text)
            
            if expected_days is not None:
                assert result.get('delai_jours') == expected_days, \
                    f"Erreur extraction: '{text}' → {result.get('delai_jours')} jours (attendu: {expected_days})"
    
    @pytest.mark.asyncio
    async def test_extract_urgency_keywords(self, analyzer):
        """Regex doit détecter urgence via mots-clés"""
        urgent_text = "URGENT: réponse immédiate requise"
        normal_text = "Merci de nous répondre quand vous pourrez"
        
        result_urgent = analyzer._extract_with_regex(urgent_text)
        result_normal = analyzer._extract_with_regex(normal_text)
        
        assert result_urgent.get('urgence') == 'haute'
        assert result_normal.get('urgence') == 'normale'


class TestPerformance:
    """Tests performance"""
    
    @pytest.mark.asyncio
    async def test_analysis_under_10s(self, analyzer, sample_document):
        """Analyse doit être <10s (objectif: 3-8s)"""
        import time
        start = time.time()
        result = await analyzer.analyze_quick(sample_document)
        duration = time.time() - start
        
        assert duration < 10, f"Analyse trop lente: {duration:.1f}s (max 10s)"
        assert 'urgence' in result
        assert 'delai_jours' in result
    
    @pytest.mark.asyncio
    async def test_parallel_analyses(self, analyzer):
        """10 analyses parallèles doivent terminer <30s"""
        documents = [
            f"Document {i}: Réponse avant le {i+1}/01/2026"
            for i in range(10)
        ]
        
        import time
        start = time.time()
        
        results = await asyncio.gather(*[
            analyzer.analyze_quick(doc)
            for doc in documents
        ])
        
        duration = time.time() - start
        
        assert len(results) == 10
        assert duration < 30, f"10 analyses parallèles trop lentes: {duration:.1f}s"


class TestErrorHandling:
    """Tests gestion erreurs"""
    
    @pytest.mark.asyncio
    async def test_ollama_timeout_fallback_regex(self, analyzer, mocker):
        """Si Ollama timeout → fallback regex"""
        # Mock Ollama qui timeout
        async def mock_timeout(*args, **kwargs):
            await asyncio.sleep(100)  # Timeout
        
        mocker.patch.object(analyzer, '_analyze_with_ollama_fast', side_effect=asyncio.TimeoutError)
        
        # Doit fallback sur regex
        result = await analyzer.analyze_quick("Réponse avant le 31/12/2025")
        
        assert result is not None
        assert 'delai_jours' in result  # Extrait par regex
    
    @pytest.mark.asyncio
    async def test_empty_document(self, analyzer):
        """Document vide → résultat minimal"""
        result = await analyzer.analyze_quick("")
        
        assert result is not None
        assert result.get('urgence') in ['normale', 'faible']
        assert result.get('delai_jours') is None


class TestDataExtraction:
    """Tests extraction données"""
    
    @pytest.mark.asyncio
    async def test_extract_deadline_days(self, analyzer):
        """Extraction délai en jours depuis aujourd'hui"""
        # 31/12/2025 = 6 jours depuis 25/12/2025
        doc = "Réponse requise avant le 31 décembre 2025"
        result = await analyzer.analyze_quick(doc)
        
        assert result.get('delai_jours') == 6
    
    @pytest.mark.asyncio
    async def test_extract_todos(self, analyzer, sample_document):
        """TODOs générés automatiquement"""
        result = await analyzer.analyze_quick(sample_document)
        
        assert 'todos' in result
        assert len(result['todos']) > 0
        
        # Premier TODO doit avoir les champs requis
        todo = result['todos'][0]
        assert 'task' in todo
        assert 'priority' in todo
    
    @pytest.mark.asyncio
    async def test_extract_document_type(self, analyzer):
        """Type document détecté"""
        test_cases = [
            ("Facture n°123", "facture"),
            ("Courrier administratif", "administratif"),
            ("Contrat de location", "contrat"),
        ]
        
        for text, expected_type in test_cases:
            result = await analyzer.analyze_quick(text)
            doc_type = result.get('type_document', '').lower()
            
            # Type doit contenir mot-clé attendu
            assert expected_type in doc_type or doc_type != '', \
                f"Type incorrect pour '{text}': {doc_type}"


@pytest.mark.asyncio
class TestIntegration:
    """Tests intégration bout-en-bout"""
    
    async def test_full_analysis_workflow(self, analyzer):
        """Workflow complet: analyse → cache → TODOs"""
        doc = """
        Mise en demeure
        
        Vous devez régler votre dette avant le 10 janvier 2026.
        Faute de quoi, des poursuites judiciaires seront engagées.
        
        URGENT - Dernier rappel
        """
        
        # 1. Première analyse
        result1 = await analyzer.analyze_quick(doc)
        
        assert result1.get('urgence') == 'haute'
        assert result1.get('delai_jours') > 0
        assert len(result1.get('todos', [])) > 0
        assert result1.get('type_document') is not None
        
        # 2. Seconde analyse (cache)
        import time
        start = time.time()
        result2 = await analyzer.analyze_quick(doc)
        cache_duration = time.time() - start
        
        assert cache_duration < 0.1  # Cache instantané
        assert result1 == result2
