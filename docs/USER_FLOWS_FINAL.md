# 👤 PARCOURS UTILISATEUR — WORKSPACE JURIDIQUE

**Version fondatrice — Figée et opposable**

---

## 🎯 PRINCIPES DES PARCOURS

### 1. Clarté immédiate
L'utilisateur comprend **en 3 secondes** ce qu'il doit faire.

### 2. Zéro friction
Chaque action inutile = perte de valeur.

### 3. Feedback constant
L'utilisateur sait **toujours** où il en est.

### 4. Sécurité visible
La valeur (preuve, traçabilité, délai) est **explicite**.

### 5. Pas de conseil juridique
Le système **documente**, il ne **décide pas**.

---

## 🧭 PARCOURS CRITIQUES (7 FLOWS)

### 1️⃣ **ONBOARDING — Premier contact**
### 2️⃣ **RÉCEPTION EMAIL — Information entrante**
### 3️⃣ **CRÉATION DOSSIER — Nouveau cas**
### 4️⃣ **GESTION DÉLAI — Zéro délai raté**
### 5️⃣ **UPLOAD DOCUMENT — Preuve opposable**
### 6️⃣ **CONSULTATION HISTORIQUE — Recherche décision**
### 7️⃣ **EXPORT AUDIT — Conformité RGPD**

---

## 1️⃣ ONBOARDING — PREMIER CONTACT

**Objectif** : Comprendre la valeur en 60 secondes.

### Étapes

#### A. Landing (non connecté)
```
┌─────────────────────────────────────────────────────────────┐
│  "Nous ne remplaçons pas la décision humaine.              │
│   Nous garantissons que tous les faits nécessaires         │
│   à une décision existent, sont tracés, complets           │
│   et opposables."                                           │
│                                                             │
│  [Démarrer l'essai gratuit]  [Voir une démo]              │
└─────────────────────────────────────────────────────────────┘
```

#### B. Inscription
```
Étape 1/3 : Informations cabinet
- Nom du cabinet
- Email professionnel
- Téléphone

Étape 2/3 : Choix du plan
- Starter (gratuit 14j)
- Pro
- Enterprise

Étape 3/3 : Confirmation
- Email de vérification envoyé
- Accès immédiat au workspace
```

#### C. Premier écran (vide)
```
┌─────────────────────────────────────────────────────────────┐
│  Bienvenue dans votre workspace juridique                  │
│                                                             │
│  Commencez par :                                            │
│  1. [Créer votre premier client]                           │
│  2. [Importer un dossier existant]                         │
│  3. [Connecter votre email]                                │
│                                                             │
│  Ou explorez :                                              │
│  - [Voir un dossier exemple]                               │
│  - [Comprendre les délais CESEDA]                          │
└─────────────────────────────────────────────────────────────┘
```

#### D. Tooltip contextuel
```
💡 "Ce système documente factuellement votre activité.
    Il n'interprète pas, ne conseille pas, ne décide pas.
    Toute analyse relève d'un professionnel qualifié."
```

**Durée totale** : 2-3 minutes
**Résultat** : Utilisateur comprend la valeur et a créé son premier élément

---

## 2️⃣ RÉCEPTION EMAIL — INFORMATION ENTRANTE

**Objectif** : Zéro information perdue.

### Étapes

#### A. Email reçu (automatique)
```
[SYSTÈME]
1. Email arrive sur boite@cabinet.fr
2. Création automatique InformationUnit
   - source: EMAIL
   - status: RECEIVED
   - contentHash: SHA-256
   - receivedAt: 2024-01-15T10:30:00Z
3. Notification utilisateur
```

#### B. Notification
```
┌─────────────────────────────────────────────────────────────┐
│  🔔 Nouvelle information reçue                              │
│                                                             │
│  De : jean.dupont@example.com                              │
│  Objet : Demande de titre de séjour                        │
│  Reçu : Il y a 2 minutes                                   │
│                                                             │
│  [Classifier maintenant]  [Voir plus tard]                 │
└─────────────────────────────────────────────────────────────┘
```

