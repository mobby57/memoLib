# 📑 INDEX - CONFIGURATION COMPLÈTE DES SECRETS

## 📚 Documentation

### 🔐 **[ROADMAP_SECRETS_COMPLET.md](ROADMAP_SECRETS_COMPLET.md)** ⭐
- **Description:** Guide complet 5 phases de configuration
- **Longueur:** ~3000 lignes, très détaillé
- **Quand l'utiliser:** 
  - Configuration initiale complète
  - Référence pour toutes les étapes
  - Troubleshooting avancé
- **Sections principales:**
  - Phase 1-5 (Préparation locale → GitHub)
  - Architecture des secrets
  - Scripts automatisés
  - Bonnes pratiques sécurité
  - Exemples de configuration

### ⚡ **[GUIDE_RAPIDE_SECRETS.md](GUIDE_RAPIDE_SECRETS.md)** ⭐
- **Description:** Configuration en 15 minutes
- **Longueur:** ~300 lignes, condensé
- **Quand l'utiliser:**
  - Vous êtes pressé
  - Juste les étapes essentielles
  - Vérification rapide
- **Sections principales:**
  - TL;DR (3 commandes)
  - 4 étapes de base
  - Vérification rapide
  - Troubleshooting basique

---

## 🛠️ Scripts Automatisés

### 🔧 **scripts/setup-secrets.ps1** (Script Master)
```powershell
# Configuration complète (5 phases)
.\scripts\setup-secrets.ps1 -Phase complete

# Exécuter phase spécifique
.\scripts\setup-secrets.ps1 -Phase phase1    # Préparation
.\scripts\setup-secrets.ps1 -Phase phase2    # Vault
.\scripts\setup-secrets.ps1 -Phase phase3    # Vercel
.\scripts\setup-secrets.ps1 -Phase phase4    # Cloudflare
.\scripts\setup-secrets.ps1 -Phase phase5    # GitHub

# Vérifier tous les services
.\scripts\setup-secrets.ps1 -Phase check

# Rotation des secrets (90 jours)
.\scripts\setup-secrets.ps1 -Phase rotate
```

### 🔐 **scripts/add-vault-secrets.ps1**
```powershell
# Ajouter tous les secrets au Vault chiffré
.\scripts\add-vault-secrets.ps1

# Résultat:
# - .env.vault créé (à committer)
# - .env.keys généré (à sauvegarder)
# - Tous les secrets chiffrés
# - Backup automatique
```

### 🌐 **scripts/add-vercel-env.ps1**
```powershell
# Ajouter variables à Vercel
.\scripts\add-vercel-env.ps1

# Ou pour un environnement spécifique
.\scripts\add-vercel-env.ps1 -Environment production
.\scripts\add-vercel-env.ps1 -Environment preview
.\scripts\add-vercel-env.ps1 -Environment development
```

### 🔄 **scripts/rotate-secrets-auto.ps1**
```powershell
# Rotation complète (à faire tous les 90 jours)
.\scripts\rotate-secrets-auto.ps1

# Ou rotation spécifique
.\scripts\rotate-secrets-auto.ps1 -SecretType nextauth -Target all
.\scripts\rotate-secrets-auto.ps1 -SecretType stripe -Target vercel
```

---

## 📋 Configuration des Fichiers

### ✅ À COMMITTER dans Git

```
.env.vault          ← Chiffré, safe
.gitignore          ← Inclut .env.* patterns
.github/workflows/  ← CI/CD avec secrets
```

**Vérifier:**
```powershell
git status
# Ne doit montrer AUCUN fichier .env.* ou .env.keys
```

### ❌ À NE PAS COMMITTER

```
.env.local          ← Valeurs locales privées
.env.keys           ← Clés de déchiffrement
.env.*.local        ← Variables locales d'environnement
credentials.json    ← Tokens API
github-app-key.pem  ← Clés privées
```

**Vérifier que vous avez dans `.gitignore`:**
```bash
.env.local
.env.keys
.env.*.local
.env.production
.env.development
credentials.json
github-app-key.pem
```

---

## 🔑 Secrets à Configurer - Checklist

