#!/usr/bin/env python3
"""
🔍 AUDIT AUTOMATIQUE DES TECHNOLOGIES - IA POSTE MANAGER
Vérifie toutes les dépendances et technologies requises
"""

import os
import sys
import json
import subprocess
import importlib
from pathlib import Path
from datetime import datetime

class TechAuditor:
    def __init__(self):
        self.results = {
            'timestamp': datetime.now().isoformat(),
            'status': 'UNKNOWN',
            'technologies': {},
            'missing': [],
            'warnings': [],
            'recommendations': []
        }
        
    def check_python_version(self):
        """Vérifier version Python"""
        version = sys.version_info
        required = (3, 8)
        
        self.results['technologies']['python'] = {
            'current': f"{version.major}.{version.minor}.{version.micro}",
            'required': f"{required[0]}.{required[1]}+",
            'status': 'OK' if version >= required else 'FAIL'
        }
        
        if version < required:
            self.results['missing'].append(f"Python {required[0]}.{required[1]}+ requis")
            
    def check_pip_packages(self):
        """Vérifier packages pip"""
        requirements_file = Path('requirements.txt')
        if not requirements_file.exists():
            self.results['missing'].append('requirements.txt manquant')
            return
            
        with open(requirements_file) as f:
            packages = [line.strip().split('==')[0] for line in f if line.strip() and not line.startswith('#')]
            
        for package in packages:
            try:
                importlib.import_module(package.replace('-', '_'))
                self.results['technologies'][package] = {'status': 'OK'}
            except ImportError:
                self.results['technologies'][package] = {'status': 'MISSING'}
                self.results['missing'].append(f"Package manquant: {package}")
                
    def check_directories(self):
        """Vérifier structure des dossiers"""
        required_dirs = [
            'data', 'templates', 'static', 'src/backend',
            'src/backend/services/legal', 'src/backend/routes'
        ]
        
        for dir_path in required_dirs:
            path = Path(dir_path)
            if path.exists():
                self.results['technologies'][f'dir_{dir_path}'] = {'status': 'OK'}
            else:
                self.results['technologies'][f'dir_{dir_path}'] = {'status': 'MISSING'}
                self.results['missing'].append(f"Dossier manquant: {dir_path}")
                
    def check_core_files(self):
        """Vérifier fichiers essentiels"""
        core_files = [
            'app.py', 'flask_app.py', 'requirements.txt',
            'src/backend/routes/legal_routes.py',
            'src/backend/services/legal/deadline_manager.py',
            'src/backend/services/legal/billing_manager.py'
        ]
        
        for file_path in core_files:
            path = Path(file_path)
            if path.exists():
                self.results['technologies'][f'file_{file_path}'] = {'status': 'OK'}
            else:
                self.results['technologies'][f'file_{file_path}'] = {'status': 'MISSING'}
                self.results['missing'].append(f"Fichier manquant: {file_path}")
                
    def check_security_modules(self):
        """Vérifier modules de sécurité"""
        security_modules = [
            'src/backend/security/audit_logger.py',
            'src/backend/security/backup_manager.py',
            'src/backend/security/encryption.py'
        ]
        
        for module in security_modules:
            path = Path(module)
            if path.exists():
                self.results['technologies'][f'security_{module}'] = {'status': 'OK'}
            else:
                self.results['technologies'][f'security_{module}'] = {'status': 'WARNING'}
                self.results['warnings'].append(f"Module sécurité optionnel: {module}")
                
    def check_ai_modules(self):
        """Vérifier modules IA"""
        ai_modules = [
            'ceseda_expert_ai.py',
            'scrape_ceseda_decisions.py',
            'src/backend/services/predictive_ai.py'
        ]
        
        for module in ai_modules:
            path = Path(module)
            if path.exists():
                self.results['technologies'][f'ai_{module}'] = {'status': 'OK'}
            else:
                self.results['technologies'][f'ai_{module}'] = {'status': 'WARNING'}
                self.results['warnings'].append(f"Module IA optionnel: {module}")
                
    def generate_recommendations(self):
        """Générer recommandations"""
        if self.results['missing']:
            self.results['recommendations'].append("Installer les dépendances manquantes: pip install -r requirements.txt")
            
        if len(self.results['missing']) > 5:
            self.results['recommendations'].append("Structure projet incomplète - Vérifier l'installation")
            
        if not any('security_' in k for k in self.results['technologies']):
            self.results['recommendations'].append("Modules sécurité recommandés pour production")
            
        # Déterminer statut global
        if not self.results['missing']:
            self.results['status'] = 'OK'
        elif len(self.results['missing']) < 3:
            self.results['status'] = 'WARNING'
        else:
            self.results['status'] = 'FAIL'
            
    def run_audit(self):
        """Exécuter audit complet"""
        print("🔍 AUDIT TECHNOLOGIES - IA POSTE MANAGER")
        print("=" * 50)
        
        self.check_python_version()
        self.check_pip_packages()
        self.check_directories()
        self.check_core_files()
        self.check_security_modules()
        self.check_ai_modules()
        self.generate_recommendations()
        
        return self.results
        
    def print_results(self):
        """Afficher résultats"""
        status_emoji = {'OK': '✅', 'WARNING': '⚠️', 'FAIL': '❌', 'MISSING': '❌'}
        
        print(f"\n📊 RÉSULTATS AUDIT - {self.results['status']} {status_emoji.get(self.results['status'], '❓')}")
        print("=" * 50)
        
        # Technologies OK
        ok_count = sum(1 for tech in self.results['technologies'].values() if tech['status'] == 'OK')
        print(f"✅ Technologies OK: {ok_count}")
        
        # Manquantes
        if self.results['missing']:
            print(f"\n❌ MANQUANTES ({len(self.results['missing'])}):")
            for item in self.results['missing']:
                print(f"  • {item}")
                
        # Avertissements
        if self.results['warnings']:
            print(f"\n⚠️  AVERTISSEMENTS ({len(self.results['warnings'])}):")
            for item in self.results['warnings']:
                print(f"  • {item}")
                
        # Recommandations
        if self.results['recommendations']:
            print(f"\n💡 RECOMMANDATIONS:")
            for item in self.results['recommendations']:
                print(f"  • {item}")
                
        print(f"\n📅 Audit effectué: {self.results['timestamp']}")
        
    def save_report(self):
        """Sauvegarder rapport"""
        report_file = Path('data/audit_report.json')
        report_file.parent.mkdir(exist_ok=True)
        
        with open(report_file, 'w', encoding='utf-8') as f:
            json.dump(self.results, f, ensure_ascii=False, indent=2)
            
        print(f"📄 Rapport sauvegardé: {report_file}")

def main():
    auditor = TechAuditor()
    results = auditor.run_audit()
    auditor.print_results()
    auditor.save_report()
    
    # Code de sortie
    exit_code = 0 if results['status'] == 'OK' else 1
    sys.exit(exit_code)

if __name__ == '__main__':
    main()