"""
Test du service Vector Store Files OpenAI
"""
import os
import sys
from dotenv import load_dotenv

# Charger les variables d'environnement
load_dotenv()

# Ajouter le répertoire src au path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'src'))

from backend.app import UnifiedAIService

def test_vector_store_files():
    print("=" * 60)
    print("TEST OPENAI VECTOR STORE FILES API")
    print("=" * 60)
    
    # Récupérer la clé API
    api_key = os.environ.get('OPENAI_API_KEY')
    
    if not api_key:
        print("❌ ERREUR: OPENAI_API_KEY non trouvée dans .env")
        return False
    
    print(f"✓ Clé API trouvée: {api_key[:10]}...")
    
    # Initialiser le service AI avec la clé
    ai_service = UnifiedAIService(api_key=api_key)
    
    # Note: Pour ces tests, vous devez avoir:
    # 1. Un vector store existant
    # 2. Un fichier uploadé
    
    # IDs de test (à remplacer par vos vraies valeurs)
    test_vector_store_id = os.environ.get('TEST_VECTOR_STORE_ID', 'vs_test123')
    test_file_id = os.environ.get('TEST_FILE_ID', 'file_test123')
    
    print("\n⚠️  IMPORTANT:")
    print("   Pour tester complètement, vous devez définir:")
    print(f"   - TEST_VECTOR_STORE_ID dans .env (actuellement: {test_vector_store_id})")
    print(f"   - TEST_FILE_ID dans .env (actuellement: {test_file_id})")
    print("\n   Ces tests sont en mode démo (attendez-vous à des erreurs si IDs invalides)")
    
    # Test 1: Créer un vector store file (attachement)
    print("\n📝 Test 1: Attacher un fichier à un vector store")
    print("-" * 60)
    
    result = ai_service.create_vector_store_file(
        vector_store_id=test_vector_store_id,
        file_id=test_file_id,
        attributes={
            'category': 'emails',
            'priority': 'high',
            'department': 'support'
        }
    )
    
    if result['success']:
        print(f"✅ SUCCÈS")
        print(f"   File ID: {result['id']}")
        print(f"   Status: {result['status']}")
        print(f"   Vector Store: {result['vector_store_id']}")
        print(f"   Usage: {result.get('usage_bytes', 0)} bytes")
        vector_file_id = result['id']
    else:
        print(f"⚠️  ÉCHEC (attendu si IDs de test invalides): {result.get('error')}")
        print("   Continuons avec les tests de démonstration...")
        vector_file_id = test_file_id
    
    # Test 2: Lister les fichiers du vector store
    print("\n📝 Test 2: Lister les fichiers d'un vector store")
    print("-" * 60)
    
    result = ai_service.list_vector_store_files(
        vector_store_id=test_vector_store_id,
        limit=10,
        order='desc'
    )
    
    if result['success']:
        print(f"✅ SUCCÈS")
        print(f"   Nombre de fichiers: {len(result['files'])}")
        print(f"   Has more: {result.get('has_more', False)}")
        
        for idx, file in enumerate(result['files'][:3], 1):
            print(f"   {idx}. File: {file['id']} - Status: {file['status']} ({file.get('usage_bytes', 0)} bytes)")
    else:
        print(f"⚠️  ÉCHEC (attendu si vector store invalide): {result.get('error')}")
    
    # Test 3: Récupérer les détails d'un fichier
    print("\n📝 Test 3: Récupérer les détails d'un fichier")
    print("-" * 60)
    
    result = ai_service.get_vector_store_file(
        vector_store_id=test_vector_store_id,
        file_id=vector_file_id
    )
    
    if result['success']:
        print(f"✅ SUCCÈS")
        print(f"   File ID: {result['id']}")
        print(f"   Status: {result['status']}")
        print(f"   Usage: {result.get('usage_bytes', 0)} bytes")
        print(f"   Created: {result.get('created_at')}")
        
        if result.get('attributes'):
            print(f"   Attributes: {result['attributes']}")
        
        if result.get('chunking_strategy'):
            print(f"   Chunking: {result['chunking_strategy']}")
    else:
        print(f"⚠️  ÉCHEC (attendu si fichier invalide): {result.get('error')}")
    
    # Test 4: Filtrer par statut
    print("\n📝 Test 4: Filtrer les fichiers par statut 'completed'")
    print("-" * 60)
    
    result = ai_service.list_vector_store_files(
        vector_store_id=test_vector_store_id,
        limit=5,
        filter_status='completed'
    )
    
    if result['success']:
        print(f"✅ SUCCÈS")
        print(f"   Fichiers complétés: {len(result['files'])}")
        
        total_bytes = sum(f.get('usage_bytes', 0) for f in result['files'])
        print(f"   Usage total: {total_bytes} bytes ({total_bytes / 1024:.2f} KB)")
    else:
        print(f"⚠️  ÉCHEC: {result.get('error')}")
    
    # Test 5: Supprimer un fichier du vector store
    print("\n📝 Test 5: Retirer un fichier du vector store")
    print("-" * 60)
    print("⚠️  Test de suppression désactivé pour préserver vos données")
    print("   Décommentez le code ci-dessous pour tester réellement:")
    print("""
    result = ai_service.delete_vector_store_file(
        vector_store_id=test_vector_store_id,
        file_id=vector_file_id
    )
    
    if result['success']:
        print(f"✅ Fichier retiré: {result['id']}")
        print(f"   Deleted: {result['deleted']}")
    else:
        print(f"❌ ÉCHEC: {result.get('error')}")
    """)
    
    # Résumé des fonctionnalités
    print("\n" + "=" * 60)
    print("📚 RÉSUMÉ DES FONCTIONNALITÉS")
    print("=" * 60)
    print("\n✅ Méthodes implémentées:")
    print("  • create_vector_store_file() - Attacher un fichier")
    print("  • list_vector_store_files() - Lister les fichiers")
    print("  • get_vector_store_file() - Récupérer détails")
    print("  • delete_vector_store_file() - Retirer un fichier")
    
    print("\n💡 Cas d'usage:")
    print("  • Indexation de documents pour recherche sémantique")
    print("  • Knowledge base pour assistants IA")
    print("  • Recherche dans documentation/FAQ")
    print("  • Analyse de corpus de textes volumineux")
    print("  • Chatbots avec accès à des fichiers de référence")
    
    print("\n🔧 Prochaines étapes pour utilisation réelle:")
    print("  1. Créer un vector store avec l'API OpenAI")
    print("  2. Uploader des fichiers (PDF, TXT, MD, etc.)")
    print("  3. Attacher les fichiers au vector store")
    print("  4. Utiliser avec les Assistants API pour la recherche")
    
    print("\n📖 Exemple de workflow complet:")
    print("""
    # 1. Créer un vector store
    vector_store = client.beta.vector_stores.create(
        name="Email Knowledge Base"
    )
    
    # 2. Uploader un fichier
    file = client.files.create(
        file=open("documentation.pdf", "rb"),
        purpose="assistants"
    )
    
    # 3. Attacher au vector store
    ai_service.create_vector_store_file(
        vector_store_id=vector_store.id,
        file_id=file.id,
        attributes={"type": "documentation"}
    )
    
    # 4. Lister les fichiers
    files = ai_service.list_vector_store_files(
        vector_store_id=vector_store.id
    )
    """)
    
    return True

if __name__ == "__main__":
    try:
        success = test_vector_store_files()
        sys.exit(0 if success else 1)
    except Exception as e:
        print(f"\n❌ ERREUR CRITIQUE: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
