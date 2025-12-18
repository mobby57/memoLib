# 🚀 GUIDE DE DÉPLOIEMENT - iaPosteManager

## ✅ Étape 1: Vérifier Workflow GitHub Actions

### 🔗 Accéder au workflow
**URL:** https://github.com/mobby57/iapm.com/actions

### 📋 Checklist de vérification

- [ ] **Tests pytest** : 68 tests collectés, au moins 35 passed
- [ ] **Build Docker** : Image construite sans erreur
- [ ] **Push Docker Hub** : Image `mooby865/iapostemanager:latest` disponible
- [ ] **Pas d'erreur d'import** : `EmailValidator` et `Validator` importés correctement

### ✅ Si tout est vert
Passez à l'étape 2 - Votre pipeline CI/CD fonctionne !

### ❌ Si erreurs
Consultez les logs et partagez les erreurs pour diagnostic.

---

## 🌐 Étape 2: Configurer Domaine + SSL

### Prérequis
- Un serveur Linux (Ubuntu/Debian recommandé)
- Un nom de domaine (ex: iapostemanager.com)
- Accès SSH root au serveur

### 2.1 - Pointer le domaine vers votre serveur

**Chez votre registrar (Namecheap, GoDaddy, OVH, etc.):**

```dns
# Ajouter ces enregistrements DNS:
Type: A
Host: @
Value: [IP_DE_VOTRE_SERVEUR]
TTL: 3600

Type: A
Host: www
Value: [IP_DE_VOTRE_SERVEUR]
TTL: 3600
```

**Attendre la propagation DNS (5-60 minutes)**

Vérifier avec:
```powershell
nslookup votre-domaine.com
```

### 2.2 - Installer SSL avec Let's Encrypt

**Sur votre serveur Linux:**

```bash
# 1. Se connecter au serveur
ssh user@votre-serveur.com

# 2. Uploader le script SSL
scp ssl/setup-ssl.sh user@votre-serveur.com:~/

# 3. Exécuter le script
chmod +x setup-ssl.sh
sudo ./setup-ssl.sh votre-domaine.com

# Le script va automatiquement:
# ✅ Installer certbot
# ✅ Générer le certificat SSL
# ✅ Configurer Nginx avec HTTPS
# ✅ Configurer le renouvellement auto (cron)
# ✅ Ouvrir les ports 80/443
```

### 2.3 - Vérifier SSL

```bash
# Test certificat
curl -I https://votre-domaine.com

# Score SSL Labs (objectif: A+)
# Aller sur: https://www.ssllabs.com/ssltest/
# Tester: votre-domaine.com
```

**✅ Succès:** Votre site est accessible en HTTPS !

---

## 📊 Étape 3: Activer Monitoring Grafana

### 3.1 - Démarrer la stack monitoring

```bash
# Sur votre serveur de production
cd /chemin/vers/iaPostemanage

# Démarrer Prometheus + Grafana
docker-compose -f monitoring/docker-compose.monitoring.yml up -d

# Vérifier que tout tourne
docker-compose -f monitoring/docker-compose.monitoring.yml ps
```

**Services démarrés:**
- 📈 Prometheus: http://votre-domaine.com:9090
- 📊 Grafana: http://votre-domaine.com:3000
- 🔔 Alertmanager: http://votre-domaine.com:9093

### 3.2 - Configurer Grafana

**1. Première connexion**
```
URL: http://votre-domaine.com:3000
Login: admin
Password: [voir GRAFANA_ADMIN_PASSWORD dans .env]
```

**2. Ajouter Prometheus comme source de données**
- Configuration (⚙️) → Data Sources
- Add data source → Prometheus
- URL: `http://prometheus:9090`
- Save & Test ✅

**3. Importer les dashboards**

**Dashboard 1: Node Exporter (Système)**
- Dashboards (📊) → Import
- ID: `1860`
- Select Prometheus → Import

**Dashboard 2: Docker Containers**
- Dashboards (📊) → Import
- ID: `893`
- Select Prometheus → Import

**Dashboard 3: Application Metrics**
- Dashboards (📊) → Import
- Charger: `monitoring/dashboards/app-metrics.json`

### 3.3 - Configurer les alertes

**Email notifications:**
```bash
# Éditer le fichier de config
nano monitoring/alertmanager/alertmanager.yml

# Ajouter votre email:
receivers:
  - name: 'email-alerts'
    email_configs:
      - to: 'votre-email@example.com'
        from: 'alertmanager@iapostemanager.com'
        smarthost: 'smtp.gmail.com:587'
        auth_username: 'votre-email@gmail.com'
        auth_password: 'votre-app-password'

# Redémarrer Alertmanager
docker-compose -f monitoring/docker-compose.monitoring.yml restart alertmanager
```

