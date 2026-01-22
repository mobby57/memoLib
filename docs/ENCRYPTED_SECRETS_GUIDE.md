# 🔐 Gestion des Secrets Chiffrés - Guide Complet

**Date**: 21 janvier 2026  
**Version**: 1.0  
**Responsable**: DPO + Ops  

---

## 🎯 Vue d'ensemble

Ce guide explique comment **chiffrer les secrets sensibles** (database, API keys, tokens) avec **dotenv-vault** pour une collaboration sécurisée en équipe.

**Problème résolu:**
- ❌ AVANT: `.env.local` en clair, risque de fuite Git
- ✅ APRÈS: `.env.vault` chiffré, clés stockées dans gestionnaire de secrets

---

## 📋 Concepts clés

### **Fichiers impliqués**

| Fichier | Contenu | Git? | Qui? | Sécurité |
|---------|---------|------|------|----------|
| `.env.vault` | Secrets **chiffrés** | ✅ OUI | Tous | SHA256 |
| `.env.keys` | Clé de **déchiffrement** | ❌ NON | Admin | Vault |
| `.env.local` | Déchiffré après `decrypt` | ❌ NON (.gitignore) | Dev local | RAM |
| `prod.env` | Prod (via Vercel/Cloudflare) | ✅ OUI | Infra | Managed |

### **Flux de données**

```
Admin génère clé
    ↓
dotenv-vault encrypt (chiffre les secrets)
    ↓
.env.vault créé (à committer ✓)
↙                            ↘
.env.keys (⚠️ secret)      Distribuer aux devs via Vault
    ↓                            ↓
Devs obtiennent clé         Devs ajoutent à .env.keys
    ↓                            ↓
dotenv-vault decrypt        App lit .env.local
    ↓                            ↓
.env.local (local only)     Démarrage secure ✅
```

---

## 🚀 Étape 1: Installation initiale

### **1.1 Exécuter le script de setup**

```powershell
.\scripts\setup-encrypted-secrets.ps1
```

Ce script :
- ✅ Installe `dotenv-vault` globalement
- ✅ Génère une clé master aléatoire de 32 chars
- ✅ Crée `.env.vault` (template vide)
- ✅ Crée `.env.keys` (contient la clé master)
- ✅ Ajoute `.env.keys` à `.gitignore`

### **1.2 Sauvegarder la clé master**

Après exécution du script, vous verrez :

```
🔑 Votre clé master:
  DOTENV_KEY=aBcDeFgHiJkLmNoPqRsTuVwXyZ123456
```

**FAIRE IMMÉDIATEMENT:**
1. Copier la clé complète (ex: `aBcDeFgHiJkLmNoPqRsTuVwXyZ123456`)
2. Enregistrer dans **1Password / Dashlane / Bitwarden / Azure Key Vault**
3. Titrer la note: `[IA POSTE] dotenv-vault DOTENV_KEY - Master`
4. **NE PAS** la laisser en clair sur l'ordi

---

## 🔒 Étape 2: Ajouter les secrets

### **2.1 Mode interactif (recommandé)**

```bash
npx dotenv-vault encrypt
```

Le CLI vous demande :
1. Nom du secret (ex: `DATABASE_URL`)
2. Valeur (ex: `postgresql://user:pass@localhost/db`)
3. Chiffrement automatique

Résultat: `.env.vault` mis à jour avec le secret chiffré.

### **2.2 Mode fichier (batch)**

Créer `secrets-to-add.env`:
```
DATABASE_URL=postgresql://user:pass@localhost/iapostemanage
NEXTAUTH_SECRET=super_secret_token_12345
STRIPE_SECRET_KEY=sk_live_xxxxxxxx
AZURE_AD_CLIENT_SECRET=client_secret_value
GITHUB_CLIENT_SECRET=ghp_xxxxx
```

Puis :
```bash
cat secrets-to-add.env | npx dotenv-vault encrypt --file .env.vault
rm secrets-to-add.env  # Supprimer après
```

### **2.3 Modifier un secret existant**

```bash
npx dotenv-vault encrypt  # Répondre "oui" pour overwrite
```

