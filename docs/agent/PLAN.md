# PLAN.md — Feuille de route MemoLib Production
> Généré le 2026-11-02 après audit complet.  
> **Ne pas coder avant d'avoir dit "GO".**

---

## ÉTAT DES LIEUX (Diagnostic)

### ✅ Ce qui fonctionne

| Composant | Détail |
|---|---|
| TypeScript | `tsc --noEmit` → exit code 0, zéro erreur |
| Prisma / Schéma | Modèles complets : `Tenant`, `Dossier`, `Client`, `Email`, `LegalDeadline`, `AuditLog`, `Case` (récent), comptabilité complète |
| Auth (partiel) | `clerk-auth.ts` exporte `currentUser` + `auth`. `admin/logs/route.ts` corrigé ce soir. |
| Audit trail | Hash chain implémenté dans `src/lib/security/audit-trail.ts` |
| Légifrance client | `src/lib/legifrance/api-client.ts` + `oauth-client.ts` + `judilibre-client.ts` existent |
| CESEDA (partiel) | `src/lib/ceseda-delais.ts` fonctionne pour 3 types |
| App maman | `~/memolib.bak/app_maman.py` (166 lignes, 2 modes), `backend.py` (873 lignes), démarre OK |
| MemoLibDev v3 | Outil de dev Windows autonome, 25 tests pytest OK, scripts `apply.py`, `confidence_engine.py` présents |

### 🔴 Ce qui est cassé ou incomplet

| Problème | Fichier(s) | Gravité |
|---|---|---|
| **RLS PostgreSQL absent** | Neon / `schema.prisma` | CRITIQUE — fuite inter-cabinet possible |
| **Clerk migration partielle** | `src/lib/clerk-auth.ts` (minimal), NextAuth cohabite | CRITIQUE — session cassée en prod |
| **Types Légifrance manquants** | `src/types/legifrance.ts` absent → `buildCesedaSearch` importé mais non défini | BLOQUANT |
| **CESEDA incomplet** | `ceseda-delais.ts` = 3 types seulement (manque OQTF_7J, OQTF_30J, titre séjour, asile CNDA, naturalisation, etc.) | IMPORTANT |
| **Validation Zod absente** sur routes critiques | `src/app/api/dossiers/route.ts`, `clients/route.ts`, `cases/route.ts` | IMPORTANT |
| **`Case` model** non relié à `Tenant` | `prisma/schema.prisma` — `Case` sans `tenantId` → multi-tenant cassé | IMPORTANT |
| **Fichiers `.bak` orphelins** | 10+ fichiers `.bak` dans `src/` (ne compilent pas, bruit) | MINEUR |

### 🟡 Ce qui manque par rapport aux objectifs

| Objectif | État |
|---|---|
| API PISTE complète (CESEDA + jurisprudence) | Client existe, types manquants, routes `/api/legifrance/search` et `/api/jurisprudence/search` non vérifiées |
| Filtrage Prisma strict par `userId`/`tenantId` | Partiellement présent, non uniforme |
| Zod sur toutes les routes | Absent sur la majorité des routes récentes |
| `currentUser()` Clerk partout | Seul `admin/logs` corrigé ce soir. Reste ~30 routes à migrer |

---

## TÂCHES NUMÉROTÉES — Ordre de priorité

### PRIORITÉ 1 — Sécurité (avant tout déploiement pilote)

#### Tâche 1 — Corriger le modèle `Case` : ajouter `tenantId`
- **Fichier** : `prisma/schema.prisma`
- **Action** : Ajouter `tenantId String`, relation `Tenant`, index `[tenantId]`
- **Puis** : `npx prisma migrate dev --name add-tenant-to-case`
- **Règle** : Aucun modèle sans `tenantId`. Multi-tenant = non-négociable.

