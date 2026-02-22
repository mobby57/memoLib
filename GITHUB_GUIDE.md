# 🚀 Guide Rapide - Pousser vers GitHub

## ✅ Sauvegarde Locale Terminée

Votre projet est maintenant sauvegardé localement avec Git.

## 📤 Étapes pour Pousser vers GitHub

### 1. Créer un Dépôt sur GitHub
1. Allez sur https://github.com/new
2. Nom du dépôt: **MemoLib**
3. Description: "Système de gestion d'emails pour cabinets d'avocats"
4. Visibilité: **Private** (recommandé) ou Public
5. **NE PAS** initialiser avec README, .gitignore ou licence
6. Cliquez sur "Create repository"

### 2. Lier votre Projet Local à GitHub

Copiez et exécutez ces commandes (remplacez VOTRE_USERNAME):

```powershell
cd c:\Users\moros\Desktop\memolib\MemoLib.Api

git remote add origin https://github.com/VOTRE_USERNAME/MemoLib.git
git branch -M main
git push -u origin main
```

### 3. Authentification GitHub

Lors du push, GitHub vous demandera de vous authentifier:

**Option A: Personal Access Token (Recommandé)**
1. Allez sur https://github.com/settings/tokens
2. Cliquez "Generate new token (classic)"
3. Nom: "MemoLib"
4. Cochez: `repo` (accès complet aux dépôts)
5. Générez et copiez le token
6. Utilisez le token comme mot de passe lors du push

**Option B: GitHub CLI**
```powershell
# Installer GitHub CLI
winget install GitHub.cli

# S'authentifier
gh auth login

# Pousser
git push -u origin main
```

## 🔄 Sauvegardes Futures

Pour sauvegarder vos modifications:

```powershell
# Méthode rapide
.\backup-git.ps1
git push

# OU manuellement
git add .
git commit -m "Description des changements"
git push
```

## 📥 Restaurer sur un Autre PC

```powershell
# Cloner le projet
git clone https://github.com/VOTRE_USERNAME/MemoLib.git
cd MemoLib/MemoLib.Api

# Restaurer
.\restore-project.ps1

# Lancer
dotnet run
```

## 🔐 Sécurité

### Fichiers Exclus (.gitignore)
✅ Bases de données (*.db)
✅ Fichiers uploadés (uploads/)
✅ Secrets (appsettings.Development.json)
✅ Binaires (bin/, obj/)

### Secrets à Configurer Manuellement
Après clonage sur un nouveau PC:
```powershell
dotnet user-secrets set "EmailMonitor:Password" "votre-mot-de-passe"
```

## 📊 Vérifier le Statut

```powershell
# Voir les fichiers modifiés
git status

# Voir l'historique
git log --oneline

# Voir les branches
git branch -a
```

## 🌐 URL de Votre Dépôt

Après création, votre dépôt sera accessible à:
```
https://github.com/VOTRE_USERNAME/MemoLib
```

## 💡 Conseils

1. **Commits réguliers**: Sauvegardez après chaque fonctionnalité
2. **Messages clairs**: Décrivez ce qui a changé
3. **Branches**: Utilisez des branches pour les nouvelles fonctionnalités
4. **Pull avant Push**: Toujours faire `git pull` avant `git push`

## 🆘 Problèmes Courants

### "remote origin already exists"
```powershell
git remote remove origin
git remote add origin https://github.com/VOTRE_USERNAME/MemoLib.git
```

### "Authentication failed"
- Utilisez un Personal Access Token, pas votre mot de passe GitHub
- Vérifiez que le token a les permissions `repo`

### "Updates were rejected"
```powershell
git pull origin main --rebase
git push origin main
```

## ✅ Vérification Finale

Après le push, vérifiez sur GitHub que:
- ✅ Tous les fichiers sont présents
- ✅ Le README.md s'affiche correctement
- ✅ Aucun fichier sensible n'est visible

---

**🎉 Votre projet est maintenant sauvegardé et accessible depuis n'importe où !**
