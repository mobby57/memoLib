# API Boundaries & Contracts (Next → Python)

Objectif: standardiser les échanges entre les routes Next.js (server-only) et le backend Python (Flask en dev, FastAPI en prod).

## Principes

- Communication: HTTP depuis Next `app/api/**/route.ts` vers Python (`http://localhost:5000` en dev).
- AuthN/AuthZ: SSO côté utilisateur via NextAuth (Azure AD). Les appels internes Next → Python sont considérés trusted en dev; en prod, placer le backend derrière un réseau interne/reverse proxy.
- Formats: `application/json` pour requêtes et réponses; encodage UTF-8.
- Erreurs: réponses structurées `{ "error": { "code": string, "message": string } }` avec codes HTTP appropriés.

## Endpoints Typiques

### Emails (process)

- Next route: `/api/emails/process` → Python `POST /emails/process`
- Request (Next → Python):

```json
{
  "threadId": "123",
  "messages": [{ "id": "m1", "subject": "...", "body": "..." }],
  "options": { "summarize": true, "classify": true }
}
```

- Response (Python → Next):

```json
{
  "summary": "...",
  "classification": "urgent|normal|low",
  "suggestedReply": "..."
}
```

### Webhooks Twilio (inbound)

- Next route: `/api/webhooks/twilio` → Python `POST /webhooks/twilio`
- Request (Next → Python):

```json
{ "from": "+336...", "body": "message inbound" }
```

- Response (Python → Next):

```json
{ "status": "received" }
```

### IA (suggest)

- Next route: `/api/ai/suggest` → Python `POST /ai/suggest`
- Request:

```json
{ "context": "text or structured payload", "mode": "reply|summary|categorize" }
```

- Response:

```json
{ "result": "string or structured", "confidence": 0.0 }
```

## Codes HTTP

- 200: succès
- 400: input invalide (schema/validation)
- 401/403: accès non autorisé (si appliqué côté prod)
- 429: rate limit (selon policy)
- 500: erreur interne (inclure `error.code`)

## Timeout & Retries

- Next `fetch`: éviter les traitements > 10s. Pour tâches longues, utiliser un job async côté Python et retourner `202 Accepted` avec un `taskId`.

## Logging & Audit

- Next: journaliser la requête (sans secrets) et la décision utilisateur (validation explicite).
- Python: journaliser entrée/sortie et erreurs avec IDs corrélés (`threadId`, `taskId`).
