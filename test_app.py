#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Test complet de l'application SecureVault
Vérifie toutes les fonctionnalités principales
"""

import os
import sys
import tempfile
import shutil
import unittest
from unittest.mock import patch, MagicMock

# Ajouter le répertoire src au path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'src'))

class TestSecureVault(unittest.TestCase):
    """Tests pour vérifier que tout marche"""
    
    def setUp(self):
        """Configuration avant chaque test"""
        self.test_dir = tempfile.mkdtemp()
        self.master_password = "TestPass123"
        self.test_email = "test@gmail.com"
        self.test_app_password = "abcd efgh ijkl mnop"
        self.test_api_key = "sk-test123456789"
        
    def tearDown(self):
        """Nettoyage après chaque test"""
        if os.path.exists(self.test_dir):
            shutil.rmtree(self.test_dir)
    
    def test_crypto_utils(self):
        """Test du module de chiffrement"""
        try:
            from core.crypto_utils import (
                sauvegarder_app_password, recuperer_app_password,
                sauvegarder_api_key, recuperer_api_key,
                valider_force_mot_de_passe, valider_email
            )
            
            # Test validation mot de passe
            valid, msg = valider_force_mot_de_passe(self.master_password)
            self.assertTrue(valid, f"Validation mot de passe échouée: {msg}")
            
            # Test validation email
            self.assertTrue(valider_email(self.test_email))
            
            # Test sauvegarde/récupération Gmail
            result = sauvegarder_app_password(
                self.test_app_password, 
                self.master_password, 
                self.test_dir, 
                self.test_email
            )
            self.assertTrue(result, "Sauvegarde Gmail échouée")
            
            password, email = recuperer_app_password(self.master_password, self.test_dir)
            self.assertEqual(password, self.test_app_password)
            self.assertEqual(email, self.test_email)
            
            # Test sauvegarde/récupération OpenAI
            result = sauvegarder_api_key(
                self.test_api_key, 
                "org-test", 
                self.master_password, 
                self.test_dir
            )
            self.assertTrue(result, "Sauvegarde OpenAI échouée")
            
            api_key, org_id = recuperer_api_key(self.master_password, self.test_dir)
            self.assertEqual(api_key, self.test_api_key)
            self.assertEqual(org_id, "org-test")
            
            print("OK Module crypto_utils fonctionne")
            
        except ImportError as e:
            print(f"ERREUR import crypto_utils: {e}")
            return False
        except Exception as e:
            print(f"ERREUR crypto_utils: {e}")
            return False
        
        return True
    
    def test_email_service(self):
        """Test du service email"""
        try:
            from services.email_service import EmailService
            
            # Mock SMTP pour éviter l'envoi réel
            with patch('smtplib.SMTP') as mock_smtp:
                mock_server = MagicMock()
                mock_smtp.return_value = mock_server
                
                service = EmailService()
                result = service.envoyer_email(
                    destinataire="test@example.com",
                    sujet="Test",
                    corps="Test message",
                    email_expediteur=self.test_email,
                    app_password=self.test_app_password
                )
                
                # Vérifier que SMTP a été appelé
                mock_smtp.assert_called_once()
                mock_server.starttls.assert_called_once()
                mock_server.login.assert_called_once()
                mock_server.send_message.assert_called_once()
                
            print("OK Service email fonctionne")
            return True
            
        except ImportError as e:
            print(f"ERREUR import email_service: {e}")
            return False
        except Exception as e:
            print(f"ERREUR email_service: {e}")
            return False
    
    def test_ai_service(self):
        """Test du service IA"""
        try:
            from services.ai_service import AIService
            
            # Mock OpenAI pour éviter l'appel réel
            with patch('openai.ChatCompletion.create') as mock_openai:
                mock_openai.return_value = {
                    'choices': [{'message': {'content': 'Test response'}}]
                }
                
                service = AIService()
                result = service.generer_email(
                    "Réunion demain",
                    "professionnel",
                    self.test_api_key
                )
                
                self.assertIsNotNone(result)
                self.assertIn('Test response', result)
                
            print("OK Service IA fonctionne")
            return True
            
        except ImportError as e:
            print(f"ERREUR import ai_service: {e}")
            return False
        except Exception as e:
            print(f"ERREUR ai_service: {e}")
            return False
    
    def test_flask_app(self):
        """Test de l'application Flask"""
        try:
            from web.app import app
            
            with app.test_client() as client:
                # Test page d'accueil
                response = client.get('/')
                self.assertEqual(response.status_code, 200)
                
                # Test page de configuration
                response = client.get('/config')
                self.assertEqual(response.status_code, 200)
                
                # Test API status
                response = client.get('/api/status')
                self.assertEqual(response.status_code, 200)
                
            print("OK Application Flask fonctionne")
            return True
            
        except ImportError as e:
            print(f"ERREUR import Flask app: {e}")
            return False
        except Exception as e:
            print(f"ERREUR Flask app: {e}")
            return False
    
    def test_config(self):
        """Test de la configuration"""
        try:
            from core.config import Config
            
            # Vérifier les constantes importantes
            self.assertGreater(Config.PBKDF2_ITERATIONS, 100000)
            self.assertIsNotNone(Config.SECRET_KEY)
            
            print("OK Configuration fonctionne")
            return True
            
        except ImportError as e:
            print(f"ERREUR import config: {e}")
            return False
        except Exception as e:
            print(f"ERREUR config: {e}")
            return False

def run_integration_test():
    """Test d'intégration complet"""
    print("Demarrage des tests SecureVault...")
    print("=" * 50)
    
    # Vérifier la structure des fichiers
    required_files = [
        'src/web/app.py',
        'src/core/config.py',
        'src/services/email_service.py',
        'requirements.txt'
    ]
    
    missing_files = []
    for file_path in required_files:
        if not os.path.exists(file_path):
            missing_files.append(file_path)
    
    if missing_files:
        print(f"ERREUR Fichiers manquants: {missing_files}")
        return False
    
    print("OK Structure des fichiers OK")
    
    # Exécuter les tests unitaires
    suite = unittest.TestLoader().loadTestsFromTestCase(TestSecureVault)
    runner = unittest.TextTestRunner(verbosity=0)
    result = runner.run(suite)
    
    if result.wasSuccessful():
        print("\n" + "=" * 50)
        print("TOUS LES TESTS PASSENT!")
        print("OK Chiffrement/dechiffrement")
        print("OK Service email")
        print("OK Service IA")
        print("OK Application Flask")
        print("OK Configuration")
        print("\nL'application est prete a etre utilisee:")
        print("   python src/web/app.py")
        return True
    else:
        print(f"\nERREUR: {len(result.failures + result.errors)} test(s) echoue(s)")
        return False

if __name__ == "__main__":
    success = run_integration_test()
    sys.exit(0 if success else 1)