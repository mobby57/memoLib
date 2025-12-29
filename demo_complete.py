#!/usr/bin/env python
"""
Script de démonstration complète du système IA Poste Manager

Ce script démontre le flux complet:
1. Login API
2. Création workspace
3. Ajout messages
4. Récupération données
"""

import sys
from pathlib import Path
import requests
from datetime import datetime
import json

# Add paths
root_path = Path(__file__).parent
sys.path.insert(0, str(root_path))
sys.path.insert(0, str(root_path / 'src'))

BASE_URL = "http://localhost:5000/api/v2"

def print_section(title):
    """Affiche un titre de section"""
    print(f"\n{'='*60}")
    print(f"  {title}")
    print(f"{'='*60}\n")

def main():
    print_section("🎉 DÉMONSTRATION SYSTÈME IA POSTE MANAGER")
    
    # 1. Login
    print_section("1️⃣ Authentication JWT")
    login_data = {
        "username": "email_system",
        "password": "EmailSystem2025!"
    }
    
    print(f"📧 Login as: {login_data['username']}")
    response = requests.post(
        f"{BASE_URL}/auth/login",
        json=login_data,
        headers={"Content-Type": "application/json"}
    )
    
    if response.status_code != 200:
        print(f"❌ Login failed: {response.text}")
        return
    
    result = response.json()
    token = result['user']['token']
    user = result['user']
    
    print(f"✅ Login successful!")
    print(f"   User ID: {user['id']}")
    print(f"   Username: {user['username']}")
    print(f"   Role: {user['role']}")
    print(f"   Token: {token[:50]}...")
    
    headers = {"Authorization": f"Bearer {token}"}
    
    # 2. List existing workspaces
    print_section("2️⃣ Liste des Workspaces Existants")
    response = requests.get(f"{BASE_URL}/workspaces", headers=headers)
    
    if response.status_code != 200:
        print(f"❌ Failed to list workspaces: {response.text}")
        return
    
    workspaces_data = response.json()
    print(f"📊 Total workspaces: {workspaces_data['total']}")
    
    for ws in workspaces_data['workspaces'][:5]:
        print(f"   • ID {ws['id']}: {ws['title']}")
        print(f"     Source: {ws['source']} | Priority: {ws['priority']} | Status: {ws['status']}")
    
    # 3. Create new workspace
    print_section("3️⃣ Création Nouveau Workspace")
    
    new_workspace = {
        "title": f"[DEMO] Test Complet - {datetime.now().strftime('%H:%M:%S')}",
        "source": "api",
        "priority": "MEDIUM",
        "workspace_metadata": {
            "demo": True,
            "created_by": "demo_script",
            "timestamp": datetime.now().isoformat()
        }
    }
    
    print(f"📝 Creating: {new_workspace['title']}")
    response = requests.post(
        f"{BASE_URL}/workspaces",
        json=new_workspace,
        headers={**headers, "Content-Type": "application/json"}
    )
    
    if response.status_code != 201:
        print(f"❌ Failed to create workspace: {response.text}")
        return
    
    workspace = response.json()['workspace']
    workspace_id = workspace['id']
    
    print(f"✅ Workspace créé!")
    print(f"   ID: {workspace_id}")
    print(f"   Title: {workspace['title']}")
    print(f"   Status: {workspace['status']}")
    print(f"   Priority: {workspace['priority']}")
    
    # 4. Add messages
    print_section("4️⃣ Ajout de Messages")
    
    messages = [
        {
            "role": "USER",
            "content": "Bonjour, j'aimerais obtenir des informations sur vos services.",
            "message_metadata": {"type": "question"}
        },
        {
            "role": "ASSISTANT",
            "content": "Bonjour! Je serais ravi de vous aider. Quels services vous intéressent particulièrement?",
            "message_metadata": {"type": "response"}
        },
        {
            "role": "USER",
            "content": "Je cherche des informations sur la gestion automatisée d'emails.",
            "message_metadata": {"type": "follow_up"}
        }
    ]
    
    for i, msg_data in enumerate(messages, 1):
        print(f"💬 Adding message {i}/{len(messages)}: {msg_data['role']}")
        response = requests.post(
            f"{BASE_URL}/workspaces/{workspace_id}/messages",
            json=msg_data,
            headers={**headers, "Content-Type": "application/json"}
        )
        
        if response.status_code != 201:
            print(f"   ❌ Failed: {response.text}")
        else:
            msg = response.json()['message']
            print(f"   ✅ Message ID: {msg['id']}")
    
    # 5. Retrieve workspace with messages
    print_section("5️⃣ Récupération Workspace Complet")
    
    response = requests.get(
        f"{BASE_URL}/workspaces/{workspace_id}",
        headers=headers
    )
    
    if response.status_code != 200:
        print(f"❌ Failed to get workspace: {response.text}")
        return
    
    ws_detail = response.json()['workspace']
    print(f"📋 Workspace Details:")
    print(f"   ID: {ws_detail['id']}")
    print(f"   Title: {ws_detail['title']}")
    print(f"   Created: {ws_detail['created_at']}")
    print(f"   Updated: {ws_detail['updated_at']}")
    
    # 6. Get messages
    response = requests.get(
        f"{BASE_URL}/workspaces/{workspace_id}/messages",
        headers=headers
    )
    
    if response.status_code != 200:
        print(f"❌ Failed to get messages: {response.text}")
        return
    
    messages_data = response.json()
    print(f"\n💬 Messages ({messages_data['total']}):")
    for msg in messages_data['messages']:
        print(f"\n   [{msg['role']}] {msg['created_at']}")
        print(f"   {msg['content'][:100]}...")
    
    # 7. Update workspace
    print_section("6️⃣ Mise à Jour Workspace")
    
    update_data = {
        "status": "COMPLETED",
        "progress": 100.0
    }
    
    print(f"📝 Updating workspace {workspace_id}")
    print(f"   Status: IN_PROGRESS → COMPLETED")
    print(f"   Progress: 0% → 100%")
    
    response = requests.put(
        f"{BASE_URL}/workspaces/{workspace_id}",
        json=update_data,
        headers={**headers, "Content-Type": "application/json"}
    )
    
    if response.status_code != 200:
        print(f"❌ Failed to update: {response.text}")
        return
    
    updated_ws = response.json()['workspace']
    print(f"✅ Updated successfully!")
    print(f"   Status: {updated_ws['status']}")
    print(f"   Progress: {updated_ws['progress']}%")
    if updated_ws.get('completed_at'):
        print(f"   Completed at: {updated_ws['completed_at']}")
    
    # 8. Stats
    print_section("7️⃣ Statistiques Utilisateur")
    
    response = requests.get(f"{BASE_URL}/stats", headers=headers)
    
    if response.status_code != 200:
        print(f"❌ Failed to get stats: {response.text}")
        return
    
    stats = response.json()['stats']
    print(f"📊 User Statistics:")
    print(f"   Total Workspaces: {stats['total_workspaces']}")
    print(f"   Pending: {stats['pending']}")
    print(f"   In Progress: {stats['in_progress']}")
    print(f"   Completed: {stats['completed']}")
    print(f"   Blocked: {stats['blocked']}")
    print(f"   Total Messages: {stats['total_messages']}")
    
    print(f"\n   By Priority:")
    print(f"   • HIGH: {stats['by_priority']['HIGH']}")
    print(f"   • MEDIUM: {stats['by_priority']['MEDIUM']}")
    print(f"   • LOW: {stats['by_priority']['LOW']}")
    
    print(f"\n   By Source:")
    for source, count in stats['by_source'].items():
        print(f"   • {source}: {count}")
    
    # Final summary
    print_section("✅ DÉMONSTRATION TERMINÉE")
    print(f"Workspace créé: ID {workspace_id}")
    print(f"Messages ajoutés: {len(messages)}")
    print(f"Status final: COMPLETED")
    print(f"\n🌐 Vérifiez le frontend:")
    print(f"   http://localhost:3000/workspaces")
    print(f"\n🔑 Login:")
    print(f"   Username: email_system")
    print(f"   Password: EmailSystem2025!")

if __name__ == '__main__':
    try:
        main()
    except requests.exceptions.ConnectionError:
        print("\n❌ ERROR: Cannot connect to API")
        print("   Make sure the backend is running:")
        print("   python backend/app_postgres.py")
    except Exception as e:
        print(f"\n❌ ERROR: {e}")
        import traceback
        traceback.print_exc()
