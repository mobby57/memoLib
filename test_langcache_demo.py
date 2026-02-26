"""
Test Redis LangCache - Démonstration
Cache sémantique pour IA CESEDA
"""
from src.backend.services.redis_langcache import redis_langcache
from src.backend.services.ceseda_semantic_ai import ceseda_semantic
import json

def demo_langcache():
    """Démonstration complète LangCache"""
    
    print("🚀 Test Redis LangCache - IA CESEDA")
    print("=" * 50)
    
    if not redis_langcache.enabled:
        print("❌ LangCache non configuré (vérifiez .env)")
        return
    
    # 1. Test sauvegarde
    print("\n1️⃣ Test sauvegarde...")
    saved = redis_langcache.set(
        prompt="Recours préfecture délai respecté documents complets",
        response=json.dumps({
            "success_probability": 0.92,
            "confidence": 0.95,
            "factors": ["délai_ok", "docs_complets"]
        })
    )
    print(f"Sauvegarde: {'✅ OK' if saved else '❌ Erreur'}")
    
    # 2. Test recherche sémantique
    print("\n2️⃣ Test recherche sémantique...")
    results = redis_langcache.search(
        prompt="Recours avec délai OK et documents OK",
        similarity_threshold=0.8
    )
    print(f"Résultats trouvés: {len(results)}")
    
    if results:
        best = results[0]
        print(f"Meilleur match: {best.get('similarity', 0):.2f} similarité")
        print(f"Réponse: {best.get('response', 'N/A')[:100]}...")
    
    # 3. Test prédiction avec cache
    print("\n3️⃣ Test prédiction IA sémantique...")
    prediction = ceseda_semantic.predict_with_semantic_cache(
        "Recours urgent délai respecté"
    )
    
    print(f"Source: {prediction.get('source', 'unknown')}")
    print(f"Cache hit: {prediction.get('cache_hit', False)}")
    print(f"Probabilité succès: {prediction.get('success_probability', 0):.2f}")
    
    print("\n✅ Démonstration terminée!")

if __name__ == "__main__":
    demo_langcache()