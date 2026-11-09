# Cahier des charges - MemoLib

## 1) Contexte

MemoLib est une plateforme d’assistance opérationnelle pour cabinets juridiques, orientée traitement des communications, organisation des dossiers, traçabilité et aide à la décision. Le produit doit rester un assistant: les actions sensibles sont validées par un humain.

## 2) Objectifs

- Réduire le temps de traitement des emails/messages entrants.
- Structurer la gestion client/dossier avec traçabilité complète.
- Renforcer la sécurité, l’isolement tenant et la conformité RGPD.
- Fournir une expérience de démonstration fiable pour validation métier.

## 2.b) Ambition "hors du commun"

MemoLib vise un positionnement **premium**: une plateforme perçue comme plus fiable, plus intelligente et plus rassurante que les outils juridiques standards.

### Différenciateurs attendus

- **Confiance-by-design**: sécurité, audit et conformité visibles dans l’expérience utilisateur.
- **Clarté opérationnelle**: chaque dossier doit être compréhensible en moins de 60 secondes.
- **Assistance IA maîtrisée**: recommandations utiles, explicables, et toujours validables par l’humain.
- **Excellence d’exécution**: fluidité UX, latence faible, erreurs rares, feedbacks précis.

### Expérience “WOW” attendue

- Vue dossier avec résumé intelligent actionnable (priorités, risques, prochaines actions).
- Traçabilité juridique lisible de bout en bout (qui a fait quoi, quand, pourquoi).
- Parcours démo convaincant en moins de 5 minutes pour un décideur non technique.

## 3) Périmètre fonctionnel

### Inclus (MVP+)

- Authentification et contrôle d’accès par rôles.
- Gestion clients, dossiers, événements et pièces.
- Ingestion email et classification/suggestions assistées.
- Parcours démo en 3 étapes (simulateur email, raisonnement, preuve légale).
- Middlewares sécurité: headers, contrôle d’accès, isolement tenant, quotas.
- Journalisation et audit des actions sensibles.

### Hors périmètre immédiat

- Automatisation sans validation utilisateur sur actions à impact juridique.
- Refonte globale de l’architecture.
- Migration complète du legacy hors chantiers prioritaires.

## 4) Utilisateurs cibles

- Super Admin: supervision plateforme, gouvernance et support.
- Admin/Avocat: gestion opérationnelle du tenant.
- Client final: consultation restreinte selon droits.

## 5) Exigences fonctionnelles

### 5.1 Authentification et autorisations

- Contrôle d’accès strict par rôle.
- Isolement tenant obligatoire sur routes concernées.
- Refus explicite des accès cross-tenant.

### 5.2 Gestion métier

- CRUD clients et dossiers.
- Historique d’événements et suivi des statuts.
- Gestion des pièces/documents liée aux dossiers.

### 5.3 Assistance intelligente

- Analyse des messages entrants et suggestions actionnables.
- Aucun envoi ou décision juridique automatique sans validation.

### 5.4 Démo et validation

- Parcours démo stable et reproductible.
- États et transitions visibles (succès, erreur, chargement).

## 6) Exigences non fonctionnelles

### 6.1 Qualité

- Lint et type-check verts sur la branche principale.
- Régressions bloquantes interdites sur flux critiques.

### 6.2 Performance

- Réponse API cohérente pour usages standards.
- Optimisations locales autorisées si sans impact comportemental.

### 6.3 Maintenabilité

- Mutualisation des patterns répétés (ex: récupération token auth).
- Documentation à jour des flux middleware et règles d’équipe.

## 7) Sécurité et conformité

### 7.1 Sécurité applicative

- Headers de sécurité actifs.
- Vérification des permissions sur routes API.
- Limitation de débit sur endpoints sensibles.

### 7.2 RGPD

- Minimisation des données personnelles en logs.
- Traçabilité des accès sensibles.
- Mécanismes de suppression/anonymisation selon politique.

## 8) Architecture cible (résumé)

- Frontend Next.js (app + API routes).
- Couche middleware sécurité/auth/tenant/quota.
- Services métier et accès données via Prisma.
- Intégrations externes selon besoins (messagerie, stockage, IA).

## 9) Livrables attendus

- Code source conforme au périmètre.
- Documentation architecture et exploitation.
- Guide de décision refactoring (quand faire / quand reporter).
- Checklists de validation (qualité, sécurité, flux critiques).

## 10) Critères d’acceptation

- Les flux critiques (auth, accès API, clients/dossiers, démo) sont fonctionnels.
- Lint et type-check passent.
- Aucune faille évidente de contrôle d’accès identifiée sur routes critiques.
- Documentation essentielle disponible et cohérente avec le code.

### Critères d’excellence (niveau hors du commun)

- **Temps de prise en main**: un nouvel utilisateur comprend le flux principal en < 10 min.
- **Temps de décision**: réduction mesurable du temps de tri/qualification (> 40%).
- **Fiabilité perçue**: zéro action sensible exécutée sans validation explicite.
- **Qualité produit**: 0 erreur bloquante sur parcours critique en démonstration.
- **Lisibilité**: chaque écran critique expose clairement l’état, le risque et l’action suivante.

## 11) Priorisation

- Priorité 1: sécurité, permissions, stabilité flux critiques.
- Priorité 2: couverture test, validation d’entrées, erreurs standardisées.
- Priorité 3: optimisations et dette technique non bloquante.

### Principe directeur de priorisation

En cas d’arbitrage, privilégier ce qui **augmente la confiance utilisateur** et **réduit le temps de décision** avant toute complexité technique supplémentaire.

## 12) Risques et mitigation

- Risque: dérive de scope documentaire et technique.
  - Mitigation: appliquer guide de décision refactor/report.
- Risque: hétérogénéité des pratiques middleware.
  - Mitigation: helper partagé + conventions documentées.
- Risque: dette legacy persistante.
  - Mitigation: backlog priorisé, lots courts, validation continue.

## 13) Gouvernance

- Toute évolution sensible passe en revue sécurité/conformité.
- Toute amélioration non critique est tracée en backlog avec estimation et responsable.
- Chaque lot se termine par vérification qualité automatisée.