#### Tâche 2 — Activer Row Level Security (RLS) sur PostgreSQL (Neon)
- **Fichier** : Nouveau fichier `prisma/migrations/rls/enable_rls.sql`
- **Action** : Créer policies RLS pour `Dossier`, `Client`, `Email`, `Document`, `Case`, `LegalDeadline`
- **Modèle policy** : `CREATE POLICY tenant_isolation ON "Dossier" USING (tenant_id = current_setting('app.tenant_id')::text);`
- **Middleware** : `src/lib/prisma.ts` → injecter `SET app.tenant_id` avant chaque requête
- **Priorité** : Bloquant pour pilote.

#### Tâche 3 — Finaliser la migration Clerk (remplacer NextAuth)
- **Fichiers à modifier** :
  - `src/lib/clerk-auth.ts` → exposer `currentUser`, `auth`, helpers `getTenantId()`
  - `src/middleware.ts` → utiliser `clerkMiddleware` de `@clerk/nextjs`
  - Routes à migrer : toutes celles qui importent depuis `next-auth` ou `@/lib/auth`
- **Règle d'or pour chaque route** :
  ```typescript
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
  const tenantId = (user.publicMetadata as { tenantId?: string })?.tenantId;
  if (!tenantId) return NextResponse.json({ error: 'Tenant introuvable' }, { status: 403 });
  ```
- **Routes prioritaires** : `dossiers/route.ts`, `clients/route.ts`, `cases/route.ts`, `emails/route.ts`

#### Tâche 4 — Ajouter validation Zod sur les routes critiques
- **Fichier utilitaire** : `src/lib/validation/api-schemas.ts` (existe, à compléter)
- **Schémas à créer/compléter** :
  - `CaseSchema` (title, typeDossier, prefecture, dateNotification)
  - `DossierSchema` (typeDossier, clientId, articleCeseda)
  - `ClientSchema` (firstName, lastName, email, tenantId)
- **Pattern à respecter** :
  ```typescript
  const body = await request.json();
  const parsed = CaseSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  ```

---

### PRIORITÉ 2 — CESEDA (valeur métier cœur)

#### Tâche 5 — Exposer le RAG CESEDA existant via API FastAPI + connecter Next.js
> ⚠️ Mise à jour 2026-11-02 : `MemoLibDev/v3` contient déjà un RAG CESEDA fonctionnel
> (`ceseda_rag.py` + `ceseda_index.json` 180Ko). On l'expose plutôt que de tout recréer.

- **Étape A — Wrapper FastAPI** : créer `C:\Users\moros\MemoLibDev\v3\ceseda_api.py`
  - Route `POST /ceseda/query` → appelle `ceseda_rag.py` et retourne les articles pertinents
  - Route `GET /ceseda/delais/{type}` → calcule la date limite à partir de `dateNotification`
  - Lance sur port 8001 (distinct du backend maman sur 8000)

- **Étape B — Compléter `ceseda-delais.ts`** : `src/lib/ceseda-delais.ts`
  - Ajouter les types manquants : `OQTF_7J`, `OQTF_30J`, `REFUS_TITRE_1MOIS`, `ASILE_CNDA`, `RETENTION`, `NATURALISATION`, `RECOURS_CONTENTIEUX`
  - Ajouter `getBasisLegale(type)` → retourne l'article CESEDA correspondant

- **Étape C — Client Next.js** : `src/lib/ceseda/rag-client.ts`
  - `queryCeseda(question: string)` → appelle `http://localhost:8001/ceseda/query`
  - Fallback local si le service Python est indisponible (retourne les délais statiques de `ceseda-delais.ts`)

- **Intégration PISTE officielle** : reportée à une phase ultérieure (le RAG local suffit pour le pilote)

#### Tâche 6 — Créer les types TypeScript Légifrance manquants
- **Fichier à créer** : `src/types/legifrance.ts`
- **Exports requis** :
  - `SearchRequest`, `SearchResult`, `Article`, `TexteComplet`
  - `CesedaSearchParams`, `JurisprudenceSearchParams`
  - `buildCesedaSearch(params)` → fonction constructeur de requête
  - `buildJurisprudenceSearch(params)` → idem
- **Source** : Documentation PISTE API v2 (base oauth-client déjà OK)

