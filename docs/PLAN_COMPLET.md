# 📋 PLAN COMPLET — MEMOLIB
**Version** : 1.0 | **Date** : 2026-07 | **Statut** : Référence opérationnelle

---

## 1. VISION PRODUIT

### Problème résolu
Les cabinets d'avocats perdent des dossiers, ratent des délais légaux et passent des heures à trier des emails. Une OQTF manquée = recours irrecevable = préjudice client.

### Promesse utilisateur
> **Zéro deadline manquée. Zéro email perdu. Zéro action irréversible sans validation humaine.**

### Valeur principale
Email reçu → dossier créé → deadline calculée → alertes automatiques → document généré. En moins de 2 minutes.

### Différenciation
- IA locale (Ollama) : données juridiques sensibles ne quittent jamais le réseau
- Audit trail chaîné (hash chain) : preuve légale irréfutable
- Co-adaptation : le système apprend des corrections sans jamais décider seul

---

## 2. PÉRIMÈTRE EXACT

### Emails pris en charge (MVP)
| Canal | Statut | Condition |
|-------|--------|-----------|
| Gmail (IMAP + OAuth) | ✅ Supporté | Compte connecté |
| Outlook / Microsoft 365 | ✅ Supporté | OAuth2 Graph API |
| Webhook inbound (SendGrid) | ✅ Supporté | DNS MX configuré |
| Emails texte + HTML | ✅ Supporté | Toujours |
| Pièces jointes PDF/DOCX/JPG | ✅ Supporté | < 10 MB |

### Exclus du périmètre MVP
- SMS, WhatsApp, appels téléphoniques
- Emails chiffrés S/MIME (déchiffrement non supporté)
- Pièces jointes > 10 MB
- Langues non-latines (arabe, chinois) — V2

---

## 3. PERSONAS ET RÔLES

| Rôle | Qui | Droits clés | Feature killer |
|------|-----|-------------|----------------|
| **SUPER_ADMIN** | Équipe MemoLib | Gestion plateforme cross-tenant | Monitoring global |
| **ADMIN** | Avocat titulaire | Tout le cabinet, facturation | Dashboard + analytics |
| **MANAGER** | Collaborateur senior | Supervision équipe, dossiers | Timeline + copilot |
| **LAWYER** | Avocat | Dossiers, IA, documents | Email → dossier 1 clic |
| **PARALEGAL** | Assistant juridique | Documents, support | Génération courriers |
| **SECRETARY** | Secrétaire | Emails, RDV, accueil | Inbox intelligente |
| **ACCOUNTANT** | Comptable | Facturation uniquement | Export comptable |
| **INTERN** | Stagiaire | Lecture seule | Consultation |
| **CLIENT** | Justiciable | Ses dossiers uniquement | Portail client |

### Règle d'accès absolue
Chaque requête filtre par `tenantId` + `role`. Aucun accès cross-tenant. HTTP 403 sinon.

---

## 4. CAS D'USAGE

### CU-01 : Email entrant avec action claire
```
Email reçu : "OQTF notifiée le 15/07/2026, délai 30 jours"
→ IA extrait : type=OQTF, deadline=14/08/2026, urgence=haute
→ Dossier créé (ou lié si existant)
→ Alertes J-7/J-3/J-1 programmées
→ Template recours contentieux pré-rempli proposé
```

### CU-02 : Email ambigu
```
Email reçu : "Suite à notre entretien, merci de bien vouloir..."
→ IA : confidence < 0.6, type=inconnu, deadline=non détectée
→ Alerte superviseur : "Email non classifié — action requise"
→ Avocat classe manuellement → système apprend
```

### CU-03 : Relance automatique
```
Dossier DOS-2026-042 : deadline J-7 atteinte, statut=en_attente
→ Email automatique avocat responsable
→ Si J-3 et toujours en_attente → SMS + email
→ Si J-1 → escalade MANAGER
→ Si dépassé → incident P2 + rapport automatique
```

### CU-04 : Deadline partagée entre plusieurs personnes
```
Dossier avec 2 avocats assignés
→ Alerte envoyée aux DEUX
→ Premier à acquitter = deadline marquée "prise en charge"
→ Audit log : qui a acquitté, quand
```

