# 🔐 Variables d'Environnement Cloudflare Pages

## Variables ESSENTIELLES (À ajouter MAINTENANT)

```env
NODE_VERSION=20.19.5
NEXTAUTH_URL=https://iaposte-manager.pages.dev
NEXTAUTH_SECRET=vquobyYX9ptr8LfgJ0fcs7HtiA7B3HrC/0ji30D39OA=
DATABASE_URL=file:./dev.db
OLLAMA_BASE_URL=http://localhost:11434
```

## Variables OPTIONNELLES (À ajouter après le premier déploiement)

### Email (SendGrid)
```env
SENDGRID_API_KEY=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
SENDGRID_SENDER_EMAIL=contact@iapostemanager.com
SENDGRID_SENDER_NAME=IA Poste Manager
```

### Monitoring (Sentry)
```env
NEXT_PUBLIC_SENTRY_DSN=https://b8f483c8abdb798e1a9d63cb2c85f158@o4510691517464576.ingest.de.sentry.io/4510691539222608
SENTRY_AUTH_TOKEN=6970b162eee011f091b55696b163d649
```

### Redis (Upstash ou autre)
```env
REDIS_URL=redis://default:changeme@localhost:6379
REDIS_ENABLED=true
```

## Comment ajouter les variables

1. **Dashboard Cloudflare** → Workers & Pages → iaposte-manager
2. **Settings** → Environment variables
3. **Production (and all previews)** tab
4. **Add variable** pour chaque variable
5. **Redeploy** pour appliquer

## ⚠️ Notes Importantes

- `NEXTAUTH_URL` sera mis à jour automatiquement avec l'URL Cloudflare
- `DATABASE_URL` peut être remplacé par D1 Database plus tard
- `OLLAMA_BASE_URL` ne fonctionnera pas sur Cloudflare (utiliser Workers AI à la place)

## 🔄 Mise à jour après déploiement

Une fois déployé, récupérez l'URL finale (ex: `https://abc123.pages.dev`) et mettez à jour :

```env
NEXTAUTH_URL=https://[votre-url-finale].pages.dev
```

Puis redéployez pour appliquer le changement.
