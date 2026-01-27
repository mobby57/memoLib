#!/usr/bin/env python3
"""
🛡️ Tests de Sécurité Complets - IaPosteManager
===============================================

Ce script teste l'efficacité des protections de sécurité implémentées.
Il simule différentes attaques et vérifie que les défenses fonctionnent.

Usage: python security/security_tests.py
"""

import os
import sys

# Ajouter le path du projet
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

import json
import unittest
from datetime import datetime


class Colors:
    RED = "\033[91m"
    GREEN = "\033[92m"
    YELLOW = "\033[93m"
    BLUE = "\033[94m"
    CYAN = "\033[96m"
    RESET = "\033[0m"
    BOLD = "\033[1m"


def log_test(test_name: str, passed: bool, details: str = ""):
    """Log le résultat d'un test"""
    icon = "✅" if passed else "❌"
    color = Colors.GREEN if passed else Colors.RED
    print(f"{icon} {color}{test_name}{Colors.RESET}")
    if details:
        print(f"   └─ {details}")


class TestInputValidator(unittest.TestCase):
    """Tests du validateur d'entrées"""

    @classmethod
    def setUpClass(cls):
        try:
            from src.backend.security.input_validator import InputValidator

            cls.validator = InputValidator
            cls.available = True
        except ImportError as e:
            print(f"{Colors.YELLOW}⚠️ InputValidator non disponible: {e}{Colors.RESET}")
            cls.available = False

    def test_sql_injection_detection(self):
        """Test détection SQL Injection"""
        if not self.available:
            self.skipTest("Validator non disponible")

        payloads = [
            "' OR '1'='1",
            "'; DROP TABLE users; --",
            "' UNION SELECT * FROM passwords --",
            "admin'--",
            "1; DELETE FROM users",
        ]

        for payload in payloads:
            result = self.validator.check_sql_injection(payload)
            self.assertTrue(result, f"SQL Injection non détectée: {payload}")
            log_test(f"SQL Injection: {payload[:30]}...", result)

    def test_xss_detection(self):
        """Test détection XSS"""
        if not self.available:
            self.skipTest("Validator non disponible")

        payloads = [
            '<script>alert("XSS")</script>',
            '<img src=x onerror=alert("XSS")>',
            "javascript:alert(1)",
            "<svg onload=alert(1)>",
        ]

        for payload in payloads:
            result = self.validator.check_xss(payload)
            self.assertTrue(result, f"XSS non détecté: {payload}")
            log_test(f"XSS: {payload[:30]}...", result)

    def test_path_traversal_detection(self):
        """Test détection Path Traversal"""
        if not self.available:
            self.skipTest("Validator non disponible")

        payloads = [
            "../../../etc/passwd",
            "..\\..\\windows\\system32",
            "%2e%2e%2fetc/passwd",
        ]

        for payload in payloads:
            result = self.validator.check_path_traversal(payload)
            self.assertTrue(result, f"Path Traversal non détecté: {payload}")
            log_test(f"Path Traversal: {payload[:30]}...", result)

    def test_command_injection_detection(self):
        """Test détection Command Injection"""
        if not self.available:
            self.skipTest("Validator non disponible")

        payloads = [
            "; cat /etc/passwd",
            "| ls -la",
            "`whoami`",
            "$(rm -rf /)",
        ]

        for payload in payloads:
            result = self.validator.check_command_injection(payload)
            self.assertTrue(result, f"Command Injection non détectée: {payload}")
            log_test(f"Command Injection: {payload[:30]}...", result)

    def test_nosql_injection_detection(self):
        """Test détection NoSQL Injection"""
        if not self.available:
            self.skipTest("Validator non disponible")

        payloads = [
            '{"$gt": ""}',
            '{"$ne": null}',
            '{"$where": "this.password.length > 0"}',
        ]

        for payload in payloads:
            result = self.validator.check_nosql_injection(payload)
            self.assertTrue(result, f"NoSQL Injection non détectée: {payload}")
            log_test(f"NoSQL Injection: {payload[:30]}...", result)

    def test_html_sanitization(self):
        """Test sanitization HTML"""
        if not self.available:
            self.skipTest("Validator non disponible")

        dangerous = '<script>alert("XSS")</script>'
        sanitized = self.validator.sanitize_html(dangerous)

        self.assertNotIn("<script>", sanitized)
        self.assertNotIn("</script>", sanitized)
        log_test("HTML Sanitization", "<script>" not in sanitized)

    def test_filename_sanitization(self):
        """Test sanitization nom de fichier"""
        if not self.available:
            self.skipTest("Validator non disponible")

        dangerous = "../../../etc/passwd"
        sanitized = self.validator.sanitize_filename(dangerous)

        self.assertNotIn("..", sanitized)
        self.assertNotIn("/", sanitized)
        log_test("Filename Sanitization", ".." not in sanitized)

    def test_password_strength(self):
        """Test validation force mot de passe"""
        if not self.available:
            self.skipTest("Validator non disponible")

        from src.backend.security.input_validator import validate_password_strength

        # Mot de passe faible
        weak = validate_password_strength("password")
        self.assertFalse(weak["valid"])
        log_test("Password faible rejeté", not weak["valid"])

        # Mot de passe fort
        strong = validate_password_strength("SecureP@ssw0rd2026!")
        self.assertTrue(strong["valid"])
        log_test("Password fort accepté", strong["valid"])


