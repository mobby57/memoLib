# Politique de sécurité — MemoLib

**Dernière mise à jour :** 11 octobre 2026

## Signalements de vulnérabilités

Merci d'envoyer tout signalement à **security@memolib.space** (à confirmer) ou via GitHub Security Advisories (onglet Security → Report a vulnerability).

Nous accuserons réception sous 72 h et fournirons une évaluation sous 7 jours.

## Vulnérabilités connues et acceptées

### Dépendances de développement (`devDependencies`)

Les alertes Dependabot HIGH/MODERATE actuelles proviennent **exclusivement** de la chaîne :

    semantic-release
      ├── @semantic-release/*
      ├── npm (comme dépendance transitive)
      ├── @sigstore/*
      └── micromatch

**Évaluation du risque :**

| Critère | Statut |
| --- | --- |
| Runtime de production (Next.js) | **Non affecté** |
| Code applicatif (`src/`) | **Non affecté** |
| Utilisateurs finaux | **Non affecté** |
| Workflow de release GitHub Actions | **Affecté** (environnement isolé) |
| Machine de développement locale | **Affecté** si compromis local |

**Décision :** accepter temporairement ces alertes.

**Justification :**
- Ces dépendances ne sont jamais exécutées en production.
- L'exécution se limite au workflow GitHub Actions `release.yml` (environnement éphémère).
- Le repo `mobby57/memoLib` est [public/privé] et les PR de fork n'exécutent pas les workflows sans approbation.

**Plan de remédiation :**
- **Ticket :** #XXX (à créer)
- **Action :** migrer de `semantic-release` vers `release-please` (Google) qui élimine cette chaîne.
- **Échéance cible :** Q4 2026
- **Responsable :** mobby57

### Suivi

| Date | Action | Statut |
| --- | --- | --- |
| 11/10/2026 | Documentation des vulnérabilités acceptées | ✅ |
| À venir | Création du ticket de migration | ⏳ |
| À venir | Migration vers `release-please` | ⏳ |

## Ce que nous ne considérons PAS comme des vulnérabilités

- Alertes provenant de dépendances de **développement uniquement**.
- Alertes provenant d'outils de **build ou de release** qui ne sont jamais exécutés en production.
- Faux positifs de Dependabot sur des dépendances transitives non exécutées.

## Bonnes pratiques

- Les secrets ne sont **jamais** commités (voir `.gitignore`).
- Les workflows GitHub Actions utilisent des secrets chiffrés.
- `npm audit` est exécuté avant chaque release majeure.
- Les tokens CSRF et cookies de session sont invalidés via rotation régulière de `NEXTAUTH_SECRET`.

## Historique

- **11/10/2026 :** Ajout des règles d'ignorance pour les fichiers cookies/tokens (commit `cd85aef6`, `996c6fad`).
- **11/10/2026 :** Correction du bug UTC dans `isFrenchHoliday` (commit `367d6116`).
