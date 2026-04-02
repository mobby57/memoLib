# ✅ Checklist de Validation Post-Build

## 🗄️ 1. Configuration Base de Données Fly.io

### Configurer DATABASE_URL sur Fly.io
```bash
# Définir le secret DATABASE_URL
fly secrets set DATABASE_URL="postgresql://neondb_owner:npg_5CzMD0oXUYRO@ep-crimson-rice-ahz3jjtv-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require"

# Vérifier les secrets
fly secrets list

# Déployer avec migration automatique
fly deploy
```

**Note:** Le `release_command` dans `fly.toml` exécute automatiquement `prisma migrate deploy` avant chaque déploiement.

---

## 🌍 2. Tests Routes i18n

### Routes à tester:

```bash
# Démarrer le serveur
npm run dev

# Tester dans le navigateur ou avec curl:
```

| Route | Statut Attendu | Description |
|-------|----------------|-------------|
| `http://localhost:3000/` | ✅ 200 | Racine (redirect vers /en ou /fr) |
| `http://localhost:3000/fr` | ✅ 200 | Page d'accueil française |
| `http://localhost:3000/fr/login` | ✅ 200 | Login français |
| `http://localhost:3000/es` | ✅ 200 | Page d'accueil espagnole |
| `http://localhost:3000/en` | ✅ 200 | Page d'accueil anglaise |
| `http://localhost:3000/de` | ✅ 200 | Page d'accueil allemande |

### Script de test automatique:
```bash
# Créer un script de test
node -e "
const urls = ['/', '/fr', '/fr/login', '/es', '/en', '/de'];
urls.forEach(async (url) => {
  const res = await fetch('http://localhost:3000' + url);
  console.log(\`\${url}: \${res.status} \${res.ok ? '✅' : '❌'}\`);
});
"
```

---

## 🔄 3. Middleware - État Actuel

### ✅ Middleware Actif et Fonctionnel

Le middleware a été **simplifié et réactivé** avec succès:

**Fichier:** `middleware.ts` (racine du projet)

**Fonctionnalités:**
- ✅ Headers de sécurité (CSP, HSTS, X-Frame-Options)
- ✅ Protection XSS et clickjacking
- ✅ Compatible Next.js 16
- ❌ i18n désactivé (next-intl retiré pour compatibilité)

**Matcher actuel:**
```typescript
matcher: [
  '/((?!api|_next|static|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|svg|webp)$).*)',
]
```

### 🔧 Pour réactiver i18n (optionnel):

Si vous souhaitez réactiver l'internationalisation avec `next-intl`:

1. **Installer next-intl:**
```bash
npm install next-intl
```

2. **Créer la configuration i18n:**
```typescript
// src/i18n.ts
import { getRequestConfig } from 'next-intl/server';

export default getRequestConfig(async ({ locale }) => ({
  messages: (await import(`./messages/${locale}.json`)).default
}));
```

3. **Mettre à jour middleware.ts:**
```typescript
import createIntlMiddleware from 'next-intl/middleware';

const intlMiddleware = createIntlMiddleware({
  locales: ['en', 'fr', 'es', 'de'],
  defaultLocale: 'en',
});

export function middleware(request: NextRequest) {
  const response = intlMiddleware(request);
  // ... ajouter headers de sécurité
  return response;
}
```

---

## ✅ 4. Validation Workflows Critiques

### 🔐 Workflow 1: Login

**Test manuel:**
1. Aller sur `http://localhost:3000/fr/login`
2. Entrer credentials de test:
   - Email: `admin@memolib.com`
   - Password: `admin123`
3. Vérifier redirection vers `/fr/admin/dashboard`

**Test automatique:**
```bash
npm run test:e2e -- --grep "login"
```

---

### 📁 Workflow 2: Créer un Dossier

**Test manuel:**
1. Se connecter en tant qu'avocat
2. Aller sur `/fr/admin/dossiers/nouveau`
3. Remplir le formulaire:
   - Titre: "Test Dossier"
   - Client: Sélectionner un client
   - Type: "Immigration"
4. Cliquer "Créer"
5. Vérifier redirection vers `/fr/admin/dossiers/[id]`

**Test API:**
```bash
curl -X POST http://localhost:3000/api/admin/dossiers \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Dossier",
    "clientId": "client-id-here",
    "type": "IMMIGRATION"
  }'
```

---

### 📧 Workflow 3: Réception Email

**Test webhook:**
```bash
curl -X POST http://localhost:3000/api/webhooks/email \
  -H "Content-Type: application/json" \
  -d '{
    "from": "client@example.com",
    "to": "avocat@memolib.com",
    "subject": "Demande urgente",
    "body": "Bonjour, j'\''ai besoin d'\''aide..."
  }'
```

**Vérifier:**
- Email créé dans la base de données
- Score de priorité calculé
- Notification envoyée à l'avocat

---

### 💳 Workflow 4: Paiement Stripe

**Test checkout:**
```bash
curl -X POST http://localhost:3000/api/billing/checkout \
  -H "Content-Type: application/json" \
  -d '{
    "priceId": "price_1234567890",
    "successUrl": "http://localhost:3000/fr/billing/success",
    "cancelUrl": "http://localhost:3000/fr/billing/cancel"
  }'
```

**Test webhook Stripe:**
```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
stripe trigger payment_intent.succeeded
```

---

## 🧪 5. Tests Automatisés

### Tests unitaires:
```bash
npm run test
```

### Tests E2E:
```bash
npm run test:e2e
```

### Tests de couverture:
```bash
npm run test:coverage
```

---

## 📊 6. Monitoring Post-Déploiement

### Vérifier Sentry:
```bash
# Tester une erreur
curl http://localhost:3000/api/monitoring/sentry-test
```

### Vérifier métriques:
```bash
curl http://localhost:3000/api/health
curl http://localhost:3000/api/dev/metrics
```

---

## 🚀 7. Déploiement Fly.io

### Commandes de déploiement:
```bash
# 1. Configurer DATABASE_URL
fly secrets set DATABASE_URL="postgresql://..."

# 2. Déployer
fly deploy

# 3. Vérifier logs
fly logs

# 4. Ouvrir l'app
fly open

# 5. Vérifier santé
fly status
```

---

## ✅ Checklist Finale

- [ ] DATABASE_URL configuré sur Fly.io
- [ ] Routes i18n testées (/, /fr, /es, /en)
- [ ] Middleware actif avec headers de sécurité
- [ ] Workflow login fonctionnel
- [ ] Workflow création dossier fonctionnel
- [ ] Workflow réception email fonctionnel
- [ ] Paiements Stripe testés
- [ ] Tests E2E passent
- [ ] Sentry reçoit les erreurs
- [ ] Métriques accessibles
- [ ] Déploiement Fly.io réussi

---

**Date de validation:** _____________________  
**Validé par:** _____________________
