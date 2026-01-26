# 📧 Configuration Gmail - Monitoring Boîte de Réception

## Étape 1 : Créer une App Google Cloud

1. Aller sur https://console.cloud.google.com
2. Créer un nouveau projet "iaPostemanage"
3. Activer l'API Gmail
4. Créer des identifiants OAuth 2.0

## Étape 2 : Configuration OAuth

### Créer les identifiants
- Type : Application de bureau
- Nom : iaPostemanage Gmail Monitor
- Télécharger le JSON

### Scopes requis
```
https://www.googleapis.com/auth/gmail.readonly
https://www.googleapis.com/auth/gmail.modify
```

## Étape 3 : Obtenir le Refresh Token

```bash
# Installer le script d'auth
npm install -g @googleapis/gmail

# Lancer l'authentification
node scripts/gmail-auth.js
```

Ou manuellement :
```javascript
// scripts/gmail-auth.js
const { google } = require('googleapis');
const readline = require('readline');

const oauth2Client = new google.auth.OAuth2(
  'VOTRE_CLIENT_ID',
  'VOTRE_CLIENT_SECRET',
  'http://localhost:3000/oauth/callback'
);

const authUrl = oauth2Client.generateAuthUrl({
  access_type: 'offline',
  scope: [
    'https://www.googleapis.com/auth/gmail.readonly',
    'https://www.googleapis.com/auth/gmail.modify'
  ]
});

console.log('Ouvrir cette URL:', authUrl);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

rl.question('Coller le code: ', async (code) => {
  const { tokens } = await oauth2Client.getToken(code);
  console.log('GMAIL_REFRESH_TOKEN=', tokens.refresh_token);
  rl.close();
});
```

## Étape 4 : Variables d'environnement

```bash
# .env.local
GMAIL_CLIENT_ID=xxx.apps.googleusercontent.com
GMAIL_CLIENT_SECRET=xxx
GMAIL_REDIRECT_URI=http://localhost:3000/oauth/callback
GMAIL_REFRESH_TOKEN=xxx
TENANT_ID=votre-tenant-id
```

## Étape 5 : Démarrer le monitoring

```bash
# Terminal 1 : App Next.js
npm run dev

# Terminal 2 : Monitoring Gmail
npm run email:monitor
```

Ou ajouter au package.json :
```json
{
  "scripts": {
    "email:monitor": "tsx scripts/start-gmail-monitor.ts"
  }
}
```

## Fonctionnement

```
Gmail Inbox (polling 30s)
    ↓
Nouveaux emails détectés
    ↓
Pour chaque email:
  - Télécharger contenu
  - Analyser avec IA/mots-clés
  - Créer/lier client + dossier
  - Marquer comme lu
    ↓
Résultat visible sur /emails
```

## Test

### 1. Envoyer un email à votre Gmail
```
À: votre-email-cabinet@gmail.com
Objet: Demande titre de séjour urgent
Corps: Je souhaite faire une demande...
```

### 2. Attendre 30 secondes max

### 3. Vérifier les logs
```
✅ 1 nouveaux emails traités
  - created: TITRE_SEJOUR
```

### 4. Vérifier l'interface
```
http://localhost:3000/emails
→ Email visible avec dossier créé
```

## Alternative : Webhook Gmail (Push)

Plus rapide que le polling :

```javascript
// Configurer le webhook
await gmail.users.watch({
  userId: 'me',
  requestBody: {
    topicName: 'projects/YOUR_PROJECT/topics/gmail',
    labelIds: ['INBOX']
  }
});
```

Puis créer `/api/webhooks/gmail` pour recevoir les notifications.

## Sécurité

- ✅ Refresh token stocké en variable d'env
- ✅ Emails marqués comme lus après traitement
- ✅ Isolation par tenant
- ✅ Logs d'audit automatiques

## Production

Pour production, utiliser :
- **Option 1** : Service worker dédié (PM2)
- **Option 2** : Webhook Gmail Push
- **Option 3** : Cron job toutes les 5 minutes

```bash
# PM2
pm2 start scripts/start-gmail-monitor.ts --name gmail-monitor
pm2 logs gmail-monitor
```
