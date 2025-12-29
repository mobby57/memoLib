"""
Test End-to-End: Email → Workspace → Frontend
Envoie un email de test et vérifie qu'il crée un workspace PostgreSQL
"""

import sys
import os
from pathlib import Path

# Ajouter le chemin racine au PYTHONPATH
root_path = Path(__file__).parent.parent.parent
sys.path.insert(0, str(root_path))
sys.path.insert(0, str(root_path / 'src'))

import asyncio
import time
from src.backend.services.email_connector import EmailConnector
from src.backend.services.workspace_service_postgres import get_workspace_service
from src.backend.services.user_service_postgres import get_user_service


async def test_email_to_workspace():
    """Test complet: envoi email → création workspace"""
    
    print("\n" + "="*60)
    print("🧪 TEST END-TO-END: Email → Workspace PostgreSQL")
    print("="*60 + "\n")
    
    # 1. Vérifier l'utilisateur système
    print("1️⃣ Vérification utilisateur système...")
    user_service = get_user_service()
    workspace_service = get_workspace_service()
    
    system_user = user_service.authenticate_user("email_system", "EmailSystem2025!")
    if system_user:
        print(f"   ✅ Utilisateur système trouvé: ID {system_user['id']}")
    else:
        print("   ❌ Utilisateur système non trouvé!")
        return
    
    # 2. Compter workspaces avant
    print("\n2️⃣ État initial...")
    workspaces_before = workspace_service.list_workspaces(user_id=system_user['id'])
    print(f"   📊 Workspaces existants: {len(workspaces_before)}")
    
    # 3. Envoyer un email de test
    print("\n3️⃣ Envoi d'un email de test...")
    connector = EmailConnector()
    
    test_subject = f"[TEST] Email automatique - {time.strftime('%H:%M:%S')}"
    test_body = f"""Ceci est un email de test automatique.

Envoyé à: {time.strftime('%Y-%m-%d %H:%M:%S')}

Ce message devrait créer automatiquement un workspace PostgreSQL.

Contenu du test:
- Subject: {test_subject}
- Body: Ce message
- Priorité attendue: MEDIUM (pas de mot-clé urgent)
- Source: email

Le workspace devrait être visible dans:
- API: http://localhost:5000/api/v2/workspaces
- Frontend: http://localhost:3000/workspaces
"""
    
    recipient = connector.imap_user  # S'envoyer à soi-même
    
    print(f"   📧 Destinataire: {recipient}")
    print(f"   📝 Sujet: {test_subject}")
    
    success = connector.send_email(
        to=recipient,
        subject=test_subject,
        body=test_body
    )
    
    if success:
        print("   ✅ Email envoyé avec succès")
    else:
        print("   ❌ Échec envoi email")
        return
    
    # 4. Attendre que le poller traite l'email
    print("\n4️⃣ Attente du polling (60s max)...")
    print("   ⏳ Le poller V2 devrait traiter l'email au prochain cycle...")
    print("   💡 Si le poller tourne déjà, le workspace sera créé automatiquement")
    
    # Vérifier toutes les 5 secondes pendant 60 secondes
    for i in range(12):  # 12 * 5s = 60s
        await asyncio.sleep(5)
        
        # Vérifier si nouveau workspace créé
        workspaces_now = workspace_service.list_workspaces(user_id=system_user['id'])
        new_workspaces = [ws for ws in workspaces_now if ws not in workspaces_before]
        
        if new_workspaces:
            print(f"\n   ✅ Nouveau workspace détecté après {(i+1)*5}s!")
            break
        else:
            print(f"   ⏳ Vérification {i+1}/12... (pas encore de nouveau workspace)")
    
    # 5. Vérifier résultat final
    print("\n5️⃣ Vérification finale...")
    workspaces_after = workspace_service.list_workspaces(user_id=system_user['id'])
    new_workspaces = [ws for ws in workspaces_after if ws not in workspaces_before]
    
    print(f"   📊 Workspaces avant: {len(workspaces_before)}")
    print(f"   📊 Workspaces après: {len(workspaces_after)}")
    print(f"   📊 Nouveaux workspaces: {len(new_workspaces)}")
    
    if new_workspaces:
        print("\n   ✅ TEST RÉUSSI! Workspace créé depuis l'email")
        
        for ws in new_workspaces:
            print(f"\n   📁 Workspace #{ws['id']}:")
            print(f"      Titre: {ws['title']}")
            print(f"      Source: {ws['source']}")
            print(f"      Priorité: {ws['priority']}")
            print(f"      Statut: {ws['status']}")
            
            # Vérifier les messages
            messages = workspace_service.get_workspace_messages(ws['id'])
            print(f"      Messages: {len(messages)}")
            
            for msg in messages:
                print(f"         - [{msg['role']}] {msg['content'][:80]}...")
            
            # Vérifier metadata email
            if ws.get('workspace_metadata', {}).get('email_data'):
                email_data = ws['workspace_metadata']['email_data']
                print(f"      Email metadata:")
                print(f"         From: {email_data.get('from')}")
                print(f"         Date: {email_data.get('date')}")
                print(f"         Message ID: {email_data.get('message_id', '(none)')[:40]}...")
        
        print("\n   🌐 Accès Frontend: http://localhost:3000/workspaces")
        print("   🔗 Accès API: http://localhost:5000/api/v2/workspaces")
        
    else:
        print("\n   ⚠️ Aucun nouveau workspace trouvé")
        print("   💡 Vérifiez que:")
        print("      - Le poller V2 est démarré: python scripts/start_email_poller_v2.py")
        print("      - L'email est bien arrivé (vérifier boîte mail)")
        print("      - Les logs du poller pour voir s'il traite l'email")
    
    print("\n" + "="*60)
    print("✅ Test terminé")
    print("="*60 + "\n")


if __name__ == '__main__':
    asyncio.run(test_email_to_workspace())
