# 🚀 Déploiement MemoLib sur Railway

Guide actionnable pour mettre MemoLib en production sur Railway et faire
fonctionner le monitoring d'emails Gmail (cœur du produit) + le temps réel.

Projet Railway : `memolib` / environnement `production`
Domaine : https://memolib.space

---

## Architecture de déploiement (réelle)

```
                    ┌─────────────────────────────┐
                    │  Railway (projet memolib)    │
                    │                              │
  Navigateur ──────▶│  memolib (Next.js)           │
  memolib.space     │    │  ▲                       │
                    │    │  │ DATABASE_URL          │
                    │    ▼  │ (postgres.railway      │
                    │  Postgres (volume) .internal) │
                    │                              │
  Navigateur ─wss──▶│  websocket-server (Socket.IO)│  ◀── À CRÉER
                    │    ▲                          │
                    │    │ POST /emit (WS_EMIT_SECRET)
                    │  memolib ────────────────────┘
                    └─────────────────────────────┘
```

- **Base de données de prod** = Postgres **Railway** (`postgres.railway.internal`), PAS Neon.
- L'app accède à la DB via le réseau privé Railway (host `.internal` injoignable de l'extérieur — normal).

---

## 1. Service `memolib` (app Next.js) — Variables

### Obligatoires (sinon l'app refuse de démarrer ou les crons échouent)

| Variable | Valeur | Notes |
|----------|--------|-------|
| `DATABASE_URL` | `${{Postgres.DATABASE_URL}}` | Référence au service Postgres Railway |
| `NODE_ENV` | `production` | |
| `NEXT_PUBLIC_APP_URL` | `https://memolib.space` | Doit être HTTPS |
| `ENCRYPTION_MASTER_KEY` | (64 hex) | **CRITIQUE. Bloque le démarrage si absent. Ne jamais changer après coup.** |
| `CLERK_SECRET_KEY` | `sk_live_...` | Auth (min 32 chars) |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | `pk_live_...` | Auth (public) |
| `CRON_SECRET` | (secret) | Sinon crons non authentifiés (email-sync = 401) |

### Requises pour le MONITORING EMAIL (le cœur du produit)

| Variable | Valeur | Notes |
|----------|--------|-------|
| `GOOGLE_CLIENT_ID` | `...apps.googleusercontent.com` | OAuth Gmail |
| `GOOGLE_CLIENT_SECRET` | (secret) | OAuth Gmail |
| `AI_PREFERRED_PROVIDER` | `mistral` | Provider IA (FR/RGPD) |
| `MISTRAL_API_KEY` | (clé) | Classification IA des emails |

> Redirect URI Google à déclarer :
> `https://memolib.space/api/email/connect/gmail/callback`

### Requises pour le TEMPS RÉEL (WebSocket)

| Variable | Valeur | Notes |
|----------|--------|-------|
| `NEXT_PUBLIC_WS_URL` | URL publique du service websocket | ex. `https://memolib-websocket-production.up.railway.app` |
| `WS_SERVER_URL` | même URL | Utilisé par le pont serveur `ws-emit` |
| `WS_EMIT_SECRET` | (secret) | **Doit être IDENTIQUE au service websocket** |

### Recommandées en prod

| Variable | Rôle |
|----------|------|
| `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` | Rate limiting |
| `SENTRY_DSN` + `NEXT_PUBLIC_SENTRY_DSN` | Monitoring erreurs |
| `SENTRY_AUTH_TOKEN` | Upload source maps (stack traces lisibles) |
| `STRIPE_SECRET_KEY` + `STRIPE_WEBHOOK_SECRET` | Facturation (si activée) |

---

## 2. Service `websocket-server` (Socket.IO) — À CRÉER

Le dossier `websocket-server/` contient un serveur Socket.IO autonome
(Dockerfile inclus). À déployer comme **service Railway séparé** dans le même
projet, avec pour **Root Directory** : `websocket-server`.

### Variables

| Variable | Valeur | Notes |
|----------|--------|-------|
| `CLERK_SECRET_KEY` | même que l'app | Vérifie les JWT Clerk des clients |
| `WS_EMIT_SECRET` | **IDENTIQUE au service memolib** | Sécurise POST /emit |
| `ALLOWED_ORIGIN` | `https://memolib.space` | CORS |
| `PORT` | (injecté par Railway) | Ne pas définir manuellement |

### Health check
`GET /health` → `{"status":"ok",...}`

---

## 3. Configuration Clerk (JWT Template)

Le serveur WebSocket lit `tenantId` et `role` dans le JWT Clerk.
Dans le dashboard Clerk → **JWT Templates**, exposer ces claims depuis
`publicMetadata` (ou `org_id`), sinon les clients ne rejoindront pas leur
room tenant et ne recevront pas de notifications ciblées.

---

## 4. Ordre de déploiement

1. Créer/renseigner **toutes** les variables obligatoires du service `memolib`.
2. Créer le service `websocket-server` (Root Directory = `websocket-server`) + ses variables.
3. Récupérer l'URL publique du service websocket → la mettre dans `NEXT_PUBLIC_WS_URL` / `WS_SERVER_URL` du service memolib.
4. Déployer les deux services (le commit contient déjà les correctifs Prisma 7, cron IA, WS).
5. Vérifier :
   - `curl -s -o /dev/null -w "%{http_code}" https://memolib.space/api/health` → `200`
   - `curl https://<websocket-url>/health` → `{"status":"ok"}`
6. Se connecter à l'app → **Settings → Emails → Connecter Gmail** (`/api/email/connect/gmail`).
   Cela crée le premier `EmailAccount`. Le cron `email-sync` (toutes les 5 min)
   commencera alors à importer et classifier les emails automatiquement.

---

## 5. Vérifier que le monitoring email tourne

Après avoir connecté une boîte Gmail, forcer un cycle de sync :

```bash
curl -H "Authorization: Bearer $CRON_SECRET" https://memolib.space/api/cron/email-sync
```

Réponse attendue : `{ "synced": 1, "errors": 0, ... }`.
Les emails apparaissent ensuite dans l'inbox MemoLib, classés par l'IA
(type de dossier, urgence), prêts à être intégrés en dossier par l'avocat.
