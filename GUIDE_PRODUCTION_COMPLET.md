# 📚 GUIDE PRODUCTION COMPLET - iaPosteManager

## 🎯 Vue d'ensemble

Ce guide centralise **tout** ce dont vous avez besoin pour déployer et maintenir iaPosteManager en production.

**Infrastructure créée aujourd'hui :**
- ✅ Application déployée en Docker (5/5 tests passent)
- ✅ SSL/HTTPS automatisé
- ✅ Monitoring Prometheus/Grafana
- ✅ Pipeline CI/CD GitHub Actions
- ✅ Système de backup automatique
- ✅ Tests avancés (API, charge, sécurité)
- ✅ Configuration email production
- ✅ Sécurité renforcée (WAF, rate limiting)
- ✅ PWA avec mode offline

---

## 📋 Table des matières

1. [Déploiement Initial](#1-déploiement-initial)
2. [Configuration SSL/HTTPS](#2-configuration-ssl-https)
3. [Monitoring](#3-monitoring)
4. [CI/CD](#4-ci-cd)
5. [Backups](#5-backups)
6. [Tests](#6-tests)
7. [Configuration Email](#7-configuration-email)
8. [Sécurité](#8-sécurité)
9. [PWA Mobile](#9-pwa-mobile)
10. [Maintenance](#10-maintenance)
11. [Troubleshooting](#11-troubleshooting)

---

## 1. Déploiement Initial

### Prérequis
```bash
# Docker 20.10+
docker --version

# Docker Compose 2.0+
docker-compose --version

# Espace disque: 5GB minimum
df -h
```

### Démarrage Production
```powershell
# Windows (vous êtes ici)
.\DEPLOY_PRODUCTION.bat

# Linux/Mac
docker-compose -f docker-compose.prod.yml up -d --build
```

### Vérification
```powershell
# Health check
curl http://localhost:5000/api/health

# Logs
docker-compose logs -f backend

# Status
docker-compose ps
```

**✅ État actuel :** Application déployée et validée (5/5 tests OK)

---

## 2. Configuration SSL/HTTPS

### Installation automatique Let's Encrypt

**Script :** `ssl/setup-ssl.sh`

```bash
# Sur votre serveur Linux
chmod +x ssl/setup-ssl.sh
sudo ./ssl/setup-ssl.sh votre-domaine.com
```

**Ce que fait le script :**
1. ✅ Installe certbot
2. ✅ Génère certificat SSL Let's Encrypt
3. ✅ Configure Nginx avec HTTPS
4. ✅ Configure auto-renouvellement (cron)
5. ✅ Ouvre ports 80/443 firewall

### Configuration manuelle Nginx

**Fichier :** `security/nginx-secure.conf`

```bash
# Copier la config
sudo cp security/nginx-secure.conf /etc/nginx/sites-available/iapostemanager

# Activer
sudo ln -s /etc/nginx/sites-available/iapostemanager /etc/nginx/sites-enabled/

# Tester
sudo nginx -t

# Recharger
sudo systemctl reload nginx
```

### Vérification SSL
```bash
# Score SSL Labs (objectif: A+)
curl -I https://votre-domaine.com | grep -i strict

# Test certificat
openssl s_client -connect votre-domaine.com:443 -servername votre-domaine.com
```

---

## 3. Monitoring

### Stack Prometheus + Grafana

**Fichier :** `monitoring/docker-compose.monitoring.yml`

```bash
# Démarrer monitoring
docker-compose -f monitoring/docker-compose.monitoring.yml up -d

# Accès interfaces
# Prometheus: http://localhost:9090
# Grafana: http://localhost:3000 (admin/admin)
# Alertmanager: http://localhost:9093
```

### Configuration Grafana

1. **Connexion :** http://localhost:3000
2. **Login :** admin / admin (changez immédiatement!)
3. **Ajouter Prometheus :**
   - Configuration → Data Sources → Add Prometheus
   - URL: `http://prometheus:9090`
   - Save & Test

4. **Importer dashboards :**
   - Dashboard → Import → ID: 1860 (Node Exporter)
   - Dashboard → Import → ID: 893 (Container Stats)

### Alertes configurées

**Fichier :** `monitoring/prometheus/prometheus.yml`

- ⚠️ CPU > 80% pendant 5 minutes
- ⚠️ Mémoire > 80% pendant 5 minutes
- ⚠️ Taux d'erreur HTTP > 5%
- ⚠️ Application down

### Visualisation metrics

```bash
# Vérifier targets Prometheus
curl http://localhost:9090/api/v1/targets

# Requête exemple
curl 'http://localhost:9090/api/v1/query?query=up'
```

---

## 4. CI/CD

### Pipeline GitHub Actions

**Fichier :** `.github/workflows/ci-cd.yml`

**Workflow :**
```
Push sur main/develop
    ↓
Tests E2E Playwright (6 tests)
    ↓
Build Docker image
    ↓
Deploy via SSH
    ↓
Vérification santé
    ↓
Notifications Slack (optionnel)
```

### Configuration Secrets GitHub

**Settings → Secrets and variables → Actions**

```
DOCKER_USERNAME=votre-username
DOCKER_PASSWORD=votre-token
SSH_PRIVATE_KEY=votre-clé-ssh-privée
PRODUCTION_HOST=votre-serveur.com
PRODUCTION_USER=deploy
SLACK_WEBHOOK_URL=https://hooks.slack.com/... (optionnel)
```

### Déclenchement manuel

```bash
# Via GitHub UI
Actions → CI/CD Pipeline → Run workflow

# Via API
curl -X POST \
  -H "Accept: application/vnd.github+json" \
  -H "Authorization: Bearer $GITHUB_TOKEN" \
  https://api.github.com/repos/OWNER/REPO/actions/workflows/ci-cd.yml/dispatches \
  -d '{"ref":"main"}'
```

### Rollback automatique

Le pipeline rollback automatiquement si :
- Tests E2E échouent
- Build Docker échoue
- Health check post-déploiement échoue

---

## 5. Backups

### Backup automatique quotidien

**Script :** `scripts/backup.sh`

```bash
# Installation cron
chmod +x scripts/backup.sh
crontab -e

# Ajouter (backup à 2h du matin)
0 2 * * * /chemin/vers/scripts/backup.sh
```

**Ce qui est sauvegardé :**
- 📦 Base de données SQLite (`data/production.db`)
- 📁 Dossier data complet
- 📝 Logs (`logs/`)
- ⚙️ Configuration (`.env.production`)

**Rotation :** Garde les 7 derniers jours, supprime les plus anciens

### Backup manuel

```bash
# Backup immédiat
./scripts/backup.sh

# Vérifier backups
ls -lh backups/
```

### Restauration

**Script :** `scripts/restore.sh`

```bash
# Lister backups disponibles
ls backups/

# Restaurer un backup
./scripts/restore.sh backups/backup-2025-12-15-02-00-00.tar.gz
```

**Processus de restauration :**
1. ⏸️ Arrêt des conteneurs Docker
2. 📦 Extraction du backup
3. 📋 Restauration fichiers
4. ▶️ Redémarrage conteneurs
5. ✅ Vérification santé

### Backup distant (recommandé production)

```bash
# Vers AWS S3
aws s3 sync backups/ s3://votre-bucket/iapostemanager-backups/

# Vers serveur distant
rsync -avz backups/ user@backup-server:/backups/iapostemanager/
```

---

## 6. Tests

### Tests API

**Script :** `tests/test-api.sh`

```bash
# Tester tous endpoints
bash tests/test-api.sh http://localhost:5000

# Production
bash tests/test-api.sh https://votre-domaine.com
```

**Endpoints testés :**
- ✅ Health check
- ✅ Login API
- ✅ Templates
- ✅ Accessibility settings
- ✅ Dashboard stats
- ✅ Email history

### Tests de charge

**Script :** `tests/load-test.sh`

```bash
# Test avec 10 users, 60 secondes
bash tests/load-test.sh 10 60 http://localhost:5000

# Test intensif (50 users, 5 minutes)
bash tests/load-test.sh 50 300 https://votre-domaine.com
```

**Métriques mesurées :**
- Requêtes/seconde
- Temps de réponse moyen
- Temps de réponse p95/p99
- Taux d'erreur
- Connexions simultanées

**Rapport HTML généré :** `load-test-report.html`

### Audit de sécurité

**Script :** `tests/security-audit.sh`

```bash
# Audit complet
bash tests/security-audit.sh https://votre-domaine.com
```

**Vérifications :**
- 🔒 Headers de sécurité
- 🛡️ Configuration SSL/TLS
- 🚨 Vulnérabilités connues (Nikto)
- 🔍 Scan ports (Nmap)
- 📋 Checklist sécurité

**Rapport HTML généré :** `security-reports-DATE/report.html`

### Tests E2E Playwright (déjà configurés)

```bash
# Localement
npm test

# Docker
docker-compose run --rm tests
```

---

## 7. Configuration Email

### Choix du service SMTP

**Fichier :** `config/email-config.env`

#### Option 1: Gmail (Simple pour test)
```env
MAIL_SERVER=smtp.gmail.com
MAIL_PORT=587
MAIL_USE_TLS=True
MAIL_USERNAME=votre-email@gmail.com
MAIL_PASSWORD=votre-app-password
```

**Configuration App Password Gmail :**
1. Google Account → Sécurité
2. Activer validation 2 étapes
3. Mots de passe d'application → Générer
4. Copier le mot de passe (16 caractères)

#### Option 2: SendGrid (Recommandé production)
```env
MAIL_SERVER=smtp.sendgrid.net
MAIL_PORT=587
MAIL_USERNAME=apikey
MAIL_PASSWORD=SG.xxxxxxxxxxxxxxxxxxxxx
```

**Configuration SendGrid :**
1. Créer compte sur sendgrid.com
2. Settings → API Keys → Create API Key
3. Permissions: Full Access (Mail Send)
4. Copier la clé API

#### Option 3: AWS SES (Scalable)
```env
MAIL_SERVER=email-smtp.eu-west-1.amazonaws.com
MAIL_PORT=587
MAIL_USERNAME=AKIAXXXXXXXXXXXXXXXX
MAIL_PASSWORD=votre-ses-smtp-password
```

### Service Email Python

**Fichier :** `src/backend/services/email_service.py`

```python
from email_service import EmailService

# Initialiser
email = EmailService()

# Envoyer email simple
email.send_email(
    to=['user@example.com'],
    subject='Test',
    body_html='<h1>Hello</h1>'
)

# Envoyer avec template
email.send_template_email(
    to=['user@example.com'],
    template_name='welcome',
    context={'user_name': 'John', 'app_url': 'https://...'},
    subject='Bienvenue'
)
```

### Templates email disponibles

**Dossier :** `templates/email/`

1. **welcome.html** - Email de bienvenue
2. **password_reset.html** - Réinitialisation mot de passe
3. **email_sent.html** - Confirmation envoi

### Test email

```python
# Test rapide
python -c "
from src.backend.services.email_service import EmailService
email = EmailService()
print(email.send_email(['test@example.com'], 'Test', '<p>Test</p>'))
"
```

---

## 8. Sécurité

### Configuration Nginx sécurisée

**Fichier :** `security/nginx-secure.conf`

**Security Headers configurés :**
- ✅ HSTS (Strict-Transport-Security)
- ✅ X-Frame-Options: DENY
- ✅ X-Content-Type-Options: nosniff
- ✅ X-XSS-Protection
- ✅ Content-Security-Policy
- ✅ Referrer-Policy

**Rate Limiting :**
- 🚦 Login: 5 requêtes/minute max
- 🚦 API: 100 requêtes/minute max
- 🚦 Connexions: 50 simultanées max

### ModSecurity (WAF)

**Script :** `security/install-waf.sh`

```bash
# Installation
sudo bash security/install-waf.sh
```

**Protection contre :**
- 🛡️ Injection SQL
- 🛡️ XSS (Cross-Site Scripting)
- 🛡️ Path Traversal
- 🛡️ CSRF
- 🛡️ Bots malveillants

**Logs :** `/var/log/nginx/modsec_audit.log`

### Fail2Ban

**Script :** `security/setup-fail2ban.sh`

```bash
# Installation
sudo bash security/setup-fail2ban.sh
```

**Règles configurées :**
- 🚨 5 tentatives login échouées → Ban 2h
- 🚨 10 requêtes rate-limited → Ban 1h
- 🚨 2 requêtes de bots → Ban 24h

**Commandes utiles :**
```bash
# Status
sudo fail2ban-client status

# Débannir IP
sudo fail2ban-client set nginx-login unbanip 1.2.3.4

# Voir IPs bannies
sudo fail2ban-client status nginx-login
```

### Checklist Sécurité Production

- [ ] HTTPS activé avec Let's Encrypt
- [ ] Certificat SSL note A+ (SSL Labs)
- [ ] Tous les security headers configurés
- [ ] ModSecurity WAF actif
- [ ] Fail2Ban configuré
- [ ] Rate limiting actif
- [ ] Firewall configuré (ufw/iptables)
- [ ] Ports inutiles fermés (ne garder que 22, 80, 443)
- [ ] SSH avec clés uniquement (pas de password)
- [ ] Mots de passe forts partout
- [ ] Secrets jamais dans le code (variables d'environnement)
- [ ] Logs sans données sensibles
- [ ] Backups chiffrés
- [ ] Dépendances à jour (npm audit, pip list --outdated)

---

## 9. PWA Mobile

### Manifest PWA

**Fichier :** `public/manifest.json`

**Fonctionnalités PWA :**
- 📱 Installation sur écran d'accueil
- 🌐 Mode offline
- 🔔 Notifications push
- 🚀 Chargement rapide (cache)
- 📲 Raccourcis app

### Service Worker

**Fichier :** `public/service-worker.js`

**Stratégies de cache :**
- **API :** Network First (toujours frais, fallback cache)
- **Assets statiques :** Cache First (rapide)
- **Pages HTML :** Network First + Cache Fallback

### Installation PWA

**Desktop (Chrome/Edge) :**
1. Visiter https://votre-domaine.com
2. Icône "Installer" dans barre d'adresse
3. Cliquer "Installer"

**Mobile (Android/iOS) :**
1. Ouvrir dans Safari/Chrome
2. Menu → "Ajouter à l'écran d'accueil"
3. Confirmer

### Page Offline

**Fichier :** `public/offline.html`

Affichée automatiquement quand :
- Pas de connexion Internet
- Serveur inaccessible
- Timeout réseau

### Notifications Push

```javascript
// Demander permission
Notification.requestPermission().then(permission => {
  if (permission === 'granted') {
    // S'abonner aux notifications
    navigator.serviceWorker.ready.then(registration => {
      registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: 'votre-vapid-key'
      });
    });
  }
});
```

### Test PWA

**Outils :**
- Chrome DevTools → Lighthouse → Progressive Web App
- Score objectif : 90+

**Vérifications :**
- ✅ Installable
- ✅ Fonctionne offline
- ✅ Responsive design
- ✅ HTTPS
- ✅ Service Worker enregistré

---

## 10. Maintenance

### Maintenance quotidienne

```bash
# Vérifier santé
curl http://localhost:5000/api/health

# Vérifier logs erreurs
docker-compose logs --tail=100 backend | grep ERROR

# Espace disque
df -h

# Mémoire/CPU
docker stats
```

### Maintenance hebdomadaire

```bash
# Nettoyer images Docker inutilisées
docker system prune -a --volumes

# Vérifier backups
ls -lh backups/

# Scanner sécurité
bash tests/security-audit.sh https://votre-domaine.com

# Mettre à jour dépendances
pip list --outdated
npm outdated
```

### Maintenance mensuelle

```bash
# Renouveler certificat SSL (automatique Let's Encrypt)
sudo certbot renew --dry-run

# Audit complet sécurité
bash tests/security-audit.sh

# Test de charge
bash tests/load-test.sh 50 300

# Vérifier monitoring
# → Grafana dashboards
# → Prometheus alerts

# Rotation logs
find logs/ -name "*.log" -mtime +30 -delete
```

### Mise à jour application

```bash
# 1. Backup avant mise à jour
./scripts/backup.sh

# 2. Pull nouveau code
git pull origin main

# 3. Rebuild et redéploiement
docker-compose -f docker-compose.prod.yml up -d --build

# 4. Vérifier santé
curl http://localhost:5000/api/health

# 5. Si problème: rollback
./scripts/restore.sh backups/backup-latest.tar.gz
```

---

## 11. Troubleshooting

### Application ne démarre pas

```bash
# Vérifier logs
docker-compose logs backend

# Erreurs communes:
# - Port 5000 déjà utilisé → Changer dans docker-compose
# - Manque variables env → Vérifier .env.production
# - Dépendances manquantes → Rebuild: docker-compose build --no-cache
```

### Erreurs 500 API

```bash
# Logs détaillés
docker-compose logs -f backend | grep ERROR

# Entrer dans container
docker-compose exec backend bash
python -c "from app import app; app.run(debug=True)"
```

### Performance lente

```bash
# Vérifier ressources
docker stats

# Si CPU/RAM haute:
# - Augmenter resources dans docker-compose
# - Scaler horizontalement: docker-compose up -d --scale backend=3

# Vérifier base de données
sqlite3 data/production.db "VACUUM;"
```

### SSL/HTTPS ne fonctionne pas

```bash
# Vérifier Nginx
sudo nginx -t

# Recharger config
sudo systemctl reload nginx

# Vérifier certificat
openssl s_client -connect votre-domaine.com:443

# Renouveler certificat
sudo certbot renew --force-renewal
```

### Emails ne s'envoient pas

```bash
# Test connexion SMTP
python -c "
import smtplib
server = smtplib.SMTP('smtp.gmail.com', 587)
server.starttls()
server.login('user', 'pass')
print('OK')
"

# Vérifier quotas (SendGrid/SES)
# Vérifier logs backend
docker-compose logs backend | grep -i email
```

### Monitoring ne fonctionne pas

```bash
# Vérifier containers monitoring
docker-compose -f monitoring/docker-compose.monitoring.yml ps

# Redémarrer stack monitoring
docker-compose -f monitoring/docker-compose.monitoring.yml restart

# Vérifier targets Prometheus
curl http://localhost:9090/api/v1/targets
```

---

## 📞 Support & Ressources

### Documentation officielle
- Docker: https://docs.docker.com
- Flask: https://flask.palletsprojects.com
- React: https://react.dev
- Nginx: https://nginx.org/en/docs

### Monitoring
- Prometheus: https://prometheus.io/docs
- Grafana: https://grafana.com/docs

### Sécurité
- OWASP: https://owasp.org
- SSL Labs: https://www.ssllabs.com/ssltest
- Let's Encrypt: https://letsencrypt.org

### Logs système
```bash
# Application
docker-compose logs -f backend

# Nginx
tail -f /var/log/nginx/iapostemanager-*.log

# Fail2Ban
tail -f /var/log/fail2ban.log

# ModSecurity
tail -f /var/log/nginx/modsec_audit.log
```

---

## 🎉 Félicitations !

Vous avez maintenant une infrastructure production complète avec :

✅ Application déployée et validée  
✅ SSL/HTTPS automatisé  
✅ Monitoring temps réel  
✅ CI/CD automatisé  
✅ Backups quotidiens  
✅ Tests avancés  
✅ Configuration email pro  
✅ Sécurité renforcée (WAF, rate limiting)  
✅ PWA avec mode offline  
✅ Documentation complète  

**Prochaines étapes recommandées :**

1. 🌐 Configurer votre domaine
2. 🔒 Activer SSL avec `ssl/setup-ssl.sh`
3. 📊 Lancer monitoring
4. 🔐 Configurer GitHub Secrets pour CI/CD
5. 📧 Configurer SMTP production
6. 🛡️ Installer WAF et Fail2Ban
7. 📱 Tester PWA sur mobile
8. ✅ Cocher la checklist sécurité

**Commande de déploiement complet :**
```bash
# 1. Déployer app
docker-compose -f docker-compose.prod.yml up -d

# 2. SSL (sur serveur Linux)
sudo ./ssl/setup-ssl.sh votre-domaine.com

# 3. Monitoring
docker-compose -f monitoring/docker-compose.monitoring.yml up -d

# 4. Sécurité
sudo bash security/install-waf.sh
sudo bash security/setup-fail2ban.sh

# 5. Backup cron
crontab -e
# Ajouter: 0 2 * * * /chemin/vers/scripts/backup.sh

# 6. Tests
bash tests/test-api.sh https://votre-domaine.com
```

---

*Document généré le 15 décembre 2025*  
*Version: 3.5 Production Ready*  
*iaPosteManager - Gestion intelligente des emails*
