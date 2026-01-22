# 🔐 ROADMAP COMPLÈTE - CONFIGURATION COFFRE DES SECRETS

**Dernière mise à jour:** 21 Janvier 2026  
**Statut:** 🟢 Production-Ready Architecture

---

## 📊 ARCHITECTURE DES SECRETS - Vue d'Ensemble

```
┌─────────────────────────────────────────────────────────────┐
│          COFFRE DES SECRETS IA POSTE MANAGER                │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  LOCAL (.env.local)          CLOUD (Vercel/Cloudflare)     │
│  ├── Database                ├── Production Secrets          │
│  ├── Auth                    ├── API Keys                    │
│  ├── API Integrations        └── Sensitive Config            │
│  └── Development Keys                                        │
│                                                               │
│  VAULT (dotenv-vault)        GITHUB SECRETS                  │
│  ├── Encrypted Backup        ├── CI/CD Variables             │
│  ├── Team Sharing            ├── Deploy Credentials          │
│  └── Fallback System         └── OAuth Tokens                │
│                                                               │
│  CLOUDFLARE WORKERS          STRIPE WEBHOOKS                │
│  ├── Edge Secrets            ├── Payment Keys               │
│  ├── KV Store                └── Webhook Secrets            │
│  └── D1 Database                                            │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

---

## 📋 ROADMAP EN 5 PHASES

### ✅ PHASE 1: PRÉPARATION LOCALE (30 min)

#### 1.1 Vérifier la structure des fichiers

```powershell
# Vérifier les fichiers de config existants
ls -Filter ".env*" | Select-Object Name
# Devrait afficher:
# - .env.local (privé, en .gitignore)
# - .env.local.example (public, template)
# - .env.vault (chiffré)
# - .env (optionnel)
```

#### 1.2 Créer votre `.env.local` complet

```powershell
# Option A: Copier depuis le template et remplir manuellement
Copy-Item ".env.local.example" -Destination ".env.local"

# Option B: Script automatisé (voir PHASE 2)
```

#### 1.3 Valider le fichier `.env.local`

```bash
# Vérifier que .env.local n'est pas committé
git status | grep -i ".env.local"  # Ne doit rien afficher

# Vérifier que toutes les variables requises sont présentes
npx dotenv -e .env.local -- echo "✅ .env.local chargé"
```

---

### ✅ PHASE 2: CONFIGURATION VAULT LOCAL (30 min)

> **dotenv-vault** = Coffre de secrets chiffré + partage sécurisé

#### 2.1 Installer dotenv-vault

```powershell
# Installer globalement
npm install -g dotenv-vault

# Ou utiliser npx
npx dotenv-vault@latest --version
```

#### 2.2 Initialiser le Vault

```powershell
# Créer un nouveau vault (si pas déjà fait)
npx dotenv-vault@latest new

# Cela crée/met à jour:
# ├── .env.vault (chiffré, à committer)
# └── .env.keys (clés de déchiffrement, en .gitignore)

# S'assurer que .env.keys est dans .gitignore
if (!(Select-String -Path ".gitignore" -Pattern "\.env\.keys")) {
    Add-Content ".gitignore" "`n.env.keys"
}
```

#### 2.3 Ajouter les secrets au Vault

```powershell
# Créer un script PowerShell pour ajouter tous les secrets
# CRÉEZ: add-vault-secrets.ps1 (voir fin de document)

# Ou ajouter manuellement les secrets les plus importants:
npx dotenv-vault@latest set DATABASE_URL "votre-url-postgresql"
npx dotenv-vault@latest set NEXTAUTH_SECRET "votre-secret-generé"
npx dotenv-vault@latest set STRIPE_SECRET_KEY "sk_test_..."

# Vérifier les secrets ajoutés
npx dotenv-vault@latest keys
```

#### 2.4 Chiffrer et sauvegarder

```powershell
# Chiffrer le .env.local dans le vault
npx dotenv-vault@latest push

# Vérifier le chiffrement
cat .env.vault
# Devrait ressembler à:
# DOTENV_VAULT=ENCRYPTED[...long_encrypted_string...]

# Backup des clés (GARDER EN SÉCURITÉ)
Copy-Item ".env.keys" -Destination "backups/.env.keys.backup.$(Get-Date -Format 'yyyyMMdd-HHmmss')"
Write-Host "✅ Backup créé" -ForegroundColor Green
```

#### 2.5 Valider le Vault

```powershell
# Tester le déchiffrement
npx dotenv-vault@latest pull

