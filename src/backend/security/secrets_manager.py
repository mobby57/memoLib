"""
🔐 Gestionnaire de Secrets Sécurisé - IaPosteManager
====================================================

Module pour gérer les secrets de manière sécurisée sans hardcoding.

Conforme aux exigences:
- ISO 27001 A.10.1.1 (Cryptographic controls)
- PCI-DSS Req 3.5 (Protect stored cardholder data)
- SOC 2 CC6.1 (Logical access security)
- ANSSI (Bonnes pratiques de gestion des secrets)

⚠️ Ce module remplace l'utilisation de secrets hardcodés
"""

import base64
import hashlib
import hmac
import json
import logging
import os
import secrets
from abc import ABC, abstractmethod
from dataclasses import dataclass
from functools import lru_cache
from pathlib import Path
from typing import Any, Dict, Optional

logger = logging.getLogger(__name__)


class SecretNotFoundError(Exception):
    """Erreur quand un secret n'est pas trouvé"""

    pass


class SecretConfigError(Exception):
    """Erreur de configuration des secrets"""

    pass


@dataclass
class SecretMetadata:
    """Métadonnées d'un secret"""

    name: str
    source: str
    masked_value: str
    created_at: Optional[str] = None
    expires_at: Optional[str] = None


class SecretProvider(ABC):
    """Interface abstraite pour les fournisseurs de secrets"""

    @abstractmethod
    def get_secret(self, name: str) -> Optional[str]:
        """Récupère un secret par son nom"""
        pass

    @abstractmethod
    def has_secret(self, name: str) -> bool:
        """Vérifie si un secret existe"""
        pass


class EnvironmentSecretProvider(SecretProvider):
    """Fournisseur de secrets via variables d'environnement"""

    def __init__(self, prefix: str = ""):
        self.prefix = prefix

    def get_secret(self, name: str) -> Optional[str]:
        full_name = f"{self.prefix}{name}" if self.prefix else name
        return os.environ.get(full_name)

    def has_secret(self, name: str) -> bool:
        full_name = f"{self.prefix}{name}" if self.prefix else name
        return full_name in os.environ


class DotenvSecretProvider(SecretProvider):
    """Fournisseur de secrets via fichier .env"""

    def __init__(self, env_file: str = ".env"):
        self.env_file = Path(env_file)
        self._secrets: Dict[str, str] = {}
        self._load_env_file()

    def _load_env_file(self):
        """Charge les secrets depuis le fichier .env"""
        if not self.env_file.exists():
            logger.warning(f"Fichier .env non trouvé: {self.env_file}")
            return

        with open(self.env_file, "r") as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith("#") and "=" in line:
                    key, _, value = line.partition("=")
                    # Supprimer les guillemets
                    value = value.strip().strip('"').strip("'")
                    self._secrets[key.strip()] = value

    def get_secret(self, name: str) -> Optional[str]:
        return self._secrets.get(name)

    def has_secret(self, name: str) -> bool:
        return name in self._secrets


class AzureKeyVaultProvider(SecretProvider):
    """Fournisseur de secrets via Azure Key Vault"""

    def __init__(self, vault_url: Optional[str] = None):
        self.vault_url = vault_url or os.environ.get("AZURE_KEYVAULT_URL")
        self._client = None
        self._initialize_client()

    def _initialize_client(self):
        """Initialise le client Azure Key Vault"""
        if not self.vault_url:
            logger.debug("Azure Key Vault non configuré")
            return

        try:
            from azure.identity import DefaultAzureCredential
            from azure.keyvault.secrets import SecretClient

            credential = DefaultAzureCredential()
            self._client = SecretClient(vault_url=self.vault_url, credential=credential)
            logger.info("Azure Key Vault initialisé")
        except ImportError:
            logger.warning("azure-identity ou azure-keyvault-secrets non installé")
        except Exception as e:
            logger.error(f"Erreur initialisation Azure Key Vault: {e}")

    def get_secret(self, name: str) -> Optional[str]:
        if not self._client:
            return None
        try:
            secret = self._client.get_secret(name)
            return secret.value
        except Exception as e:
            logger.debug(f"Secret {name} non trouvé dans Key Vault: {e}")
            return None

    def has_secret(self, name: str) -> bool:
        return self.get_secret(name) is not None


