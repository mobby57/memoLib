# 🚀 Guide de Déploiement Production - iaPosteManager

## ✅ Pré-requis

### Logiciels nécessaires
- ✅ **Docker** (version 20.10+) & **Docker Compose** (version 2.0+)
- ✅ **Node.js** (version 18+) & **npm** (version 9+)
- ✅ **Python** (version 3.11+)
- ✅ **Git** (pour versionning)

### Vérification rapide
```bash
docker --version
docker-compose --version
node --version
npm --version
python --version
```

---

## 📋 Checklist Pre-Déploiement

### 1. Configuration Sécurisée

#### ⚠️ CRITIQUE: Fichier `.env.production`
Ouvrez `.env.production` et **changez TOUTES ces valeurs**:

```bash
# ❌ NE PAS GARDER CES VALEURS PAR DÉFAUT !
SECRET_KEY=CHANGE-THIS-TO-A-STRONG-RANDOM-KEY-IN-PRODUCTION
MAIL_USERNAME=your-email@gmail.com
MAIL_PASSWORD=your-app-password-here
OPENAI_API_KEY=your-openai-api-key-here
```

**Comment générer une SECRET_KEY sécurisée:**
```bash
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

#### Configuration Email (Gmail)
1. Activez la validation en 2 étapes sur votre compte Gmail
2. Générez un mot de passe d'application: https://myaccount.google.com/apppasswords
3. Mettez ce mot de passe dans `MAIL_PASSWORD`

#### Configuration OpenAI
1. Obtenez votre clé API: https://platform.openai.com/api-keys
2. Mettez la clé dans `OPENAI_API_KEY`

---

### 2. Tests de Validation

✅ **Tous les tests E2E doivent passer** (actuellement: 6/6 ✓)

```bash
cd src/frontend
npx playwright test tests/e2e/user-journeys.spec.js
```

**Résultat attendu:**
```
✅ Journey 01 - Utilisateur aveugle
✅ Journey 02 - Utilisateur sourd
✅ Journey 03 - Utilisateur muet
✅ Journey 04 - Utilisateur mobilité réduite
✅ Journey 05 - Parcours complet (x2)

6 passed (32s)
```

---

### 3. Build de Production

#### Option A: Script Automatisé Windows (Recommandé)
```bash
.\DEPLOY_PRODUCTION.bat
```

Ce script fait **automatiquement**:
1. ✓ Vérification des prérequis
2. ✓ Exécution des tests E2E
3. ✓ Build du frontend React optimisé
4. ✓ Build de l'image Docker
5. ✓ Arrêt des anciens containers
6. ✓ Déploiement de la nouvelle version

#### Option B: Script Python (Linux/Mac)
```bash
python deploy_production.py
```

#### Option C: Déploiement Manuel

**Étape 1: Build Frontend**
```bash
cd src/frontend
npm install
npm run build
cd ../..
```

**Étape 2: Build Docker**
```bash
docker build -t iapostemanager:latest .
```

**Étape 3: Arrêter anciens containers**
```bash
docker-compose -f docker-compose.prod.yml down
```

**Étape 4: Lancer production**
```bash
docker-compose -f docker-compose.prod.yml up -d
```

---

## 🔧 Configuration Production

### Docker Compose Production

Le fichier `docker-compose.prod.yml` inclut:

```yaml
services:
  backend:
    build: .
    ports:
      - "5000:5000"
    env_file: .env.production
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:5000/api/health"]
      interval: 30s
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 2G
```

**Features de production:**
- ✅ Restart automatique
- ✅ Health checks
- ✅ Limites de ressources (2 CPU, 2GB RAM)
- ✅ Logs rotatifs (max 10MB x 3 fichiers)
- ✅ Volumes persistants pour données

### Nginx Reverse Proxy (Optionnel)

Pour activer Nginx avec rate limiting et SSL:

```bash
docker-compose -f docker-compose.prod.yml --profile with-nginx up -d
```

Configuration incluse:
- Rate limiting API: 10 req/s
- Rate limiting login: 5 req/minute
- Gzip compression
- Security headers
- SSL/TLS ready (config à décommenter)

---

## 📊 Monitoring & Maintenance

### Vérifier le statut
```bash
docker-compose -f docker-compose.prod.yml ps
```

### Voir les logs
```bash
# Tous les logs
docker-compose -f docker-compose.prod.yml logs -f

