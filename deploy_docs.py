#!/usr/bin/env python3
"""
🚀 Documentation Deployment Script
Génère et déploie la documentation en local avec serveur HTTP
"""

import os
import subprocess
import webbrowser
import http.server
import socketserver
import threading
import time
from pathlib import Path

class DocDeployment:
    """Déployeur de documentation local"""
    
    def __init__(self):
        self.project_root = Path(".")
        self.docs_dir = self.project_root / "docs" / "auto_generated"
        self.port = 8080
        
    def ensure_dependencies(self):
        """Vérifier et installer les dépendances nécessaires"""
        try:
            import ast
            print("✅ Module ast disponible")
        except ImportError:
            print("❌ Module ast manquant")
            return False
        
        return True
    
    def generate_documentation(self):
        """Générer la documentation"""
        print("🔧 Génération de la documentation...")
        
        try:
            # Ajouter les docstrings manquantes
            print("📝 Ajout des docstrings...")
            result = subprocess.run(['python', 'add_docstrings.py'], 
                                  capture_output=True, text=True)
            if result.returncode == 0:
                print("✅ Docstrings ajoutées avec succès")
            else:
                print(f"⚠️ Avertissement docstrings: {result.stderr}")
            
            # Générer la documentation HTML
            print("🌐 Génération HTML...")
            result = subprocess.run(['python', 'generate_docs.py'], 
                                  capture_output=True, text=True)
            if result.returncode == 0:
                print("✅ Documentation HTML générée")
                return True
            else:
                print(f"❌ Erreur génération: {result.stderr}")
                return False
                
        except Exception as e:
            print(f"❌ Erreur: {e}")
            return False
    
    def create_index_page(self):
        """Créer une page d'index pour la documentation"""
        index_content = """<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Documentation IA Poste Manager</title>
    <style>
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh; margin: 0; color: white; padding: 20px;
        }
        .container { 
            max-width: 800px; margin: 0 auto; text-align: center;
            background: rgba(255,255,255,0.1); padding: 40px; border-radius: 20px;
            backdrop-filter: blur(15px);
        }
        .btn { 
            background: linear-gradient(135deg, #3498db 0%, #2980b9 100%);
            color: white; border: none; padding: 15px 30px; border-radius: 25px;
            text-decoration: none; display: inline-block; margin: 10px;
            font-size: 16px; transition: transform 0.2s;
        }
        .btn:hover { transform: translateY(-2px); }
        .feature { 
            background: rgba(255,255,255,0.1); padding: 20px; margin: 15px 0;
            border-radius: 10px; text-align: left;
        }
        .status { color: #27ae60; font-size: 1.1em; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🚀 Documentation IA Poste Manager v3.1</h1>
        <p class="status">✅ Documentation générée et déployée localement</p>
        
        <div class="feature">
            <h3>📚 Documentation Complète</h3>
            <p>Analyse automatique de toutes les fonctions et classes</p>
            <a href="documentation.html" class="btn">📖 Voir Documentation</a>
        </div>
        
        <div class="feature">
            <h3>📊 Rapport d'Amélioration</h3>
            <p>Suggestions pour améliorer la documentation</p>
            <a href="improvement_report.md" class="btn">📋 Voir Rapport</a>
        </div>
        
        <div class="feature">
            <h3>🔧 Données d'Analyse</h3>
            <p>Données JSON brutes de l'analyse</p>
            <a href="analysis.json" class="btn">📄 Voir JSON</a>
        </div>
        
        <div class="feature">
            <h3>🎯 Fonctionnalités Documentées</h3>
            <ul style="text-align: left;">
                <li>✅ Gestion des délais juridiques</li>
                <li>✅ Facturation et suivi du temps</li>
                <li>✅ IA CESEDA prédictive</li>
                <li>✅ APIs REST complètes</li>
                <li>✅ Services Redis hybrides</li>
            </ul>
        </div>
        
        <p><strong>Serveur local:</strong> http://localhost:8080</p>
        <p><strong>Généré le:</strong> """ + time.strftime("%Y-%m-%d %H:%M:%S") + """</p>
    </div>
</body>
</html>"""
        
        index_path = self.docs_dir / "index.html"
        with open(index_path, 'w', encoding='utf-8') as f:
            f.write(index_content)
        
        print(f"✅ Page d'index créée: {index_path}")
    
    def start_server(self):
        """Démarrer le serveur HTTP local"""
        os.chdir(self.docs_dir)
        
        class QuietHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
            def log_message(self, format, *args):
                pass  # Supprimer les logs verbeux
        
        try:
            with socketserver.TCPServer(("", self.port), QuietHTTPRequestHandler) as httpd:
                print(f"🌐 Serveur démarré sur http://localhost:{self.port}")
                print(f"📁 Répertoire: {self.docs_dir.absolute()}")
                print("🔗 Ouverture automatique du navigateur...")
                
                # Ouvrir le navigateur après un court délai
                def open_browser():
                    time.sleep(1)
                    webbrowser.open(f'http://localhost:{self.port}')
                
                browser_thread = threading.Thread(target=open_browser)
                browser_thread.daemon = True
                browser_thread.start()
                
                print("⏹️ Appuyez sur Ctrl+C pour arrêter le serveur")
                httpd.serve_forever()
                
        except KeyboardInterrupt:
            print("\n🛑 Serveur arrêté")
        except OSError as e:
            if "Address already in use" in str(e):
                print(f"❌ Port {self.port} déjà utilisé. Essayez un autre port.")
                self.port = 8081
                print(f"🔄 Tentative sur le port {self.port}...")
                self.start_server()
            else:
                print(f"❌ Erreur serveur: {e}")
    
    def deploy(self):
        """Déployer la documentation complète"""
        print("🚀 Déploiement Documentation IA Poste Manager")
        print("=" * 50)
        
        # 1. Vérifier les dépendances
        if not self.ensure_dependencies():
            return False
        
        # 2. Créer le répertoire docs
        self.docs_dir.mkdir(parents=True, exist_ok=True)
        
        # 3. Générer la documentation
        if not self.generate_documentation():
            print("❌ Échec de la génération")
            return False
        
        # 4. Créer la page d'index
        self.create_index_page()
        
        # 5. Démarrer le serveur
        print("\n🎯 Documentation prête!")
        print(f"📂 Fichiers dans: {self.docs_dir.absolute()}")
        
        try:
            self.start_server()
        except Exception as e:
            print(f"❌ Erreur serveur: {e}")
            print(f"💡 Vous pouvez ouvrir manuellement: {self.docs_dir / 'index.html'}")
        
        return True

def main():
    """Fonction principale"""
    deployer = DocDeployment()
    
    print("🎯 Options disponibles:")
    print("1. Déploiement complet (génération + serveur)")
    print("2. Génération seulement")
    print("3. Serveur seulement")
    
    choice = input("\nChoisissez une option (1-3, défaut=1): ").strip() or "1"
    
    if choice == "1":
        deployer.deploy()
    elif choice == "2":
        deployer.generate_documentation()
        print(f"✅ Documentation générée dans: {deployer.docs_dir}")
    elif choice == "3":
        if not deployer.docs_dir.exists():
            print("❌ Aucune documentation trouvée. Lancez d'abord la génération.")
            return
        deployer.create_index_page()
        deployer.start_server()
    else:
        print("❌ Option invalide")

if __name__ == "__main__":
    main()