**Alertes configurées:**
- ⚠️ CPU > 80% pendant 5 min
- ⚠️ Mémoire > 80% pendant 5 min
- ⚠️ Taux d'erreur HTTP > 5%
- ⚠️ Application down

**✅ Succès:** Vous avez un monitoring complet !

---

## 📧 Étape 4: Configurer Email Provisioning Cloud

### Option A: SendGrid (Recommandé pour démarrer)

**4.1 - Créer compte SendGrid**
```
1. Aller sur: https://sendgrid.com/
2. Sign Up (gratuit: 100 emails/jour)
3. Vérifier votre email
```

**4.2 - Générer clé API**
```
1. Settings → API Keys
2. Create API Key
3. Nom: "iaPosteManager Production"
4. Permissions: Full Access → Mail Send
5. Copier la clé (commence par SG.)
```

**4.3 - Vérifier votre domaine**
```
1. Settings → Sender Authentication
2. Domain Authentication
3. Ajouter: iapostemanager.com (ou votre domaine)
4. Suivre les instructions DNS
5. Vérifier (✅ Verified)
```

**4.4 - Configurer l'application**

Créer le fichier `email-provisioning.env`:
```bash
# Provider principal
EMAIL_PROVIDER=sendgrid
EMAIL_DOMAIN=iapostemanager.com

# SendGrid
SENDGRID_API_KEY=SG.votre_cle_api_ici
SENDGRID_SENDER_EMAIL=noreply@iapostemanager.com
SENDGRID_SENDER_NAME=iaPosteManager
```

**4.5 - Tester la configuration**

```powershell
# Windows PowerShell
$body = @{username='contact'} | ConvertTo-Json
Invoke-RestMethod -Uri 'https://votre-domaine.com/api/email/check-availability' -Method POST -ContentType 'application/json' -Body $body
```

```bash
# Linux/Mac
curl -X POST https://votre-domaine.com/api/email/check-availability \
  -H "Content-Type: application/json" \
  -d '{"username":"contact"}'
```

**✅ Réponse attendue:**
```json
{
  "available": true,
  "email": "contact@iapostemanager.com",
  "suggestions": ["contact1", "contact-support"]
}
```

### Option B: AWS SES (Production haute capacité)

**Si vous prévoyez > 100 emails/jour**

```bash
# 1. Console AWS → SES
# 2. Verify domain: iapostemanager.com
# 3. Create SMTP credentials
# 4. Request production access (sortir du sandbox)

# Configuration:
EMAIL_PROVIDER=aws_ses
AWS_ACCESS_KEY_ID=AKIAXXXXXXXXXX
AWS_SECRET_ACCESS_KEY=xxxxxxxxxx
AWS_REGION=eu-west-1
AWS_SES_SENDER_EMAIL=noreply@iapostemanager.com
```

**Limites:**
- Sandbox: 200 emails/jour
- Production: jusqu'à 62,000 emails/mois gratuits
- Coût: $0.10 / 1000 emails

**✅ Succès:** Provisioning d'emails opérationnel !

---

## 🚀 Étape 5: Déployer sur Serveur Production

### 5.1 - Préparer le serveur

**Connexion SSH:**
```bash
ssh user@votre-serveur.com
```

**Installation Docker:**
```bash
# Ubuntu/Debian
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Ajouter utilisateur au groupe docker
sudo usermod -aG docker $USER

# Installer Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Vérifier
docker --version
docker-compose --version
```

**Créer utilisateur de déploiement:**
```bash
# Créer utilisateur 'deploy'
sudo adduser deploy
sudo usermod -aG docker deploy
sudo usermod -aG sudo deploy
```

### 5.2 - Configurer clés SSH pour GitHub Actions

**Sur votre machine locale (Windows PowerShell):**

```powershell
# 1. Générer paire de clés SSH
ssh-keygen -t ed25519 -C "github-actions-deploy" -f $env:USERPROFILE\.ssh\github_deploy

# 2. Afficher la clé PUBLIQUE
Get-Content "$env:USERPROFILE\.ssh\github_deploy.pub"
# Copier cette clé
```

**Sur le serveur de production:**
```bash
# Se connecter en tant que deploy
su - deploy

# Ajouter la clé publique
mkdir -p ~/.ssh
nano ~/.ssh/authorized_keys
# Coller la clé publique copiée
# Sauvegarder: Ctrl+X, Y, Enter

# Permissions
chmod 700 ~/.ssh
chmod 600 ~/.ssh/authorized_keys
```

**Tester la connexion:**
```powershell
# Sur votre machine locale
ssh -i $env:USERPROFILE\.ssh\github_deploy deploy@votre-serveur.com
```

### 5.3 - Ajouter les secrets GitHub

