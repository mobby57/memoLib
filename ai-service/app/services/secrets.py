"""
Azure Key Vault Integration for AI Service

Loads secrets from Azure Key Vault in production.
Falls back to environment variables for local development.
"""

import os
from typing import Dict, Optional

import structlog

logger = structlog.get_logger()

# Lazy import for Azure SDK (not needed in all environments)
_key_vault_client = None


def get_key_vault_client():
    """Get or create Key Vault client (singleton pattern)"""
    global _key_vault_client

    if _key_vault_client is not None:
        return _key_vault_client

    vault_url = os.getenv("AZURE_KEY_VAULT_URL")
    if not vault_url:
        logger.debug("key_vault_not_configured", reason="AZURE_KEY_VAULT_URL not set")
        return None

    try:
        from azure.identity import DefaultAzureCredential
        from azure.keyvault.secrets import SecretClient

        credential = DefaultAzureCredential()
        _key_vault_client = SecretClient(vault_url=vault_url, credential=credential)
        logger.info("key_vault_connected", vault_url=vault_url)
        return _key_vault_client
    except ImportError:
        logger.warning(
            "key_vault_sdk_not_installed",
            hint="pip install azure-identity azure-keyvault-secrets",
        )
        return None
    except Exception as e:
        logger.error("key_vault_connection_failed", error=str(e))
        return None


def get_secret(
    name: str, default: Optional[str] = None, use_key_vault: bool = True
) -> Optional[str]:
    """
    Get a secret value from Azure Key Vault or environment variables.

    Priority:
    1. Environment variable (for local override)
    2. Azure Key Vault (if configured)
    3. Default value

    Args:
        name: Secret name (will be converted to appropriate format)
        default: Default value if secret not found
        use_key_vault: Whether to attempt Key Vault lookup

    Returns:
        Secret value or default
    """
    # Convert name format: OPENAI_API_KEY -> openai-api-key (Key Vault format)
    env_name = name.upper().replace("-", "_")
    kv_name = name.lower().replace("_", "-")

    # 1. Check environment variable first (local override)
    env_value = os.getenv(env_name)
    if env_value:
        logger.debug("secret_from_env", name=env_name)
        return env_value

    # 2. Try Azure Key Vault
    if use_key_vault:
        client = get_key_vault_client()
        if client:
            try:
                secret = client.get_secret(kv_name)
                logger.debug("secret_from_key_vault", name=kv_name)
                return secret.value
            except Exception as e:
                logger.debug("secret_not_in_key_vault", name=kv_name, error=str(e))

    # 3. Return default
    return default


def load_secrets() -> Dict[str, str]:
    """
    Load all required secrets for the AI service.

    Returns:
        Dictionary of secret name -> value
    """
    required_secrets = [
        "OPENAI_API_KEY",
        "DATABASE_URL",
        "NEXTAUTH_SECRET",
    ]

    optional_secrets = [
        "AZURE_OPENAI_ENDPOINT",
        "AZURE_OPENAI_API_KEY",
        "AZURE_OPENAI_DEPLOYMENT",
        "REDIS_URL",
        "TWILIO_AUTH_TOKEN",
        "TWILIO_ACCOUNT_SID",
    ]

    secrets = {}
    missing = []

    for name in required_secrets:
        value = get_secret(name)
        if value:
            secrets[name] = value
        else:
            missing.append(name)

    for name in optional_secrets:
        value = get_secret(name)
        if value:
            secrets[name] = value

    if missing:
        logger.warning("missing_required_secrets", secrets=missing)

    logger.info(
        "secrets_loaded",
        required=len(required_secrets) - len(missing),
        optional=len([s for s in optional_secrets if s in secrets]),
    )

    return secrets


# =============================================================================
# Helper for FastAPI dependency injection
# =============================================================================


class SecretsManager:
    """
    Secrets manager for FastAPI dependency injection.

    Usage:
        secrets = SecretsManager()

        @app.get("/")
        async def endpoint(secrets: SecretsManager = Depends(get_secrets)):
            api_key = secrets.get("OPENAI_API_KEY")
    """

    def __init__(self):
        self._cache: Dict[str, str] = {}
        self._loaded = False

    def load(self):
        """Load secrets (called once on startup)"""
        if not self._loaded:
            self._cache = load_secrets()
            self._loaded = True

    def get(self, name: str, default: Optional[str] = None) -> Optional[str]:
        """Get a secret value"""
        if not self._loaded:
            self.load()
        return self._cache.get(name, default)

    def require(self, name: str) -> str:
        """Get a required secret (raises if missing)"""
        value = self.get(name)
        if value is None:
            raise ValueError(f"Required secret {name} not configured")
        return value


# Global instance
_secrets_manager = SecretsManager()


def get_secrets() -> SecretsManager:
    """FastAPI dependency for secrets access"""
    return _secrets_manager