### CU-05 : Tâche bloquée par un tiers
```
Dossier en attente réponse préfecture
→ Avocat marque : "bloqué — attente externe"
→ Deadline suspendue (avec justification obligatoire)
→ Rappel automatique J+14 : "Toujours bloqué ?"
→ Audit log de la suspension
```

---

## 5. RÈGLES MÉTIER PRÉCISES

### 5.1 Définition d'une deadline

Une deadline est une **entité** (pas un calcul), avec :
- `dateEcheance` : date limite légale ou contractuelle
- `type` : `legal` | `judiciaire` | `contractuel` | `interne`
- `fondementLegal` : ex. "Art. L511-1 CESEDA"
- `status` : `actif` | `respecte` | `depasse` | `suspendu` | `annule`

### 5.2 Délais CESEDA de référence

| Type | Délai | Base légale |
|------|-------|-------------|
| OQTF 30 jours | 30 j | L511-1 CESEDA |
| OQTF 90 jours | 90 j | L511-1 CESEDA |
| Recours gracieux | 2 mois | Art. L411-2 CRPA |
| Recours contentieux TA | 2 mois | Art. R421-1 CJA |
| Appel CAA | 1 mois | Art. R811-2 CJA |
| Cassation CE | 2 mois | Art. R821-1 CJA |

### 5.3 Définition d'un retard

```
Retard = dateEcheance < now() AND status != 'respecte' AND status != 'annule'
```

### 5.4 Logique de relance

```
J-7 : Email avocat responsable
J-3 : Email + notification in-app (si non acquitté)
J-1 : SMS + Email + notification urgente
J+0 : Incident P2 automatique + rapport + escalade MANAGER
J+1 : Escalade ADMIN + notification client si applicable
```

### 5.5 Logique d'escalade

| Condition | Action | Délai |
|-----------|--------|-------|
| Email non traité | Notification ADMIN | 24h |
| Email non traité | Notification SUPER_ADMIN | 48h |
| Deadline J-3 non acquittée | SMS + Email ADMIN | Immédiat |
| Deadline dépassée | Incident P2 + rapport | Immédiat |
| 3 deadlines dépassées/mois | Alerte ADMIN + recommandation | Hebdo |

### 5.6 Gestion des cas ambigus

| Cas | Comportement |
|-----|-------------|
| Plusieurs deadlines dans un email | Toutes extraites, validation humaine pour chacune |
| Date implicite ("sous 15 jours") | IA calcule depuis date email, confidence affichée |
| Urgence non explicite | Priorité `normale` par défaut, avocat peut modifier |
| Absence de responsable | Assigné à l'ADMIN du tenant, alerte immédiate |
| Email sans dossier correspondant | Mis en "inbox non classée", alerte superviseur |

---

## 6. WORKFLOW COMPLET

```
[EMAIL REÇU]
     │
     ▼
[Déduplication SHA-256]
     │ doublon détecté → alerte + validation humaine
     │ unique → continuer
     ▼
[Analyse IA]
     │ confidence > 0.7 → suggestion automatique
     │ confidence < 0.7 → alerte "classification manuelle requise"
     ▼
[Validation humaine]
     │ accepte → créer/lier dossier
     │ corrige → créer/lier + enregistrer correction (learning)
     │ rejette → email archivé sans action
     ▼
[Création/mise à jour dossier]
     │
     ├─→ [Calcul deadlines automatique]
     │         │
     │         └─→ [Programmation alertes J-7/J-3/J-1]
     │
     ├─→ [Timeline mise à jour]
     │
     └─→ [Audit log]
              │
              ▼
         [Notification avocat responsable]
```

### Cycle de vie d'un dossier

```
NOUVEAU → EN_COURS → EN_ATTENTE → CLOS → ARCHIVE
              │            │
              └── URGENT ──┘ (peut être à tout moment)
```

### Clôture et archivage

- Clôture : avocat marque manuellement, toutes deadlines soldées
- Archivage : automatique après 6 mois de clôture (configurable)
- Conservation : 10 ans minimum (obligation légale)
- Suppression : uniquement via droit à l'oubli RGPD, avec audit

