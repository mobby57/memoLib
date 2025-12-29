#!/usr/bin/env python3
"""
Quick API test for workspace endpoints
"""

import requests
import json

BASE_URL = "http://localhost:5000"

def test_api():
    print("Testing IA Poste Manager API...")
    
    # Test health
    try:
        r = requests.get(f"{BASE_URL}/health")
        print(f"✅ Health: {r.json()}")
    except:
        print("❌ Backend not running on port 5000")
        return
    
    # Test workspace creation
    workspace_data = {
        "email_content": "Bonjour, je souhaite faire une demande MDPH...",
        "email_subject": "Demande MDPH",
        "email_sender": "test@example.com",
        "workspace_type": "mdph",
        "user_id": "test_user"
    }
    
    try:
        r = requests.post(f"{BASE_URL}/api/workspace/create", json=workspace_data)
        if r.status_code == 201:
            workspace = r.json()
            workspace_id = workspace['id']
            print(f"✅ Workspace created: {workspace_id}")
            
            # Test get workspace
            r = requests.get(f"{BASE_URL}/api/workspace/{workspace_id}")
            if r.status_code == 200:
                print("✅ Workspace retrieved")
            
            # Test process workspace
            process_data = {"action": "generate_response", "parameters": {"tone": "professional"}}
            r = requests.put(f"{BASE_URL}/api/workspace/{workspace_id}/process", json=process_data)
            if r.status_code == 200:
                print("✅ Workspace processed")
            
        else:
            print(f"❌ Create failed: {r.status_code} - {r.text}")
    except Exception as e:
        print(f"❌ API test failed: {e}")

if __name__ == "__main__":
    test_api()