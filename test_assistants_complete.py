#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Test complet des Assistants API (Assistants, Threads, Messages, Runs, Vector Stores)
"""

import os
import sys
import time
import json
from datetime import datetime

# Import API client
sys.path.insert(0, os.path.dirname(__file__))
from src.backend.app import app, ai_service

print("\n" + "="*60)
print("  TEST COMPLET ASSISTANTS API")
print("="*60 + "\n")

# ===== TEST 1: VECTOR STORES =====
print("📦 TEST 1: VECTOR STORES API")
print("-" * 60)

# Créer un vector store
print("\n1. Création d'un vector store...")
vs_result = ai_service.create_vector_store(
    name="Base de connaissances email IAPosteManager",
    metadata={
        'purpose': 'email_knowledge',
        'version': '1.0'
    }
)

if vs_result['success']:
    vector_store_id = vs_result['id']
    print(f"✅ Vector store créé: {vector_store_id}")
    print(f"   Nom: {vs_result['name']}")
    print(f"   Status: {vs_result['status']}")
    print(f"   Fichiers: {vs_result.get('file_counts', {})}")
else:
    print(f"❌ Erreur: {vs_result['error']}")
    vector_store_id = None

# Lister les vector stores
print("\n2. Liste des vector stores...")
vs_list = ai_service.list_vector_stores(limit=10)

if vs_list['success']:
    print(f"✅ {len(vs_list['data'])} vector stores trouvés")
    for vs in vs_list['data'][:3]:
        print(f"   - {vs['id']}: {vs.get('name', 'Sans nom')} (Status: {vs['status']})")
else:
    print(f"❌ Erreur: {vs_list['error']}")

# ===== TEST 2: ASSISTANTS =====
print("\n" + "="*60)
print("🤖 TEST 2: ASSISTANTS API")
print("-" * 60)

# Créer un assistant email
print("\n1. Création d'un assistant email...")
assistant_result = ai_service.create_assistant(
    model="gpt-4-turbo-preview",
    name="Assistant Email Professionnel",
    description="Assistant spécialisé dans la rédaction et gestion d'emails professionnels",
    instructions="""Tu es un assistant email professionnel expert.

Tes responsabilités:
1. Rédiger des emails professionnels clairs et courtois
2. Analyser le ton et le sentiment des emails
3. Proposer des réponses appropriées
4. Classer les emails par priorité
5. Extraire les informations importantes

Style:
- Professionnel mais chaleureux
- Concis et efficace
- Adapté au contexte français

