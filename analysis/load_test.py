"""
load_test.py

Test de performance: pipeline avec 1000+ unités
Objectif: >100 unités/sec
"""

import random
import time
from datetime import datetime, timedelta

from analysis.pipelines.rules_engine import RuleEngine
from analysis.schemas.models import InformationUnitSchema, PriorityEnum


def generate_test_units(count: int = 100) -> list:
    """Générer unités de test réalistes"""
    sources = ["EMAIL", "UPLOAD", "API"]
    senders = ["tribunal@justice.fr", "admin@gouv.fr", "user@example.com"]

    content_templates = [
        "Décision de OQTF prononcée. Délai d'appel: 30 jours.",
        "Notification administrative. Délai de réponse: 2 mois.",
        "Correspondance judiciaire. Audience prévue: 15 jours.",
        "Courrier de demande de documents. Délai: 1 mois.",
        "Notification d'appel devant la CAA. Délai: 15 jours.",
    ]

    units = []
    for i in range(count):
        unit = InformationUnitSchema(
            id=f"bench-{i}",
            source=random.choice(sources),
            content=random.choice(content_templates),
            content_hash=f"hash_{i}",
            tenant_id="bench-tenant",
            received_at=datetime.now() - timedelta(days=random.randint(0, 30)),
            source_metadata={
                "sender_email": random.choice(senders),
                "client_id": f"client-{i % 10}",
            },
        )
        units.append(unit)

    return units


def benchmark_rule_engine(unit_count: int = 1000):
    """Benchmark le moteur de règles"""
    print(f"\n{'='*60}")
    print(f"BENCHMARK: Pipeline avec {unit_count} unités")
    print(f"{'='*60}")

    # Générer les unités
    print(f"\n1️⃣  Génération de {unit_count} unités...")
    start = time.time()
    units = generate_test_units(unit_count)
    gen_time = time.time() - start
    print(f"   ✅ {unit_count} unités générées en {gen_time:.2f}s")

    # Exécuter le pipeline
    print(f"\n2️⃣  Exécution du pipeline sur {unit_count} unités...")
    engine = RuleEngine()

    start = time.time()
    results = []
    for unit in units:
        priority, rules, score = engine.apply_all_rules(unit)
        results.append(
            {"id": unit.id, "priority": priority, "rules": rules, "score": score}
        )

    pipeline_time = time.time() - start
    units_per_sec = unit_count / pipeline_time if pipeline_time > 0 else 0

    print(f"   ✅ Pipeline exécuté en {pipeline_time:.2f}s")
    print(f"   📊 {units_per_sec:.1f} unités/sec")

    # Statistiques des résultats
    print(f"\n3️⃣  Analyse des résultats...")
    priority_counts = {}
    for result in results:
        p = str(result["priority"])
        priority_counts[p] = priority_counts.get(p, 0) + 1

    print("\n   Distribution des priorités:")
    for priority in [
        PriorityEnum.CRITICAL,
        PriorityEnum.HIGH,
        PriorityEnum.MEDIUM,
        PriorityEnum.LOW,
    ]:
        count = priority_counts.get(str(priority), 0)
        pct = (count / unit_count) * 100 if unit_count > 0 else 0
        bar = "█" * int(pct / 2)
        print(f"   {priority:8s}: {count:4d} ({pct:5.1f}%) {bar}")

    # Résultat final
    print(f"\n{'='*60}")
    print(f"RÉSULTATS:")
    print(f"{'='*60}")
    print(f"✅ Unités traitées: {unit_count}")
    print(f"⏱️  Temps total: {pipeline_time:.2f}s")
    print(f"📊 Débit: {units_per_sec:.1f} unités/sec")
    print(f"🎯 Cible: >100 unités/sec")

    if units_per_sec >= 100:
        print(f"✅ PASS: Objectif de performance atteint!")
    else:
        print(f"⚠️  ATTENTION: Débit inférieur à l'objectif")

    return {
        "unit_count": unit_count,
        "pipeline_time_seconds": pipeline_time,
        "units_per_second": units_per_sec,
        "priority_distribution": priority_counts,
    }


if __name__ == "__main__":
    # Tester avec différentes tailles
    for size in [100, 500, 1000]:
        try:
            result = benchmark_rule_engine(size)
        except Exception as e:
            print(f"❌ Erreur lors du test avec {size} unités: {e}")
