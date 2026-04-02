# 🏛️ Cadre de Règles de Priorisation Légale pour MemoLib

**Date:** 4 février 2026
**Statut:** Framework de gouvernance
**Audience:** Architecture, Produit, Legal Team

---

## 1️⃣ Principes fondamentaux

### ✅ Ce que ce cadre garantit

- **Transparence totale**: Chaque priorité = une règle explicable
- **Traçabilité légale**: Chaque décision génère un EventLog justifié
- **Pas de suppression**: Seule la liaison de doublons est permise
- **Immuabilité**: Les règles sont revisitées, jamais effacées
- **Contextualisation**: Les règles évoluent avec la jurisprudence

### ⚠️ Ce que ce cadre rejette

- ❌ Scoring opaque basé sur des modèles statistiques
- ❌ Suppression automatique de documents (même détectés comme doublons)
- ❌ Priorisation sans justification légale citée
- ❌ "Apprentissage" implicite des préférences utilisateur
- ❌ Modification rétroactive des priorités assignées

---

## 2️⃣ Cartographie des règles légales réelles

### 🎯 Règle 1 : Délai légal critique (RULE-DEADLINE-CRITICAL)

**Trigger :** Un délai légal expire dans ≤ 3 jours

**Matérialisation en feature :**

```sql
SELECT
  deadline.id,
  deadline.type AS procedure_type,
  deadline.dueDate,
  CURRENT_DATE,
  EXTRACT(DAY FROM deadline.dueDate - CURRENT_DATE) AS days_remaining,
  deadline.legalBasis,
  deadline.referenceDate
FROM LegalDeadline
WHERE
  status = 'PENDING'
  AND dueDate <= CURRENT_DATE + INTERVAL '3 days'
  AND dueDate > CURRENT_DATE;
```

**EventLog generated :**

```json
{
  "eventType": "DEADLINE_CRITICAL",
  "entityType": "deadline",
  "entityId": "deadline_001",
  "priority": "CRITICAL",
  "justification": {
    "rule": "RULE-DEADLINE-CRITICAL",
    "days_remaining": 2,
    "legal_basis": "CESEDA Art. L.512-1",
    "procedure_type": "RECOURS_CONTENTIEUX",
    "reference_date": "2025-12-01",
    "due_date": "2026-02-06"
  },
  "actorType": "SYSTEM",
  "metadata": {
    "check_timestamp": "2026-02-04T14:30:00Z",
    "automatic_detection": true,
    "threshold_applied": "3_days"
  }
}
```

**Impact utilisateur :**

- 🚨 Apparaît en rouge dans Smart Inbox
- Proposé pour "action immédiate requise"
- Notification urgente (email/SMS selon config)

---

### 🎯 Règle 2 : Institution vs. Particulier (RULE-ACTOR-TYPE-PRIORITY)

**Trigger :** Source de l'information = institution publique

**Classification d'acteurs :**

```python
ACTOR_TYPES = {
    "INSTITUTION": {
        "sources": [
            "prefecture",
            "tribunal_administratif",
            "cour_administrative_appel",
            "conseil_etat",
            "ofii",
            "ants",
            "dgac"
        ],
        "priority_boost": +2,  # medium → high
        "rule": "RULE-ACTOR-TYPE-PRIORITY"
    },
    "AVOCAT": {
        "sources": [
            "email_avocat_verifiee",
            "cabinet_enrolled_in_ordinal"
        ],
        "priority_boost": +1,
        "rule": "RULE-LEGAL-COUNSEL"
    },
    "CLIENT": {
        "sources": [
            "client_self_submit",
            "email_client",
            "whatsapp_client"
        ],
        "priority_boost": 0,
        "rule": "RULE-CLIENT-SOURCE"
    },
    "TIERS": {
        "sources": [
            "external_email",
            "anonymous_upload",
            "spam_indicators"
        ],
        "priority_boost": -1,
        "rule": "RULE-THIRD-PARTY-CAUTION"
    }
}
```

**EventLog generated :**

```json
{
  "eventType": "FLOW_CLASSIFIED",
  "entityType": "information_unit",
  "entityId": "unit_002",
  "priority": "HIGH",
  "justification": {
    "rule": "RULE-ACTOR-TYPE-PRIORITY",
    "actor_type": "INSTITUTION",
    "actor_domain": "tribunal_administratif.fr",
    "sources": ["email_from:TA-lyon-courrier@justice.fr"],
    "priority_boost": 2,
    "baseline_priority": "MEDIUM",
    "resulting_priority": "HIGH"
  },
  "actorType": "SYSTEM",
  "metadata": {
    "email_verification": {
      "domain_mx_verified": true,
      "spf_passed": true,
      "dkim_passed": true
    },
    "source_normalized": "TA_LYON",
    "check_timestamp": "2026-02-04T10:15:00Z"
  }
}
```