---

## 7. MODÈLE DE DONNÉES COMPLET

### Entités et relations

```
Tenant (1)
  └── User (N)
  └── Client (N)
        └── Dossier (N)
              └── Email (N)
              └── Document (N)
              └── Delai (N)
                    └── Notification (N)
              └── Evenement (N) ← timeline
  └── AuditLog (N)
  └── EmailAccount (N)
```

### Statuts Email

| Statut | Description |
|--------|-------------|
| `non_traite` | Reçu, pas encore analysé |
| `en_analyse` | IA en cours |
| `suggestion_pending` | Suggestion IA en attente validation |
| `lie_dossier` | Associé à un dossier |
| `archive` | Traité, archivé |
| `spam` | Marqué spam (validation humaine) |

### Statuts Dossier

| Statut | Description |
|--------|-------------|
| `ouvert` | Nouveau dossier |
| `en_cours` | Traitement actif |
| `en_attente` | Bloqué (tiers, documents manquants) |
| `urgent` | Deadline < J-3 |
| `clos` | Affaire terminée |
| `archive` | Conservation légale |

### Relation Email ↔ Tâche ↔ Utilisateur

```typescript
// Un email peut générer plusieurs tâches
Email → [Dossier, Delai, Document, Notification]

// Une tâche a un responsable et un historique
Delai {
  assignedTo: userId       // responsable principal
  createdFrom: emailId     // email source (si applicable)
  acknowledgedBy: userId   // qui a acquitté
  acknowledgedAt: DateTime
}
```

---

## 8. PARCOURS UX

### Vue Inbox intelligente
```
┌─────────────────────────────────────────────────────┐
│ 📬 INBOX                          [Filtres] [Trier] │
├─────────────────────────────────────────────────────┤
│ 🔴 URGENT  │ jean.dupont@pref.fr                    │
│            │ OQTF notifiée — délai 30j              │
│            │ IA: OQTF | Deadline: 14/08 | ✓ 94%    │
│            │ [Créer dossier] [Lier dossier] [Ignorer]│
├─────────────────────────────────────────────────────┤
│ 🟡 MOYEN   │ client@gmail.com                       │
│            │ Documents complémentaires              │
│            │ IA: titre séjour | Confiance: 61%      │
│            │ [Classifier manuellement]              │
└─────────────────────────────────────────────────────┘
```

### Vue Tâches / Deadlines
```
┌─────────────────────────────────────────────────────┐
│ ⏰ DEADLINES                                        │
├──────────┬──────────────────────────┬───────────────┤
│ 🔴 J-1   │ DOS-2026-042 — OQTF     │ [Acquitter]   │
│ 🟠 J-3   │ DOS-2026-038 — Recours  │ [Acquitter]   │
│ 🟡 J-7   │ DOS-2026-031 — Appel    │ [Voir]        │
│ ✅ OK    │ DOS-2026-025 — Conseil  │ 30j restants  │
└──────────┴──────────────────────────┴───────────────┘
```

### Vue Risques (ADMIN/MANAGER)
```
┌─────────────────────────────────────────────────────┐
│ ⚠️ TABLEAU DE RISQUES                               │
├─────────────────────────────────────────────────────┤
│ 2 deadlines dépassées ce mois                       │
│ 5 emails non classifiés > 24h                       │
│ 1 dossier sans responsable assigné                  │
│ 3 clients sans activité > 30j                       │
└─────────────────────────────────────────────────────┘
```

### Actions rapides de correction
- Reclassifier un email en 1 clic
- Modifier une deadline extraite par l'IA
- Réassigner un dossier à un autre avocat
- Marquer une deadline comme "bloquée externe"
- Fusionner deux dossiers (avec confirmation + audit)

---

## 9. NOTIFICATIONS ET RELANCES

### Canaux disponibles

| Canal | Usage | Configurable |
|-------|-------|-------------|
| Email | Toutes alertes | Oui (fréquence) |
| In-app | Temps réel | Oui (types) |
| SMS | Urgences J-1 uniquement | Oui (opt-in) |
| Webhook | Intégrations externes | Oui |

