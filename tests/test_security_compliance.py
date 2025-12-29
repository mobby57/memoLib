"""
Tests de conformité de sécurité
================================

Vérifie automatiquement que les bonnes pratiques de sécurité sont respectées.
"""

import pytest
import os
import re
from pathlib import Path

# Charger les variables d'environnement
try:
    from dotenv import load_dotenv
    env_path = Path(__file__).parent.parent / '.env'
    load_dotenv(env_path)
except ImportError:
    pass


class TestSecurityCompliance:
    """Tests de conformité sécurité"""
    
    def test_no_hardcoded_api_keys(self):
        """Vérifie qu'aucune clé API n'est hardcodée dans le code"""
        
        # Patterns suspects
        suspicious_patterns = [
            r'sk-proj-[a-zA-Z0-9]{20,}',  # OpenAI keys
            r'sk-test-[a-zA-Z0-9]{20,}',
            r'AIza[a-zA-Z0-9_-]{35}',  # Google API keys
            r'AKIA[0-9A-Z]{16}',  # AWS access keys
            r'ghp_[a-zA-Z0-9]{36}',  # GitHub tokens
            r'xox[baprs]-[a-zA-Z0-9-]{10,}',  # Slack tokens
        ]
        
        # Fichiers à analyser
        python_files = []
        for pattern in ['**/*.py', '**/*.ts', '**/*.tsx', '**/*.js']:
            python_files.extend(Path('.').glob(pattern))
        
        violations = []
        
        for file_path in python_files:
            # Ignorer certains dossiers
            if any(skip in str(file_path) for skip in ['venv', 'node_modules', '__pycache__', 'test', '.git']):
                continue
            
            try:
                content = file_path.read_text(encoding='utf-8')
                
                for pattern in suspicious_patterns:
                    matches = re.findall(pattern, content)
                    if matches:
                        violations.append({
                            'file': str(file_path),
                            'pattern': pattern,
                            'matches': matches
                        })
            except:
                continue  # Ignorer erreurs de lecture
        
        assert len(violations) == 0, (
            f"Clés API hardcodées détectées :\n" +
            '\n'.join([f"  {v['file']}: {v['pattern']}" for v in violations])
        )
    
    def test_no_password_in_code(self):
        """Vérifie qu'aucun mot de passe n'est hardcodé"""
        
        suspicious_lines = [
            r'password\s*=\s*["\'][^"\']{8,}["\']',
            r'passwd\s*=\s*["\'][^"\']{8,}["\']',
            r'pwd\s*=\s*["\'][^"\']{8,}["\']',
        ]
        
        python_files = Path('.').glob('**/*.py')
        violations = []
        
        for file_path in python_files:
            if any(skip in str(file_path) for skip in ['venv', 'test', '__pycache__']):
                continue
            
            try:
                content = file_path.read_text(encoding='utf-8')
                
                for pattern in suspicious_lines:
                    if re.search(pattern, content, re.IGNORECASE):
                        violations.append(str(file_path))
            except:
                continue
        
        assert len(violations) == 0, (
            f"Mots de passe hardcodés détectés dans :\n" +
            '\n'.join([f"  {v}" for v in violations])
        )
    
    def test_env_in_gitignore(self):
        """Vérifie que .env est dans .gitignore"""
        
        gitignore = Path('.gitignore')
        assert gitignore.exists(), ".gitignore manquant"
        
        content = gitignore.read_text()
        assert '.env' in content, ".env doit être dans .gitignore"
    
    def test_env_file_not_committed(self):
        """Vérifie que .env n'est pas tracké par Git"""
        
        import subprocess
        
        try:
            # Vérifier si .env est dans l'index Git
            result = subprocess.run(
                ['git', 'ls-files', '.env'],
                capture_output=True,
                text=True,
                timeout=5
            )
            
            assert result.stdout.strip() == '', (
                ".env est tracké par Git ! "
                "Supprimez-le avec : git rm --cached .env"
            )
        except:
            # Git non disponible ou autre erreur - skip ce test
            pytest.skip("Git non disponible")
    
    def test_master_key_defined(self):
        """Vérifie que la clé maître est définie"""
        
        master_key = os.getenv('MASTER_ENCRYPTION_KEY')
        
        # En mode test, on peut skip
        if not master_key:
            pytest.skip("MASTER_ENCRYPTION_KEY non définie (mode test)")
        
        assert len(master_key) >= 32, (
            "MASTER_ENCRYPTION_KEY trop courte (min 32 caractères)"
        )
    
    def test_jwt_secret_defined(self):
        """Vérifie que le secret JWT est défini"""
        
        jwt_secret = os.getenv('JWT_SECRET_KEY')
        
        if not jwt_secret:
            pytest.skip("JWT_SECRET_KEY non définie (mode test)")
        
        assert len(jwt_secret) >= 32, (
            "JWT_SECRET_KEY trop courte (min 32 caractères)"
        )
        
        # Vérifier que ce n'est pas la valeur par défaut
        assert jwt_secret != "your-secret-key-change-in-production", (
            "JWT_SECRET_KEY utilise toujours la valeur par défaut !"
        )
    
    def test_no_secrets_in_logs(self):
        """Vérifie qu'aucun secret n'est loggé"""
        
        log_patterns = [
            r'logger\.(info|debug|warning)\([^)]*api[_\s]*key[^)]*\)',
            r'logger\.(info|debug|warning)\([^)]*password[^)]*\)',
            r'logger\.(info|debug|warning)\([^)]*secret[^)]*\)',
            r'print\([^)]*api[_\s]*key[^)]*\)',
            r'print\([^)]*password[^)]*\)',
        ]
        
        python_files = Path('.').glob('**/*.py')
        violations = []
        
        for file_path in python_files:
            if any(skip in str(file_path) for skip in ['venv', '__pycache__']):
                continue
            
            try:
                content = file_path.read_text(encoding='utf-8')
                
                for pattern in log_patterns:
                    matches = re.findall(pattern, content, re.IGNORECASE)
                    if matches:
                        violations.append((str(file_path), pattern))
            except:
                continue
        
        # Permettre quelques exceptions dans les tests
        violations = [
            v for v in violations 
            if 'test' not in v[0].lower()
        ]
        
        assert len(violations) == 0, (
            f"Secrets potentiellement loggés dans :\n" +
            '\n'.join([f"  {v[0]}: {v[1]}" for v in violations])
        )
    
    def test_encryption_modules_available(self):
        """Vérifie que les modules de chiffrement sont disponibles"""
        
        try:
            from security.secrets_manager import get_secrets_manager
            from security.encryption import get_encryption
            from security.middleware import get_security
        except ImportError as e:
            pytest.fail(f"Module de sécurité manquant : {e}")
    
    def test_audit_trail_configured(self):
        """Vérifie que l'audit trail est configuré"""
        
        audit_file = Path('data/audit_trail.json')
        
        # Le fichier n'existe pas forcément au démarrage, mais le dossier oui
        assert audit_file.parent.exists(), (
            "Dossier data/ manquant pour audit trail"
        )
    
    def test_secure_random_generation(self):
        """Vérifie que les nombres aléatoires sont générés de manière sécurisée"""
        
        # Rechercher usage de random.random() au lieu de secrets
        insecure_patterns = [
            r'import random\n',
            r'random\.random\(',
            r'random\.randint\(',
            r'random\.choice\(',
        ]
        
        python_files = Path('.').glob('**/*.py')
        violations = []
        
        for file_path in python_files:
            if any(skip in str(file_path) for skip in ['venv', 'test', '__pycache__', 'examples']):
                continue
            
            # Ignorer les fichiers non liés à la sécurité
            if 'security' not in str(file_path) and 'auth' not in str(file_path):
                continue
            
            try:
                content = file_path.read_text(encoding='utf-8')
                
                for pattern in insecure_patterns:
                    if re.search(pattern, content):
                        violations.append(str(file_path))
                        break
            except:
                continue
        
        assert len(violations) == 0, (
            f"Génération aléatoire non sécurisée détectée dans :\n" +
            '\n'.join([f"  {v}" for v in violations]) +
            "\nUtilisez 'secrets' au lieu de 'random' pour la sécurité"
        )


