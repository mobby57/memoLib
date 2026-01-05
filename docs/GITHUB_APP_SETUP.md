# Guide d'Enregistrement GitHub App - IA Poste Manager

## ⚡ Script Automatisé (Recommandé)

### Installation GitHub CLI

```bash
# Windows (winget)
winget install --id GitHub.cli

# macOS (Homebrew)
brew install gh

# Linux (apt)
sudo apt install gh
```

### Authentification

```bash
# Se connecter à GitHub
gh auth login
```

### Exécution du Script

```bash
# Option 1: Script Node.js (Recommandé - Cross-platform)
node scripts/create-github-app.js

# Option 2: Script Bash (Linux/Mac)
chmod +x scripts/create-github-app.sh
./scripts/create-github-app.sh

# Option 3: Script Batch (Windows)
scripts\create-github-app.bat
```

**Le script génère automatiquement :**
- ✅ GitHub App avec toutes les permissions
- ✅ Clé privée et secrets
- ✅ Fichier `.env.local` complet
- ✅ URL d'installation

---

## 🚀 Création Manuelle de la GitHub App

### 1. Accéder à GitHub Developer Settings

1. Aller sur [GitHub Developer Settings](https://github.com/settings/developers)
2. Cliquer sur **"New GitHub App"**

### 2. Configuration de Base

```yaml
# Informations générales
GitHub App name: "IA Poste Manager"
Description: "Assistant juridique digital CESEDA - Gestion sécurisée multi-tenant"
Homepage URL: "https://your-domain.com"
User authorization callback URL: "https://your-domain.com/api/auth/callback/github"
```

### 3. Webhook Configuration

```yaml
# Webhook settings
Webhook URL: "https://your-domain.com/api/webhooks/github"
Webhook secret: [Générer avec la commande ci-dessous]
SSL verification: "Enable SSL verification"
```

**Générer le secret webhook :**
```bash
node -e "console.log('whsec_' + require('crypto').randomBytes(32).toString('hex'))"
```

### 4. Permissions Requises

#### Repository permissions:
```yaml
Contents: Read & write
Issues: Read & write
Metadata: Read
Pull requests: Read & write
```

#### Account permissions:
```yaml
Email addresses: Read
```

### 5. Événements Webhook à Souscrire

```yaml
☑️ Issues
☑️ Issue comments
☑️ Pull requests
☑️ Pull request reviews
☑️ Push
☑️ Repository
```

### 6. Installation

```yaml
Where can this GitHub App be installed?
○ Only on this account
● Any account
```

## 🔑 Configuration Post-Création

### 1. Récupérer les Credentials

Après création, noter ces valeurs :

```bash
# App ID (visible sur la page de l'app)
GITHUB_APP_ID=123456

# Client ID (visible sur la page de l'app)
GITHUB_CLIENT_ID=Iv1.1234567890abcdef

# Client Secret (générer dans "Client secrets")
GITHUB_CLIENT_SECRET=1234567890abcdef1234567890abcdef12345678

# Webhook Secret (celui que vous avez défini)
WEBHOOK_SECRET=whsec_1234567890abcdef1234567890abcdef12345678
```

### 2. Générer une Private Key

1. Dans les paramètres de l'app, section **"Private keys"**
2. Cliquer **"Generate a private key"**
3. Télécharger le fichier `.pem`
4. Convertir en base64 pour l'environnement :

```bash
# Linux/Mac
base64 -i your-app-name.2024-01-01.private-key.pem

# Windows
certutil -encode your-app-name.2024-01-01.private-key.pem temp.txt && findstr /v CERTIFICATE temp.txt
```

### 3. Variables d'Environnement

Ajouter dans `.env.local` :

```bash
# GitHub App Configuration
GITHUB_APP_ID=123456
GITHUB_CLIENT_ID=Iv1.1234567890abcdef
GITHUB_CLIENT_SECRET=1234567890abcdef1234567890abcdef12345678
GITHUB_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----\nMIIE...base64...==\n-----END RSA PRIVATE KEY-----"
WEBHOOK_SECRET=whsec_1234567890abcdef1234567890abcdef12345678

# NextAuth Configuration
NEXTAUTH_URL=https://your-domain.com
NEXTAUTH_SECRET=your-nextauth-secret-32-chars-min
```

## 📦 Installation de l'App

### 1. Installer sur votre Organisation/Compte

1. Aller sur la page de votre GitHub App
2. Cliquer **"Install App"**
3. Sélectionner votre organisation/compte
4. Choisir les repositories (All ou Selected)

### 2. Récupérer l'Installation ID

```bash
# API call pour lister les installations
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     -H "Accept: application/vnd.github.v3+json" \
     https://api.github.com/app/installations

# Noter l'installation_id dans la réponse
```

## 🔧 Intégration NextAuth

### 1. Configuration Provider

```typescript
// src/app/api/auth/[...nextauth]/route.ts
import { NextAuthOptions } from "next-auth"
import GitHubProvider from "next-auth/providers/github"

export const authOptions: NextAuthOptions = {
  providers: [
    GitHubProvider({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    })
  ],
  callbacks: {
    async jwt({ token, account }) {
      if (account) {
        token.accessToken = account.access_token
      }
      return token
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken
      return session
    }
  }
}
```

### 2. Webhook Handler

```typescript
// src/app/api/webhooks/github/route.ts
import { NextRequest } from 'next/server'
import crypto from 'crypto'

export async function POST(req: NextRequest) {
  const body = await req.text()
  const signature = req.headers.get('x-hub-signature-256')
  
  if (!verifySignature(body, signature)) {
    return new Response('Unauthorized', { status: 401 })
  }
  
  const payload = JSON.parse(body)
  
  // Traiter l'événement
  switch (payload.action) {
    case 'opened':
      // Issue/PR ouverte
      break
    case 'closed':
      // Issue/PR fermée
      break
  }
  
  return new Response('OK')
}

function verifySignature(body: string, signature: string | null): boolean {
  if (!signature) return false
  
  const expectedSignature = 'sha256=' + crypto
    .createHmac('sha256', process.env.WEBHOOK_SECRET!)
    .update(body, 'utf8')
    .digest('hex')
  
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  )
}
```

## ✅ Test de Configuration

### 1. Test Webhook

```bash
# Créer un test issue pour déclencher le webhook
curl -X POST \
  -H "Authorization: token YOUR_PERSONAL_ACCESS_TOKEN" \
  -H "Accept: application/vnd.github.v3+json" \
  https://api.github.com/repos/OWNER/REPO/issues \
  -d '{"title":"Test webhook","body":"Test de configuration webhook"}'
```

### 2. Vérifier les Logs

```bash
# Vérifier les deliveries dans GitHub App settings
# Section "Advanced" → "Recent Deliveries"
```

## 🔒 Sécurité

### Bonnes Pratiques

- ✅ Toujours vérifier la signature webhook
- ✅ Utiliser HTTPS uniquement
- ✅ Stocker les secrets dans des variables d'environnement
- ✅ Limiter les permissions au minimum nécessaire
- ✅ Monitorer les accès et événements
- ✅ Rotation régulière des secrets

### Variables Sensibles

```bash
# Ne jamais commiter ces valeurs !
GITHUB_CLIENT_SECRET=*****
GITHUB_PRIVATE_KEY=*****
WEBHOOK_SECRET=*****
NEXTAUTH_SECRET=*****
```

## 📚 Ressources

- [GitHub Apps Documentation](https://docs.github.com/en/developers/apps)
- [NextAuth GitHub Provider](https://next-auth.js.org/providers/github)
- [Webhook Events](https://docs.github.com/en/developers/webhooks-and-events/webhooks/webhook-events-and-payloads)