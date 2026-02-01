# 🗺️ ROADMAP MVP 90 JOURS — MEMO LIB

**Version** : 1.0
**Date de départ** : 1er février 2026
**Date cible MVP** : 1er mai 2026
**Équipe** : 2 développeurs full-stack + 1 product owner

---

## 🎯 OBJECTIF MVP

Livrer un produit **minimal mais complet** permettant de :

1. ✅ Capturer 100% des emails entrants
2. ✅ Fournir une traçabilité légale irréfutable
3. ✅ Assister (sans décider) l'humain dans la classification
4. ✅ Détecter et alerter sur les doublons
5. ✅ Prouver la valeur (métriques + export PDF)

**Critère de succès** : Démo convaincante pour appel d'offres État.

---

## 📅 PLANNING PAR PHASE

### Vue d'ensemble

| Phase        | Dates     | Objectif          | Livrables clés                       |
| ------------ | --------- | ----------------- | ------------------------------------ |
| **Phase 0**  | J-7 → J0  | Préparation       | Environnements, design DB, maquettes |
| **Phase 1**  | J1 → J30  | Fondations        | EventLog, normalisation, hash        |
| **Phase 2**  | J31 → J60 | Intelligence      | IA suggestions, validation humaine   |
| **Phase 3**  | J61 → J90 | Conformité        | Audit, métriques, export PDF         |
| **Post-MVP** | J91+      | Industrialisation | Scaling, multi-canal                 |

---

## 🛠️ PHASE 0 : PRÉPARATION (J-7 → J0)

**Objectif** : Partir sur des bases solides sans dette technique.

### Tâches

#### 1. Environnements

- [x] Dev container configuré (existant)
- [x] CI/CD GitHub Actions (existant)
- [ ] Environnement staging Azure (à créer)
- [ ] Secrets Azure Key Vault (à configurer)

#### 2. Base de données

- [ ] **Schéma Prisma MVP** : Tables `EventLog`, `IncomingFlow`, `NormalizedFlow`, `DuplicateAlert`, `Suggestion`
- [ ] **Migrations** : Scripts de migration testés
- [ ] **Triggers** : Immuabilité EventLog, rawContent

#### 3. Design & UX

- [ ] **Maquettes Figma** : Dashboard supervision, timeline, alertes doublons
- [ ] **Design system** : Composants réutilisables (alertes, boutons validation)

#### 4. Documentation

- [x] PRODUCT_SPEC.md (créé)
- [x] BUSINESS_RULES.md (créé)
- [x] FEATURE_MAPPING.md (créé)
- [ ] API documentation (Swagger/OpenAPI)

### Critères de validation

- [ ] Environnement staging déployé
- [ ] DB schema validé par équipe
- [ ] Maquettes approuvées par PO

---

## 🏗️ PHASE 1 : FONDATIONS (J1 → J30)

**Objectif** : Infrastructure critique pour traçabilité et immuabilité.

### Semaine 1 (J1-J7) : EventLog immuable

#### Backend

- [ ] **Table EventLog** : Créer + trigger immuabilité
  - Fichier : `prisma/schema.prisma`
  - Test : `tests/eventlog.test.ts`

- [ ] **Service EventLog** : `src/backend/services/audit/event_log.py`
  - Fonction `createEventLog(type, metadata)`
  - Calcul checksum SHA-256
  - Tests unitaires

- [ ] **API EventLog** : `GET /api/audit/timeline/:entityId`
  - Endpoint Next.js : `src/frontend/app/api/audit/timeline/[id]/route.ts`
  - Retourne EventLog chronologique
  - Test E2E

#### Frontend

- [ ] **Composant Timeline** : `src/frontend/components/audit/AuditTimeline.tsx`
  - Affichage chronologique
  - Filtres : type événement, utilisateur, période
  - Icônes par type d'événement

- [ ] **Page Timeline** : `src/frontend/app/audit/[entityId]/page.tsx`
  - Intégration composant
  - Loading states

#### Tests

- [ ] Test unitaire : Trigger immuabilité EventLog
- [ ] Test E2E : Création événement + vérification timeline

**Livrable** : ✅ EventLog immuable fonctionnel avec UI basique

---

### Semaine 2 (J8-J14) : Normalisation & Hash

#### Backend

- [ ] **Service Normalisation** : `src/lib/email/normalizer.ts`
  - Fonction `normalizeFlow(rawFlow)`
  - Extraction métadonnées structurées
  - Calcul hash SHA-256 du contenu

- [ ] **Table NormalizedFlow** : Prisma schema
  - FK vers `IncomingFlow`
  - Champs `metadata`, `textContent`, `contentHash`