Base de connaissances:
- Conventions emails professionnels
- Formules de politesse
- Gestion des réclamations
""",
    tools=[
        {"type": "file_search"},
        {"type": "code_interpreter"}
    ],
    tool_resources={
        'file_search': {
            'vector_store_ids': [vector_store_id] if vector_store_id else []
        }
    } if vector_store_id else None,
    metadata={
        'type': 'email_assistant',
        'version': '1.0',
        'language': 'fr'
    },
    temperature=0.7
)

if assistant_result['success']:
    assistant_id = assistant_result['id']
    print(f"✅ Assistant créé: {assistant_id}")
    print(f"   Nom: {assistant_result['name']}")
    print(f"   Modèle: {assistant_result['model']}")
    print(f"   Outils: {len(assistant_result.get('tools', []))}")
    print(f"   Temperature: {assistant_result.get('temperature')}")
else:
    print(f"❌ Erreur: {assistant_result['error']}")
    sys.exit(1)

# Récupérer l'assistant
print("\n2. Récupération de l'assistant...")
get_asst = ai_service.get_assistant(assistant_id)

if get_asst['success']:
    print(f"✅ Assistant récupéré")
    print(f"   Instructions: {get_asst['instructions'][:100]}...")
else:
    print(f"❌ Erreur: {get_asst['error']}")

# Lister les assistants
print("\n3. Liste des assistants...")
asst_list = ai_service.list_assistants(limit=5)

if asst_list['success']:
    print(f"✅ {len(asst_list['data'])} assistants trouvés")
    for asst in asst_list['data']:
        print(f"   - {asst['id']}: {asst.get('name', 'Sans nom')} ({asst['model']})")
else:
    print(f"❌ Erreur: {asst_list['error']}")

# ===== TEST 3: THREADS =====
print("\n" + "="*60)
print("💬 TEST 3: THREADS API")
print("-" * 60)

# Créer un thread avec message initial
print("\n1. Création d'un thread avec message initial...")
thread_result = ai_service.create_thread(
    messages=[
        {
            'role': 'user',
            'content': "J'ai reçu un email d'un client mécontent concernant un retard de livraison. Comment puis-je y répondre de manière professionnelle?"
        }
    ],
    metadata={
        'customer_id': 'CUST_12345',
        'topic': 'complaint_delivery',
        'priority': 'high'
    }
)

if thread_result['success']:
    thread_id = thread_result['id']
    print(f"✅ Thread créé: {thread_id}")
    print(f"   Métadonnées: {thread_result.get('metadata')}")
else:
    print(f"❌ Erreur: {thread_result['error']}")
    sys.exit(1)

# Récupérer le thread
print("\n2. Récupération du thread...")
get_thread = ai_service.get_thread(thread_id)

if get_thread['success']:
    print(f"✅ Thread récupéré: {get_thread['id']}")
else:
    print(f"❌ Erreur: {get_thread['error']}")

# ===== TEST 4: MESSAGES =====
print("\n" + "="*60)
print("📨 TEST 4: MESSAGES API")
print("-" * 60)

# Lister les messages du thread
print("\n1. Liste des messages du thread...")
msg_list = ai_service.list_messages(thread_id, limit=10)

if msg_list['success']:
    print(f"✅ {len(msg_list['data'])} messages trouvés")
    for msg in msg_list['data']:
        content = msg['content'][0] if msg['content'] else {}
        text = content.get('text', {}).get('value', '') if isinstance(content, dict) else ''
        print(f"   - [{msg['role']}] {text[:60]}...")
else:
    print(f"❌ Erreur: {msg_list['error']}")

# Ajouter un nouveau message
print("\n2. Ajout d'un message utilisateur...")
new_msg = ai_service.create_message(
    thread_id=thread_id,
    role='user',
    content="Le client attend une réponse urgente. Peux-tu me proposer 3 options de réponse?",
    metadata={'urgent': True}
)

if new_msg['success']:
    message_id = new_msg['id']
    print(f"✅ Message ajouté: {message_id}")
    print(f"   Rôle: {new_msg['role']}")
else:
    print(f"❌ Erreur: {new_msg['error']}")

# ===== TEST 5: RUNS =====
print("\n" + "="*60)
print("🏃 TEST 5: RUNS API")
print("-" * 60)

# Créer un run pour exécuter l'assistant
print("\n1. Création d'un run...")
run_result = ai_service.create_run(
    thread_id=thread_id,
    assistant_id=assistant_id,
    instructions="Analyse la situation et propose 3 options de réponse adaptées au ton professionnel français.",
    metadata={
        'test': True,
        'scenario': 'complaint_handling'
    }
)

if run_result['success']:
    run_id = run_result['id']
    print(f"✅ Run créé: {run_id}")
    print(f"   Status: {run_result['status']}")
    print(f"   Thread: {run_result['thread_id']}")
    print(f"   Assistant: {run_result['assistant_id']}")
else:
    print(f"❌ Erreur: {run_result['error']}")
    sys.exit(1)

# Surveiller le run (polling)
print("\n2. Surveillance du run...")
max_wait = 60  # 60 secondes max
start_time = time.time()
status = run_result['status']

while status in ['queued', 'in_progress'] and (time.time() - start_time) < max_wait:
    time.sleep(2)
    run_status = ai_service.get_run(thread_id, run_id)
    
    if run_status['success']:
        status = run_status['status']
        elapsed = int(time.time() - start_time)
        print(f"   ⏳ Status: {status} ({elapsed}s)")
        
        if status == 'requires_action':
            # Tool calling requis
            print(f"   🔧 Action requise: {run_status.get('required_action')}")
            break
        elif status == 'completed':
            print(f"   ✅ Run terminé!")
            if run_status.get('usage'):
                usage = run_status['usage']
                print(f"   💰 Usage: {usage['total_tokens']} tokens (prompt: {usage['prompt_tokens']}, completion: {usage['completion_tokens']})")
            break
        elif status in ['failed', 'cancelled', 'expired']:
            print(f"   ❌ Run échoué: {status}")
            if run_status.get('last_error'):
                print(f"      Erreur: {run_status['last_error']}")
            break
    else:
        print(f"   ❌ Erreur récupération status: {run_status['error']}")
        break

# Récupérer les messages après le run
if status == 'completed':
    print("\n3. Récupération de la réponse de l'assistant...")
    final_msgs = ai_service.list_messages(thread_id, limit=5)
    
    if final_msgs['success']:
        print(f"✅ {len(final_msgs['data'])} messages dans le thread")
        
        # Afficher le dernier message de l'assistant
        for msg in final_msgs['data']:
            if msg['role'] == 'assistant':
                print(f"\n📝 RÉPONSE DE L'ASSISTANT:")
                print("-" * 60)
                
                for content in msg['content']:
                    if content.get('type') == 'text':
                        text = content['text']['value']
                        print(text)
                        
                        # Annotations (citations)
                        if content['text'].get('annotations'):
                            print(f"\n   📎 {len(content['text']['annotations'])} annotations")
                
                break
    else:
        print(f"❌ Erreur: {final_msgs['error']}")

# Lister les runs du thread
print("\n4. Liste des runs...")
runs_list = ai_service.list_runs(thread_id, limit=5)

if runs_list['success']:
    print(f"✅ {len(runs_list['data'])} runs trouvés")
    for run in runs_list['data']:
        print(f"   - {run['id']}: {run['status']} ({run['model']})")
else:
    print(f"❌ Erreur: {runs_list['error']}")

# ===== TEST 6: RUN STEPS =====
print("\n" + "="*60)
print("👣 TEST 6: RUN STEPS API")
print("-" * 60)

# Lister les steps du run
print("\n1. Liste des steps du run...")
steps_list = ai_service.list_run_steps(thread_id, run_id, limit=10)

if steps_list['success']:
    print(f"✅ {len(steps_list['data'])} steps trouvés")
    
    for step in steps_list['data']:
        print(f"\n   Step {step['id']}:")
        print(f"   - Type: {step['type']}")
        print(f"   - Status: {step['status']}")
        
        if step.get('step_details'):
            details = step['step_details']
            print(f"   - Détails: {details.get('type', 'N/A')}")
            
            if details.get('type') == 'message_creation':
                print(f"      Message créé: {details.get('message_creation', {}).get('message_id')}")
            elif details.get('type') == 'tool_calls':
                print(f"      Tool calls: {len(details.get('tool_calls', []))}")
        
        if step.get('usage'):
            usage = step['usage']
            print(f"   - Tokens: {usage['total_tokens']}")
else:
    print(f"❌ Erreur: {steps_list['error']}")

# ===== TEST 7: MISE À JOUR =====
print("\n" + "="*60)
print("🔄 TEST 7: MISE À JOUR")
print("-" * 60)

# Mettre à jour l'assistant
print("\n1. Mise à jour de l'assistant...")
update_asst = ai_service.update_assistant(
    assistant_id=assistant_id,
    temperature=0.5,
    metadata={
        'type': 'email_assistant',
        'version': '1.1',
        'language': 'fr',
        'updated': datetime.now().isoformat()
    }
)

if update_asst['success']:
    print(f"✅ Assistant mis à jour")
    print(f"   Temperature: {update_asst.get('temperature')}")
    print(f"   Version: {update_asst.get('metadata', {}).get('version')}")
else:
    print(f"❌ Erreur: {update_asst['error']}")

# Mettre à jour le thread
print("\n2. Mise à jour du thread...")
update_thread = ai_service.update_thread(
    thread_id=thread_id,
    metadata={
        'customer_id': 'CUST_12345',
        'topic': 'complaint_delivery',
        'priority': 'high',
        'status': 'resolved',
        'resolved_at': datetime.now().isoformat()
    }
)

if update_thread['success']:
    print(f"✅ Thread mis à jour")
    print(f"   Status: {update_thread.get('metadata', {}).get('status')}")
else:
    print(f"❌ Erreur: {update_thread['error']}")

# ===== TEST 8: NETTOYAGE =====
print("\n" + "="*60)
print("🧹 TEST 8: NETTOYAGE (optionnel)")
print("-" * 60)
print("\n⚠️  Les ressources créées restent disponibles pour inspection.")
print("   Pour supprimer:")

if thread_id:
    print(f"\n   Thread: {thread_id}")
    # delete_thread = ai_service.delete_thread(thread_id)

if assistant_id:
    print(f"   Assistant: {assistant_id}")
    # delete_asst = ai_service.delete_assistant(assistant_id)

if vector_store_id:
    print(f"   Vector Store: {vector_store_id}")
    # delete_vs = ai_service.delete_vector_store(vector_store_id)

# ===== RÉSUMÉ =====
print("\n" + "="*60)
print("📊 RÉSUMÉ DES TESTS")
print("="*60)

print("""
✅ APIs testées:
   1. Vector Stores  - Créer, lister, récupérer
   2. Assistants     - Créer, lister, récupérer, mettre à jour
   3. Threads        - Créer, récupérer, mettre à jour
   4. Messages       - Créer, lister
   5. Runs           - Créer, surveiller, lister
   6. Run Steps      - Lister, détails

