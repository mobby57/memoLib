# 📚 GUIDE: Créer un Repository GitHub

## 🚀 Étape par étape (5 minutes)

### 1️⃣ Aller sur GitHub

**Ouvrir dans votre navigateur:**
```
https://github.com/new
```

### 2️⃣ Remplir le formulaire

**Repository name:**
```
iapostemanager
```

**Description (optionnel):**
```
Application web pour automatiser l'envoi d'emails avec génération IA, interface vocale et sécurité avancée
```

**Visibilité:**
- ✅ **Public** (recommandé - gratuit et visible)
- ⚪ Private (si vous voulez le garder privé)

### 3️⃣ Options importantes

**❌ NE PAS cocher ces options:**
- ❌ Add a README file
- ❌ Add .gitignore
- ❌ Choose a license

**Pourquoi?** Vous avez déjà ces fichiers dans votre projet!

### 4️⃣ Créer le repository

**Cliquer sur:**
```
Create repository
```

### 5️⃣ Copier l'URL

**GitHub va afficher une page avec des commandes. Copier cette URL:**
```
https://github.com/mooby865/iapostemanager.git
```

---

## 🔑 Créer un Personal Access Token

### 1️⃣ Aller dans les paramètres

**Ouvrir:**
```
https://github.com/settings/tokens
```

### 2️⃣ Générer un nouveau token

**Cliquer sur:**
```
Generate new token (classic)
```

### 3️⃣ Configurer le token

**Note:**
```
iaPosteManager CI/CD
```

**Expiration:**
```
90 days (ou No expiration si vous préférez)
```

**Permissions à cocher:**
- ✅ **repo** (Full control of private repositories)
- ✅ **workflow** (Update GitHub Action workflows)

### 4️⃣ Générer et copier

**Cliquer sur:**
```
Generate token
```

**⚠️ IMPORTANT:** Copiez le token immédiatement! Il commence par `ghp_...`

---

## 🎯 Utilisation

### Avec le script automatique

1. **Double-cliquer sur `PUSH_GITHUB.bat`**
2. **Quand demandé:**
   - Username: `mooby865`
   - Password: `[coller votre token]`

### Avec PowerShell

```powershell
cd C:\Users\moros\Desktop\iaPostemanage

# Initialiser Git
git init
git config user.name "mooby865"
git config user.email "votre-email@example.com"

# Ajouter les fichiers
git add .
git commit -m "Initial commit: iaPosteManager v3.6"

# Lier au repository GitHub
git remote add origin https://github.com/mooby865/iapostemanager.git
git branch -M main

# Pousser (utilisez le token comme mot de passe)
git push -u origin main
```

---

## ✅ Vérification

**Une fois terminé, aller sur:**
```
https://github.com/mooby865/iapostemanager
```

**Vous devriez voir:**
- ✅ Tous vos fichiers
- ✅ Le README.md affiché
- ✅ L'onglet "Actions" disponible

---

## 🔧 Configurer les Secrets (pour CI/CD)

**Aller sur:**
```
https://github.com/mooby865/iapostemanager/settings/secrets/actions
```

**Ajouter ces secrets:**

### DOCKER_USERNAME
```
Name: DOCKER_USERNAME
Secret: mooby865
```

### DOCKER_PASSWORD
```
Name: DOCKER_PASSWORD
Secret: [votre token Docker Hub - voir guide]
```

### SSH_PRIVATE_KEY
```
Name: SSH_PRIVATE_KEY
Secret: [votre clé SSH privée - voir SSH_KEYS_AIDE_MEMOIRE.md]
```

### PRODUCTION_HOST
```
Name: PRODUCTION_HOST
Secret: [IP de votre serveur]
```

### PRODUCTION_USER
```
Name: PRODUCTION_USER
Secret: [utilisateur SSH sur le serveur]
```

---

## 🚨 Dépannage

### Erreur "repository not found"
- Vérifiez que le repository existe sur GitHub
- Vérifiez l'URL: `https://github.com/mooby865/iapostemanager.git`

### Erreur "authentication failed"
- Utilisez votre **token** comme mot de passe, pas votre mot de passe GitHub
- Vérifiez que le token a les bonnes permissions (`repo`, `workflow`)

### Erreur "remote origin already exists"
```powershell
git remote remove origin
git remote add origin https://github.com/mooby865/iapostemanager.git
```

---

## 📱 Raccourcis rapides

**Créer repo:** https://github.com/new  
**Créer token:** https://github.com/settings/tokens  
**Voir repo:** https://github.com/mooby865/iapostemanager  
**Configurer secrets:** https://github.com/mooby865/iapostemanager/settings/secrets/actions

---

**🎉 Une fois terminé, le pipeline CI/CD se déclenchera automatiquement à chaque push!**