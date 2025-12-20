#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Test rapide de la clé OpenAI et des APIs Assistants
"""

import os
import sys

# Configure UTF-8 encoding for Windows console
if sys.platform == 'win32':
    import codecs
    sys.stdout = codecs.getwriter('utf-8')(sys.stdout.buffer, 'strict')
    sys.stderr = codecs.getwriter('utf-8')(sys.stderr.buffer, 'strict')

print("\n" + "="*70)
print("  TEST CLE OPENAI - Verification Configuration")
print("="*70 + "\n")

# 1. Vérifier la présence de la clé
openai_key = os.environ.get('OPENAI_API_KEY')

if not openai_key:
    print("ERREUR: OPENAI_API_KEY n'est pas definie")
    print("\nPour definir la cle:")
    print("  PowerShell: $env:OPENAI_API_KEY='sk-...'")
    print("  CMD: set OPENAI_API_KEY=sk-...")
    print("  Ou ajoutez dans .env")
    sys.exit(1)

print(f"CLE OPENAI: {openai_key[:10]}...{openai_key[-4:]} ({len(openai_key)} caracteres)")

# 2. Tester l'importation OpenAI
print("\n" + "-"*70)
print("Test 1: Import OpenAI SDK")
print("-"*70)

try:
    from openai import OpenAI
    print("OK - OpenAI SDK importe avec succes")
except ImportError as e:
    print(f"ERREUR - Impossible d'importer OpenAI: {e}")
    print("\nInstallez avec: pip install openai>=1.0.0")
    sys.exit(1)

# 3. Tester la création du client
print("\n" + "-"*70)
print("Test 2: Creation du client OpenAI")
print("-"*70)

try:
    client = OpenAI(api_key=openai_key)
    print("OK - Client OpenAI cree")
    print(f"   Type: {type(client)}")
    print(f"   Base URL: {client.base_url}")
except Exception as e:
    print(f"ERREUR - Creation client echouee: {e}")
    sys.exit(1)

# 4. Vérifier l'accès à vector_stores (racine, pas beta!)
print("\n" + "-"*70)
print("Test 3: Verification API Vector Stores")
print("-"*70)

try:
    # Vérifier que vector_stores existe au niveau racine
    if hasattr(client, 'vector_stores'):
        print("OK - client.vector_stores existe (niveau racine)")
    else:
        print("ERREUR - client.vector_stores n'existe pas")
        print(f"   Attributs disponibles: {[a for a in dir(client) if not a.startswith('_')][:20]}")
        sys.exit(1)
        
except Exception as e:
    print(f"ERREUR - Verification vector_stores echouee: {e}")
    sys.exit(1)

# 5. Test simple avec l'API (liste les modèles)
print("\n" + "-"*70)
print("Test 4: Appel API reel - Liste des modeles")
print("-"*70)

try:
    models = client.models.list()
    model_count = len(list(models))
    print(f"OK - API repond ({model_count} modeles disponibles)")
    
    # Afficher quelques modèles
    models = client.models.list()
    gpt_models = [m.id for m in models if 'gpt' in m.id.lower()][:5]
    if gpt_models:
        print(f"   Modeles GPT detectes: {', '.join(gpt_models)}")
        
except Exception as e:
    print(f"ERREUR - Appel API echoue: {e}")
    print("\nVerifiez que votre cle est valide sur:")
    print("  https://platform.openai.com/api-keys")
    sys.exit(1)

# 6. Test UnifiedAIService
print("\n" + "-"*70)
print("Test 5: UnifiedAIService du projet")
print("-"*70)

try:
    sys.path.insert(0, os.path.dirname(__file__))
    from src.backend.app import UnifiedAIService
    
    ai_service = UnifiedAIService(openai_key)
    
    if ai_service.client:
        print("OK - UnifiedAIService initialise")
        print(f"   Client: {type(ai_service.client)}")
        
        # Vérifier que les méthodes existent
        methods = ['create_assistant', 'create_thread', 'create_message', 
                   'create_run', 'create_vector_store']
        missing = [m for m in methods if not hasattr(ai_service, m)]
        
        if missing:
            print(f"ATTENTION - Methodes manquantes: {missing}")
        else:
            print(f"OK - Toutes les methodes Assistants sont presentes")
    else:
        print("ERREUR - UnifiedAIService.client est None")
        sys.exit(1)
        
except Exception as e:
    print(f"ERREUR - UnifiedAIService echoue: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)

# Résumé
print("\n" + "="*70)
print("  RESULTAT FINAL")
print("="*70)
print("\nTOUS LES TESTS REUSSIS!")
print("\nVotre configuration est correcte:")
print("  - Cle OpenAI valide")
print("  - SDK OpenAI >= 1.0 installe")
print("  - API Beta Vector Stores disponible")
print("  - UnifiedAIService fonctionnel")
print("\nVous pouvez maintenant executer:")
print("  python test_assistants_complete.py")
print("\n" + "="*70 + "\n")