# Tester le chargement
npx dotenv -e .env.vault -- npx dotenv-cli echo DATABASE_URL
```

---

### ✅ PHASE 3: CONFIGURATION VERCEL (15 min)

> **Vercel** = Secrets pour la production + préview deployments

#### 3.1 Installer Vercel CLI

```powershell
npm install -g vercel

# Ou
npx vercel@latest --version
```

#### 3.2 Se connecter à Vercel

```powershell
# Lancer le login
npx vercel@latest auth login

# Ou si déjà connecté:
npx vercel@latest whoami
```

#### 3.3 Configurer les variables d'environnement

```powershell
# Option A: Via CLI (interactive)
npx vercel@latest env add

# Option B: Via le script fourni
.\add-vercel-env.ps1

# Option C: Via le Dashboard
# https://vercel.com/dashboard → Projects → Settings → Environment Variables

# Ajouter pour les 3 environnements:
# 1. Production (main branch)
# 2. Preview (pull requests)
# 3. Development (local)
```

#### 3.4 Variables essentielles pour Vercel

```env
# Production (.env.production)
DATABASE_URL=postgresql://...production...
NEXTAUTH_URL=https://iapostemanager.vercel.app
NEXTAUTH_SECRET=***generated-production-secret***
STRIPE_SECRET_KEY=sk_live_... (LIVE KEY)
VERCEL_ANALYTICS_ID=***

# Preview (.env.preview)
DATABASE_URL=postgresql://...staging...
NEXTAUTH_URL=https://[deployment]-iapostemanager.vercel.app
NEXTAUTH_SECRET=***generated-preview-secret***
STRIPE_SECRET_KEY=sk_test_...

# Development (.env.development)
DATABASE_URL=postgresql://...local...
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=***dev-secret***
STRIPE_SECRET_KEY=sk_test_...
```

#### 3.5 Lister et vérifier

```powershell
# Lister toutes les variables Vercel
npx vercel@latest env ls

# Supprimer une variable si erreur
npx vercel@latest env rm VARIABLE_NAME

# Décoder une variable (masquée dans l'interface)
npx vercel@latest env pull .env.production.local
```

---

### ✅ PHASE 4: CONFIGURATION CLOUDFLARE (20 min)

> **Cloudflare** = Secrets pour Workers + D1 Database

#### 4.1 Installer Wrangler

```powershell
npm install -g wrangler

# Ou
npx wrangler@latest --version
```

#### 4.2 Configurer wrangler.toml

```toml
# wrangler.toml existant

[env.production]
name = "iapostemanager-prod"

[env.production.vars]
NEXTAUTH_URL = "https://iapostemanager.pages.dev"
OLLAMA_BASE_URL = "https://api-ollama.example.com"

[[env.production.env_secrets]]
binding = "DB"
DATABASE_URL = "***" # À ajouter via CLI

[[env.production.kv_namespaces]]
binding = "CACHE"
id = "your-kv-namespace-id"
```

#### 4.3 Ajouter les secrets Cloudflare

```powershell
# Se connecter à Cloudflare
wrangler login

# Ajouter des secrets (variables sensibles)
wrangler secret put DATABASE_URL --env production
# Entrer: postgresql://...

wrangler secret put NEXTAUTH_SECRET --env production
# Entrer: ***secret***

wrangler secret put STRIPE_SECRET_KEY --env production
# Entrer: sk_live_...

# Lister les secrets (masqués pour sécurité)
wrangler secret list --env production
```

#### 4.4 Variables Cloudflare avec D1

```powershell
# Si vous utilisez D1 (base de données Cloudflare)
wrangler d1 execute iapostemanager-db \
  --command="SELECT COUNT(*) FROM User;" \
  --remote

# Les credentials D1 sont automatiquement sécurisés
```

---

### ✅ PHASE 5: CONFIGURATION GITHUB SECRETS (15 min)

> **GitHub** = Secrets pour Actions/Workflows CI/CD

#### 5.1 Accéder aux GitHub Secrets

```
https://github.com/YOUR_USERNAME/iapostemanage/settings/secrets/actions
```

#### 5.2 Ajouter les secrets importants

```powershell
# Via CLI (GitHub CLI)
gh secret set DATABASE_URL --body "postgresql://..."
gh secret set NEXTAUTH_SECRET --body "***"
gh secret set STRIPE_SECRET_KEY --body "sk_test_..."
gh secret set VERCEL_TOKEN --body "***vercel-token***"
gh secret set CLOUDFLARE_API_TOKEN --body "***cf-token***"

