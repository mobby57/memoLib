"""
🛡️ Middleware de sécurité pour MemoLib
==============================================

Implémente:
- Protection CSRF
- Rate Limiting avancé
- Headers de sécurité
- Détection d'intrusion
- Blocage IP
- Logging de sécurité
"""

import hashlib
import json
import logging
import os
import secrets
import threading
import time
from collections import defaultdict
from datetime import datetime, timedelta
from functools import wraps
from typing import Dict, List, Optional, Set

from flask import g, jsonify, make_response, request, session

logger = logging.getLogger(__name__)


class SecurityConfig:
    """Configuration centralisée de sécurité"""

    # CSRF
    CSRF_TOKEN_NAME = "csrf_token"
    CSRF_HEADER_NAME = "X-CSRF-Token"
    CSRF_TOKEN_LENGTH = 64
    CSRF_EXEMPT_METHODS = {"GET", "HEAD", "OPTIONS"}

    # Rate Limiting
    RATE_LIMIT_ENABLED = True
    RATE_LIMIT_STORAGE: Dict[str, List[float]] = defaultdict(list)
    RATE_LIMIT_LOCK = threading.Lock()

    # Limites par défaut (requêtes par fenêtre de temps)
    RATE_LIMITS = {
        "default": (100, 60),  # 100 req/min
        "auth": (5, 60),  # 5 tentatives/min (login)
        "api": (60, 60),  # 60 req/min (API)
        "upload": (10, 300),  # 10 uploads/5min
        "search": (30, 60),  # 30 recherches/min
    }

    # IP Blacklist/Whitelist
    IP_BLACKLIST: Set[str] = set()
    IP_WHITELIST: Set[str] = {"127.0.0.1", "::1"}

    # Tentatives d'attaque
    ATTACK_THRESHOLD = 5  # Nombre de tentatives avant blocage
    ATTACK_BLOCK_DURATION = 3600  # Durée de blocage en secondes
    ATTACK_ATTEMPTS: Dict[str, List[float]] = defaultdict(list)

    # Headers de sécurité
    SECURITY_HEADERS = {
        "X-Content-Type-Options": "nosniff",
        "X-Frame-Options": "DENY",
        "X-XSS-Protection": "1; mode=block",
        "Referrer-Policy": "strict-origin-when-cross-origin",
        "Permissions-Policy": "geolocation=(), microphone=(), camera=()",
        "Content-Security-Policy": (
            "default-src 'self'; "
            "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net; "
            "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; "
            "font-src 'self' https://fonts.gstatic.com; "
            "img-src 'self' data: https:; "
            "connect-src 'self' https://api.memoLib.com;"
        ),
        "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
    }


