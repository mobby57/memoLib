"""
pipeline.py

Complete analysis pipeline orchestrator

Flow:
1. prepare_events.py: Ingestion + Normalization
2. rules_engine.py: Rules application
3. detect_duplicates.py: Duplicate detection
4. generate_events.py: EventLog creation
5. Persistence in Prisma via Next.js API
"""

import time
from datetime import datetime
from typing import Any, Dict, List

from ..schemas.models import (
    ClassificationResultSchema,
    EventLogSchema,
    PipelineResultSchema,
)
from .detect_duplicates import DuplicateChecker
from .generate_events import EventLogger, create_event_audit_report
from .prepare_events import EventPreparer
from .rules_engine import DeadlineExtractor, RuleEngine


class AnalysisPipeline:
    """Complete flow analysis pipeline"""

    def __init__(
        self,
        tenant_id: str,
        api_base_url: str = "http://localhost:3000",
    ):
        self.tenant_id = tenant_id
        self.api_base_url = api_base_url

        # Initialize components
        self.preparer = EventPreparer(api_base_url)
        self.rule_engine = RuleEngine()
        self.duplicate_checker = DuplicateChecker(api_base_url)
        self.event_logger = EventLogger(api_base_url)

    def execute(
        self,
        unit_status: str = "RECEIVED",
        limit: int = 100,
        persist: bool = True,
    ) -> PipelineResultSchema:
        """
        Execute the complete pipeline

        Args:
            unit_status: Status of units to process
            limit: Maximum number of units
            persist: Persist EventLog in Prisma?

        Returns:
            Résumé de l'exécution
        """
        start_time = time.time()
        execution_id = f"exec_{datetime.now().strftime('%Y%m%d_%H%M%S')}"

        print(f"\n{'='*60}")
        print(f"🚀 PIPELINE DÉMARRÉ: {execution_id}")
        print(f"   Tenant: {self.tenant_id}")
        print(f"   Status: {unit_status}, Limit: {limit}")
        print(f"{'='*60}")

        # ========================================
        # ÉTAPE 1: PRÉPARATION
        # ========================================

        prep_result = self.preparer.prepare_batch(
            tenant_id=self.tenant_id,
            status=unit_status,
            limit=limit,
        )

        units = prep_result["units"]

        if not units:
            print("⚠️  Aucune unité à traiter, pipeline terminé.")
            return PipelineResultSchema(
                execution_id=execution_id,
                tenant_id=self.tenant_id,
                timestamp=datetime.now(),
                units_ingested=0,
                units_normalized=0,
                units_classified=0,
                classifications=[],
                duplicates_detected=0,
                duplicates=[],
                events_generated=0,
                events=[],
                processing_time_seconds=time.time() - start_time,
                errors=prep_result["errors"],
            )

        # ========================================
        # STEP 2: DUPLICATE DETECTION
        # ========================================

        duplicates_found, exact_matches = (
            self.duplicate_checker.check_batch_for_duplicates(
                units=units,
                tenant_id=self.tenant_id,
            )
        )

        # ========================================
        # STEP 3: CLASSIFICATION BY RULES
        # ========================================

        classifications = []

        for unit in units:
            # Enrichment: Semantic deadline detection
            deadline_data = self._extract_deadline_from_content(unit.content)

            # Enrichissement: Métadonnées supplémentaires
            metadata = {
                **unit.source_metadata,
                "deadline": deadline_data,
                "repetition_count": self._get_repetition_count(unit.id, self.tenant_id),
            }

            # Rules application
            final_priority, applied_rules, priority_score = (
                self.rule_engine.apply_all_rules(unit, metadata)
            )

            # Create classification result
            classification = ClassificationResultSchema(
                information_unit_id=unit.id,
                tenant_id=self.tenant_id,
                base_priority="MEDIUM",
                applied_rules=applied_rules,
                final_priority=final_priority,
                priority_score=priority_score,
                classification_timestamp=datetime.now(),
                requires_human_validation=(
                    final_priority.value == "CRITICAL"
                    or any(r.priority_boost < 0 for r in applied_rules)
                ),
            )

            classifications.append(classification)

        print(f"\n✅ {len(classifications)} unités classifiées")

        # ========================================
        # ÉTAPE 4: GÉNÉRATION DES EVENTS
        # ========================================

        events_to_persist: List[EventLogSchema] = []

        # Events de classification
        for classification in classifications:
            event = self.event_logger.generate_classification_event(
                classification,
                self.tenant_id,
            )
            events_to_persist.append(event)

        # Events de doublon
        for duplicate in duplicates_found:
            event = self.event_logger.generate_duplicate_event(
                duplicate,
                self.tenant_id,
            )
            events_to_persist.append(event)

        print(f"\n✅ {len(events_to_persist)} EventLog générés")

        # ========================================
        # STEP 5: PERSISTENCE
        # ========================================

        persist_result = {"created_count": 0, "failed_count": 0}

        if persist and events_to_persist:
            persist_result = self.event_logger.persist_events(
                events=events_to_persist,
                tenant_id=self.tenant_id,
            )

        # ========================================
        # RÉSUMÉ
        # ========================================

        processing_time = time.time() - start_time

        result = PipelineResultSchema(
            execution_id=execution_id,
            tenant_id=self.tenant_id,
            timestamp=datetime.now(),
            units_ingested=prep_result["count"],
            units_normalized=len(units),
            units_classified=len(classifications),
            classifications=classifications,
            duplicates_detected=len(duplicates_found),
            duplicates=duplicates_found,
            events_generated=len(events_to_persist),
            events=events_to_persist,
            processing_time_seconds=processing_time,
            errors=prep_result["errors"],
        )

        # Affiche le résumé
        self._print_summary(result)

        return result

    def _extract_deadline_from_content(self, content: str) -> Dict[str, Any]:
        """Extrait les informations de délai du contenu"""
        extractor = DeadlineExtractor()
        extracted = extractor.extract_deadlines(content)

        if extracted:
            return {
                "detected": True,
                "extractions": extracted,
            }

        return {"detected": False}

    def _get_repetition_count(self, unit_id: str, tenant_id: str) -> int:
        """Récupère le nombre de fois que cette unité (ou similaire) a été vue"""
        # Implémentation simplifiée: appel à l'API
        # En réalité, ce serait une requête à la DB
        return 1

    def _print_summary(self, result: PipelineResultSchema) -> None:
        """Affiche un résumé formaté"""
        print(f"\n{'='*60}")
        print(f"📊 RÉSUMÉ DE L'EXÉCUTION")
        print(f"{'='*60}")
        print(f"Execution ID: {result.execution_id}")
        print(f"Timestamp: {result.timestamp.isoformat()}")
        print(f"\n📥 Ingestion:")
        print(f"   - Unités ingérées: {result.units_ingested}")
        print(f"   - Unités normalisées: {result.units_normalized}")
        print(f"\n🔍 Classification:")
        print(f"   - Unités classifiées: {result.units_classified}")

        # Répartition par priorité
        priority_counts = {}
        for classification in result.classifications:
            priority = classification.final_priority.value
            priority_counts[priority] = priority_counts.get(priority, 0) + 1

        for priority in ["CRITICAL", "HIGH", "MEDIUM", "LOW"]:
            count = priority_counts.get(priority, 0)
            if count > 0:
                print(f"     • {priority}: {count}")

        print(f"\n🔗 Doublons:")
        print(f"   - Détectés: {result.duplicates_detected}")

        print(f"\n📝 EventLog:")
        print(f"   - Générés: {result.events_generated}")

        if result.events:
            print(f"   - Persistés: {result.events_generated}")

        print(f"\n⏱️  Temps total: {result.processing_time_seconds:.2f}s")

        if result.errors:
            print(f"\n⚠️  Erreurs ({len(result.errors)}):")
            for error in result.errors[:5]:  # Top 5
                print(f"   - {error.get('error', 'Unknown')}")
            if len(result.errors) > 5:
                print(f"   ... et {len(result.errors) - 5} de plus")

        print(f"{'='*60}\n")


# ===========================
# Script d'exécution
# ===========================


if __name__ == "__main__":
    # Configuration
    TENANT_ID = "test_tenant_001"
    API_BASE_URL = "http://localhost:3000"

    # Execute pipeline
    pipeline = AnalysisPipeline(
        tenant_id=TENANT_ID,
        api_base_url=API_BASE_URL,
    )

    result = pipeline.execute(
        unit_status="RECEIVED",
        limit=100,
        persist=True,
    )

    # Vous pouvez traiter le résultat ici
    print(f"\n📌 Pipeline result: {result.execution_id}")
    print(f"   Statut: {'✅ SUCCÈS' if not result.errors else '⚠️  PARTIEL'}")
