#!/usr/bin/env python3
"""
Script d'audit de sécurité pour IA Poste Manager
Vérifie les vulnérabilités et bonnes pratiques
"""

import os
import json
import re
from pathlib import Path

def security_audit():
    """Effectue un audit de sécurité du projet"""
    
    base_dir = Path(__file__).parent
    issues = []
    
    print("🔒 Audit de sécurité IA Poste Manager...")
    
    # 1. Vérifier les secrets exposés
    sensitive_patterns = [
        r'SECRET_KEY\s*=\s*["\'][^"\']{20,}["\']',
        r'JWT_SECRET\s*=\s*["\'][^"\']{20,}["\']',
        r'API_KEY\s*=\s*["\'][^"\']{20,}["\']',
        r'PASSWORD\s*=\s*["\'][^"\']+["\']'
    ]
    
    for file_path in base_dir.rglob('*.py'):
        if file_path.name.startswith('.'):
            continue
            
        try:
            content = file_path.read_text(encoding='utf-8')
            for pattern in sensitive_patterns:
                if re.search(pattern, content, re.IGNORECASE):
                    issues.append(f"🔴 Secret potentiellement exposé dans {file_path.name}")
        except:
            continue
    
    # 2. Vérifier les fichiers .env
    env_files = list(base_dir.glob('.env*'))
    for env_file in env_files:
        if env_file.name != '.env.template':
            issues.append(f"🟡 Fichier d'environnement détecté: {env_file.name}")
    
    # 3. Vérifier les permissions de fichiers sensibles
    sensitive_files = ['app.py', 'app_secure.py', 'config.py']
    for file_name in sensitive_files:
        file_path = base_dir / file_name
        if file_path.exists():
            # Vérifier si le fichier contient des mots de passe en dur
            try:
                content = file_path.read_text()
                if 'admin123' in content or 'password' in content.lower():
                    issues.append(f"🔴 Mot de passe en dur détecté dans {file_name}")
            except:
                continue
    
    # 4. Vérifier la configuration Flask
    app_files = ['app.py', 'app_secure.py']
    for app_file in app_files:
        file_path = base_dir / app_file
        if file_path.exists():
            try:
                content = file_path.read_text()
                if 'debug=True' in content:
                    issues.append(f"🟡 Mode debug activé dans {app_file}")
                if 'SECRET_KEY' not in content:
                    issues.append(f"🔴 SECRET_KEY manquante dans {app_file}")
            except:
                continue
    
    # 5. Vérifier les dépendances
    req_files = ['requirements.txt', 'requirements_secure.txt']
    for req_file in req_files:
        file_path = base_dir / req_file
        if file_path.exists():
            try:
                content = file_path.read_text()
                if 'werkzeug' not in content:
                    issues.append(f"🟡 Werkzeug manquant dans {req_file}")
                if 'cryptography' not in content:
                    issues.append(f"🟡 Cryptography manquant dans {req_file}")
            except:
                continue
    
    # Rapport final
    print(f"\n📊 Résultats de l'audit:")
    print(f"Issues trouvées: {len(issues)}")
    
    if issues:
        print("\n🚨 Issues détectées:")
        for issue in issues:
            print(f"  {issue}")
    else:
        print("\n✅ Aucune issue de sécurité majeure détectée!")
    
    # Recommandations
    print("\n💡 Recommandations:")
    print("  1. Utilisez app_secure.py au lieu de app.py")
    print("  2. Générez de nouvelles clés secrètes")
    print("  3. Configurez les variables d'environnement sur Vercel")
    print("  4. Activez HTTPS en production")
    print("  5. Implémentez la validation CSRF")
    
    return len(issues) == 0

if __name__ == "__main__":
    security_audit()