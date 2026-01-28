"""
🔒 Sanitiseur de Logs - MemoLib
======================================

Module pour masquer automatiquement les données sensibles dans les logs.

Conforme aux exigences:
- ISO 27001 A.12.4.1 (Event logging)
- GDPR Art. 32 (Security of processing)
- SOC 2 CC7.2 (Security event monitoring)
- PCI-DSS Req 10.3 (Audit trail entries)
"""

import logging
import re
from functools import wraps
from typing import Any, Dict, List, Optional

# Patterns de données sensibles à masquer
SENSITIVE_PATTERNS = [
    # Mots de passe
    (
        r'(password|passwd|pwd|pass|secret|mot_de_passe)\s*[=:]\s*["\']?([^"\'\s,}]+)',
        r"\1=***MASKED***",
    ),
    (
        r'(password|passwd|pwd|pass|secret)["\']?\s*:\s*["\']([^"\']+)["\']',
        r'\1: "***MASKED***"',
    ),
    # Tokens et clés API
    (
        r'(token|api_key|apikey|api-key|access_token|auth_token|bearer)\s*[=:]\s*["\']?([a-zA-Z0-9_\-\.]{10,})',
        r"\1=***TOKEN***",
    ),
    (
        r"(Authorization|X-API-Key|X-Auth-Token):\s*(Bearer\s+)?([a-zA-Z0-9_\-\.]+)",
        r"\1: ***AUTH***",
    ),
    # Clés secrètes
    (
        r'(secret_key|private_key|encryption_key|jwt_secret|nextauth_secret)\s*[=:]\s*["\']?([^"\'\s,}]+)',
        r"\1=***SECRET***",
    ),
    # Numéros de cartes bancaires (PCI-DSS)
    (r"\b(\d{4})[- ]?(\d{4})[- ]?(\d{4})[- ]?(\d{4})\b", r"\1-****-****-\4"),
    # Numéros de sécurité sociale français
    (r"\b([12])(\d{2})(\d{2})(\d{2})(\d{3})(\d{3})(\d{2})\b", r"\1**-**-**-***-***-**"),
    # Emails (GDPR - minimisation)
    (r"([a-zA-Z0-9._%+-]+)@([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})", r"***@\2"),
    # Numéros de téléphone français
    (r"\b(0[1-9])(\d{2})(\d{2})(\d{2})(\d{2})\b", r"\1.**.**.XX.XX"),
    # IP addresses (pour la vie privée)
    (r"(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})", r"\1.\2.XXX.XXX"),
    # Cookies de session
    (
        r'(session_id|sessionid|session|sid)\s*[=:]\s*["\']?([a-zA-Z0-9_\-]{16,})',
        r"\1=***SESSION***",
    ),
    # Database credentials
    (r"(mysql|postgres|mongodb|redis)://([^:]+):([^@]+)@", r"\1://***:***@"),
    # AWS/Cloud credentials
    (r"(AKIA|ASIA)[A-Z0-9]{16}", r"***AWS_KEY***"),
    (
        r'(aws_secret_access_key|AWS_SECRET)\s*[=:]\s*["\']?([a-zA-Z0-9/+=]{40})',
        r"\1=***AWS_SECRET***",
    ),
]


class SensitiveDataFilter(logging.Filter):
    """Filtre de logging qui masque automatiquement les données sensibles"""

    def __init__(self, name: str = "", patterns: Optional[List] = None):
        super().__init__(name)
        self.patterns = patterns or SENSITIVE_PATTERNS
        self._compiled_patterns = [
            (re.compile(pattern, re.IGNORECASE), replacement)
            for pattern, replacement in self.patterns
        ]

    def sanitize(self, message: str) -> str:
        """Masque les données sensibles dans un message"""
        if not isinstance(message, str):
            message = str(message)

        for pattern, replacement in self._compiled_patterns:
            message = pattern.sub(replacement, message)

        return message

    def filter(self, record: logging.LogRecord) -> bool:
        """Filtre et nettoie le log record"""
        # Sanitize le message principal
        if hasattr(record, "msg") and record.msg:
            record.msg = self.sanitize(str(record.msg))

        # Sanitize les arguments
        if hasattr(record, "args") and record.args:
            if isinstance(record.args, dict):
                record.args = {
                    k: self.sanitize(str(v)) if isinstance(v, str) else v
                    for k, v in record.args.items()
                }
            elif isinstance(record.args, tuple):
                record.args = tuple(
                    self.sanitize(str(arg)) if isinstance(arg, str) else arg
                    for arg in record.args
                )

        return True


