# 🔐 Configuration des Secrets GitHub Actions

**Date:** 18 décembre 2025  
**Repository:** https://github.com/mobby57/iapm.com

---

## ✅ État Actuel du Workflow

Le pipeline CI/CD est **configuré et fonctionnel** pour:
- ✅ Tests frontend (Node.js 18)
- ✅ Tests backend (Python 3.11) avec SECRET_KEY
- ✅ Tests E2E (Playwright)
- ✅ Scan de sécurité (Bandit/Safety - non bloquant)
- ✅ Build Docker (image: mooby865/iapostemanager)

**Lien Actions:** https://github.com/mobby57/iapm.com/actions

---

## 🎯 Secrets à Configurer pour Production

### Comment ajouter un secret:
1. Aller sur: https://github.com/mobby57/iapm.com/settings/secrets/actions
2. Cliquer sur **"New repository secret"**
3. Entrer le **Name** et le **Secret**
4. Cliquer sur **"Add secret"**

---

## 📋 Liste des Secrets Requis

### 1️⃣ DOCKER_USERNAME ✅ (Déjà configuré)
```
Name: DOCKER_USERNAME
Value: mooby865
```
**Status:** ✅ Configuré  
**Usage:** Connexion à Docker Hub pour push d'images

---

### 2️⃣ DOCKER_PASSWORD ⚠️ (À configurer)
```
Name: DOCKER_PASSWORD
Value: <votre-docker-access-token>
```

**Comment obtenir:**
1. Se connecter sur https://hub.docker.com
2. Account Settings → Security → Access Tokens
3. "New Access Token"
4. Description: `GitHub Actions CI/CD`
5. Permissions: `Read, Write, Delete`
6. Copier le token (commence par `dckr_pat_...`)

**Status:** ⚠️ **À CONFIGURER**  
**Priorité:** 🔴 HAUTE (requis pour Docker push)

---

### 3️⃣ SSH_PRIVATE_KEY ⚠️ (À configurer)
```
Name: SSH_PRIVATE_KEY
Value: <contenu-complet-de-la-clé-privée>
```

**Comment obtenir:**

**Windows PowerShell:**
```powershell
# 1. Générer paire de clés
ssh-keygen -t ed25519 -C "github-actions-deploy" -f $env:USERPROFILE\.ssh\github_deploy

# 2. Afficher la clé PUBLIQUE (à copier sur le serveur)
Get-Content "$env:USERPROFILE\.ssh\github_deploy.pub"

# 3. Copier la clé publique sur le serveur
ssh user@votre-serveur.com "mkdir -p ~/.ssh && echo 'VOTRE_CLÉ_PUBLIQUE' >> ~/.ssh/authorized_keys"

# 4. Afficher la clé PRIVÉE (à copier dans GitHub Secret)
Get-Content "$env:USERPROFILE\.ssh\github_deploy"
```

**Linux/Mac:**
```bash
# 1. Générer paire de clés
ssh-keygen -t ed25519 -C "github-actions-deploy" -f ~/.ssh/github_deploy

# 2. Copier la clé publique sur le serveur
ssh-copy-id -i ~/.ssh/github_deploy.pub user@votre-serveur.com

# 3. Afficher la clé PRIVÉE (à copier dans GitHub Secret)
cat ~/.ssh/github_deploy
```

**⚠️ Important:** Copier **TOUTE** la clé privée, depuis `-----BEGIN` jusqu'à `-----END` inclus.

**Status:** ⚠️ **À CONFIGURER**  
**Priorité:** 🔴 HAUTE (requis pour déploiement SSH)

---

### 4️⃣ PROD_SERVER_HOST ⚠️ (À configurer)
```
Name: PROD_SERVER_HOST
Value: <ip-ou-domaine-serveur>
```

**Exemples:**
- IP: `123.45.67.89`
- Domaine: `iapostemanager.com`
- Sous-domaine: `app.iapostemanager.com`

**Comment tester:**
```bash
# Tester la connexion
ping votre-serveur.com
# ou
ssh user@votre-serveur.com
```

**Status:** ⚠️ **À CONFIGURER**  
**Priorité:** 🔴 HAUTE (requis pour déploiement)

---

### 5️⃣ PROD_SERVER_USER ⚠️ (À configurer)
```
Name: PROD_SERVER_USER
Value: <utilisateur-ssh>
```

**Recommandation:** Créer un utilisateur dédié pour le déploiement

**Sur le serveur:**
```bash
# Créer utilisateur 'deploy'
sudo adduser deploy

# Ajouter au groupe docker
sudo usermod -aG docker deploy

# Tester connexion
ssh deploy@votre-serveur.com
```

**Exemples de valeurs:**
- `deploy` (recommandé)
- `ubuntu`
- `root` (non recommandé)

**Status:** ⚠️ **À CONFIGURER**  
**Priorité:** 🔴 HAUTE (requis pour déploiement)

---

### 6️⃣ SLACK_WEBHOOK_URL (Optionnel)
```
Name: SLACK_WEBHOOK_URL
Value: https://hooks.slack.com/services/...
```

**Comment obtenir:**
1. Aller sur https://api.slack.com/apps
2. "Create New App" → "From scratch"
3. Nom: `iaPosteManager CI/CD`
4. Sélectionner votre workspace
5. "Incoming Webhooks" → "Activate"
6. "Add New Webhook to Workspace"
7. Choisir le canal (ex: `#deployments`)
8. Copier l'URL du webhook

**Status:** ⚙️ OPTIONNEL  
**Priorité:** 🟡 BASSE (notifications Slack)

---

## 🚀 Workflow de Déploiement

Une fois **tous les secrets configurés**, le workflow suivant s'exécutera automatiquement:

