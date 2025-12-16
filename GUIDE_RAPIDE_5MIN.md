# ======================================================
# GUIDE RAPIDE - DÉMARRAGE EN 5 MINUTES
# ======================================================

## 🚀 DÉMARRAGE IMMÉDIAT (Local)

### Option 1: Tout démarrer en une commande
```powershell
# Windows
.\DEMARRER_INFRASTRUCTURE.bat

# Choisir option [3] - Demarrer TOUT
```

### Option 2: Commandes manuelles
```powershell
# 1. Application
docker-compose -f docker-compose.prod.yml up -d

# 2. Monitoring
docker-compose -f monitoring\docker-compose.monitoring.yml up -d

# 3. Vérifier
docker ps
curl http://localhost:5000/api/health
```

### Accès Services
```
✅ Application:  http://localhost:5000
✅ Prometheus:   http://localhost:9090
✅ Grafana:      http://localhost:3000 (admin/admin)
✅ Alertmanager: http://localhost:9093
```

---

## 📋 TESTS RAPIDES (2 minutes)

### Test Application
```powershell
# Health check
curl http://localhost:5000/api/health

# Login API
curl -X POST http://localhost:5000/api/auth/login -H "Content-Type: application/json" -d '{\"password\":\"test123\"}'

# Tous les tests
bash tests/test-api.sh http://localhost:5000
```

### Test PWA
1. Ouvrir Chrome: http://localhost:5000
2. Vérifier icône "Installer" dans barre d'adresse
3. F12 → Application → Service Workers
4. Vérifier "service-worker.js" actif

---

## 🔐 DÉPLOIEMENT SERVEUR (30 minutes)

### 1. Préparer Serveur
```bash
# Sur serveur Linux
sudo apt update
sudo apt install -y docker.io docker-compose git curl

# Cloner projet
git clone https://github.com/VOTRE-REPO/iaPosteManager.git
cd iaPosteManager
```

### 2. Configuration
```bash
# Copier et éditer .env
cp .env.example .env.production
nano .env.production

# Variables importantes:
# - OPENAI_API_KEY=sk-...
# - SECRET_KEY=votre-secret-aleatoire-32-chars
# - SMTP_SERVER, SMTP_USER, SMTP_PASSWORD
```

### 3. SSL/HTTPS
```bash
# Installation automatique
chmod +x ssl/setup-ssl.sh
sudo ./ssl/setup-ssl.sh votre-domaine.com

# Vérifier
curl -I https://votre-domaine.com
```

### 4. Démarrer Production
```bash
# Application
docker-compose -f docker-compose.prod.yml up -d

# Monitoring
docker-compose -f monitoring/docker-compose.monitoring.yml up -d

# Vérifier
docker ps
curl https://votre-domaine.com/api/health
```

---

## 🛡️ SÉCURITÉ (20 minutes)

### ModSecurity (WAF)
```bash
sudo bash security/install-waf.sh
sudo systemctl reload nginx
```

### Fail2Ban
```bash
sudo bash security/setup-fail2ban.sh
sudo fail2ban-client status
```

### Firewall
```bash
sudo ufw enable
sudo ufw allow 22/tcp   # SSH
sudo ufw allow 80/tcp   # HTTP
sudo ufw allow 443/tcp  # HTTPS
sudo ufw status
```

---

## 💾 BACKUPS (5 minutes)

### Configuration Cron
```bash
# Rendre exécutable
chmod +x scripts/backup.sh scripts/restore.sh

# Ajouter au cron (2h du matin)
crontab -e
# Ajouter: 0 2 * * * /chemin/complet/scripts/backup.sh

# Test backup manuel
./scripts/backup.sh
ls -lh backups/
```

### Restauration
```bash
./scripts/restore.sh backups/backup-2025-12-15-02-00-00.tar.gz
```

---

## 📊 MONITORING (10 minutes)

### Grafana Setup
```
1. Ouvrir: http://votre-ip:3000
2. Login: admin / admin
3. Changer mot de passe
4. Add Data Source → Prometheus
   URL: http://prometheus:9090
5. Import Dashboard:
   - ID 1860 (Node Exporter)
   - ID 893 (Docker)
```

### Vérifier Métriques
```bash
# Targets Prometheus
curl http://localhost:9090/api/v1/targets | jq

# Test alerte
curl http://localhost:9093/api/v1/alerts
```

---

## ✉️ EMAIL (15 minutes)

### Option 1: Gmail (Test)
```env
# Dans .env.production
MAIL_SERVER=smtp.gmail.com
MAIL_PORT=587
MAIL_USE_TLS=True
MAIL_USERNAME=votre-email@gmail.com
MAIL_PASSWORD=votre-app-password-16-chars
```

**Obtenir App Password Gmail:**
1. Google Account → Sécurité
2. Activer validation 2 étapes
3. Mots de passe d'application → Générer
4. Copier le code 16 caractères

### Option 2: SendGrid (Production)
```env
MAIL_SERVER=smtp.sendgrid.net
MAIL_PORT=587
MAIL_USERNAME=apikey
MAIL_PASSWORD=SG.votre-api-key
```

