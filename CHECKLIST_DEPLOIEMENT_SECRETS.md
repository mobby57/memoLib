# ✅ CHECKLIST DE DÉPLOIEMENT - Configuration Secrets

## 📋 Avant Chaque Déploiement

### ① Configuration Locale (5 min)
- [ ] `.env.local` existe
- [ ] `.env.local` contient DATABASE_URL
- [ ] `.env.local` contient NEXTAUTH_SECRET
- [ ] `.env.local` contient STRIPE_SECRET_KEY
- [ ] NEXTAUTH_SECRET n'est pas vide (run: `openssl rand -base64 32`)
- [ ] STRIPE_SECRET_KEY commence par `sk_test_` (dev) ou `sk_live_` (prod)
- [ ] DATABASE_URL est valide (peut se connecter)

**Vérifier:**
```powershell
.\scripts\verify-secrets.ps1
```

### ② Sécurité Git (5 min)
- [ ] `.gitignore` contient `.env.local`
- [ ] `.gitignore` contient `.env.keys`
- [ ] `.gitignore` contient `.env.*.local`
- [ ] `.gitignore` contient `credentials.json`
- [ ] `.gitignore` contient `*.pem`
- [ ] `git status` montre 0 fichier `.env.*`
- [ ] `git status` montre 0 fichier `.keys`
- [ ] `git status` montre 0 fichier `.pem`

**Vérifier:**
```powershell
git status | grep -E "\.(env|keys|pem)"  # Ne doit rien afficher
```

### ③ Secrets Chiffrés (5 min)
- [ ] `.env.vault` existe (chiffré)
- [ ] `.env.keys` existe (sauvegardé en lieu sûr)
- [ ] Vault peut être déchiffré (`npx dotenv-vault keys list`)
- [ ] Tous les secrets essentiels sont dans le vault

**Vérifier:**
```powershell
npx dotenv-vault@latest keys list
npx dotenv-vault@latest info
```

### ④ Vercel Configuration (5 min)
- [ ] `vercel` CLI installé
- [ ] Authentification Vercel OK (`vercel auth whoami`)
- [ ] Variables d'environnement dans Vercel (production/preview/development)
- [ ] DATABASE_URL pointant vers la vraie base
- [ ] NEXTAUTH_URL = `https://votre-domaine.vercel.app`
- [ ] STRIPE_SECRET_KEY commence par `sk_live_` (production!)
- [ ] Aucune variable vide

**Vérifier:**
```powershell
vercel env ls
```

### ⑤ GitHub Configuration (5 min)
- [ ] `gh` CLI authentifié (`gh auth status`)
- [ ] Secrets GitHub créés pour Actions
- [ ] VERCEL_TOKEN configuré (pour CI/CD)
- [ ] Aucun secret visiblement stocké dans `.github/workflows/`

**Vérifier:**
```powershell
gh secret list
gh secret view VERCEL_TOKEN  # Doit afficher quelque chose
```

### ⑥ Application & Tests (10 min)
- [ ] Dépendances installées (`npm install`)
- [ ] Base de données initialisée (`npx prisma db push`)
- [ ] Application démarre (`npm run dev`)
- [ ] Page d'accueil accessible (http://localhost:3000)
- [ ] Connexion NextAuth fonctionne
- [ ] Connexion database fonctionne (prisma)
- [ ] Appels Stripe testables avec clé test
- [ ] Aucune erreur dans la console

**Tests:**
```powershell
npm install
npx prisma db push
npm run dev
# Tester:
# - Login page
# - Dashboard access
# - Créer un dossier (test database)
# - Page Stripe (test avec clé test)
```

### ⑦ Déploiement (10 min)
- [ ] `git add .env.vault` (uniquement!)
- [ ] `git add .gitignore`
- [ ] Commit message descriptif: `chore: add encrypted secrets`
- [ ] Push vers main/master
- [ ] GitHub Actions lancé automatiquement
- [ ] Vercel redeploye automatiquement
- [ ] Vérifier: https://votre-app.vercel.app fonctionne
- [ ] Vérifier: Pas d'erreur AUTH dans production

**Commandes:**
```powershell
git add .env.vault .gitignore
git commit -m "chore: add encrypted secrets"
git push origin main

# Attendre 2-3 minutes, puis vérifier:
vercel --prod  # ou via dashboard
```

### ⑧ Post-Déploiement (5 min)
- [ ] Application répond en production
- [ ] Logs production ne montrent pas d'erreurs AUTH
- [ ] Utilisateurs peuvent se connecter
- [ ] Base de données accessible
- [ ] Stripe paiements testables
- [ ] Email notifications fonctionnent
- [ ] Aucun secret exposé dans les logs

**Vérifier:**
```powershell
# Vérifier les logs Vercel
vercel logs

# Ou via dashboard:
# https://vercel.com/[org]/[projet]/monitoring
```

---

## 🔐 Rotation Secrets (Tous les 90 jours)

### Checklist de Rotation

- [ ] Backup .env.keys créé (date du jour)
- [ ] Nouveau NEXTAUTH_SECRET généré
- [ ] Nouveau DATABASE_URL généré (si possible)
- [ ] Stripe test keys conservées, live keys rotées
- [ ] GitHub PAT renouvelé (annuellement)
- [ ] Vercel token renouvelé
- [ ] Cloudflare token renouvelé
- [ ] Tous les secrets mis à jour dans:
  - [ ] .env.local
  - [ ] .env.vault (puis push)
  - [ ] Vercel (production/preview/development)
  - [ ] GitHub Secrets
  - [ ] Cloudflare (si utilisé)
- [ ] Tests complets après rotation
- [ ] Oldbackups supprimés (garde 30j)