class SecretManager:
    """
    Gestionnaire centralisé de secrets

    Ordre de priorité:
    1. Variables d'environnement
    2. Fichier .env
    3. Azure Key Vault (si configuré)

    Usage:
        secrets = SecretManager()
        db_password = secrets.get("DATABASE_PASSWORD")
    """

    _instance: Optional["SecretManager"] = None

    def __new__(cls, *args, **kwargs):
        """Singleton pattern"""
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance

    def __init__(self, providers: Optional[list] = None):
        if hasattr(self, "_initialized"):
            return

        self._providers: list[SecretProvider] = providers or [
            EnvironmentSecretProvider(),
            DotenvSecretProvider(),
            AzureKeyVaultProvider(),
        ]
        self._cache: Dict[str, str] = {}
        self._initialized = True

    def get(
        self, name: str, default: Optional[str] = None, required: bool = False
    ) -> Optional[str]:
        """
        Récupère un secret

        Args:
            name: Nom du secret
            default: Valeur par défaut si non trouvé
            required: Si True, lève une exception si non trouvé

        Returns:
            Valeur du secret ou default

        Raises:
            SecretNotFoundError: Si required=True et secret non trouvé
        """
        # Vérifier le cache
        if name in self._cache:
            return self._cache[name]

        # Chercher dans les providers
        for provider in self._providers:
            value = provider.get_secret(name)
            if value is not None:
                self._cache[name] = value
                logger.debug(
                    f"Secret '{name}' trouvé via {provider.__class__.__name__}"
                )
                return value

        if required:
            raise SecretNotFoundError(
                f"Secret obligatoire '{name}' non trouvé. "
                f"Définissez-le via variable d'environnement ou fichier .env"
            )

        return default

    def has(self, name: str) -> bool:
        """Vérifie si un secret existe"""
        return any(provider.has_secret(name) for provider in self._providers)

    def require(self, name: str) -> str:
        """
        Récupère un secret obligatoire

        Raises:
            SecretNotFoundError si non trouvé
        """
        value = self.get(name, required=True)
        if value is None:
            raise SecretNotFoundError(f"Secret obligatoire non trouvé: {name}")
        return value

    def get_metadata(self, name: str) -> Optional[SecretMetadata]:
        """Récupère les métadonnées d'un secret (valeur masquée)"""
        for provider in self._providers:
            if provider.has_secret(name):
                value = provider.get_secret(name)
                masked = (
                    f"{value[:3]}***{value[-3:]}" if value and len(value) > 6 else "***"
                )
                return SecretMetadata(
                    name=name, source=provider.__class__.__name__, masked_value=masked
                )
        return None

    def validate_required_secrets(self, required_secrets: list[str]) -> Dict[str, bool]:
        """
        Valide que tous les secrets requis sont présents

        Args:
            required_secrets: Liste des noms de secrets requis

        Returns:
            Dict avec le statut de chaque secret
        """
        results = {}
        missing = []

        for secret_name in required_secrets:
            exists = self.has(secret_name)
            results[secret_name] = exists
            if not exists:
                missing.append(secret_name)

        if missing:
            logger.warning(f"Secrets manquants: {missing}")

        return results

    @staticmethod
    def generate_secret(length: int = 32, include_special: bool = True) -> str:
        """
        Génère un nouveau secret sécurisé

        Args:
            length: Longueur du secret
            include_special: Inclure des caractères spéciaux

        Returns:
            Secret généré
        """
        alphabet = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
        if include_special:
            alphabet += "!@#$%^&*()_+-="

        return "".join(secrets.choice(alphabet) for _ in range(length))

    @staticmethod
    def generate_token(byte_length: int = 32) -> str:
        """Génère un token URL-safe"""
        return secrets.token_urlsafe(byte_length)

    @staticmethod
    def hash_secret(secret: str, salt: Optional[str] = None) -> str:
        """
        Hash un secret de manière sécurisée

        Args:
            secret: Secret à hasher
            salt: Salt optionnel (généré si non fourni)

        Returns:
            Hash au format "salt:hash"
        """
        if salt is None:
            salt = secrets.token_hex(16)

        hashed = hashlib.pbkdf2_hmac("sha256", secret.encode(), salt.encode(), 100000)
        return f"{salt}:{base64.b64encode(hashed).decode()}"

    @staticmethod
    def verify_secret(secret: str, hashed: str) -> bool:
        """
        Vérifie un secret contre son hash

        Args:
            secret: Secret en clair
            hashed: Hash au format "salt:hash"

        Returns:
            True si le secret correspond
        """
        try:
            salt, stored_hash = hashed.split(":")
            new_hash = SecretManager.hash_secret(secret, salt)
            return hmac.compare_digest(hashed, new_hash)
        except ValueError:
            return False