# Lister les secrets
gh secret list
```

#### 5.3 Secrets pour CI/CD

```yaml
# .github/workflows/deploy.yml

env:
  VERCEL_ORG_ID: ${{ secrets.VERCEL_ORG_ID }}
  VERCEL_PROJECT_ID: ${{ secrets.VERCEL_PROJECT_ID }}
  DATABASE_URL: ${{ secrets.DATABASE_URL }}
  NEXTAUTH_SECRET: ${{ secrets.NEXTAUTH_SECRET }}

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Deploy to Vercel
        uses: vercel/action@v4
        with:
          token: ${{ secrets.VERCEL_TOKEN }}
          projectId: ${{ env.VERCEL_PROJECT_ID }}
          orgId: ${{ env.VERCEL_ORG_ID }}
```

#### 5.4 Tokens à ajouter

| Secret | Où l'obtenir | Durée de validité |
|--------|-------------|-------------------|
| `VERCEL_TOKEN` | https://vercel.com/account/tokens | Illimitée |
| `VERCEL_ORG_ID` | Dashboard Vercel → Settings | N/A |
| `VERCEL_PROJECT_ID` | Dashboard Vercel → Settings | N/A |
| `CLOUDFLARE_API_TOKEN` | Dashboard CF → My Profile → API Tokens | 90 jours |
| `GITHUB_TOKEN` | Auto-généré par GitHub | 1 workflow |
| `DATABASE_URL` | Votre provider (Neon/Supabase) | Variable |
| `STRIPE_SECRET_KEY` | Dashboard Stripe → API Keys | Illimitée |

---

## 🎯 CHECKLIST COMPLET

### Environnement Local

- [ ] `.env.local` créé et complété (voir PHASE 1)
- [ ] `.env.keys` en `.gitignore` (voir PHASE 2)
- [ ] `dotenv-vault` installé localement (voir PHASE 2)
- [ ] `.env.vault` créé et chiffré (voir PHASE 2)
- [ ] Test de chargement: `npx dotenv -e .env.local -- echo $DATABASE_URL`
- [ ] Backup des `.env.keys` réalisé en sécurité (voir PHASE 2.4)

### Vercel Production

- [ ] Compte Vercel créé
- [ ] Vercel CLI installé (voir PHASE 3)
- [ ] Authentification Vercel réussie
- [ ] Variables Production ajoutées (DATABASE_URL, NEXTAUTH_SECRET, etc.)
- [ ] Variables Preview configurées
- [ ] Variables Development configurées
- [ ] Test: `npx vercel env ls`

### Cloudflare Workers

- [ ] Compte Cloudflare actif
- [ ] Wrangler CLI installé (voir PHASE 4)
- [ ] `wrangler.toml` configuré
- [ ] Secrets Cloudflare ajoutés (DATABASE_URL, NEXTAUTH_SECRET)
- [ ] Test: `wrangler secret list --env production`
- [ ] D1 database associée (optionnel)

### GitHub Actions

- [ ] Compte GitHub créé
- [ ] GitHub CLI installé (optionnel)
- [ ] Secrets GitHub configurés (voir PHASE 5)
- [ ] Tokens générés (Vercel, Cloudflare, GitHub)
- [ ] Workflows testés

### Backup & Récupération

- [ ] Backup `.env.keys` réalisé et sécurisé
- [ ] Backup de tous les tokens produits et stockés
- [ ] Processus de récupération documenté
- [ ] 2FA/MFA activé sur tous les services (Vercel, Cloudflare, GitHub, Stripe)

---

## 🔒 SÉCURITÉ - Bonnes Pratiques

### À FAIRE ✅

```powershell
# 1. Activer 2FA sur tous les services
# Vercel, Cloudflare, GitHub, Stripe, etc.

# 2. Utiliser un password manager
# 1Password, Bitwarden, KeePass, etc.

# 3. Sauvegarder les tokens de récupération
# Stockés hors-ligne, en sécurité

# 4. Rotationner les secrets régulièrement
# Tous les 90 jours minimum

# 5. Utiliser des secrets différents par environnement
# Dev ≠ Staging ≠ Production

# 6. Archiver les anciens secrets
# Au lieu de les supprimer directement

# 7. Monitorer les accès aux secrets
# Via logs Vercel, Cloudflare, GitHub

# 8. Permissions minimales
# Donner accès à ce qui est nécessaire uniquement
```

### À ÉVITER ❌

```powershell
# ❌ Committer les secrets dans Git
# Utiliser .gitignore et .env.vault