class TestSecurityMiddleware(unittest.TestCase):
    """Tests du middleware de sécurité"""

    @classmethod
    def setUpClass(cls):
        try:
            from src.backend.security.middleware import (
                CSRFProtection,
                IntrusionDetector,
                RateLimiter,
                SecurityConfig,
            )

            cls.csrf = CSRFProtection
            cls.rate_limiter = RateLimiter
            cls.intrusion = IntrusionDetector
            cls.config = SecurityConfig
            cls.available = True
        except ImportError as e:
            print(f"{Colors.YELLOW}⚠️ Middleware non disponible: {e}{Colors.RESET}")
            cls.available = False

    def test_csrf_token_generation(self):
        """Test génération token CSRF"""
        if not self.available:
            self.skipTest("Middleware non disponible")

        token1 = self.csrf.generate_token()
        token2 = self.csrf.generate_token()

        # Tokens uniques
        self.assertNotEqual(token1, token2)
        # Longueur correcte
        self.assertEqual(len(token1), self.config.CSRF_TOKEN_LENGTH)

        log_test("CSRF Token Generation", token1 != token2)

    def test_security_headers(self):
        """Test headers de sécurité"""
        if not self.available:
            self.skipTest("Middleware non disponible")

        required_headers = [
            "X-Content-Type-Options",
            "X-Frame-Options",
            "X-XSS-Protection",
            "Content-Security-Policy",
            "Strict-Transport-Security",
        ]

        for header in required_headers:
            self.assertIn(header, self.config.SECURITY_HEADERS)
            log_test(f"Header {header}", header in self.config.SECURITY_HEADERS)

    def test_rate_limit_config(self):
        """Test configuration rate limiting"""
        if not self.available:
            self.skipTest("Middleware non disponible")

        # Vérifier les catégories
        categories = ["default", "auth", "api", "upload"]

        for cat in categories:
            self.assertIn(cat, self.config.RATE_LIMITS)
            limit, window = self.config.RATE_LIMITS[cat]
            self.assertGreater(limit, 0)
            self.assertGreater(window, 0)
            log_test(f"Rate Limit {cat}: {limit}/{window}s", True)


class TestEncryption(unittest.TestCase):
    """Tests du module de chiffrement"""

    @classmethod
    def setUpClass(cls):
        try:
            from src.backend.security.encryption import DataEncryption

            cls.encryption = DataEncryption(key_file="/tmp/.test_encryption_key")
            cls.available = True
        except ImportError as e:
            print(f"{Colors.YELLOW}⚠️ Encryption non disponible: {e}{Colors.RESET}")
            cls.available = False

    def test_text_encryption_decryption(self):
        """Test chiffrement/déchiffrement texte"""
        if not self.available:
            self.skipTest("Encryption non disponible")

        original = "Données sensibles client: Jean Dupont"

        encrypted = self.encryption.encrypt_text(original)
        self.assertNotEqual(encrypted, original)

        decrypted = self.encryption.decrypt_text(encrypted)
        self.assertEqual(decrypted, original)

        log_test("Text Encryption/Decryption", decrypted == original)

    def test_empty_string(self):
        """Test avec chaîne vide"""
        if not self.available:
            self.skipTest("Encryption non disponible")

        encrypted = self.encryption.encrypt_text("")
        self.assertEqual(encrypted, "")
        log_test("Empty String Handling", encrypted == "")


def run_security_tests():
    """Exécute tous les tests de sécurité"""
    print(
        f"""
{Colors.CYAN}╔══════════════════════════════════════════════════════════════╗
║  🛡️  TESTS DE SÉCURITÉ COMPLETS - IaPosteManager             ║
╚══════════════════════════════════════════════════════════════╝{Colors.RESET}
"""
    )

    # Créer le test suite
    loader = unittest.TestLoader()
    suite = unittest.TestSuite()

    # Ajouter les tests
    suite.addTests(loader.loadTestsFromTestCase(TestInputValidator))
    suite.addTests(loader.loadTestsFromTestCase(TestSecurityMiddleware))
    suite.addTests(loader.loadTestsFromTestCase(TestEncryption))

    # Runner personnalisé
    runner = unittest.TextTestRunner(verbosity=2)
    result = runner.run(suite)

    # Résumé
    print(f"\n{Colors.BOLD}{'='*60}")
    print(f"📊 RÉSUMÉ DES TESTS DE SÉCURITÉ")
    print(f"{'='*60}{Colors.RESET}")

    total = result.testsRun
    failures = len(result.failures)
    errors = len(result.errors)
    skipped = len(result.skipped)
    passed = total - failures - errors - skipped

    print(f"  Tests exécutés: {total}")
    print(f"  {Colors.GREEN}Réussis: {passed}{Colors.RESET}")
    print(f"  {Colors.RED}Échecs: {failures}{Colors.RESET}")
    print(f"  {Colors.RED}Erreurs: {errors}{Colors.RESET}")
    print(f"  {Colors.YELLOW}Ignorés: {skipped}{Colors.RESET}")

    success_rate = (passed / total * 100) if total > 0 else 0
    color = (
        Colors.GREEN
        if success_rate >= 90
        else (Colors.YELLOW if success_rate >= 70 else Colors.RED)
    )
    print(f"  {color}Taux de réussite: {success_rate:.1f}%{Colors.RESET}")

    # Sauvegarder le rapport
    report = {
        "timestamp": datetime.now().isoformat(),
        "total_tests": total,
        "passed": passed,
        "failures": failures,
        "errors": errors,
        "skipped": skipped,
        "success_rate": success_rate,
    }

    with open("security/security-tests-results.json", "w") as f:
        json.dump(report, f, indent=2)

    print(
        f"\n{Colors.GREEN}✅ Rapport sauvegardé: security/security-tests-results.json{Colors.RESET}\n"
    )

    return result.wasSuccessful()


if __name__ == "__main__":
    success = run_security_tests()
    sys.exit(0 if success else 1)
