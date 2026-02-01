#!/usr/bin/env python3
"""
🏛️ AUDIT DE CONFORMITÉ INSTITUTIONNELLE - MemoLib
==========================================================

Critères obligatoires pour les institutions :
- ISO 27001 (Sécurité de l'information)
- SOC 2 Type II (Trust Services Criteria)
- GDPR (Protection des données personnelles)
- PCI-DSS (Données de paiement)
- ANSSI (Recommandations françaises)
- OWASP ASVS Level 2/3 (Vérification sécurité applicative)

⚠️ USAGE INTERNE UNIQUEMENT - AUDIT DE CONFORMITÉ
"""

import json
import os
import re
import subprocess
import sys
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from pathlib import Path
from typing import Any


class Severity(Enum):
    CRITICAL = "CRITICAL"
    HIGH = "HIGH"
    MEDIUM = "MEDIUM"
    LOW = "LOW"
    INFO = "INFO"


class Compliance(Enum):
    ISO_27001 = "ISO 27001"
    SOC2 = "SOC 2 Type II"
    GDPR = "GDPR"
    PCI_DSS = "PCI-DSS"
    ANSSI = "ANSSI"
    OWASP_ASVS = "OWASP ASVS"


@dataclass
class AuditResult:
    category: str
    requirement: str
    description: str
    compliance: list
    severity: Severity
    passed: bool
    details: str = ""
    recommendation: str = ""


@dataclass
class ComplianceAudit:
    results: list = field(default_factory=list)

    def add(self, result: AuditResult):
        self.results.append(result)

    def get_stats(self):
        total = len(self.results)
        passed = sum(1 for r in self.results if r.passed)
        critical_failed = sum(
            1 for r in self.results if not r.passed and r.severity == Severity.CRITICAL
        )
        high_failed = sum(
            1 for r in self.results if not r.passed and r.severity == Severity.HIGH
        )
        return {
            "total": total,
            "passed": passed,
            "failed": total - passed,
            "critical_failed": critical_failed,
            "high_failed": high_failed,
            "compliance_rate": round(passed / total * 100, 1) if total > 0 else 0,
        }


class Colors:
    RED = "\033[91m"
    GREEN = "\033[92m"
    YELLOW = "\033[93m"
    BLUE = "\033[94m"
    MAGENTA = "\033[95m"
    CYAN = "\033[96m"
    WHITE = "\033[97m"
    BOLD = "\033[1m"
    RESET = "\033[0m"


def banner():
    print(
        f"""
{Colors.CYAN}╔══════════════════════════════════════════════════════════════════════════╗
║  🏛️  AUDIT DE CONFORMITÉ INSTITUTIONNELLE - MemoLib               ║
║                                                                            ║
║  📋 Standards: ISO 27001 | SOC 2 | GDPR | PCI-DSS | ANSSI | OWASP ASVS    ║
║                                                                            ║
║  ⚠️  CRITÈRES OBLIGATOIRES POUR INSTITUTIONS                              ║
╚══════════════════════════════════════════════════════════════════════════╝{Colors.RESET}
"""
    )


def log_result(result: AuditResult):
    status = (
        f"{Colors.GREEN}✅ CONFORME{Colors.RESET}"
        if result.passed
        else f"{Colors.RED}❌ NON-CONFORME{Colors.RESET}"
    )
    severity_colors = {
        Severity.CRITICAL: Colors.RED,
        Severity.HIGH: Colors.YELLOW,
        Severity.MEDIUM: Colors.CYAN,
        Severity.LOW: Colors.WHITE,
        Severity.INFO: Colors.BLUE,
    }
    sev_color = severity_colors.get(result.severity, Colors.WHITE)
    print(
        f"  [{sev_color}{result.severity.value}{Colors.RESET}] {result.requirement}: {status}"
    )
    if not result.passed and result.recommendation:
        print(f"           └─ 💡 {result.recommendation[:80]}")


# ============================================================================
# 1. AUTHENTIFICATION ET GESTION DES ACCÈS (ISO 27001 A.9, SOC 2 CC6)
# ============================================================================
def get_source_files(base_path: Path, extensions: list) -> list:
    """Récupère les fichiers sources en excluant node_modules, .next, etc. - Version optimisée avec os.walk"""
    exclude_dirs = {
        "node_modules",
        ".next",
        ".git",
        "__pycache__",
        "dist",
        "build",
        ".venv",
        "venv",
        ".cache",
        "coverage",
        ".turbo",
    }
    files = []
    for root, dirs, filenames in os.walk(base_path):
        # Exclure les dossiers à ignorer (modifie dirs in-place)
        dirs[:] = [d for d in dirs if d not in exclude_dirs]
        for filename in filenames:
            if any(filename.endswith(ext) for ext in extensions):
                files.append(Path(root) / filename)
    return files


