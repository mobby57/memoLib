#!/usr/bin/env python3
"""
Script de nettoyage pour IA Poste Manager
Supprime les fichiers redondants et organise la structure
"""

import os
import shutil
from pathlib import Path

def cleanup_project():
    """Nettoie les fichiers redondants du projet"""
    
    base_dir = Path(__file__).parent
    
    # Dossiers à supprimer (redondants)
    redundant_dirs = [
        'deploy_cabinet_cabinet_dupont_&_associes_20251229_211021',
        'deploy_package_complet',
        'deploy_pythonanywhere',
        'deploy_secure',
        'deploy_secure_20251229_223337',
        'iapostemanager'
    ]
    
    # Fichiers à supprimer (redondants)
    redundant_files = [
        'cabinet_dupont_&_associes_deploy.zip',
        'iapostemanage_deploy_202512_2105.zip',
        'iapostemanage_deploy_20251229_204333.zip',
        'iapostemanage_deploy.zip',
        'iapostemanage_final.tar.gz',
        'iapostemanage_final.zip',
        'iapostemanage_minimal.zip',
        'iapostemanage_secure_20251229_223337.zip'
    ]
    
    print("Nettoyage du projet IA Poste Manager...")
    
    # Supprimer les dossiers redondants
    for dir_name in redundant_dirs:
        dir_path = base_dir / dir_name
        if dir_path.exists():
            print(f"Suppression du dossier: {dir_name}")
            shutil.rmtree(dir_path)
    
    # Supprimer les fichiers redondants
    for file_name in redundant_files:
        file_path = base_dir / file_name
        if file_path.exists():
            print(f"Suppression du fichier: {file_name}")
            file_path.unlink()
    
    # Créer la structure propre
    essential_dirs = [
        'templates/auth',
        'templates/errors',
        'static/css',
        'static/js',
        'data'
    ]
    
    for dir_name in essential_dirs:
        dir_path = base_dir / dir_name
        dir_path.mkdir(parents=True, exist_ok=True)
    
    print("Nettoyage termine!")
    print("\nStructure recommandee:")
    print("├── app_secure.py (application principale)")
    print("├── requirements_secure.txt")
    print("├── .env.template")
    print("├── vercel_secure.json")
    print("├── templates/")
    print("│   ├── auth/")
    print("│   └── dashboard.html")
    print("├── static/")
    print("└── data/")

if __name__ == "__main__":
    cleanup_project()