"""
Test Chat Completions API - Démo de conversation
Testé avec OpenAI API key
"""
import requests
import json
from datetime import datetime

BASE_URL = "http://localhost:5000/api/ai/chat/completions"

# Authentification (utiliser vos credentials)
AUTH = ('test@example.com', 'password')

def test_basic_completion():
    """Test 1: Completion simple"""
    print("\n" + "="*60)
    print("TEST 1: Completion simple")
    print("="*60)
    
    payload = {
        "messages": [
            {"role": "system", "content": "Tu es un assistant spécialisé en gestion d'emails professionnels."},
            {"role": "user", "content": "Écris une réponse polie pour refuser une demande de réunion car mon agenda est complet."}
        ],
        "model": "gpt-4o-mini",
        "temperature": 0.7,
        "max_tokens": 200
    }
    
    response = requests.post(BASE_URL, json=payload, auth=AUTH)
    
    if response.status_code == 200:
        result = response.json()
        print(f"✅ Completion créée: {result['id']}")
        print(f"📊 Modèle: {result['model']}")
        print(f"💬 Réponse:\n{result['choices'][0]['message']['content']}")
        print(f"\n📈 Usage:")
        print(f"   - Tokens prompt: {result['usage']['prompt_tokens']}")
        print(f"   - Tokens completion: {result['usage']['completion_tokens']}")
        print(f"   - Total: {result['usage']['total_tokens']}")
        return result['id']
    else:
        print(f"❌ Erreur: {response.status_code}")
        print(response.text)
        return None

def test_stored_completion():
    """Test 2: Completion avec stockage"""
    print("\n" + "="*60)
    print("TEST 2: Completion stockée avec métadonnées")
    print("="*60)
    
    payload = {
        "messages": [
            {"role": "user", "content": "Quelle est la différence entre les modèles GPT-4 et GPT-3.5?"}
        ],
        "model": "gpt-4o-mini",
        "temperature": 0.5,
        "max_tokens": 300,
        "store": True,
        "metadata": {
            "user": "test_user",
            "category": "qa",
            "timestamp": datetime.now().isoformat()
        }
    }
    
    response = requests.post(BASE_URL, json=payload, auth=AUTH)
    
    if response.status_code == 200:
        result = response.json()
        print(f"✅ Completion stockée: {result['id']}")
        print(f"💬 Réponse:\n{result['choices'][0]['message']['content'][:200]}...")
        return result['id']
    else:
        print(f"❌ Erreur: {response.status_code}")
        return None

def test_get_completion(completion_id):
    """Test 3: Récupération d'une completion"""
    print("\n" + "="*60)
    print("TEST 3: Récupération de completion")
    print("="*60)
    
    response = requests.get(f"{BASE_URL}/{completion_id}", auth=AUTH)
    
    if response.status_code == 200:
        result = response.json()
        print(f"✅ Completion récupérée: {result['id']}")
        print(f"📅 Créée le: {datetime.fromtimestamp(result['created'])}")
        print(f"📊 Modèle: {result['model']}")
        if 'metadata' in result:
            print(f"🏷️  Métadonnées: {json.dumps(result['metadata'], indent=2)}")
    else:
        print(f"❌ Erreur: {response.status_code}")

def test_list_completions():
    """Test 4: Liste des completions"""
    print("\n" + "="*60)
    print("TEST 4: Liste des completions")
    print("="*60)
    
    params = {
        "limit": 5,
        "order": "desc"
    }
    
    response = requests.get(BASE_URL, params=params, auth=AUTH)
    
    if response.status_code == 200:
        result = response.json()
        print(f"✅ {len(result['completions'])} completions trouvées")
        
        for comp in result['completions']:
            print(f"\n   📝 {comp['id']}")
            print(f"      Modèle: {comp['model']}")
            print(f"      Créée: {datetime.fromtimestamp(comp['created'])}")
            print(f"      Tokens: {comp['usage']['total_tokens']}")
        
        if result['has_more']:
            print(f"\n   ➡️  Plus de résultats disponibles (last_id: {result['last_id']})")
    else:
        print(f"❌ Erreur: {response.status_code}")

def test_update_completion(completion_id):
    """Test 5: Mise à jour des métadonnées"""
    print("\n" + "="*60)
    print("TEST 5: Mise à jour métadonnées")
    print("="*60)
    
    payload = {
        "metadata": {
            "status": "reviewed",
            "rating": "5",
            "reviewed_by": "admin",
            "review_date": datetime.now().isoformat()
        }
    }
    
    response = requests.post(f"{BASE_URL}/{completion_id}", json=payload, auth=AUTH)
    
    if response.status_code == 200:
        result = response.json()
        print(f"✅ Métadonnées mises à jour")
        print(f"🏷️  Nouvelles métadonnées: {json.dumps(result['metadata'], indent=2)}")
    else:
        print(f"❌ Erreur: {response.status_code}")

