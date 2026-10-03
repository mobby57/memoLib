# Validation métier — MemoLib

> **Thèse produit :** *empêcher qu'un cabinet perde une info, un délai, une pièce, une action ou une trace.*

Ce document décrit l'**axe de validation métier** de MemoLib. Il matérialise une règle simple mais structurante :

> **« le test existe » ≠ « la logique métier est validée ».**

## 1. Pourquoi cet axe existe

L'ancien moteur de maturité (`scripts/maturity-check.js`) attribue des points de deux façons trompeuses :

- `domains.documents = exists('prisma/schema.prisma') ? 70 : 0` — **70 % pour la simple présence d'un fichier**.
- `domains.ai = exists('src/lib/ai') ? 60 : 0` — 60 % pour un dossier qui existe.
- `domains.functional = exists('src') && exists('prisma/schema.prisma') ? 80 : 0` — 80 % pour deux fichiers présents.
- `domains.legal = firstPassing(['npm run test:legal', ...]) ? 100 : 0` — **100 % dès qu'une commande de test sort en code 0**, peu importe ce qu'elle couvre réellement.

C'est exactement la fausse confiance à éliminer : un fichier présent ou une suite verte ne prouvent pas que la chaîne métier fonctionne.

## 2. L'unité de validation : la chaîne métier

On ne valide pas des tests unitaires isolés, mais la **chaîne complète** :

```
Email → IA → rattachement dossier → extraction obligations/délais
      → calcul juridique → alerte → action → document → audit
```

Un maillon vert alors que la chaîne est rompue = NO-GO.

## 3. Les 6 axes

| Axe | Type | Bloquant | Ce qu'il vérifie |
|---|---|:---:|---|
| `production-build` | command | ✅ | `next build` compile |
| `technical-tests` | command | ✅ | suite CI (Vitest/Jest) verte |
| `critical-e2e` | command | ✅ | Playwright flow critique |
| `security-tenant` | cases | ✅ | isolation multi-tenant, RBAC, antivirus, hash-chain |
| `legal-compliance` | cases | ✅ | délais, moteur CESEDA, RGPD, alertes |
| `business-logic` | cases | ✅ | chaîne Email→Dossier, idempotence, IA, workflow statut |

- **Axes `command`** : évalués en exécutant une commande. Sans `--run-commands`, ils sont `UNKNOWN` (bloquant, mais honnête — jamais un faux PASS).
- **Axes `cases`** : évalués via le catalogue déclaratif `scripts/business-cases.json`.

## 4. Le mécanisme anti-faux-PASS

Un cas ne compte comme **PASS** que si un test **importe le code de production réel** *et* couvre le comportement. Trois garde-fous dans le runner (`scripts/business-validation.js`) :