```
Push sur main/develop
    ↓
✅ Frontend Tests (npm ci, build)
    ↓
✅ Backend Tests (pytest avec coverage)
    ↓
✅ E2E Tests (Playwright)
    ↓
⚠️  Security Scan (non bloquant)
    ↓
✅ Docker Build
    ↓
📦 Docker Push → mooby865/iapostemanager:latest
    ↓
🚀 SSH Deploy → Serveur de production
    ↓
✅ Health Check
    ↓
📢 Notification (Slack si configuré)
```

---

## ✅ Checklist de Configuration

### Avant le premier déploiement:

- [ ] **DOCKER_PASSWORD** configuré dans GitHub Secrets
- [ ] **SSH_PRIVATE_KEY** générée et configurée
- [ ] Clé SSH publique copiée sur le serveur de production
- [ ] **PROD_SERVER_HOST** configuré (IP ou domaine)
- [ ] **PROD_SERVER_USER** configuré et a les droits Docker
- [ ] Serveur de production accessible via SSH
- [ ] Docker installé sur le serveur de production
- [ ] Port 22 (SSH) ouvert sur le serveur
- [ ] Ports 80/443 (HTTP/HTTPS) ouverts sur le serveur
- [ ] (Optionnel) Slack Webhook configuré

### Sur le serveur de production:

```bash
# Vérifier Docker
docker --version

# Vérifier docker-compose
docker-compose --version

# Créer dossier app
sudo mkdir -p /opt/iapostemanager
sudo chown deploy:deploy /opt/iapostemanager

# Tester connexion Docker Hub
docker login -u mooby865
```

---

## 🧪 Tester le Workflow

### 1. Configuration minimale (sans déploiement)
Les tests et le build fonctionneront **sans** les secrets de déploiement:
- ✅ Frontend tests
- ✅ Backend tests  
- ✅ Security scan
- ✅ Docker build
- ⏭️ Deploy (skip si secrets manquants)

### 2. Configuration complète (avec déploiement)
Une fois **tous les secrets configurés**, chaque push sur `main` déclenchera:
- Tous les tests ci-dessus
- ✅ Docker push vers Docker Hub
- ✅ Déploiement SSH sur le serveur
- ✅ Redémarrage de l'application
- ✅ Health check

### 3. Test manuel du workflow:
1. Aller sur: https://github.com/mobby57/iapm.com/actions
2. Sélectionner "CI/CD Pipeline - iaPosteManager"
3. Cliquer sur "Run workflow"
4. Sélectionner la branche `main`
5. Cliquer sur "Run workflow"

---

## 🔍 Vérification du Déploiement

### Après un déploiement réussi:

**1. Vérifier l'application:**
```bash
# Via navigateur
https://votre-domaine.com

# Via curl
curl https://votre-domaine.com/api/health
```

**2. Vérifier les containers Docker:**
```bash
# Sur le serveur
ssh deploy@votre-serveur.com
docker ps
docker-compose -f /opt/iapostemanager/docker-compose.prod.yml ps
```

**3. Vérifier les logs:**
```bash
# Logs application
docker-compose -f /opt/iapostemanager/docker-compose.prod.yml logs -f backend

# Logs GitHub Actions
# Aller sur: https://github.com/mobby57/iapm.com/actions
```

---

## 🆘 Troubleshooting

### Erreur: "Permission denied (publickey)"
- ✅ Vérifier que la clé SSH publique est sur le serveur
- ✅ Vérifier les permissions: `chmod 700 ~/.ssh && chmod 600 ~/.ssh/authorized_keys`

### Erreur: "Docker login failed"
- ✅ Vérifier DOCKER_USERNAME (doit être: mooby865)
- ✅ Vérifier DOCKER_PASSWORD (token valide)
- ✅ Regénérer un token si nécessaire

### Erreur: "Connection refused"
- ✅ Vérifier PROD_SERVER_HOST (IP/domaine correct)
- ✅ Vérifier que le port 22 est ouvert
- ✅ Vérifier firewall du serveur

### Le workflow passe mais pas de déploiement:
- ✅ Vérifier que la branche est `main`
- ✅ Vérifier que tous les secrets sont configurés
- ✅ Vérifier les logs du job "deploy-production"

---

## 📚 Documentation Complémentaire

- **Guide de production:** `GUIDE_PRODUCTION_COMPLET.md`
- **Étapes de déploiement:** `DEPLOYMENT_STEPS.md`
- **Configuration SSH:** Section 4 du GUIDE_PRODUCTION_COMPLET.md
- **GitHub Actions:** https://docs.github.com/en/actions

---

## 🎯 Résumé des Priorités

| Secret | Priorité | Status | Requis pour |
|--------|----------|--------|-------------|
| DOCKER_USERNAME | ✅ CONFIGURÉ | ✅ OK | Push Docker Hub |
| DOCKER_PASSWORD | 🔴 HAUTE | ⚠️ TODO | Push Docker Hub |
| SSH_PRIVATE_KEY | 🔴 HAUTE | ⚠️ TODO | Déploiement SSH |
| PROD_SERVER_HOST | 🔴 HAUTE | ⚠️ TODO | Déploiement SSH |
| PROD_SERVER_USER | 🔴 HAUTE | ⚠️ TODO | Déploiement SSH |
| SLACK_WEBHOOK_URL | 🟡 BASSE | ⚙️ OPTIONNEL | Notifications |

---

**🎉 Une fois configuré, votre pipeline CI/CD sera 100% automatique!**

Chaque `git push` sur `main` déploiera automatiquement en production après validation des tests.

---

*Document généré le 18 décembre 2025*  
*iaPosteManager - Pipeline CI/CD automatisé*