**Aller sur GitHub:**
```
https://github.com/mobby57/iapm.com/settings/secrets/actions
```

**Ajouter ces secrets:**

**1. SSH_PRIVATE_KEY**
```powershell
# Afficher la clé PRIVÉE (tout le contenu)
Get-Content "$env:USERPROFILE\.ssh\github_deploy"
# Copier depuis -----BEGIN jusqu'à -----END inclus
```
→ GitHub Secret: `SSH_PRIVATE_KEY`

**2. PRODUCTION_HOST**
```
Valeur: votre-serveur.com (ou IP: 123.45.67.89)
```
→ GitHub Secret: `PRODUCTION_HOST`

**3. PRODUCTION_USER**
```
Valeur: deploy
```
→ GitHub Secret: `PRODUCTION_USER`

**4. SLACK_WEBHOOK_URL (optionnel)**
```
Pour les notifications de déploiement
Valeur: https://hooks.slack.com/services/...
```

### 5.4 - Premier déploiement

**Option 1: Via GitHub Actions (Automatique)**
```
1. Push un commit sur main
2. GitHub Actions va automatiquement:
   ✅ Tester l'application
   ✅ Builder l'image Docker
   ✅ Pusher sur Docker Hub
   ✅ Déployer sur le serveur
   ✅ Vérifier la santé
```

**Option 2: Déploiement manuel**

**Sur le serveur:**
```bash
# Se connecter
ssh deploy@votre-serveur.com

# Cloner le repo
git clone https://github.com/mobby57/iapm.com.git
cd iapm.com

# Créer .env.production
nano .env.production
# Ajouter vos variables d'environnement
# Sauvegarder

# Déployer
docker-compose -f docker-compose.prod.yml up -d --build

# Vérifier
docker-compose ps
curl http://localhost:5000/api/health
```

### 5.5 - Vérification finale

**Tests de santé:**
```bash
# API Health
curl https://votre-domaine.com/api/health

# Test email provisioning
curl -X POST https://votre-domaine.com/api/email/check-availability \
  -H "Content-Type: application/json" \
  -d '{"username":"test"}'

# Vérifier logs
docker-compose logs -f backend
```

**Vérifier SSL:**
```bash
curl -I https://votre-domaine.com
# Doit retourner: HTTP/2 200
```

**Monitoring:**
```
Grafana: https://votre-domaine.com:3000
Prometheus: https://votre-domaine.com:9090
```

**✅ Succès:** Votre application est en production !

---

## 🎉 FÉLICITATIONS !

Votre infrastructure iaPosteManager est maintenant:

✅ **Déployée** en production avec Docker  
✅ **Sécurisée** avec SSL/HTTPS Let's Encrypt  
✅ **Monitorée** avec Prometheus/Grafana  
✅ **Automatisée** avec CI/CD GitHub Actions  
✅ **Email provisioning** opérationnel (SendGrid/AWS SES)  
✅ **Prête** pour les utilisateurs ! 🚀

---

## 📞 Support et Maintenance

### Commandes utiles

**Logs:**
```bash
# Logs application
docker-compose logs -f backend

# Logs Nginx
sudo tail -f /var/log/nginx/access.log

# Logs système
journalctl -u docker -f
```

**Redémarrage:**
```bash
# Redémarrer application
docker-compose restart

# Redémarrer tout
docker-compose down && docker-compose -f docker-compose.prod.yml up -d
```

**Backup:**
```bash
# Backup manuel
./scripts/backup.sh

# Restaurer backup
./scripts/restore.sh backups/backup-2025-12-18.tar.gz
```

**Mise à jour:**
```bash
# Pull nouveau code
git pull origin main

# Rebuild et redéployer
docker-compose -f docker-compose.prod.yml up -d --build

# Vérifier santé
curl http://localhost:5000/api/health
```

### Checklist de maintenance

**Quotidien:**
- [ ] Vérifier santé app: `curl https://votre-domaine.com/api/health`
- [ ] Vérifier dashboards Grafana

**Hebdomadaire:**
- [ ] Vérifier logs erreurs
- [ ] Nettoyer images Docker: `docker system prune -f`
- [ ] Vérifier backups

**Mensuel:**
- [ ] Audit sécurité
- [ ] Mettre à jour dépendances
- [ ] Tester restauration backup
- [ ] Vérifier certificat SSL

---

## 🔗 Liens Utiles

- **GitHub Repo:** https://github.com/mobby57/iapm.com
- **GitHub Actions:** https://github.com/mobby57/iapm.com/actions
- **Docker Hub:** https://hub.docker.com/r/mooby865/iapostemanager
- **Documentation:** `GUIDE_PRODUCTION_COMPLET.md`

---

*Document créé le 18 décembre 2025*  
*Version: 1.0*  
*iaPosteManager - Guide de Déploiement*
