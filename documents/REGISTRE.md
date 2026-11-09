# Registre des décisions — MemoLib & MemoLibDev

**Version** : 0.4.0
**Date** : 2026-11-01
**Auteur** : [porteur projet] + Claude
**Portée** : 2 projets documentaires (MemoLib, MemoLibDev)

---

## Décisions fondatrices

### D01 — Deux projets distincts
- **Statut** : ✅ Confirmé
- **Décision** : documenter MemoLib et MemoLibDev. Le chemin `Desktop\memolib` cité dans le README MemoLibDev **n'existe pas** (obsolète).
- **Source** : `[confirmé:session]` inventaire 2026-11-01

### D02 — Chemins canoniques
- **Statut** : ✅ Confirmé
- **Décision** :
  - **MemoLib** = `C:\Users\moros\Desktop\PROD\memolib-production`
  - **MemoLibDev produit** = `C:\Users\moros\Desktop\DEV-PYTHON\memolibdev`
  - **MemoLibDev labo** = `C:\Users\moros\MemoLibDev\v3` (historique, à archiver)
  - **MemoLibDev pré-v3** = `C:\Users\moros\MemoLibDev` racine (labo, à archiver)
- **Source** : `[confirmé:session]`

### D03 — Auth MemoLib = migration partielle
- **Statut** : ✅ Confirmé
- **Décision** : documenter comme `[migration partielle NextAuth → Clerk]`. `@clerk/nextjs@^7.9.20` ET `next-auth@^4.24.15` cohabitent. Le code utilise Clerk v5 dans les patches récents. Le README dit NextAuth (obsolète).
- **Source** : `[confirmé:session]` + `[confirmé:github]`

### D04 — Badge "4463 tests" = déclaratif
- **Statut** : ✅ Confirmé
- **Décision** : marquer `[non vérifié]` dans le PRD et TRD. Pas certifié par un run complet dans cette session.
- **Source** : `[confirmé:github]` badge README

### D05 — MemoLibDev local vs origin
- **Statut** : ✅ Confirmé
- **Décision** : `~/MemoLibDev/v3` est 42 commits ahead / 6 behind `memolibdev-legacy`. Ce n'est pas le dépôt public qui fait foi, c'est le local.
- **Source** : `[confirmé:session]`

### D06 — MemoLibDev = chantier R&D, pas produit packagé
- **Statut** : ✅ Confirmé
- **Décision** : `v3` contient 200+ fichiers Python (fix_*.py, apply_*.py, patch_*.py, 28 dossiers `.patch_backups_*`). C'est un labo, pas un produit propre. Documenter comme tel.
- **Source** : `[confirmé:session]`

### D07 — Modifs MemoLib confirmées
- **Statut** : ✅ Confirmé
- **Décision** : les 6 fichiers modifiés non-commités (`package.json`, `package-lock.json`, `src/lib/auth.ts`, etc.) correspondent aux patchs de session. `src/lib/auth.ts` n'avait pas été touché depuis janvier 2026.
- **Source** : `[confirmé:session]`

### D08 — Aucune écriture sans autorisation
- **Statut** : ✅ Confirmé
- **Décision** : aucun fichier source (`src/`, `prisma/`, `*.py`) modifié sans accord explicite distinct. Seuls les documents dans `documents/` sont créés.

### D09 — README MemoLibDev pointe vers chemin inexistant
- **Statut** : ✅ Confirmé
- **Décision** : `MEMOLIBDEV_TARGET = "C:\Users\moros\Desktop\memolib"` → chemin obsolète. Corriger en `Desktop\PROD\memolib-production`.

### D10 — Audit novembre = source distincte
- **Statut** : ✅ Confirmé
- **Décision** : 3 sources distinctes dans les docs : `[session]`, `[github]`, `[audit-nov]`. Le contrat d'audit fait autorité sur les points qu'il couvre.

### D11 — 🚨 Token GitHub exposé
- **Statut** : ✅ **Révoqué** (confirmation utilisateur)
- **Décision** : token `ghp_So0...` retiré du remote (`git remote set-url`). Remote propre. **Rappel** : ce token reste dans l'historique chat — s'il n'est pas révoqué sur GitHub, action immédiate requise.
- **Source** : `[confirmé:session]`

### D12 — Ménage disque = 5,7 Go libérés
- **Statut** : ✅ Confirmé
- **Décision** : Phase 1 (12 dossiers) + Phase 2a (11 dossiers) = **5,7 Go supprimés**, 0 perte. Worktrees sans `.git` + backups obsolètes + caches IDE.
- **Source** : `[confirmé:session]`

### D13 — 3 dossiers ambigus GARDÉS
- **Statut** : ✅ Confirmé
- **Décision** :
  - `DEV-PYTHON\memolibdev` = fork actif (commit Kokoro du 31/10) → **GARDER**
  - `~/MemoLibDev` racine = labo R&D (orchestrateur v2.4 + legal-engine) → **GARDER**
  - `Projects\memolib_demo_app` = démo active du 28/10 → **GARDER**
- **Source** : `[confirmé:session]` comparaison hash

### D14 — U1 (auth) partiel
- **Statut** : ⚠️ Partiel
- **Décision** : `Select-String` retourne 6 matches combinés `from 'next-auth' | from '@clerk'`. Impossible de distinguer sans relance séparée.
- **Action** : relancer `Select-String` séparément pour chaque lib.

