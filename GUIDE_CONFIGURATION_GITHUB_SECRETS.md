# 🔐 Guide Configuration GitHub Secrets pour CI/CD

## 🎯 Résolution de l'erreur Git exit code 128

L'erreur `exit code 128` dans GitHub Actions est maintenant **corrigée** avec les modifications suivantes :

### ✅ Corrections appliquées dans `.github/workflows/ci-cd.yml`

1. **Configuration Git sécurisée** ajoutée
2. **Checkout avec fetch-depth: 0** pour historique complet
3. **Version mise à jour** de `appleboy/ssh-action@v1.0.3`
4. **Noms de secrets corrigés** (PRODUCTION_HOST, PRODUCTION_USER, SSH_PRIVATE_KEY)
5. **Script de déploiement robuste** avec gestion des erreurs
6. **Git safe.directory** configuré automatiquement

---

## 📋 Secrets GitHub à configurer

Allez sur votre repository GitHub :
```
https://github.com/mobby57/iapm.com/settings/secrets/actions
```

### 1️⃣ DOCKER_USERNAME

**Valeur :** Votre nom d'utilisateur Docker Hub

```bash
# Pour ce projet
DOCKER_USERNAME=mooby865
```

**Comment l'obtenir :**
1. Créez un compte sur https://hub.docker.com/signup
2. Votre username est affiché en haut à droite après connexion

---

### 2️⃣ DOCKER_PASSWORD

**Valeur :** Access Token Docker Hub (PAS votre mot de passe)

**Comment l'obtenir :**
1. Connectez-vous à Docker Hub
2. Account Settings → Security
3. New Access Token
4. Description : `GitHub Actions CI/CD`
5. Permissions : **Read, Write, Delete**
6. Generate → Copier le token (commence par `dckr_pat_...`)

```bash
# Exemple (générer le vôtre)
DOCKER_PASSWORD=dckr_pat_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

⚠️ **Important :** Le token ne sera visible qu'une fois. Sauvegardez-le immédiatement !

---

### 3️⃣ PRODUCTION_HOST

**Valeur :** Adresse IP ou nom de domaine de votre serveur

#### Cas 1 : Vous avez déjà un serveur

```bash
# Adresse IP publique
PRODUCTION_HOST=51.178.45.123

# OU nom de domaine
PRODUCTION_HOST=monserveur.exemple.com
```

**Comment la trouver :**

**AWS EC2 :**
1. Console EC2 → Instances
2. Sélectionnez votre instance
3. Copiez "Public IPv4 address" ou "Public IPv4 DNS"

**Azure VM :**
1. Portal Azure → Virtual Machines
2. Sélectionnez votre VM
3. Copiez "IP address publique"

**DigitalOcean :**
1. Dashboard → Droplets
2. Copiez "ipv4" affiché sous le nom

**OVH/Contabo :**
1. Panel client → VPS
2. IP principale affichée dans les détails

#### Cas 2 : Vous n'avez pas encore de serveur

**Option recommandée : DigitalOcean** (le plus simple)

```bash
# 1. Créer compte : https://www.digitalocean.com/
# 2. Create → Droplets
# 3. Choisir :
#    - Ubuntu 22.04 LTS
#    - Basic (Regular, 6$/mois)
#    - Datacenter : le plus proche de vous (Frankfurt pour Europe)
#    - Authentication : SSH Keys (recommandé)
# 4. Create Droplet
# 5. Copier l'IP affichée → PRODUCTION_HOST
```

**Option gratuit : AWS EC2 Free Tier**

```bash
# 1. Console AWS : https://aws.amazon.com/ec2/
# 2. Launch Instance
# 3. Choisir :
#    - Ubuntu Server 22.04 LTS
#    - Instance type : t2.micro (Free tier eligible)
#    - Key pair : Créer une nouvelle paire de clés
# 4. Launch instance
# 5. Elastic IP (optionnel) → Allouer adresse IP fixe
# 6. Copier Public IPv4 address → PRODUCTION_HOST
```

**Option Azure :**

```bash
# 1. Portal Azure : https://portal.azure.com/
# 2. Virtual Machines → Create
# 3. Choisir :
#    - Ubuntu Server 22.04 LTS
#    - Size : B1s (crédit gratuit)
#    - Authentication : SSH public key
# 4. Create
# 5. Copier IP publique → PRODUCTION_HOST
```

#### Cas 3 : Test local (sans serveur cloud)

⚠️ **Pour test uniquement** - GitHub Actions ne pourra pas déployer

```bash
PRODUCTION_HOST=localhost
```

Dans ce cas, déployez manuellement :
```powershell
docker-compose -f docker-compose.prod.yml up -d
```

---

### 4️⃣ PRODUCTION_USER

**Valeur :** Nom d'utilisateur SSH sur votre serveur

**Par défaut selon le provider :**

```bash
# AWS EC2
PRODUCTION_USER=ubuntu