🎯 Cas d'usage démontré:
   - Assistant email professionnel avec file search
   - Thread de conversation avec contexte client
   - Run avec surveillance temps réel
   - Analyse des steps d'exécution

💡 Fonctionnalités clés:
   ✓ Création d'assistants spécialisés
   ✓ Base de connaissances (vector stores)
   ✓ Conversations persistantes (threads)
   ✓ Exécution asynchrone (runs)
   ✓ Tool calling (file_search, code_interpreter)
   ✓ Métadonnées personnalisées
   ✓ Surveillance temps réel

📈 Statistiques:
""")

if 'usage' in locals() and run_status.get('usage'):
    usage = run_status['usage']
    cost_per_1k = 0.01  # Prix estimé GPT-4 Turbo
    estimated_cost = (usage['total_tokens'] / 1000) * cost_per_1k
    
    print(f"   Tokens utilisés: {usage['total_tokens']}")
    print(f"   - Prompt: {usage['prompt_tokens']}")
    print(f"   - Completion: {usage['completion_tokens']}")
    print(f"   Coût estimé: ${estimated_cost:.4f}")

print("\n" + "="*60)
print("  ✅ TESTS TERMINÉS")
print("="*60 + "\n")

print("🚀 PROCHAINES ÉTAPES:")
print("   1. Tester avec des vrais emails")
print("   2. Ajouter des fichiers au vector store")
print("   3. Implémenter tool calling personnalisé")
print("   4. Créer interface utilisateur")
print("   5. Optimiser les prompts")
print()