Ou éditer directement `.env.vault` (mais recompilez après):
```bash
npx dotenv-vault rekey
```

---

## 🔓 Étape 3: Déchiffrer localement (pour développeurs)

### **3.1 Récupérer la clé master**

1. Demander au DPO/Admin via Slack
2. Copier depuis gestionnaire de secrets (1Password, etc.)
3. La clé ressemble à: `aBcDeFgHiJkLmNoPqRsTuVwXyZ123456`

### **3.2 Créer `.env.keys` local**

```bash
# Créer le fichier
echo "DOTENV_KEY=<clé_reçue>" > .env.keys

# Ex:
echo "DOTENV_KEY=aBcDeFgHiJkLmNoPqRsTuVwXyZ123456" > .env.keys
```

**⚠️ ATTENTION:** `.env.keys` est dans `.gitignore`, ne pas committer!

### **3.3 Déchiffrer**

```bash
# Auto (utilise .env.keys)
npx dotenv-vault decrypt

# Ou avec clé explicite
npx dotenv-vault decrypt --key aBcDeFgHiJkLmNoPqRsTuVwXyZ123456
```

Résultat: Génère `.env.local` avec tous les secrets en clair.

### **3.4 Vérifier le déchiffrement**

```bash
cat .env.local | grep DATABASE_URL
# Output: DATABASE_URL=postgresql://user:pass@localhost/iapostemanage ✓
```

---

## 🌐 Étape 4: Configuration en Production

### **4.1 Vercel**

```bash
# Copier chaque secret depuis .env.local
# vers Settings → Environment Variables

# Exemple:
DATABASE_URL → Paste value
NEXTAUTH_SECRET → Paste value
STRIPE_SECRET_KEY → Paste value
```

Vercel gère l'encryption automatiquement. ✅

### **4.2 Cloudflare Pages / Workers**

```bash
wrangler secret put DATABASE_URL
wrangler secret put NEXTAUTH_SECRET
wrangler secret put STRIPE_SECRET_KEY
```

Les secrets sont stockés dans Cloudflare's encrypted vault. ✅

### **4.3 Docker (local)**

```bash
# Dans docker-compose.yml, utiliser .env
# ou passer secrets via environment:
environment:
  - DATABASE_URL=${DATABASE_URL}
  - NEXTAUTH_SECRET=${NEXTAUTH_SECRET}
```

Puis au lancement:
```bash
docker compose up --env-file .env.local
```

---

## 🔄 Étape 5: Rotation des secrets

### **Quand rotater?**
- ❌ Soupçon d'une fuite (GitHub, Slack, email)
- ✅ Tous les 90 jours (bonnes pratiques)
- ✅ Après départ d'un développeur

### **Comment rotater**

**1. Générer une nouvelle clé**
```bash
.\scripts\setup-encrypted-secrets.ps1  # Re-exécuter
# Cela génère une nouvelle DOTENV_KEY
```

**2. Sauvegarde: Archiver l'ancienne clé**
```
[1Password] 
Note: [IA POSTE] dotenv-vault DOTENV_KEY - Master (ROTATED 2026-01-21)
Ajouter en archive
```

**3. Notifier l'équipe**
- Slack: `@team: Rotation des secrets effectuée. Nouvelle clé en 1Password.`
- Chacun exécute: `npx dotenv-vault decrypt --key <nouvelle_clé>`

**4. Prod: Mettre à jour les variables**
- Vercel: Settings → Env vars → Paste new values
- Cloudflare: `wrangler secret put <name>`

---

## 🛡️ Sécurité & Audit

### **Bonnes pratiques**

| Action | ✅ BON | ❌ MAUVAIS |
|--------|--------|-----------|
| Partage clé | 1Password, Slack ephemeral | Email, GitHub issue |
| Stockage `.env.keys` | Local `.gitignore` | Committé en Git |
| Stockage `.env.vault` | Committé (chiffré ✓) | Jamais en Git (❌) |
| `.env.local` | Local only, `.gitignore` | Committer (❌) |
| Accès admin | Limité (1-2 personnes) | Tous les devs |
| Logs | Masquer secrets avant log | Logger en clair (❌) |