#### Tâche 7 — Vérifier et corriger `src/app/api/legifrance/search/route.ts`
- **Fichier** : `src/app/api/legifrance/search/route.ts`
- **Actions** :
  - Ajouter `currentUser()` + vérification `tenantId`
  - Ajouter validation Zod sur `?q=` (min 3 chars, max 200)
  - Vérifier que `LegifranceApiClient` est correctement instancié
  - Ajouter fallback local si PISTE indisponible

---

### PRIORITÉ 3 — API PISTE complète

#### Tâche 8 — Intégrer l'API Judilibre (jurisprudence)
- **Fichier existant** : `src/lib/legifrance/judilibre-client.ts` (11KB, existe)
- **Route existante** : `src/app/api/jurisprudence/search/route.ts` (8,6KB)
- **Actions** :
  - Lire et auditer les deux fichiers
  - Corriger les types manquants (bloqués par Tâche 6)
  - Ajouter cache Redis (Upstash) sur les résultats (TTL 24h)
  - Tester avec une vraie recherche OQTF

#### Tâche 9 — Connecter `Case` aux délais CESEDA automatiques
- **Fichiers** : `src/app/api/cases/route.ts` + `src/lib/ceseda-delais.ts`
- **Logique** : Quand un `Case` est créé avec `typeDossier` + `dateNotification`, calculer automatiquement `dateLimiteRecours` et créer un `LegalDeadline` associé
- **Modèle de code** :
  ```typescript
  const dateLimite = calculerDateLimite(typeDossier, dateNotification);
  await prisma.legalDeadline.create({ data: { dossierId: newCase.id, dueDate: dateLimite, ... } });
  ```

---

### PRIORITÉ 4 — Nettoyage & stabilité

#### Tâche 10 — Supprimer les fichiers `.bak` orphelins
- **Fichiers** : 10 fichiers `.bak` dans `src/` (listés dans l'audit)
- **Action** : Supprimer ou déplacer dans `_archive/`

#### Tâche 11 — Auditer les routes sans auth
- **Outil** : `grep -r "export async function GET\|POST\|PUT\|DELETE" src/app/api/ --include="*.ts" -l`
- **Vérifier** : Chaque route a bien `currentUser()` ou est explicitement publique (webhook, health)

---

## RAPPEL DES RÈGLES DE SÉCURITÉ

Pour **chaque** route API créée ou modifiée :

```typescript
// 1. Auth Clerk
const user = await currentUser();
if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

// 2. TenantId obligatoire
const tenantId = (user.publicMetadata as { tenantId?: string })?.tenantId;
if (!tenantId) return NextResponse.json({ error: 'Tenant introuvable' }, { status: 403 });

// 3. Validation Zod
const parsed = MonSchema.safeParse(await request.json());
if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

// 4. Filtre Prisma par tenantId TOUJOURS
const data = await prisma.monModel.findMany({ where: { tenantId } });
```

---

## RÉSUMÉ EXÉCUTIF

| # | Tâche | Priorité | Effort |
|---|---|---|---|
| 1 | `Case` → ajouter `tenantId` + migration | 🔴 Sécurité | 30 min |
| 2 | RLS PostgreSQL | 🔴 Sécurité | 2h |
| 3 | Migration Clerk (routes critiques) | 🔴 Sécurité | 3h |
| 4 | Validation Zod routes critiques | 🔴 Sécurité | 2h |
| 5 | Compléter CESEDA (7 types) | 🟠 CESEDA | 1h |
| 6 | Types TypeScript Légifrance | 🟠 CESEDA | 1h |
| 7 | Route legifrance/search | 🟠 CESEDA | 1h |
| 8 | Judilibre + cache Redis | 🟡 PISTE | 2h |
| 9 | Case → LegalDeadline auto | 🟡 PISTE | 1h |
| 10 | Nettoyage `.bak` | ⚪ Qualité | 15 min |
| 11 | Audit routes sans auth | ⚪ Qualité | 1h |

**Total estimé : ~15h de travail**

---

*Dis "GO" pour commencer la Tâche 1.*
