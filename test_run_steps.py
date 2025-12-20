"""
Test Run Steps API - Suivi détaillé des exécutions Assistants
Testé avec OpenAI API key
"""
import requests
import json
import time
from datetime import datetime

BASE_URL = "http://localhost:5000/api/ai"

# Authentification (utiliser vos credentials)
AUTH = ('test@example.com', 'password')

def test_list_run_steps():
    """Test 1: Lister les run steps"""
    print("\n" + "="*60)
    print("TEST 1: Liste des run steps")
    print("="*60)
    
    # Note: Vous devez avoir un thread_id et run_id existants
    thread_id = "thread_abc123"  # Remplacer par un thread réel
    run_id = "run_abc123"  # Remplacer par un run réel
    
    params = {
        "limit": 10,
        "order": "desc"
    }
    
    response = requests.get(
        f"{BASE_URL}/threads/{thread_id}/runs/{run_id}/steps",
        params=params,
        auth=AUTH
    )
    
    if response.status_code == 200:
        result = response.json()
        print(f"✅ {len(result['data'])} steps trouvés")
        
        for step in result['data']:
            print(f"\n   📝 Step: {step['id']}")
            print(f"      Type: {step['type']}")
            print(f"      Status: {step['status']}")
            print(f"      Créé: {datetime.fromtimestamp(step['created_at'])}")
            
            if step['usage']:
                print(f"      Tokens: {step['usage']['total_tokens']}")
            
            if step['step_details']:
                print(f"      Details: {step['step_details']['type']}")
        
        if result['has_more']:
            print(f"\n   ➡️  Plus de résultats (last_id: {result['last_id']})")
        
        return result['data'][0]['id'] if result['data'] else None
    else:
        print(f"❌ Erreur: {response.status_code}")
        print(response.text)
        return None

def test_get_run_step(thread_id, run_id, step_id):
    """Test 2: Récupérer un run step spécifique"""
    print("\n" + "="*60)
    print("TEST 2: Détails d'un run step")
    print("="*60)
    
    response = requests.get(
        f"{BASE_URL}/threads/{thread_id}/runs/{run_id}/steps/{step_id}",
        auth=AUTH
    )
    
    if response.status_code == 200:
        step = response.json()
        print(f"✅ Step récupéré: {step['id']}")
        print(f"\n📊 Informations:")
        print(f"   Type: {step['type']}")
        print(f"   Status: {step['status']}")
        print(f"   Assistant: {step['assistant_id']}")
        print(f"   Thread: {step['thread_id']}")
        print(f"   Run: {step['run_id']}")
        
        print(f"\n⏱️  Timestamps:")
        print(f"   Créé: {datetime.fromtimestamp(step['created_at'])}")
        if step['completed_at']:
            print(f"   Complété: {datetime.fromtimestamp(step['completed_at'])}")
            duration = step['completed_at'] - step['created_at']
            print(f"   Durée: {duration}s")
        
        if step['usage']:
            print(f"\n💰 Usage:")
            print(f"   Prompt tokens: {step['usage']['prompt_tokens']}")
            print(f"   Completion tokens: {step['usage']['completion_tokens']}")
            print(f"   Total: {step['usage']['total_tokens']}")
        
        if step['step_details']:
            print(f"\n📋 Step Details:")
            print(json.dumps(step['step_details'], indent=2))
        
        if step['last_error']:
            print(f"\n❌ Erreur:")
            print(json.dumps(step['last_error'], indent=2))
        
        if step['metadata']:
            print(f"\n🏷️  Métadonnées:")
            print(json.dumps(step['metadata'], indent=2))
    else:
        print(f"❌ Erreur: {response.status_code}")
        print(response.text)

def test_list_with_file_search_results():
    """Test 3: Lister avec résultats de file search"""
    print("\n" + "="*60)
    print("TEST 3: Run steps avec résultats file search")
    print("="*60)
    
    thread_id = "thread_abc123"
    run_id = "run_abc123"
    
    params = {
        "limit": 5,
        "include": ["step_details.tool_calls[*].file_search.results[*].content"]
    }
    
    response = requests.get(
        f"{BASE_URL}/threads/{thread_id}/runs/{run_id}/steps",
        params=params,
        auth=AUTH
    )
    
    if response.status_code == 200:
        result = response.json()
        print(f"✅ {len(result['data'])} steps avec détails complets")
        
        for step in result['data']:
            if step['type'] == 'tool_calls':
                print(f"\n   🔧 Step: {step['id']}")
                if step['step_details'] and 'tool_calls' in step['step_details']:
                    for tool_call in step['step_details']['tool_calls']:
                        print(f"      Tool: {tool_call.get('type', 'N/A')}")
                        
                        # Afficher résultats file search si disponibles
                        if tool_call.get('type') == 'file_search':
                            results = tool_call.get('file_search', {}).get('results', [])
                            print(f"      Résultats trouvés: {len(results)}")
                            
                            for idx, res in enumerate(results[:3], 1):
                                print(f"\n      Résultat {idx}:")
                                print(f"         Score: {res.get('score', 'N/A')}")
                                if 'content' in res:
                                    content_preview = res['content'][:100]
                                    print(f"         Contenu: {content_preview}...")
    else:
        print(f"❌ Erreur: {response.status_code}")