**Cas réel :**

| Source                        | Détection                | Boost | Raison                                |
| ----------------------------- | ------------------------ | ----- | ------------------------------------- |
| TA de Lyon (courier officiel) | Mail headers + SPF/DKIM  | +2    | Document processuellement obligatoire |
| Cabinet d'avocat inscrit      | SIRET vérified + Ordinal | +1    | Tiers de confiance légal              |
| Client (WhatsApp)             | Numéro connu             | 0     | Baseline, pas d'accélération          |
| Email anonyme                 | No sender verification   | -1    | Nécessite validation humaine          |

---

### 🎯 Règle 3 : Délai légal détecté dans le texte (RULE-DEADLINE-SEMANTIC)

**Trigger :** Keywords légaux détectés avec date implicite

**Pattern matching (déterministe) :**

```python
DEADLINE_PATTERNS = {
    "OQTF": {
        "regex": r"obligation de quitter le territoire|OQTF",
        "legal_days": 30,  # Délai de départ volontaire
        "escalation": 90,  # Avant expulsion forcée
        "legal_basis": "CESEDA Art. L.532-1",
        "procedure_type": "OQTF"
    },
    "RECOURS_TA": {
        "regex": r"recours contentieux|référé|tribunal administratif",
        "legal_days": 2,  # Délai pour référé-suspension (urgent)
        "escalation": 60,  # Recours au fond
        "legal_basis": "CJA Art. L.521-1 (référé) / L.311-1 (au fond)",
        "procedure_type": "RECOURS_CONTENTIEUX"
    },
    "APPEL_CAA": {
        "regex": r"appel|cours administrative appel|CAA",
        "legal_days": 30,  # Standard appeal
        "escalation": None,
        "legal_basis": "CJA Art. L.311-1",
        "procedure_type": "APPEL"
    }
}
```

**Feature extraction :**

```json
{
  "documentId": "doc_003",
  "content_snippet": "...ordonnance de rejet du 01/12/2025, vous disposez d'un délai de 2 mois pour former un recours contentieux...",
  "detected_patterns": [
    {
      "pattern": "RECOURS_TA",
      "matched_text": "recours contentieux",
      "legal_basis": "CJA Art. L.311-1",
      "reference_date": "2025-12-01",
      "computed_deadline": "2026-02-01",
      "days_from_reference": 60,
      "confidence": 0.95
    }
  ],
  "extracted_deadline": {
    "type": "RECOURS_CONTENTIEUX",
    "dueDate": "2026-02-01",
    "legalDays": 60,
    "referenceDate": "2025-12-01",
    "autoDetected": true
  }
}
```

**EventLog generated :**

```json
{
  "eventType": "FLOW_CLASSIFIED",
  "entityType": "document",
  "entityId": "doc_003",
  "priority": "HIGH",
  "justification": {
    "rule": "RULE-DEADLINE-SEMANTIC",
    "pattern_matched": "RECOURS_TA",
    "legal_basis": "CJA Art. L.311-1",
    "extracted_deadline": "2026-02-01",
    "days_remaining": 28,
    "confidence_score": 0.95,
    "extraction_method": "semantic_pattern_matching",
    "human_validation_required": false,
    "validation_status": "AUTO_CONFIDENCE_HIGH"
  },
  "actorType": "SYSTEM",
  "metadata": {
    "check_timestamp": "2026-02-04T09:00:00Z",
    "extracted_text": "...délai de 2 mois pour former un recours contentieux...",
    "pattern_type": "regex_deterministic",
    "confidence_threshold": 0.9
  }
}
```

**Cas d'usage :**

> Client reçoit ordonnance OQTF du 15/01/2026. MemoLib détecte "OQTF" + "30 jours", calcule deadline = 15/02/2026 ✅ Priorisation **CRITICAL** créée automatiquement.

---

### 🎯 Règle 4 : Détection de doublon intelligent (RULE-DUPLICATE-DETECTION)

**Trigger :** Même contenu reçu de sources identiques/proches

**Matérialisation (NOT: suppression) :**

