# Variables d'Environnement - MemoLib

## 🔧 Configuration Rapide

```bash
# 1. Copier le template
cp .env.example .env.local

# 2. Générer les secrets
openssl rand -base64 32  # Pour NEXTAUTH_SECRET
openssl rand -hex 32     # Pour SECRET_KEY

# 3. Configurer la base de données
# Dev: SQLite (par défaut)
# Prod: PostgreSQL (requis)
```

---

## 📋 Variables Requises

### **Core Application**

| Variable | Requis | Défaut | Description |
|----------|--------|--------|-------------|
| `NEXTAUTH_SECRET` | ✅ | - | Secret NextAuth (32+ chars) |
| `NEXTAUTH_URL` | ✅ | `http://localhost:3000` | URL publique app |
| `DATABASE_URL` | ✅ | `sqlite:///memolib.db` | Connexion DB |
| `SECRET_KEY` | ✅ | - | Secret Flask/Python |

### **Azure AD (SSO)**

| Variable | Requis | Description |
|----------|--------|-------------|
| `AZURE_TENANT_ID` | ✅ | Tenant ID Azure AD |
| `AZURE_CLIENT_ID` | ✅ | Application ID |
| `AZURE_CLIENT_SECRET` | ✅ | Client secret |
| `AZURE_KEYVAULT_URL` | 🟡 | Key Vault URL (prod) |

### **Email (Microsoft Graph)**

| Variable | Requis | Description |
|----------|--------|-------------|
| `MS_GRAPH_CLIENT_ID` | 🟡 | Graph API client |
| `MS_GRAPH_CLIENT_SECRET` | 🟡 | Graph secret |
| `MS_GRAPH_TENANT_ID` | 🟡 | Tenant ID |

### **Twilio (SMS/WhatsApp)**

| Variable | Requis | Description |
|----------|--------|-------------|
| `TWILIO_ACCOUNT_SID` | 🟡 | Account SID |
| `TWILIO_AUTH_TOKEN` | 🟡 | Auth token |
| `TWILIO_PHONE_NUMBER` | 🟡 | Numéro SMS |
| `TWILIO_WHATSAPP_NUMBER` | 🟡 | Numéro WhatsApp |

### **IA (Multi-tier)**

| Variable | Requis | Description |
|----------|--------|-------------|
| `OLLAMA_BASE_URL` | 🟢 | Ollama local (gratuit) |
| `OLLAMA_MODEL` | 🟢 | Modèle (llama3.2) |
| `AZURE_OPENAI_ENDPOINT` | 🟡 | Azure OpenAI (premium) |
| `AZURE_OPENAI_API_KEY` | 🟡 | Clé Azure |
| `OPENAI_API_KEY` | 🟡 | OpenAI fallback |

### **Stripe (Facturation)**

| Variable | Requis | Description |
|----------|--------|-------------|
| `STRIPE_SECRET_KEY` | ✅ | Clé secrète Stripe |
| `STRIPE_PUBLISHABLE_KEY` | ✅ | Clé publique |
| `STRIPE_WEBHOOK_SECRET` | ✅ | Secret webhook |

### **Monitoring**

| Variable | Requis | Description |
|----------|--------|-------------|
| `SENTRY_DSN` | 🟡 | Sentry monitoring |
| `SENTRY_AUTH_TOKEN` | 🟡 | Token build |
| `APPLICATIONINSIGHTS_CONNECTION_STRING` | 🟡 | Azure monitoring |

---

## 🌍 Par Environnement

### **Development (Local)**

```bash
# .env.local
NEXTAUTH_SECRET=dev-secret-change-in-prod
NEXTAUTH_URL=http://localhost:3000
DATABASE_URL=sqlite:///memolib.db
OLLAMA_BASE_URL=http://localhost:11434
NODE_ENV=development
```

### **Staging (Azure)**

```bash
# Azure App Service Configuration
NEXTAUTH_SECRET=${KEYVAULT_SECRET}
NEXTAUTH_URL=https://memolib-staging.azurestaticapps.net
DATABASE_URL=postgresql://user:pass@staging-db.postgres.database.azure.com:5432/memolib
AZURE_KEYVAULT_URL=https://memolib-staging-kv.vault.azure.net/
NODE_ENV=staging
```

### **Production (Azure)**

```bash
# Tous les secrets via Azure Key Vault
NEXTAUTH_SECRET=@Microsoft.KeyVault(SecretUri=https://...)
DATABASE_URL=@Microsoft.KeyVault(SecretUri=https://...)
AZURE_KEYVAULT_URL=https://memolib-prod-kv.vault.azure.net/
NODE_ENV=production
```

---

## 🔒 Sécurité

### **Bonnes Pratiques**

✅ **Faire**:
- Utiliser Azure Key Vault en production
- Rotation secrets tous les 90 jours
- Secrets différents par environnement
- `.env.local` dans `.gitignore`

❌ **Ne PAS faire**:
- Commit `.env` ou `.env.local`
- Partager secrets par email/Slack
- Réutiliser secrets entre envs
- Hardcoder secrets dans le code

### **Génération Secrets**

```bash
# NextAuth Secret (32 bytes)
openssl rand -base64 32

# Flask Secret Key (64 hex)
openssl rand -hex 32

# JWT Secret (256 bits)
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

---

## 🐛 Troubleshooting

### Erreur: "NEXTAUTH_SECRET missing"
```bash
# Générer et ajouter à .env.local
echo "NEXTAUTH_SECRET=$(openssl rand -base64 32)" >> .env.local
```

### Erreur: "Database connection failed"
```bash
# Vérifier DATABASE_URL
npx prisma db push
```

### Erreur: "Azure AD authentication failed"
```bash
# Vérifier les 3 variables Azure
echo $AZURE_TENANT_ID
echo $AZURE_CLIENT_ID
echo $AZURE_CLIENT_SECRET
```

---

## 📚 Références

- [NextAuth.js Configuration](https://next-auth.js.org/configuration/options)
- [Azure Key Vault](https://learn.microsoft.com/azure/key-vault/)
- [Prisma Database URLs](https://www.prisma.io/docs/reference/database-reference/connection-urls)
- [Stripe API Keys](https://stripe.com/docs/keys)

---

## Variables supplémentaires détectées (scan du code)

- NEXT_PUBLIC_BUILD_COMMIT
- PREVIEW_PROTECT
- PREVIEW_TOKEN
- EMAIL_FROM
- RESEND_API_KEY
- WEBHOOK_SECRET
- EMAIL_WEBHOOK_SECRET
- GITHUB_WEBHOOK_SECRET
- AI_SERVICE_URL
- AZURE_STORAGE_CONTAINER
- BLOB_READ_WRITE_TOKEN
- CRON_SECRET
- SUPER_ADMIN_EMAIL
- UPSTASH_REDIS_REST_URL
- UPSTASH_REDIS_REST_TOKEN
- SENTRY_ORG
- SENTRY_PROJECT
- SENTRY_ENV

**Dernière mise à jour**: 2026-01-31