### **Audit trail**

Documenter dans `docs/OPERATIONS_LOG.md`:

```markdown
## Secrets Management

| Date | Action | Admin | Raison | Clé | Status |
|------|--------|-------|--------|-----|--------|
| 2026-01-21 | Create | DPO | Initial setup | aBcDe... | ✅ |
| 2026-04-20 | Rotate | DPO | 90-day rotation | cDeFg... | ✅ |
| 2026-06-15 | Rotate | Admin | Dev left company | eFgHi... | ✅ |
```

### **Incident response (fuite suspectée)**

```
1. STOP: Révoquer immédiatement les secrets compromis
   - Stripe: Dashboard → API Keys → Revoke
   - Azure: App registrations → Certificates & secrets → Delete
   - GitHub: Settings → Developer → Revoke token

2. GENERATE: Nouvelles clés/tokens
   - Créer nouveau DOTENV_KEY (script)
   - Réessuer Stripe API keys
   - Créer Azure secrets

3. UPDATE: Partout où la clé est utilisée
   - .env.vault (re-encrypt avec nouvelle clé)
   - .env.keys (nouveau fichier)
   - Vercel env vars
   - Cloudflare secrets
   - 1Password vault (archiver l'ancienne)

4. NOTIFY: Équipe + clients (si applicable)
   - Slack: Annonce de la rotation
   - Email: Dev team notification
   - DPO: Escalade si données compromises

5. DOCUMENT: Incident report
   - Quand découvert
   - Quels secrets affectés
   - Actions correctrices
   - Timeline complète
```

---

## 📖 Commandes de référence

```bash
# Setup initial
.\scripts\setup-encrypted-secrets.ps1

# Ajouter un secret (interactif)
npx dotenv-vault encrypt

# Déchiffrer localement
npx dotenv-vault decrypt --key <clé>

# Vérifier état des secrets
npx dotenv-vault status

# Re-chiffrer avec nouvelle clé
npx dotenv-vault rekey

# Voir les secrets en clair (dangereux!)
cat .env.local

# Vercel
vercel env ls
vercel env add <name> <value>

# Cloudflare
wrangler secret list
wrangler secret put <name>
wrangler secret delete <name>
```

---

## 🎓 Checklists

### **Pour un nouveau développeur**

- [ ] Cloner le repo: `git clone ...`
- [ ] Demander clé master via 1Password
- [ ] Créer `.env.keys` avec la clé reçue
- [ ] Exécuter: `npx dotenv-vault decrypt`
- [ ] Vérifier: `cat .env.local | head -5` (contient secrets ✓)
- [ ] Lancer: `npm run dev`
- [ ] ✅ Prêt à développer

### **Pour rouler les secrets (admin)**

- [ ] Générer nouvelle clé: `.\scripts\setup-encrypted-secrets.ps1`
- [ ] Sauvegarder dans 1Password
- [ ] Notifier team sur Slack
- [ ] Chaque dev re-déchiffre avec nouvelle clé
- [ ] Vercel: Update env vars manuellement
- [ ] Cloudflare: Re-put les secrets
- [ ] Prod: Vérifier que les apps démarrent ✓
- [ ] Archive: Documenter dans OPERATIONS_LOG.md

---

## 📞 Support & Contacts

- **DPO / Secrets Manager**: `dpo@iapostemanager.com`
- **Incident de sécurité**: `security@iapostemanager.com`
- **GitHub Issues**: `#secrets-management` tag

---

## 📚 Ressources supplémentaires

- [dotenv-vault Official Docs](https://www.dotenv.org/docs/security/encryption)
- [OWASP: Secrets Management](https://owasp.org/www-project-nodejs-top-10/2023/A02_2023-Broken_Authentication)
- [1Password for Teams Setup](https://support.1password.com/teams/)
- [Vault by HashiCorp (Advanced)](https://www.vaultproject.io/)

---

**Créé**: 21 janvier 2026  
**Mise à jour**: En continu selon incidents/audits
