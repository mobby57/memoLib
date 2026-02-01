#!/usr/bin/env python3
"""
🚀 Quick Start Documentation
Script de démarrage rapide pour la documentation
"""

import os
import subprocess
import webbrowser
import time
from pathlib import Path

def quick_start():
    """Démarrage rapide de la documentation"""
    print("🚀 MemoLib Assistant - Documentation Quick Start")
    print("=" * 50)
    
    # Vérifier si la documentation existe
    docs_path = Path("docs/auto_generated/documentation.html")
    
    if not docs_path.exists():
        print("📝 Génération de la documentation...")
        
        # Ajouter docstrings
        subprocess.run(['python', 'add_docstrings.py'], capture_output=True)
        
        # Générer documentation
        result = subprocess.run(['python', 'generate_docs.py'], capture_output=True, text=True)
        
        if result.returncode != 0:
            print("❌ Erreur lors de la génération")
            print(result.stderr)
            return
    
    # Ouvrir la documentation
    print("🌐 Ouverture de la documentation...")
    
    try:
        # Essayer d'ouvrir avec le navigateur par défaut
        webbrowser.open(f'file://{docs_path.absolute()}')
        print(f"✅ Documentation ouverte: {docs_path.absolute()}")
        
        # Afficher les liens utiles
        print("\n📚 Liens utiles:")
        print(f"   📖 Documentation: file://{docs_path.absolute()}")
        print(f"   📋 Rapport: file://{Path('docs/auto_generated/improvement_report.md').absolute()}")
        print(f"   📊 Analyse JSON: file://{Path('docs/auto_generated/analysis.json').absolute()}")
        
    except Exception as e:
        print(f"❌ Impossible d'ouvrir automatiquement: {e}")
        print(f"💡 Ouvrez manuellement: {docs_path.absolute()}")

if __name__ == "__main__":
    quick_start()