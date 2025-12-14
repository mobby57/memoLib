# -*- coding: utf-8 -*-
"""Test d'intégration rapide"""
import sys
import os
import io

if sys.platform == 'win32':
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

def test_imports():
    """Test que tous les modules s'importent"""
    print("Testing imports...")
    
    try:
        from src.core.jwt_manager import jwt_manager
        print("✅ JWT manager")
        
        from src.core.rate_limiter import rate_limiter
        print("✅ Rate limiter")
        
        from src.core.cache_manager import cache
        print("✅ Cache manager")
        
        from src.api.v1 import api_v1
        print("✅ API v1")
        
        from src.models import init_db
        print("✅ Models")
        
        from src.monitoring.prometheus import metrics_endpoint
        print("✅ Prometheus")
        
        print("\n✅ All imports successful!")
        return True
        
    except Exception as e:
        print(f"\n❌ Import failed: {e}")
        return False

def test_database():
    """Test initialisation DB"""
    print("\nTesting database...")
    
    try:
        from src.models import init_db, get_session
        
        init_db()
        print("✅ Database initialized")
        
        session = get_session()
        print("✅ Database session created")
        
        return True
        
    except Exception as e:
        print(f"❌ Database test failed: {e}")
        return False

def test_jwt():
    """Test JWT"""
    print("\nTesting JWT...")
    
    try:
        from src.core.jwt_manager import jwt_manager
        import os
        
        # Set SECRET_KEY for test
        if not os.environ.get('SECRET_KEY'):
            os.environ['SECRET_KEY'] = 'test-secret-key-for-testing-only'
        
        token = jwt_manager.create_access_token(1)
        print(f"✅ Access token created: {str(token)[:20]}...")
        
        payload = jwt_manager.verify_token(token)
        assert payload['user_id'] == 1
        print("✅ Token verified")
        
        return True
        
    except Exception as e:
        print(f"❌ JWT test failed: {e}")
        return False

def test_cache():
    """Test cache"""
    print("\nTesting cache...")
    
    try:
        from src.core.cache_manager import cache
        
        cache.set('test_key', 'test_value', ttl=60)
        print("✅ Cache set")
        
        value = cache.get('test_key')
        assert value == 'test_value'
        print("✅ Cache get")
        
        return True
        
    except Exception as e:
        print(f"❌ Cache test failed: {e}")
        return False

if __name__ == '__main__':
    print("="*60)
    print("INTEGRATION TESTS")
    print("="*60)
    
    results = []
    results.append(("Imports", test_imports()))
    results.append(("Database", test_database()))
    results.append(("JWT", test_jwt()))
    results.append(("Cache", test_cache()))
    
    print("\n" + "="*60)
    print("RESULTS")
    print("="*60)
    
    for name, result in results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{status} - {name}")
    
    total = len(results)
    passed = sum(1 for _, r in results if r)
    
    print(f"\nTotal: {passed}/{total} passed")
    
    if passed == total:
        print("\n🎉 All tests passed!")
        sys.exit(0)
    else:
        print("\n❌ Some tests failed")
        sys.exit(1)
