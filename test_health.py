#!/usr/bin/env python3
"""Script de test rapide pour health check"""

from src.backend.app_factory import create_app

app = create_app()

with app.test_client() as client:
    response = client.get('/api/v1/health')
    print(f"Status Code: {response.status_code}")
    print(f"Response: {response.get_json()}")