### Règles anti-spam

- Maximum 3 notifications/jour/dossier par canal email
- Regroupement : si 5+ alertes simultanées → 1 digest
- Silence nocturne : 22h-8h (sauf P1 critique)
- Préférence utilisateur : configurable par rôle

### Priorisation

```
P0 (immédiat) : Deadline dépassée, incident sécurité
P1 (< 1h)     : Deadline J-1, email non traité 48h
P2 (< 4h)     : Deadline J-3, suggestion en attente > 24h
P3 (quotidien): Digest récapitulatif, stats hebdo
```

---

## 10. KPI PRODUIT

### Deadlines

| KPI | Cible MVP | Cible V1 |
|-----|-----------|----------|
| Taux deadlines respectées | > 95% | > 99% |
| Délai moyen prise en charge email | < 30 min | < 10 min |
| Taux deadlines dépassées | < 5% | < 1% |
| Taux d'escalade | < 10% | < 3% |

### IA et automatisation

| KPI | Cible MVP | Cible V1 |
|-----|-----------|----------|
| Taux de classification correcte | > 80% | > 92% |
| Taux de faux positifs (deadline) | < 15% | < 5% |
| Taux de suggestions validées sans correction | > 65% | > 80% |
| Taux d'emails auto-classifiés | > 60% | > 85% |

### Qualité

| KPI | Cible |
|-----|-------|
| Zéro perte de données | 100% |
| Couverture audit trail | 100% |
| Uptime | > 99.5% |
| Temps réponse API P95 | < 500ms |

---

## 11. SÉCURITÉ ET CONFORMITÉ

### Accès boîte mail

- OAuth2 uniquement (jamais mot de passe stocké)
- Scopes minimaux : lecture seule + envoi si nécessaire
- Révocation possible à tout moment depuis l'interface
- Audit de chaque connexion IMAP/API

### Consentement et RGPD

- Consentement explicite requis pour données "spéciales" (origine, santé, casier)
- Droit à l'oubli : suppression complète (pas juste anonymisation) sur demande
- Export données client : format JSON/PDF en < 72h
- DPA (Data Processing Agreement) signé avec chaque cabinet

### Conservation

| Type de données | Durée | Base légale |
|----------------|-------|-------------|
| Dossiers contentieux | 10 ans | Obligation légale |
| Emails liés à dossier | 10 ans | Obligation légale |
| Audit logs | 10 ans | RGPD + conformité |
| Données de connexion | 1 an | CNIL |
| Données anonymisées | Illimité | Statistiques |

### Chiffrement

- At-rest : AES-256-GCM (documents + emails sensibles)
- In-transit : TLS 1.3 minimum
- Passwords : bcrypt cost 12
- Audit chain : SHA-256 hash chain (chaque entrée hash la précédente)

### Traçabilité

Chaque action sensible génère un AuditLog avec :
- `userId`, `tenantId`, `action`, `entityId`
- `ipAddress`, `userAgent`
- `previousHash` + `hash` (chaîne inviolable)
- Vérification intégrité : `GET /api/audit/verify-all`

---

## 12. STRATÉGIE D'APPRENTISSAGE

### Principe : co-adaptation (jamais autonome)

```
Avocat corrige suggestion IA
         │
         ▼
Correction enregistrée (LearningEntry)
         │
         ▼
Si 3+ corrections similaires → pattern détecté
         │
         ▼
Système PROPOSE ajustement (pas impose)
         │
    ┌────┴────┐
    │         │
Accepte    Refuse
    │         │
Ajustement  Rien ne change
appliqué    (correction ignorée)
```

### Ce qui est appris

- Corrections de classification (type dossier)
- Corrections de deadline extraite
- Corrections de priorité
- Associations email → dossier rejetées

### Ce qui n'est jamais appris automatiquement

- Règles de délais légaux (immuables)
- Permissions RBAC
- Règles de chiffrement
- Logique d'audit trail

### Fichiers concernés

```
src/lib/ai/learning-service.ts    → Enregistrement corrections
src/lib/ai/ai-cache.ts            → Cache requêtes identiques
src/lib/ai/hybrid-client.ts       → Routing provider optimal
```