```python
DUPLICATE_DETECTION_RULES = {
    "EXACT_MATCH": {
        "algorithm": "SHA-256 checksum",
        "threshold": 1.0,
        "window": "unlimited",
        "rule": "RULE-DUPLICATE-EXACT"
    },
    "FUZZY_MATCH": {
        "algorithm": "Levenshtein + semantic similarity",
        "threshold": 0.95,  # 95% similarity
        "window": "7 days",  # Reçu dans les 7 derniers jours
        "rule": "RULE-DUPLICATE-FUZZY"
    },
    "METADATA_MATCH": {
        "criteria": [
            "same_sender_email",
            "same_document_hash",
            "same_timestamp_window (±5min)"
        ],
        "window": "5 minutes",
        "rule": "RULE-DUPLICATE-METADATA"
    }
}
```

**EventLog generated (pour chaque détection) :**

```json
{
  "eventType": "DUPLICATE_DETECTED",
  "entityType": "information_unit",
  "entityId": "unit_dup_b",
  "duplicateOf": "unit_dup_a",
  "priority": "MEDIUM",
  "justification": {
    "rule": "RULE-DUPLICATE-FUZZY",
    "detected_algorithm": "checksum_match",
    "similarity_score": 1.0,
    "match_criteria": {
      "sender_email": "client@example.com",
      "content_hash": "sha256:abc123...",
      "received_time_diff_seconds": 45
    },
    "time_window_applied": "metadata_match_5min",
    "duplicate_status": "PROPOSED_FOR_LINKING",
    "human_action_required": true,
    "action_options": [
      "LINK_AND_PRIORITIZE_ORIGINAL",
      "LINK_AND_PRIORITIZE_NEW",
      "LINK_AND_MERGE_METADATA",
      "DISMISS_DUPLICATE_CLAIM"
    ]
  },
  "actorType": "SYSTEM",
  "metadata": {
    "check_timestamp": "2026-02-04T14:22:00Z",
    "original_received": "2026-02-04T14:21:15Z",
    "duplicate_received": "2026-02-04T14:22:00Z",
    "similarity_explanation": "Exact text match + same sender + 45sec delay → probable double-send"
  }
}
```

**Chaînage de preuve (audit trail) :**

```
unit_dup_a (received 14:21)
  ← is_duplicate_of ←
unit_dup_b (received 14:22)
  reason: RULE-DUPLICATE-METADATA
  timestamp_hash: event_log_xyz
  human_decision: LINK_AND_PRIORITIZE_ORIGINAL
  decided_by: user_email
  decided_at: 2026-02-04T14:23:10Z
```

**Cas réel :**

> Client envoie email à 14:21 + renvoi à 14:22 (peur de non-réception).
> MemoLib détecte **RULE-DUPLICATE-METADATA** → **PROPOSED_FOR_LINKING**.
> Utilisateur confirme → génère EventLog → **chaînage établi**.
> Aucune suppression, juste traçabilité.

---

### 🎯 Règle 5 : Fréquence de répétition (RULE-REPETITION-ALERT)

**Trigger :** Même type de document/sujet reçu N fois en X jours

**Matérialisation :**

```python
REPETITION_RULES = {
    "MULTIPLE_OQTF": {
        "entity_type": "deadline_type",
        "entity_value": "OQTF",
        "threshold": 2,  # 2+ OQTF
        "window": "30 days",
        "alert_type": "HIGH",
        "rule": "RULE-REPETITION-OQTF",
        "legal_implication": "Potentiellement plusieurs procédures / réappels"
    },
    "DUPLICATE_RECOURS": {
        "entity_type": "deadline_type",
        "entity_value": "RECOURS_CONTENTIEUX",
        "threshold": 2,
        "window": "60 days",
        "alert_type": "MEDIUM",
        "rule": "RULE-REPETITION-RECOURS"
    },
    "SPAM_PATTERN": {
        "entity_type": "sender_domain",
        "threshold": 5,  # 5+ emails from same domain
        "window": "1 day",
        "alert_type": "LOW",
        "rule": "RULE-REPETITION-SPAM",
        "action": "POTENTIAL_SPAM_FILTER"
    }
}
```

**EventLog generated :**

```json
{
  "eventType": "FLOW_SCORED",
  "entityType": "information_unit",
  "entityId": "unit_004",
  "priority": "HIGH",
  "justification": {
    "rule": "RULE-REPETITION-OQTF",
    "repetition_detected": {
      "entity_type": "deadline_type",
      "entity_value": "OQTF",
      "count_in_window": 2,
      "window_days": 30,
      "instances": [
        { "id": "deadline_001", "received": "2026-01-10" },
        { "id": "deadline_002", "received": "2026-02-04" }
      ]
    },
    "alert": "MULTIPLE_OQTF_DETECTED",
    "legal_implication": "Potentiellement deux procédures en parallèle",
    "recommendation": "Review dossier consolidation and timing"
  },
  "actorType": "SYSTEM",
  "metadata": {
    "check_timestamp": "2026-02-04T15:00:00Z",
    "window_applied": "30_days",
    "threshold_exceeded": true
  }
}
```