### Niveau LOCAL (.env.local)
```
✅ DATABASE_URL          # PostgreSQL/Neon
✅ NEXTAUTH_SECRET       # Générer avec: openssl rand -base64 32
✅ NEXTAUTH_URL          # http://localhost:3000 (dev)
✅ STRIPE_SECRET_KEY     # sk_test_... (test) ou sk_live_... (prod)
✅ STRIPE_PUBLISHABLE_KEY
✅ OLLAMA_BASE_URL       # http://localhost:11434
✅ OLLAMA_MODEL          # llama3.2:3b
✅ GMAIL_CLIENT_ID
✅ GMAIL_CLIENT_SECRET
✅ GITHUB_APP_ID
✅ GITHUB_WEBHOOK_SECRET
```

### Niveau VERCEL (Production)
```
✅ DATABASE_URL          # Production database
✅ NEXTAUTH_URL          # https://iapostemanager.vercel.app
✅ NEXTAUTH_SECRET       # Production secret (différent du dev)
✅ STRIPE_SECRET_KEY     # sk_live_... (LIVE KEY!)
✅ VERCEL_ANALYTICS_ID
```

### Niveau GITHUB (CI/CD)
```
✅ DATABASE_URL
✅ NEXTAUTH_SECRET
✅ STRIPE_SECRET_KEY
✅ VERCEL_TOKEN
✅ VERCEL_ORG_ID
✅ VERCEL_PROJECT_ID
✅ CLOUDFLARE_API_TOKEN
```

### Niveau CLOUDFLARE (Workers)
```
✅ DATABASE_URL
✅ NEXTAUTH_SECRET
✅ STRIPE_SECRET_KEY
```

---

## 🔒 Processus de Sécurité

### Avant Déploiement (Checklist)

```powershell
# 1. Vérifier .env.local complété
if (-not (Test-Path ".env.local")) { 
    Write-Host "❌ .env.local manquant" 
}

# 2. Vérifier que .env.* est dans .gitignore
Select-String ".env" .gitignore

# 3. Vérifier qu'on ne commit rien de sensible
git status | grep -E "\.(env|pem|json)"  # Ne doit rien afficher

# 4. Tester le vault
npx dotenv -e .env.vault -- echo "✅ Vault OK"

# 5. Vérifier Vercel
npx vercel env ls | head -5

# 6. Vérifier GitHub
gh secret list
```

### Sauvegarde et Récupération

**Sauvegarder .env.keys:**
```powershell
# Créer backup
Copy-Item ".env.keys" -Destination "backups/.env.keys.backup.$(Get-Date -Format 'yyyyMMdd')"

# Stocker en lieu sûr:
# 1. Password manager (1Password, Bitwarden, etc.)
# 2. USB chiffrée (probablement pas conseillé)
# 3. Vault d'équipe (LastPass, etc.)

# ❌ NE PAS envoyer par email ou Slack!
```

**Si .env.keys perdu:**
```powershell
# Impossible de récupérer les anciens secrets
# Action: Rotation complète de TOUS les secrets

.\scripts\setup-secrets.ps1 -Phase rotate

# Puis:
# - Mettre à jour .env.local
# - Mettre à jour Vercel
# - Mettre à jour GitHub
# - Mettre à jour Cloudflare
```

---

## 📅 Maintenance Régulière

### Hebdomadaire
```powershell
# Aucune action (secrets stable)
# Surveiller les logs d'erreur d'authentification
```

### Mensuel
```powershell
# Vérifier que les services sont accessibles
.\scripts\setup-secrets.ps1 -Phase check

# Backup .env.keys à jour
Copy-Item ".env.keys" -Destination "backups/.env.keys.backup.$(Get-Date -Format 'yyyyMMdd')"
```

### Trimestriel (Tous les 90 jours)
```powershell
# Rotation des secrets
.\scripts\setup-secrets.ps1 -Phase rotate

# Étapes:
# 1. Exécuter le script
# 2. Redéployer (Vercel auto-redeploy)
# 3. Tester les connexions
# 4. Confirmer que tout fonctionne
# 5. Supprimer les anciens backups (après 30 jours)
```