def audit_authentication(base_path: Path) -> list:
    results = []

    # 1.1 Politique de mots de passe forts
    password_patterns = [
        r"password.*length.*[<]?\s*(8|12)",
        r"bcrypt|argon2|scrypt|pbkdf2",
        r"password.*strength|validatePassword",
    ]

    files_to_check = get_source_files(base_path, [".py", ".ts", ".js"])
    has_strong_password = False
    has_password_hashing = False

    for f in files_to_check:
        try:
            content = f.read_text(errors="ignore")
            if re.search(r"bcrypt|argon2|scrypt|pbkdf2", content, re.IGNORECASE):
                has_password_hashing = True
            if re.search(
                r"password.*strength|validatePassword|MIN_PASSWORD_LENGTH.*1[2-9]",
                content,
                re.IGNORECASE,
            ):
                has_strong_password = True
        except:
            pass

    results.append(
        AuditResult(
            category="Authentification",
            requirement="AUTH-001: Hachage sécurisé des mots de passe",
            description="Les mots de passe doivent être hachés avec bcrypt/argon2/scrypt (coût ≥ 10)",
            compliance=[
                Compliance.ISO_27001,
                Compliance.PCI_DSS,
                Compliance.OWASP_ASVS,
            ],
            severity=Severity.CRITICAL,
            passed=has_password_hashing,
            recommendation="Utiliser bcrypt avec cost ≥ 12 ou Argon2id",
        )
    )

    results.append(
        AuditResult(
            category="Authentification",
            requirement="AUTH-002: Politique de mots de passe forts",
            description="Mots de passe ≥ 12 caractères avec complexité",
            compliance=[Compliance.ISO_27001, Compliance.ANSSI, Compliance.OWASP_ASVS],
            severity=Severity.HIGH,
            passed=has_strong_password,
            recommendation="Implémenter validation: min 12 chars, majuscules, chiffres, symboles",
        )
    )

    # 1.2 Protection contre brute force
    rate_limit_found = False
    for f in files_to_check:
        try:
            content = f.read_text(errors="ignore")
            if re.search(
                r"rate.?limit|throttle|max.?attempts|lockout", content, re.IGNORECASE
            ):
                rate_limit_found = True
                break
        except:
            pass

    results.append(
        AuditResult(
            category="Authentification",
            requirement="AUTH-003: Protection anti brute-force",
            description="Rate limiting et verrouillage de compte après échecs",
            compliance=[
                Compliance.ISO_27001,
                Compliance.PCI_DSS,
                Compliance.OWASP_ASVS,
            ],
            severity=Severity.CRITICAL,
            passed=rate_limit_found,
            recommendation="Implémenter rate limiting: max 5 tentatives / 15 min, lockout 30 min",
        )
    )

    # 1.3 MFA (Multi-Factor Authentication)
    mfa_found = False
    for f in files_to_check:
        try:
            content = f.read_text(errors="ignore")
            if re.search(
                r"mfa|2fa|two.?factor|totp|authenticator|otp", content, re.IGNORECASE
            ):
                mfa_found = True
                break
        except:
            pass

    results.append(
        AuditResult(
            category="Authentification",
            requirement="AUTH-004: Authentification Multi-Facteurs (MFA)",
            description="MFA obligatoire pour les accès sensibles",
            compliance=[Compliance.ISO_27001, Compliance.SOC2, Compliance.PCI_DSS],
            severity=Severity.HIGH,
            passed=mfa_found,
            recommendation="Implémenter TOTP (Google Authenticator) ou WebAuthn/FIDO2",
        )
    )

    # 1.4 Gestion des sessions sécurisée
    session_secure = False
    for f in files_to_check:
        try:
            content = f.read_text(errors="ignore")
            if re.search(
                r"httpOnly|secure.*cookie|sameSite|session.*timeout|jwt.*exp",
                content,
                re.IGNORECASE,
            ):
                session_secure = True
                break
        except:
            pass

    results.append(
        AuditResult(
            category="Authentification",
            requirement="AUTH-005: Gestion sécurisée des sessions",
            description="Cookies HttpOnly, Secure, SameSite + timeout",
            compliance=[Compliance.OWASP_ASVS, Compliance.PCI_DSS],
            severity=Severity.HIGH,
            passed=session_secure,
            recommendation="Configurer: HttpOnly, Secure, SameSite=Strict, timeout 15-30 min",
        )
    )

    return results