# Instance globale pour accès facile
_secret_manager: Optional[SecretManager] = None


def get_secret_manager() -> SecretManager:
    """Récupère l'instance globale du gestionnaire de secrets"""
    global _secret_manager
    if _secret_manager is None:
        _secret_manager = SecretManager()
    return _secret_manager


def get_secret(
    name: str, default: Optional[str] = None, required: bool = False
) -> Optional[str]:
    """Raccourci pour récupérer un secret"""
    return get_secret_manager().get(name, default, required)


def require_secret(name: str) -> str:
    """Raccourci pour récupérer un secret obligatoire"""
    return get_secret_manager().require(name)


# Configuration des secrets requis pour l'application
REQUIRED_SECRETS = [
    "NEXTAUTH_SECRET",
    "DATABASE_URL",
]

OPTIONAL_SECRETS = [
    "GITHUB_CLIENT_ID",
    "GITHUB_CLIENT_SECRET",
    "GMAIL_CLIENT_ID",
    "GMAIL_CLIENT_SECRET",
    "AZURE_KEYVAULT_URL",
    "OPENAI_API_KEY",
    "STRIPE_SECRET_KEY",
]


def validate_app_secrets() -> bool:
    """
    Valide les secrets de l'application au démarrage

    Returns:
        True si tous les secrets requis sont présents
    """
    manager = get_secret_manager()
    results = manager.validate_required_secrets(REQUIRED_SECRETS)

    all_present = all(results.values())

    if not all_present:
        missing = [k for k, v in results.items() if not v]
        logger.error(f"⚠️ Secrets obligatoires manquants: {missing}")
        logger.error("Configurez-les via variables d'environnement ou fichier .env")
    else:
        logger.info("✅ Tous les secrets obligatoires sont configurés")

    # Log les secrets optionnels manquants (info seulement)
    optional_results = manager.validate_required_secrets(OPTIONAL_SECRETS)
    missing_optional = [k for k, v in optional_results.items() if not v]
    if missing_optional:
        logger.info(f"ℹ️ Secrets optionnels non configurés: {missing_optional}")

    return all_present


if __name__ == "__main__":
    # Test du gestionnaire
    logging.basicConfig(level=logging.DEBUG)

    manager = SecretManager()

    print("=== Test du Gestionnaire de Secrets ===\n")

    # Générer des secrets
    print(f"Secret généré (32 chars): {manager.generate_secret(32)}")
    print(f"Token URL-safe: {manager.generate_token(24)}")

    # Test hash
    test_secret = "my-super-secret"
    hashed = manager.hash_secret(test_secret)
    print(f"\nHash de '{test_secret}': {hashed[:50]}...")
    print(f"Vérification: {manager.verify_secret(test_secret, hashed)}")

    # Validation
    print("\n=== Validation des Secrets ===")
    validate_app_secrets()