# Backend uniquement
docker-compose -f docker-compose.prod.yml logs -f backend

# Dernières 100 lignes
docker-compose -f docker-compose.prod.yml logs --tail=100
```

### Health Check Manuel
```bash
curl http://localhost:5000/api/health
```

Réponse attendue:
```json
{
  "status": "healthy",
  "timestamp": "2025-12-15T...",
  "version": "3.4.0"
}
```

### Métriques de performance
```bash
# Utilisation ressources
docker stats

# Espace disque
docker system df
```

---

## 🔄 Mise à Jour Production

### Déploiement Rolling Update (Zéro Downtime)

```bash
# 1. Build nouvelle version
docker build -t iapostemanager:v3.4.1 .

# 2. Update progressif
docker-compose -f docker-compose.prod.yml up -d --no-deps --build backend

# 3. Vérifier
docker-compose -f docker-compose.prod.yml ps
```

### Rollback en cas de problème

```bash
# Revenir à la version précédente
docker tag iapostemanager:previous iapostemanager:latest
docker-compose -f docker-compose.prod.yml up -d --force-recreate
```

---

## 🔒 Sécurité Production

### ✅ Checklist Sécurité

- [ ] **SECRET_KEY** changée (minimum 32 caractères aléatoires)
- [ ] **DEBUG=False** dans .env.production
- [ ] **CORS_ORIGINS** configuré avec votre domaine réel
- [ ] **SESSION_COOKIE_SECURE=True** (HTTPS uniquement)
- [ ] **Rate limiting** activé (Nginx ou Flask-Limiter)
- [ ] **Logs** configurés (rotation activée)
- [ ] **Backup** base de données planifié
- [ ] **SSL/TLS** configuré (Nginx ou Let's Encrypt)
- [ ] **Firewall** configuré (seulement ports 80/443 ouverts)
- [ ] **Monitoring** configuré (uptime, alertes)

### Backup Base de Données

```bash
# Backup manuel
docker exec iapostemanager-prod sh -c \
  "sqlite3 /app/data/production.db .dump" > backup_$(date +%Y%m%d).sql

# Restauration
cat backup_20251215.sql | docker exec -i iapostemanager-prod \
  sh -c "sqlite3 /app/data/production.db"
```

### Backup Automatisé (Cron)

Ajoutez au crontab (Linux/Mac):
```bash
# Backup quotidien à 2h du matin
0 2 * * * /path/to/backup-script.sh

# Script: backup-script.sh
#!/bin/bash
docker exec iapostemanager-prod sh -c \
  "sqlite3 /app/data/production.db .dump" > \
  /backups/iaposte_$(date +\%Y\%m\%d).sql
# Garder seulement 7 derniers jours
find /backups -name "iaposte_*.sql" -mtime +7 -delete
```

---

## 🌐 Configuration Domaine & SSL

### 1. Obtenir un certificat SSL (Let's Encrypt)

```bash
# Installer certbot
sudo apt-get install certbot

