# Secrets Vercel — Configuration Production

## Variables obligatoires

Configurer dans **Vercel Dashboard → Settings → Environment Variables** :

| Variable | Description | Exemple |
|----------|-------------|---------|
| `DATABASE_URL` | URL PostgreSQL de production | `postgresql://user:pass@host:5432/memolib` |
| `NEXTAUTH_SECRET` | Clé de signature des sessions | Générer avec `openssl rand -base64 32` |
| `NEXTAUTH_URL` | URL publique du site | `https://memolib.vercel.app` |
| `CRON_SECRET` | Token d'auth pour les cron jobs Vercel | Générer avec `openssl rand -hex 16` |

## Variables optionnelles

| Variable | Service | Notes |
|----------|---------|-------|
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | OAuth Google | Console Google Cloud |
| `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET` | OAuth GitHub | GitHub Developer Settings |
| `AZURE_CLIENT_ID` / `AZURE_CLIENT_SECRET` / `AZURE_TENANT_ID` | OAuth Azure AD | Entra ID (optionnel) |
| `STRIPE_SECRET_KEY` | Paiements Stripe | Dashboard Stripe |
| `STRIPE_WEBHOOK_SECRET` | Webhooks Stripe | `whsec_...` |
| `BLOB_READ_WRITE_TOKEN` | Vercel Blob Storage | Vercel Dashboard → Storage |
| `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` | Rate limiting | Upstash Console |
| `SENTRY_DSN` | Monitoring erreurs | Sentry Dashboard |
| `OPENAI_API_KEY` | IA (classification, extraction) | OpenAI Platform |

## Scopes recommandés

- **Production** : toutes les variables ci-dessus
- **Preview** : même config avec des clés de test (Stripe `sk_test_`, DB de staging)
- **Development** : utiliser `.env.local` en local

## Vérification post-déploiement

```bash
# Vérifier que le site répond
curl -s https://memolib.vercel.app/api/auth/providers | jq .

# Vérifier les crons (logs dans Vercel Dashboard → Cron Jobs)
# deadline-alerts : tous les jours à 8h UTC
# cost-alerts : tous les jours à 9h UTC
```

## Rotation des secrets

1. Générer un nouveau secret
2. Ajouter la nouvelle valeur dans Vercel (la variable est mise à jour au prochain déploiement)
3. Redéployer : `vercel --prod`
4. Vérifier que l'app fonctionne
5. Révoquer l'ancien secret côté provider (Google, GitHub, Stripe, etc.)
