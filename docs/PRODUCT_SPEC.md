# 📋 SPÉCIFICATION FONCTIONNELLE OFFICIELLE — MEMO LIB

**Version** : 1.0
**Date** : 1er février 2026
**Statut** : Document de référence produit

---

## 🎯 DÉFINITION DU PRODUIT

### Nom commercial

**Memo Lib** (anciennement IAPosteManager)

### Positionnement

**Assistant de mémoire et de supervision pour la gestion de flux informationnels sensibles.**

### Proposition de valeur unique

> Memo Lib **observe, mémorise et rend visible** l'ensemble des flux d'information
> sans jamais décider à la place d'un humain.

### Marché cible

- **Primaire** : Cabinets d'avocats, notaires, administrations publiques
- **Secondaire** : PME avec conformité stricte (RGPD, ISO 27001)
- **Tertiaire** : Associations, ONG (gestion de dossiers sensibles)

---

## 🧩 FONCTIONNALITÉS PRODUIT

### Vue d'ensemble

| #   | Fonctionnalité                  | Valeur apportée              | Priorité MVP |
| --- | ------------------------------- | ---------------------------- | ------------ |
| 1   | Monitoring des flux (ingestion) | Capture exhaustive           | P0           |
| 2   | Normalisation                   | Uniformité et exploitabilité | P0           |
| 3   | Traçabilité (EventLog immuable) | Preuve légale                | P0           |
| 4   | Regroupement (dossiers/entités) | Organisation intelligente    | P1           |
| 5   | Gestion des doublons            | Fiabilité des données        | P0           |
| 6   | Supervision humaine             | Conformité et responsabilité | P0           |
| 7   | Recherche & relecture           | Accès rapide à l'historique  | P1           |
| 8   | Sécurité & droits               | Protection et audit          | P0           |
| 9   | Métriques de valeur             | Justification investissement | P2           |

---

## 1️⃣ MONITORING DES FLUX (Ingestion)

### Objectif

Capturer **tous** les flux entrants sans exception, quel que soit le canal.

### Canaux supportés

#### Email (MVP)

- **Protocole** : IMAP/Gmail API
- **Fréquence** : Polling 30s ou push via webhooks
- **Contenu capturé** :
  - Métadonnées complètes (From, To, Cc, Bcc, Date, MessageID)
  - Corps texte et HTML
  - Pièces jointes (fichiers bruts + métadonnées)

#### Upload manuel (Post-MVP)

- **Interface** : Drag & drop ou formulaire
- **Horodatage** : Timestamp serveur + hash cryptographique
- **Traçabilité** : Enregistrement de l'utilisateur ayant uploadé

#### API REST (Post-MVP)

- **Endpoint** : `POST /api/v1/flows/ingest`
- **Auth** : API Key + OAuth2
- **Rate limiting** : 1000 req/min par tenant

### Comportements

#### ✅ Règles métier

1. **Capture exhaustive** : Aucun flux entrant n'est ignoré
2. **Immuabilité source** : Le contenu original est stocké tel quel
3. **Traçabilité entrée** : Chaque réception génère un `EventLog`

#### ❌ Ce que le système ne fait PAS

- Ne filtre JAMAIS automatiquement (sauf spam évident avec validation humaine)
- Ne supprime JAMAIS un flux (soft delete uniquement, avec audit)
- Ne modifie JAMAIS le contenu source

### Modèle de données

```typescript
interface IncomingFlow {
  id: string; // UUID
  receivedAt: Date; // Horodatage serveur
  channel: 'email' | 'upload' | 'api';
  sourceMetadata: Record<string, any>; // Métadonnées brutes
  rawContent: string | Buffer; // Contenu brut (immuable)
  contentHash: string; // SHA-256 du contenu
  tenantId: string; // Multi-tenant
  createdBy?: string; // Pour upload manuel
}
```

### Critères d'acceptation

- [ ] Un email reçu apparaît dans l'interface en moins de 1 minute
- [ ] Les pièces jointes sont téléchargeables immédiatement
- [ ] Le contenu original est accessible à tout moment
- [ ] L'horodatage de réception est juridiquement fiable (norme RFC 3161 si possible)

