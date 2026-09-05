# Validation métier de MemoLib — 6 axes de maturité

> **Principe fondateur** : « le test existe » ≠ « la logique métier est validée ».
> Un cas n'est **PASS** que si un test **importe le code de production réel** et couvre le
> comportement (positif **et**, quand c'est pertinent, négatif). Sinon : **GAP** (à écrire),
> **FALSE** (test trompeur à remplacer), **PARTIAL** (partiel) ou **BROKEN** (PASS déclaré
> sans test réel). **Jamais de faux PASS.**
>
> L'unité de validation est la **chaîne métier**, pas le test unitaire.

## Pourquoi cet axe existe

Le compteur historique (`scripts/maturity-check.js`) récompensait l'**existence de fichiers** :
`documents = 70 %` si `prisma/schema.prisma` existe, `ai = 60 %` si le dossier `src/lib/ai`
existe, `legal = 100 %` si une commande `test:legal` sort en code 0. C'est exactement le
piège « le test existe = c'est validé ». Un build vert et 4 500 tests unitaires ne prouvent
pas que MemoLib **empêche un cabinet de perdre un délai, une pièce, une action ou une trace**.

### La vraie proposition de valeur à valider

> **Empêcher qu'un cabinet perde une information, un délai, une pièce, une action ou une
> trace de responsabilité sur un dossier.** L'IA vient ensuite *accélérer* le travail.

Avoir « dossiers + facturation + documents » n'est pas différenciant (le marché a déjà des
suites complètes). Ce qui se valide ici, c'est la **chaîne complète** :

```
Email entrant → compréhension IA → rattachement au dossier → extraction des obligations/délais
→ calcul juridique → alerte → action → document → historique/audit
```

## Les 6 axes

| # | Axe | Type | Bloquant | Évalué par |
|---|---|---|:---:|---|
| 1 | Production / Build | commande | 🔴 | `npm run build` |
| 2 | Tests techniques | commande | 🔴 | `npm run test:ci` |
| 3 | E2E utilisateur | commande | 🔴 | `npm run test:e2e` |
| 4 | Sécurité / multi-tenant | cas | 🔴 | catalogue de cas (tests important le code prod) |
| 5 | Conformité juridique | cas | 🔴 | catalogue de cas |
| 6 | Business Logic métier | cas | 🔴 | catalogue de cas |

Les axes 1–3 sont pilotés par commande : sans `--run-commands`, ils sont marqués **⚪ non
exécuté** (jamais comptés comme PASS). Les axes 4–6 sont pilotés par le **catalogue de cas**
(`scripts/business-validation/business-cases.json`).

## Règle de GO / NO-GO

> besoin métier → règle métier → implémentation → **test positif** → **test négatif** →
> sécurité → traçabilité → **résultat reproductible**.

**GO** uniquement si **aucun axe bloquant n'est 🔴** (ni FAIL ni UNKNOWN). Un axe de cas ne
passe que si **tous** ses cas sont PASS — un seul GAP/FALSE/PARTIAL le fait échouer.

## Comment l'exécuter

```bash
npm run business:validate         # rapport seul (axes commande = "non exécuté")
npm run business:validate:strict  # échoue (exit 1) si un axe de cas bloquant est rouge
npm run business:validate:full    # exécute aussi build/test/e2e (--run-commands --strict)
```

Sorties : `reports/business-validation.md` (le rapport « cas métier réellement vérifiés »)
et `reports/business-validation.json`. Le workflow `.github/workflows/memolib-maturity.yml`
publie ce rapport dans le résumé du job.

## État réel actuel (issu de l'audit empirique)

Verdict : **🔴 NO-GO**. Décompte : **11 PASS · 17 GAP · 2 FALSE · 2 PARTIAL** (axes
commande non exécutés dans l'environnement d'audit — dépendances npm indisponibles).

### 🟢 Cas réellement validés (test importe le code prod + cas négatifs)

| Cas | Axe | Preuve |
|---|---|---|
| EMAIL-RECEIVE / EMAIL-DEDUP / EMAIL-IDEMPOTENCE-RACE | Business | `incoming-route.test.ts` (route réelle : doublon, P2002, 401/400/404) |
| ALERT-J7 / ALERT-OVERDUE | Business | `deadline-alerts.test.ts` (cron réel) |
| BILLING-WEBHOOK-IDEMPOTENCE | Business | `webhook-idempotency` + `webhook-route` (2 couches, rejeu = 1 op) |
| DOC-TEMPLATE-VARS | Business | `templateEngine.real.test.ts` (variable manquante → échec) |
| TENANT-ISOLATION-HELPER | Sécurité | `dossier-access.test.ts` (anti-IDOR `where{id,tenantId}`) |
| RBAC-DENY | Sécurité | `rbac-cross-role.test.ts` (matrice de refus 403/401) |
| DEADLINE-CESEDA-RULES | Juridique | `deadlineEngine.real.test.ts` (OQTF 48h/30j, ASILE, 2 mois) |
| AUDIT-HASHCHAIN | Juridique | `audit-trail.test.ts` (chaîne cassée + falsification détectées) |