#### C. Classification
```
┌─────────────────────────────────────────────────────────────┐
│  Classification de l'information                            │
│                                                             │
│  Analyse IA (suggestion) :                                 │
│  ✓ Client potentiel : Jean DUPONT                          │
│  ✓ Type : Demande titre de séjour                          │
│  ✓ Urgence : Moyenne                                       │
│  ✓ Pièces jointes : 2 documents                            │
│                                                             │
│  Actions proposées :                                        │
│  □ Créer nouveau client                                    │
│  □ Créer nouveau dossier                                   │
│  □ Envoyer accusé de réception                             │
│                                                             │
│  [Valider]  [Modifier]  [Rejeter]                          │
└─────────────────────────────────────────────────────────────┘
```

#### D. Validation humaine
```
[UTILISATEUR clique "Valider"]

[SYSTÈME]
1. Création Client (si nouveau)
2. Création Dossier
3. Rattachement Email → Dossier
4. Création Proof (CAPTURE_EMAIL)
5. Mise à jour InformationUnit
   - status: CLASSIFIED → ANALYZED
   - linkedWorkspaceId: dossier-123
6. Envoi AR automatique (si configuré)
```

#### E. Confirmation
```
┌─────────────────────────────────────────────────────────────┐
│  ✅ Information traitée                                     │
│                                                             │
│  Client créé : Jean DUPONT                                 │
│  Dossier créé : #2024-001                                  │
│  Email archivé et rattaché                                 │
│  Preuve générée : CAPTURE_EMAIL                            │
│                                                             │
│  [Voir le dossier]  [Traiter suivant]                      │
└─────────────────────────────────────────────────────────────┘
```

**Durée totale** : 30-60 secondes
**Résultat** : Information classée, tracée, rattachée

---

## 3️⃣ CRÉATION DOSSIER — NOUVEAU CAS

**Objectif** : Structurer factuellement un dossier.

### Étapes

#### A. Formulaire minimal
```
┌─────────────────────────────────────────────────────────────┐
│  Nouveau dossier                                            │
│                                                             │
│  Client * : [Sélectionner ou créer]                        │
│  Type * : [Titre de séjour ▼]                              │
│  Article CESEDA : [L313-11 ▼] (optionnel)                  │
│                                                             │
│  Objet * : [Ex: Renouvellement titre étudiant]            │
│                                                             │
│  [Créer]  [Annuler]                                        │
└─────────────────────────────────────────────────────────────┘
```

#### B. Création automatique
```
[SYSTÈME]
1. Génération numéro unique : 2024-001
2. Création Dossier
3. Création ArchivePolicy (10 ans)
4. Création AuditLog (CREATE)
5. Si article CESEDA renseigné :
   → Suggestion délais légaux
```

#### C. Suggestion délais
```
┌─────────────────────────────────────────────────────────────┐
│  Dossier créé : #2024-001                                  │
│                                                             │
│  💡 Délais légaux détectés (L313-11 CESEDA) :             │
│                                                             │
│  □ Réponse préfecture : 4 mois (120 jours)                │
│  □ Recours gracieux : 2 mois (si refus)                   │
│  □ Recours contentieux : 2 mois (si refus)                │
│                                                             │
│  [Ajouter ces délais]  [Configurer manuellement]          │
└─────────────────────────────────────────────────────────────┘
```

#### D. Vue dossier
```
┌─────────────────────────────────────────────────────────────┐
│  Dossier #2024-001 — Jean DUPONT                           │
│  Type : Titre de séjour (L313-11)                          │
│  Statut : En cours                                         │
│                                                             │
│  [Documents] [Délais] [Historique] [Preuves]              │
│                                                             │
│  📋 Informations                                            │
│  - Créé le : 15/01/2024 10:35                              │
│  - Créé par : Marie MARTIN                                 │
│  - Phase : Instruction                                     │
│                                                             │
│  ⏰ Délais actifs (0)                                       │
│  [+ Ajouter un délai]                                      │
│                                                             │
│  📄 Documents (0)                                           │
│  [+ Ajouter un document]                                   │
│                                                             │
│  📧 Emails (1)                                              │
│  - 15/01/2024 : Demande initiale                           │
└─────────────────────────────────────────────────────────────┘
```

**Durée totale** : 1-2 minutes
**Résultat** : Dossier structuré, délais suggérés, traçabilité activée

---

## 4️⃣ GESTION DÉLAI — ZÉRO DÉLAI RATÉ