---

## 2️⃣ NORMALISATION

### Objectif

Transformer les flux bruts en données structurées **exploitables** sans altérer l'original.

### Processus

#### Extraction de métadonnées

Pour un email :

- **Expéditeur** : Nom + adresse email + parsing domaine
- **Destinataires** : To, Cc, Bcc (liste complète)
- **Horodatage** : Date envoi (header) + date réception (serveur)
- **Thread** : MessageID + In-Reply-To + References
- **Type document** : Classification IA (facture, contrat, demande, etc.)

#### Conversion format interne

- **Texte** : UTF-8 normalisé
- **HTML** : Sanitized (XSS prevention) + extraction texte
- **Pièces jointes** : Stockage Blob + métadonnées séparées

#### Hashing cryptographique

- **Algorithme** : SHA-256
- **Portée** : Contenu brut complet (headers + body + attachments)
- **Usage** : Détection doublons + preuve d'intégrité

### Comportements

#### ✅ Règles métier

1. **Non-destructif** : Toute transformation crée une **version dérivée**
2. **Traçabilité** : Chaque normalisation est loguée (EventLog)
3. **Réversibilité** : On peut toujours revenir au contenu original

#### ❌ Ce que le système ne fait PAS

- Ne supprime JAMAIS les données originales
- Ne modifie PAS les métadonnées sans consentement utilisateur
- N'applique PAS de transformations irréversibles

### Modèle de données

```typescript
interface NormalizedFlow {
  id: string;
  flowId: string; // Référence IncomingFlow
  normalizedAt: Date;
  metadata: {
    sender: { name: string; email: string; domain: string };
    recipients: Array<{ type: 'to' | 'cc' | 'bcc'; email: string }>;
    timestamp: Date;
    threadId?: string;
    documentType?: string; // Classification IA
  };
  textContent: string; // Extraction texte
  attachments: Array<{
    filename: string;
    mimeType: string;
    size: number;
    blobUrl: string;
    hash: string;
  }>;
  contentHash: string; // Hash global
  confidence?: number; // Score IA (0-1)
}
```

### Critères d'acceptation

- [ ] Un flux normalisé est disponible en moins de 5 secondes après ingestion
- [ ] Le hash est identique pour deux flux strictement identiques
- [ ] La classification IA a un taux de précision > 85% (mesurable)
- [ ] Les métadonnées sont modifiables manuellement avec audit

---

## 3️⃣ TRAÇABILITÉ (EventLog Immuable)

### Objectif

Fournir une **preuve légale irréfutable** de toutes les actions sur les données.

### Concept

Un **EventLog** est un journal d'événements **append-only** (jamais modifié, jamais supprimé) qui enregistre chaque action significative du système et des utilisateurs.

### Événements tracés

#### Événements système

- `flow.received` : Flux entrant capturé
- `flow.normalized` : Normalisation effectuée
- `flow.classified` : Classification IA appliquée
- `duplicate.detected` : Doublon potentiel identifié

#### Événements utilisateur

- `user.assigned_flow` : Assignation manuelle à un dossier
- `user.validated_suggestion` : Validation/rejet suggestion IA
- `user.merged_duplicates` : Fusion de doublons
- `user.added_comment` : Commentaire interne ajouté
- `user.exported_audit` : Export timeline PDF

#### Événements sécurité

- `access.viewed` : Consultation d'un flux sensible
- `access.downloaded` : Téléchargement pièce jointe
- `permission.changed` : Modification droits utilisateur

### Comportements

#### ✅ Règles métier **ABSOLUES**

1. **Immuabilité** : Un événement créé ne peut JAMAIS être modifié ou supprimé
2. **Exhaustivité** : TOUTE action significative est tracée
3. **Chronologie** : Les événements sont ordonnés par timestamp serveur (monotone)
4. **Attribution** : Chaque événement humain est lié à un userId
5. **Contexte** : Les métadonnées contextuelles sont capturées (IP, user-agent, etc.)

