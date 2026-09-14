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

**Verdict : 🔴 NO-GO** — 12 PASS · 2 PARTIAL · 2 FALSE · 4 GAP.

🟢 **Réellement validés :** idempotence email entrant, isolation tenant (anti-IDOR), RBAC deny, idempotence webhook Stripe, hash-chain audit, alertes J-7 / retard, **Email→Dossier + persistance des délais** (P0), **moteur CESEDA unifié + report jours ouvrés/fériés** (P1).

🔴 **GAP centraux restants :**
- **`AI-FALLBACK` / `AI-NO-AUTO-SEND` / `AI-HUMAN-REVIEW`** — pas de fallback Ollama testé, pas de verrou « NO auto-send », chemin de revue humaine jamais exercé.
- **`RGPD-ERASURE`** — aucun test ne prouve la suppression/anonymisation effective.

🔴 **FALSE (tests trompeurs à remplacer) :**
- **`ANTIVIRUS-SCAN`** — le scanner est ré-implémenté dans le test ; le code de prod n'est jamais importé.
- **`DOSSIER-STATUS-TRANSITIONS`** — matrice de transitions définie en MAJUSCULES dans le test, alors que la route écrit `statut: 'en_cours'` (minuscules). Valide un modèle qui n'existe pas.

🟠 **PARTIAL :** alertes J-3 / J-1 jamais assertées ; « pas de doublon » jamais testé négativement.

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
```

Sorties générées : `reports/business-validation.md` et `reports/business-validation.json`.

## 8. Comment fermer un GAP

1. Écrire un test qui **importe le code de production réel** (pas de ré-implémentation), couvrant le cas positif *et* le cas négatif quand il est pertinent.
2. Faire pointer le champ `expectedTest` du cas vers ce fichier dans `scripts/business-cases.json`.
3. Passer le `status` du cas à `PASS` et retirer `awaitingFix` s'il était présent.
4. Relancer `npm run business:validate` et vérifier que le cas est bien 🟢.

### Prochain GAP prioritaire

**P0 fermé :** `EMAIL-TO-DOSSIER` / `DEADLINE-PERSIST` — la route `create-dossier` fournit désormais les champs requis (`id`, `referenceDate`, `createdBy`, `updatedAt`), mappe les `type` sur l'enum `DeadlineType`, et ne masque plus l'échec de persistance (`.catch(() => {})` retiré). Le test `src/__tests__/api/emails/create-dossier-route.test.ts` importe le code de prod et couvre le chemin négatif.

**P1 fermé :** `CESEDA-ENGINE-UNIFIED` / `CESEDA-JOURS-FERIES` — le calcul inline a été extrait dans `src/lib/legal/ceseda-deadlines.ts` (source unique, importée par la route et par son test) et applique `nextWorkingDay()` : aucun délai ne tombe un week-end ou un jour férié.

**P2 suivant — validation IA :** fermer `AI-FALLBACK` (Ollama down → fallback regex), `AI-NO-AUTO-SEND` (aucune action IA sans validation humaine), `AI-HUMAN-REVIEW` (chemin `humanReviewRequired=true`), puis `RGPD-ERASURE` (prouver la suppression/anonymisation effective).
