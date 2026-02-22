# Frontend séparé sur localhost:3000 → API MemoLib sur localhost:5078

## 1) Variable d'environnement frontend

Crée un fichier `.env.local` dans ton frontend (port 3000) :

```bash
NEXT_PUBLIC_API_BASE_URL=http://localhost:5078
```

## 0) Démarrage API local fiable (important)

Depuis `MemoLib.Api`, utilise ce script pour éviter l'erreur JWT en mode Production implicite avec `--no-launch-profile` :

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\run-api-local.ps1 -KillPorts
```

Le script force `ASPNETCORE_ENVIRONMENT=Development`, définit une clé JWT dev si absente, et lance l'API sur `5078` et `8080`.

Mode non bloquant (background) :

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\run-api-local.ps1 -KillPorts -Background
```

Si ce n'est pas Next.js, garde la même clé ou adapte le nom, mais pointe vers `http://localhost:5078`.

## 2) Exemple `fetch` prêt à coller

```ts
const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5078';

export async function apiFetch(path: string, options: RequestInit = {}) {
  const url = `${API_BASE}${path}`;
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  const res = await fetch(url, { ...options, headers });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API ${res.status}: ${text}`);
  }

  const contentType = res.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    return res.json();
  }

  return res.text();
}
```

## 3) Exemple login

```ts
export async function login(email: string, password: string) {
  return apiFetch('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}
```

## 4) Exemple appel protégé (Bearer)

```ts
export async function manualScan(token: string) {
  return apiFetch('/api/email-scan/manual', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}
```

## 5) Vérification rapide CORS

Commande de test (déjà validée côté API) :

```powershell
$headers = @{
  Origin='http://localhost:3000';
  'Access-Control-Request-Method'='POST';
  'Access-Control-Request-Headers'='content-type,authorization'
}
Invoke-WebRequest -Method Options -Uri 'http://localhost:5078/api/auth/login' -Headers $headers -UseBasicParsing
```

Attendu :
- `StatusCode: 204`
- `Access-Control-Allow-Origin: http://localhost:3000`

## 6) Notes

- L'API doit tourner sur `http://localhost:5078`.
- Si un ancien process verrouille le binaire, stoppe le process puis relance `dotnet run`.
- La configuration CORS est déjà en place côté API via `Cors:AllowedOrigins` dans `appsettings.Development.json`.
