# Variables d'Environnement à Ajouter sur Vercel

**Date:** 21 janvier 2026  
**Projet:** iapostemanage  
**Status:** À compléter et pousser

---

## 📋 Instructions

1. Remplis chaque champ ci-dessous avec ta valeur réelle
2. Une fois complété, utilise les commandes vercel env add
3. Teste avec `vercel env list` pour vérifier

---

## ✅ VARIABLES PRODUCTION

### Essentielles (à remplir)

**DATABASE_URL**
```
Valeur: 
Type: postgresql://user:pass@host/db
Commande: vercel env add DATABASE_URL production
```

**NEXTAUTH_SECRET**
```
Valeur: 
Type: Clé secrète 32 bytes
Commande: vercel env add NEXTAUTH_SECRET production
Générer: [Convert]::ToBase64String((1..32 | ForEach-Object {Get-Random -Max 256}))
```

**NEXTAUTH_URL**
```
Valeur: https://
Type: https://ton-domaine-prod
Commande: vercel env add NEXTAUTH_URL production
```

---

### Ollama (optionnel)

**OLLAMA_BASE_URL**
```
Valeur: 
Type: http://localhost:11434 (ou endpoint distant)
Commande: vercel env add OLLAMA_BASE_URL production
```

**OLLAMA_MODEL**
```
Valeur: 
Type: llama3.2:3b (ou autre modèle)
Commande: vercel env add OLLAMA_MODEL production
```

---

### Email - Gmail (optionnel)

**GMAIL_CLIENT_ID**
```
Valeur: 
Type: ID client OAuth Google
Commande: vercel env add GMAIL_CLIENT_ID production
```

**GMAIL_CLIENT_SECRET**
```
Valeur: 
Type: Secret client OAuth Google
Commande: vercel env add GMAIL_CLIENT_SECRET production
```

**GMAIL_REDIRECT_URI**
```
Valeur: https://xxxxx/api/auth/callback/google
Type: Callback OAuth
Commande: vercel env add GMAIL_REDIRECT_URI production
```

---

### GitHub App (optionnel)

**GITHUB_APP_ID**
```
Valeur: 
Type: ID de l'app GitHub
Commande: vercel env add GITHUB_APP_ID production
```

**GITHUB_APP_PRIVATE_KEY_PATH**
```
Valeur: 
Type: Chemin vers clé privée (ex: ./github-app-key.pem)
Commande: vercel env add GITHUB_APP_PRIVATE_KEY_PATH production
```

**GITHUB_WEBHOOK_SECRET**
```
Valeur: 
Type: Secret webhook GitHub
Commande: vercel env add GITHUB_WEBHOOK_SECRET production
```

**GITHUB_REPOSITORY**
```
Valeur: 
Type: user/repo (ex: mobby57s/iapostemanage)
Commande: vercel env add GITHUB_REPOSITORY production
```

**GITHUB_BRANCH_MAIN**
```
Valeur: 
Type: main (ou autre branche par défaut)
Commande: vercel env add GITHUB_BRANCH_MAIN production
```

---

### GitHub OAuth (optionnel)

**GITHUB_CLIENT_ID**
```
Valeur: 
Type: ID OAuth GitHub
Commande: vercel env add GITHUB_CLIENT_ID production
```

**GITHUB_CLIENT_SECRET**
```
Valeur: 
Type: Secret OAuth GitHub
Commande: vercel env add GITHUB_CLIENT_SECRET production
```

**GITHUB_CALLBACK_URL**
```
Valeur: https://xxxxx/api/auth/callback/github
Type: Callback OAuth
Commande: vercel env add GITHUB_CALLBACK_URL production
```

---

### Webhooks (optionnel)

**PUBLIC_WEBHOOK_URL**
```
Valeur: https://xxxxx/api/webhooks/github
Type: URL webhook publique
Commande: vercel env add PUBLIC_WEBHOOK_URL production
```

**WEBHOOK_GITHUB_ENABLED**
```
Valeur: true ou false
Type: Booléen
Commande: vercel env add WEBHOOK_GITHUB_ENABLED production
```

**WEBHOOK_GITHUB_EVENTS**
```
Valeur: push,pull_request,issues
Type: Liste d'événements séparés par virgule
Commande: vercel env add WEBHOOK_GITHUB_EVENTS production
```

**WEBHOOK_GITHUB_VERIFY_SSL**
```
Valeur: true ou false
Type: Booléen
Commande: vercel env add WEBHOOK_GITHUB_VERIFY_SSL production
```

---

### Stripe (optionnel)

**STRIPE_SECRET_KEY**
```
Valeur: sk_live_xxxxx ou sk_test_xxxxx
Type: Clé secrète Stripe
Commande: vercel env add STRIPE_SECRET_KEY production
```

**STRIPE_PUBLISHABLE_KEY**
```
Valeur: pk_live_xxxxx ou pk_test_xxxxx
Type: Clé publique Stripe
Commande: vercel env add STRIPE_PUBLISHABLE_KEY production
```

**STRIPE_WEBHOOK_SECRET**
```
Valeur: whsec_xxxxx
Type: Secret webhook Stripe
Commande: vercel env add STRIPE_WEBHOOK_SECRET production
```

**STRIPE_PRICE_SOLO_MONTHLY**
```
Valeur: price_xxxxx
Commande: vercel env add STRIPE_PRICE_SOLO_MONTHLY production
```