**Objectif** : Garantir le respect des délais légaux.

### Étapes

#### A. Ajout délai
```
┌─────────────────────────────────────────────────────────────┐
│  Nouveau délai légal                                        │
│                                                             │
│  Type * : [Recours contentieux ▼]                          │
│  Base légale : L511-1 CESEDA                               │
│  Délai légal : 2 mois (60 jours francs)                    │
│                                                             │
│  Date de référence * : [15/01/2024]                        │
│  (Date de notification de la décision)                     │
│                                                             │
│  Date limite calculée : 16/03/2024                         │
│                                                             │
│  Alertes :                                                  │
│  ☑ J-7 (09/03/2024)                                        │
│  ☑ J-3 (13/03/2024)                                        │
│  ☑ J-1 (15/03/2024)                                        │
│                                                             │
│  [Créer]  [Annuler]                                        │
└─────────────────────────────────────────────────────────────┘
```

#### B. Délai actif
```
┌─────────────────────────────────────────────────────────────┐
│  ⏰ Délais actifs (1)                                       │
│                                                             │
│  🔴 URGENT — J-3                                            │
│  Recours contentieux (L511-1 CESEDA)                       │
│  Date limite : 16/03/2024 (dans 3 jours)                   │
│                                                             │
│  Statut : URGENT                                            │
│  Alertes envoyées : J-7 ✓, J-3 ✓                           │
│                                                             │
│  [Marquer comme complété]  [Voir détails]                  │
└─────────────────────────────────────────────────────────────┘
```

#### C. Alerte J-7
```
[EMAIL AUTOMATIQUE]

Objet : [DÉLAI J-7] Recours contentieux — Dossier #2024-001

Bonjour Marie,

Un délai légal arrive à échéance dans 7 jours :

Dossier : #2024-001 — Jean DUPONT
Type : Recours contentieux (L511-1 CESEDA)
Date limite : 16/03/2024
Jours restants : 7

Actions recommandées :
- Vérifier que le recours est prêt
- Préparer les pièces justificatives
- Planifier le dépôt

[Voir le dossier]

---
Ce message est une alerte factuelle.
Toute décision relève d'un professionnel qualifié.
```

#### D. Complétion
```
┌─────────────────────────────────────────────────────────────┐
│  Marquer le délai comme complété                            │
│                                                             │
│  Délai : Recours contentieux                                │
│  Date limite : 16/03/2024                                   │
│                                                             │
│  Date de complétion * : [14/03/2024]                        │
│  Note : [Recours déposé au TA de Paris]                    │
│                                                             │
│  Preuve :                                                   │
│  [📎 Glisser un fichier ou cliquer]                        │
│  (Accusé de réception, récépissé, etc.)                    │
│                                                             │
│  [Valider]  [Annuler]                                      │
└─────────────────────────────────────────────────────────────┘
```

#### E. Confirmation
```
[SYSTÈME]
1. Mise à jour LegalDeadline
   - status: COMPLETED
   - completedAt: 14/03/2024
   - completedBy: user-123
2. Création Proof (DEPOT_RECOURS)
   - fileHash: SHA-256
   - proofDate: 14/03/2024
3. Création AuditLog
4. Notification client (optionnel)
```

**Durée totale** : 2-3 minutes
**Résultat** : Délai respecté, preuve générée, traçabilité complète

---

## 5️⃣ UPLOAD DOCUMENT — PREUVE OPPOSABLE

**Objectif** : Documenter factuellement chaque pièce.

### Étapes

#### A. Upload
```
┌─────────────────────────────────────────────────────────────┐
│  Ajouter un document                                        │
│                                                             │
│  [📎 Glisser un fichier ou cliquer]                        │
│                                                             │
│  Catégorie * : [Décision administrative ▼]                 │
│  Description : [Refus de titre de séjour]                  │
│                                                             │
│  Date du document * : [10/01/2024]                         │
│                                                             │
│  [Télécharger]  [Annuler]                                  │
└─────────────────────────────────────────────────────────────┘
```

#### B. Traitement automatique
```
[SYSTÈME]
1. Upload fichier → S3/Storage
2. Calcul SHA-256
3. OCR automatique (si PDF/image)
4. Extraction métadonnées
5. Création Document
6. Création Proof (DOCUMENT_RECEPTION)
7. Création InformationUnit
8. Analyse IA (optionnel)
```

