# Principe de Co-Adaptation Utilisateur–Application

## Règle fondamentale

L'application ne doit ni imposer systématiquement ses logiques à l'utilisateur, ni se conformer intégralement à ses habitudes existantes.

## Les 6 principes

### 1. Préservation de l'identité de l'utilisateur

L'utilisateur conserve ses méthodes de travail, ses préférences, son vocabulaire et ses processus lorsqu'ils ne nuisent pas aux objectifs du système.

**Exemple MemoLib** : Un avocat qui nomme ses dossiers "OQTF-NOM-2026" au lieu du format suggéré "TYPE-NUMERO" garde sa convention. Le système indexe les deux.

### 2. Préservation de l'identité de l'application

L'application conserve sa cohérence, ses règles métier, ses mécanismes de sécurité et sa logique fonctionnelle.

**Exemple MemoLib** : Les délais CESEDA (48h OQTF, 15j recours) ne sont pas modifiables par l'utilisateur. L'audit trail RGPD est obligatoire. L'isolation multi-tenant n'est pas négociable.

### 3. Adaptation réciproque

L'application observe les usages récurrents et propose des ajustements sans les imposer. L'utilisateur peut accepter, modifier ou refuser ces propositions.

**Exemple MemoLib** : Si un avocat reclasse systématiquement les emails "medium" en "urgent" pour un type de dossier, le système propose : "Voulez-vous que je classe automatiquement les emails de type X en urgent ?"

### 4. Personnalisation explicable

Toute adaptation réalisée par le système doit pouvoir être comprise, justifiée et réversible.

**Exemple MemoLib** : "Ce dossier a été classé urgent car vos 5 derniers dossiers similaires ont été traités en priorité. [Modifier] [Revenir au défaut]"

### 5. Enrichissement mutuel

L'application ne se limite pas à reproduire les habitudes existantes ; elle suggère également de nouvelles méthodes susceptibles d'améliorer l'expérience ou l'efficacité de l'utilisateur.

**Exemple MemoLib** : "Vous traitez les OQTF individuellement. D'autres cabinets regroupent les audiences du même tribunal pour optimiser les déplacements. [En savoir plus] [Ignorer]"

### 6. Singularisation

L'objectif n'est pas de standardiser les comportements mais de permettre à chaque utilisateur de développer un usage qui lui soit propre tout en restant compatible avec l'écosystème commun.

**Exemple MemoLib** : Deux avocats du même cabinet peuvent avoir des dashboards, des tris, et des alertes différents — tout en partageant les mêmes dossiers et la même base de données.

## Règle de décision

Avant toute évolution fonctionnelle, se poser la question :

> « Cette fonctionnalité renforce-t-elle la collaboration entre l'utilisateur et le système, ou cherche-t-elle à faire disparaître l'identité de l'un au profit de l'autre ? »

Si l'identité de l'un des deux acteurs est réduite, la fonctionnalité doit être repensée.

## Application dans le code

### Ce qui est NON-NÉGOCIABLE (identité application)

- Délais légaux CESEDA (calculés, non modifiables)
- Audit trail RGPD (automatique, non désactivable)
- Isolation multi-tenant (sécurité)
- Déduplication emails (hash SHA256)
- Authentification et RBAC

### Ce qui est ADAPTABLE (identité utilisateur)

- Vocabulaire des statuts de dossier
- Niveaux de priorité et leur signification
- Format d'affichage des deadlines (J-7, "dans 7 jours", date absolue)
- Templates de documents (personnalisables par cabinet)
- Classification IA (seuils ajustables par utilisateur)
- Dashboard (widgets, ordre, filtres)
- Notifications (canaux, fréquence, seuils)

### Ce qui est CO-ADAPTATIF (enrichissement mutuel)

- Classification automatique des emails (apprend des corrections)
- Suggestions de priorité (basées sur l'historique)
- Propositions de workflows (basées sur les patterns d'usage)
- Alertes intelligentes (ajustées au rythme de travail)
