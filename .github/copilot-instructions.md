# Instructions pour Agents IA (MemoLib)

Objectif: rendre un agent immédiatement productif dans ce dépôt en respectant l’architecture, les conventions et les flux de travail du projet.

## Vue d’ensemble

- Frontend: Next.js 16 (App Router) dans `src/frontend`.
- Backend: Python (FastAPI en `src/backend`, Flask local en `backend-python`).
- Données: Prisma côté Next, SQLAlchemy côté Python selon service.
- Auth: Azure AD via NextAuth; secrets en prod via Azure Key Vault.
- Intégrations: Microsoft Graph, Twilio (WhatsApp/SMS), OpenAI/Llama, Azure Blob.

## Architecture et frontières

- UI/pages: `src/frontend/app` (Server Components). Exemple: `src/frontend/app/(dashboard)/page.tsx`.
- API Frontend (server-only): `src/frontend/app/api/**/route.ts` pour auth/webhooks/intégrations et orchestration vers Python.
- Backend Python: logique métier et endpoints en `src/backend` (ex. `main_fastapi.py`, `routes/`) ; dev local Flask en `backend-python/app.py`.
- Communication: appels HTTP depuis les routes Next.js vers Python (local `http://localhost:5000`), éviter l’accès DB direct inter-composants.

Exemple d’appel depuis une route Next.js vers le backend local:

```ts
// src/frontend/app/api/ai/process/route.ts
export async function POST(req: Request) {
  const body = await req.json();
  const res = await fetch('http://localhost:5000/ai/process', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return new Response(await res.text(), { status: res.status });
}
```

### Exemples supplémentaires

```ts
// src/frontend/app/api/emails/process/route.ts
export async function POST(req: Request) {
  const payload = await req.json();
  const r = await fetch('http://localhost:5000/emails/process', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return new Response(await r.text(), { status: r.status });
}
```

```ts
// src/frontend/app/api/webhooks/twilio/route.ts
export async function POST(req: Request) {
  const form = await req.formData();
  const body = form.get('Body');
  await fetch('http://localhost:5000/webhooks/twilio', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ body }),
  });
  return new Response('OK');
}
```

## Flux de développement et tâches clés

- Installer dépendances: tâche VS Code "Install: All Dependencies" (npm + Python).
- Démarrer tout: "Full Stack: Start All" (Next dev + Flask dev). Individuel: "Frontend: Dev", "Backend: Flask Dev".
- Tests: "Full Stack: Test All" (équivalent `npm test` + `pytest`). Lint: "Full Stack: Lint All".
- Build/Type-check: "Frontend: Build", "Frontend: Type Check", "Frontend: Lint".
- Docker (backend Node tâches): vérifier `src/backend/package.json` avant usage.

## Conventions du projet

- API Next: `app/api/**/route.ts` (server-only, pas d’UI).
- Services/utils: `src/frontend/lib/`, hooks `src/frontend/hooks/`, UI réutilisable `src/frontend/components/`.
- Monitoring: Sentry via `sentry.*.config.ts` et `instrumentation.ts`.
- Sécurité: jamais d’actions automatiques sur données sensibles; validation explicite requise (voir `docs/ARCHITECTURE.md`).
- Environnements: `.env.local` en dev; ne pas hardcoder les secrets (voir `docs/ENVIRONMENT_VARIABLES.md`).

## Données et intégrations

- Prisma (Next) via `prisma/`; Studio disponible via scripts npm.
- Python: DB avec `models.py`/`database.py`; endpoints en `routes/`.
- Intégrations: orchestrer via `app/api/**`, déléguer le traitement lourd au backend Python.

## Tests et qualité

- Frontend: `npm test`, dossiers `__tests__/`, `tests/` (Playwright E2E possible).
- Backend: tâche "Backend: Pytest" ou "Full Stack: Test All".
- Pre-commit: "Pre-Commit: Full Check" (lint + type-check + build frontend).

## Points d’attention

- Backend variants: `src/backend` (FastAPI) et `backend-python` (Flask dev). Utiliser "Backend: Flask Dev" (port 5000) en local; confirmer l’environnement cible avant modification d’endpoints.
- Responsabilités: Next.js gère auth/webhooks/intégrations; Python gère IA et logique métier lourde.
- Sécurité: SSO Azure AD, audit, aucune automatisation sur données sensibles.

## Références utiles

- README: `README.md`
- Architecture: `docs/ARCHITECTURE.md`
- Environnement: `docs/ENVIRONMENT_VARIABLES.md`
- Config Next: `next.config.js`, `open-next.config.ts`
- Sentry: `sentry.client.config.ts`, `sentry.server.config.ts`, `instrumentation.ts`

---

Feedback souhaité: confirmer le backend cible (Flask vs FastAPI), le pattern d’accès DB préféré côté Python, et les endpoints inter-composants à stabiliser pour documenter des exemples supplémentaires.
