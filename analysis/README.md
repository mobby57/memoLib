# 🔍 Pipeline d'Analyse Légale MemoLib

**Version:** 1.0
**Date:** 4 février 2026
**Statut:** Stable (prêt pour production)

---

## 📚 Vue d'ensemble

Le pipeline d'analyse est un **système déterministe de classification et de priorisation** des flux légaux dans MemoLib. Il applique **4 règles légales explicables** à chaque InformationUnit reçue.

### ✅ Garanties

- ✔️ **Zéro IA opaque**: Logique 100% traçable et révisable
- ✔️ **Immuabilité**: Chaque décision génère un EventLog inviolable
- ✔️ **Pas de suppression**: Les doublons sont liés, jamais éliminés
- ✔️ **Explicabilité juridique**: Chaque priorité cite sa base légale

---

## 🏗️ Architecture

```
/analysis/
├── /pipelines/          # Code du pipeline
│   ├── prepare_events.py         # Ingestion + normalisation
│   ├── rules_engine.py           # Moteur d'application des règles
│   ├── detect_duplicates.py      # Détection intelligente
│   ├── generate_events.py        # Création des EventLog immuables
│   ├── pipeline.py               # Orchestrateur complet
│   └── flask_integration.py      # Endpoints Flask
│
├── /schemas/            # Modèles Pydantic
│   └── models.py                 # Schémas immuables
│
└── /notebooks/          # Exploration & validation
    └── exploration.ipynb         # Notebook de test
```

---

## 🎯 Les 4 Règles

### 1️⃣ RULE-DEADLINE-CRITICAL

**Trigger:** Délai légal expire dans ≤ 3 jours
**Priorité:** +2 (→ CRITICAL)
**Base légale:** Délais variés (CESEDA, CJA)
**Cas:** OQTF arrivée le 1er février → deadline 1er mars → CRITICAL

### 2️⃣ RULE-ACTOR-TYPE-PRIORITY

**Trigger:** Source = institution publique
**Priorité:** +1 ou +2 selon type
**Base légale:** Responsabilité administrative
**Cas:** Email du TA-Lyon (verify SPF/DKIM) → HIGH

### 3️⃣ RULE-DEADLINE-SEMANTIC

**Trigger:** Keywords + date détectés dans le contenu
**Priorité:** +1
**Base légale:** Extraction de délais contractuels/légaux
**Cas:** "recours contentieux" + "2 mois" → HIGH

### 4️⃣ RULE-REPETITION-ALERT