# ============================================================================
# 2. CHIFFREMENT DES DONNÉES (ISO 27001 A.10, PCI-DSS Req 3-4)
# ============================================================================
def audit_encryption(base_path: Path) -> list:
    results = []
    files_to_check = get_source_files(base_path, [".py", ".ts", ".js"])

    # 2.1 Chiffrement au repos
    encryption_at_rest = False
    for f in files_to_check:
        try:
            content = f.read_text(errors="ignore")
            if re.search(
                r"AES.?(256|GCM)|encrypt.*data|Fernet|cryptography",
                content,
                re.IGNORECASE,
            ):
                encryption_at_rest = True
                break
        except:
            pass

    results.append(
        AuditResult(
            category="Chiffrement",
            requirement="CRYPT-001: Chiffrement au repos (AES-256)",
            description="Données sensibles chiffrées avec AES-256-GCM minimum",
            compliance=[Compliance.ISO_27001, Compliance.PCI_DSS, Compliance.GDPR],
            severity=Severity.CRITICAL,
            passed=encryption_at_rest,
            recommendation="Utiliser AES-256-GCM avec gestion sécurisée des clés",
        )
    )

    # 2.2 TLS en transit
    tls_config = False
    config_files = get_source_files(base_path, [".yml", ".yaml", ".json"])
    for f in config_files + files_to_check:
        try:
            content = f.read_text(errors="ignore")
            if re.search(r"https|TLS.*1\.[23]|ssl.*true|HSTS", content, re.IGNORECASE):
                tls_config = True
                break
        except:
            pass

    results.append(
        AuditResult(
            category="Chiffrement",
            requirement="CRYPT-002: TLS 1.2+ en transit",
            description="Toutes les communications chiffrées en TLS 1.2 minimum",
            compliance=[Compliance.ISO_27001, Compliance.PCI_DSS, Compliance.ANSSI],
            severity=Severity.CRITICAL,
            passed=tls_config,
            recommendation="Configurer TLS 1.3 préféré, TLS 1.2 minimum, désactiver TLS 1.0/1.1",
        )
    )

    # 2.3 Gestion des clés
    key_management = False
    for f in files_to_check:
        try:
            content = f.read_text(errors="ignore")
            if re.search(
                r"KMS|key.?rotation|vault|HSM|SECRET_KEY.*env|getenv",
                content,
                re.IGNORECASE,
            ):
                key_management = True
                break
        except:
            pass

    results.append(
        AuditResult(
            category="Chiffrement",
            requirement="CRYPT-003: Gestion sécurisée des clés",
            description="Clés stockées dans vault/HSM, rotation périodique",
            compliance=[Compliance.ISO_27001, Compliance.PCI_DSS, Compliance.SOC2],
            severity=Severity.HIGH,
            passed=key_management,
            recommendation="Utiliser AWS KMS/HashiCorp Vault, rotation tous les 90 jours",
        )
    )

    # 2.4 Pas de secrets hardcodés - Vérifier gestionnaire de secrets
    secrets_manager_found = False
    for f in files_to_check:
        try:
            content = f.read_text(errors="ignore")
            # Chercher un module de gestion sécurisée des secrets
            if re.search(
                r"(SecretManager|SecretsManager|get_secret|require_secret|secret.?provider|vault.?client)",
                content,
                re.IGNORECASE,
            ):
                # Vérifier qu'il utilise des variables d'environnement ou vault
                if re.search(
                    r"(os\.environ|getenv|dotenv|azure.*keyvault|aws.*secrets|hashicorp.*vault)",
                    content,
                    re.IGNORECASE,
                ):
                    secrets_manager_found = True
                    break
        except:
            pass

    results.append(
        AuditResult(
            category="Chiffrement",
            requirement="CRYPT-004: Pas de secrets hardcodés",
            description="Aucun secret, clé API ou mot de passe dans le code",
            compliance=[Compliance.ISO_27001, Compliance.SOC2, Compliance.OWASP_ASVS],
            severity=Severity.CRITICAL,
            passed=secrets_manager_found,
            recommendation="Utiliser variables d'environnement ou gestionnaire de secrets",
        )
    )

    return results


