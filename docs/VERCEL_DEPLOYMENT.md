# Guide de Déploiement Vercel - IA Poste Manager

## 🚀 Déploiement sur Vercel

### Prérequis

1. Compte Vercel (gratuit): https://vercel.com/signup
2. Repository GitHub configuré
3. Variables d'environnement prêtes

### Installation Vercel CLI

```bash
# Installer globalement
npm i -g vercel

# Vérifier installation
vercel --version
```

### Configuration

#### 1. Fichiers créés

- ✅ `vercel.json` - Configuration Vercel
- ✅ `requirements.txt` - Dependencies Python optimisées
- ✅ `api/index.py` - Handler serverless

#### 2. Variables d'environnement

Dans le dashboard Vercel, ajouter :

```env
DATABASE_URL=postgresql://user:password@host:5432/dbname
SECRET_KEY=votre_secret_key_production
IMAP_USERNAME=votre.email@gmail.com
IMAP_PASSWORD=votre_app_password
SMTP_USERNAME=votre.email@gmail.com
SMTP_PASSWORD=votre_app_password
FLASK_ENV=production
```

### Déploiement

#### Option 1: Via CLI (Recommandé)

```bash
# Se connecter
vercel login

# Premier déploiement (preview)
vercel

# Déploiement production
vercel --prod
```

#### Option 2: Via GitHub (Automatique)

1. Connecter repository GitHub à Vercel
2. Push sur main → déploiement automatique
3. Configurer variables d'env dans Vercel dashboard

### Structure Vercel

```
iaPostemanage/
├── api/
│   └── index.py          # Handler serverless
├── backend/
│   └── app_postgres.py   # Application Flask
├── src/
│   └── backend/
│       └── services/     # Services PostgreSQL
├── vercel.json           # Config Vercel
└── requirements.txt      # Dependencies
```

### Commandes Vercel

```bash
# Preview deployment
vercel

# Production deployment
vercel --prod

# Voir logs
vercel logs

# Liste des déploiements
vercel ls

# Supprimer déploiement
vercel remove [deployment-url]

# Variables d'environnement
vercel env add DATABASE_URL
vercel env pull
```

### Limitations Vercel (Plan Gratuit)

- ⏱️ Timeout: 10 secondes par requête
- 💾 Mémoire: 1024 MB
- 📦 Build: 12 secondes max
- 🔄 Cold starts possibles
- 🗄️ Pas de WebSocket persistant
- 📁 Système de fichiers read-only

### Optimisations

1. **Database Connection Pooling**
   - Utiliser connection pooling PostgreSQL
   - Fermer connexions après chaque requête

2. **Cache**
   - Redis externe (Upstash, Redis Cloud)
   - Cache in-memory pour données statiques

3. **Assets**
   - Servir static files via Vercel CDN
   - Optimiser images

### Alternatives si limitations

Si Vercel ne convient pas :

1. **Railway** - Base de données incluse
2. **Render** - Plus de temps d'exécution
3. **Heroku** - PostgreSQL gratuit
4. **DigitalOcean App Platform** - Plus flexible

### Vérification Déploiement

Après déploiement, tester :

```bash
# Health check
curl https://votre-app.vercel.app/api/v2/health

# Test login
curl -X POST https://votre-app.vercel.app/api/v2/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"email_system","password":"EmailSystem2025!"}'
```

### Troubleshooting

**Erreur: "Module not found"**
- Vérifier `requirements.txt`
- Rebuild : `vercel --prod --force`

**Erreur: "Database connection failed"**
- Vérifier `DATABASE_URL` dans env vars
- Whitelist Vercel IPs dans PostgreSQL

**Timeout errors**
- Optimiser requêtes SQL
- Réduire le nombre de services chargés
- Utiliser cache

### Monitoring

Outils recommandés :
- Vercel Analytics (inclus)
- Sentry (erreurs)
- LogRocket (sessions)
- Better Uptime (monitoring)

### Rollback

```bash
# Lister déploiements
vercel ls

# Promouvoir ancien déploiement
vercel promote [deployment-url]
```

---

**Note**: Pour PostgreSQL, considérer un service externe comme :
- Supabase (gratuit)
- Neon (serverless Postgres)
- Railway (PostgreSQL inclus)
- ElephantSQL (plan gratuit)
