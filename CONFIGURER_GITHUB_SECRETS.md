# 🔐 GUIDE - CONFIGURER GITHUB SECRETS

## ✅ Étape complétée: Docker Login réussi!

Vous êtes maintenant prêt à configurer le CI/CD automatique.

---

## 📋 Configuration GitHub Secrets (3 étapes simples)

### 🌐 ÉTAPE 1: Ouvrir la page GitHub Secrets

**1. Cliquer sur ce lien:**
```
https://github.com/mooby865/iapostemanager/settings/secrets/actions
```

**2. Vous devriez voir:**
- "Actions secrets and variables"
- Bouton vert "New repository secret"

---

### 🔑 ÉTAPE 2: Ajouter les secrets OBLIGATOIRES

#### Secret #1: DOCKER_USERNAME

**Cliquer:** "New repository secret"

```
Name:    DOCKER_USERNAME
Secret:  mooby865
```

**Cliquer:** "Add secret"

---

#### Secret #2: DOCKER_PASSWORD

**1. Obtenir votre token Docker Hub:**
- Aller sur: https://hub.docker.com/settings/security
- Cliquer: "New Access Token"
- Description: "GitHub Actions iaPosteManager"
- Access permissions: "Read, Write, Delete"
- Cliquer: "Generate"
- **COPIER** le token (commence par `dckr_pat_...`)
- ⚠️ Vous ne pourrez plus le revoir après!

**2. Ajouter dans GitHub:**

Cliquer: "New repository secret"

```
Name:    DOCKER_PASSWORD
Secret:  [Coller votre token Docker Hub ici]
```

**Cliquer:** "Add secret"

---

#### Secret #3: SSH_PRIVATE_KEY

**1. Afficher votre clé privée:**

```powershell
Get-Content "$env:USERPROFILE\.ssh\github_deploy"
```