- [ ] **Enrichir ingestion email** : `src/lib/email/gmail-monitor.ts`
  - Appeler `normalizeFlow()` après réception
  - Créer EventLog `flow.normalized`

#### Frontend

- [ ] **Vue flux détaillée** : `src/frontend/app/flows/[id]/page.tsx`
  - Afficher rawContent vs normalizedContent
  - Copier contentHash (bouton clipboard)

#### Tests

- [ ] Test : Deux flux identiques → même hash
- [ ] Test : Normalisation préserve rawContent

**Livrable** : ✅ Flux normalisés avec hash cryptographique

---

### Semaine 3 (J15-J21) : Supervision basique

#### Backend

- [ ] **Endpoint alertes SLA** : `GET /api/supervision/alerts`
  - Flux > 24h non classés
  - Suggestions > 48h non résolues
  - Cron job : Vérification toutes les heures

#### Frontend

- [ ] **Dashboard supervision** : `src/frontend/app/supervision/page.tsx`
  - Widget alertes (badges rouges)
  - Liste flux non classés
  - Actions rapides : "Classifier maintenant"

- [ ] **Composant AlertBadge** : `src/frontend/components/supervision/AlertBadge.tsx`
  - Badge numérique avec couleur (rouge = critique)

#### Tests

- [ ] Test : Flux > 24h génère alerte
- [ ] Test E2E : Dashboard affiche alertes

**Livrable** : ✅ Dashboard supervision temps réel

---

### Semaine 4 (J22-J30) : Refactoring & stabilisation

#### Tâches

- [ ] **Refactoring** : Clean code, optimisations requêtes DB
- [ ] **Documentation API** : Swagger génération auto
- [ ] **Tests de charge** : Ingestion 1000 flux/jour
- [ ] **Sécurité** : Scan Snyk/Dependabot
- [ ] **Démo interne** : Présentation à l'équipe

#### Critères de validation Phase 1

- [ ] 100% règles P0 implémentées (RULE-001 à RULE-006)
- [ ] Tests passent (unitaires + E2E)
- [ ] Performance : < 1s réception → normalisation
- [ ] Aucune perte de données (test charge)

**Livrable** : ✅ Fondations solides validées

---

## 🧠 PHASE 2 : INTELLIGENCE (J31 → J60)

**Objectif** : Suggestions IA + validation humaine.

### Semaine 5 (J31-J37) : Classification IA

#### Backend

- [ ] **Service Classification** : `src/backend/services/ai/classifier.py`
  - Utiliser Ollama/LLaMA existant
  - Fonction `classifyFlow(normalizedFlow)` → { category, confidence }
  - Seuil confiance minimum : 0.7

- [ ] **Enrichir normalisation** : Appeler classification après normalisation
  - Créer EventLog `flow.classified`

#### Frontend

- [ ] **Badge confiance** : Afficher score IA (0-100%)
  - Couleur : vert (>90%), orange (70-90%), rouge (<70%)

#### Tests

- [ ] Test : Classification retourne score cohérent
- [ ] Test : Flux similaires → catégories identiques

**Livrable** : ✅ Classification IA avec score de confiance

---

### Semaine 6 (J38-J44) : Suggestions & validation

#### Backend

- [ ] **Table Suggestion** : Prisma schema
  - Champs : `suggestedDossierId`, `confidence`, `reasoning`, `status`

- [ ] **Service Suggestions** : `src/backend/services/ai/suggestions.py`
  - Fonction `generateSuggestions(flowId)`
  - Détection entités (noms, emails) via NER
  - Matching avec dossiers existants

- [ ] **API Suggestions** :
  - `GET /api/flows/:id/suggestions` : Liste suggestions
  - `POST /api/suggestions/:id/validate` : Valider/rejeter

#### Frontend

- [ ] **Composant SuggestionCard** : `src/frontend/components/flows/SuggestionCard.tsx`
  - Affichage suggestion + confiance
  - Boutons "Valider" / "Rejeter"
  - Champ texte "Raison du rejet"

- [ ] **Intégration flux détaillée** : Afficher suggestions si `status=pending`

#### Tests

- [ ] Test : Validation crée EventLog `user.validated_suggestion`
- [ ] Test E2E : Workflow complet validation suggestion

**Livrable** : ✅ Workflow validation humaine fonctionnel

---

### Semaine 7 (J45-J51) : Détection doublons

#### Backend

- [ ] **Service Doublons** : `src/backend/services/deduplication/detector.py`
  - Fonction `detectDuplicates(flowId)`
  - Détection hash exact
  - (Post-MVP : Levenshtein pour similarité)