def sanitize_dict(
    data: Dict[str, Any], keys_to_mask: Optional[List[str]] = None
) -> Dict[str, Any]:
    """
    Sanitize un dictionnaire en masquant les valeurs des clés sensibles

    Args:
        data: Dictionnaire à nettoyer
        keys_to_mask: Liste de clés dont les valeurs doivent être masquées

    Returns:
        Dictionnaire nettoyé
    """
    if keys_to_mask is None:
        keys_to_mask = [
            "password",
            "passwd",
            "pwd",
            "pass",
            "secret",
            "token",
            "api_key",
            "apikey",
            "access_token",
            "auth_token",
            "private_key",
            "secret_key",
            "encryption_key",
            "credit_card",
            "card_number",
            "cvv",
            "ssn",
            "authorization",
            "bearer",
            "cookie",
            "session",
        ]

    sanitized = {}
    filter_instance = SensitiveDataFilter()

    for key, value in data.items():
        key_lower = key.lower()

        # Masquer complètement les valeurs des clés sensibles
        if any(sensitive in key_lower for sensitive in keys_to_mask):
            sanitized[key] = "***MASKED***"
        elif isinstance(value, dict):
            sanitized[key] = sanitize_dict(value, keys_to_mask)
        elif isinstance(value, list):
            sanitized[key] = [
                (
                    sanitize_dict(item, keys_to_mask)
                    if isinstance(item, dict)
                    else (
                        filter_instance.sanitize(str(item))
                        if isinstance(item, str)
                        else item
                    )
                )
                for item in value
            ]
        elif isinstance(value, str):
            sanitized[key] = filter_instance.sanitize(value)
        else:
            sanitized[key] = value

    return sanitized


def setup_secure_logging(logger: logging.Logger) -> logging.Logger:
    """
    Configure un logger avec le filtre de données sensibles

    Args:
        logger: Logger à configurer

    Returns:
        Logger configuré
    """
    sensitive_filter = SensitiveDataFilter()

    # Ajouter le filtre à tous les handlers
    for handler in logger.handlers:
        handler.addFilter(sensitive_filter)

    # Ajouter aussi au logger lui-même
    logger.addFilter(sensitive_filter)

    return logger


def secure_log(func):
    """
    Décorateur pour sécuriser automatiquement les logs dans une fonction

    Usage:
        @secure_log
        def my_function():
            logging.info("Password: secret123")  # Sera masqué
    """

    @wraps(func)
    def wrapper(*args, **kwargs):
        # Configurer le logger racine avec le filtre
        root_logger = logging.getLogger()
        filter_instance = SensitiveDataFilter()

        # Ajouter temporairement le filtre
        for handler in root_logger.handlers:
            handler.addFilter(filter_instance)

        try:
            return func(*args, **kwargs)
        finally:
            # Retirer le filtre après exécution
            for handler in root_logger.handlers:
                handler.removeFilter(filter_instance)

    return wrapper


class SecureLogger:
    """
    Logger sécurisé avec masquage automatique des données sensibles

    Usage:
        logger = SecureLogger(__name__)
        logger.info("User login", {"password": "secret"})  # password masqué
    """

    def __init__(self, name: str):
        self._logger = logging.getLogger(name)
        self._filter = SensitiveDataFilter()
        setup_secure_logging(self._logger)

    def _sanitize_extra(self, extra: Optional[Dict] = None) -> Dict:
        """Nettoie les données extra"""
        if extra is None:
            return {}
        return sanitize_dict(extra)

    def debug(self, msg: str, extra: Optional[Dict] = None):
        self._logger.debug(
            self._filter.sanitize(msg), extra=self._sanitize_extra(extra)
        )

    def info(self, msg: str, extra: Optional[Dict] = None):
        self._logger.info(self._filter.sanitize(msg), extra=self._sanitize_extra(extra))

    def warning(self, msg: str, extra: Optional[Dict] = None):
        self._logger.warning(
            self._filter.sanitize(msg), extra=self._sanitize_extra(extra)
        )

    def error(self, msg: str, extra: Optional[Dict] = None):
        self._logger.error(
            self._filter.sanitize(msg), extra=self._sanitize_extra(extra)
        )

    def critical(self, msg: str, extra: Optional[Dict] = None):
        self._logger.critical(
            self._filter.sanitize(msg), extra=self._sanitize_extra(extra)
        )


# Exemple d'utilisation
if __name__ == "__main__":
    # Configuration basique pour test
    logging.basicConfig(level=logging.DEBUG)

    logger = SecureLogger(__name__)

    # Ces logs auront les données sensibles masquées
    logger.info(
        "Connexion utilisateur", {"password": "secret123", "email": "user@example.com"}
    )
    logger.info("Token généré: abc123def456ghi789")
    logger.info("Carte: 4111-1111-1111-1111")
    logger.warning("Échec connexion avec password=wrongpass")
