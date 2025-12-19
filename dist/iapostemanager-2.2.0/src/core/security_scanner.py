"""Scanner de sécurité automatique"""
import os
import re
import hashlib

class SecurityScanner:
    def __init__(self):
        self.vulnerabilities = []
        self.security_patterns = [
            (r'password\s*=\s*["\'][^"\']+["\']', 'Hardcoded password'),
            (r'api_key\s*=\s*["\'][^"\']+["\']', 'Hardcoded API key'),
            (r'secret\s*=\s*["\'][^"\']+["\']', 'Hardcoded secret'),
            (r'eval\s*\(', 'Dangerous eval() usage'),
            (r'exec\s*\(', 'Dangerous exec() usage'),
        ]
    
    def scan_file(self, file_path):
        """Scanner un fichier"""
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            for pattern, description in self.security_patterns:
                matches = re.finditer(pattern, content, re.IGNORECASE)
                for match in matches:
                    line_num = content[:match.start()].count('\n') + 1
                    self.vulnerabilities.append({
                        'file': file_path,
                        'line': line_num,
                        'type': description,
                        'severity': 'HIGH'
                    })
        except:
            pass
    
    def scan_directory(self, directory):
        """Scanner répertoire"""
        for root, dirs, files in os.walk(directory):
            # Ignorer dossiers sensibles
            dirs[:] = [d for d in dirs if d not in ['.git', '__pycache__', 'node_modules']]
            
            for file in files:
                if file.endswith(('.py', '.js', '.ts', '.yml', '.yaml')):
                    self.scan_file(os.path.join(root, file))
    
    def check_file_permissions(self, directory):
        """Vérifier permissions fichiers"""
        for root, dirs, files in os.walk(directory):
            for file in files:
                file_path = os.path.join(root, file)
                try:
                    stat = os.stat(file_path)
                    # Vérifier si fichier world-readable
                    if stat.st_mode & 0o004:
                        self.vulnerabilities.append({
                            'file': file_path,
                            'type': 'World-readable file',
                            'severity': 'MEDIUM'
                        })
                except:
                    pass
    
    def generate_report(self):
        """Générer rapport sécurité"""
        return {
            'scan_date': '2024-01-15T10:30:00Z',
            'total_vulnerabilities': len(self.vulnerabilities),
            'high_severity': len([v for v in self.vulnerabilities if v.get('severity') == 'HIGH']),
            'vulnerabilities': self.vulnerabilities[:10]  # Top 10
        }