- [ ] **Table DuplicateAlert** : Prisma schema
  - Champs : `entity1Id`, `entity2Id`, `similarityScore`, `status`

- [ ] **API Doublons** :
  - `GET /api/duplicates/pending` : Alertes non résolues
  - `POST /api/duplicates/:id/resolve` : Fusionner/Ignorer

#### Frontend

- [ ] **Composant DuplicateAlert** : `src/frontend/components/duplicates/DuplicateAlert.tsx`
  - Affichage côte-à-côte des deux flux
  - Boutons "Fusionner" / "Ignorer"

- [ ] **Page Doublons** : `src/frontend/app/duplicates/page.tsx`
  - Liste alertes doublons
  - Tri par similarité

#### Tests

- [ ] Test : Hash identique génère DuplicateAlert
- [ ] Test : Fusion conserve les deux flux

**Livrable** : ✅ Détection et résolution doublons

---

### Semaine 8 (J52-J60) : Commentaires internes

#### Backend

- [ ] **Table Comment** : Prisma schema
  - Champs : `flowId`, `userId`, `content`, `createdAt`
  - Trigger immuabilité

- [ ] **API Commentaires** :
  - `GET /api/flows/:id/comments`
  - `POST /api/flows/:id/comments`

#### Frontend

- [ ] **Thread Commentaires** : `src/frontend/components/flows/CommentThread.tsx`
  - Affichage chronologique
  - Formulaire ajout commentaire
  - Avatar utilisateur + horodatage

#### Tests

- [ ] Test : Commentaire créé est immutable
- [ ] Test E2E : Ajout commentaire + refresh

**Livrable** : ✅ Collaboration interne fonctionnelle

---

## 📊 PHASE 3 : CONFORMITÉ (J61 → J90)

**Objectif** : Audit, métriques, et preuves légales.

### Semaine 9 (J61-J67) : Journal d'accès

#### Backend

- [ ] **Middleware Audit** : `src/backend/middleware/access_logger.py`
  - Intercepter toutes requêtes API sensibles
  - Créer EventLog `access.viewed_flow`, `access.downloaded_attachment`

- [ ] **IP & User-Agent** : Capturer dans metadata EventLog

#### Frontend

- [ ] **Page Journal d'accès** : `src/frontend/app/audit/access-log/page.tsx`
  - Table : Date, Utilisateur, Action, IP
  - Filtres : Période, utilisateur, type accès

#### Tests

- [ ] Test : Consultation flux crée EventLog
- [ ] Test : Téléchargement PJ tracé

**Livrable** : ✅ Traçabilité accès complète

---

### Semaine 10 (J68-J74) : Métriques valeur

#### Backend

- [ ] **Service Métriques** : `src/backend/services/metrics/value_calculator.py`
  - Fonction `calculateMetrics(tenantId, period)`
  - Calculs :
    - Temps moyen traitement
    - Taux précision IA
    - Nombre doublons évités
    - Heures gagnées (estimation)

- [ ] **API Métriques** : `GET /api/metrics/value`

#### Frontend

- [ ] **Dashboard Métriques** : `src/frontend/app/metrics/page.tsx`
  - Cartes KPI (grandes valeurs)
  - Graphiques évolution temporelle
  - Export CSV

#### Tests

- [ ] Test : Calcul temps moyen correct
- [ ] Test : Métriques actualisées temps réel

**Livrable** : ✅ Dashboard métriques business

---

### Semaine 11 (J75-J81) : Export PDF timeline

#### Backend

- [ ] **Service Export PDF** : `src/backend/services/audit/pdf_exporter.py`
  - Librairie : `pdfkit` ou `puppeteer`
  - Génération PDF avec :
    - EventLog chronologique
    - Checksums
    - Métadonnées export (date, utilisateur)

- [ ] **Signature numérique** : Hash PDF + timestamp serveur

- [ ] **API Export** : `POST /api/audit/export/pdf`

#### Frontend

- [ ] **Bouton Export** : `src/frontend/components/audit/ExportAuditButton.tsx`
  - Modal confirmation
  - Téléchargement automatique

#### Tests

- [ ] Test : PDF généré est valide (PDF/A)
- [ ] Test : Checksums vérifiables

**Livrable** : ✅ Export PDF conforme normes

---

### Semaine 12 (J82-J90) : Recherche & Démo finale

#### Backend

- [ ] **Full-text search** : PostgreSQL `tsvector`
  - Index sur `NormalizedFlow.textContent`
  - Fonction `searchFlows(query)` avec ranking BM25

- [ ] **API Recherche** : `GET /api/search?q=...`

#### Frontend