def test_conversation():
    """Test 6: Conversation multi-tours"""
    print("\n" + "="*60)
    print("TEST 6: Conversation multi-tours")
    print("="*60)
    
    conversation = [
        {"role": "system", "content": "Tu es un expert en marketing par email."},
        {"role": "user", "content": "Quels sont les meilleurs moments pour envoyer des emails professionnels?"}
    ]
    
    # Premier tour
    response = requests.post(BASE_URL, json={
        "messages": conversation,
        "model": "gpt-4o-mini",
        "max_tokens": 150
    }, auth=AUTH)
    
    if response.status_code == 200:
        result = response.json()
        assistant_reply = result['choices'][0]['message']['content']
        
        print(f"👤 User: {conversation[-1]['content']}")
        print(f"🤖 Assistant: {assistant_reply}\n")
        
        # Ajouter la réponse à l'historique
        conversation.append({"role": "assistant", "content": assistant_reply})
        
        # Deuxième tour
        conversation.append({"role": "user", "content": "Et pour les emails marketing?"})
        
        response2 = requests.post(BASE_URL, json={
            "messages": conversation,
            "model": "gpt-4o-mini",
            "max_tokens": 150
        }, auth=AUTH)
        
        if response2.status_code == 200:
            result2 = response2.json()
            assistant_reply2 = result2['choices'][0]['message']['content']
            
            print(f"👤 User: {conversation[-1]['content']}")
            print(f"🤖 Assistant: {assistant_reply2}")
            
            print(f"\n📊 Conversation tokens: {result['usage']['total_tokens'] + result2['usage']['total_tokens']}")

def test_structured_output():
    """Test 7: Réponse structurée (JSON)"""
    print("\n" + "="*60)
    print("TEST 7: Réponse structurée JSON")
    print("="*60)
    
    payload = {
        "messages": [
            {
                "role": "system",
                "content": "Tu extrais les informations clés d'emails et les retournes en JSON."
            },
            {
                "role": "user",
                "content": """
                Email: Bonjour,
                
                Je souhaite organiser une réunion le 15 mars à 14h pour discuter du projet Alpha.
                Pouvez-vous confirmer votre disponibilité?
                
                Cordialement,
                Jean Dupont
                """
            }
        ],
        "model": "gpt-4o-mini",
        "response_format": {"type": "json_object"},
        "temperature": 0.3
    }
    
    response = requests.post(BASE_URL, json=payload, auth=AUTH)
    
    if response.status_code == 200:
        result = response.json()
        content = result['choices'][0]['message']['content']
        
        try:
            data = json.loads(content)
            print(f"✅ Données extraites:")
            print(json.dumps(data, indent=2, ensure_ascii=False))
        except:
            print(f"⚠️  Contenu: {content}")

def test_delete_completion(completion_id):
    """Test 8: Suppression d'une completion"""
    print("\n" + "="*60)
    print("TEST 8: Suppression de completion")
    print("="*60)
    
    response = requests.delete(f"{BASE_URL}/{completion_id}", auth=AUTH)
    
    if response.status_code == 200:
        result = response.json()
        print(f"✅ Completion supprimée: {result['id']}")
        print(f"🗑️  Deleted: {result['deleted']}")
    else:
        print(f"❌ Erreur: {response.status_code}")

def main():
    """Exécute tous les tests"""
    print("\n" + "🚀"*30)
    print(" DÉMONSTRATION CHAT COMPLETIONS API")
    print("🚀"*30)
    
    # Test 1: Completion simple
    completion_id_1 = test_basic_completion()
    
    # Test 2: Completion stockée
    completion_id_2 = test_stored_completion()
    
    # Test 3: Récupération
    if completion_id_2:
        test_get_completion(completion_id_2)
    
    # Test 4: Liste
    test_list_completions()
    
    # Test 5: Mise à jour
    if completion_id_2:
        test_update_completion(completion_id_2)
    
    # Test 6: Conversation
    test_conversation()
    
    # Test 7: Sortie structurée
    test_structured_output()
    
    # Test 8: Suppression
    if completion_id_2:
        test_delete_completion(completion_id_2)
    
    print("\n" + "="*60)
    print("✅ TOUS LES TESTS TERMINÉS")
    print("="*60)
    
    # Résumé
    print("\n📋 Résumé des fonctionnalités testées:")
    print("   ✅ Completion simple")
    print("   ✅ Completion stockée avec métadonnées")
    print("   ✅ Récupération de completion")
    print("   ✅ Liste des completions")
    print("   ✅ Mise à jour des métadonnées")
    print("   ✅ Conversation multi-tours")
    print("   ✅ Réponse structurée JSON")
    print("   ✅ Suppression de completion")
    
    print("\n💡 Cas d'usage:")
    print("   • Génération de réponses emails automatiques")
    print("   • Analyse et extraction d'informations")
    print("   • Conversations contextuelles")
    print("   • Suggestions intelligentes")
    print("   • Classification et tri d'emails")

if __name__ == "__main__":
    main()