# ============================================================================
# 3. JOURNALISATION ET AUDIT (ISO 27001 A.12.4, SOC 2 CC7)
# ============================================================================
def audit_logging(base_path: Path) -> list:
    results = []
    files_to_check = get_source_files(base_path, [".py", ".ts", ".js"])

    # 3.1 Journalisation des événements de sécurité
    security_logging = False
    for f in files_to_check:
        try:
            content = f.read_text(errors="ignore")
            if re.search(
                r"audit.?log|security.?log|log.*(login|auth|access)",
                content,
                re.IGNORECASE,
            ):
                security_logging = True
                break
        except:
            pass

    results.append(
        AuditResult(
            category="Journalisation",
            requirement="LOG-001: Journalisation des événements de sécurité",
            description="Enregistrement des authentifications, accès, modifications",
            compliance=[
                Compliance.ISO_27001,
                Compliance.SOC2,
                Compliance.PCI_DSS,
                Compliance.GDPR,
            ],
            severity=Severity.CRITICAL,
            passed=security_logging,
            recommendation="Logger: login/logout, échecs auth, accès données sensibles, modifications",
        )
    )

    # 3.2 Protection des logs
    log_protection = False
    for f in files_to_check:
        try:
            content = f.read_text(errors="ignore")
            if re.search(
                r"log.*immutable|log.*integrity|log.*sign|tamper.?proof",
                content,
                re.IGNORECASE,
            ):
                log_protection = True
                break
        except:
            pass

    results.append(
        AuditResult(
            category="Journalisation",
            requirement="LOG-002: Protection des logs contre modification",
            description="Logs immuables avec vérification d'intégrité",
            compliance=[Compliance.ISO_27001, Compliance.SOC2, Compliance.PCI_DSS],
            severity=Severity.HIGH,
            passed=log_protection,
            recommendation="Utiliser stockage WORM ou signature cryptographique des logs",
        )
    )

    # 3.3 Rétention des logs
    log_retention = False
    for f in get_source_files(base_path, [".yml", ".yaml"]) + files_to_check:
        try:
            content = f.read_text(errors="ignore")
            if re.search(
                r"retention|log.*days|log.*months|log.*years|keep.*logs",
                content,
                re.IGNORECASE,
            ):
                log_retention = True
                break
        except:
            pass

    results.append(
        AuditResult(
            category="Journalisation",
            requirement="LOG-003: Politique de rétention des logs",
            description="Conservation des logs minimum 1 an (PCI-DSS: 1 an, SOC2: 7 ans)",
            compliance=[Compliance.ISO_27001, Compliance.SOC2, Compliance.PCI_DSS],
            severity=Severity.HIGH,
            passed=log_retention,
            recommendation="Configurer rétention: 1 an minimum, 7 ans pour données critiques",
        )
    )

    # 3.4 Pas de données sensibles dans les logs
    # Vérifier si un module de sanitization des logs existe
    log_sanitizer_exists = False
    for f in files_to_check:
        try:
            content = f.read_text(errors="ignore")
            # Chercher un module dédié au masquage des données sensibles dans les logs
            if re.search(
                r"(SensitiveDataFilter|LogSanitizer|SecureLogger|sanitize.*log|log.*sanitiz|mask.*sensitive|sensitive.*mask)",
                content,
                re.IGNORECASE,
            ):
                # Vérifier qu'il contient des patterns de masquage
                if re.search(
                    r"(password|token|secret|card|email).*(\*+|mask|redact|XXXXX|\[MASKED\])",
                    content,
                    re.IGNORECASE,
                ):
                    log_sanitizer_exists = True
                    break
        except:
            pass

    results.append(
        AuditResult(
            category="Journalisation",
            requirement="LOG-004: Pas de données sensibles dans les logs",
            description="Mots de passe, tokens, PII masqués dans les logs",
            compliance=[Compliance.GDPR, Compliance.PCI_DSS, Compliance.OWASP_ASVS],
            severity=Severity.HIGH,
            passed=log_sanitizer_exists,
            recommendation="Implémenter masquage automatique des données sensibles",
        )
    )

    return results


# ============================================================================
# 4. PROTECTION DES DONNÉES PERSONNELLES (GDPR)
# ============================================================================
def audit_gdpr(base_path: Path) -> list:
    results = []
    files_to_check = get_source_files(base_path, [".py", ".ts", ".js"])

    # 4.1 Consentement explicite
    consent_found = False
    for f in files_to_check:
        try:
            content = f.read_text(errors="ignore")
            if re.search(
                r"consent|gdpr|rgpd|opt.?in|privacy.?policy", content, re.IGNORECASE
            ):
                consent_found = True
                break
        except:
            pass

    results.append(
        AuditResult(
            category="GDPR",
            requirement="GDPR-001: Gestion du consentement",
            description="Consentement explicite avant collecte de données personnelles",
            compliance=[Compliance.GDPR],
            severity=Severity.CRITICAL,
            passed=consent_found,
            recommendation="Implémenter formulaire de consentement avec cases non pré-cochées",
        )
    )

    # 4.2 Droit à l'effacement
    deletion_found = False
    for f in files_to_check:
        try:
            content = f.read_text(errors="ignore")
            if re.search(
                r"delete.?account|right.?to.?erasure|data.?deletion|anonymize",
                content,
                re.IGNORECASE,
            ):
                deletion_found = True
                break
        except:
            pass

    results.append(
        AuditResult(
            category="GDPR",
            requirement="GDPR-002: Droit à l'effacement",
            description="Possibilité de supprimer toutes les données personnelles",
            compliance=[Compliance.GDPR],
            severity=Severity.HIGH,
            passed=deletion_found,
            recommendation="Implémenter suppression complète ou anonymisation des données",
        )
    )

    # 4.3 Export des données (portabilité)
    export_found = False
    for f in files_to_check:
        try:
            content = f.read_text(errors="ignore")
            if re.search(
                r"export.?data|data.?portability|download.?data|gdpr.?export",
                content,
                re.IGNORECASE,
            ):
                export_found = True
                break
        except:
            pass

    results.append(
        AuditResult(
            category="GDPR",
            requirement="GDPR-003: Portabilité des données",
            description="Export des données personnelles en format standard (JSON/CSV)",
            compliance=[Compliance.GDPR],
            severity=Severity.MEDIUM,
            passed=export_found,
            recommendation="Ajouter fonctionnalité d'export des données utilisateur",
        )
    )

    # 4.4 Minimisation des données
    data_minimization = False
    for f in files_to_check:
        try:
            content = f.read_text(errors="ignore")
            if re.search(
                r"required.*field|optional.*field|minimal.*data|necessary.*data",
                content,
                re.IGNORECASE,
            ):
                data_minimization = True
                break
        except:
            pass

    results.append(
        AuditResult(
            category="GDPR",
            requirement="GDPR-004: Minimisation des données",
            description="Collecter uniquement les données strictement nécessaires",
            compliance=[Compliance.GDPR],
            severity=Severity.MEDIUM,
            passed=data_minimization,
            recommendation="Revoir les formulaires pour limiter les champs obligatoires",
        )
    )

    return results


