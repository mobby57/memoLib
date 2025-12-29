#!/usr/bin/env python3
"""
Verification script for IA Poste Manager v2.3
"""
import os
import sys
import requests
import time
import subprocess
from dotenv import load_dotenv

load_dotenv()

def check_dependencies():
    """Check if all required dependencies are installed"""
    try:
        import flask
        import openai
        import flask_cors
        print("✅ All dependencies installed")
        return True
    except ImportError as e:
        print(f"❌ Missing dependency: {e}")
        return False

def check_env_config():
    """Check environment configuration"""
    openai_key = os.getenv('OPENAI_API_KEY')
    secret_key = os.getenv('SECRET_KEY')
    
    if not openai_key or openai_key == 'sk-proj-your_actual_openai_key_here':
        print("⚠️  OpenAI API key not configured (AI features will be limited)")
    else:
        print("✅ OpenAI API key configured")
    
    if not secret_key or secret_key == 'dev-secret-key-change-in-production':
        print("⚠️  Using default secret key (change for production)")
    else:
        print("✅ Secret key configured")
    
    return True

def test_api_endpoints():
    """Test API endpoints"""
    base_url = "http://localhost:5000"
    
    try:
        # Test health endpoint
        response = requests.get(f"{base_url}/health", timeout=5)
        if response.status_code == 200:
            print("✅ Health endpoint working")
        else:
            print("❌ Health endpoint failed")
            return False
        
        # Test templates endpoint
        response = requests.get(f"{base_url}/api/templates", timeout=5)
        if response.status_code == 200:
            print("✅ Templates API working")
        else:
            print("❌ Templates API failed")
        
        return True
    except requests.exceptions.ConnectionError:
        print("❌ Server not running or not accessible")
        return False
    except Exception as e:
        print(f"❌ API test failed: {e}")
        return False

def main():
    print("🚀 IA Poste Manager v2.3 - System Verification")
    print("=" * 50)
    
    # Check dependencies
    if not check_dependencies():
        print("\n❌ System verification failed - missing dependencies")
        print("Run: pip install -r requirements.txt")
        return False
    
    # Check environment
    check_env_config()
    
    # Check if server is running
    print("\n🔍 Testing API endpoints...")
    if test_api_endpoints():
        print("\n✅ System verification completed successfully!")
        print("\n📋 Quick Start:")
        print("1. Run: start.bat")
        print("2. Open: http://localhost:5000")
        print("3. Start creating emails with AI!")
        return True
    else:
        print("\n⚠️  Server not running. Start with: start.bat")
        return True

if __name__ == "__main__":
    main()