class CSRFProtection:
    """Protection CSRF avec tokens"""

    @staticmethod
    def generate_token() -> str:
        """Génère un token CSRF sécurisé"""
        return secrets.token_hex(SecurityConfig.CSRF_TOKEN_LENGTH // 2)

    @staticmethod
    def set_token() -> str:
        """Définit et retourne un nouveau token CSRF dans la session"""
        token = CSRFProtection.generate_token()
        session[SecurityConfig.CSRF_TOKEN_NAME] = token
        return token

    @staticmethod
    def validate_token(token: str) -> bool:
        """Valide un token CSRF"""
        if not token:
            return False

        session_token = session.get(SecurityConfig.CSRF_TOKEN_NAME)
        if not session_token:
            return False

        # Comparaison à temps constant pour éviter les timing attacks
        return secrets.compare_digest(token, session_token)

    @staticmethod
    def get_token_from_request() -> Optional[str]:
        """Récupère le token CSRF de la requête"""
        # Essayer le header
        token = request.headers.get(SecurityConfig.CSRF_HEADER_NAME)
        if token:
            return token

        # Essayer le form data
        token = request.form.get(SecurityConfig.CSRF_TOKEN_NAME)
        if token:
            return token

        # Essayer le JSON body
        if request.is_json:
            data = request.get_json(silent=True)
            if data:
                token = data.get(SecurityConfig.CSRF_TOKEN_NAME)

        return token


class RateLimiter:
    """Rate limiting en mémoire avec fenêtre glissante"""

    @staticmethod
    def get_client_id() -> str:
        """Identifie le client (IP + User-Agent hash)"""
        ip = request.remote_addr or "0.0.0.0"
        user_agent = request.headers.get("User-Agent", "")

        # Hash pour anonymiser
        client_hash = hashlib.sha256(f"{ip}:{user_agent}".encode()).hexdigest()[:16]

        return f"{ip}:{client_hash}"

    @staticmethod
    def is_rate_limited(category: str = "default") -> tuple:
        """
        Vérifie si le client est rate limité

        Returns:
            (is_limited: bool, remaining: int, reset_time: float)
        """
        if not SecurityConfig.RATE_LIMIT_ENABLED:
            return False, 999, 0

        client_id = RateLimiter.get_client_id()
        key = f"{category}:{client_id}"

        limit, window = SecurityConfig.RATE_LIMITS.get(
            category, SecurityConfig.RATE_LIMITS["default"]
        )

        now = time.time()
        window_start = now - window

        with SecurityConfig.RATE_LIMIT_LOCK:
            # Nettoyer les anciennes requêtes
            SecurityConfig.RATE_LIMIT_STORAGE[key] = [
                t for t in SecurityConfig.RATE_LIMIT_STORAGE[key] if t > window_start
            ]

            current_count = len(SecurityConfig.RATE_LIMIT_STORAGE[key])

            if current_count >= limit:
                # Rate limité
                oldest = min(SecurityConfig.RATE_LIMIT_STORAGE[key])
                reset_time = oldest + window - now
                return True, 0, reset_time

            # Ajouter la requête actuelle
            SecurityConfig.RATE_LIMIT_STORAGE[key].append(now)
            remaining = limit - current_count - 1

            return False, remaining, window

    @staticmethod
    def reset_limit(category: str = "default", client_id: str = None):
        """Réinitialise les limites pour un client"""
        if client_id is None:
            client_id = RateLimiter.get_client_id()

        key = f"{category}:{client_id}"

        with SecurityConfig.RATE_LIMIT_LOCK:
            SecurityConfig.RATE_LIMIT_STORAGE[key] = []


class IntrusionDetector:
    """Détection et prévention d'intrusions"""

    ATTACK_PATTERNS = [
        # SQL Injection
        (r"(\bUNION\b|\bSELECT\b|\bDROP\b|\bDELETE\b)", "SQL_INJECTION"),
        # XSS
        (r"(<script|javascript:|onerror=|onload=)", "XSS"),
        # Path Traversal
        (r"(\.\./|\.\.\\|%2e%2e)", "PATH_TRAVERSAL"),
        # Command Injection
        (r"(;|\||`|\$\()", "COMMAND_INJECTION"),
    ]

    @staticmethod
    def check_request() -> Optional[str]:
        """
        Analyse la requête pour détecter des attaques

        Returns:
            Type d'attaque détectée ou None
        """
        import re

        # Collecter toutes les données de la requête
        data_to_check = []

        # URL et query string
        data_to_check.append(request.url)

        # Headers sensibles
        for header in ["User-Agent", "Referer", "Cookie"]:
            value = request.headers.get(header, "")
            data_to_check.append(value)

        # Body
        if request.data:
            try:
                data_to_check.append(request.data.decode("utf-8", errors="ignore"))
            except:
                pass

        # Vérifier les patterns
        full_data = " ".join(data_to_check)

        for pattern, attack_type in IntrusionDetector.ATTACK_PATTERNS:
            if re.search(pattern, full_data, re.IGNORECASE):
                return attack_type

        return None

    @staticmethod
    def record_attack(attack_type: str):
        """Enregistre une tentative d'attaque"""
        client_ip = request.remote_addr or "0.0.0.0"
        now = time.time()

        SecurityConfig.ATTACK_ATTEMPTS[client_ip].append(now)

        # Nettoyer les anciennes tentatives
        window_start = now - SecurityConfig.ATTACK_BLOCK_DURATION
        SecurityConfig.ATTACK_ATTEMPTS[client_ip] = [
            t for t in SecurityConfig.ATTACK_ATTEMPTS[client_ip] if t > window_start
        ]

        # Vérifier si on doit bloquer
        if (
            len(SecurityConfig.ATTACK_ATTEMPTS[client_ip])
            >= SecurityConfig.ATTACK_THRESHOLD
        ):
            IntrusionDetector.block_ip(client_ip)
            logger.critical(
                f"IP {client_ip} bloquée après {SecurityConfig.ATTACK_THRESHOLD} "
                f"tentatives d'attaque ({attack_type})"
            )

    @staticmethod
    def block_ip(ip: str):
        """Bloque une IP"""
        SecurityConfig.IP_BLACKLIST.add(ip)

        # Log pour audit
        logger.warning(f"IP bloquée: {ip}")

    @staticmethod
    def unblock_ip(ip: str):
        """Débloque une IP"""
        SecurityConfig.IP_BLACKLIST.discard(ip)
        SecurityConfig.ATTACK_ATTEMPTS[ip] = []

    @staticmethod
    def is_blocked(ip: str = None) -> bool:
        """Vérifie si une IP est bloquée"""
        if ip is None:
            ip = request.remote_addr or "0.0.0.0"

        # Whitelist prioritaire
        if ip in SecurityConfig.IP_WHITELIST:
            return False

        return ip in SecurityConfig.IP_BLACKLIST


class SecurityHeaders:
    """Gestionnaire des headers de sécurité HTTP"""

    @staticmethod
    def apply_to_response(response):
        """Applique les headers de sécurité à une réponse"""
        for header, value in SecurityConfig.SECURITY_HEADERS.items():
            response.headers[header] = value

        return response


# ========== DÉCORATEURS ==========


def csrf_protect(f):
    """Décorateur pour protéger contre CSRF"""

    @wraps(f)
    def decorated_function(*args, **kwargs):
        if request.method not in SecurityConfig.CSRF_EXEMPT_METHODS:
            token = CSRFProtection.get_token_from_request()

            if not CSRFProtection.validate_token(token):
                logger.warning(
                    f"CSRF token invalide - IP: {request.remote_addr}, "
                    f"URL: {request.url}"
                )
                return (
                    jsonify(
                        {
                            "success": False,
                            "error": "Token CSRF invalide ou manquant",
                            "code": "CSRF_ERROR",
                        }
                    ),
                    403,
                )

        return f(*args, **kwargs)

    return decorated_function


def rate_limit(category: str = "default"):
    """Décorateur pour appliquer le rate limiting"""

    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            is_limited, remaining, reset_time = RateLimiter.is_rate_limited(category)

            if is_limited:
                logger.warning(
                    f"Rate limit atteint - IP: {request.remote_addr}, "
                    f"Catégorie: {category}"
                )

                response = jsonify(
                    {
                        "success": False,
                        "error": "Trop de requêtes, réessayez plus tard",
                        "code": "RATE_LIMITED",
                        "retry_after": int(reset_time),
                    }
                )
                response.status_code = 429
                response.headers["Retry-After"] = str(int(reset_time))
                return response

            # Ajouter les headers de rate limit
            response = f(*args, **kwargs)

            if isinstance(response, tuple):
                response_obj = make_response(response[0])
                response_obj.status_code = response[1] if len(response) > 1 else 200
            else:
                response_obj = make_response(response)

            limit, window = SecurityConfig.RATE_LIMITS.get(
                category, SecurityConfig.RATE_LIMITS["default"]
            )
            response_obj.headers["X-RateLimit-Limit"] = str(limit)
            response_obj.headers["X-RateLimit-Remaining"] = str(remaining)
            response_obj.headers["X-RateLimit-Reset"] = str(int(time.time() + window))

            return response_obj

        return decorated_function

    return decorator


def intrusion_detection(f):
    """Décorateur pour détecter les intrusions"""

    @wraps(f)
    def decorated_function(*args, **kwargs):
        # Vérifier si l'IP est bloquée
        if IntrusionDetector.is_blocked():
            logger.warning(f"Accès refusé - IP bloquée: {request.remote_addr}")
            return (
                jsonify(
                    {"success": False, "error": "Accès refusé", "code": "IP_BLOCKED"}
                ),
                403,
            )

        # Détecter les attaques
        attack_type = IntrusionDetector.check_request()
        if attack_type:
            IntrusionDetector.record_attack(attack_type)
            logger.warning(
                f"Attaque détectée - Type: {attack_type}, " f"IP: {request.remote_addr}"
            )
            return (
                jsonify(
                    {
                        "success": False,
                        "error": "Requête invalide",
                        "code": "INVALID_REQUEST",
                    }
                ),
                400,
            )

        return f(*args, **kwargs)

    return decorated_function


def secure_endpoint(category: str = "default", csrf: bool = True):
    """
    Décorateur combiné pour sécuriser un endpoint

    Applique:
    - Détection d'intrusion
    - Rate limiting
    - Protection CSRF (optionnel)
    - Headers de sécurité
    """

    def decorator(f):
        @wraps(f)
        @intrusion_detection
        @rate_limit(category)
        def decorated_function(*args, **kwargs):
            # CSRF si activé
            if csrf and request.method not in SecurityConfig.CSRF_EXEMPT_METHODS:
                token = CSRFProtection.get_token_from_request()
                if not CSRFProtection.validate_token(token):
                    return (
                        jsonify(
                            {
                                "success": False,
                                "error": "Token CSRF invalide",
                                "code": "CSRF_ERROR",
                            }
                        ),
                        403,
                    )

            response = f(*args, **kwargs)

            # Appliquer les headers de sécurité
            if isinstance(response, tuple):
                response_obj = make_response(response[0])
                response_obj.status_code = response[1] if len(response) > 1 else 200
            else:
                response_obj = make_response(response)

            return SecurityHeaders.apply_to_response(response_obj)

        return decorated_function

    return decorator


# ========== MIDDLEWARE FLASK ==========


def init_security_middleware(app):
    """Initialise le middleware de sécurité pour Flask"""

    @app.before_request
    def security_checks():
        """Vérifications de sécurité avant chaque requête"""
        # Vérifier IP bloquée
        if IntrusionDetector.is_blocked():
            return (
                jsonify(
                    {"success": False, "error": "Accès refusé", "code": "IP_BLOCKED"}
                ),
                403,
            )

        # Stocker le timestamp de début
        g.request_start_time = time.time()

    @app.after_request
    def add_security_headers(response):
        """Ajoute les headers de sécurité à chaque réponse"""
        SecurityHeaders.apply_to_response(response)

        # Calculer le temps de réponse
        if hasattr(g, "request_start_time"):
            response.headers["X-Response-Time"] = (
                f"{(time.time() - g.request_start_time) * 1000:.2f}ms"
            )

        return response

    # Générer un token CSRF pour les nouvelles sessions
    @app.before_request
    def ensure_csrf_token():
        if SecurityConfig.CSRF_TOKEN_NAME not in session:
            CSRFProtection.set_token()

    logger.info("🛡️ Middleware de sécurité initialisé")