**2. Copier TOUT le contenu** (de `-----BEGIN` jusqu'à `-----END` inclus)

**Votre clé privée:**
```
-----BEGIN OPENSSH PRIVATE KEY-----
b3BlbnNzaC1rZXktdjEAAAAABG5vbmUAAAAEbm9uZQAAAAAAAAABAAAAMwAAAAtzc2gtZW
QyNTUxOQAAACAIUAz8x1T9Ds+HtAinJNUbZ7epD+gKRTV3e+XC8YZd4QAAAJipp40dqaeN
HQAAAAtzc2gtZWQyNTUxOQAAACAIUAz8x1T9Ds+HtAinJNUbZ7epD+gKRTV3e+XC8YZd4Q
AAAEDapaSf55AJkEwniV1XYYJqq5hufvh00d2+EXX2xwgYQghQDPzHVP0Oz4e0CKck1Rtn
t6kP6ApFNXd75cLxhl3hAAAAFWdpdGh1Yi1hY3Rpb25zLWRlcGxveQ==
-----END OPENSSH PRIVATE KEY-----
```

**3. Ajouter dans GitHub:**

Cliquer: "New repository secret"

```
Name:    SSH_PRIVATE_KEY
Secret:  [Coller TOUTE la clé privée ici]
```

**Cliquer:** "Add secret"

---

### 🎯 ÉTAPE 3: Secrets OPTIONNELS (pour déploiement sur serveur)

**⚠️ Si vous N'AVEZ PAS de serveur: SAUTEZ cette étape**

#### Secret #4: PRODUCTION_HOST (optionnel)

**Uniquement si vous avez un serveur de production**

```
Name:    PRODUCTION_HOST
Secret:  [Votre IP ou domaine]

Exemples:
- 123.45.67.89
- monserveur.example.com
- iapostemanager.fr
```

---

#### Secret #5: PRODUCTION_USER (optionnel)

**Uniquement si vous avez un serveur de production**

```
Name:    PRODUCTION_USER
Secret:  [Votre utilisateur SSH]

Exemples:
- ubuntu
- deploy
- root
- www-data
```

---

#### Secret #6: SLACK_WEBHOOK_URL (optionnel)

**Uniquement si vous voulez des notifications Slack**

**1. Obtenir webhook Slack:**
- Aller sur: https://api.slack.com/apps
- Create New App → From scratch
- Nom: "iaPosteManager CI/CD"
- Workspace: [choisir votre workspace]
- Incoming Webhooks → Activate
- Add New Webhook to Workspace
- Choisir canal (ex: #deployments)
- Copier l'URL (commence par `https://hooks.slack.com/...`)

**2. Ajouter dans GitHub:**

```
Name:    SLACK_WEBHOOK_URL
Secret:  [Votre URL webhook Slack]
```

---

## ✅ VÉRIFICATION - Secrets configurés

**Minimum requis (3 secrets):**
- ✅ DOCKER_USERNAME = mooby865
- ✅ DOCKER_PASSWORD = dckr_pat_...
- ✅ SSH_PRIVATE_KEY = -----BEGIN OPENSSH...

**Avec ces 3 secrets, le CI/CD peut:**
- ✅ Build l'image Docker
- ✅ Push sur Docker Hub
- ✅ Lancer les tests automatiques

**Optionnel (si serveur):**
- 🟡 PRODUCTION_HOST = votre-serveur
- 🟡 PRODUCTION_USER = ubuntu
- 🟡 SLACK_WEBHOOK_URL = https://hooks.slack.com/...

**Avec tous les secrets, le CI/CD peut aussi:**
- ✅ Déployer automatiquement sur votre serveur
- ✅ Envoyer notifications Slack

---

## 🚀 Tester le CI/CD

### Test automatique (push sur main)

```powershell
# Faire un commit et push
git add .
git commit -m "✨ Configuration CI/CD avec GitHub Secrets"
git push origin main
```

**Vérifier le déploiement:**
1. Aller sur: https://github.com/mooby865/iapostemanager/actions
2. Vous devriez voir le workflow "CI/CD Pipeline" en cours
3. Cliquer dessus pour voir les étapes en détail

**Étapes du workflow:**
1. ✅ Checkout code
2. ✅ Setup Python
3. ✅ Install dependencies
4. ✅ Run tests
5. ✅ Docker login
6. ✅ Build Docker image
7. ✅ Push to Docker Hub
8. 🟡 Deploy to production (si serveur configuré)
9. 🟡 Health check (si serveur configuré)
10. 🟡 Slack notification (si configuré)

---

### Test manuel (sans commit)

```powershell
# Via interface GitHub
```

1. Aller sur: https://github.com/mooby865/iapostemanager/actions
2. Cliquer: "CI/CD Pipeline"
3. Bouton "Run workflow" (à droite)
4. Branch: main
5. Cliquer: "Run workflow"

---

## 🎉 Que se passe-t-il après?

### À chaque push sur main ou develop:

**1. Tests automatiques (2-3 minutes)**
- Installation dépendances Python
- Exécution tests unitaires
- Vérification code quality

**2. Build Docker (3-5 minutes)**
- Construction image Docker
- Optimisation layers
- Tag: `mooby865/iapostemanager:latest`

**3. Push Docker Hub (1-2 minutes)**
- Upload sur Docker Hub
- Image disponible publiquement
- Accessible via: `docker pull mooby865/iapostemanager:latest`

**4. Déploiement (si serveur configuré) (2-3 minutes)**
- Connexion SSH au serveur
- Pull nouvelle image
- Redémarrage containers
- Health check

**Total:** 8-13 minutes par déploiement

---

## 🔍 Vérifier que ça marche

### Vérifier secrets dans GitHub

**1. Aller sur:**
```
https://github.com/mooby865/iapostemanager/settings/secrets/actions
```

**2. Vous devriez voir:**
```
DOCKER_USERNAME          Updated X minutes ago
DOCKER_PASSWORD          Updated X minutes ago
SSH_PRIVATE_KEY          Updated X minutes ago
PRODUCTION_HOST          Updated X minutes ago (optionnel)
PRODUCTION_USER          Updated X minutes ago (optionnel)
SLACK_WEBHOOK_URL        Updated X minutes ago (optionnel)
```

**3. Les valeurs sont cachées (normal)**
- Vous ne pouvez pas voir les valeurs
- Vous pouvez seulement les modifier ou supprimer

---

### Vérifier workflow GitHub Actions

**1. Aller sur:**
```
https://github.com/mooby865/iapostemanager/actions
```

**2. Si workflow existe:**
- ✅ ".github/workflows/ci-cd.yml" est détecté
- ✅ Prêt à être déclenché

**3. Si pas de workflows:**
- ❌ Vérifier que `.github/workflows/ci-cd.yml` existe dans le repo
- ❌ Faire un commit si le fichier manque

---

### Vérifier image Docker Hub

**Après premier déploiement, aller sur:**
```
https://hub.docker.com/r/mooby865/iapostemanager
```

**Vous devriez voir:**
- ✅ Repository public "iapostemanager"
- ✅ Tag "latest" avec date récente
- ✅ Taille de l'image (~500MB)
- ✅ Pulls count

---

## 🚨 Dépannage

### Erreur: "Docker login failed"

**Cause:** Token Docker Hub invalide ou expiré

**Solution:**
```powershell
# 1. Générer nouveau token:
# https://hub.docker.com/settings/security

# 2. Mettre à jour secret DOCKER_PASSWORD dans GitHub

# 3. Re-lancer workflow
```

---

### Erreur: "SSH connection refused"

**Cause:** Serveur inaccessible ou secrets mal configurés

**Solution:**
```powershell
# 1. Vérifier secrets GitHub:
# PRODUCTION_HOST = IP correcte?
# PRODUCTION_USER = username correct?
# SSH_PRIVATE_KEY = clé complète?

# 2. Tester connexion SSH localement:
ssh -i $env:USERPROFILE\.ssh\github_deploy ubuntu@VOTRE_IP

# 3. Si ça ne fonctionne pas localement:
# → Relancer CONFIGURE_SSH_SERVER.ps1
```

---

### Erreur: "Tests failed"

**Cause:** Code cassé ou dépendances manquantes

**Solution:**
```powershell
# 1. Lancer tests localement:
cd src/backend
python -m pytest tests/

# 2. Corriger erreurs

# 3. Commit et push
```

---

### Erreur: "Workflow not found"

**Cause:** Fichier `.github/workflows/ci-cd.yml` manquant

**Solution:**
```powershell
# 1. Vérifier fichier existe:
Get-ChildItem .github/workflows/

# 2. Si manquant, créer le fichier

# 3. Commit et push:
git add .github/
git commit -m "Add CI/CD workflow"
git push origin main
```

---

## 📚 Ressources

**Documentation GitHub Actions:**
- https://docs.github.com/en/actions

**Documentation Docker Hub:**
- https://docs.docker.com/docker-hub/

**Votre repository:**
- https://github.com/mooby865/iapostemanager

**GitHub Actions (workflows):**
- https://github.com/mooby865/iapostemanager/actions

**Docker Hub (images):**
- https://hub.docker.com/r/mooby865/iapostemanager

**Secrets GitHub:**
- https://github.com/mooby865/iapostemanager/settings/secrets/actions

---

## ✅ Checklist complète

**Préparation:**
- [x] Clés SSH générées
- [x] Docker login réussi
- [x] Repository GitHub créé

**Configuration GitHub Secrets (minimum):**
- [ ] DOCKER_USERNAME ajouté
- [ ] DOCKER_PASSWORD ajouté
- [ ] SSH_PRIVATE_KEY ajouté

**Configuration GitHub Secrets (optionnel):**
- [ ] PRODUCTION_HOST ajouté (si serveur)
- [ ] PRODUCTION_USER ajouté (si serveur)
- [ ] SLACK_WEBHOOK_URL ajouté (si notifications)

**Vérification:**
- [ ] Secrets visibles dans GitHub
- [ ] Workflow visible dans Actions
- [ ] Premier déploiement testé
- [ ] Image visible sur Docker Hub

**Résultat final:**
- [ ] Push sur main → Déploiement automatique
- [ ] Tests passent
- [ ] Image Docker buildée
- [ ] Application déployée (si serveur)

---

## 🎯 Prochaines étapes

**Après configuration des secrets:**

1. **Tester le CI/CD:**
   ```powershell
   git add .
   git commit -m "test: CI/CD automatique"
   git push origin main
   ```

2. **Vérifier déploiement:**
   - https://github.com/mooby865/iapostemanager/actions

3. **Vérifier image Docker:**
   - https://hub.docker.com/r/mooby865/iapostemanager

4. **Si serveur configuré, vérifier application:**
   ```powershell
   curl http://VOTRE_SERVEUR/api/health
   ```

**Développement continu:**
- Chaque commit sur `main` déclenche un déploiement
- Les tests doivent passer
- L'image Docker est automatiquement mise à jour
- Le serveur est automatiquement mis à jour (si configuré)

---

**Date:** 17 décembre 2025  
**Configuration:** CI/CD GitHub Actions pour iaPosteManager  
**Status:** ✅ Prêt à être configuré
