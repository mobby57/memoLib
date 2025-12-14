"""Test des endpoints API"""
import requests
import json

BASE_URL = "http://127.0.0.1:5000"

def test_endpoint(endpoint, method='GET'):
    """Test un endpoint et affiche le résultat"""
    url = f"{BASE_URL}{endpoint}"
    print(f"\n{'='*60}")
    print(f"Testing: {method} {endpoint}")
    print('='*60)
    
    try:
        if method == 'GET':
            response = requests.get(url, timeout=5)
        else:
            response = requests.post(url, json={}, timeout=5)
        
        print(f"Status Code: {response.status_code}")
        print(f"Content-Type: {response.headers.get('Content-Type', 'N/A')}")
        
        # Essayer de parser en JSON
        try:
            data = response.json()
            print(f"JSON Response: {json.dumps(data, indent=2)}")
            return True
        except:
            print(f"ERROR: Response is not JSON!")
            print(f"Response text (first 200 chars): {response.text[:200]}")
            return False
            
    except Exception as e:
        print(f"ERROR: {e}")
        return False

if __name__ == "__main__":
    print("\n" + "="*60)
    print("TESTING API ENDPOINTS")
    print("="*60)
    
    endpoints = [
        ('/api/health', 'GET'),
        ('/api/check-credentials', 'GET'),
        ('/api/destinataires', 'GET'),
        ('/api/workflows', 'GET'),
        ('/api/stats', 'GET'),
    ]
    
    results = []
    for endpoint, method in endpoints:
        success = test_endpoint(endpoint, method)
        results.append((endpoint, success))
    
    print("\n" + "="*60)
    print("SUMMARY")
    print("="*60)
    for endpoint, success in results:
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} - {endpoint}")
    
    total = len(results)
    passed = sum(1 for _, s in results if s)
    print(f"\nTotal: {passed}/{total} passed")