# Azure VM
PRODUCTION_USER=azureuser

# DigitalOcean
PRODUCTION_USER=root

# Google Cloud
PRODUCTION_USER=votre-username-google

# OVH/Contabo/Autres
PRODUCTION_USER=root
# ou le username que vous avez créé
```

**Recommandation :** Créez un utilisateur dédié `deploy`

```bash
# Sur votre serveur (via SSH)
sudo adduser deploy
sudo usermod -aG sudo,docker deploy
sudo mkdir -p /home/deploy/.ssh
sudo cp ~/.ssh/authorized_keys /home/deploy/.ssh/
sudo chown -R deploy:deploy /home/deploy/.ssh

# Puis utilisez
PRODUCTION_USER=deploy
```

---

### 5️⃣ SSH_PRIVATE_KEY

**Valeur :** Votre clé SSH privée complète (format PEM)

#### Étape 1 : Générer la paire de clés SSH

**Sur Windows PowerShell :**

```powershell
# Créer le dossier .ssh s'il n'existe pas
New-Item -ItemType Directory -Force -Path "$env:USERPROFILE\.ssh"

# Générer la clé SSH
ssh-keygen -t ed25519 -C "github-actions-deploy-iapostemanager" -f "$env:USERPROFILE\.ssh\github_deploy" -N '""'

# Afficher la clé PUBLIQUE (à copier sur le serveur)
Get-Content "$env:USERPROFILE\.ssh\github_deploy.pub"
```

**Sur Linux/Mac :**

```bash
# Générer la clé SSH
ssh-keygen -t ed25519 -C "github-actions-deploy-iapostemanager" -f ~/.ssh/github_deploy -N ""

# Afficher la clé PUBLIQUE
cat ~/.ssh/github_deploy.pub
```

#### Étape 2 : Copier la clé publique sur le serveur

**Méthode automatique (recommandée) :**

```bash
# Linux/Mac
ssh-copy-id -i ~/.ssh/github_deploy.pub user@votre-serveur.com

# Windows PowerShell
type "$env:USERPROFILE\.ssh\github_deploy.pub" | ssh user@votre-serveur.com "mkdir -p ~/.ssh && cat >> ~/.ssh/authorized_keys"
```

**Méthode manuelle :**

1. Copiez le contenu de `github_deploy.pub`
2. Connectez-vous au serveur : `ssh user@votre-serveur.com`
3. Exécutez :
```bash
mkdir -p ~/.ssh
chmod 700 ~/.ssh
echo "COLLEZ_LA_CLÉ_PUBLIQUE_ICI" >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
```

#### Étape 3 : Copier la clé PRIVÉE pour GitHub

**Windows PowerShell :**

```powershell
# Afficher la clé PRIVÉE complète
Get-Content "$env:USERPROFILE\.ssh\github_deploy"

# Ou copier dans le presse-papier
Get-Content "$env:USERPROFILE\.ssh\github_deploy" | Set-Clipboard
Write-Host "✅ Clé privée copiée dans le presse-papier!"
```

**Linux/Mac :**

```bash
# Afficher la clé PRIVÉE
cat ~/.ssh/github_deploy