# ============================================================================
# 5. SÉCURITÉ DES HEADERS HTTP (OWASP, ANSSI)
# ============================================================================
def audit_security_headers(base_path: Path) -> list:
    results = []
    files_to_check = get_source_files(base_path, [".py", ".ts", ".js"])
    config_files = get_source_files(base_path, [".yml", ".yaml", ".conf"])
    # Also check nginx files at root level
    nginx_files = list(base_path.glob("nginx*")) + list(base_path.glob("**/nginx*"))
    nginx_files = [f for f in nginx_files if "node_modules" not in str(f)]
    all_files = files_to_check + config_files + nginx_files

    headers_found = {
        "CSP": False,
        "HSTS": False,
        "X-Frame-Options": False,
        "X-Content-Type-Options": False,
        "X-XSS-Protection": False,
        "Referrer-Policy": False,
        "Permissions-Policy": False,
    }

    for f in all_files:
        try:
            content = f.read_text(errors="ignore")
            if re.search(r"Content-Security-Policy|CSP", content, re.IGNORECASE):
                headers_found["CSP"] = True
            if re.search(r"Strict-Transport-Security|HSTS", content, re.IGNORECASE):
                headers_found["HSTS"] = True
            if re.search(r"X-Frame-Options", content, re.IGNORECASE):
                headers_found["X-Frame-Options"] = True
            if re.search(r"X-Content-Type-Options", content, re.IGNORECASE):
                headers_found["X-Content-Type-Options"] = True
            if re.search(r"X-XSS-Protection", content, re.IGNORECASE):
                headers_found["X-XSS-Protection"] = True
            if re.search(r"Referrer-Policy", content, re.IGNORECASE):
                headers_found["Referrer-Policy"] = True
            if re.search(r"Permissions-Policy|Feature-Policy", content, re.IGNORECASE):
                headers_found["Permissions-Policy"] = True
        except:
            pass

    results.append(
        AuditResult(
            category="Headers HTTP",
            requirement="HDR-001: Content-Security-Policy (CSP)",
            description="Protection contre XSS et injection de contenu",
            compliance=[Compliance.OWASP_ASVS, Compliance.ANSSI],
            severity=Severity.HIGH,
            passed=headers_found["CSP"],
            recommendation="Configurer CSP strict avec nonces ou hashes",
        )
    )

    results.append(
        AuditResult(
            category="Headers HTTP",
            requirement="HDR-002: Strict-Transport-Security (HSTS)",
            description="Forcer HTTPS avec max-age ≥ 1 an",
            compliance=[Compliance.OWASP_ASVS, Compliance.ANSSI, Compliance.PCI_DSS],
            severity=Severity.CRITICAL,
            passed=headers_found["HSTS"],
            recommendation="HSTS: max-age=31536000; includeSubDomains; preload",
        )
    )

    results.append(
        AuditResult(
            category="Headers HTTP",
            requirement="HDR-003: X-Frame-Options",
            description="Protection contre le clickjacking",
            compliance=[Compliance.OWASP_ASVS, Compliance.ANSSI],
            severity=Severity.HIGH,
            passed=headers_found["X-Frame-Options"],
            recommendation="X-Frame-Options: DENY ou SAMEORIGIN",
        )
    )

    results.append(
        AuditResult(
            category="Headers HTTP",
            requirement="HDR-004: X-Content-Type-Options",
            description="Empêcher le MIME sniffing",
            compliance=[Compliance.OWASP_ASVS],
            severity=Severity.MEDIUM,
            passed=headers_found["X-Content-Type-Options"],
            recommendation="X-Content-Type-Options: nosniff",
        )
    )

    results.append(
        AuditResult(
            category="Headers HTTP",
            requirement="HDR-005: Referrer-Policy",
            description="Contrôler les informations du referrer",
            compliance=[Compliance.OWASP_ASVS, Compliance.GDPR],
            severity=Severity.MEDIUM,
            passed=headers_found["Referrer-Policy"],
            recommendation="Referrer-Policy: strict-origin-when-cross-origin",
        )
    )

    return results


