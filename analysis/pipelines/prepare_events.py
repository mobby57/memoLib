"""
prepare_events.py

Étape 1: Ingestion et normalisation des InformationUnit
- Charge les unités brutes
- Normalise le contenu
- Calcule les checksums
- Enrichit les métadonnées
"""

import hashlib
import json
from datetime import datetime
from typing import Any, Dict, List, Optional

import requests

from ..schemas.models import InformationUnitSchema


class EventPreparer:
    """Prépare et normalise les InformationUnit"""

    def __init__(self, api_base_url: str = "http://localhost:3000"):
        """
        Initialise le préparateur

        Args:
            api_base_url: URL de l'API Next.js (ex: http://localhost:3000)
        """
        self.api_base_url = api_base_url

    def fetch_information_units(
        self,
        tenant_id: str,
        status: str = "RECEIVED",
        limit: int = 100,
    ) -> List[Dict[str, Any]]:
        """
        Charge les InformationUnit depuis l'API Next.js

        Pattern d'appel depuis l'API (src/frontend/app/api/analysis/fetch-units/route.ts):
        GET /api/analysis/fetch-units?tenantId=X&status=RECEIVED&limit=100

        Returns:
            Liste de dictionnaires bruts
        """
        endpoint = f"{self.api_base_url}/api/analysis/fetch-units"
        params = {
            "tenantId": tenant_id,
            "status": status,
            "limit": limit,
        }

        try:
            response = requests.get(endpoint, params=params, timeout=30)
            response.raise_for_status()
            return response.json().get("units", [])
        except requests.RequestException as e:
            print(f"❌ Erreur lors du fetch: {e}")
            return []

    def normalize_unit(self, raw_unit: Dict[str, Any]) -> InformationUnitSchema:
        """
        Normalise une unité brute en schéma standard

        Transformations:
        - Nettoie le contenu (whitespace, encoding)
        - Calcule SHA-256 du contenu
        - Enrichit les métadonnées
        - Valide la structure
        """
        content = raw_unit.get("content", "").strip()

        # Calcul du checksum
        content_hash = hashlib.sha256(content.encode("utf-8")).hexdigest()

        # Normalisation des dates
        received_at = self._parse_datetime(raw_unit.get("receivedAt"))
        classified_at = self._parse_datetime(raw_unit.get("classifiedAt"))
        analyzed_at = self._parse_datetime(raw_unit.get("analyzedAt"))

        # Métadonnées enrichies
        source_metadata = self._extract_source_metadata(raw_unit)

        return InformationUnitSchema(
            id=raw_unit.get("id", ""),
            tenant_id=raw_unit.get("tenantId", ""),
            source=raw_unit.get("source", "MANUAL"),
            content=content,
            content_hash=content_hash,
            received_at=received_at,
            classified_at=classified_at,
            analyzed_at=analyzed_at,
            source_metadata=source_metadata,
            linked_workspace_id=raw_unit.get("linkedWorkspaceId"),
        )

    def _parse_datetime(self, value: Any) -> datetime:
        """Parse une datetime de différents formats"""
        if isinstance(value, datetime):
            return value
        if isinstance(value, str):
            try:
                return datetime.fromisoformat(value.replace("Z", "+00:00"))
            except ValueError:
                pass
        return datetime.now()

    def _extract_source_metadata(self, raw_unit: Dict[str, Any]) -> Dict[str, Any]:
        """
        Extrait les métadonnées pertinentes de la source

        Exemples:
        - sender_email (pour EMAIL)
        - uploaded_by (pour UPLOAD)
        - api_key_id (pour API)
        """
        metadata = {}

        # Email: extract sender
        if raw_unit.get("source") == "EMAIL":
            metadata["sender_email"] = raw_unit.get("senderEmail")
            metadata["sender_name"] = raw_unit.get("senderName")
            metadata["email_headers"] = raw_unit.get("headers")  # SPF, DKIM, etc.

        # Upload: extract uploader info
        elif raw_unit.get("source") == "UPLOAD":
            metadata["uploaded_by"] = raw_unit.get("uploadedBy")
            metadata["uploaded_filename"] = raw_unit.get("filename")
            metadata["file_mime_type"] = raw_unit.get("mimeType")
            metadata["file_size_bytes"] = raw_unit.get("fileSize")

        # API: extract caller
        elif raw_unit.get("source") == "API":
            metadata["api_key_id"] = raw_unit.get("apiKeyId")
            metadata["api_version"] = raw_unit.get("apiVersion")

        metadata["ip_address"] = raw_unit.get("ipAddress")
        metadata["user_agent"] = raw_unit.get("userAgent")

        return metadata

    def prepare_batch(
        self,
        tenant_id: str,
        status: str = "RECEIVED",
        limit: int = 100,
    ) -> Dict[str, Any]:
        """
        Exécute toute l'étape de préparation

        Returns:
            {
                "count": int,
                "units": [InformationUnitSchema],
                "errors": [],
                "timestamp": datetime
            }
        """
        print(f"\n🔄 [PREPARE] Ingestion {status} (max {limit})...")

        # Charge les unités brutes
        raw_units = self.fetch_information_units(
            tenant_id=tenant_id,
            status=status,
            limit=limit,
        )
        print(f"   ✅ {len(raw_units)} unités chargées")

        # Normalise chaque unité
        normalized_units = []
        errors = []

        for i, raw_unit in enumerate(raw_units):
            try:
                normalized = self.normalize_unit(raw_unit)
                normalized_units.append(normalized)
            except Exception as e:
                errors.append(
                    {
                        "unit_id": raw_unit.get("id"),
                        "error": str(e),
                    }
                )
                print(f"   ⚠️  Erreur normalisation unit {i+1}: {e}")

        print(f"   ✅ {len(normalized_units)} unités normalisées")
        if errors:
            print(f"   ⚠️  {len(errors)} erreurs")

        return {
            "count": len(normalized_units),
            "units": normalized_units,
            "errors": errors,
            "timestamp": datetime.now(),
        }


# ===========================
# Utilitaire: Valeur par défaut
# ===========================


def get_ingest_status() -> str:
    """
    Retourne le statut à ingérer en priorité

    Ordre recommandé:
    1. HUMAN_ACTION_REQUIRED (urgentissime)
    2. INCOMPLETE (à compléter)
    3. AMBIGUOUS (à clarifier)
    4. RECEIVED (à classifier)
    5. CLASSIFIED (à analyser)
    """
    return "RECEIVED"
