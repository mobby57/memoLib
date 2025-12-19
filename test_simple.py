#!/usr/bin/env python3
"""Simple test to check if Flask app can be imported"""

import os
import sys

# Set environment variables
os.environ['SECRET_KEY'] = 'test-secret-key'
os.environ['FLASK_ENV'] = 'testing'

# Add src to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'src'))

try:
    print("Testing Flask app import...")
    from src.web.app import app
    print("SUCCESS: App imported successfully")
    
    # Test basic functionality
    with app.test_client() as client:
        response = client.get('/api/health')
        print(f"Health endpoint status: {response.status_code}")
        
except Exception as e:
    print(f"ERROR: {e}")
    import traceback
    traceback.print_exc()