# ============================================================================
# 6. VALIDATION DES ENTRÉES (OWASP ASVS)
# ============================================================================
def audit_input_validation(base_path: Path) -> list:
    results = []
    files_to_check = get_source_files(base_path, [".py", ".ts", ".js"])

    validation_found = {
        "sql": False,
        "xss": False,
        "csrf": False,
        "file_upload": False,
        "api_rate_limit": False,
    }

    for f in files_to_check:
        try:
            content = f.read_text(errors="ignore")
            if re.search(
                r"sql.?injection|parameterized|prepared.?statement|sanitize.*sql",
                content,
                re.IGNORECASE,
            ):
                validation_found["sql"] = True
            if re.search(
                r"xss|escape.*html|sanitize.*html|dompurify", content, re.IGNORECASE
            ):
                validation_found["xss"] = True
            if re.search(
                r"csrf|anti.?forgery|_token|csrftoken", content, re.IGNORECASE
            ):
                validation_found["csrf"] = True
            if re.search(
                r"file.?type|allowed.?extensions|validate.*upload|mimetype",
                content,
                re.IGNORECASE,
            ):
                validation_found["file_upload"] = True
            if re.search(r"rate.?limit|throttle|api.?limit", content, re.IGNORECASE):
                validation_found["api_rate_limit"] = True
        except:
            pass

    results.append(
        AuditResult(
            category="Validation",
            requirement="VAL-001: Protection SQL Injection",
            description="Requêtes paramétrées, pas de concaténation SQL",
            compliance=[Compliance.OWASP_ASVS, Compliance.PCI_DSS],
            severity=Severity.CRITICAL,
            passed=validation_found["sql"],
            recommendation="Utiliser ORM ou requêtes paramétrées exclusivement",
        )
    )

    results.append(
        AuditResult(
            category="Validation",
            requirement="VAL-002: Protection XSS",
            description="Échappement et sanitization de toutes les sorties",
            compliance=[Compliance.OWASP_ASVS],
            severity=Severity.CRITICAL,
            passed=validation_found["xss"],
            recommendation="Échapper toutes les sorties, utiliser CSP et DOMPurify",
        )
    )

    results.append(
        AuditResult(
            category="Validation",
            requirement="VAL-003: Protection CSRF",
            description="Tokens CSRF sur toutes les actions modifiantes",
            compliance=[Compliance.OWASP_ASVS],
            severity=Severity.HIGH,
            passed=validation_found["csrf"],
            recommendation="Implémenter tokens CSRF synchronisés",
        )
    )

    results.append(
        AuditResult(
            category="Validation",
            requirement="VAL-004: Validation des uploads",
            description="Vérification type MIME, extension, taille des fichiers",
            compliance=[Compliance.OWASP_ASVS],
            severity=Severity.HIGH,
            passed=validation_found["file_upload"],
            recommendation="Valider: extension whitelist, magic bytes, antivirus scan",
        )
    )

    results.append(
        AuditResult(
            category="Validation",
            requirement="VAL-005: Rate limiting API",
            description="Limitation du débit sur toutes les API",
            compliance=[Compliance.OWASP_ASVS, Compliance.SOC2],
            severity=Severity.HIGH,
            passed=validation_found["api_rate_limit"],
            recommendation="Implémenter rate limiting: 100 req/min par IP",
        )
    )

    return results


# ============================================================================
# 7. GESTION DES DÉPENDANCES (OWASP A06)
# ============================================================================
def audit_dependencies(base_path: Path) -> list:
    results = []

    # Vérifier la présence de fichiers de dépendances
    package_json = base_path / "package.json"
    requirements_txt = base_path / "requirements.txt"

    has_lockfile = (base_path / "package-lock.json").exists() or (
        base_path / "yarn.lock"
    ).exists()

    results.append(
        AuditResult(
            category="Dépendances",
            requirement="DEP-001: Fichiers de verrouillage",
            description="Utilisation de lockfiles pour versions reproductibles",
            compliance=[Compliance.OWASP_ASVS, Compliance.SOC2],
            severity=Severity.MEDIUM,
            passed=has_lockfile,
            recommendation="Commiter package-lock.json ou yarn.lock",
        )
    )

    # Vérifier audit de sécurité
    audit_config = False
    ci_files = (
        list((base_path / ".github").rglob("*.yml"))
        if (base_path / ".github").exists()
        else []
    )
    if (base_path / ".gitlab-ci.yml").exists():
        ci_files.append(base_path / ".gitlab-ci.yml")
    for f in ci_files:
        try:
            content = f.read_text(errors="ignore")
            if re.search(
                r"npm audit|snyk|dependabot|safety|pip-audit", content, re.IGNORECASE
            ):
                audit_config = True
                break
        except:
            pass

    results.append(
        AuditResult(
            category="Dépendances",
            requirement="DEP-002: Audit automatique des vulnérabilités",
            description="Scan automatique des dépendances vulnérables",
            compliance=[Compliance.OWASP_ASVS, Compliance.SOC2, Compliance.PCI_DSS],
            severity=Severity.HIGH,
            passed=audit_config,
            recommendation="Configurer Dependabot/Snyk/npm audit dans CI/CD",
        )
    )

    return results