# Générer certificat
sudo certbot certonly --standalone -d votre-domaine.com
```

### 2. Configurer Nginx avec SSL

Décommentez la section HTTPS dans `nginx/nginx.conf`:

```nginx
server {
    listen 443 ssl http2;
    server_name votre-domaine.com;
    
    ssl_certificate /etc/nginx/ssl/fullchain.pem;
    ssl_certificate_key /etc/nginx/ssl/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    # ...
}
```

### 3. Redirection HTTP → HTTPS

```nginx
server {
    listen 80;
    server_name votre-domaine.com;
    return 301 https://$server_name$request_uri;
}
```

---

## 📈 Optimisations Production

### Frontend React

Le build production inclut:
- ✅ **Minification** (Terser)
- ✅ **Tree shaking** (code mort supprimé)
- ✅ **Code splitting** (vendor chunks séparés)
- ✅ **Gzip compression** (fichiers compressés)
- ✅ **Source maps** désactivés
- ✅ **console.log** supprimés

### Backend Flask

Optimisations actives:
- ✅ **Gunicorn** multi-workers (production WSGI)
- ✅ **Cache** (TTL 600s)
- ✅ **Rate limiting** (60 req/min)
- ✅ **Connection pooling** (base de données)

### Docker

Image optimisée:
- ✅ **Multi-stage build** (frontend séparé)
- ✅ **Alpine Linux** (image légère)
- ✅ **Layer caching** (build rapide)
- ✅ **No-cache pip** (espace disque)

---

## 🐛 Troubleshooting

### Problème: Container ne démarre pas

```bash
# Voir les logs d'erreur
docker-compose -f docker-compose.prod.yml logs backend

# Vérifier la config
docker-compose -f docker-compose.prod.yml config

# Redémarrer en mode debug
docker-compose -f docker-compose.prod.yml up backend
```

### Problème: API retourne 500

```bash
# Logs détaillés
docker exec iapostemanager-prod tail -f /app/logs/production.log

# Vérifier variables d'env
docker exec iapostemanager-prod env | grep FLASK
```

### Problème: Lenteur performance

```bash
# Vérifier CPU/RAM
docker stats iapostemanager-prod

# Augmenter ressources dans docker-compose.prod.yml
deploy:
  resources:
    limits:
      cpus: '4'
      memory: 4G
```

### Problème: Espace disque plein

```bash
# Nettoyer images inutilisées
docker system prune -a

# Nettoyer volumes orphelins
docker volume prune

# Vérifier taille logs
du -sh logs/
```

---

## 📞 Support & Contacts

### En cas de problème critique

1. **Arrêt d'urgence:**
   ```bash
   docker-compose -f docker-compose.prod.yml down
   ```

2. **Mode maintenance:**
   Renommez `src/frontend/dist/index.html` temporairement

3. **Logs complets:**
   ```bash
   docker-compose -f docker-compose.prod.yml logs > debug.log
   ```

### Documentation supplémentaire

- 📖 Guide utilisateur: `GUIDE_UTILISATEUR.md`
- 🧪 Tests E2E: `GUIDE_TESTS_E2E_RAPIDE.md`
- ♿ Accessibilité: `GUIDE_ACCESSIBILITE_RAPIDE.md`
- 📧 Configuration email: `GUIDE_APP_PASSWORD.md`

---

## ✅ Validation Finale

Après déploiement, vérifiez:

1. ✅ Application accessible: http://localhost:5000
2. ✅ Login fonctionne (test avec password)
3. ✅ API health check: http://localhost:5000/api/health
4. ✅ Profils accessibilité fonctionnent
5. ✅ Dictée vocale fonctionne
6. ✅ Envoi email fonctionne (si configuré)
7. ✅ Logs propres (pas d'erreurs)

```bash
# Test automatisé complet
curl http://localhost:5000/api/health && \
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"password":"test"}' && \
echo "✅ Production OK!"
```

---

## 🎉 Production Ready!

Votre application **iaPosteManager v3.4** est maintenant en production avec:

- ✅ **6/6 tests E2E validés**
- ✅ **Build optimisé** (minification, compression, splitting)
- ✅ **Docker** avec health checks et restart automatique
- ✅ **Nginx** avec rate limiting et security headers
- ✅ **Monitoring** via logs et health endpoints
- ✅ **Sécurité** renforcée (.env.production, HTTPS ready)

**Prochaines étapes recommandées:**
1. Configurer un nom de domaine
2. Activer SSL/TLS avec Let's Encrypt
3. Mettre en place monitoring avancé (Prometheus, Grafana)
4. Configurer backups automatiques
5. Activer CI/CD (GitHub Actions)

---

**Version:** 3.4.0  
**Date:** 15 Décembre 2025  
**Status:** ✅ Production Ready
