"""
detect_duplicates.py

Étape 2: Détection intelligente de doublons
- Exact match (SHA-256)
- Fuzzy match (similarité textuelle)
- Metadata match (sender + timestamp)

⚠️ IMPORTANT: Les doublons ne sont JAMAIS supprimés.
Ils sont LIÉS et une décision humaine est REQUISE.
"""

import hashlib
from datetime import datetime, timedelta
from difflib import SequenceMatcher
from typing import Any, Dict, List, Optional, Tuple

import requests

from ..schemas.models import DuplicateDetectionSchema, InformationUnitSchema
from .rules_engine import DuplicateDetector


class DuplicateChecker:
    """Détecte les doublons intelligemment"""

    def __init__(self, api_base_url: str = "http://localhost:3000"):
        self.api_base_url = api_base_url
        self.detector = DuplicateDetector()

    def check_batch_for_duplicates(
        self,
        units: List[InformationUnitSchema],
        tenant_id: str,
    ) -> Tuple[List[DuplicateDetectionSchema], int]:
        """
        Teste chaque unité contre TOUTES les autres (dans la batch)
        ET contre la base de données (historique).

        Returns:
            (duplicates_found, count_exact_matches)
        """
        print(f"\n🔍 [DUPLICATE] Vérification {len(units)} unités...")

        duplicates_found = []
        exact_matches_count = 0

        # 1️⃣ Test intra-batch (rapide)
        for i, unit1 in enumerate(units):
            for j, unit2 in enumerate(units[i + 1 :], i + 1):
                # Exact match par checksum
                if unit1.content_hash == unit2.content_hash:
                    exact_matches_count += 1
                    duplicates_found.append(
                        DuplicateDetectionSchema(
                            primary_unit_id=unit1.id,
                            duplicate_unit_id=unit2.id,
                            detection_method="EXACT_MATCH",
                            similarity_score=1.0,
                            match_criteria={
                                "content_hash_match": unit1.content_hash,
                                "same_sender": (
                                    unit1.source_metadata.get("sender_email")
                                    == unit2.source_metadata.get("sender_email")
                                ),
                            },
                            time_window_applied="unlimited",
                            timestamp=datetime.now(),
                        )
                    )
                    print(f"   🎯 Exact match: {unit1.id[:8]} <-> {unit2.id[:8]}")

                # Fuzzy match (95%+)
                else:
                    similarity = self.detector.fuzzy_match(
                        unit1.content,
                        unit2.content,
                    )
                    if similarity > 0.95:
                        # Vérifier la fenêtre temporelle (7 jours max)
                        time_diff = (
                            unit2.received_at - unit1.received_at
                        ).total_seconds()
                        if abs(time_diff) <= 7 * 86400:
                            duplicates_found.append(
                                DuplicateDetectionSchema(
                                    primary_unit_id=unit1.id,
                                    duplicate_unit_id=unit2.id,
                                    detection_method="FUZZY_MATCH",
                                    similarity_score=similarity,
                                    match_criteria={
                                        "similarity_ratio": f"{similarity:.2%}",
                                        "time_diff_hours": (time_diff / 3600),
                                    },
                                    time_window_applied="7_days",
                                    timestamp=datetime.now(),
                                )
                            )
                            print(
                                f"   🔄 Fuzzy match {similarity:.1%}: {unit1.id[:8]} <-> {unit2.id[:8]}"
                            )

        # 2️⃣ Test contre historique (via API)
        for unit in units:
            historical_duplicates = self._check_against_history(
                unit,
                tenant_id,
            )
            duplicates_found.extend(historical_duplicates)

        print(
            f"   ✅ {len(duplicates_found)} paires détectées ({exact_matches_count} exact)"
        )

        return duplicates_found, exact_matches_count

    def _check_against_history(
        self,
        unit: InformationUnitSchema,
        tenant_id: str,
        limit: int = 50,
    ) -> List[DuplicateDetectionSchema]:
        """
        Vérifie si cette unité est un doublon d'une unité historique

        Appelle l'API Next.js qui:
        1. Recherche les units avec même checksum
        2. Recherche les units avec sender + timestamp proches
        3. Retourne les matches
        """
        endpoint = f"{self.api_base_url}/api/analysis/find-duplicate-candidates"

        params = {
            "tenantId": tenant_id,
            "contentHash": unit.content_hash,
            "senderEmail": (unit.source_metadata.get("sender_email", "")),
            "receivedAt": unit.received_at.isoformat(),
            "limit": limit,
        }

        try:
            response = requests.get(endpoint, params=params, timeout=10)
            response.raise_for_status()

            candidates = response.json().get("candidates", [])

            duplicates = []
            for candidate in candidates:
                duplicate = DuplicateDetectionSchema(
                    primary_unit_id=candidate["id"],
                    duplicate_unit_id=unit.id,
                    detection_method=(
                        "EXACT_MATCH"
                        if candidate["content_hash"] == unit.content_hash
                        else "METADATA_MATCH"
                    ),
                    similarity_score=(
                        1.0 if candidate["content_hash"] == unit.content_hash else 0.85
                    ),
                    match_criteria={
                        "reason": candidate.get("reason"),
                        "sender_match": (
                            candidate.get("senderEmail")
                            == unit.source_metadata.get("sender_email")
                        ),
                        "time_window_seconds": candidate.get("timeDiffSeconds"),
                    },
                    time_window_applied=(
                        "5_minutes"
                        if candidate.get("timeDiffSeconds", 999999) <= 300
                        else "7_days"
                    ),
                    timestamp=datetime.now(),
                )
                duplicates.append(duplicate)

            if duplicates:
                print(
                    f"   🔗 {len(duplicates)} match(es) historique pour {unit.id[:8]}"
                )

            return duplicates

        except requests.RequestException as e:
            print(f"   ⚠️  Erreur check historique: {e}")
            return []

    def propose_linkage(
        self,
        primary_id: str,
        duplicate_id: str,
        reason: str,
        tenant_id: str,
    ) -> bool:
        """
        Propose un LIEN entre deux unités (pas de suppression!)

        Crée un EventLog de type DUPLICATE_DETECTED avec:
        - primary_unit_id
        - duplicate_unit_id
        - reason (exact_match, fuzzy_match, metadata_match)
        - Statut: PROPOSED_FOR_LINKING

        Retourne True si l'appel a réussi.
        """
        endpoint = f"{self.api_base_url}/api/analysis/propose-duplicate-link"

        payload = {
            "tenantId": tenant_id,
            "primaryUnitId": primary_id,
            "duplicateUnitId": duplicate_id,
            "reason": reason,
            "timestamp": datetime.now().isoformat(),
        }

        try:
            response = requests.post(
                endpoint,
                json=payload,
                timeout=10,
            )
            response.raise_for_status()
            return True
        except requests.RequestException as e:
            print(f"❌ Erreur proposal linkage {primary_id} <-> {duplicate_id}: {e}")
            return False

    def get_linkage_status(
        self,
        unit_id: str,
        tenant_id: str,
    ) -> Dict[str, Any]:
        """
        Récupère le statut de linkage pour une unité

        Returns:
            {
                "is_primary": bool,
                "is_duplicate_of": Optional[str],  # ID de l'unité primaire
                "duplicates": [str],  # IDs des doublons
                "linkage_status": "PROPOSED" | "LINKED" | "DISMISSED",
                "linked_at": Optional[datetime],
                "linked_by": Optional[str],  # user_id
                "reason": Optional[str],
            }
        """
        endpoint = f"{self.api_base_url}/api/analysis/get-linkage-status"

        params = {"tenantId": tenant_id, "unitId": unit_id}

        try:
            response = requests.get(endpoint, params=params, timeout=10)
            response.raise_for_status()
            return response.json().get("status", {})
        except requests.RequestException as e:
            print(f"⚠️  Erreur get_linkage_status: {e}")
            return {}