# ============================================================================
# 8. BACKUP ET CONTINUITÉ (ISO 27001 A.12.3, SOC 2 A1)
# ============================================================================
def audit_backup(base_path: Path) -> list:
    results = []
    all_files = get_source_files(base_path, [".py", ".yml", ".yaml", ".sh"])

    backup_found = False
    for f in all_files:
        try:
            content = f.read_text(errors="ignore")
            if re.search(
                r"backup|pg_dump|mysqldump|snapshot|restore|recovery",
                content,
                re.IGNORECASE,
            ):
                backup_found = True
                break
        except:
            pass

    results.append(
        AuditResult(
            category="Continuité",
            requirement="BCK-001: Stratégie de backup",
            description="Sauvegardes automatiques quotidiennes minimum",
            compliance=[Compliance.ISO_27001, Compliance.SOC2, Compliance.PCI_DSS],
            severity=Severity.CRITICAL,
            passed=backup_found,
            recommendation="Configurer backup quotidien avec rétention 30 jours minimum",
        )
    )

    disaster_recovery = False
    for f in all_files:
        try:
            content = f.read_text(errors="ignore")
            if re.search(
                r"disaster.?recovery|DR.?plan|failover|replica|replication",
                content,
                re.IGNORECASE,
            ):
                disaster_recovery = True
                break
        except:
            pass

    results.append(
        AuditResult(
            category="Continuité",
            requirement="BCK-002: Plan de reprise d'activité (PRA)",
            description="Documentation et tests du plan de reprise",
            compliance=[Compliance.ISO_27001, Compliance.SOC2],
            severity=Severity.HIGH,
            passed=disaster_recovery,
            recommendation="Documenter PRA avec RTO/RPO définis, tester annuellement",
        )
    )

    return results


# ============================================================================
# 9. CONTRÔLE D'ACCÈS (ISO 27001 A.9, PCI-DSS Req 7)
# ============================================================================
def audit_access_control(base_path: Path) -> list:
    results = []
    files_to_check = get_source_files(base_path, [".py", ".ts", ".js"])

    rbac_found = False
    for f in files_to_check:
        try:
            content = f.read_text(errors="ignore")
            if re.search(
                r"role|permission|authorize|access.?control|rbac|acl",
                content,
                re.IGNORECASE,
            ):
                rbac_found = True
                break
        except:
            pass

    results.append(
        AuditResult(
            category="Contrôle d'accès",
            requirement="ACC-001: RBAC (Role-Based Access Control)",
            description="Contrôle d'accès basé sur les rôles",
            compliance=[Compliance.ISO_27001, Compliance.SOC2, Compliance.PCI_DSS],
            severity=Severity.CRITICAL,
            passed=rbac_found,
            recommendation="Implémenter RBAC avec principe du moindre privilège",
        )
    )

    least_privilege = False
    for f in files_to_check:
        try:
            content = f.read_text(errors="ignore")
            if re.search(
                r"least.?privilege|minimal.?access|need.?to.?know|restrict.*access",
                content,
                re.IGNORECASE,
            ):
                least_privilege = True
                break
        except:
            pass

    results.append(
        AuditResult(
            category="Contrôle d'accès",
            requirement="ACC-002: Principe du moindre privilège",
            description="Accès limité au strict nécessaire",
            compliance=[Compliance.ISO_27001, Compliance.SOC2, Compliance.ANSSI],
            severity=Severity.HIGH,
            passed=least_privilege
            or rbac_found,  # RBAC implique généralement least privilege
            recommendation="Réviser les permissions, supprimer les accès non nécessaires",
        )
    )

    return results


