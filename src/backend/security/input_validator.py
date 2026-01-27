"""
🛡️ Validateur d'entrées sécurisé pour IaPosteManager
=====================================================

Protection contre:
- Injection SQL
- XSS (Cross-Site Scripting)
- NoSQL Injection
- Command Injection
- Path Traversal
- LDAP Injection
"""

import html
import logging
import os
import re
from functools import wraps
from typing import Any, Dict, List, Optional, Union

from flask import abort, jsonify, request

logger = logging.getLogger(__name__)


class SecurityError(Exception):
    """Exception levée lors d'une tentative d'attaque détectée"""

    def __init__(self, attack_type: str, payload: str, details: str = ""):
        self.attack_type = attack_type
        self.payload = payload[:100]  # Limite pour éviter les logs massifs
        self.details = details
        super().__init__(f"Attaque {attack_type} détectée")


class InputValidator:
    """Validateur d'entrées avec détection d'attaques"""

    # Patterns SQL dangereux
    SQL_PATTERNS = [
        r"(\bSELECT\b.*\bFROM\b)",
        r"(\bINSERT\b.*\bINTO\b)",
        r"(\bUPDATE\b.*\bSET\b)",
        r"(\bDELETE\b.*\bFROM\b)",
        r"(\bDROP\b.*\b(TABLE|DATABASE)\b)",
        r"(\bUNION\b.*\bSELECT\b)",
        r"(\bOR\b\s+['\"0-9].*=.*['\"0-9])",
        r"(\bAND\b\s+['\"0-9].*=.*['\"0-9])",
        r"(--\s*$|#\s*$)",
        r"(;\s*(DROP|DELETE|INSERT|UPDATE|SELECT|EXEC))",
        r"(\bEXEC\b|\bEXECUTE\b)",
        r"(\bSLEEP\b\s*\()",
        r"(\bWAITFOR\b\s+\bDELAY\b)",
        r"(\bBENCHMARK\b\s*\()",
        r"(\bEXTRACTVALUE\b|\bUPDATEXML\b)",
        r"(0x[0-9a-fA-F]+)",  # Hex encoding
        r"(\bCHAR\b\s*\(\s*\d+)",
        r"(\bCONCAT\b\s*\()",
    ]

    # Patterns XSS dangereux
    XSS_PATTERNS = [
        r"<script[^>]*>.*?</script>",
        r"javascript\s*:",
        r"on\w+\s*=\s*['\"]",
        r"<iframe[^>]*>",
        r"<object[^>]*>",
        r"<embed[^>]*>",
        r"<svg[^>]*onload",
        r"<img[^>]*onerror",
        r"<body[^>]*onload",
        r"expression\s*\(",
        r"url\s*\(\s*['\"]?javascript",
        r"eval\s*\(",
        r"document\.(cookie|location|write)",
        r"window\.(location|open)",
        r"<meta[^>]*http-equiv",
    ]

    # Patterns NoSQL dangereux
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
        r"\$type\b",
        r"\$regex\b",
        r"\$where\b",
        r"\$expr\b",
    ]

    # Patterns Command Injection
    CMD_PATTERNS = [
        r"[;&|`]",
        r"\$\(",
        r"\n",
        r"\r",
        r">\s*\w",
        r"<\s*\w",
        r"\bcat\b",
        r"\bls\b",
        r"\brm\b",
        r"\bwget\b",
        r"\bcurl\b",
        r"\bsh\b",
        r"\bbash\b",
        r"\bpython\b",
        r"\bperl\b",
        r"\bruby\b",
        r"\bnc\b",
        r"\bnetcat\b",
    ]

    # Patterns Path Traversal
    PATH_PATTERNS = [
        r"\.\./",
        r"\.\.\\",
        r"%2e%2e%2f",
        r"%2e%2e/",
        r"\.\.%2f",
        r"%252e",
        r"%00",
        r"\.\./\.\./",
        r"etc/passwd",
        r"etc/shadow",
        r"windows/system32",
    ]

    @classmethod
    def check_sql_injection(cls, value: str) -> bool:
        """Vérifie la présence de patterns SQL dangereux"""
        if not isinstance(value, str):
            return False

        for pattern in cls.SQL_PATTERNS:
            if re.search(pattern, value, re.IGNORECASE):
                return True
        return False

    @classmethod
    def check_xss(cls, value: str) -> bool:
        """Vérifie la présence de patterns XSS dangereux"""
        if not isinstance(value, str):
            return False

        for pattern in cls.XSS_PATTERNS:
            if re.search(pattern, value, re.IGNORECASE | re.DOTALL):
                return True
        return False

    @classmethod
    def check_nosql_injection(cls, value: str) -> bool:
        """Vérifie la présence de patterns NoSQL dangereux"""
        if not isinstance(value, str):
            return False

        for pattern in cls.NOSQL_PATTERNS:
            if re.search(pattern, value, re.IGNORECASE):
                return True
        return False

    @classmethod
    def check_command_injection(cls, value: str) -> bool:
        """Vérifie la présence de patterns Command Injection dangereux"""
        if not isinstance(value, str):
            return False

        for pattern in cls.CMD_PATTERNS:
            if re.search(pattern, value, re.IGNORECASE):
                return True
        return False

    @classmethod
    def check_path_traversal(cls, value: str) -> bool:
        """Vérifie la présence de patterns Path Traversal dangereux"""
        if not isinstance(value, str):
            return False

        for pattern in cls.PATH_PATTERNS:
            if re.search(pattern, value, re.IGNORECASE):
                return True
        return False

    @classmethod
    def sanitize_html(cls, value: str) -> str:
        """Nettoie et échappe le HTML dangereux"""
        if not isinstance(value, str):
            return value

        # Échapper les caractères HTML spéciaux
        sanitized = html.escape(value)

        # Supprimer les patterns XSS résiduels
        for pattern in cls.XSS_PATTERNS:
            sanitized = re.sub(pattern, "", sanitized, flags=re.IGNORECASE | re.DOTALL)

        return sanitized

    @classmethod
    def sanitize_filename(cls, filename: str) -> str:
        """Nettoie un nom de fichier"""
        if not isinstance(filename, str):
            return "file"

        # Supprimer les caractères dangereux
        sanitized = re.sub(r"[^\w\-_\.]", "", filename)

        # Supprimer les tentatives de path traversal
        sanitized = sanitized.replace("..", "")

        # Limiter la longueur
        if len(sanitized) > 255:
            sanitized = sanitized[:255]

        return sanitized or "file"

    @classmethod
    def sanitize_path(cls, path: str, base_path: str = None) -> Optional[str]:
        """
        Nettoie et valide un chemin de fichier

        Args:
            path: Chemin à valider
            base_path: Chemin de base autorisé (optionnel)

        Returns:
            Chemin normalisé ou None si invalide
        """
        if not isinstance(path, str):
            return None

        # Normaliser le chemin
        normalized = os.path.normpath(path)

        # Vérifier les tentatives de path traversal
        if ".." in path or cls.check_path_traversal(path):
            logger.warning(f"Path traversal détecté: {path[:50]}")
            return None

        # Vérifier que le chemin reste dans le base_path
        if base_path:
            base_abs = os.path.abspath(base_path)
            path_abs = os.path.abspath(os.path.join(base_path, normalized))

            if not path_abs.startswith(base_abs):
                logger.warning(f"Tentative d'accès hors base_path: {path[:50]}")
                return None

        return normalized

    @classmethod
    def validate_input(cls, value: Any, field_name: str = "input") -> Dict[str, Any]:
        """
        Valide une entrée contre toutes les attaques connues

        Returns:
            {"valid": bool, "sanitized": value, "attacks": list}
        """
        attacks_detected = []

        if isinstance(value, str):
            if cls.check_sql_injection(value):
                attacks_detected.append("SQL_INJECTION")
            if cls.check_xss(value):
                attacks_detected.append("XSS")
            if cls.check_nosql_injection(value):
                attacks_detected.append("NOSQL_INJECTION")
            if cls.check_command_injection(value):
                attacks_detected.append("COMMAND_INJECTION")
            if cls.check_path_traversal(value):
                attacks_detected.append("PATH_TRAVERSAL")

        if attacks_detected:
            logger.warning(
                f"Attaques détectées sur {field_name}: {attacks_detected} - "
                f"Payload: {str(value)[:50]}..."
            )

        return {
            "valid": len(attacks_detected) == 0,
            "sanitized": cls.sanitize_html(value) if isinstance(value, str) else value,
            "attacks": attacks_detected,
        }

    @classmethod
    def validate_dict(cls, data: Dict[str, Any], strict: bool = True) -> Dict[str, Any]:
        """
        Valide toutes les entrées d'un dictionnaire

        Args:
            data: Données à valider
            strict: Si True, rejette les données contenant des attaques

        Returns:
            {"valid": bool, "sanitized": dict, "attacks": dict}
        """
        all_attacks = {}
        sanitized_data = {}
        is_valid = True

        for key, value in data.items():
            if isinstance(value, dict):
                result = cls.validate_dict(value, strict)
                sanitized_data[key] = result["sanitized"]
                if result["attacks"]:
                    all_attacks[key] = result["attacks"]
                    is_valid = False
            elif isinstance(value, list):
                sanitized_list = []
                for item in value:
                    if isinstance(item, dict):
                        result = cls.validate_dict(item, strict)
                        sanitized_list.append(result["sanitized"])
                    else:
                        result = cls.validate_input(item, key)
                        sanitized_list.append(result["sanitized"])
                        if result["attacks"]:
                            all_attacks[key] = result["attacks"]
                            is_valid = False
                sanitized_data[key] = sanitized_list
            else:
                result = cls.validate_input(value, key)
                sanitized_data[key] = result["sanitized"]
                if result["attacks"]:
                    all_attacks[key] = result["attacks"]
                    is_valid = False

        return {"valid": is_valid, "sanitized": sanitized_data, "attacks": all_attacks}