- [ ] **Barre de recherche globale** : `src/frontend/components/search/GlobalSearch.tsx`
  - Autocomplete
  - Snippets mis en évidence
  - Tri pertinence / date

#### Tests

- [ ] Test : Recherche retourne résultats pertinents
- [ ] Test E2E : Workflow recherche complet

#### Préparation démo

- [ ] **Données de démo** : Jeu de données réaliste (emails types)
- [ ] **Script démo** : Scénario guidé (ingestion → suggestions → export PDF)
- [ ] **Support présentation** : Slides pitch

**Livrable** : ✅ MVP complet + démo État-ready

---

## 📦 LIVRABLES MVP

### Fonctionnels

- [x] Monitoring email (Gmail API)
- [ ] EventLog immuable avec timeline UI
- [ ] Normalisation avec hash SHA-256
- [ ] Classification IA + suggestions validables
- [ ] Détection doublons hash exact
- [ ] Supervision dashboard avec alertes
- [ ] Commentaires internes
- [ ] Journal d'accès complet
- [ ] Métriques valeur
- [ ] Export PDF timeline
- [ ] Recherche full-text

### Techniques

- [ ] Code coverage > 80%
- [ ] Documentation API Swagger
- [ ] CI/CD avec tests automatisés
- [ ] Déploiement staging Azure
- [ ] Monitoring Sentry configuré

### Business

- [ ] Jeu de données démo
- [ ] Script pitch État
- [ ] ROI calculé (heures gagnées)

---

## 🚀 POST-MVP (J91+)

### Priorités court terme (J91-J120)

1. **Upload manuel horodaté** : Interface drag & drop
2. **Multi-canal** : WhatsApp (via Twilio)
3. **Doublons similarité** : Levenshtein pour quasi-doublons
4. **API REST publique** : Pour intégrations tierces

### Priorités moyen terme (J121-J180)

5. **Roles granulaires** : RBAC avancé
6. **Multi-tenant avancé** : Isolation renforcée
7. **OCR pièces jointes** : Recherche dans PDFs scannés
8. **Notifications push** : Real-time via WebSockets

---

## ⚠️ RISQUES & MITIGATIONS

| Risque                           | Impact   | Probabilité | Mitigation                      |
| -------------------------------- | -------- | ----------- | ------------------------------- |
| **Perf ingestion > 1000 flux/j** | 🔴 Haut  | Moyen       | Tests de charge dès phase 1     |
| **Classification IA imprécise**  | 🟠 Moyen | Moyen       | Validation humaine obligatoire  |
| **DB triggers complexes**        | 🟠 Moyen | Faible      | Tests unitaires exhaustifs      |
| **Export PDF non conforme**      | 🔴 Haut  | Faible      | Validation par expert juridique |
| **Retard développement**         | 🟠 Moyen | Moyen       | Buffer 10j avant démo État      |

---

## 📈 INDICATEURS DE SUIVI

### Weekly KPIs

- **Vélocité** : Story points complétés / semaine
- **Qualité** : Tests passants / total
- **Blockers** : Nombre de tickets bloqués

### Phase Gates

- **Phase 1** : EventLog + normalisation OK → GO Phase 2
- **Phase 2** : Suggestions + doublons OK → GO Phase 3
- **Phase 3** : Métriques + export PDF OK → GO Démo

---

## 🎯 CRITÈRES DE SUCCÈS FINAL

### Démonstration État (J90)

- [ ] Scénario complet : Email → Suggestion → Validation → Export PDF (< 5 min)
- [ ] Questions/réponses conformité : Preuve traçabilité, RGPD
- [ ] ROI démontré : "X heures gagnées par mois"

### Métriques produit

- [ ] 0 perte de données (test charge 10 000 flux)
- [ ] < 2s temps réponse API (p95)
- [ ] > 85% précision IA (validation manuelle sur 100 flux)
- [ ] 100% EventLog immuables (test automated)

### Business

- [ ] Budget infra < 500€/mois Azure
- [ ] Équipe formée (documentation + knowledge transfer)
- [ ] Roadmap post-MVP validée

---

## 📞 CONTACT & GOUVERNANCE

**Product Owner** : À définir
**Lead Dev Backend** : À définir
**Lead Dev Frontend** : À définir

**Rituels** :

- Daily standup : 9h30 (15 min)
- Sprint planning : Lundi matin (2h)
- Démo hebdo : Vendredi 16h (1h)
- Rétrospective : Vendredi 17h (30 min)

**Outils** :

- Kanban : GitHub Projects
- Documentation : `/docs` (ce repo)
- Communication : Slack #memolib-mvp

---

**Dernière mise à jour** : 1er février 2026
**Statut** : 🟢 En cours (Phase 0 en finalisation)
