# Spec de correction P0 + P1 — Funnel d'inscription MemoLib

> **Statut : PROPOSITION À RELIRE.** Aucune ligne de code MemoLib n'a été modifiée.
> Option retenue : **A — Tout Clerk** (Clerk = source de vérité de l'authentification,
> Prisma = source de vérité de l'autorisation / tenant / facturation).
>
> Document produit par audit en lecture seule. Références de code vérifiées le 2026-10-03.

---

## 1. Rappel du problème (vérifié dans le code)

| Fait | Preuve |
|---|---|
| Auth active = Clerk | `src/app/[locale]/layout.tsx` (`<ClerkProvider>`), `src/middleware.ts` (`clerkMiddleware()`), `package.json` (`@clerk/nextjs ^7.8.2`, pas de `next-auth`) |
| Le CTA landing mène à un formulaire custom | `landing/page.tsx` → `href="/fr/signup"` → `signup/page.tsx` → `<SaasSignupForm>` |
| Ce formulaire crée un user hors Clerk | `SaasSignupForm` → `POST /api/saas/signup` → `saasSignup()` fait `bcrypt.hash(password)` + `prisma.user.create`, **0 appel Clerk** |
| Puis redirige vers une zone protégée Clerk | `SaasSignupForm` → `router.push('/fr/dashboard?welcome=true')`, or `/dashboard` est derrière `clerkMiddleware` |
| Lien Clerk↔Prisma = email uniquement | `src/lib/clerk-auth.ts` → `prisma.user.findUnique({ where: { email } })` |
| Pas de champ `clerkUserId` dans le modèle User | `prisma/schema.prisma` ligne 1180, `password String` non-null, `emailVerified DateTime?`, aucun champ Clerk |
| Pas de webhook Clerk | absence de `src/app/api/webhooks/clerk/` |

**Impact utilisateur :** un avocat qui s'inscrit via le parcours principal ne peut pas se
reconnecter (mot de passe inconnu de Clerk). Funnel principal cassé.

---

## 2. Cible du parcours (après correction)

```
Landing (/fr/landing)
   │ CTA "Créer mon cabinet" → /fr/sign-up
   ▼
/fr/sign-up  →  <SignUp/> Clerk
   │ Clerk gère : mot de passe, vérification email, anti-bot
   ▼
Clerk crée le compte + session  →  émet webhook "user.created"
   │
   ├──────────────► POST /api/webhooks/clerk  (asynchrone)
   │                   provisioning : tenant + settings + subscription(trial)
   │                   + User Prisma lié par clerkUserId  + Stripe customer
   ▼
Redirection Clerk → /fr/dashboard  (session valide)
   ▼
Dashboard : OnboardingFlow (session Clerk OK, tenantId résolu)
```

Principe clé : **le mot de passe et la vérification email sortent complètement de
MemoLib** et deviennent la responsabilité de Clerk. Le provisioning métier
(`saasSignup`) est déclenché par le webhook, pas par un formulaire custom.

---

## 3. P0 — Réparer l'inscription

### 3.1 Schéma Prisma — lier Clerk à l'User

Dans `prisma/schema.prisma`, modèle `User` :

```prisma
model User {
  id            String   @id
  email         String   @unique
  name          String
  password      String?   // ← devient OPTIONNEL (Clerk détient le secret)
  clerkUserId   String?  @unique   // ← NOUVEAU : lien durable Clerk
  // ... reste inchangé
  @@index([clerkUserId])
}
```

- `password` passe de `String` à `String?` : les comptes créés via Clerk n'ont pas
  de mot de passe local. **Les comptes legacy existants gardent le leur** (pas de
  perte de données, migration additive).
- `clerkUserId` unique nullable : rempli au provisioning. Devient le lien durable
  (remplace progressivement le lien-par-email, plus fragile).

Migration : `npx prisma migrate dev --name add_clerk_user_id` (additive, non destructive).

### 3.2 Nouvelle route : `POST /api/webhooks/clerk`

Calquée sur le style de `src/app/api/webhooks/stripe/route.ts` (raw body + vérification
de signature + `switch` sur type d'event). Vérification via `svix` (lib officielle Clerk).

Pseudocode :

```ts
import { Webhook } from 'svix';
import { headers } from 'next/headers';

const secret = process.env.CLERK_WEBHOOK_SIGNING_SECRET || '';

export async function POST(req: NextRequest) {
  if (!secret) return 503;                       // comme le webhook Stripe
  const body = await req.text();                 // RAW body obligatoire
  const h = await headers();
  const evt = new Webhook(secret).verify(body, {
    'svix-id': h.get('svix-id')!,
    'svix-timestamp': h.get('svix-timestamp')!,
    'svix-signature': h.get('svix-signature')!,
  });

  switch (evt.type) {
    case 'user.created': await provisionFromClerk(evt.data); break;
    case 'user.updated': await syncFromClerk(evt.data); break;
    case 'user.deleted': await softDeleteFromClerk(evt.data); break;
  }
  return NextResponse.json({ received: true });
}
```

Exclure cette route du `clerkMiddleware` (comme `/api/compliance/consent` l'est déjà
dans `src/middleware.ts`), sinon le webhook est intercepté.

### 3.3 Refactor `saasSignup` → `provisionFromClerk`

`saasSignup` (dans `src/lib/services/saas-provisioning.ts`) est **réutilisé à 90 %**.
Seuls changent l'entrée et deux lignes :

| Avant | Après |
|---|---|
| Entrée = formulaire (password inclus) | Entrée = payload Clerk `user.created` (clerkUserId, email, prénom/nom) |
| `password: hashedPassword` | **supprimé** (plus de password local) |
| — | `clerkUserId: data.id` ajouté sur `user.create` |
| `emailVerified: new Date()` | conservé (Clerk ne laisse passer que les emails vérifiés) |

Le reste (tenant, TenantSettings, Subscription trial, Stripe customer, email de
bienvenue) **reste identique**. Le plan/cabinet, aujourd'hui saisis dans le formulaire,
seront passés à Clerk via `unsafeMetadata` sur `<SignUp/>` et relus dans le payload du
webhook (`data.unsafe_metadata.plan`, `.cabinetName`).

> Note : `activateAfterPayment` (webhook Stripe) reste inchangé.

### 3.4 Remplacer le point d'entrée d'inscription

- `signup/page.tsx` : remplacer `<SaasSignupForm>` par une redirection/`<SignUp/>`
  Clerk, OU conserver la sélection de plan en amont et passer `plan`+`cabinetName`
  dans `unsafeMetadata` du `<SignUp/>`.
- `SaasSignupForm` et `POST /api/saas/signup` : **à retirer** une fois le webhook en place.

---

## 4. P1 — Unifier les pages d'auth

Objectif : une seule paire `/sign-in` + `/sign-up`.

| Route | Action | Raison |
|---|---|---|
| `/sign-in/[[...sign-in]]` | **Garder** (canonique) | `<SignIn/>` Clerk |
| `/sign-up/[[...sign-up]]` | **Garder** (canonique) | `<SignUp/>` Clerk |
| `/signup` | Rediriger → `/sign-up` | doublon cassé |
| `/login` | Rediriger → `/sign-in` | redirige déjà, re-cibler |
| `/auth/login` | Rediriger → `/sign-in` | legacy NextAuth |
| `/auth/register` | Rediriger → `/sign-up` | 3e formulaire custom |
| `/auth/verify-email` | Supprimer | Clerk gère la vérif |
| `/auth/forgot-password` `/auth/reset-password` | Supprimer | Clerk gère |
| `/auth/error` | Supprimer / rediriger | plus de flux NextAuth |

Mettre à jour tous les liens internes qui pointent vers l'ancien monde, notamment :
- `landing/page.tsx` : « Se connecter » → `/fr/auth/login` **→** `/fr/sign-in`
- `signup/page.tsx` footer : `/fr/auth/login` **→** `/fr/sign-in`
- `api/email/connect/gmail/route.ts` : fallback `/fr/auth/login` **→** `/fr/sign-in`

Config Clerk (env) à aligner :
```
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/fr/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/fr/sign-up
NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL=/fr/dashboard
NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL=/fr/dashboard
```

---

## 5. Variables d'environnement à ajouter

`.env.example` ne contient aujourd'hui que `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` et
`CLERK_SECRET_KEY`. Ajouter :

```env
# Webhook Clerk (provisioning à la création de compte)
CLERK_WEBHOOK_SIGNING_SECRET=whsec_<depuis Clerk Dashboard > Webhooks>
```

Configurer dans Clerk Dashboard un endpoint `https://<domaine>/api/webhooks/clerk`
abonné à `user.created`, `user.updated`, `user.deleted`.

---

## 6. Plan de test (E2E Playwright + unitaire)

### Unitaire (Vitest)
- `provisionFromClerk` crée tenant + user (avec `clerkUserId`) + settings + subscription trial.
- Idempotence : rejouer `user.created` avec le même `clerkUserId` ne duplique pas.
- `clerk-auth.ts` résout l'identité via `clerkUserId` (puis fallback email pour legacy).
- Webhook rejette une signature svix invalide (400) et renvoie 503 si secret absent.

### E2E (Playwright) — le parcours qui est cassé aujourd'hui
1. Visiter `/fr/landing` → cliquer « Créer mon cabinet » → arriver sur `/fr/sign-up` Clerk.
2. Créer un compte (email de test Clerk) → vérification email Clerk → redirigé vers `/fr/dashboard`.
3. **Assertion clé : le dashboard s'affiche avec une session valide** (ce qui échoue aujourd'hui).
4. Vérifier que `OnboardingFlow` est visible et que `accountCreated = true`.
5. Se déconnecter puis se reconnecter via `/fr/sign-in` avec le même compte → succès.
6. Vérifier qu'un `User` Prisma existe avec le bon `clerkUserId` et un `tenantId`.

Le projet a déjà `@clerk/testing` (`package.json`) → utilisable pour contourner le
bot-protection Clerk en E2E.

---

## 7. Ordre d'exécution recommandé (en sandbox, branche dédiée)

1. Migration Prisma `clerkUserId` + `password` optionnel (additive).
2. Route webhook `/api/webhooks/clerk` + exclusion middleware + env secret.
3. Refactor `saasSignup` → `provisionFromClerk` (réutilise la logique existante).
4. Basculer `/signup` vers `<SignUp/>` Clerk (avec métadonnées plan/cabinet).
5. Mettre à jour `clerk-auth.ts` (résolution par `clerkUserId`, fallback email).
6. Redirections P1 + nettoyage pages legacy + liens internes.
7. Retirer `SaasSignupForm` + `/api/saas/signup`.
8. Tests unitaires + E2E.
9. Mettre à jour README (Clerk, pas NextAuth).

**P0 = étapes 1-5 et 8** (débloque l'inscription). **P1 = étapes 6-7 et 9**.

---

## 8. Risques / points d'attention

- **Comptes legacy** (créés par l'ancien `saasSignup` avec password bcrypt) : ils n'ont
  pas de `clerkUserId`. Prévoir un lien à la 1re connexion Clerk via l'email
  (match email → backfill `clerkUserId`). Le fallback email dans `clerk-auth.ts` couvre
  la transition.
- **Latence webhook** : `user.created` est asynchrone. Entre la création Clerk et le
  provisioning, l'utilisateur peut atteindre `/dashboard` sans `tenantId`. L'API
  `/api/onboarding/status` renvoie déjà `needsOnboarding:true` dans ce cas — prévoir un
  état « provisioning en cours » plutôt qu'une erreur.
- **Multi-tenant Clerk Organizations** : `clerk-auth.ts` lit déjà `orgId` mais rien ne le
  provisionne. Hors scope P0/P1 — à traiter ensuite si on veut aligner tenant Prisma ↔
  org Clerk. Pour l'instant, le tenant reste Prisma, lié à l'user.
- **Stripe** : le flux checkout partait du formulaire. En Option A, le trial démarre au
  provisioning (webhook) ; le passage au paiement se fait depuis le dashboard/billing.
  Vérifier que `getStripePriceId` et le webhook Stripe restent cohérents.
```