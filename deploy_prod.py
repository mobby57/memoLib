#!/usr/bin/env python3
"""
Production deployment script for IA Poste Manager
"""

import subprocess
import sys
import os
import time

def run_command(cmd, description):
    """Run command with error handling"""
    print(f"🔄 {description}...")
    try:
        result = subprocess.run(cmd, shell=True, check=True, capture_output=True, text=True)
        print(f"✅ {description} - Success")
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ {description} - Failed: {e.stderr}")
        return False

def deploy_production():
    """Deploy to production"""
    print("🚀 IA Poste Manager - Production Deployment")
    print("=" * 50)
    
    # Check Docker
    if not run_command("docker --version", "Checking Docker"):
        print("❌ Docker not found. Please install Docker first.")
        return False
    
    # Build and start services
    steps = [
        ("docker-compose -f docker-compose.prod.yml down", "Stopping existing services"),
        ("docker-compose -f docker-compose.prod.yml build", "Building images"),
        ("docker-compose -f docker-compose.prod.yml up -d", "Starting services"),
    ]
    
    for cmd, desc in steps:
        if not run_command(cmd, desc):
            return False
    
    # Wait for services to start
    print("⏳ Waiting for services to start...")
    time.sleep(10)
    
    # Health check
    if run_command("curl -f http://localhost:5000/health", "Health check"):
        print("\n🎉 Deployment successful!")
        print("📊 Services running:")
        print("   - Backend: http://localhost:5000")
        print("   - Frontend: http://localhost")
        print("   - API Docs: http://localhost:5000/api/status")
        return True
    else:
        print("❌ Health check failed")
        return False

def show_logs():
    """Show service logs"""
    print("📋 Service logs:")
    subprocess.run("docker-compose -f docker-compose.prod.yml logs --tail=50", shell=True)

if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] == "logs":
        show_logs()
    else:
        success = deploy_production()
        if not success:
            print("\n📋 Check logs with: python deploy_prod.py logs")
            sys.exit(1)