#### C. Résultat OCR
```
┌─────────────────────────────────────────────────────────────┐
│  Document ajouté : refus_titre_sejour.pdf                  │
│                                                             │
│  ✅ Fichier sécurisé (SHA-256)                             │
│  ✅ OCR effectué (confiance : 98%)                         │
│  ✅ Métadonnées extraites                                  │
│                                                             │
│  Informations détectées :                                   │
│  - Type : Décision préfectorale                            │
│  - Date : 10/01/2024                                       │
│  - Référence : PREF-2024-00123                             │
│  - Délai de recours : 2 mois                               │
│                                                             │
│  💡 Action suggérée :                                      │
│  Créer un délai "Recours gracieux" (échéance : 10/03/2024) │
│                                                             │
│  [Créer le délai]  [Voir le document]                      │
└─────────────────────────────────────────────────────────────┘
```

#### D. Vue document
```
┌─────────────────────────────────────────────────────────────┐
│  📄 refus_titre_sejour.pdf                                 │
│                                                             │
│  Catégorie : Décision administrative                        │
│  Date : 10/01/2024                                         │
│  Taille : 245 KB                                           │
│  Hash : a3f5...8c2d                                        │
│                                                             │
│  [Télécharger]  [Voir]  [Supprimer]                       │
│                                                             │
│  📋 Texte extrait (OCR)                                     │
│  "PRÉFECTURE DE PARIS                                      │
│   Décision de refus de titre de séjour                     │
│   Référence : PREF-2024-00123                              │
│   Date : 10 janvier 2024                                   │
│   ..."                                                      │
│                                                             │
│  🔍 Analyse IA                                              │
│  - Type de décision : Refus                                │
│  - Motif : Article L313-11 non rempli                      │
│  - Voies de recours : Gracieux (2 mois), Contentieux (2 mois) │
└─────────────────────────────────────────────────────────────┘
```

**Durée totale** : 1-2 minutes
**Résultat** : Document sécurisé, OCR effectué, métadonnées extraites

---

## 6️⃣ CONSULTATION HISTORIQUE — RECHERCHE DÉCISION

**Objectif** : Accéder à la mémoire documentaire.

### Étapes

#### A. Recherche
```
┌─────────────────────────────────────────────────────────────┐
│  Recherche de décisions                                     │
│                                                             │
│  [🔍 Rechercher par article, juridiction, date...]         │
│                                                             │
│  Filtres :                                                  │
│  Article : [L313-11 ▼]                                     │
│  Juridiction : [TA Paris ▼]                                │
│  Période : [2020-2024]                                     │
│  Type : [Recours contentieux ▼]                            │
│                                                             │
│  [Rechercher]                                               │
└─────────────────────────────────────────────────────────────┘
```

#### B. Résultats
```
┌─────────────────────────────────────────────────────────────┐
│  Résultats (12 décisions)                                   │
│                                                             │
│  📄 TA Paris — 15/03/2023 — N°2301234                      │
│  Article : L313-11 CESEDA                                  │
│  Résumé : Rejet recours, motif insuffisance ressources     │
│  [Voir détails]                                             │
│                                                             │
│  📄 TA Paris — 22/11/2022 — N°2205678                      │
│  Article : L313-11 CESEDA                                  │
│  Résumé : Annulation refus, erreur manifeste appréciation  │
│  [Voir détails]                                             │
│                                                             │
│  ...                                                        │
└─────────────────────────────────────────────────────────────┘
```

#### C. Détail décision
```
┌─────────────────────────────────────────────────────────────┐
│  Décision TA Paris — 15/03/2023 — N°2301234                │
│                                                             │
│  Article : L313-11 CESEDA                                  │
│  Juridiction : Tribunal Administratif de Paris              │
│  Date : 15 mars 2023                                       │
│  Type : Recours contentieux                                │
│                                                             │
│  Résumé factuel :                                           │
│  Le tribunal a rejeté le recours au motif que le requérant │
│  ne justifiait pas de ressources suffisantes au sens de    │
│  l'article L313-11 du CESEDA.                              │
│                                                             │
│  ⚠️ AVERTISSEMENT                                          │
│  Cette information est fournie à titre documentaire.       │
│  Elle ne constitue pas un conseil juridique.               │
│  Toute analogie avec votre dossier relève d'un             │
│  professionnel qualifié.                                    │
│                                                             │
│  [Télécharger]  [Fermer]                                   │
└─────────────────────────────────────────────────────────────┘
```