---

### 🎯 Règle 6 : Délai de réponse préfecture (RULE-RESPONSE_DEADLINE)

**Trigger :** Pas de réponse officielle dans délai légal

**Matérialisation :**

```json
{
  "rule": "RULE-RESPONSE_DEADLINE",
  "scenario": "Client a demandé un titre de séjour, reçu accus-réception en 2024",
  "legal_basis": "CESEDA Art. L.212-1 (délai de 4 mois)",
  "events": {
    "demande_deposee": "2025-10-01",
    "deadline_computed": "2026-02-01",
    "today": "2026-02-04",
    "days_past_deadline": 3,
    "status": "NO_RESPONSE_RECEIVED"
  },
  "priority": "CRITICAL",
  "action": "AUTO_GENERATE_RELANCE",
  "generated_todo": {
    "task": "Envoyer mise en demeure - Délai dépassé (CESEDA Art. L.212-1)",
    "deadline": "2026-02-08",
    "priority": "CRITICAL",
    "description": "Aucune réponse reçue dans le délai de 4 mois (expiré 01/02/2026). Générer mise en demeure administrative."
  }
}
```

**EventLog generated :**

```json
{
  "eventType": "DEADLINE_MISSED",
  "entityType": "deadline",
  "entityId": "deadline_response_001",
  "priority": "CRITICAL",
  "justification": {
    "rule": "RULE-RESPONSE_DEADLINE",
    "legal_basis": "CESEDA Art. L.212-1",
    "procedure": "titre_sejour_demand",
    "reference_date": "2025-10-01",
    "deadline": "2026-02-01",
    "current_date": "2026-02-04",
    "days_overdue": 3,
    "action_triggered": "GENERATE_FORMAL_NOTICE"
  },
  "actorType": "SYSTEM",
  "metadata": {
    "check_timestamp": "2026-02-04T16:00:00Z",
    "automatic_todo_generated": {
      "task_id": "todo_auto_001",
      "action": "RELANCE_ADMINISTRATIVE",
      "template": "mise_en_demeure_standard"
    }
  }
}
```

---

## 3️⃣ Matrice de priorisation (basée sur règles)

### Score final = Base + Boosts

```
BASE PRIORITY:
- CRITICAL: Délai passé + action urgente requise
- HIGH: Délai < 7 jours OU source institutionnelle
- MEDIUM: Délai 7-30 jours OU source partenaire
- LOW: Autre

BOOSTS (cumulatif):
+ Répétition détectée: +1 niveau
+ Source institutionnelle: +1 niveau
+ Jurisprudence favorable mentionnée: +1 niveau (si détectée)
- Potentiel spam: -1 niveau
- Doublon proposé: pas de boost (reste en attente)
```

**Exemple concret :**

| Cas                         | Base     | Source   | Délai | Répétition | Final                               |
| --------------------------- | -------- | -------- | ----- | ---------- | ----------------------------------- |
| OQTF reçue J+2              | CRITICAL | Client   | 28j   | Non        | **CRITICAL**                        |
| TA envoie courrier          | HIGH     | TA Paris | 35j   | Non        | **HIGH**+1=↑                        |
| Client relance (3ème email) | MEDIUM   | Client   | 45j   | Oui        | **MEDIUM**+1=**HIGH**               |
| Doublon détecté             | MEDIUM   | Client   | 45j   | Non        | **PENDING** (en attente validation) |

---

## 4️⃣ Points clés d'intégration dans MemoLib

### 📍 InformationUnit → EventLog

Chaque transition génère un EventLog **immuable** :

```
RECEIVED → [RULE-ACTOR-TYPE-PRIORITY] → CLASSIFIED
       ↓
       EventLog(eventType=FLOW_CLASSIFIED, priority=HIGH, rule=...)
```

### 📍 LegalDeadline → Alerts automatiques

Chaque jour, job Python exécute :

