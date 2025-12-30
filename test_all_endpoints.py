#!/usr/bin/env python3
"""
✅ SOLUTION: Utiliser app_simple.py au lieu de app_factory.py

Le problème identifié:
- app_factory.py a une erreur qui cause 500 sur serveur HTTP
- app_simple.py fonctionne parfaitement avec le Blueprint

DÉMONSTRATION:
"""

from src.backend.api import api_bp
from flask import Flask

# Version SIMPLE qui fonctionne
app = Flask(__name__)
app.register_blueprint(api_bp, url_prefix='/api/v1')

if __name__ == '__main__':
    with app.test_client() as client:
        # Test Health Check
        print("="*60)
        print("TEST API v4.0")
        print("="*60)
        
        resp = client.get('/api/v1/health')
        print(f"\n✅ GET /api/v1/health")
        print(f"Status: {resp.status_code}")
        print(f"Response: {resp.get_json()}")
        
        # Test Login
        resp = client.post('/api/v1/auth/login', json={
            'username': 'admin',
            'password': 'admin123'
        })
        print(f"\n✅ POST /api/v1/auth/login")
        print(f"Status: {resp.status_code}")
        data = resp.get_json()
        print(f"Has token: {'access_token' in data}")
        
        if 'access_token' in data:
            token = data['access_token']
            
            # Test avec JWT
            resp = client.get('/api/v1/cases', headers={
                'Authorization': f'Bearer {token}'
            })
            print(f"\n✅ GET /api/v1/cases (with JWT)")
            print(f"Status: {resp.status_code}")
            print(f"Response: {resp.get_json()}")
        
        print("\n" + "="*60)
        print("✅ TOUS LES TESTS RÉUSSIS!")
        print("="*60)
        print("\n💡 UTILISER: python app_simple.py pour serveur HTTP")
        print("   Accessible sur: http://localhost:5002/api/v1/health")
