# ⚡ GUIDE RAPIDE - CONFIGURATION SECRETS EN 15 MIN

## 🚀 TL;DR - Démarrer immédiatement

```powershell
# 1. Aller dans le répertoire du projet
cd c:\Users\moros\Desktop\iaPostemanage

# 2. Lancer la configuration complète
.\scripts\setup-secrets.ps1 -Phase complete

# 3. Vérifier le statut
.\scripts\setup-secrets.ps1 -Phase check

# ✅ Voilà ! Configuration complete
```

---

## 📋 Configuration Étape par Étape (15 min)

### Étape 1: Préparer votre `.env.local` (5 min)

```powershell
# Copier le template
Copy-Item ".env.local.example" -Destination ".env.local"

# Ouvrir et remplir avec VOS vraies valeurs
code .env.local
```

**Valeurs minimales requises:**
- `DATABASE_URL` - URL PostgreSQL/Neon
- `NEXTAUTH_SECRET` - Secret généré (voir ci-dessous)
- `STRIPE_SECRET_KEY` - Clé Stripe test
- `NEXTAUTH_URL` - `http://localhost:3000` (local)

**Générer NEXTAUTH_SECRET:**
```powershell
# Option 1: Avec OpenSSL
openssl rand -base64 32

# Option 2: Online
# https://generate-secret.vercel.app/32
```

### Étape 2: Créer le Vault chiffré (3 min)

```powershell
# Installer dotenv-vault
npm install -g dotenv-vault

# Créer le vault
npx dotenv-vault@latest new

# Ajouter les secrets du .env.local
npx dotenv-vault@latest push

# ✅ Fichiers créés:
# - .env.vault (chiffré, à committer) ✅
# - .env.keys (clés, à sauvegarder) 🔒
```

**⚠️ IMPORTANT:**
```powershell
# Sauvegarder .env.keys MAINTENANT
Copy-Item ".env.keys" -Destination "backups/.env.keys.backup.$(Get-Date -Format 'yyyyMMdd')"

# Ajouter à .gitignore
Add-Content ".gitignore" "`n.env.keys`n.env.local"

git status  # Vérifier que .env.keys et .env.local ne sont pas commitables
```

### Étape 3: Configurer Vercel (4 min)

```powershell
# Se connecter
npx vercel@latest auth login

# Ajouter les variables
npx vercel@latest env add DATABASE_URL --env production
npx vercel@latest env add NEXTAUTH_SECRET --env production
npx vercel@latest env add STRIPE_SECRET_KEY --env production

# Vérifier
npx vercel@latest env ls
```

### Étape 4: Configurer GitHub (3 min)

```powershell
# Se connecter si nécessaire
gh auth login

# Ajouter les secrets
gh secret set DATABASE_URL --body "votre-url"
gh secret set NEXTAUTH_SECRET --body "votre-secret"
gh secret set STRIPE_SECRET_KEY --body "votre-cle"

# Vérifier
gh secret list
```

---

## ✅ Vérifier que tout fonctionne

```powershell
# Test 1: Charger les variables locales
npx dotenv -e .env.local -- echo "✅ .env.local chargé"

# Test 2: Déchiffrer le vault
npx dotenv-vault@latest pull

# Test 3: Vérifier Vercel
npx vercel@latest env ls | grep -E "DATABASE|NEXTAUTH|STRIPE"

# Test 4: Vérifier GitHub
gh secret list | grep -E "DATABASE|NEXTAUTH|STRIPE"

# 🎉 Tout fonctionne!
```

---

## 🔐 Sécurité - Checklist Finale

- [ ] ✅ `.env.vault` présent dans Git
- [ ] ✅ `.env.keys` dans `.gitignore`
- [ ] ✅ `.env.local` dans `.gitignore`
- [ ] ✅ Backup `.env.keys` réalisé (backups/*)
- [ ] ✅ Variables Vercel configurées
- [ ] ✅ Secrets GitHub configurés
- [ ] ✅ 2FA activé sur Vercel
- [ ] ✅ 2FA activé sur GitHub

---

## 📚 Documentation Complète

Pour plus de détails, consultez:
- **ROADMAP_SECRETS_COMPLET.md** - Guide détaillé 
- **scripts/add-vault-secrets.ps1** - Script Vault
- **scripts/add-vercel-env.ps1** - Script Vercel
- **scripts/setup-secrets.ps1** - Script Master

---

## 🆘 Troubleshooting Rapide

**Problème: "dotenv-vault not found"**
```powershell
npm install -g dotenv-vault
```

**Problème: ".env.keys missing"**
```powershell
# Restaurer depuis backup
Copy-Item "backups/.env.keys.backup.*" -Destination ".env.keys"
```

**Problème: "Vercel not authenticated"**
```powershell
npx vercel@latest auth login
```

**Problème: "GitHub secrets not visible"**
```powershell
# Vérifier droits du repo
gh repo edit --enable-issues
gh secret list  # Doit marcher maintenant
```

---

## 📅 Maintenance

**Tous les 90 jours:** Rotation des secrets

```powershell
.\scripts\setup-secrets.ps1 -Phase rotate
```

**Tous les mois:** Vérification des services

```powershell
.\scripts\setup-secrets.ps1 -Phase check
```

**Après un changement:** Synchroniser Vault

```powershell
npx dotenv-vault@latest push
```

---

## 🎯 Résumé

| Élément | Committer? | Sauvegarder? |
|--------|-----------|-------------|
| `.env.vault` | ✅ OUI | - |
| `.env.keys` | ❌ NON | 🔒 OUI |
| `.env.local` | ❌ NON | - |
| Vercel secrets | ✅ Via Dashboard | - |
| GitHub secrets | ✅ Via Dashboard | - |

---

**Temps estimé: 15 minutes**  
**Difficulté: ⭐ Facile**  
**Status: 🟢 Production-Ready**

---

Pour questions: Consultez [ROADMAP_SECRETS_COMPLET.md](ROADMAP_SECRETS_COMPLET.md)
