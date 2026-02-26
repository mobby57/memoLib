# Phase 2 - OAuth Intégrations ✅

## Fichiers créés

| Fichier                                | Description                                                       |
| -------------------------------------- | ----------------------------------------------------------------- |
| `src/lib/oauth/oauth-service.ts`       | Service OAuth principal avec Google, Microsoft, GitHub connectors |
| `src/lib/oauth/integrations.ts`        | Connecteurs Google Calendar/Contacts, Microsoft Calendar/Contacts |
| `src/lib/oauth/calendar-bridge.ts`     | Bridge entre APIs externes et CalendarService interne             |
| `src/app/api/oauth/authorize/route.ts` | GET route pour générer URL OAuth                                  |
| `src/app/api/oauth/callback/route.ts`  | POST route pour échanger code → token                             |
| `src/hooks/useOAuth.ts`                | Hook React pour login OAuth côté client                           |

---

## Architecture

### OAuth Service Hierarchy

```
OAuthService (singleton)
├── GoogleOAuthConnector
│   ├── Authorization URL generation
│   ├── Code → Token exchange
│   ├── Token refresh
│   └── User info retrieval
├── MicrosoftOAuthConnector
│   ├── Authorization URL generation
│   ├── Code → Token exchange
│   ├── Token refresh
│   └── User info retrieval
└── GitHubOAuthConnector
    ├── Authorization URL generation
    ├── Code → Token exchange
    ├── No token refresh (GitHub limitation)
    └── User info retrieval
```

### Integration Connectors

```
IntegrationConnectorFactory
├── GoogleCalendarConnector
│   ├── listEvents()
│   └── createEvent()
├── GoogleContactsConnector
│   └── listContacts()
├── MicrosoftCalendarConnector
│   ├── listEvents()
│   └── createEvent()
└── MicrosoftContactsConnector
    └── listContacts()
```

### Calendar Bridge

```
ExternalCalendarBridge
├── syncGoogleCalendar() → CalendarEvent[]
├── syncMicrosoftCalendar() → CalendarEvent[]
├── syncGoogleContacts() → { id, name, email, phone }[]
└── syncMicrosoftContacts() → { id, name, email, phone }[]
```

---

## Configuration requise

### Variables d'environnement

```env
# Google OAuth
GOOGLE_CLIENT_ID=xxx
GOOGLE_CLIENT_SECRET=xxx

# Microsoft OAuth
MICROSOFT_CLIENT_ID=xxx
MICROSOFT_CLIENT_SECRET=xxx

# GitHub OAuth
GITHUB_ID=xxx
GITHUB_SECRET=xxx

# NextAuth base
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key
```

### Scopes par provider

**Google:**

- `openid profile email` - User info
- `https://www.googleapis.com/auth/calendar` - Google Calendar
- `https://www.googleapis.com/auth/contacts` - Google Contacts

**Microsoft:**

- `openid profile email` - User info
- `Calendars.Read Calendars.ReadWrite` - Outlook Calendar
- `Contacts.Read` - Outlook Contacts

**GitHub:**

- `read:user` - User profile
- `user:email` - User email

---

## Utilisation

### Frontend - Login OAuth

```tsx
import { useOAuth } from '@/hooks/useOAuth';

export function GoogleLoginButton() {
  const { startLogin, loading } = useOAuth({
    provider: 'google',
    scopes: ['openid', 'profile', 'email'],
    onSuccess: () => console.log('Logged in!'),
  });

  return (
    <button onClick={startLogin} disabled={loading}>
      {loading ? 'Connecting...' : 'Sign in with Google'}
    </button>
  );
}
```

### Backend - Sync Calendar

```ts
import { ExternalCalendarBridge } from '@/lib/oauth/calendar-bridge';

// Sync Google Calendar
const events = await ExternalCalendarBridge.syncGoogleCalendar(accessToken, tenantId, {
  since: '2024-01-01T00:00:00Z',
  until: '2024-12-31T23:59:59Z',
});

// Sync Microsoft Contacts
const contacts = await ExternalCalendarBridge.syncMicrosoftContacts(accessToken);
```

### API Routes

**Get OAuth URL:**

```bash
GET /api/oauth/authorize?provider=google&state=xyz&scopes=openid,profile,email
```

Response:

```json
{
  "authUrl": "https://accounts.google.com/o/oauth2/v2/auth?..."
}
```

**Callback (after user grants permission):**

```bash
POST /api/oauth/callback
Content-Type: application/json

{
  "provider": "google",
  "code": "4/0AX4XfWh..."
}
```

Response:

```json
{
  "success": true,
  "expiresIn": 3599
}
```

---

## Sécurité

### Token Storage

⚠️ **DO NOT store accessToken on client side**

Recommended approach:

1. Exchange code for token server-side (POST /api/oauth/callback)
2. Store token in HttpOnly, Secure cookie or database
3. Use sessions to access tokens

```ts
// ❌ Bad - Never do this
localStorage.setItem('accessToken', token);

// ✅ Good - Server-side only
await db.oauthToken.create({
  userId: session.user.id,
  provider: 'google',
  accessToken: token,
  refreshToken: refreshToken,
  expiresAt: new Date(Date.now() + 3599000),
});
```

### CSRF Protection

State parameter prevents CSRF:

1. Generate random state server-side
2. Store in session/sessionStorage
3. Verify state matches in callback

Currently using sessionStorage (for demo), should upgrade to session cookies.

---

## Limitations & TODOs

1. **Token Storage:** Currently POST /api/oauth/callback doesn't persist tokens to DB
   - Need to add `await db.oauthToken.upsert(...)`

2. **Token Refresh:** GitHub doesn't support refresh tokens
   - Need to re-authenticate periodically

3. **Scopes Management:** Hardcoded in components
   - Should be configurable per integration

4. **Error Handling:** Basic error messages
   - Should include user-friendly localization

---

## Prochaines étapes

- [ ] Implement DB token storage in POST /api/oauth/callback
- [ ] Add automatic token refresh middleware
- [ ] Create Google Calendar sync endpoint
- [ ] Create Microsoft/Outlook sync endpoint
- [ ] Add UI for managing connected accounts
- [ ] Implement revoke/disconnect functionality
- [ ] Add audit logging for OAuth actions

---

**Status:** ✅ Complete
**Date:** 27 janvier 2026
