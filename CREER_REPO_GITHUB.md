# 📦 CRÉER LE REPOSITORY GITHUB

## ❌ Erreur rencontrée

```
fatal: repository 'https://github.com/mooby865/iapostemanager.git/' not found
```

**Cause:** Le repository n'existe pas encore sur GitHub.

---

## ✅ Solution: Créer le repository

### Méthode 1: Interface Web (RECOMMANDÉE)

**1. Ouvrir la page de création:**
```
https://github.com/new
```

**2. Remplir le formulaire:**

| Champ | Valeur |
|-------|--------|
| **Repository name** | `iapostemanager` |
| **Description** | `Gestionnaire d'emails avec IA et provisioning cloud (SendGrid/AWS/MS365/Google)` |
| **Visibility** | Public ✅ (recommandé) ou Private |
| **Initialize this repository with:** | |
| ❌ Add a README file | **NE PAS COCHER** |
| ❌ Add .gitignore | **NE PAS SÉLECTIONNER** |
| ❌ Choose a license | **NE PAS SÉLECTIONNER** |

**3. Cliquer:** "Create repository"

**4. GitHub affichera les commandes - IGNOREZ-LES**

**5. Revenir dans PowerShell et exécuter:**
```powershell
git push -u origin main
```

---

### Méthode 2: GitHub CLI (si installé)

**Vérifier si GitHub CLI est installé:**
```powershell
gh --version
```

**Si installé, créer le repo:**
```powershell
gh repo create iapostemanager --public --source=. --remote=origin --push
```

**Si pas installé, installer GitHub CLI:**
```powershell
# Via winget
winget install GitHub.cli

# Puis authentifier
gh auth login

# Puis créer repo
gh repo create iapostemanager --public --source=. --remote=origin --push
```

---

## 🔧 Commandes complètes (séquence)

### Si repository créé via web:

```powershell
# 1. Vérifier remote configuré
git remote -v

# 2. Devrait afficher:
# origin  https://github.com/mooby865/iapostemanager.git (fetch)
# origin  https://github.com/mooby865/iapostemanager.git (push)

# 3. Push vers GitHub
git push -u origin main
```

### Si remote pas configuré:

```powershell
# 1. Supprimer ancien remote (si existe)
git remote remove origin

# 2. Ajouter nouveau remote
git remote add origin https://github.com/mooby865/iapostemanager.git

# 3. Vérifier
git remote -v

# 4. Push
git push -u origin main
```

---

## 🔐 Authentification GitHub

### Si demande authentification:

**Windows (Credential Manager):**
- Une fenêtre apparaîtra
- Connectez-vous avec votre compte GitHub
- Autoriser Git Credential Manager

**Ou via Personal Access Token:**

**1. Créer token:**
- Aller sur: https://github.com/settings/tokens
- Generate new token (classic)
- Cocher: `repo` (Full control of private repositories)
- Generate token
- **COPIER** le token (commence par `ghp_...`)

**2. Utiliser lors du push:**
```
Username: mooby865
Password: [Coller votre token, PAS votre mot de passe]
```

---

## ✅ Vérification après push

**1. Vérifier sur GitHub:**
```
https://github.com/mooby865/iapostemanager
```

**Vous devriez voir:**
- ✅ Tous vos fichiers
- ✅ README.md
- ✅ Structure du projet
- ✅ Derniers commits

**2. Vérifier workflows:**
```
https://github.com/mooby865/iapostemanager/actions
```

**Vous devriez voir:**
- ✅ "CI/CD Pipeline" workflow détecté
- ✅ Premier workflow en cours (si push déclenché)

**3. Vérifier secrets (si configurés):**
```
https://github.com/mooby865/iapostemanager/settings/secrets/actions
```

---

## 🚀 Après le premier push

### Le workflow CI/CD se déclenchera automatiquement!

**Étapes visibles sur:** https://github.com/mooby865/iapostemanager/actions

1. ✅ Checkout code
2. ✅ Setup Python 3.11
3. ✅ Install dependencies
4. ✅ Run tests
5. ⚠️ Docker login (échouera si secrets pas configurés)
6. ⚠️ Build Docker image (échouera si secrets pas configurés)
7. ⚠️ Push to Docker Hub (échouera si secrets pas configurés)

**C'est NORMAL si ça échoue la première fois** - les secrets ne sont pas encore configurés!

---

## 📋 Checklist complète

**Étapes déjà faites:**
- [x] Repository local initialisé (`git init`)
- [x] Remote configuré (`git remote add origin ...`)
- [x] Fichiers commités (`git commit`)
- [x] Docker login réussi
- [x] Clés SSH générées

**À faire maintenant:**
- [ ] Créer repository sur GitHub (https://github.com/new)
- [ ] Push code (`git push -u origin main`)
- [ ] Vérifier sur GitHub (https://github.com/mooby865/iapostemanager)

**À faire ensuite (Configuration CI/CD):**
- [ ] Configurer DOCKER_USERNAME secret
- [ ] Configurer DOCKER_PASSWORD secret
- [ ] Configurer SSH_PRIVATE_KEY secret
- [ ] (Optionnel) Configurer PRODUCTION_HOST secret
- [ ] (Optionnel) Configurer PRODUCTION_USER secret
- [ ] (Optionnel) Configurer SLACK_WEBHOOK_URL secret

**Voir guide:** `CONFIGURER_GITHUB_SECRETS.md`

---

## 🚨 Dépannage

### Erreur: "Repository not found"

**Cause:** Repository pas encore créé sur GitHub

**Solution:** Créer via https://github.com/new

---

### Erreur: "Permission denied"

**Cause:** Authentification échouée

**Solutions:**
1. Vérifier nom d'utilisateur: `mooby865`
2. Utiliser Personal Access Token (pas mot de passe)
3. Générer token: https://github.com/settings/tokens

---

### Erreur: "Updates were rejected"

**Cause:** Branch principale protégée ou divergence

**Solutions:**
```powershell
# Option 1: Force push (si nouveau repo vide)
git push -u origin main --force

# Option 2: Pull d'abord (si repo existant)
git pull origin main --rebase
git push -u origin main
```

---

### Repository existe déjà avec contenu

**Si vous avez initialisé avec README:**

```powershell
# 1. Pull le contenu existant
git pull origin main --allow-unrelated-histories

# 2. Résoudre conflits si nécessaire
# Éditer les fichiers en conflit

# 3. Commit merge
git add .
git commit -m "Merge remote repository"

# 4. Push
git push -u origin main
```

---

## 📞 Liens utiles

**Créer repository:**
- https://github.com/new

**Vos repositories:**
- https://github.com/mooby865?tab=repositories

**Personal Access Tokens:**
- https://github.com/settings/tokens

**GitHub CLI (optionnel):**
- https://cli.github.com/

**Documentation Git:**
- https://git-scm.com/doc

---

## 🎯 Commandes rapides

### Tout en une fois (après création du repo):

```powershell
# Configurer remote
git remote add origin https://github.com/mooby865/iapostemanager.git

# Push
git push -u origin main

# Vérifier
start https://github.com/mooby865/iapostemanager
```

---

**Date:** 18 décembre 2025  
**Repository:** iapostemanager  
**Owner:** mooby865  
**Status:** En attente de création sur GitHub
