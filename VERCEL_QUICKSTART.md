# 🚀 Déploiement Vercel - Guide Rapide

## Prérequis

✅ Vercel CLI installé : `npm i -g vercel`  
✅ Compte Vercel créé : https://vercel.com  
✅ Repository GitHub configuré

## 🎯 Déploiement en 3 Étapes

### 1️⃣ Login Vercel

```bash
vercel login
```

Choisir la méthode de connexion (GitHub, GitLab, etc.)

### 2️⃣ Configuration Variables d'Environnement

Dans **Vercel Dashboard** > **Settings** > **Environment Variables**, ajouter :

| Variable | Valeur |
|----------|--------|
| `DATABASE_URL` | `postgresql://user:pass@host:5432/db` |
| `SECRET_KEY` | Clé secrète Flask (générée) |
| `IMAP_USERNAME` | Email Gmail |
| `IMAP_PASSWORD` | App Password Gmail |
| `SMTP_USERNAME` | Email Gmail |
| `SMTP_PASSWORD` | App Password Gmail |

**Générer SECRET_KEY:**
```bash
python -c "import secrets; print(secrets.token_hex(32))"
```

### 3️⃣ Déployer

```bash
# Preview (test)
vercel

# Production
vercel --prod
```

## 📋 Checklist Déploiement

- [ ] Variables d'environnement configurées dans Vercel
- [ ] Base PostgreSQL accessible (whitelist Vercel IPs)
- [ ] Gmail App Passwords configurés
- [ ] `vercel.json` configuré
- [ ] `requirements.txt` à jour
- [ ] Test local réussi : `python api/index.py`

## 🧪 Test Après Déploiement

```bash
# Health check
curl https://votre-app.vercel.app/api/v2/health

# Test login
curl -X POST https://votre-app.vercel.app/api/v2/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"email_system","password":"EmailSystem2025!"}'
```

## ⚙️ Configuration PostgreSQL Externe

**Options recommandées:**

1. **Supabase** (Gratuit)
   - https://supabase.com
   - PostgreSQL + API REST
   - Dashboard inclus

2. **Neon** (Serverless)
   - https://neon.tech
   - PostgreSQL serverless
   - Auto-scale

3. **Railway** (Simple)
   - https://railway.app
   - PostgreSQL + déploiement app
   - $5/mois

## 🔧 Troubleshooting

### Erreur: Module not found
```bash
vercel --prod --force
```

### Timeout (>10s)
- Optimiser requêtes DB
- Ajouter connection pooling
- Cache Redis externe

### Database connection failed
- Vérifier `DATABASE_URL` format
- Whitelist Vercel IPs dans PostgreSQL
- Tester connexion locale

## 📊 Monitoring

Accéder aux logs :
```bash
vercel logs [deployment-url]
```

Dashboard Vercel : Analytics inclus

## 🔄 Mise à Jour

```bash
# Re-déployer
vercel --prod

# Rollback si problème
vercel ls
vercel promote [old-deployment-url]
```

## 📚 Documentation

- Guide complet : [docs/VERCEL_DEPLOYMENT.md](docs/VERCEL_DEPLOYMENT.md)
- Installation : [docs/INSTALLATION_GUIDE.md](docs/INSTALLATION_GUIDE.md)
- API Docs : [docs/API_DOCUMENTATION.md](docs/API_DOCUMENTATION.md)

---

**Support:** Voir documentation complète ou GitHub Issues
