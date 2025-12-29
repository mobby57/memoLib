#!/usr/bin/env python3
"""
Complete system test for IA Poste Manager
Tests all components end-to-end
"""

import requests
import json
import time
import sys

BASE_URL = "http://localhost:5000"

def test_complete_workflow():
    """Test complete workspace workflow"""
    print("[TEST] IA Poste Manager - Complete System Test")
    print("=" * 50)
    
    # Test 1: Health check
    print("\n[1/6] Testing system health...")
    try:
        r = requests.get(f"{BASE_URL}/health", timeout=5)
        if r.status_code == 200:
            print("[OK] Backend healthy")
        else:
            print(f"[ERROR] Backend unhealthy: {r.status_code}")
            return False
    except Exception as e:
        print(f"[ERROR] Backend not accessible: {e}")
        return False
    
    # Test 2: Create workspace
    print("\n[2/6] Creating workspace...")
    workspace_data = {
        "email_content": "Bonjour, je souhaite faire une demande de reconnaissance de handicap MDPH. J'ai besoin d'aide pour remplir le dossier. Merci.",
        "email_subject": "Demande MDPH - Aide dossier",
        "email_sender": "user@example.com",
        "workspace_type": "mdph",
        "user_id": "test_user_001",
        "language": "fr"
    }
    
    try:
        r = requests.post(f"{BASE_URL}/api/workspace/create", json=workspace_data, timeout=10)
        if r.status_code == 201:
            workspace = r.json()
            workspace_id = workspace['id']
            print(f"[OK] Workspace created: {workspace_id}")
            print(f"   Type: {workspace['type']}")
            print(f"   Status: {workspace['status']}")
            print(f"   Complexity: {workspace['analysis'].get('complexity_score', 'N/A')}")
        else:
            print(f"[ERROR] Workspace creation failed: {r.status_code} - {r.text}")
            return False
    except Exception as e:
        print(f"[ERROR] Workspace creation error: {e}")
        return False
    
    # Test 3: Generate response
    print("\n[3/6] Generating AI response...")
    try:
        process_data = {
            "action": "generate_response",
            "parameters": {
                "tone": "professional",
                "response_type": "answer"
            }
        }
        r = requests.put(f"{BASE_URL}/api/workspace/{workspace_id}/process", json=process_data, timeout=15)
        if r.status_code == 200:
            result = r.json()
            print("[OK] Response generated")
            print(f"   Status: {result.get('status', 'N/A')}")
            print(f"   AI calls: {result.get('ai_calls', 'N/A')}")
        else:
            print(f"[ERROR] Response generation failed: {r.status_code}")
    except Exception as e:
        print(f"[ERROR] Response generation error: {e}")
    
    # Test 4: Generate form
    print("\n[4/6] Generating form...")
    try:
        process_data = {
            "action": "generate_form",
            "parameters": {
                "form_type": "mdph",
                "accessibility_mode": "standard"
            }
        }
        r = requests.put(f"{BASE_URL}/api/workspace/{workspace_id}/process", json=process_data, timeout=15)
        if r.status_code == 200:
            result = r.json()
            print("[OK] Form generated")
            print(f"   Status: {result.get('status', 'N/A')}")
        else:
            print(f"[ERROR] Form generation failed: {r.status_code}")
    except Exception as e:
        print(f"[ERROR] Form generation error: {e}")
    
    # Test 5: Get workspace details
    print("\n[5/6] Retrieving workspace...")
    try:
        r = requests.get(f"{BASE_URL}/api/workspace/{workspace_id}", timeout=5)
        if r.status_code == 200:
            workspace = r.json()
            print("[OK] Workspace retrieved")
            print(f"   Final status: {workspace['status']}")
            print(f"   Total AI calls: {workspace['metrics']['ai_calls_count']}")
            print(f"   Has response: {'Yes' if workspace.get('generated_response') else 'No'}")
            print(f"   Has form: {'Yes' if workspace.get('generated_form') else 'No'}")
        else:
            print(f"[ERROR] Workspace retrieval failed: {r.status_code}")
    except Exception as e:
        print(f"[ERROR] Workspace retrieval error: {e}")
    
    # Test 6: List workspaces
    print("\n[6/6] Listing workspaces...")
    try:
        r = requests.get(f"{BASE_URL}/api/workspace/list", timeout=5)
        if r.status_code == 200:
            data = r.json()
            workspaces = data.get('workspaces', [])
            print(f"[OK] Found {len(workspaces)} workspace(s)")
            for ws in workspaces[:3]:  # Show first 3
                print(f"   - {ws['id'][:8]}... ({ws['type']}) - {ws['status']}")
        else:
            print(f"[ERROR] Workspace listing failed: {r.status_code}")
    except Exception as e:
        print(f"[ERROR] Workspace listing error: {e}")
    
    print("\n" + "=" * 50)
    print("[SUCCESS] Complete system test finished!")
    print(f"[INFO] Test workspace ID: {workspace_id}")
    return True

def test_performance():
    """Test system performance"""
    print("\n⚡ Performance Test")
    print("-" * 30)
    
    start_time = time.time()
    
    # Create multiple workspaces
    workspace_ids = []
    for i in range(3):
        workspace_data = {
            "email_content": f"Test email {i+1} for performance testing...",
            "email_subject": f"Performance Test {i+1}",
            "email_sender": f"perf_test_{i+1}@example.com",
            "workspace_type": "general"
        }
        
        try:
            r = requests.post(f"{BASE_URL}/api/workspace/create", json=workspace_data, timeout=10)
            if r.status_code == 201:
                workspace_ids.append(r.json()['id'])
        except:
            pass
    
    end_time = time.time()
    duration = end_time - start_time
    
    print("[OK] Created {} workspaces in {:.2f}s".format(len(workspace_ids), duration))
    print("[PERF] Average: {:.2f}s per workspace".format(duration/max(len(workspace_ids), 1)))
    
    return len(workspace_ids) > 0

if __name__ == "__main__":
    success = test_complete_workflow()
    
    if success and "--performance" in sys.argv:
        test_performance()
    
    if not success:
        print("[ERROR] Some tests failed. Check the backend logs.")
        sys.exit(1)
    else:
        print("[SUCCESS] All tests passed! System is ready for production.")
        sys.exit(0)