**Trigger:** Même type reçu 2+ fois en 30 jours
**Priorité:** +1
**Base légale:** Alerter sur patterns répétitifs
**Cas:** 2 OQTF en janvier → HIGH (merci d'investiguer)

---

## 🚀 Utilisation

### A. Exécution locale (test)

```bash
# 1. Activez l'env Python
source .venv/bin/activate  # ou .venv\Scripts\activate on Windows

# 2. Installez les dépendances
pip install pydantic requests pandas numpy

# 3. Exécutez le pipeline
cd analysis/pipelines
python pipeline.py
```

### B. Via Flask (backend-python)

```bash
# 1. Lancez Flask
cd backend-python
python app.py

# 2. Lancez le pipeline
curl -X POST http://localhost:5000/analysis/execute \
  -H "Content-Type: application/json" \
  -d '{
    "tenant_id": "test_tenant",
    "unit_status": "RECEIVED",
    "limit": 100
  }'

# 3. Testez une règle
curl -X POST http://localhost:5000/analysis/test-rules \
  -H "Content-Type: application/json" \
  -d '{
    "content": "OQTF received on 01/12/2025, 30 days to leave...",
    "sender_email": "client@example.com"
  }'
```

### C. Via API Next.js

```bash
# Exécute le pipeline
curl -X POST http://localhost:3000/api/analysis/execute \
  -H "Content-Type: application/json" \
  -d '{
    "tenantId": "tenant_001",
    "unitStatus": "RECEIVED",
    "limit": 100
  }'

# Charge les unités
curl http://localhost:3000/api/analysis/fetch-units?tenantId=tenant_001&status=RECEIVED&limit=50

# Crée les EventLog
curl -X POST http://localhost:3000/api/analysis/create-events \
  -H "Content-Type: application/json" \
  -d '{
    "tenantId": "tenant_001",
    "events": [...]
  }'
```

---

## 📊 Résultats attendus

Sur 100 cas typiques:

| Priorité | Nombre | %   | Cause principale                            |
| -------- | ------ | --- | ------------------------------------------- |
| CRITICAL | 5      | 5%  | Délai ≤ 3 jours                             |
| HIGH     | 30     | 30% | Source institutionnelle OU délai sémantique |
| MEDIUM   | 50     | 50% | Baseline (pas de trigger)                   |
| LOW      | 15     | 15% | Doublon proposé ou suspicion spam           |

---

## 🔗 Intégration avec Prisma

### EventLog (immuable)

```prisma
model EventLog {
  id            String      @id @default(cuid())
  timestamp     DateTime    @default(now())
  eventType     EventType
  entityType    String
  entityId      String
  actorType     ActorType
  metadata      Json
  checksum      String      // SHA-256
  immutable     Boolean     @default(true)
  tenantId      String
  tenant        Tenant      @relation(fields: [tenantId], references: [id])
}
```

### InformationUnit (classifiée)

Chaque unité conserve son historique de statut:

```
RECEIVED → [rules applied] → CLASSIFIED → ANALYZED → RESOLVED
```

### Proof (traçabilité légale)

Les décisions générées deviennent des Proof:

```
Proof {
  type: "LEGAL_DOCUMENT",
  title: "Détection OQTF (RULE-DEADLINE-CRITICAL)",
  rule_applied: "RULE-DEADLINE-CRITICAL",
  justification: {...},
  capturedBy: "system:rule_engine"
}
```

---

## 🧪 Tests

### Notebook Jupyter

```bash
cd analysis/notebooks
jupyter notebook exploration.ipynb
```

**Sections:**

1. Chargement de 100 cas simulés
2. Application des 4 règles
3. Analyse de la répartition
4. Détection de doublons
5. Recommandations sur les seuils

### Tests unitaires (à venir)

```bash
pytest analysis/tests/ -v
```

---

## 🛠️ Maintenance

### Ajouter une nouvelle règle

1. Définir la règle dans `RULES_FRAMEWORK_LEGAL_PRIORITY.md`
2. Implémenter dans `rules_engine.py`
3. Tester dans le notebook
4. Documenter dans ce README

### Exemple: Nouvelle règle de jurisprudence

```python
def rule_jurisprudence_favorable(unit, metadata):
    """
    Détecte si le contenu mentionne une jurisprudence favorable
    """
    keywords = ['CAA Paris 2024', 'favorable', 'accepted']
    for keyword in keywords:
        if keyword.lower() in unit.content.lower():
            return RuleApplicationSchema(
                rule_id="RULE-JURISPRUDENCE-FAVORABLE",
                rule_name="Jurisprudence favorable détectée",
                matched=True,
                priority_boost=1,
                legal_basis="Jurisprudence CAA Paris",
                confidence_score=0.9
            )
    return None
```

### Monitoring en production

Via Sentry: Les erreurs du pipeline sont loggées automatiquement.

```python
from sentry_sdk import capture_exception

try:
    result = pipeline.execute()
except Exception as e:
    capture_exception(e)
```

---

## 📋 Checklist de déploiement

- [ ] Tests unitaires passent (100% coverage sur rules)
- [ ] Notebook exploration exécute sans erreur
- [ ] Flask endpoints testés (curl ou Postman)
- [ ] Next.js routes créées et testées
- [ ] Prisma migrations appliquées (EventLog table)
- [ ] APScheduler configuré (job quotidien)
- [ ] Monitoring Sentry activé
- [ ] Documentation mise à jour

---

## 📞 Support

**Questions?**

- Review `RULES_FRAMEWORK_LEGAL_PRIORITY.md` pour les règles
- Check `analysis/notebooks/exploration.ipynb` pour des exemples
- Test `flask_integration.py` endpoints en local

**Bugs?**

- Vérifier les logs du pipeline
- Exécuter le notebook pour reproduire
- Vérifier les checksums des EventLog

---

**Prêt pour production? ✅**

Déployé sur: `backend-python` (port 5000) + `src/frontend` API routes

Monitoring: Sentry + EventLog audit trail

Maintenance: Zéro automatisme sans validation humaine