```python
# Dans /analysis/pipelines/check_deadlines.py
deadlines = db.query(LegalDeadline).filter(
    status='PENDING',
    dueDate <= today + 3.days
).all()

for deadline in deadlines:
    event = EventLog(
        eventType='DEADLINE_CRITICAL',
        entityId=deadline.id,
        rule='RULE-DEADLINE-CRITICAL',
        justification={...},
        actorType='SYSTEM'
    )
    db.add(event)
    db.add(Notification(userId=dossier.owner, message=f"⚠️ {deadline.label}"))
```

### 📍 Proof → Validation de chaîne légale

Chaque Proof généré = EventLog traçable :

```json
{
  "proofId": "proof_001",
  "eventLog": "event_xyz",
  "title": "Réception OQTF du 15/01/2026",
  "type": "LEGAL_DOCUMENT",
  "proofDate": "2026-01-15",
  "capturedBy": "system:rule_RULE-DEADLINE-SEMANTIC"
}
```

---

## 5️⃣ Vocabulaire métier (sans IA)

| ❌ À éviter                 | ✅ À utiliser                                          |
| --------------------------- | ------------------------------------------------------ |
| "L'IA a détecté..."         | "Le système a détecté (règle: RULE-XXX)..."            |
| "Machine learning score"    | "Priorité calculée selon règles légales"               |
| "Intelligence artificielle" | "Moteur d'analyse des flux"                            |
| "Apprentissage automatique" | "Amélioration continue des règles (via jurisprudence)" |
| "Prédiction opaque"         | "Projection basée sur délais légaux"                   |

---

## 6️⃣ Prochaines étapes

### Phase A : Implémentation des règles (Février 2026)

- ✅ RULE-DEADLINE-CRITICAL (délais < 3j)
- ✅ RULE-ACTOR-TYPE-PRIORITY (institution vs. client)
- ✅ RULE-DEADLINE-SEMANTIC (extraction patterns)
- ⏳ RULE-DUPLICATE-DETECTION (liaison + chaînage)
- ⏳ RULE-REPETITION-ALERT (fréquence)

### Phase B : Pipeline Python (Février-Mars 2026)

- Structure `/analysis/pipelines/` dans `backend-python`
- Jobs schedulés (Flask + APScheduler)
- Tests unitaires pour chaque règle

### Phase C : Intégration UI (Mars 2026)

- EventLog visible en audit trail
- Justification affichée au côté de chaque priorité
- "Pourquoi cette priorité?" → clique → règle + legalBasis

---

## 7️⃣ Gouvernance des règles

### Comment les règles évoluent

1. **Detection phase**: Jurisprudence nouvelle ou cas client réel
2. **Proposal phase**: Équipe legal + devs proposent nouvelle règle
3. **Testing phase**: Implémentée en staging, testée sur 100 dossiers
4. **Approval phase**: Validation légale avant production
5. **Deployment phase**: Rollout graduel, monitoring via EventLog
6. **Deprecation phase**: Règles obsolètes archivées (jamais supprimées)

### Exemple : "Nouvelle jurisprudence CAA favor...

Janvier 2026 : CAA Paris rend jugement favorable pour "liens familiaux"
→ Règle proposée : RULE-JURISPRUDENCE-FAMILY-TIES
→ Test: Appliquée à 50 cas similaires en staging
→ Résultat: Précision 98% → Déployée
→ EventLog: Chaque décision cite cette jurisprudence

---

## 📊 Tableau synthétique des règles

| Rule ID                  | Trigger                   | Feature        | EventType          | Priority | Traçabilité |
| ------------------------ | ------------------------- | -------------- | ------------------ | -------- | ----------- |
| RULE-DEADLINE-CRITICAL   | Délai ≤ 3j                | Calcul J-N     | DEADLINE_CRITICAL  | CRITICAL | ✅          |
| RULE-ACTOR-TYPE-PRIORITY | Source instit.            | Email verify   | FLOW_CLASSIFIED    | HIGH     | ✅          |
| RULE-DEADLINE-SEMANTIC   | Keyword + date            | Regex/semantic | FLOW_CLASSIFIED    | HIGH     | ✅          |
| RULE-DUPLICATE-DETECTION | Contenu identique         | Checksum/fuzzy | DUPLICATE_DETECTED | -        | ✅          |
| RULE-REPETITION-ALERT    | N × sujet en X jours      | Agg. query     | FLOW_SCORED        | +1 boost | ✅          |
| RULE-RESPONSE_DEADLINE   | Pas de réponse + deadline | Time check     | DEADLINE_MISSED    | CRITICAL | ✅          |

---

**Fin du framework.**
Prêt pour : **Pipeline architecture** ou **Exemple notebook** ?
