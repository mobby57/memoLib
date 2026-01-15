# Documentation Secret Webhook

## Qu'est-ce qu'un secret webhook ?

Le secret webhook est une clé cryptographique utilisée pour vérifier que les événements proviennent bien d'IA Poste Manager.

## Configuration dans GitHub App

### Que renseigner dans le champ Secret :
```
Generez une chaîne aléatoire sécurisée :

# Exemples de secrets valides :
whsec_1234567890abcdef1234567890abcdef12345678
my-super-secret-webhook-key-2024
8f7e6d5c4b3a2918f7e6d5c4b3a29187f6e5d4c3

# Commande pour générer :
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Chemin de configuration :
1. **GitHub App Settings** → **Webhooks** → **Webhook secret**
2. **Repository Settings** → **Webhooks** → **Add webhook** → **Secret**
3. **Organization Settings** → **Webhooks** → **Secret**

### Variables d'environnement :
```bash
# .env.local (même valeur que dans GitHub)
WEBHOOK_SECRET=whsec_1234567890abcdef1234567890abcdef12345678

# GitHub Secrets
Settings → Secrets and variables → Actions → New repository secret
Name: WEBHOOK_SECRET
Value: whsec_1234567890abcdef1234567890abcdef12345678
```

## Validation GitHub (X-Hub-Signature-256)

### Headers GitHub :
- `X-Hub-Signature-256`: `sha256=<signature>`
- `Content-Type`: `application/json`

### Exemple de vérification GitHub :

```javascript
const crypto = require('crypto');

function verifyGitHubWebhook(body, signature, secret) {
  const expectedSignature = 'sha256=' + crypto
    .createHmac('sha256', secret)
    .update(body, 'utf8')
    .digest('hex');
  
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}

// Utilisation
const isValid = verifyGitHubWebhook(
  req.body, 
  req.headers['x-hub-signature-256'], 
  process.env.WEBHOOK_SECRET
);
```

### Test de validation :
```javascript
// Valeurs de test GitHub
const secret = "It's a Secret to Everybody";
const payload = "Hello, World!";
// Signature attendue: sha256=757107ea0eb2509fc211221cce984b8a37570b6d7586c22c46f4379c8b043e17
```

## Sécurité

- **Utilisez `crypto.timingSafeEqual`** pour éviter les attaques temporelles
- **Encodage UTF-8** obligatoire pour les payloads
- **HTTPS uniquement** pour votre endpoint
- **Jamais de `==`** pour comparer les signatures
- **Stockage sécurisé** du secret (variables d'environnement)