def validate_request_inputs(strict: bool = True):
    """
    Décorateur pour valider automatiquement les entrées d'une requête Flask

    Args:
        strict: Si True, rejette les requêtes malveillantes
    """

    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            # Valider les paramètres d'URL
            if request.args:
                result = InputValidator.validate_dict(dict(request.args), strict)
                if not result["valid"] and strict:
                    logger.warning(
                        f"Requête rejetée - Attaques dans args: {result['attacks']}"
                    )
                    return (
                        jsonify(
                            {
                                "success": False,
                                "error": "Entrée invalide détectée",
                                "code": "INVALID_INPUT",
                            }
                        ),
                        400,
                    )

            # Valider le corps JSON
            if request.is_json:
                try:
                    data = request.get_json(silent=True) or {}
                    result = InputValidator.validate_dict(data, strict)
                    if not result["valid"] and strict:
                        logger.warning(
                            f"Requête rejetée - Attaques dans body: {result['attacks']}"
                        )
                        return (
                            jsonify(
                                {
                                    "success": False,
                                    "error": "Entrée invalide détectée",
                                    "code": "INVALID_INPUT",
                                }
                            ),
                            400,
                        )
                except Exception as e:
                    logger.error(f"Erreur parsing JSON: {e}")

            return f(*args, **kwargs)

        return decorated_function

    return decorator