# ❌ Stocker les secrets en texte brut
# Toujours chiffrer avec dotenv-vault

# ❌ Partager les secrets par email
# Utiliser le coffre de l'équipe (Vault)

# ❌ Mettre les secrets dans les logs
# Masquer les valeurs sensibles toujours

# ❌ Utiliser les mêmes secrets partout
# Différencier par environnement

# ❌ Oublier la rotation des tokens
# Effectuer une rotation tous les 90 jours

# ❌ Donner l'accès à tout le monde
# Implémenter des permissions granulaires

# ❌ Ignorer les alertes de sécurité
# Vérifier les logs de GitHub/Vercel/Cloudflare
```

---

## 📁 STRUCTURE FINALE RECOMMANDÉE

```
iaPostemanage/
├── .env.local              ← Secrets locaux (en .gitignore)
├── .env.local.example      ← Template public
├── .env.vault              ← Vault chiffré (à committer)
├── .env.keys               ← Clés de déchiffrement (en .gitignore)
│
├── .github/
│   └── workflows/
│       └── deploy.yml      ← Références GitHub secrets
│
├── wrangler.toml           ← Config Cloudflare
│
├── scripts/
│   ├── add-vault-secrets.ps1      ← Ajouter secrets au vault
│   ├── add-vercel-env.ps1         ← Configurer Vercel
│   ├── configure-cloudflare.ps1   ← Configurer Cloudflare
│   └── backup-secrets.ps1         ← Backup automatique
│
├── docs/
│   └── SECRETS_GUIDE.md    ← Documentation équipe
│
└── backups/
    └── .env.keys.backup.* ← Backups chiffrés
```

---

## 🚀 SCRIPTS AUTOMATISÉS

### Script 1: Ajouter tous les secrets au Vault

```powershell
# save as: scripts/add-vault-secrets.ps1

Write-Host "🔐 Configuration Vault des Secrets" -ForegroundColor Cyan

# Vérifier dotenv-vault
$vault = npm list -g dotenv-vault 2>/dev/null
if (-not $vault) {
    Write-Host "⚠️  dotenv-vault non installé" -ForegroundColor Yellow
    npm install -g dotenv-vault
}

# Initialiser Vault si nécessaire
if (-not (Test-Path ".env.vault")) {
    npx dotenv-vault@latest new
}

# Lire .env.local et ajouter au vault
$envVars = Get-Content ".env.local" | ConvertFrom-StringData

foreach ($key in $envVars.Keys) {
    Write-Host "  → Ajout de $key..." -ForegroundColor Gray
    npx dotenv-vault@latest set $key $envVars[$key]
}

# Chiffrer
npx dotenv-vault@latest push

Write-Host "✅ Vault configuré et chiffré" -ForegroundColor Green
Write-Host "⚠️  IMPORTANT: Sauvegarder .env.keys en lieu sûr!" -ForegroundColor Yellow
```

### Script 2: Ajouter secrets à Vercel

```powershell
# save as: scripts/add-vercel-env.ps1

Write-Host "🌐 Configuration Vercel" -ForegroundColor Cyan

# Vérifier Vercel CLI
$vercel = npm list -g vercel 2>/dev/null
if (-not $vercel) {
    npm install -g vercel
}

# Se connecter
npx vercel@latest auth login

# Charger .env.local
$envVars = Get-Content ".env.local" | ConvertFrom-StringData

# Ajouter pour chaque environnement
foreach ($env in @("production", "preview", "development")) {
    Write-Host "  Configuration $env..." -ForegroundColor Gray
    
    foreach ($key in $envVars.Keys) {
        $value = $envVars[$key]
        # Pour Production, utiliser des valeurs différentes
        # if ($env -eq "production") { ... }
        npx vercel@latest env add $key --env $env --value $value
    }
}

Write-Host "✅ Vercel configuré" -ForegroundColor Green
Write-Host "📋 Lister: npx vercel env ls" -ForegroundColor Cyan
```

### Script 3: Rotation des Secrets

```powershell
# save as: scripts/rotate-secrets.ps1

param(
    [Parameter(Mandatory=$true)]
    [string]$SecretName
)

Write-Host "🔄 Rotation Secret: $SecretName" -ForegroundColor Cyan

# 1. Générer un nouveau secret
$newSecret = -join ([char[]](48..122) | Get-Random -Count 32)

# 2. Mettre à jour Vault
npx dotenv-vault@latest set $SecretName $newSecret