### Annuellement
```powershell
# Audit de sécurité complet
# - Vérifier que 2FA est activé partout
# - Examiner les logs d'accès (Vercel, Cloudflare, GitHub)
# - Mettre à jour les procédures
```

---

## 🎓 Exemples Pratiques

### Exemple 1: Configuration Initiale Simple

```powershell
# 1. Copier template
Copy-Item ".env.local.example" -Destination ".env.local"

# 2. Remplir avec vos valeurs
code .env.local

# 3. Créer vault
npx dotenv-vault@latest new
npx dotenv-vault@latest push

# 4. Sauvegarder .env.keys
Copy-Item ".env.keys" -Destination "backups/.env.keys.backup.20260121"

# 5. Git commit (UNIQUEMENT .env.vault!)
git add .env.vault .gitignore
git commit -m "chore: add encrypted secrets vault"

# ✅ Terminé!
```

### Exemple 2: Ajouter un Nouveau Secret

```powershell
# 1. Modifier .env.local
$content = Get-Content ".env.local" -Raw
$content += "`nNEW_API_KEY=valeur-nouvelle"
Set-Content ".env.local" $content

# 2. Mettre à jour vault
npx dotenv-vault@latest set NEW_API_KEY "valeur-nouvelle"
npx dotenv-vault@latest push

# 3. Ajouter à Vercel
npx vercel@latest env add NEW_API_KEY --env production

# 4. Ajouter à GitHub
gh secret set NEW_API_KEY --body "valeur-nouvelle"

# ✅ Secret propagé partout!
```

### Exemple 3: Rotation d'Urgence (Sécurité)

```powershell
# Si secret compromis:
.\scripts\setup-secrets.ps1 -Phase rotate -SecretType "stripe" -Target "all"

# Ou rotation manuelle:
# 1. Générer nouveau secret
$newSecret = openssl rand -base64 32

# 2. Mettre à jour partout
(Get-Content ".env.local") -replace "OLD_SECRET", $newSecret | Set-Content ".env.local"
npx dotenv-vault@latest push
npx vercel@latest env add SECRET_NAME --env production
gh secret set SECRET_NAME --body $newSecret

# 3. Redéployer (Vercel auto-redeploy)

# ✅ Secret changé dans les 5 min!
```

---

## 🔗 Ressources Externes

- **dotenv-vault:** https://www.dotenv.org/vault
- **Vercel Env Vars:** https://vercel.com/docs/environment-variables
- **GitHub Secrets:** https://docs.github.com/en/actions/security-guides/encrypted-secrets
- **Cloudflare Secrets:** https://developers.cloudflare.com/workers/configuration/environment-variables/
- **Generate Secret:** https://generate-secret.vercel.app/32
- **OWASP Secrets:** https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html

---

## 📞 Support

| Problème | Solution | Qui Contacter |
|----------|----------|---------------|
| `.env.keys` perdu | Rotation complète | Équipe DevOps |
| Secrets ne sync pas | `npx dotenv-vault push` | Équipe Dev |
| Vercel auth fail | `npx vercel auth login` | Admin Vercel |
| GitHub secrets fail | Vérifier 2FA | Admin GitHub |
| Cloudflare secrets fail | `wrangler login` | Admin Cloudflare |

---

## ✅ Checklist Complète

- [ ] Documentation lue (ROADMAP_SECRETS_COMPLET.md)
- [ ] GUIDE_RAPIDE_SECRETS.md parcouru
- [ ] `.env.local` créé et complété
- [ ] `.env.vault` créé et chiffré
- [ ] `.env.keys` sauvegardé en lieu sûr
- [ ] Git `.gitignore` mis à jour
- [ ] Vercel configuré
- [ ] GitHub secrets configurés
- [ ] Cloudflare configuré (optionnel)
- [ ] Tous les tests de vérification passent
- [ ] 2FA activé sur tous les services
- [ ] Processus de rotation documenté

---

**Créé:** 21 Janvier 2026  
**Version:** 1.0.0  
**Status:** 🟢 Production-Ready

---

**Prochaine étape:** Lancer `.\scripts\setup-secrets.ps1 -Phase complete` 🚀