# Ou copier dans le presse-papier (Mac)
cat ~/.ssh/github_deploy | pbcopy
echo "✅ Clé privée copiée!"

# Ou copier dans le presse-papier (Linux avec xclip)
cat ~/.ssh/github_deploy | xclip -selection clipboard
echo "✅ Clé privée copiée!"
```

**Format attendu :**

```
-----BEGIN OPENSSH PRIVATE KEY-----
b3BlbnNzaC1rZXktdjEAAAAABG5vbmUAAAAEbm9uZQAAAAAAAAABAAAAMwAAAAtzc2gtZW
QyNTUxOQAAACDxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
AAAAECxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx=
-----END OPENSSH PRIVATE KEY-----
```

⚠️ **Important :** Copiez **TOUT**, depuis `-----BEGIN` jusqu'à `-----END` inclus !

#### Étape 4 : Tester la connexion SSH

```bash
# Tester avec la nouvelle clé
ssh -i ~/.ssh/github_deploy user@votre-serveur.com

# Si ça fonctionne, vous êtes prêt !
```

---

### 6️⃣ SLACK_WEBHOOK_URL (Optionnel)

**Valeur :** URL du webhook Slack pour notifications

**Comment l'obtenir :**

1. Allez sur https://api.slack.com/apps
2. Create New App → From scratch
3. Nom : `iaPosteManager CI/CD Bot`
4. Workspace : Sélectionnez votre workspace
5. Incoming Webhooks → Activate Incoming Webhooks
6. Add New Webhook to Workspace
7. Choisissez le canal (ex: `#deployments` ou `#github`)
8. Authorize
9. Copiez l'URL du webhook

```bash
# Exemple
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXXXXXX
```

---

## 🔧 Ajouter les secrets dans GitHub

### Via l'interface web :

1. Allez sur votre repository : https://github.com/mobby57/iapm.com
2. Settings → Secrets and variables → Actions
3. New repository secret
4. Ajoutez chaque secret un par un :

```
Name: DOCKER_USERNAME
Secret: mooby865

Name: DOCKER_PASSWORD
Secret: dckr_pat_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx

Name: PRODUCTION_HOST
Secret: 51.178.45.123

Name: PRODUCTION_USER
Secret: ubuntu

Name: SSH_PRIVATE_KEY
Secret: [Collez toute la clé privée avec BEGIN et END]

Name: SLACK_WEBHOOK_URL (optionnel)
Secret: https://hooks.slack.com/services/...
```

### Via GitHub CLI (gh) :

```bash
# Installer GitHub CLI : https://cli.github.com/

# Se connecter
gh auth login

# Ajouter les secrets
gh secret set DOCKER_USERNAME -b "mooby865"
gh secret set DOCKER_PASSWORD -b "dckr_pat_xxxxxxxxxxxxx"
gh secret set PRODUCTION_HOST -b "51.178.45.123"
gh secret set PRODUCTION_USER -b "ubuntu"
gh secret set SSH_PRIVATE_KEY < ~/.ssh/github_deploy
gh secret set SLACK_WEBHOOK_URL -b "https://hooks.slack.com/services/..."

# Vérifier
gh secret list
```

---

## ✅ Vérification

### 1. Vérifier les secrets

```bash
# Via GitHub CLI
gh secret list

# Vous devriez voir :
# DOCKER_PASSWORD         Updated 2025-12-19
# DOCKER_USERNAME         Updated 2025-12-19
# PRODUCTION_HOST         Updated 2025-12-19
# PRODUCTION_USER         Updated 2025-12-19
# SSH_PRIVATE_KEY         Updated 2025-12-19
# SLACK_WEBHOOK_URL       Updated 2025-12-19
```

### 2. Tester la connexion SSH manuellement

```bash
ssh -i ~/.ssh/github_deploy $PRODUCTION_USER@$PRODUCTION_HOST "echo 'Connexion SSH OK!'"
```

### 3. Tester le workflow GitHub Actions

```bash
# Faire un commit de test
git add .
git commit -m "test: Trigger CI/CD pipeline"
git push origin main

# Surveiller l'exécution
gh run watch
```