---

## 13. ROADMAP OPÉRATIONNELLE

### MVP — Mois 1-3 (fondations)
**Objectif** : 10 cabinets pilotes, 0 deadline manquée

- [x] Auth + RBAC 9 rôles
- [x] Gestion clients + dossiers
- [x] Email → Dossier 1 clic
- [x] Délais légaux + alertes J-7/J-3/J-1
- [x] Génération documents (6 templates)
- [x] Audit trail chaîné
- [ ] Plugin Gmail natif (acquisition organique)
- [ ] Onboarding < 5 min

### V1 — Mois 4-6 (expérience complète)
**Objectif** : 50 cabinets payants, NPS > 40

- [ ] OCR documents (photo courrier → données)
- [ ] Portail client (upload + suivi)
- [ ] Signature électronique (Yousign)
- [ ] Sync Google Calendar bidirectionnel
- [ ] Dashboard financier (CA, marges)
- [ ] Notification SMS urgences

### V2 — Mois 7-12 (automatisation avancée)
**Objectif** : 200 cabinets, MRR 10K€

- [ ] Agents IA autonomes (suivi procédure)
- [ ] Intégration Télérecours (TA/CAA)
- [ ] Application mobile React Native
- [ ] Multi-région (Belgique, Suisse)
- [ ] Rédaction complète de recours (IA)

---

## 14. RISQUES ET LIMITES

| Risque | Probabilité | Impact | Mitigation |
|--------|-------------|--------|------------|
| IA extrait mauvaise deadline | Moyen | Critique | Validation humaine obligatoire + confidence score |
| Email non reçu (IMAP fail) | Faible | Critique | Retry + alerte + fallback webhook |
| Deadline manquée malgré alertes | Faible | Critique | Multi-canal + escalade automatique |
| Fuite données cabinet | Très faible | Critique | Chiffrement E2E + audit + pentest |
| Non-adoption avocat | Moyen | Élevé | Onboarding guidé + support dédié |
| Ollama indisponible | Moyen | Moyen | Fallback regex toujours actif |
| Surcharge tokens IA | Moyen | Faible | Budget guard + cache + routing |

### Limites connues

- L'IA ne remplace pas le jugement juridique de l'avocat
- Les délais calculés sont indicatifs — l'avocat reste responsable
- L'OCR peut échouer sur documents manuscrits ou dégradés
- La recherche sémantique nécessite Ollama actif (fallback full-text sinon)

---

## 15. DÉCISIONS À PRENDRE AVANT DE CODER

### 1. Qui reçoit quoi
- Email → assigné à l'avocat responsable du dossier lié
- Si pas de dossier → assigné à l'ADMIN du tenant
- Si ADMIN absent → alerte MANAGER

### 2. Comment l'IA décide
- Confidence > 0.7 → suggestion affichée (validation requise)
- Confidence 0.4-0.7 → suggestion avec avertissement
- Confidence < 0.4 → classification manuelle requise, pas de suggestion

### 3. Quand une tâche est créée
- Email lié à un dossier existant → tâche créée automatiquement
- Email sans dossier → tâche créée APRÈS validation humaine de l'association
- Upload document → tâche créée si deadline détectée dans le document

### 4. Quand une relance part
- J-7 : si deadline `actif` et `acknowledgedAt` est null
- J-3 : si deadline `actif` et `acknowledgedAt` est null
- J-1 : si deadline `actif` et `acknowledgedAt` est null
- Pas de relance si : `suspendu`, `respecte`, `annule`

### 5. Quand une escalade se déclenche
- Deadline dépassée → escalade immédiate vers MANAGER
- Email non traité 24h → escalade vers ADMIN
- Email non traité 48h → escalade vers SUPER_ADMIN
- 3 deadlines dépassées en 30j → rapport automatique + recommandation

---

*Document de référence — toute modification doit être tracée et validée*
*Liens : [PRD.md](./PRD.md) | [BUSINESS_RULES.md](./BUSINESS_RULES.md) | [DATA_MODEL.md](./DATA_MODEL.md) | [ROADMAP.md](./ROADMAP.md)*