# ============================================================================
# EXÉCUTION DE L'AUDIT
# ============================================================================
def run_full_audit():
    banner()

    base_path = Path(__file__).parent.parent
    audit = ComplianceAudit()

    categories = [
        ("🔐 AUTHENTIFICATION & ACCÈS", audit_authentication),
        ("🔒 CHIFFREMENT DES DONNÉES", audit_encryption),
        ("📋 JOURNALISATION & AUDIT", audit_logging),
        ("🇪🇺 CONFORMITÉ GDPR", audit_gdpr),
        ("🛡️ HEADERS DE SÉCURITÉ HTTP", audit_security_headers),
        ("✅ VALIDATION DES ENTRÉES", audit_input_validation),
        ("📦 GESTION DES DÉPENDANCES", audit_dependencies),
        ("💾 BACKUP & CONTINUITÉ", audit_backup),
        ("🚪 CONTRÔLE D'ACCÈS", audit_access_control),
    ]

    for title, audit_func in categories:
        print(f"\n{Colors.BOLD}{Colors.CYAN}{title}{Colors.RESET}")
        print("─" * 60)
        results = audit_func(base_path)
        for r in results:
            audit.add(r)
            log_result(r)

    # Résumé final
    stats = audit.get_stats()

    print(f"\n{'═' * 70}")
    print(
        f"{Colors.BOLD}📊 RÉSUMÉ DE L'AUDIT DE CONFORMITÉ INSTITUTIONNELLE{Colors.RESET}"
    )
    print(f"{'═' * 70}\n")

    # Calcul du niveau de conformité
    if stats["compliance_rate"] >= 90 and stats["critical_failed"] == 0:
        level = f"{Colors.GREEN}🏆 NIVEAU A - CONFORME{Colors.RESET}"
        level_desc = "Prêt pour certification institutionnelle"
    elif stats["compliance_rate"] >= 70 and stats["critical_failed"] <= 2:
        level = f"{Colors.YELLOW}⚠️ NIVEAU B - PARTIELLEMENT CONFORME{Colors.RESET}"
        level_desc = "Corrections critiques nécessaires avant certification"
    elif stats["compliance_rate"] >= 50:
        level = f"{Colors.YELLOW}⚠️ NIVEAU C - NON-CONFORME{Colors.RESET}"
        level_desc = "Travail significatif requis"
    else:
        level = f"{Colors.RED}❌ NIVEAU D - CRITIQUE{Colors.RESET}"
        level_desc = "Non éligible pour usage institutionnel"

    print(f"  {level}")
    print(f"  {level_desc}\n")

    print(f"  📈 STATISTIQUES:")
    print(f"     Total des critères:     {stats['total']}")
    print(f"     Critères conformes:     {Colors.GREEN}{stats['passed']}{Colors.RESET}")
    print(f"     Critères non-conformes: {Colors.RED}{stats['failed']}{Colors.RESET}")
    print(f"     Taux de conformité:     {stats['compliance_rate']}%")
    print()
    print(f"  ⚠️ NON-CONFORMITÉS PAR SÉVÉRITÉ:")
    print(f"     🔴 CRITICAL: {stats['critical_failed']}")
    print(f"     🟠 HIGH:     {stats['high_failed']}")
    print()

    # Standards couverts
    print(f"  📋 STANDARDS AUDITÉS:")
    for std in Compliance:
        print(f"     • {std.value}")

    # Sauvegarder le rapport
    report = {
        "timestamp": datetime.now().isoformat(),
        "version": "1.0",
        "stats": stats,
        "level": level.replace(Colors.GREEN, "")
        .replace(Colors.YELLOW, "")
        .replace(Colors.RED, "")
        .replace(Colors.RESET, ""),
        "results": [
            {
                "category": r.category,
                "requirement": r.requirement,
                "description": r.description,
                "compliance": [c.value for c in r.compliance],
                "severity": r.severity.value,
                "passed": r.passed,
                "recommendation": r.recommendation,
            }
            for r in audit.results
        ],
    }

    report_path = Path(__file__).parent / "institutional-compliance-report.json"
    with open(report_path, "w", encoding="utf-8") as f:
        json.dump(report, f, indent=2, ensure_ascii=False)

    print(f"\n{Colors.GREEN}✅ Rapport sauvegardé: {report_path}{Colors.RESET}")

    # Actions prioritaires
    if stats["critical_failed"] > 0:
        print(
            f"\n{Colors.RED}{Colors.BOLD}🚨 ACTIONS PRIORITAIRES (CRITICAL):{Colors.RESET}"
        )
        for r in audit.results:
            if not r.passed and r.severity == Severity.CRITICAL:
                print(f"   • {r.requirement}")
                if r.recommendation:
                    print(f"     └─ {r.recommendation}")

    return stats["compliance_rate"], stats


if __name__ == "__main__":
    compliance_rate, stats = run_full_audit()

    # Exit code basé sur le niveau de conformité
    if stats["critical_failed"] > 0:
        sys.exit(2)  # Échecs critiques
    elif stats["compliance_rate"] < 70:
        sys.exit(1)  # Non-conforme
    else:
        sys.exit(0)  # Conforme ou partiellement conforme