**Durée totale** : 1-2 minutes
**Résultat** : Accès à la mémoire documentaire, pas d'extrapolation

---

## 7️⃣ EXPORT AUDIT — CONFORMITÉ RGPD

**Objectif** : Prouver la conformité et la traçabilité.

### Étapes

#### A. Demande export
```
┌─────────────────────────────────────────────────────────────┐
│  Export audit                                               │
│                                                             │
│  Type : [Audit complet ▼]                                  │
│  Période : [01/01/2024] → [31/12/2024]                     │
│                                                             │
│  Inclure :                                                  │
│  ☑ Journal d'audit (AuditLog)                              │
│  ☑ Preuves (Proof)                                         │
│  ☑ Délais (LegalDeadline)                                  │
│  ☑ Documents (Document)                                    │
│  ☑ Informations (InformationUnit)                          │
│                                                             │
│  Format : [PDF ▼]                                          │
│                                                             │
│  [Générer]  [Annuler]                                      │
└─────────────────────────────────────────────────────────────┘
```

#### B. Génération
```
[SYSTÈME]
1. Création Report
   - type: AUDIT_TRAIL
   - status: GENERATING
2. Extraction données
3. Vérification hash
4. Génération PDF
5. Signature électronique (optionnel)
6. Mise à jour Report
   - status: COMPLETED
   - fileStorageKey: report-123.pdf
```

#### C. Téléchargement
```
┌─────────────────────────────────────────────────────────────┐
│  ✅ Export généré                                           │
│                                                             │
│  Rapport d'audit — 2024                                    │
│  Période : 01/01/2024 → 31/12/2024                         │
│  Généré le : 15/01/2025 14:30                              │
│  Taille : 2.4 MB                                           │
│                                                             │
│  Contenu :                                                  │
│  - 1,234 entrées d'audit                                   │
│  - 89 preuves                                              │
│  - 45 délais                                               │
│  - 234 documents                                           │
│  - 567 informations                                        │
│                                                             │
│  [Télécharger]  [Envoyer par email]                        │
└─────────────────────────────────────────────────────────────┘
```

**Durée totale** : 2-3 minutes
**Résultat** : Export complet, signé, opposable

---

## 🎨 PRINCIPES UI/UX

### 1. Feedback immédiat
Chaque action = confirmation visuelle (toast, animation).

### 2. États clairs
- En cours (spinner)
- Succès (✅ vert)
- Erreur (❌ rouge)
- Attention (⚠️ orange)

### 3. Langage factuel
- ✅ "Document sécurisé"
- ❌ "Document validé juridiquement"

### 4. Avertissements visibles
```
⚠️ AVERTISSEMENT
Cette information est fournie à titre documentaire.
Elle ne constitue pas un conseil juridique.
Toute analyse relève d'un professionnel qualifié.
```

### 5. Raccourcis clavier
- `Ctrl+N` : Nouveau dossier
- `Ctrl+U` : Upload document
- `Ctrl+D` : Nouveau délai
- `Ctrl+F` : Recherche

---

## 📊 MÉTRIQUES DE SUCCÈS

### Onboarding
- Temps moyen : < 3 minutes
- Taux de complétion : > 80%

### Réception email
- Temps de classification : < 60 secondes
- Taux d'automatisation : > 70%

### Gestion délai
- Délais ratés : 0%
- Alertes envoyées : 100%

### Upload document
- Temps moyen : < 2 minutes
- Taux OCR : > 95%

---

## 🚀 PROCHAINES ÉTAPES

1. ✅ Parcours utilisateur figés
2. ⏳ Wireframes détaillés
3. ⏳ Prototypes interactifs
4. ⏳ Tests utilisateurs
5. ⏳ Implémentation UI

---

**Document figé le** : {{ DATE }}
**Auteur** : Équipe Produit
**Statut** : RÉFÉRENCE OFFICIELLE
