#!/usr/bin/env python3
"""Quick deployment script for SecureVault"""
import os
import subprocess
import sys

def install_dependencies():
    """Install required dependencies"""
    print("Installing dependencies...")
    try:
        subprocess.run([sys.executable, '-m', 'pip', 'install', '-r', 'requirements.txt'], check=True)
        print("✅ Dependencies installed")
        return True
    except:
        print("❌ Failed to install dependencies")
        return False

def create_directories():
    """Create required directories"""
    dirs = ['data', 'logs', 'uploads', 'data/cache', 'data/encrypted']
    for dir_path in dirs:
        os.makedirs(dir_path, exist_ok=True)
    print("✅ Directories created")

def run_app():
    """Run the application"""
    print("\n🚀 Starting SecureVault...")
    print("URL: http://127.0.0.1:5000")
    print("Press Ctrl+C to stop\n")
    
    try:
        subprocess.run([sys.executable, 'src/web/app.py'])
    except KeyboardInterrupt:
        print("\n✅ Application stopped")

def main():
    print("=" * 50)
    print("SecureVault - Quick Deploy")
    print("=" * 50)
    
    if not os.path.exists('src/web/app.py'):
        print("❌ Run from project root directory")
        return
    
    create_directories()
    
    if install_dependencies():
        run_app()
    else:
        print("❌ Deployment failed")

if __name__ == '__main__':
    main()