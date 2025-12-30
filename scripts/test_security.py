"""
Script de test de la sécurité
==============================

Teste tous les composants de sécurité :
- Gestionnaire de secrets
- Chiffrement/déchiffrement
- Middleware JWT
- Rate limiting
- Audit trail
"""

import sys
from pathlib import Path

# Ajouter le répertoire parent au PYTHONPATH
sys.path.insert(0, str(Path(__file__).parent.parent))

import os
from dotenv import load_dotenv

# Charger les variables d'environnement
load_dotenv()


def test_secrets_manager():
    """Test du gestionnaire de secrets"""
    
    print("🧪 Test : Gestionnaire de secrets")
    print("-" * 50)
    
    from security.secrets_manager import get_secrets_manager
    
    try:
        secrets_mgr = get_secrets_manager()
        
        # Test 1 : Définir et récupérer
        test_key = 'TEST_API_KEY'
        test_value = 'sk-test-123456'
        
        secrets_mgr.set_secret(test_key, test_value, save=False)
        retrieved = secrets_mgr.get_secret(test_key, use_env=False)
        
        assert retrieved == test_value, "Erreur récupération secret"
        print("   ✅ Définir/récupérer secret")
        
        # Test 2 : Rotation
        new_value = 'sk-test-789012'
        secrets_mgr.rotate_secret(test_key, new_value)
        rotated = secrets_mgr.get_secret(test_key, use_env=False)
        
        assert rotated == new_value, "Erreur rotation secret"
        print("   ✅ Rotation de secret")
        
        # Test 3 : Suppression
        secrets_mgr.delete_secret(test_key, save=False)
        deleted = secrets_mgr.get_secret(test_key, use_env=False)
        
        assert deleted is None, "Erreur suppression secret"
        print("   ✅ Suppression de secret")
        
        # Test 4 : Variables d'environnement
        os.environ['TEST_ENV_VAR'] = 'env_value_123'
        env_value = secrets_mgr.get_secret('TEST_ENV_VAR')
        
        assert env_value == 'env_value_123', "Erreur lecture env"
        print("   ✅ Lecture variables d'environnement")
        
        print("✅ Gestionnaire de secrets OK\n")
        return True
        
    except Exception as e:
        print(f"❌ Erreur : {e}\n")
        import traceback
        traceback.print_exc()
        return False


def test_encryption():
    """Test du chiffrement"""
    
    print("🧪 Test : Chiffrement")
    print("-" * 50)
    
    from security.encryption import get_encryption, RSAEncryption
    
    try:
        encryption = get_encryption()
        
        # Test 1 : Chiffrement texte AES-GCM
        plaintext = "Données sensibles à protéger 🔒"
        encrypted = encryption.encrypt_text(plaintext)
        decrypted = encryption.decrypt_text(encrypted)
        
        assert decrypted == plaintext, "Erreur chiffrement AES-GCM"
        print("   ✅ Chiffrement/déchiffrement AES-GCM")
        
        # Test 2 : Chiffrement ChaCha20
        encrypted_chacha = encryption.encrypt_text(plaintext, algorithm='CHACHA20')
        decrypted_chacha = encryption.decrypt_text(encrypted_chacha, algorithm='CHACHA20')
        
        assert decrypted_chacha == plaintext, "Erreur chiffrement ChaCha20"
        print("   ✅ Chiffrement/déchiffrement ChaCha20")
        
        # Test 3 : Hash de mot de passe
        password = "mon_super_password_123"
        password_hash = encryption.hash_password(password)
        
        assert encryption.verify_password(password, password_hash), "Erreur hash password"
        assert not encryption.verify_password("mauvais_password", password_hash), "Erreur vérif password"
        print("   ✅ Hash et vérification mot de passe")
        
        # Test 4 : Anonymisation
        email = "user@example.com"
        email_hash = encryption.anonymize_email(email)
        
        assert len(email_hash) == 16, "Erreur anonymisation email"
        assert email_hash != email, "Email non anonymisé"
        print("   ✅ Anonymisation email")
        
        # Test 5 : RSA
        rsa = RSAEncryption()
        private_pem, public_pem = rsa.generate_keypair(key_size=2048)
        
        rsa_plaintext = "Message RSA"
        rsa_encrypted = rsa.encrypt(rsa_plaintext)
        rsa_decrypted = rsa.decrypt(rsa_encrypted)
        
        assert rsa_decrypted == rsa_plaintext, "Erreur chiffrement RSA"
        print("   ✅ Chiffrement/déchiffrement RSA")
        
        print("✅ Chiffrement OK\n")
        return True
        
    except Exception as e:
        print(f"❌ Erreur : {e}\n")
        import traceback
        traceback.print_exc()
        return False


