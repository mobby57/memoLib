# 🛡️ GitGuardian ggshield - Sécurité des Secrets

Ce guide explique comment configurer GitGuardian ggshield pour protéger votre projet contre la fuite de secrets.

## 🎯 Pourquoi ggshield ?

- ✅ Détecte les secrets **AVANT** le commit/push
- ✅ Scanne 400+ types de secrets (API keys, tokens, passwords)
- ✅ Gratuit pour projets open source et usage personnel
- ✅ S'intègre avec pre-commit hooks
- ✅ Évite les incidents de sécurité coûteux

## 📦 Installation

### Windows (PowerShell)

```powershell
# Avec pip (Python requis)
pip install ggshield

# Ou avec pipx (recommandé)
pipx install ggshield

# Vérifier l'installation
ggshield --version
```

### Linux/WSL

```bash
# Avec pip
pip3 install ggshield

# Ou installer via apt (Debian/Ubuntu)
curl -1sLf 'https://dl.cloudsmith.io/public/gitguardian/ggshield/setup.deb.sh' | sudo bash
sudo apt update && sudo apt install ggshield

# Vérifier
ggshield --version
```

### macOS

```bash
# Avec Homebrew
brew install gitguardian/tap/ggshield

# Ou avec pip
pip3 install ggshield
```

## 🔑 Configuration (2 minutes)

### 1. Créer un compte GitGuardian (Gratuit)

1. Aller sur https://dashboard.gitguardian.com/auth/signup
2. S'inscrire avec votre email ou GitHub
3. Confirmer votre email

### 2. Récupérer votre API Token

1. Connectez-vous sur https://dashboard.gitguardian.com
2. Aller dans **"API"** → **"Personal Access Tokens"**
3. Cliquer sur **"Create token"**
4. Nom: `ggshield-local`
5. Copier le token (format: `ggp_xxx...`)

### 3. Configurer ggshield localement

```powershell
# Configurer le token
ggshield auth login --method token

# Coller votre token quand demandé
# Le token sera sauvegardé dans ~/.gitguardian/config.yml
```

**Alternative - Variable d'environnement:**

```powershell
# Ajouter dans votre profil PowerShell
$env:GITGUARDIAN_API_KEY = "ggp_votre_token_ici"

# Ou l'ajouter dans .env (PAS RECOMMANDÉ - ne pas commit)
GITGUARDIAN_API_KEY="ggp_votre_token_ici"
```

## 🚀 Utilisation

### Scanner le projet complet

```powershell
# Scanner tous les fichiers
npm run security:scan

# Ou directement
ggshield secret scan path .
```

### Scanner avant commit

```powershell
# Scanner les changements staged
npm run security:precommit

# Ou
ggshield secret scan pre-commit
```

### Scanner un commit spécifique

```powershell
# Scanner le dernier commit
ggshield secret scan commit-range HEAD~1..HEAD

# Scanner plusieurs commits
ggshield secret scan commit-range HEAD~5..HEAD
```

### Scanner un fichier spécifique

```powershell
# Scanner .env
ggshield secret scan path .env

# Scanner plusieurs fichiers
ggshield secret scan path .env credentials.json token.json
```

## ⚙️ Installation Pre-commit Hook (Recommandé)

### Méthode 1: Automatique avec ggshield

```powershell
# Installer le hook pre-commit
ggshield install -m local

# Désinstaller
ggshield install --uninstall
```

### Méthode 2: Manuel

Créer `.git/hooks/pre-commit`:

```bash
#!/bin/sh
# GitGuardian pre-commit hook

echo "🔍 Scanning for secrets with ggshield..."

ggshield secret scan pre-commit

if [ $? -ne 0 ]; then
    echo "❌ Secrets detected! Commit blocked."
    echo "💡 Fix the issues or use 'git commit --no-verify' to bypass (not recommended)"
    exit 1
fi

echo "✅ No secrets found"
exit 0
```

Rendre exécutable:
```powershell
chmod +x .git/hooks/pre-commit  # Linux/WSL
```

## 📋 Scripts npm ajoutés

```json
{
  "security:scan": "ggshield secret scan path .",
  "security:precommit": "ggshield secret scan pre-commit",
  "security:ci": "ggshield secret scan ci",
  "security:staged": "ggshield secret scan pre-receive"
}
```

## 🎯 Workflow Recommandé

### 1. Avant chaque commit

```powershell
# Scanner automatiquement (si pre-commit hook installé)
git commit -m "message"

# Ou manuellement
npm run security:precommit
git commit -m "message"
```

### 2. Avant chaque push

```powershell
# Scanner le projet
npm run security:scan

# Si OK, pusher
git push
```

### 3. En CI/CD (GitHub Actions)

Le scan est automatique si configuré (voir plus bas).

## 🔧 Configuration Avancée

### Fichier .gitguardian.yml

Le fichier `.gitguardian.yml` à la racine configure:

- **Chemins exclus**: `node_modules/`, `.next/`, etc.
- **Faux positifs**: Exemples de tokens dans la doc
- **Détecteurs custom**: Pour vos APIs spécifiques
- **Sortie**: Format du rapport

### Ignorer des secrets spécifiques

```yaml
matches-ignore:
  - name: Mon API key de dev
    match: "sk-dev-test-123456"
```

### Désactiver temporairement

```powershell
# Commit sans scan (⚠️ dangereux)
git commit --no-verify -m "message"

# Ou variable d'env
$env:GGSHIELD_IGNORE_KNOWN_SECRETS = "true"
git commit -m "message"
```

## 🚨 Que faire si un secret est détecté ?

### 1. Secret dans fichier non commité

```powershell
# Supprimer ou masquer le secret
# Utiliser des variables d'environnement
# Puis recommiter
```

### 2. Secret déjà commité (mais pas pushé)

```powershell
# Modifier le dernier commit
git commit --amend

# Ou rebase interactif
git rebase -i HEAD~3
```

### 3. Secret déjà pushé ⚠️

**URGENT - Le secret est compromis:**

1. **Révoquer immédiatement** le secret sur le service concerné
2. Générer un nouveau secret
3. Mettre à jour votre `.env`
4. Notifier l'équipe si nécessaire
5. Nettoyer l'historique Git:

```powershell
# Utiliser git-filter-repo (recommandé)
pip install git-filter-repo
git filter-repo --invert-paths --path .env

# Ou BFG Repo-Cleaner
java -jar bfg.jar --delete-files .env
git reflog expire --expire=now --all
git gc --prune=now --aggressive

# Force push (⚠️ Attention en équipe)
git push --force
```

## 🤖 Intégration CI/CD

### GitHub Actions

Créer `.github/workflows/security.yml`:

```yaml
name: GitGuardian Security Scan

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  scanning:
    name: GitGuardian Scan
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v3
        with:
          fetch-depth: 0

      - name: GitGuardian Scan
        uses: GitGuardian/ggshield-action@v1
        env:
          GITHUB_PUSH_BEFORE_SHA: ${{ github.event.before }}
          GITHUB_PUSH_BASE_SHA: ${{ github.event.base }}
          GITHUB_DEFAULT_BRANCH: ${{ github.event.repository.default_branch }}
          GITGUARDIAN_API_KEY: ${{ secrets.GITGUARDIAN_API_KEY }}
```

Ajouter le secret dans GitHub:
1. Repo → Settings → Secrets → New repository secret
2. Name: `GITGUARDIAN_API_KEY`
3. Value: votre token `ggp_xxx...`

## 📊 Tableau de bord GitGuardian

Une fois configuré, visitez https://dashboard.gitguardian.com pour:

- 📈 Voir les statistiques de scan
- 🔍 Historique des incidents
- 👥 Gérer l'équipe
- ⚙️ Configurer les alertes

## ✅ Checklist de Sécurité

- [ ] ggshield installé et configuré
- [ ] Token API configuré
- [ ] Pre-commit hook installé
- [ ] `.gitguardian.yml` configuré
- [ ] `.env` dans `.gitignore`
- [ ] `credentials.json` dans `.gitignore`
- [ ] `token.json` dans `.gitignore`
- [ ] Scanner le projet: aucun secret détecté
- [ ] CI/CD configuré (optionnel)
- [ ] Équipe informée des bonnes pratiques

## 🆘 Dépannage

### Erreur: "GitGuardian API key is missing"

```powershell
# Reconfigurer le token
ggshield auth login --method token
```

### Erreur: "Invalid API key"

→ Vérifier que le token commence par `ggp_`
→ Regénérer un nouveau token sur le dashboard

### Trop de faux positifs

→ Ajouter les patterns dans `.gitguardian.yml` → `matches-ignore`

### Hook pre-commit ne fonctionne pas

```powershell
# Vérifier que le hook existe
cat .git/hooks/pre-commit

# Réinstaller
ggshield install -m local --force
```

### Scan très lent

```powershell
# Exclure plus de dossiers dans .gitguardian.yml
# Ou scanner seulement les fichiers modifiés
ggshield secret scan pre-commit
```

## 📚 Ressources

- [Documentation officielle](https://docs.gitguardian.com/ggshield-docs)
- [GitHub](https://github.com/GitGuardian/ggshield)
- [Dashboard GitGuardian](https://dashboard.gitguardian.com)
- [Liste des détecteurs](https://docs.gitguardian.com/internal-repositories-monitoring/detectors)

## 💡 Bonnes Pratiques

1. **Jamais** de secrets dans le code
2. Utiliser `.env` pour tous les secrets
3. `.env` TOUJOURS dans `.gitignore`
4. Pre-commit hook activé
5. Scanner avant chaque push
6. Révoquer immédiatement si fuite
7. Utiliser des secrets différents dev/prod
8. Rotation régulière des secrets
9. Minimum de permissions nécessaires
10. Monitorer le dashboard régulièrement

---

**Créé le:** 6 janvier 2026  
**Dernière mise à jour:** 6 janvier 2026