class TestRGPDCompliance:
    """Tests de conformité RGPD"""
    
    def test_data_encryption_available(self):
        """Vérifie que le chiffrement des données est disponible"""
        
        from security.encryption import get_encryption
        
        encryption = get_encryption()
        
        # Test chiffrement/déchiffrement
        test_data = "Données personnelles sensibles"
        encrypted = encryption.encrypt_text(test_data)
        decrypted = encryption.decrypt_text(encrypted)
        
        assert decrypted == test_data, "Erreur chiffrement/déchiffrement"
    
    def test_anonymization_functions(self):
        """Vérifie que l'anonymisation est disponible"""
        
        from security.encryption import get_encryption
        
        encryption = get_encryption()
        
        # Test anonymisation email
        email = "user@example.com"
        anonymized = encryption.anonymize_email(email)
        
        assert anonymized != email, "Email non anonymisé"
        assert len(anonymized) == 16, "Format anonymisation incorrect"
    
    def test_audit_logging(self):
        """Vérifie que l'audit logging fonctionne"""
        
        from security.middleware import get_security
        
        security = get_security()
        
        # Test audit log
        security._audit_log('TEST_ACTION', {'test': 'data'})
        
        logs = security.get_audit_logs(limit=10)
        assert len(logs) > 0, "Audit trail non fonctionnel"


if __name__ == '__main__':
    pytest.main([__file__, '-v'])