def test_middleware():
    """Test du middleware de sécurité"""
    
    print("🧪 Test : Middleware de sécurité")
    print("-" * 50)
    
    from security.middleware import get_security
    
    try:
        security = get_security()
        
        # Test 1 : Génération JWT
        token = security.generate_jwt_token(
            user_id='user123',
            email='test@example.com',
            roles=['user', 'admin']
        )
        
        assert token, "Erreur génération JWT"
        print("   ✅ Génération JWT")
        
        # Test 2 : Vérification JWT
        payload = security.verify_jwt_token(token)
        
        assert payload is not None, "Erreur vérification JWT"
        assert payload['user_id'] == 'user123', "Erreur payload JWT"
        assert 'admin' in payload['roles'], "Erreur rôles JWT"
        print("   ✅ Vérification JWT")
        
        # Test 3 : Token invalide
        invalid_payload = security.verify_jwt_token('invalid.token.here')
        
        assert invalid_payload is None, "Token invalide accepté"
        print("   ✅ Rejet token invalide")
        
        # Test 4 : CSRF token
        csrf_token = security.generate_csrf_token('session123')
        csrf_valid = security.verify_csrf_token('session123', csrf_token)
        
        assert csrf_valid, "Erreur vérification CSRF"
        print("   ✅ Génération/vérification CSRF")
        
        # Test 5 : Validation input
        safe_input = "Requête normale"
        dangerous_input = "SELECT * FROM users; DROP TABLE users;"
        
        assert security.validate_input(safe_input), "Input sûr rejeté"
        assert not security.validate_input(dangerous_input), "Input dangereux accepté"
        print("   ✅ Validation input (anti-injection)")
        
        # Test 6 : Sanitization
        dirty_input = "<script>alert('XSS')</script>"
        clean_input = security.sanitize_input(dirty_input)
        
        assert '<script>' not in clean_input, "XSS non nettoyé"
        print("   ✅ Sanitization input (anti-XSS)")
        
        print("✅ Middleware OK\n")
        return True
        
    except Exception as e:
        print(f"❌ Erreur : {e}\n")
        import traceback
        traceback.print_exc()
        return False


def test_file_encryption():
    """Test du chiffrement de fichiers"""
    
    print("🧪 Test : Chiffrement de fichiers")
    print("-" * 50)
    
    from security.encryption import get_encryption
    import tempfile
    
    try:
        encryption = get_encryption()
        
        # Créer un fichier temporaire
        with tempfile.NamedTemporaryFile(mode='w', delete=False, suffix='.txt') as f:
            test_file = Path(f.name)
            f.write("Contenu confidentiel du fichier\nLigne 2\nLigne 3")
        
        # Chiffrer
        encrypted_file = encryption.encrypt_file(test_file)
        
        assert encrypted_file.exists(), "Fichier chiffré non créé"
        print("   ✅ Chiffrement de fichier")
        
        # Déchiffrer
        decrypted_file = encryption.decrypt_file(encrypted_file)
        
        with open(decrypted_file, 'r') as f:
            content = f.read()
        
        assert "Contenu confidentiel" in content, "Erreur déchiffrement fichier"
        print("   ✅ Déchiffrement de fichier")
        
        # Nettoyer
        test_file.unlink(missing_ok=True)
        encrypted_file.unlink(missing_ok=True)
        decrypted_file.unlink(missing_ok=True)
        
        print("✅ Chiffrement de fichiers OK\n")
        return True
        
    except Exception as e:
        print(f"❌ Erreur : {e}\n")
        import traceback
        traceback.print_exc()
        return False


def test_audit_trail():
    """Test du journal d'audit"""
    
    print("🧪 Test : Journal d'audit")
    print("-" * 50)
    
    from security.middleware import get_security
    
    try:
        security = get_security()
        
        # Déclencher quelques actions auditées
        security._audit_log('TEST_ACTION_1', {'data': 'test1'})
        security._audit_log('TEST_ACTION_2', {'data': 'test2'})
        
        # Récupérer les logs
        logs = security.get_audit_logs(limit=10)
        
        assert len(logs) > 0, "Aucun log d'audit"
        assert any(log['action'] == 'TEST_ACTION_1' for log in logs), "Log non enregistré"
        print("   ✅ Enregistrement d'audit")
        
        # Filtrer par action
        filtered_logs = security.get_audit_logs(limit=10, action_filter='TEST_ACTION_1')
        
        assert all(log['action'] == 'TEST_ACTION_1' for log in filtered_logs), "Filtre audit incorrect"
        print("   ✅ Filtrage des logs")
        
        print("✅ Journal d'audit OK\n")
        return True
        
    except Exception as e:
        print(f"❌ Erreur : {e}\n")
        import traceback
        traceback.print_exc()
        return False


def main():
    """Point d'entrée principal"""
    
    print("=" * 60)
    print("  IA POSTE MANAGER - TESTS DE SÉCURITÉ")
    print("=" * 60)
    print()
    
    # Vérifier que .env existe
    if not os.getenv('MASTER_ENCRYPTION_KEY'):
        print("❌ MASTER_ENCRYPTION_KEY non définie")
        print("   Exécutez d'abord : python scripts/init_security.py")
        sys.exit(1)
    
    # Exécuter les tests
    tests = [
        ("Gestionnaire de secrets", test_secrets_manager),
        ("Chiffrement", test_encryption),
        ("Middleware", test_middleware),
        ("Chiffrement de fichiers", test_file_encryption),
        ("Journal d'audit", test_audit_trail)
    ]
    
    results = []
    
    for test_name, test_func in tests:
        try:
            result = test_func()
            results.append((test_name, result))
        except Exception as e:
            print(f"❌ Erreur critique dans {test_name} : {e}")
            import traceback
            traceback.print_exc()
            results.append((test_name, False))
    
    # Résumé
    print("=" * 60)
    print("  RÉSUMÉ DES TESTS")
    print("=" * 60)
    print()
    
    passed = sum(1 for _, result in results if result)
    total = len(results)
    
    for test_name, result in results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"   {status}  {test_name}")
    
    print()
    print(f"   Total : {passed}/{total} tests réussis")
    print()
    
    if passed == total:
        print("🎉 Tous les tests sont passés !")
        print("   La sécurité est correctement configurée.")
    else:
        print("⚠️  Certains tests ont échoué")
        print("   Consultez docs/SECURITY_GUIDE.md pour plus d'aide")
        sys.exit(1)


if __name__ == '__main__':
    main()