### 4. Vérifier les logs

1. Allez sur https://github.com/mobby57/iapm.com/actions
2. Cliquez sur le dernier workflow run
3. Vérifiez chaque job :
   - ✅ Frontend Tests
   - ✅ Backend Tests
   - ✅ E2E Tests
   - ✅ Docker Build
   - ✅ Deploy Production

---

## 🐛 Dépannage

### Erreur : "Permission denied (publickey)"

```bash
# Solution 1 : Vérifier que la clé publique est bien sur le serveur
ssh user@server "cat ~/.ssh/authorized_keys | grep github-actions"

# Solution 2 : Vérifier les permissions
ssh user@server "chmod 700 ~/.ssh && chmod 600 ~/.ssh/authorized_keys"

# Solution 3 : Vérifier le format de la clé privée
cat ~/.ssh/github_deploy | head -n 1
# Doit afficher : -----BEGIN OPENSSH PRIVATE KEY-----
```

### Erreur : "Host key verification failed"

```bash
# Ajouter l'host key du serveur
ssh-keyscan -H your-server.com >> ~/.ssh/known_hosts
```

### Erreur : "Docker: command not found" sur le serveur

```bash
# Installer Docker sur le serveur
ssh user@server
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER
```

### Erreur : "git: command not found" sur le serveur

```bash
# Installer Git sur le serveur
ssh user@server
sudo apt update && sudo apt install -y git
```

### Erreur : Le workflow reste bloqué sur "Deploy to Production"

```bash
# Vérifier que le serveur est accessible
ping your-server.com

# Vérifier que le port SSH est ouvert
nc -zv your-server.com 22

# Vérifier les logs du workflow
gh run view --log
```

---

## 📝 Checklist complète

Avant de lancer le pipeline, vérifiez :

- [ ] Compte Docker Hub créé
- [ ] Access Token Docker Hub généré
- [ ] Serveur VPS/Cloud provisionné (ou choisi localhost pour test)
- [ ] IP publique du serveur obtenue
- [ ] Paire de clés SSH générée
- [ ] Clé publique SSH copiée sur le serveur
- [ ] Connexion SSH testée manuellement
- [ ] Docker installé sur le serveur
- [ ] Git installé sur le serveur
- [ ] Répertoire `/opt/iapostemanager` créé (ou sera créé automatiquement)
- [ ] Les 5 secrets configurés dans GitHub Actions
- [ ] Workflow `.github/workflows/ci-cd.yml` à jour (avec les corrections)
- [ ] Commit et push pour déclencher le pipeline

---

## 🎯 Commande de test rapide

Une fois tous les secrets configurés, testez le pipeline :

```bash
# Créer un commit de test
echo "# Test CI/CD" >> README.md
git add README.md
git commit -m "test: Trigger CI/CD pipeline with new secrets"
git push origin main

# Surveiller l'exécution
gh run watch

# Ou via le web
start https://github.com/mobby57/iapm.com/actions
```

---

## 🎉 Résultat attendu

Si tout est configuré correctement :

1. ✅ **Frontend Tests** : Build réussit (~2 min)
2. ✅ **Backend Tests** : 68 tests passent (~3 min)
3. ✅ **E2E Tests** : Tests Selenium headless OK (~4 min)
4. ✅ **Docker Build** : Image Docker créée et pushée (~5 min)
5. ✅ **Deploy Production** : Application déployée sur le serveur (~2 min)

**Temps total** : ~15 minutes

**URL de l'application** : http://PRODUCTION_HOST:5000

---

## 📞 Support

- **Issues GitHub :** https://github.com/mobby57/iapm.com/issues
- **Documentation CI/CD :** `.github/workflows/ci-cd.yml`
- **Guide production complet :** `GUIDE_PRODUCTION_COMPLET.md`

---

*Guide créé le 19 décembre 2025*  
*Version 1.0 - Résolution erreur Git exit code 128*  
*iaPosteManager - Déploiement automatisé*