### D15 — U2 (RLS PostgreSQL) ABSENT
- **Statut** : 🔴 **Critique**
- **Décision** : aucune policy `ROW LEVEL SECURITY` / `CREATE POLICY` dans les migrations Prisma. Isolation 100% applicative. **Risque R1 confirmé.**
- **Action** : ajouter RLS avant pilote client.

### D16 — U3 (audit chain) IMPLÉMENTÉ
- **Statut** : ✅ Confirmé
- **Décision** : `src/lib/security/audit-trail.ts:66` calcule `previousHash` correctement (initialisé à `'00...00'` pour le premier log). Hash chain effectif.
- **Source** : `[confirmé:session]`

### D17 — U11 (tests v3) BLOQUÉ
- **Statut** : 🔴
- **Décision** : `pytest --collect-only` échoue avec `ModuleNotFoundError: web_research` dans `test_interface_diagnostic_flow.py`. v3 n'est pas utilisable comme référence de test sans fix.
- **Source** : `[confirmé:session]`

### D18 — U16 (v3 vs DEV-PYTHON) = 2 PROJETS
- **Statut** : ✅ Confirmé
- **Décision** : **A retenu** — `DEV-PYTHON\memolibdev` = produit canonique (src/memolibdev/, CI, pip install -e). `~/MemoLibDev/v3` = labo historique.
- **Source** : `[confirmé:session]` comparaison README

### D19 — RLS = bloquant pilote
- **Statut** : ✅ Confirmé
- **Décision** : documenter RLS absent comme **bloquant** pour tout client réel. Action ImplPlan priorité 1.

### D20 — Scope documentaire = 12 docs + 2 annexes
- **Statut** : ✅ Confirmé
- **Décision** : 6 docs par projet × 2 projets = 12. + `REGISTRE.md` + `README.md` racine = 14 fichiers.
- **Structure** : `documents/memolib/01-06-*.md` + `documents/memolibdev/01-06-*.md` + `documents/REGISTRE.md` + `documents/README.md`

---

## Décisions techniques issues des PRD/TRD

### D21 — Multi-tenant = RLS à ajouter
Voir D15. Action concrète : `ALTER TABLE ... ENABLE ROW LEVEL SECURITY` sur tous les modèles avec `tenantId`.

### D22 — Chiffrement PII colonnes = `[PLAN]`
Colonnes `passportNumber`, `ipAddress`, `oldValue/newValue` AuditLog = données sensibles non chiffrées au niveau colonne. Action : `pgcrypto` ou chiffrement applicatif.

### D23 — Port API : doc 5078 vs code 3000
README cite `http://localhost:5078/swagger` mais `package.json` dit `next start -p 3000`. Incohérence doc. Probablement ancien port .NET. Corriger README.

### D24 — Rôles utilisateur : 9 non audités
Enum `User.role` annoncé 9 rôles (SUPER_ADMIN → CLIENT, GUEST, API). Contenu exact à valider dans Prisma (non lu).

### D25 — Routes orphelines probables
300+ routes dans `src/app/api/` avec seulement 200+ pages. Auditer par `grep fetch('/api/')`.

### D26 — Gemini/Groq backends non-committés
`gemini_backend.py` et `groq_backend.py` sont untracked dans le repo local. À committer ou supprimer.

### D27 — Snapshot MemoLibDev = partiel
`[AUDIT:FAILLE]` : `snapshot()` sauvegarde le certificat mais pas les fichiers modifiés. Rollback multi-fichiers non fonctionnel.

### D28 — extract_targets fragile
`[AUDIT:FAILLE]` : ne matche que `+++ b/...` (format unified diff). 4 autres formats (sans `b/`, `diff -u`, `patch`, etc.) non couverts.

### D29 — run_controlled_apply sans try/catch
`[AUDIT:FAILLE]` : pas de gestion d'erreur autour de `snapshot()`. Exception non gérée → état indéterminé.

---

## Actions en attente

| # | Action | Priorité |
|---|---|---|
| A1 | Révoquer le token `ghp_So0...` sur GitHub (si pas fait) | 🔴 URGENT |
| A2 | Ajouter RLS PostgreSQL | 🔴 Bloquant pilote |
| A3 | Finaliser migration Clerk | 🔴 Bloquant pilote |
| A4 | Corriger `snapshot()` MemoLibDev | 🔴 Bloquant distribution |
| A5 | Corriger `extract_targets()` MemoLibDev | 🔴 Bloquant distribution |
| A6 | Relancer `Select-String` séparé Clerk/NextAuth | 🟠 |
| A7 | Fix `web_research` pour tests v3 | 🟠 |
| A8 | Auditer 34 modèles Prisma non inspectés | 🟢 |
| A9 | Décider dépôt canonique MemoLibDev (public vs legacy) | 🟠 |
| A10 | Nettoyer v3 (200+ fichiers) | 🟢 |

---

## Sources documentaires

| Source | Utilisée pour |
|---|---|
| `[session]` inventaire 2026-11-01 | état local, structure, tailles, git status |
| `[github]` mobby57/memoLib | README, package.json, schema.prisma |
| `[github]` mobby57/memolibdev-legacy | README, requirements.txt, ARCHITECTURE.md |
| `[audit-nov]` (rapporté) | failles MemoLibDev connues |
| `[HYP]` | hypothèses de rédaction, marquées dans chaque doc |

---

**Fin du registre. Version 0.4.0 — révisée à chaque décision.**