# 3. Mettre à jour Vercel
@("production", "preview", "development") | ForEach-Object {
    Write-Host "  → Mise à jour Vercel ($($_))..."
    npx vercel@latest env rm $SecretName --env $_ --yes
    npx vercel@latest env add $SecretName --env $_ --value $newSecret
}

# 4. Mettre à jour Cloudflare
Write-Host "  → Mise à jour Cloudflare..."
wrangler secret put $SecretName --env production
# L'utilisateur entrera manuellement ou piper: echo $newSecret | wrangler secret put...

# 5. Backup ancien secret
$backup = "backups/rotated-secrets/$(Get-Date -Format 'yyyyMMdd-HHmmss')_$SecretName.txt"
New-Item -ItemType Directory -Path "backups/rotated-secrets" -Force | Out-Null
Add-Content $backup "$SecretName rotated at $(Get-Date)"

Write-Host "✅ Secret $SecretName roté" -ForegroundColor Green
Write-Host "📝 Backup: $backup" -ForegroundColor Gray
```

---

## 🎓 EXEMPLES DE CONFIGURATION

### Exemple: Configuration Complète Local + Cloud

```yaml
# Envs à configurer

LOCAL (.env.local):
├── DATABASE_URL=postgresql://user:pass@localhost:5432/iaposte
├── NEXTAUTH_SECRET=dev-secret-here
├── STRIPE_SECRET_KEY=sk_test_4eC39HqLyjWDarhtT657dsf
├── OLLAMA_BASE_URL=http://localhost:11434
└── GMAIL_CLIENT_SECRET=***

VERCEL (Production):
├── DATABASE_URL=[REDACTED_DATABASE_URL]
├── NEXTAUTH_SECRET=[REDACTED_SECRET]
├── STRIPE_SECRET_KEY=[REDACTED_STRIPE_KEY]
├── NEXTAUTH_URL=https://iapostemanager.vercel.app
└── VERCEL_ANALYTICS_ID=v-***

CLOUDFLARE (Workers):
├── DATABASE_URL=binding via D1
├── NEXTAUTH_SECRET=cf-secret
├── STRIPE_SECRET_KEY=sk_test_***
└── KV_NAMESPACE_ID=***

GITHUB (CI/CD):
├── DATABASE_URL (secret)
├── STRIPE_SECRET_KEY (secret)
├── VERCEL_TOKEN (secret)
└── CLOUDFLARE_API_TOKEN (secret)
```

---

## 📞 TROUBLESHOOTING

### Problème: "Invalid env format"

```powershell
# Solution: Valider le format .env
npx dotenv-cli echo DATABASE_URL

# Ou vérifier manuellement
Get-Content .env.local | Where-Object { $_ -match "^[A-Z_]+=.*" }
```

### Problème: "Vault locked"

```powershell
# Solution: Vérifier .env.keys
if (-not (Test-Path ".env.keys")) {
    Write-Host "❌ .env.keys manquant - impossible de déchiffrer" -ForegroundColor Red
    Write-Host "Restaurer depuis backup:"
    Copy-Item "backups/.env.keys.backup.*" -Destination ".env.keys"
}
```

### Problème: "Secret not found in Vercel"

```powershell
# Solution: Re-ajouter
npx vercel@latest env add SECRET_NAME --env production --value "value"

# Ou via dashboard: https://vercel.com → Project → Settings → Environment Variables
```

---

## 🎯 PROCHAINES ÉTAPES

1. **Cette semaine:**
   - [ ] Compléter Phase 1 (Local `.env.local`)
   - [ ] Faire Phase 2 (Vault chiffré)
   - [ ] Sauvegarder les `.env.keys`

2. **La semaine prochaine:**
   - [ ] Phase 3 (Vercel Production)
   - [ ] Phase 4 (Cloudflare si utilisé)
   - [ ] Phase 5 (GitHub Actions)

3. **Maintenance régulière:**
   - Rotation secrets (tous les 90 jours)
   - Backup `.env.keys` (mensuel)
   - Audit accès secrets (trimestriel)

---

## 📚 RESSOURCES

- **dotenv-vault:** https://www.dotenv.org/vault
- **Vercel Env Vars:** https://vercel.com/docs/environment-variables
- **Cloudflare Secrets:** https://developers.cloudflare.com/workers/configuration/environment-variables/
- **GitHub Secrets:** https://docs.github.com/en/actions/security-guides/encrypted-secrets
- **OWASP Secrets Management:** https://cheatsheetseries.owasp.org/

---

**Créé:** 21 Janvier 2026  
**Version:** 1.0.0  
**Status:** 🟢 Production-Ready
