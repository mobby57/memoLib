"""Test complet de l'API IAPosteManager"""
import requests
import json

API_BASE = 'http://127.0.0.1:5000/api'

# Session pour maintenir les cookies d'authentification
session = requests.Session()

def test_route(method, endpoint, data=None, expected_status=200):
    """Test une route API"""
    url = f"{API_BASE}{endpoint}"
    
    try:
        if method == 'GET':
            response = session.get(url, timeout=5)
        elif method == 'POST':
            response = session.post(url, json=data, timeout=5)
        elif method == 'DELETE':
            response = session.delete(url, timeout=5)
        
        status = "✅" if response.status_code == expected_status else "❌"
        print(f"{status} {method} {endpoint} - {response.status_code}")
        
        if response.status_code == 200:
            try:
                result = response.json()
                if 'success' in result and result['success']:
                    print(f"   📊 Données: {len(str(result))} chars")
                else:
                    print(f"   ⚠️  Success: {result.get('success', 'N/A')}")
            except:
                print(f"   📄 Réponse: {len(response.text)} chars")
        elif response.status_code == 401:
            print(f"   🔒 Non authentifié")
        
        return response.status_code == expected_status
        
    except requests.exceptions.RequestException as e:
        print(f"❌ {method} {endpoint} - ERREUR: {e}")
        return False

def login():
    """Authentification initiale"""
    print("🔐 Authentification...")
    try:
        response = session.post(f"{API_BASE}/auth/login", json={
            'password': 'testpassword123'
        }, timeout=5)
        
        if response.status_code == 200:
            print("✅ Authentification réussie\n")
            return True
        else:
            print(f"⚠️  Authentification échouée ({response.status_code})")
            print("   Continuons sans authentification (certains tests échoueront)\n")
            return False
    except Exception as e:
        print(f"⚠️  Erreur d'authentification: {e}")
        print("   Continuons sans authentification\n")
        return False

def main():
    print("🧪 Test de l'API IAPosteManager")
    print("=" * 50)
    
    # Tenter l'authentification d'abord
    login()
    
    # Test des routes principales
    tests = [
        # Dashboard
        ('GET', '/dashboard/stats'),
        
        # Configuration
        ('GET', '/config/settings'),
        ('POST', '/config/settings', {'theme': 'dark'}),
        
        # Templates
        ('GET', '/templates'),
        ('POST', '/templates', {
            'name': 'Test Template',
            'subject': 'Test Subject',
            'body': 'Test Body',
            'category': 'test'
        }),
        
        # Emails
        ('GET', '/email-history'),
        ('POST', '/send-email', {
            'recipient': 'test@example.com',
            'subject': 'Test Email',
            'body': 'Ceci est un test'
        }),
        
        # IA
        ('POST', '/generate-email', {
            'context': 'demande de congés',
            'tone': 'professionnel'
        }),
        ('POST', '/ai/generate', {
            'context': 'réunion équipe',
            'tone': 'amical'
        }),
        ('POST', '/ai/improve-text', {
            'text': 'bonjour je voudrais savoir',
            'tone': 'professionnel'
        }),
        
        # Contacts
        ('GET', '/contacts'),
        ('POST', '/contacts', {
            'name': 'Test Contact',
            'email': 'contact@test.com',
            'organization': 'Test Org'
        }),
        
        # Auth
        ('POST', '/auth/login', {'password': 'testpassword123'}),
        ('POST', '/auth/logout'),
        
        # Accessibilité
        ('GET', '/accessibility/settings'),
        ('GET', '/accessibility/shortcuts'),
        ('POST', '/accessibility/settings', {'fontSize': 'large'}),
        
        # Vocal
        ('POST', '/voice/transcribe', {'audio': 'fake_audio_data'}),
        ('POST', '/voice/speak', {'text': 'Bonjour test'})
    ]
    
    passed = 0
    total = len(tests)
    
    for test in tests:
        method, endpoint = test[0], test[1]
        data = test[2] if len(test) > 2 else None
        
        if test_route(method, endpoint, data):
            passed += 1
        
        print()  # Ligne vide
    
    print("=" * 50)
    print(f"📊 Résultats: {passed}/{total} tests réussis")
    
    if passed == total:
        print("🎉 Tous les tests sont passés ! API complètement fonctionnelle.")
    else:
        print(f"⚠️  {total - passed} tests ont échoué.")
    
    # Test spécifique de génération
    print("\n🤖 Test spécifique de génération IA:")
    try:
        response = session.post(f"{API_BASE}/generate-email", json={
            'context': 'demande de rendez-vous médical',
            'tone': 'professionnel'
        })
        
        if response.status_code == 200:
            result = response.json()
            print(f"✅ Sujet généré: {result.get('subject', 'N/A')}")
            print(f"✅ Corps généré: {len(result.get('body', ''))} caractères")
        else:
            print(f"❌ Erreur génération: {response.status_code}")
    except Exception as e:
        print(f"❌ Erreur test génération: {e}")
    
    # Test health check
    print("\n💚 Test Health Check (sans auth):")
    try:
        response = requests.get(f"{API_BASE}/health", timeout=5)
        if response.status_code == 200:
            result = response.json()
            print(f"✅ Status: {result.get('status')}")
            print(f"✅ Version: {result.get('version')}")
            print(f"   Services actifs: {sum(result.get('services', {}).values())}/4")
        else:
            print(f"❌ Health check échoué: {response.status_code}")
    except Exception as e:
        print(f"❌ Erreur health check: {e}")

if __name__ == '__main__':
    main()