#### ❌ Ce que le système ne fait PAS

- Ne permet PAS d'éditer rétroactivement un événement
- Ne permet PAS de "cacher" un événement (même pour l'admin)
- N'autorise PAS la suppression d'événements (sauf conformité RGPD avec audit séparé)

### Modèle de données

```typescript
interface EventLog {
  id: string; // UUID
  timestamp: Date; // Horodatage serveur (monotone)
  eventType: string; // Ex: 'flow.received', 'user.assigned_flow'

  // Entité concernée
  entityType: 'flow' | 'dossier' | 'client' | 'document';
  entityId: string;

  // Acteur (utilisateur ou système)
  actorType: 'user' | 'system' | 'ai';
  actorId?: string; // userId si actorType = 'user'

  // Contexte
  metadata: {
    ip?: string;
    userAgent?: string;
    tenantId: string;
    before?: any; // État avant (pour modifications)
    after?: any; // État après
    reason?: string; // Justification (pour actions sensibles)
  };

  // Immuabilité
  immutable: true; // Toujours true (contrainte DB)
  checksum: string; // Hash de l'événement (intégrité)
}
```

### Interfaces utilisateur

#### Timeline chronologique

- Vue par entité (flux, dossier, client)
- Filtres : type événement, période, utilisateur
- Export PDF avec signature numérique

#### Audit trail global

- Vue admin : tous événements système
- Recherche full-text
- Alertes sur événements sensibles (accès données sensibles)

### Critères d'acceptation

- [ ] Aucun événement ne peut être supprimé (contrainte DB testée)
- [ ] Un événement est créé en moins de 100ms
- [ ] L'export PDF timeline est conforme aux normes juridiques (NF Z42-013)
- [ ] Les checksums sont vérifiables pour détecter toute altération

---

## 4️⃣ REGROUPEMENT (Dossiers & Entités)

### Objectif

Organiser les flux en **dossiers** et **entités** (clients, affaires) de manière **assistée par IA** mais **validée par l'humain**.

### Concepts

#### Dossier

Regroupement logique de flux liés à une même affaire/sujet.

#### Entité

Personne physique, morale ou organisation mentionnée dans les flux.

### Processus

#### 1. Détection automatique (IA)

L'IA analyse chaque flux normalisé et génère des **suggestions** :

- "Ce flux semble lié au dossier #123 (confiance 87%)"
- "Nouvelle entité détectée : Jean Dupont (jean.dupont@example.com)"

#### 2. Validation humaine **OBLIGATOIRE**

L'utilisateur doit **explicitement** :

- ✅ Accepter la suggestion
- ❌ Rejeter la suggestion
- ✏️ Corriger et valider

#### 3. Traçabilité décision

Chaque validation/rejet génère un `EventLog` :

```json
{
  "eventType": "user.validated_suggestion",
  "metadata": {
    "suggestionId": "uuid",
    "aiConfidence": 0.87,
    "userDecision": "accepted",
    "reason": "Correspondance email confirmée"
  }
}
```

### Comportements

#### ✅ Règles métier

1. **IA suggère, humain décide** : Aucune association automatique
2. **Transparence** : Le score de confiance IA est TOUJOURS affiché
3. **Correction possible** : L'utilisateur peut modifier les associations avec audit

#### ❌ Ce que le système ne fait PAS

- N'associe JAMAIS automatiquement un flux à un dossier
- Ne crée PAS d'entités sans validation humaine
- Ne fusionne PAS de dossiers sans consentement explicite

### Modèle de données

```typescript
interface Dossier {
  id: string;
  number: string; // Ex: "DOS-2026-001"
  title: string;
  status: 'open' | 'archived' | 'closed';
  createdAt: Date;
  createdBy: string; // userId
  tenantId: string;
}

interface Entity {
  id: string;
  type: 'person' | 'organization';
  name: string;
  email?: string;
  metadata: Record<string, any>;
  tenantId: string;
}

interface FlowAssociation {
  id: string;
  flowId: string;
  dossierId?: string;
  entityId?: string;
  associatedAt: Date;
  associatedBy: string; // userId
  suggestionId?: string; // Lien vers suggestion IA
  confidence?: number;
}

interface Suggestion {
  id: string;
  flowId: string;
  suggestedDossierId?: string;
  suggestedEntityId?: string;
  confidence: number; // 0.0 - 1.0
  reasoning: string; // Explication IA
  status: 'pending' | 'accepted' | 'rejected';
  resolvedBy?: string;
  resolvedAt?: Date;
}
```

### Critères d'acceptation

- [ ] Une suggestion IA apparaît en moins de 10 secondes après normalisation
- [ ] Le score de confiance est calibré (85% IA = 85% précision réelle)
- [ ] L'utilisateur peut rejeter une suggestion sans perdre le flux
- [ ] Toute correction manuelle est tracée dans EventLog

---

## 5️⃣ GESTION DES DOUBLONS

### Objectif

Détecter et résoudre les **doublons** (flux identiques, entités similaires) avec **validation humaine obligatoire**.

### Catégories de doublons

#### 1. Doublons exacts (hash identique)

- **Détection** : Comparaison `contentHash`
- **Exemple** : Email transféré deux fois

#### 2. Doublons quasi-identiques (similarité élevée)

- **Détection** : Algorithme Levenshtein sur texte
- **Seuil** : Similarité > 95%
- **Exemple** : Email re-envoyé avec signature modifiée

#### 3. Entités similaires (personnes/organisations)

- **Détection** :
  - Nom similaire (distance Levenshtein)
  - Email identique avec domaine différent
  - Téléphone identique
- **Exemple** : "Jean Dupont" vs "J. Dupont"

### Processus

#### 1. Détection automatique

Lors de la normalisation, le système :

1. Calcule le hash du flux
2. Vérifie si un flux avec ce hash existe
3. Si oui : crée une `DuplicateAlert`

#### 2. Notification utilisateur

L'utilisateur reçoit une alerte :

> ⚠️ Doublon potentiel détecté
> **Flux A** : Email de jean.dupont@example.com (2026-02-01)
> **Flux B** : Email de jean.dupont@example.com (2026-02-01)
> **Similarité** : 100% (hash identique)

#### 3. Résolution manuelle

L'utilisateur choisit :

- **Fusionner** : Marquer Flux B comme doublon de Flux A (conservation des deux avec lien)
- **Ignorer** : Les flux sont distincts (dismiss alert)
- **Reporter** : Décision ultérieure

### Comportements

#### ✅ Règles métier

1. **Pas de fusion automatique** : L'humain valide TOUJOURS
2. **Conservation** : Même en cas de fusion, les deux flux restent accessibles
3. **Traçabilité** : La décision de fusion/rejet est tracée

#### ❌ Ce que le système ne fait PAS

- Ne fusionne JAMAIS automatiquement des flux
- Ne supprime JAMAIS un flux considéré comme doublon
- Ne masque PAS les doublons (ils restent visibles avec badge)

### Modèle de données

```typescript
interface DuplicateAlert {
  id: string;
  createdAt: Date;

  // Entités concernées
  entity1Type: 'flow' | 'entity';
  entity1Id: string;
  entity2Type: 'flow' | 'entity';
  entity2Id: string;

  // Détails
  similarityScore: number; // 0.0 - 1.0
  detectionMethod: 'hash' | 'levenshtein' | 'email_match';

  // Résolution
  status: 'pending' | 'merged' | 'dismissed' | 'deferred';
  resolvedBy?: string;
  resolvedAt?: Date;
  resolution?: {
    action: 'merge' | 'dismiss' | 'defer';
    reason?: string;
    mergeStrategy?: 'keep_both' | 'mark_primary';
  };

  tenantId: string;
}
```

### Critères d'acceptation

- [ ] Un doublon hash=100% est détecté immédiatement
- [ ] Une alerte doublon apparaît dans le dashboard en < 1 min
- [ ] L'utilisateur peut comparer les deux flux côte à côte
- [ ] Une fusion conserve les deux flux avec lien explicite

---

## 6️⃣ SUPERVISION HUMAINE

### Objectif

Garantir qu'un **humain responsable** supervise et valide les décisions critiques du système.

### Principes

#### 1. Pas d'automatisation sur données sensibles

Toute action sur des données sensibles (assignation dossier, fusion entités, export) requiert **validation humaine explicite**.

#### 2. Tableau de supervision

Dashboard temps réel affichant :

- **Flux non classés** : Nombre + liste
- **Suggestions IA en attente** : Par score de confiance
- **Alertes doublons** : Non résolues
- **Événements sécurité** : Accès inhabituels

#### 3. Commentaires internes

Thread de discussion par flux/dossier pour :

- Partager contexte entre collègues
- Justifier décisions
- Demander validation tierce

### Interfaces

#### Dashboard supervision

```
┌─────────────────────────────────────────────┐
│ 🔔 ALERTES                                  │
├─────────────────────────────────────────────┤
│ ⚠️ 12 flux non classés (> 24h)             │
│ 🤖 8 suggestions IA en attente              │
│ 👥 3 doublons suspects                      │
│ 🔒 1 accès inhabituel détecté               │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│ 📊 STATISTIQUES AUJOURD'HUI                 │
├─────────────────────────────────────────────┤
│ Flux reçus         : 47                     │
│ Flux traités       : 35                     │
│ Taux automatisation: 12% (IA suggestions)   │
│ Interventions      : 35 (humain)            │
└─────────────────────────────────────────────┘
```

#### Commentaires internes

```
Flux #1234 - Email client Jean Dupont
═════════════════════════════════════
💬 @marie.martin (2026-02-01 10:32)
Ce client a déjà un dossier actif (DOS-2025-089).
Suggestion IA erronée, à rejeter.

💬 @paul.dubois (2026-02-01 10:45)
Confirmé. Associé manuellement à DOS-2025-089.
EventLog créé.
```

### Comportements

#### ✅ Règles métier

1. **Supervision obligatoire** : Pas de "set and forget"
2. **Alertes contextuelles** : Basées sur SLA (ex: flux > 24h non traité)
3. **Traçabilité commentaires** : Tout commentaire est lié à un EventLog

#### ❌ Ce que le système ne fait PAS

- Ne masque PAS les flux non traités
- N'applique PAS de décisions par défaut après timeout
- Ne notifie PAS de manière intrusive (pas de popup bloquante)

### Critères d'acceptation

- [ ] Les alertes sont rafraîchies en temps réel (< 10s latence)
- [ ] L'utilisateur peut filtrer par type d'alerte
- [ ] Les commentaires internes sont horodatés et non modifiables
- [ ] Une notification email est envoyée si > 50 flux non traités

---

## 7️⃣ RECHERCHE & RELECTURE

### Objectif

Permettre un **accès rapide et explicable** à l'historique des flux.

### Modes de recherche

#### 1. Recherche textuelle

- **Full-text** : Contenu emails + pièces jointes (OCR si PDF)
- **Métadonnées** : Expéditeur, sujet, date
- **Ranking** : Score de pertinence BM25

#### 2. Recherche par période

- **Plages prédéfinies** : Aujourd'hui, 7 derniers jours, mois en cours
- **Plage personnalisée** : Date début + date fin

#### 3. Recherche par entité/dossier

- **Par client** : Tous flux liés à une entité
- **Par dossier** : Historique complet d'un dossier

### Explicabilité

#### Score de pertinence

Pour chaque résultat, afficher :

- **Score** : 0-100 (normalisation BM25)
- **Raison** : "Correspond à 'contrat' dans le sujet et le corps"

#### Snippets

Extraits mis en évidence avec contexte :

```
...signature du contrat de bail commercial...
   ^^^^^^^^            ^^^^^^^
```

### Comportements

#### ✅ Règles métier

1. **Non-destructif** : La recherche ne modifie RIEN
2. **Résultats reproductibles** : Même requête = mêmes résultats (tri stable)
3. **Respect permissions** : Un utilisateur ne voit que ses flux autorisés

#### ❌ Ce que le système ne fait PAS

- Ne modifie PAS l'ordre des résultats en fonction de l'utilisateur (pas de personnalisation opaque)
- Ne cache PAS de résultats (transparence totale)

### Modèle de données

```typescript
interface SearchResult {
  flowId: string;
  score: number; // 0-100
  highlights: Array<{
    field: 'subject' | 'body' | 'attachment';
    snippet: string;
    positions: Array<{ start: number; length: number }>;
  }>;
  ranking: {
    algorithm: 'BM25';
    parameters: Record<string, any>;
  };
}
```

### Critères d'acceptation

- [ ] Une recherche simple retourne résultats en < 500ms
- [ ] Les snippets affichent le contexte (50 caractères avant/après)
- [ ] Le score de pertinence est calibré (top résultat = vraiment pertinent)
- [ ] L'utilisateur peut trier par pertinence OU par date

---

## 8️⃣ SÉCURITÉ & DROITS

### Objectif

Protéger les données sensibles et garantir la conformité (RGPD, ISO 27001).

### Architecture sécurité

#### Authentification

- **SSO** : Azure AD (prioritaire)
- **2FA** : Optionnel mais recommandé
- **Sessions** : Timeout 30 min inactivité

#### Autorisation (RBAC)

Rôles :

- **Admin** : Toutes permissions + gestion utilisateurs
- **Supervisor** : Lecture + validation + export
- **Operator** : Lecture + commentaires
- **Viewer** : Lecture seule

#### Permissions granulaires

```typescript
interface Permission {
  resource: 'flow' | 'dossier' | 'entity' | 'audit';
  action: 'read' | 'write' | 'delete' | 'export';
  scope: 'own' | 'team' | 'tenant';
}
```

### Journal d'accès

#### Événements tracés

- `access.login` : Connexion utilisateur
- `access.logout` : Déconnexion
- `access.viewed_flow` : Consultation flux sensible
- `access.downloaded_attachment` : Téléchargement PJ
- `access.exported_audit` : Export timeline

#### Stockage sécurisé

- **Append-only** : Pas de modification/suppression
- **Chiffrement** : AES-256 at rest
- **Retention** : 10 ans minimum (conformité)

### Comportements

#### ✅ Règles métier

1. **Principe du moindre privilège** : Accès minimum nécessaire
2. **Traçabilité totale** : Tous accès sont loggés
3. **Séparation lecture/écriture** : Roles distincts

#### ❌ Ce que le système ne fait PAS

- N'autorise PAS d'accès anonyme
- Ne partage PAS de sessions entre utilisateurs
- Ne stocke PAS de mots de passe en clair (hash bcrypt)

### Critères d'acceptation

- [ ] Un utilisateur sans permission reçoit HTTP 403
- [ ] Une session expirée redirige vers login
- [ ] Tous événements sécurité sont alertés en temps réel
- [ ] Le journal d'accès est exportable (conformité audit)

---

## 9️⃣ MÉTRIQUES DE VALEUR (Monétisation)

### Objectif

Mesurer et **prouver** la valeur apportée par Memo Lib.

### Métriques business

#### Efficacité

- **Temps moyen de traitement** : Temps entre réception et classification validée
- **Taux d'automatisation IA** : % de suggestions acceptées sans correction
- **Réduction charge manuelle** : Heures gagnées par semaine

#### Fiabilité

- **Taux de précision IA** : % de suggestions correctes (mesure réelle vs prédite)
- **Taux de doublons évités** : % de fusions validées
- **Zero perte de données** : Aucun flux perdu (SLA 100%)

#### Conformité

- **Couverture audit** : % d'actions tracées dans EventLog
- **Temps de réponse audit** : Temps pour générer timeline complète
- **Incidents sécurité** : Nombre (objectif : 0)

### Preuves légales exportables

#### Timeline PDF

- **Format** : PDF/A (archivage long terme)
- **Signature** : Signature numérique serveur
- **Contenu** : EventLog complet avec checksums
- **Norme** : Conforme NF Z42-013 (coffre-fort numérique)

#### Certificat d'horodatage

- **Standard** : RFC 3161 (si possible via TSA)
- **Usage** : Preuve d'existence à une date

### Interfaces

#### Dashboard métriques

```
┌──────────────────────────────────────────────┐
│ 📈 VALEUR APPORTÉE (30 derniers jours)       │
├──────────────────────────────────────────────┤
│ Flux traités              : 1,247            │
│ Suggestions IA acceptées  : 879 (70%)        │
│ Heures gagnées (estimé)   : 52h              │
│ Doublons évités           : 23               │
│ Taux conformité audit     : 100%             │
└──────────────────────────────────────────────┘
```

### Critères d'acceptation

- [ ] Les métriques sont calculées en temps réel (< 5 min latence)
- [ ] L'export PDF timeline est généré en < 30s
- [ ] Les checksums EventLog sont vérifiables par tiers
- [ ] Les métriques sont exportables en CSV

---

## 🚫 RÈGLE D'OR ABSOLUE

> **Memo Lib observe, mémorise et rend visible.**
> **Il ne décide JAMAIS à la place d'un humain.**

### Conséquences pratiques

#### Ce qui est AUTORISÉ

✅ Suggérer une association flux → dossier
✅ Détecter un doublon et alerter
✅ Extraire des métadonnées automatiquement
✅ Classifier un flux avec un score de confiance

#### Ce qui est INTERDIT

❌ Associer automatiquement un flux à un dossier
❌ Fusionner des doublons sans validation humaine
❌ Supprimer un flux (même marqué spam)
❌ Modifier des métadonnées sans audit

---

## 📐 PÉRIMÈTRE MVP (90 jours)

### Phase 1 (0-30 jours) : Fondations

- [x] Monitoring email (Gmail API) — **EXISTANT**
- [ ] EventLog immuable (table + API)
- [ ] Normalisation avec hash SHA-256
- [ ] Interface supervision basique

### Phase 2 (31-60 jours) : Intelligence

- [ ] Classification IA avec confiance
- [ ] Suggestions dossier/entité
- [ ] Workflow validation humaine
- [ ] Détection doublons hash exact

### Phase 3 (61-90 jours) : Conformité

- [ ] Journal d'accès complet
- [ ] Export timeline PDF
- [ ] Recherche full-text
- [ ] Dashboard métriques valeur

### Hors périmètre MVP

- API REST publique
- Upload manuel horodaté
- Doublons quasi-identiques (similarité < 100%)
- Multi-canal (WhatsApp, SMS)

---

## 📊 CRITÈRES DE SUCCÈS MVP

### Techniques

- [ ] 100% des flux reçus sont capturés
- [ ] 0 perte de données (tests charge)
- [ ] EventLog immuable (contrainte DB testée)
- [ ] Export PDF conforme NF Z42-013

### Utilisateurs

- [ ] 90% des suggestions IA sont pertinentes (mesure utilisateur)
- [ ] Temps moyen classification < 2 min
- [ ] 0 fusion automatique non désirée
- [ ] Satisfaction utilisateur > 8/10

### Business

- [ ] 30% réduction temps de traitement manuel
- [ ] Démo convaincante pour appel d'offres État
- [ ] Conformité RGPD + ISO 27001 attestée
- [ ] Coût infra < 500€/mois (Azure)

---

## 🔗 RÉFÉRENCES

- **Mapping technique** : [FEATURE_MAPPING.md](./FEATURE_MAPPING.md)
- **Architecture** : [ARCHITECTURE.md](./ARCHITECTURE.md)
- **Sécurité** : [SECURITY_CHECKLIST.md](./SECURITY_CHECKLIST.md)
- **Environnement** : [ENVIRONMENT_VARIABLES.md](./ENVIRONMENT_VARIABLES.md)

---

**Auteur** : Équipe Memo Lib
**Validation** : À définir
**Prochaine révision** : Après phase 1 MVP