**Obtenir SendGrid API Key:**
1. Créer compte: https://sendgrid.com
2. Settings → API Keys → Create API Key
3. Full Access (Mail Send)
4. Copier la clé

### Test Email
```python
python -c "
from src.backend.services.email_service import EmailService
email = EmailService()
result = email.send_email(
    to=['test@example.com'],
    subject='Test iaPosteManager',
    body_html='<h1>Test OK!</h1>'
)
print('Succès!' if result else 'Erreur')
"
```

---

## 🔍 TROUBLESHOOTING

### Application ne démarre pas
```powershell
# Vérifier logs
docker-compose -f docker-compose.prod.yml logs --tail=50 backend

# Rebuild sans cache
docker-compose -f docker-compose.prod.yml build --no-cache
docker-compose -f docker-compose.prod.yml up -d
```

### Port déjà utilisé
```powershell
# Trouver processus
netstat -ano | findstr :5000

# Tuer processus (remplacer PID)
taskkill /PID 1234 /F

# Ou changer port dans docker-compose.prod.yml
```

### SSL ne fonctionne pas
```bash
# Vérifier certificat
sudo certbot certificates

# Renouveler
sudo certbot renew --force-renewal

# Test Nginx
sudo nginx -t
sudo systemctl reload nginx
```

### Grafana sans données
```bash
# Vérifier Prometheus
curl http://localhost:9090/api/v1/targets

# Redémarrer monitoring
docker-compose -f monitoring/docker-compose.monitoring.yml restart

# Vérifier data source Grafana
# Configuration → Data Sources → Prometheus
# URL doit être: http://prometheus:9090
```

---

## 📱 PWA Installation

### Desktop
1. Visiter https://votre-domaine.com
2. Icône "+" dans barre adresse Chrome
3. Cliquer "Installer iaPosteManager"

### Mobile
1. Ouvrir dans Safari/Chrome
2. Menu (⋮) → "Ajouter à l'écran d'accueil"
3. Nommer: "iaPosteManager"
4. Confirmer

---

## 🎯 CHECKLIST RAPIDE

### Avant Déploiement
- [ ] Tests E2E passent (6/6)
- [ ] Frontend build sans erreur
- [ ] .env.production configuré
- [ ] Domaine DNS pointé vers serveur
- [ ] Serveur accessible SSH

### Après Déploiement
- [ ] Application accessible HTTPS
- [ ] Login fonctionne
- [ ] Email test envoyé
- [ ] Monitoring actif (Grafana)
- [ ] Backup cron configuré
- [ ] SSL grade A (SSL Labs)
- [ ] Firewall actif
- [ ] PWA installable

---

## 🆘 COMMANDES URGENCE

### Rollback Rapide
```bash
# Restaurer dernier backup
./scripts/restore.sh backups/$(ls -t backups/ | head -1)

# Redémarrer
docker-compose -f docker-compose.prod.yml restart
```

### Logs en Temps Réel
```bash
# Application
docker-compose -f docker-compose.prod.yml logs -f backend

# Tous services
docker-compose -f docker-compose.prod.yml logs -f

# Nginx
sudo tail -f /var/log/nginx/error.log
```

### Redémarrage Complet
```bash
# Arrêter tout
docker-compose -f docker-compose.prod.yml down
docker-compose -f monitoring/docker-compose.monitoring.yml down

# Nettoyer
docker system prune -af

# Redémarrer
docker-compose -f docker-compose.prod.yml up -d
docker-compose -f monitoring/docker-compose.monitoring.yml up -d
```

---

## 📞 RESSOURCES

### Documentation
- 📘 `GUIDE_PRODUCTION_COMPLET.md` - Guide détaillé 800 lignes
- 📋 `CHECKLIST_PRODUCTION.md` - Checklist déploiement 13 phases
- 📊 `INFRASTRUCTURE_RESUME.md` - Vue d'ensemble

### Scripts
- 🚀 `DEMARRER_INFRASTRUCTURE.bat` - Menu interactif Windows
- 🔐 `ssl/setup-ssl.sh` - SSL automatique
- 🧪 `tests/*.sh` - Tests API/charge/sécurité
- 💾 `scripts/backup.sh` - Backup auto
- 🛡️ `security/*.sh` - WAF + Fail2Ban

### URLs Utiles
- Application: http://localhost:5000
- Prometheus: http://localhost:9090
- Grafana: http://localhost:3000
- SSL Labs: https://www.ssllabs.com/ssltest/
- PageSpeed: https://pagespeed.web.dev/

---

## ✅ VALIDATION FINALE

```bash
# Test complet
curl -I https://votre-domaine.com
curl https://votre-domaine.com/api/health
curl http://localhost:9090/api/v1/targets

# Tests avancés
bash tests/test-api.sh https://votre-domaine.com
bash tests/load-test.sh 10 60 https://votre-domaine.com
bash tests/security-audit.sh https://votre-domaine.com
```

**Si tous les tests passent : VOUS ÊTES EN PRODUCTION ! 🎉**

---

*Guide rapide iaPosteManager v3.5*  
*Dernière mise à jour: 15 décembre 2025*