**STRIPE_PRICE_SOLO_YEARLY**
```
Valeur: price_xxxxx
Commande: vercel env add STRIPE_PRICE_SOLO_YEARLY production
```

**STRIPE_PRICE_CABINET_MONTHLY**
```
Valeur: price_xxxxx
Commande: vercel env add STRIPE_PRICE_CABINET_MONTHLY production
```

**STRIPE_PRICE_CABINET_YEARLY**
```
Valeur: price_xxxxx
Commande: vercel env add STRIPE_PRICE_CABINET_YEARLY production
```

**STRIPE_PRICE_ENTERPRISE_MONTHLY**
```
Valeur: price_xxxxx
Commande: vercel env add STRIPE_PRICE_ENTERPRISE_MONTHLY production
```

**STRIPE_PRICE_ENTERPRISE_YEARLY**
```
Valeur: price_xxxxx
Commande: vercel env add STRIPE_PRICE_ENTERPRISE_YEARLY production
```

---

### Légifrance PISTE (optionnel)

**PISTE_SANDBOX_CLIENT_ID**
```
Valeur: 
Commande: vercel env add PISTE_SANDBOX_CLIENT_ID production
```

**PISTE_SANDBOX_CLIENT_SECRET**
```
Valeur: 
Commande: vercel env add PISTE_SANDBOX_CLIENT_SECRET production
```

**PISTE_SANDBOX_OAUTH_URL**
```
Valeur: https://sandbox-oauth.piste.gouv.fr/api/oauth/token
Commande: vercel env add PISTE_SANDBOX_OAUTH_URL production
```

**PISTE_SANDBOX_API_URL**
```
Valeur: https://sandbox-api.piste.gouv.fr/dila/legifrance/lf-engine-app
Commande: vercel env add PISTE_SANDBOX_API_URL production
```

**PISTE_PROD_CLIENT_ID**
```
Valeur: 
Commande: vercel env add PISTE_PROD_CLIENT_ID production
```

**PISTE_PROD_CLIENT_SECRET**
```
Valeur: 
Commande: vercel env add PISTE_PROD_CLIENT_SECRET production
```

**PISTE_PROD_OAUTH_URL**
```
Valeur: https://oauth.piste.gouv.fr/api/oauth/token
Commande: vercel env add PISTE_PROD_OAUTH_URL production
```

**PISTE_PROD_API_URL**
```
Valeur: https://api.piste.gouv.fr/dila/legifrance/lf-engine-app
Commande: vercel env add PISTE_PROD_API_URL production
```

**PISTE_ENVIRONMENT**
```
Valeur: sandbox ou production
Commande: vercel env add PISTE_ENVIRONMENT production
```

---

## ✅ VARIABLES PREVIEW

### Essentielles (adapter pour preview)

**DATABASE_URL** (preview - même que prod ou BD séparée)
```
Valeur: 
Commande: vercel env add DATABASE_URL preview
```

**NEXTAUTH_SECRET** (preview - même que prod)
```
Valeur: 
Commande: vercel env add NEXTAUTH_SECRET preview
```

**NEXTAUTH_URL** (preview - URL de preview)
```
Valeur: https://iapostemanage-preview.pages.dev (adapter selon ton setup)
Commande: vercel env add NEXTAUTH_URL preview
```

---

### Optionnels à adapter pour preview

**GMAIL_REDIRECT_URI** (preview)
```
Valeur: https://iapostemanage-preview.pages.dev/api/auth/callback/google
Commande: vercel env add GMAIL_REDIRECT_URI preview
```

**GITHUB_CALLBACK_URL** (preview)
```
Valeur: https://iapostemanage-preview.pages.dev/api/auth/callback/github
Commande: vercel env add GITHUB_CALLBACK_URL preview
```

**PUBLIC_WEBHOOK_URL** (preview)
```
Valeur: https://iapostemanage-preview.pages.dev/api/webhooks/github
Commande: vercel env add PUBLIC_WEBHOOK_URL preview
```

---

## ✅ CHECKLIST DE SAISIE

Production:
- [ ] DATABASE_URL
- [ ] NEXTAUTH_SECRET
- [ ] NEXTAUTH_URL
- [ ] OLLAMA_BASE_URL (optionnel)
- [ ] OLLAMA_MODEL (optionnel)
- [ ] GMAIL_* (optionnel)
- [ ] GITHUB_* (optionnel)
- [ ] WEBHOOK_* (optionnel)
- [ ] STRIPE_* (optionnel)
- [ ] PISTE_* (optionnel)

Preview:
- [ ] DATABASE_URL
- [ ] NEXTAUTH_SECRET
- [ ] NEXTAUTH_URL (URL preview)
- [ ] GMAIL_REDIRECT_URI (optionnel)
- [ ] GITHUB_CALLBACK_URL (optionnel)
- [ ] PUBLIC_WEBHOOK_URL (optionnel)

---

## 📝 COMMANDES RAPIDES

### Une fois rempli, utiliser :

```powershell
# Lister les variables actuelles
vercel env list

# Lister les variables production
vercel env list production

# Lister les variables preview
vercel env list preview

# Tester après configuration
vercel env pull .env.local
```

---

**Notes supplémentaires :**
- DOTENV_KEY est déjà configuré ✅
- Remplace toutes les valeurs placeholder avant de pousser
- Valide avec `vercel env list` après chaque ajout
- Protect les secrets sensibles (keys, tokens) ⚠️
- Préfère les variables d'environnement chiffrées sur Vercel