**Commandes:**
```powershell
# Rotation complète
.\scripts\setup-secrets.ps1 -Phase rotate

# Ou manuellement
openssl rand -base64 32  # Nouveau NEXTAUTH_SECRET
npx dotenv-vault@latest set NEXTAUTH_SECRET "nouvelle-valeur"
npx dotenv-vault@latest push
npx vercel env add NEXTAUTH_SECRET --env production
gh secret set NEXTAUTH_SECRET --body "nouvelle-valeur"

# Tester
npm run dev
npx vercel deploy --prod
```

---

## 🆘 Troubleshooting Quick

### ❌ "NEXTAUTH_SECRET not found"
```powershell
# 1. Vérifier .env.local existe
if (-not (Test-Path ".env.local")) { 
    Copy-Item ".env.local.example" ".env.local"
}

# 2. Vérifier contient NEXTAUTH_SECRET
Get-Content ".env.local" | Select-String "NEXTAUTH_SECRET"

# 3. Redémarrer
npm run dev
```

### ❌ "DATABASE_URL connection failed"
```powershell
# 1. Vérifier format DATABASE_URL
# Doit être: postgresql://user:pass@host:port/dbname

# 2. Tester connexion Prisma
npx prisma db push

# 3. Vérifier base existe
# Pour Neon: https://console.neon.tech
```

### ❌ "Stripe key invalid"
```powershell
# 1. Copier depuis Stripe dashboard
# https://dashboard.stripe.com/apikeys

# 2. Vérifier format:
# sk_test_... (development)
# sk_live_... (production)

# 3. Pas d'espace avant/après
$key = (Get-Content ".env.local" | Select-String "STRIPE_SECRET_KEY").Line
Write-Host "'$key'"  # Vérifier pas d'espace
```

### ❌ ".env.vault not found"
```powershell
# 1. Créer vault
npx dotenv-vault@latest new

# 2. Copier valeurs de .env.local
npx dotenv-vault@latest push

# 3. Vérifier création
if (Test-Path ".env.vault") { Write-Host "✅ Vault créé" }
```

### ❌ "Vercel auth failed"
```powershell
# 1. Login à Vercel
vercel auth login

# 2. Vérifier
vercel auth whoami

# 3. Ajouter variables
vercel env add DATABASE_URL
```

### ❌ "GitHub secret not visible"
```powershell
# 1. Vérifier permission (admin du repo)
gh repo view  # Vérifier "viewerPermission: ADMIN"

# 2. Login à GitHub
gh auth login

# 3. Ajouter secret
gh secret set VERCEL_TOKEN --body "value"

# 4. Vérifier
gh secret list
```

---

## 📊 Tableau de Bord (Services)

| Service | Vérifier | Command |
|---------|----------|---------|
| Vercel | Env vars | `vercel env ls` |
| Vercel | Logs | `vercel logs` |
| GitHub | Secrets | `gh secret list` |
| GitHub | Deploy | https://github.com/[owner]/[repo]/actions |
| Stripe | Keys | https://dashboard.stripe.com/apikeys |
| Stripe | Test Mode | Clé commence par `sk_test_` |

---

## ⏰ Planification Maintenance

### Hebdomadaire
- [ ] Vérifier pas d'erreurs AUTH en production
- [ ] Vérifier logs Vercel

### Mensuel
- [ ] Lancer `.\scripts\verify-secrets.ps1`
- [ ] Backup .env.keys à jour
- [ ] Vérifier 2FA activé partout

### Tous les 90 Jours
- [ ] Rotation complète (`.\scripts\setup-secrets.ps1 -Phase rotate`)
- [ ] Nettoyer anciens backups (garde 30j)
- [ ] Audit de sécurité

### Annuellement
- [ ] GitHub PAT renouvelé
- [ ] Vercel token renouvelé
- [ ] Cloudflare token renouvelé
- [ ] Audit complet de sécurité

---

## 📝 Template de Commit

```
chore: update encrypted secrets vault

- Updated .env.vault with new environment variables
- Rotated NEXTAUTH_SECRET (90-day cycle)
- Updated DATABASE_URL for new instance
- All secrets encrypted and backed up

⚠️  IMPORTANT:
- Only .env.vault should be committed (chiffré, safe)
- .env.keys stored separately (NOT committed)
- Verify: git status shows zero .env.local

Closes: #123 (if applicable)
```

---

## 🎓 Rappels Sécurité

### ✅ À FAIRE
- Commit `.env.vault` (chiffré)
- Stocker `.env.keys` en lieu sûr (password manager)
- Utiliser `sk_test_` en dev, `sk_live_` en prod
- Générer secrets aléatoires (ne pas réutiliser)
- 2FA sur tous les services
- Rotation tous les 90 jours
- Tests avant déploiement

### ❌ NE PAS FAIRE
- Commit `.env.local` ou `.env.keys`
- Envoyer secrets par email/Slack
- Utiliser même secret en dev et prod
- Mettre secrets en variables JS (exposé au client!)
- Oublier 2FA
- Secrets en dur dans le code (hardcoded)
- Partager .env.keys par Slack/GitHub

---

## 📞 Ressources

- **dotenv-vault:** https://www.dotenv.org/vault
- **Vercel Docs:** https://vercel.com/docs/environment-variables
- **GitHub Secrets:** https://github.com/[owner]/[repo]/settings/secrets/actions
- **Stripe Keys:** https://dashboard.stripe.com/apikeys
- **OWASP Secrets:** https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html

---

**Créé:** 21 Janvier 2026  
**Version:** 1.0.0  
**Status:** ✅ Production-Ready

---

**Prêt?** Lance: `.\scripts\verify-secrets.ps1` pour vérifier votre config! 🚀
