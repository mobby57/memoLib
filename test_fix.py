#!/usr/bin/env python3
"""Test script to verify Flask app fixes"""

import os
import sys
import tempfile

# Set environment variables
os.environ['SECRET_KEY'] = 'test-secret-key'
os.environ['FLASK_ENV'] = 'testing'
os.environ['DATABASE_URL'] = 'sqlite:///test.db'

# Add src to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'src'))

def test_app_import():
    """Test that the app can be imported without errors"""
    try:
        from src.web.app import app
        print("✅ App import successful")
        return True
    except Exception as e:
        print(f"❌ App import failed: {e}")
        return False

def test_basic_routes():
    """Test basic routes work"""
    try:
        from src.web.app import app
        
        with app.test_client() as client:
            # Test health endpoint
            response = client.get('/api/health')
            print(f"✅ Health endpoint: {response.status_code}")
            
            # Test login page
            response = client.get('/login')
            print(f"✅ Login page: {response.status_code}")
            
            return True
    except Exception as e:
        print(f"❌ Route test failed: {e}")
        return False

def main():
    """Run all tests"""
    print("Testing Flask app fixes...")
    print("=" * 40)
    
    success = True
    success &= test_app_import()
    success &= test_basic_routes()
    
    print("=" * 40)
    if success:
        print("✅ All tests passed!")
    else:
        print("❌ Some tests failed!")
    
    return 0 if success else 1

if __name__ == '__main__':
    sys.exit(main())