1. **BROKEN** — un cas déclaré `PASS` dont le `expectedTest` est absent du disque est reclassé `BROKEN` et n'est jamais compté.
2. **`awaitingFix`** — un test écrit mais qui échoue volontairement contre le code actuel (spec de caractérisation d'un bug) reste `GAP`, même si le fichier existe. Cela empêche « un fichier existe donc c'est vert ».
3. **GAP / FALSE / PARTIAL** ne comptent jamais comme passant.

Statuts possibles :

| Statut | Signification |
|---|---|
| `PASS` | Test importe le code de prod réel et couvre le cas (positif + négatif si pertinent). |
| `PARTIAL` | Partiellement couvert, chemins critiques manquants. |
| `FALSE` | Un test existe mais valide un modèle inexistant, ou ré-implémente le code au lieu de l'importer. |
| `GAP` | Aucun test réel ne couvre le cas. |
| `BROKEN` | Calculé : `PASS` déclaré mais fichier de test absent. |

## 5. État actuel (grounded dans le code)

**Verdict : 🔴 NO-GO** — 20 PASS · 0 PARTIAL · 0 FALSE · 0 GAP.

Tous les axes **basés cas** sont verts. Le NO-GO subsiste uniquement parce que les 3 axes `command` (build / tests / e2e) sont `UNKNOWN` : ils n'ont pas été exécutés dans cet environnement. C'est le garde-fou anti-faux-PASS : sans exécution réelle, le runner refuse de déclarer GO.

🟢 **Réellement validés (test important le code de prod) :** idempotence email entrant, isolation tenant (anti-IDOR), RBAC deny, idempotence webhook Stripe, hash-chain audit, alertes J-7 / J-3 / J-1 / retard + anti-doublon, Email→Dossier + persistance des délais (P0), moteur CESEDA unifié + report jours ouvrés/fériés (P1), fallback IA + NO-auto-send + revue humaine (P2), RGPD anonymisation/effacement effectifs (P2), scan antivirus sur upload (P2), mappers de statut dossier cohérents avec le schéma réel (P2).

Pour passer GO : lancer `npm run business:validate:full` (exécute build + tests + e2e) dans un environnement avec dépendances installées.

## 6. Règle GO/NO-GO

GO **uniquement** si tous les axes bloquants passent :

- un axe `cases` passe si **tous** ses cas sont `PASS` ;
- un axe `command` passe si **toutes** ses commandes retournent `PASS` (`UNKNOWN` et `FAIL` bloquent).

## 7. Utilisation

```powershell
# Rapport (cas seulement ; axes command = UNKNOWN)
npm run business:validate

# Idem mais exit 1 si NO-GO (pour un gate local)
npm run business:validate:strict

# Exécute aussi build + tests + e2e (nécessite les dépendances installées)
npm run business:validate:full

# Variante CI : exécute seulement les gates build + tests (e2e reste UNKNOWN)
npm run business:validate:ci
```

Le runner accepte `--commands=<id1,id2>` pour n'exécuter que certains gates (par id : `production-build`, `technical-tests`, `critical-e2e`). Les gates non sélectionnés restent `UNKNOWN` — jamais un faux PASS.

Sorties générées : `reports/business-validation.md` et `reports/business-validation.json`.

### Intégration CI (état honnête)

La job `memolib-maturity.yml` lance `npm run business:validate:ci` (build + tests). **Sans `--strict`**, l'étape publie le rapport dans le résumé de job sans bloquer : c'est volontaire car la suite `test:ci` existante comporte actuellement des échecs **préexistants** (au 2026-09, ~77 tests en échec sur ~4646, dans des fichiers non liés à cet axe — `teams`, `lawyer/workspace-emails`, `dateValidator`… issus de la migration Clerk en cours). Le gate `technical-tests` rapporte donc honnêtement `FAIL` tant que ces tests ne sont pas réparés ; il ne faut pas le rendre bloquant sur une dette préexistante hors périmètre.

Pour un GO réel : réparer la suite `test:ci`, puis passer la CI en `business:validate:full`/`--strict`.

## 8. Comment fermer un GAP

1. Écrire un test qui **importe le code de production réel** (pas de ré-implémentation), couvrant le cas positif *et* le cas négatif quand il est pertinent.
2. Faire pointer le champ `expectedTest` du cas vers ce fichier dans `scripts/business-cases.json`.
3. Passer le `status` du cas à `PASS` et retirer `awaitingFix` s'il était présent.
4. Relancer `npm run business:validate` et vérifier que le cas est bien 🟢.

### Prochain GAP prioritaire

**P0 fermé :** `EMAIL-TO-DOSSIER` / `DEADLINE-PERSIST` — la route `create-dossier` fournit désormais les champs requis (`id`, `referenceDate`, `createdBy`, `updatedAt`), mappe les `type` sur l'enum `DeadlineType`, et ne masque plus l'échec de persistance (`.catch(() => {})` retiré). Le test `src/__tests__/api/emails/create-dossier-route.test.ts` importe le code de prod et couvre le chemin négatif.

**P1 fermé :** `CESEDA-ENGINE-UNIFIED` / `CESEDA-JOURS-FERIES` — le calcul inline a été extrait dans `src/lib/legal/ceseda-deadlines.ts` (source unique, importée par la route et par son test) et applique `nextWorkingDay()` : aucun délai ne tombe un week-end ou un jour férié.

**P2 fermé :** `AI-FALLBACK` / `AI-NO-AUTO-SEND` / `AI-HUMAN-REVIEW` (tests important les routes `summarize-email` et `draft-reply`), `RGPD-ERASURE` (anonymisation/effacement effectifs prouvés sur `RGPDComplianceService`), `ANTIVIRUS-SCAN` et `DOSSIER-STATUS-TRANSITIONS` (tests FALSE remplacés par des tests important le code de prod), `ALERT-J3-J1` / `ALERT-NO-DUPLICATE` (seuils J-3/J-1 + anti-doublon négatif sur `checkDeadlineAlerts`).

**Reste pour GO :** exécuter les 3 axes `command` (build + tests + e2e) via `npm run business:validate:full` dans un environnement avec dépendances installées.