### 🔴 GAP prioritaires (chaîne centrale non prouvée)

- **EMAIL-TO-DOSSIER / DEADLINE-PERSIST** — la route `create-dossier` était **0 % couverte**.
  Un spec a été écrit (`create-dossier-route.test.ts`, `describe.skip`) : il vérifie que
  chaque `legalDeadline.create` fournit `id/referenceDate/createdBy/updatedAt` et un `type`
  de l'enum `DeadlineType`, et qu'un échec de persistance **n'annonce pas** un succès muet.
  Il **échoue volontairement** contre la route actuelle (`.catch(()=>{})` + champs manquants
  + type hors enum). Retirer le `.skip` en corrigeant la route → le cas passe à PASS.
- **DEADLINE-ENGINE-UNIFIED** — 3 moteurs CESEDA divergents ; celui **câblé** à email→dossier
  (`getCesedaDeadlines` inline) est le seul non testé.
- **AI-FALLBACK / AI-NO-AUTOSEND / HUMAN-VALIDATION** — pas de test de dégradation IA
  (Ollama down), pas d'assertion « aucun envoi automatique », FLOW-001 non verrouillée.
- **ALERT-J3-J1 / ALERT-NO-DUPLICATE** — J-3/J-1 jamais assertés, « pas de doublon » jamais
  testé négativement.

### 🟠 FALSE (tests trompeurs à remplacer)

- **DOSSIER-STATUS-TRANSITIONS** — `dossier-status.test.ts` définit la matrice de transitions
  **dans le test**, en MAJUSCULES, alors que le schéma utilise `statut` en minuscules
  (`en_cours`). Ne valide **aucun** code de production.
- **UPLOAD-ANTIVIRUS** — `document-security.test.ts` ré-implémente le scanner **dans le test**;
  le scanner de production n'est jamais importé.

### 🟡 PARTIAL

- **DEADLINE-WORKING-DAYS** — week-end = 1 seul scénario, **jours fériés jamais testés**.
- **GDPR-ERASURE** — cas négatifs présents, mais **aucune assertion** que la donnée est
  réellement supprimée/anonymisée (le design ne crée qu'une demande `PENDING_REVIEW`).

### ⚠️ Tests « fausse confiance » identifiés (à corriger)

Tests qui mockent des modèles/relations **absents du schéma actif** (donc verts contre un
modèle inexistant) : `dossier.mapper.test.ts` (`_count.echeances`), `dossiers.test.ts`
(`echeances:true`), `dossier.service.test.ts` (×2), `workspace-emails-route.test.ts`
(`prisma.workspaceEmail`). Voir `docs/AUDIT_ARCHITECTURE.md` pour le contexte du modèle scindé.

## Adéquation marché × métier (cadrage)

| Adéquation | Niveau |
|---|---|
| Marché (digitalisation, IA juridique) | 🟢 forte |
| Besoin métier (ne rien perdre : délai/pièce/action/trace) | 🟢 potentiellement très forte |
| Différenciation actuelle | 🟠 à démontrer (≠ suite de gestion générique) |
| Risque principal | 🔴 fiabilité **délais** + **sécurité** + **IA** |

C'est précisément sur le risque principal que portent les GAP/FALSE ci-dessus : tant qu'ils
ne sont pas fermés, MemoLib ne doit pas être déclaré « mature » même si le build et les tests
techniques passent.

## Comment étendre le catalogue

Éditer `scripts/business-validation/business-cases.json` :
- ajouter un objet dans `cases` avec `id`, `axis`, `chain`, `title`, `productionModule`,
  `expectedTest`, `assertion`, `negative[]`, `status`.
- `expectedTest` doit pointer un test qui **importe le module de production** (pas un mock de
  la logique). Le runner reclasse en **BROKEN** un `PASS` dont le fichier de test n'existe pas.
- utiliser `"awaitingFix": true` pour un test écrit qui échoue volontairement contre le code
  actuel : il reste **GAP** tant que le code n'est pas corrigé (jamais un faux PASS).

---

*Voir aussi : `docs/AUDIT_ARCHITECTURE.md` (audit du modèle de données) et
`docs/RELEASE_REQUIREMENTS.json` (registre d'exigences bloquantes avec preuves).*
