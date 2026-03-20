# MemoLib V1 — Définition & Architecture

## Architecture V1

```
┌─────────────────────────────────────────────────┐
│              Frontend Next.js 16                │
│         src/app/[locale]/pages...               │
│                                                 │
│  src/lib/api-client.ts  ← Client HTTP unifié   │
│  src/lib/api-types.ts   ← Types partagés       │
│  src/lib/services/v1.ts ← Services métier      │
│         │                                       │
└─────────┼───────────────────────────────────────┘
          │ HTTP/JSON (fetch)
          ▼
┌─────────────────────────────────────────────────┐
│           Backend ASP.NET Core 9                │
│              localhost:5078                      │
│                                                 │
│  Controllers/  → 65 endpoints REST              │
│  Services/     → Logique métier                 │
│  Models/       → Entités EF Core                │
│  Data/         → MemoLibDbContext (SQLite)       │
│  Hubs/         → SignalR (temps réel)           │
│                                                 │
└─────────────────────────────────────────────────┘
```

## Périmètre V1 ✅

| Fonctionnalité | Backend C# | Frontend | Service TS |
|---|---|---|---|
| Auth (login/register/JWT) | ✅ AuthController | 🔧 | auth.service.ts |
| Dossiers CRUD + workflow | ✅ CaseController | 🔧 | cases.service.ts |
| Clients CRUD + extraction | ✅ ClientController | 🔧 | clients.service.ts |
| Emails (IMAP + envoi) | ✅ EmailController | 🔧 | emails.service.ts |
| Recherche (text + embeddings) | ✅ SearchController | 🔧 | search.service.ts |
| Dashboard + stats | ✅ StatsController | 🔧 | dashboard.service.ts |
| Notifications SignalR | ✅ NotificationHub | 🔧 | — |
| Templates email | ✅ TemplatesController | 🔧 | emails.service.ts |
| Pièces jointes | ✅ AttachmentController | 🔧 | — |
| Audit logs | ✅ AuditController | 🔧 | — |
| RBAC (5 rôles) | ✅ Program.cs policies | 🔧 | — |

✅ = Implémenté et fonctionnel | 🔧 = Pages à connecter aux services V1

## Hors périmètre V1 (reporté V2+)

- Prisma / PostgreSQL (on garde SQLite)
- Backend Python (Flask/FastAPI)
- Stripe / facturation
- Multi-tenant complet
- IA avancée (Ollama, OpenAI)
- Signatures électroniques DocuSign
- SMS / WhatsApp / Telegram / Messenger
- Multi-secteur
- Calendrier Google/Outlook sync

## État du build

- **Backend C#** : ✅ 0 erreurs, 0 warnings
- **Frontend Next.js** : à vérifier (npm run build)

## Fichiers clés V1

### Backend (source de vérité)
- `Program.cs` — Point d'entrée, DI, middleware, auth
- `Controllers/` — 65 controllers REST
- `Services/` — Logique métier
- `Models/` — Entités de données
- `Data/MemoLibDbContext.cs` — Schéma DB
- `appsettings.json` — Configuration

### Frontend (consommateur)
- `src/lib/api-client.ts` — Client HTTP unifié
- `src/lib/api-types.ts` — Types alignés sur les modèles C#
- `src/lib/services/v1.ts` — Barrel export des services
- `src/lib/services/auth.service.ts` — Auth
- `src/lib/services/cases.service.ts` — Dossiers
- `src/lib/services/clients.service.ts` — Clients
- `src/lib/services/emails.service.ts` — Emails
- `src/lib/services/search.service.ts` — Recherche
- `src/lib/services/dashboard.service.ts` — Dashboard

## Commandes

```powershell
# Backend C#
dotnet run                    # Démarre l'API sur :5078

# Frontend Next.js
npm run dev                   # Démarre le frontend sur :3000

# Tests
dotnet build                  # Vérifie la compilation backend
npm run lint                  # Lint frontend
```