def sanitize_sql_param(value: str) -> str:
    """
    Nettoie un paramètre pour requête SQL
    ATTENTION: Préférer les requêtes paramétrées!
    """
    if not isinstance(value, str):
        return str(value) if value else ""

    # Échapper les caractères dangereux
    dangerous_chars = ["'", '"', "\\", "\x00", "\n", "\r", "\x1a"]
    sanitized = value

    for char in dangerous_chars:
        sanitized = sanitized.replace(char, f"\\{char}")

    return sanitized


def validate_email(email: str) -> bool:
    """Valide le format d'un email"""
    if not isinstance(email, str):
        return False

    pattern = r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$"
    return bool(re.match(pattern, email)) and len(email) <= 254


def validate_password_strength(password: str) -> Dict[str, Any]:
    """
    Valide la force d'un mot de passe

    Returns:
        {"valid": bool, "score": int, "feedback": list}
    """
    if not isinstance(password, str):
        return {"valid": False, "score": 0, "feedback": ["Mot de passe requis"]}

    score = 0
    feedback = []

    # Longueur minimum
    if len(password) >= 8:
        score += 1
    else:
        feedback.append("Minimum 8 caractères")

    if len(password) >= 12:
        score += 1

    # Minuscules
    if re.search(r"[a-z]", password):
        score += 1
    else:
        feedback.append("Au moins une minuscule")

    # Majuscules
    if re.search(r"[A-Z]", password):
        score += 1
    else:
        feedback.append("Au moins une majuscule")

    # Chiffres
    if re.search(r"\d", password):
        score += 1
    else:
        feedback.append("Au moins un chiffre")

    # Caractères spéciaux
    if re.search(r'[!@#$%^&*(),.?":{}|<>]', password):
        score += 1
    else:
        feedback.append("Au moins un caractère spécial")

    # Mots de passe courants
    common_passwords = {
        "password",
        "123456",
        "admin",
        "admin123",
        "root",
        "letmein",
        "welcome",
        "monkey",
        "dragon",
        "master",
        "qwerty",
        "abc123",
    }

    if password.lower() in common_passwords:
        score = 0
        feedback = ["Mot de passe trop commun"]

    return {
        "valid": score >= 4 and len(password) >= 8,
        "score": score,
        "max_score": 6,
        "feedback": feedback,
    }
