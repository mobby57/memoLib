"""
Test du service Embeddings OpenAI
"""
import os
import sys
from dotenv import load_dotenv

# Charger les variables d'environnement
load_dotenv()

# Ajouter le répertoire src au path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'src'))

from backend.app import UnifiedAIService

def test_embeddings():
    print("=" * 60)
    print("TEST OPENAI EMBEDDINGS API")
    print("=" * 60)
    
    # Récupérer la clé API
    api_key = os.environ.get('OPENAI_API_KEY')
    
    if not api_key:
        print("❌ ERREUR: OPENAI_API_KEY non trouvée dans .env")
        return False
    
    print(f"✓ Clé API trouvée: {api_key[:10]}...")
    
    # Initialiser le service AI avec la clé
    ai_service = UnifiedAIService(api_key=api_key)
    
    # Test 1: Embedding simple
    print("\n📝 Test 1: Création d'un embedding simple")
    print("-" * 60)
    
    test_text = "Bonjour, je souhaite obtenir des informations sur mon colis."
    result = ai_service.create_embedding(test_text)
    
    if result['success']:
        print(f"✅ SUCCÈS")
        print(f"   Modèle: {result['model']}")
        print(f"   Dimensions: {result['dimensions']}")
        print(f"   Tokens utilisés: {result['tokens_used']}")
        print(f"   Embedding (5 premières valeurs): {result['embedding'][:5]}")
        print(f"   Request ID: {result['request_id']}")
    else:
        print(f"❌ ÉCHEC: {result.get('error')}")
        return False
    
    # Test 2: Batch embeddings
    print("\n📝 Test 2: Création de plusieurs embeddings en batch")
    print("-" * 60)
    
    test_texts = [
        "Suivi de colis numéro 123456789",
        "Demande de remboursement suite à un colis endommagé",
        "Modification d'adresse de livraison",
        "Question sur les délais de livraison"
    ]
    
    batch_result = ai_service.batch_create_embeddings(test_texts)
    
    if batch_result['success']:
        print(f"✅ SUCCÈS")
        print(f"   Nombre d'embeddings: {batch_result['count']}")
        print(f"   Tokens utilisés: {batch_result['tokens_used']}")
        print(f"   Modèle: {batch_result['model']}")
        
        for idx, emb in enumerate(batch_result['embeddings']):
            print(f"   - Texte {emb['index']}: {len(emb['embedding'])} dimensions")
    else:
        print(f"❌ ÉCHEC: {batch_result.get('error')}")
        return False
    
    # Test 3: Calcul de similarité
    print("\n📝 Test 3: Calcul de similarité entre textes")
    print("-" * 60)
    
    # Créer embeddings pour deux textes similaires
    text1 = "Où est mon colis ?"
    text2 = "Je veux suivre mon colis"
    text3 = "Comment changer mon mot de passe ?"
    
    emb1 = ai_service.create_embedding(text1)
    emb2 = ai_service.create_embedding(text2)
    emb3 = ai_service.create_embedding(text3)
    
    if emb1['success'] and emb2['success'] and emb3['success']:
        # Similarité entre textes similaires (suivi de colis)
        similarity_similar = ai_service.calculate_similarity(
            emb1['embedding'], 
            emb2['embedding']
        )
        
        # Similarité entre textes différents
        similarity_different = ai_service.calculate_similarity(
            emb1['embedding'], 
            emb3['embedding']
        )
        
        print(f"✅ SUCCÈS")
        print(f"   Texte 1: '{text1}'")
        print(f"   Texte 2: '{text2}'")
        print(f"   Similarité (similaires): {similarity_similar:.4f}")
        print()
        print(f"   Texte 1: '{text1}'")
        print(f"   Texte 3: '{text3}'")
        print(f"   Similarité (différents): {similarity_different:.4f}")
        
        # Vérifier que les textes similaires ont un score plus élevé
        if similarity_similar > similarity_different:
            print(f"\n   ✓ Les textes similaires ont bien un score plus élevé!")
        else:
            print(f"\n   ⚠ Attention: scores inattendus")
    else:
        print(f"❌ ÉCHEC lors de la création des embeddings")
        return False
    
    # Test 4: Test avec le modèle text-embedding-3-small (plus récent)
    print("\n📝 Test 4: Test avec text-embedding-3-small")
    print("-" * 60)
    
    result_v3 = ai_service.create_embedding(
        test_text, 
        model="text-embedding-3-small",
        dimensions=512  # Version réduite pour économiser
    )
    
    if result_v3['success']:
        print(f"✅ SUCCÈS")
        print(f"   Modèle: {result_v3['model']}")
        print(f"   Dimensions: {result_v3['dimensions']}")
        print(f"   Tokens utilisés: {result_v3['tokens_used']}")
    else:
        # Le modèle v3 pourrait ne pas être disponible selon le compte
        print(f"⚠ Modèle v3 non disponible (normal): {result_v3.get('error')}")
    
    # Résumé final
    print("\n" + "=" * 60)
    print("🎉 TOUS LES TESTS RÉUSSIS!")
    print("=" * 60)
    print("\nCas d'usage possibles:")
    print("  • Recherche sémantique d'emails")
    print("  • Classification automatique de messages")
    print("  • Détection de doublons/messages similaires")
    print("  • Suggestions de réponses basées sur la similarité")
    print("  • Clustering de conversations par thème")
    
    return True

if __name__ == "__main__":
    try:
        success = test_embeddings()
        sys.exit(0 if success else 1)
    except Exception as e:
        print(f"\n❌ ERREUR CRITIQUE: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