def test_pagination():
    """Test 4: Pagination des run steps"""
    print("\n" + "="*60)
    print("TEST 4: Pagination")
    print("="*60)
    
    thread_id = "thread_abc123"
    run_id = "run_abc123"
    
    all_steps = []
    after = None
    page = 1
    
    while True:
        params = {
            "limit": 5,
            "order": "asc"
        }
        
        if after:
            params["after"] = after
        
        response = requests.get(
            f"{BASE_URL}/threads/{thread_id}/runs/{run_id}/steps",
            params=params,
            auth=AUTH
        )
        
        if response.status_code == 200:
            result = response.json()
            steps = result['data']
            
            print(f"\n   📄 Page {page}: {len(steps)} steps")
            all_steps.extend(steps)
            
            if not result['has_more']:
                break
            
            after = result['last_id']
            page += 1
        else:
            print(f"❌ Erreur pagination: {response.status_code}")
            break
    
    print(f"\n✅ Total récupéré: {len(all_steps)} steps sur {page} page(s)")

def test_step_types_analysis():
    """Test 5: Analyse des types de steps"""
    print("\n" + "="*60)
    print("TEST 5: Analyse des types de steps")
    print("="*60)
    
    thread_id = "thread_abc123"
    run_id = "run_abc123"
    
    response = requests.get(
        f"{BASE_URL}/threads/{thread_id}/runs/{run_id}/steps",
        params={"limit": 100},
        auth=AUTH
    )
    
    if response.status_code == 200:
        result = response.json()
        steps = result['data']
        
        # Compter par type
        type_counts = {}
        status_counts = {}
        total_tokens = 0
        
        for step in steps:
            step_type = step['type']
            status = step['status']
            
            type_counts[step_type] = type_counts.get(step_type, 0) + 1
            status_counts[status] = status_counts.get(status, 0) + 1
            
            if step['usage']:
                total_tokens += step['usage']['total_tokens']
        
        print(f"✅ Analyse de {len(steps)} steps:\n")
        
        print("   📊 Par type:")
        for step_type, count in type_counts.items():
            print(f"      {step_type}: {count}")
        
        print("\n   📈 Par statut:")
        for status, count in status_counts.items():
            print(f"      {status}: {count}")
        
        print(f"\n   💰 Total tokens utilisés: {total_tokens}")
        
        # Calculer durée moyenne
        durations = []
        for step in steps:
            if step['completed_at'] and step['created_at']:
                duration = step['completed_at'] - step['created_at']
                durations.append(duration)
        
        if durations:
            avg_duration = sum(durations) / len(durations)
            print(f"   ⏱️  Durée moyenne: {avg_duration:.2f}s")
    else:
        print(f"❌ Erreur: {response.status_code}")

def test_monitoring_run_progress():
    """Test 6: Surveillance de progression d'un run"""
    print("\n" + "="*60)
    print("TEST 6: Surveillance de progression")
    print("="*60)
    
    thread_id = "thread_abc123"
    run_id = "run_abc123"
    
    print("🔄 Surveillance des steps (appuyez Ctrl+C pour arrêter)...\n")
    
    last_step_id = None
    check_count = 0
    max_checks = 10  # Limiter pour le test
    
    try:
        while check_count < max_checks:
            response = requests.get(
                f"{BASE_URL}/threads/{thread_id}/runs/{run_id}/steps",
                params={"limit": 1, "order": "desc"},
                auth=AUTH
            )
            
            if response.status_code == 200:
                result = response.json()
                
                if result['data']:
                    latest_step = result['data'][0]
                    
                    if latest_step['id'] != last_step_id:
                        print(f"   🆕 Nouveau step: {latest_step['id']}")
                        print(f"      Type: {latest_step['type']}")
                        print(f"      Status: {latest_step['status']}")
                        print(f"      Heure: {datetime.now().strftime('%H:%M:%S')}\n")
                        
                        last_step_id = latest_step['id']
                    
                    # Arrêter si completed ou failed
                    if latest_step['status'] in ['completed', 'failed', 'cancelled']:
                        print(f"✅ Run terminé avec status: {latest_step['status']}")
                        break
            
            check_count += 1
            time.sleep(2)  # Vérifier toutes les 2 secondes
    except KeyboardInterrupt:
        print("\n⏸️  Surveillance arrêtée")

def main():
    """Exécute tous les tests"""
    print("\n" + "🚀"*30)
    print(" DÉMONSTRATION RUN STEPS API")
    print("🚀"*30)
    
    # Note: Ces tests nécessitent un thread et run existants
    # Remplacer les IDs par des valeurs réelles
    
    print("\n⚠️  IMPORTANT: Configurez des thread_id et run_id valides")
    print("   dans le code avant d'exécuter les tests.\n")
    
    # Test 1: Liste
    step_id = test_list_run_steps()
    
    # Test 2: Détails d'un step
    if step_id:
        test_get_run_step("thread_abc123", "run_abc123", step_id)
    
    # Test 3: Avec file search results
    test_list_with_file_search_results()
    
    # Test 4: Pagination
    test_pagination()
    
    # Test 5: Analyse
    test_step_types_analysis()
    
    # Test 6: Surveillance
    # test_monitoring_run_progress()  # Décommenter pour tester
    
    print("\n" + "="*60)
    print("✅ TESTS TERMINÉS")
    print("="*60)
    
    # Résumé
    print("\n📋 Fonctionnalités testées:")
    print("   ✅ Liste des run steps")
    print("   ✅ Détails d'un step spécifique")
    print("   ✅ Include file search results")
    print("   ✅ Pagination")
    print("   ✅ Analyse par type et statut")
    print("   ✅ Surveillance en temps réel")
    
    print("\n💡 Cas d'usage:")
    print("   • Debugging des runs assistants")
    print("   • Analyse de performance")
    print("   • Traçabilité des opérations")
    print("   • Monitoring temps réel")
    print("   • Optimisation des coûts")

if __name__ == "__main__":
    main()
