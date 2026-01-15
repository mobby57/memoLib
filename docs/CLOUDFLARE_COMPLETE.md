# ☁️ Cloudflare - Déploiement Complet IA Poste Manager

## 📋 Guide Complet de Déploiement sur Cloudflare

**Date:** 14 janvier 2026  
**Status:** ✅ Production Ready

---

## 🎯 Architecture Cloudflare

```
┌─────────────────────────────────────────────────────────────┐
│                  CLOUDFLARE PLATFORM                         │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  🌐 Cloudflare Pages (Next.js SSG/ISR)                      │
│  ├─── Edge Rendering                                        │
│  ├─── Automatic HTTPS                                       │
│  └─── Global CDN (300+ PoPs)                               │
│                                                              │
│  🗄️ D1 Database (SQLite at Edge)                           │
│  ├─── Replicated globally                                   │
│  ├─── SQL-compatible                                        │
│  └─── Prisma integration                                    │
│                                                              │
│  💾 KV Storage (Cache & Sessions)                           │
│  ├─── Key-Value store                                       │
│  ├─── Low-latency reads                                     │
│  └─── Global replication                                    │
│                                                              │
│  📁 R2 Storage (Documents & Files)                          │
│  ├─── S3-compatible                                         │
│  ├─── Zero egress fees                                      │
│  └─── Unlimited storage                                     │
│                                                              │
│  🤖 Workers AI (Optional)                                   │
│  ├─── Llama models at edge                                  │
│  ├─── No GPU required                                       │
│  └─── Pay per request                                       │
│                                                              │
│  🔒 Cloudflare Tunnel (Secure Access)                       │
│  ├─── Zero Trust Network Access                             │
│  ├─── No open ports                                         │
│  └─── Automatic SSL                                         │
│                                                              │
│  📊 Web Analytics                                           │
│  └─── Privacy-focused metrics                               │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 📦 Partie 1 : Cloudflare Pages (Déploiement Application)

### 1.1 Installation Wrangler CLI

```powershell
# Installer Wrangler (Cloudflare CLI)
npm install -g wrangler

# Vérifier l'installation
wrangler --version

# Se connecter à Cloudflare
wrangler login
```

### 1.2 Configuration du Projet

Le fichier `wrangler.toml` est déjà configuré :

```toml
name = "iaposte-manager"
compatibility_date = "2025-01-07"
pages_build_output_dir = "out"

# Node.js compatibility
compatibility_flags = ["nodejs_compat"]

# D1 Database binding
[[d1_databases]]
binding = "iaposte_production_db"
database_name = "iaposte-production-db"
database_id = "a86c51c6-2031-4ae6-941c-db4fc917826c"

[vars]
NODE_ENV = "production"
NEXT_TELEMETRY_DISABLED = "1"
```

### 1.3 Créer la Base D1

```powershell
# Créer la base de données D1
wrangler d1 create iaposte-production-db

# Copier le database_id et l'ajouter dans wrangler.toml
# Réponse exemple :
# Created database iaposte-production-db (a86c51c6-2031-4ae6-941c-db4fc917826c)
```

### 1.4 Migrer le Schéma Prisma vers D1

```powershell
# Générer le schéma SQL depuis Prisma
npx prisma migrate diff `
  --from-empty `
  --to-schema-datamodel prisma/schema.prisma `
  --script > schema.sql

# Exécuter le schéma sur D1
wrangler d1 execute iaposte-production-db --file=schema.sql --remote
```

### 1.5 Build pour Production

Créer/modifier `next.config.ts` :

```typescript
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'export', // Static export pour Cloudflare Pages
  images: {
    unoptimized: true, // Cloudflare ne supporte pas l'optimisation d'images Next.js
  },
  // Désactiver les fonctionnalités serveur non supportées
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
};

export default nextConfig;
```

Build l'application :

```powershell
# Build pour export statique
npm run build

# Le dossier 'out' est généré
```

### 1.6 Déployer sur Cloudflare Pages

```powershell
# Déployer manuellement
wrangler pages deploy out --project-name=iaposte-manager

# Ou publier via GitHub Actions (voir section CI/CD)
```

### 1.7 Configurer les Variables d'Environnement

```powershell
# Ajouter les secrets via Dashboard ou CLI
wrangler pages secret put NEXTAUTH_SECRET --project-name=iaposte-manager
# Entrer la valeur : [VOTRE_SECRET_GENERE]

wrangler pages secret put DATABASE_URL --project-name=iaposte-manager
# Format D1 : d1://DATABASE_ID

# Autres secrets
wrangler pages secret put GITHUB_CLIENT_ID --project-name=iaposte-manager
wrangler pages secret put GITHUB_CLIENT_SECRET --project-name=iaposte-manager
```

---

## 🌐 Partie 2 : Cloudflare Tunnel (Développement Local)

### 2.1 Installation Cloudflared

```powershell
# Windows - Winget
winget install --id Cloudflare.cloudflared

# Vérifier
cloudflared --version
```

### 2.2 Mode Quick Tunnel (Temporaire)

```powershell
# Lancer le tunnel rapide
cloudflared tunnel --url http://localhost:3000

# Vous obtenez une URL publique temporaire :
# https://random-name-example.trycloudflare.com
```

**Avantages :**
- ✅ Aucune configuration
- ✅ Immédiat
- ✅ Parfait pour tests

**Inconvénients :**
- ⚠️ URL change à chaque redémarrage
- ⚠️ Non persistant

### 2.3 Tunnel Nommé (Permanent)

```powershell
# 1. Se connecter
cloudflared tunnel login

# 2. Créer un tunnel nommé
cloudflared tunnel create iaposte-manager

# 3. Créer config.yml dans %USERPROFILE%\.cloudflared\
@"
tunnel: TUNNEL_ID_ICI
credentials-file: C:\Users\moros\.cloudflared\TUNNEL_ID.json

ingress:
  - hostname: iaposte.example.com
    service: http://localhost:3000
  - service: http_status:404
"@ | Out-File -Encoding UTF8 $env:USERPROFILE\.cloudflared\config.yml

# 4. Créer un enregistrement DNS
cloudflared tunnel route dns iaposte-manager iaposte.example.com

# 5. Lancer le tunnel
cloudflared tunnel run iaposte-manager
```

### 2.4 Script PowerShell Automatisé

Le fichier `cloudflare-start.ps1` existe déjà :

```powershell
# Lancer avec :
.\cloudflare-start.ps1
```

---

## 🗄️ Partie 3 : D1 Database (Base de Données Edge)

### 3.1 Créer et Gérer D1

```powershell
# Lister les bases
wrangler d1 list

# Créer une base
wrangler d1 create iaposte-production-db

# Exécuter des queries
wrangler d1 execute iaposte-production-db --command "SELECT * FROM User LIMIT 10" --remote

# Exécuter un fichier SQL
wrangler d1 execute iaposte-production-db --file=schema.sql --remote
```

### 3.2 Migrations Prisma

Créer `scripts/migrate-to-d1.ps1` :

```powershell
# Script de migration Prisma → D1
Write-Host "🔄 Migration Prisma vers Cloudflare D1..." -ForegroundColor Cyan

# Générer le schéma SQL
Write-Host "1️⃣ Génération du schéma SQL..."
npx prisma migrate diff `
  --from-empty `
  --to-schema-datamodel prisma/schema.prisma `
  --script > migrations/d1-schema.sql

# Appliquer sur D1
Write-Host "2️⃣ Application sur D1..."
wrangler d1 execute iaposte-production-db --file=migrations/d1-schema.sql --remote

# Seed data (optionnel)
Write-Host "3️⃣ Insertion des données initiales..."
wrangler d1 execute iaposte-production-db --file=prisma/seed-d1.sql --remote

Write-Host "✅ Migration terminée!" -ForegroundColor Green
```

### 3.3 Backup D1

```powershell
# Export de la base
wrangler d1 export iaposte-production-db --output=backups/d1-backup-$(Get-Date -Format "yyyyMMdd").sql --remote

# Restauration
wrangler d1 execute iaposte-production-db --file=backups/d1-backup-20260114.sql --remote
```

---

## 📁 Partie 4 : R2 Storage (Documents)

### 4.1 Créer un Bucket R2

```powershell
# Créer le bucket
wrangler r2 bucket create iaposte-documents

# Lister les buckets
wrangler r2 bucket list
```

### 4.2 Configuration dans wrangler.toml

```toml
[[r2_buckets]]
binding = "DOCUMENTS"
bucket_name = "iaposte-documents"
```

### 4.3 Upload de Fichiers

```powershell
# Upload manuel
wrangler r2 object put iaposte-documents/test.txt --file=test.txt

# Lister les objets
wrangler r2 object list iaposte-documents

# Télécharger
wrangler r2 object get iaposte-documents/test.txt --file=downloaded.txt
```

### 4.4 Intégration dans l'Application

Créer `src/lib/cloudflare/r2.ts` :

```typescript
// Upload document vers R2
export async function uploadToR2(
  file: File,
  bucket: R2Bucket
): Promise<string> {
  const key = `documents/${Date.now()}-${file.name}`;
  
  await bucket.put(key, file.stream(), {
    httpMetadata: {
      contentType: file.type,
    },
  });
  
  return key;
}

// Download depuis R2
export async function getFromR2(
  key: string,
  bucket: R2Bucket
): Promise<ReadableStream | null> {
  const object = await bucket.get(key);
  return object?.body || null;
}
```

---

## 💾 Partie 5 : KV Storage (Cache & Sessions)

### 5.1 Créer un KV Namespace

```powershell
# Créer le namespace
wrangler kv:namespace create SESSIONS

# Production
wrangler kv:namespace create SESSIONS --preview=false

# Copier l'ID retourné
```

### 5.2 Configuration dans wrangler.toml

```toml
[[kv_namespaces]]
binding = "SESSIONS"
id = "votre-kv-namespace-id"
```

### 5.3 Utilisation KV

```typescript
// src/lib/cloudflare/kv.ts
export async function setSession(
  kv: KVNamespace,
  sessionId: string,
  data: any,
  ttl: number = 86400 // 24h
): Promise<void> {
  await kv.put(
    `session:${sessionId}`,
    JSON.stringify(data),
    { expirationTtl: ttl }
  );
}

export async function getSession(
  kv: KVNamespace,
  sessionId: string
): Promise<any | null> {
  const data = await kv.get(`session:${sessionId}`, 'json');
  return data;
}

export async function deleteSession(
  kv: KVNamespace,
  sessionId: string
): Promise<void> {
  await kv.delete(`session:${sessionId}`);
}
```

---

## 🤖 Partie 6 : Workers AI (IA à la Edge)

### 6.1 Activer Workers AI

```powershell
# Vérifier les modèles disponibles
wrangler ai models

# Modèles populaires :
# - @cf/meta/llama-3.2-3b-instruct
# - @cf/meta/llama-3-8b-instruct
# - @hf/mistralai/mistral-7b-instruct-v0.2
```

### 6.2 Configuration dans wrangler.toml

```toml
[ai]
binding = "AI"
```

### 6.3 Intégration Workers AI

Créer `src/lib/cloudflare/workers-ai.ts` :

```typescript
export async function generateWithWorkersAI(
  ai: Ai,
  prompt: string,
  systemPrompt?: string
): Promise<string> {
  const response = await ai.run('@cf/meta/llama-3.2-3b-instruct', {
    messages: [
      ...(systemPrompt ? [{ role: 'system', content: systemPrompt }] : []),
      { role: 'user', content: prompt }
    ],
    max_tokens: 2048,
    temperature: 0.7,
  });

  return response.response;
}

// Analyse de documents avec IA
export async function analyzeDocument(
  ai: Ai,
  documentText: string
): Promise<any> {
  const prompt = `Analyse ce document juridique CESEDA et extrais :
- Type de procédure
- Délais importants
- Actions requises

Document:
${documentText}`;

  return await generateWithWorkersAI(ai, prompt);
}
```

---

## 🚀 Partie 7 : CI/CD avec GitHub Actions

### 7.1 Workflow Cloudflare Pages

Le fichier `.github/workflows/cloudflare-pages.yml` existe déjà.

Vérifier la configuration :

```yaml
name: Deploy to Cloudflare Pages

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build
        run: npm run build
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
      
      - name: Deploy to Cloudflare Pages
        uses: cloudflare/pages-action@v1
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          projectName: iaposte-manager
          directory: out
```

### 7.2 Secrets GitHub Requis

Aller dans **Settings → Secrets and variables → Actions** :

| Secret | Où le trouver | Description |
|--------|---------------|-------------|
| `CLOUDFLARE_API_TOKEN` | [Dashboard → API Tokens](https://dash.cloudflare.com/profile/api-tokens) | Token avec permissions Pages:Edit |
| `CLOUDFLARE_ACCOUNT_ID` | [Dashboard](https://dash.cloudflare.com) → Account ID (à droite) | ID du compte Cloudflare |
| `DATABASE_URL` | Configuration D1 | `d1://DATABASE_ID` |
| `NEXTAUTH_SECRET` | Généré | Secret pour NextAuth |

#### Créer CLOUDFLARE_API_TOKEN

1. https://dash.cloudflare.com/profile/api-tokens
2. **Create Token**
3. Template **Edit Cloudflare Workers** OU custom avec :
   - `Account → Cloudflare Pages → Edit`
   - `Account → Cloudflare Workers Scripts → Edit`
4. **Continue to summary** → **Create Token**
5. Copier le token et l'ajouter dans GitHub Secrets

---

## 📊 Partie 8 : Monitoring et Analytics

### 8.1 Web Analytics

```html
<!-- Ajouter dans app/layout.tsx -->
<Script
  src="https://static.cloudflareinsights.com/beacon.min.js"
  data-cf-beacon='{"token": "VOTRE_TOKEN"}'
  strategy="afterInteractive"
/>
```

### 8.2 Logs et Debugging

```powershell
# Voir les logs Pages
wrangler pages deployment tail --project-name=iaposte-manager

# Logs D1
wrangler d1 execute iaposte-production-db --command "SELECT * FROM AuditLog ORDER BY timestamp DESC LIMIT 10" --remote
```

---

## 💰 Partie 9 : Tarification Cloudflare

### Free Tier (Gratuit)

| Service | Limite Gratuite |
|---------|-----------------|
| Pages | Builds illimités, 500 builds/mois |
| D1 | 5 GB stockage, 5M lectures/jour |
| R2 | 10 GB stockage, 10M requêtes/mois |
| KV | 1 GB stockage, 100k lectures/jour |
| Workers AI | $0.011 / 1k tokens (~730k tokens/mois) |
| Bandwidth | Illimité |

### Paid Plans

**Workers Paid ($5/mois) :**
- D1 : 50 GB stockage
- KV : 10 GB stockage
- R2 : 10 GB stockage (puis $0.015/GB)
- Workers AI : Pay-as-you-go à partir de $0.011/1k tokens

**Estimation Production :**
- Application moyenne : **$5-15/mois**
- Avec forte utilisation IA : **$20-50/mois**

---

## 🔧 Partie 10 : Scripts Utiles

### 10.1 Script de Déploiement Complet

Créer `deploy-cloudflare-full.ps1` :

```powershell
#!/usr/bin/env pwsh
# Script de déploiement complet Cloudflare

Write-Host "🚀 Déploiement Cloudflare - IA Poste Manager" -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan

# 1. Build
Write-Host "`n1️⃣ Build de l'application..." -ForegroundColor Yellow
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Erreur de build!" -ForegroundColor Red
    exit 1
}

# 2. Migration D1
Write-Host "`n2️⃣ Migration base de données D1..." -ForegroundColor Yellow
.\scripts\migrate-to-d1.ps1

# 3. Déploiement Pages
Write-Host "`n3️⃣ Déploiement sur Cloudflare Pages..." -ForegroundColor Yellow
wrangler pages deploy out --project-name=iaposte-manager

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Erreur de déploiement!" -ForegroundColor Red
    exit 1
}

# 4. Vérification
Write-Host "`n4️⃣ Vérification du déploiement..." -ForegroundColor Yellow
$url = "https://iaposte-manager.pages.dev"
Write-Host "🌐 URL: $url" -ForegroundColor Green

# 5. Tests post-déploiement
Write-Host "`n5️⃣ Tests de santé..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$url/api/health" -Method GET -TimeoutSec 10
    if ($response.StatusCode -eq 200) {
        Write-Host "✅ API Health OK" -ForegroundColor Green
    }
} catch {
    Write-Host "⚠️  API Health check échoué" -ForegroundColor Yellow
}

Write-Host "`n✅ Déploiement terminé avec succès!" -ForegroundColor Green
Write-Host "🌐 Application disponible sur: $url" -ForegroundColor Cyan
```

### 10.2 Script de Backup Automatique

Créer `backup-cloudflare.ps1` :

```powershell
#!/usr/bin/env pwsh
# Backup automatique Cloudflare

$date = Get-Date -Format "yyyyMMdd-HHmmss"
$backupDir = "backups/cloudflare"

# Créer le dossier
New-Item -ItemType Directory -Force -Path $backupDir | Out-Null

Write-Host "💾 Backup Cloudflare - $date" -ForegroundColor Cyan

# 1. Backup D1
Write-Host "1️⃣ Backup D1..." -ForegroundColor Yellow
wrangler d1 export iaposte-production-db --output="$backupDir/d1-$date.sql" --remote

# 2. Backup KV (si utilisé)
Write-Host "2️⃣ Backup KV..." -ForegroundColor Yellow
# wrangler kv:key list --binding=SESSIONS > "$backupDir/kv-keys-$date.json"

# 3. Liste R2 objects
Write-Host "3️⃣ Liste R2..." -ForegroundColor Yellow
wrangler r2 object list iaposte-documents > "$backupDir/r2-list-$date.json"

Write-Host "✅ Backup terminé: $backupDir" -ForegroundColor Green
```

---

## ✅ Checklist de Déploiement

### Avant le Premier Déploiement

- [ ] Compte Cloudflare créé
- [ ] Wrangler CLI installé et configuré (`wrangler login`)
- [ ] Base D1 créée
- [ ] Database ID ajouté dans `wrangler.toml`
- [ ] Schéma Prisma migré vers D1
- [ ] Secrets configurés (NEXTAUTH_SECRET, etc.)
- [ ] Build réussi (`npm run build`)

### Configuration GitHub Actions

- [ ] Repository GitHub créé
- [ ] Secrets GitHub configurés :
  - [ ] `CLOUDFLARE_API_TOKEN`
  - [ ] `CLOUDFLARE_ACCOUNT_ID`
  - [ ] `DATABASE_URL`
  - [ ] `NEXTAUTH_SECRET`
- [ ] Workflow `.github/workflows/cloudflare-pages.yml` présent
- [ ] Push sur branche `main` déclenche le déploiement

### Post-Déploiement

- [ ] Application accessible sur `*.pages.dev`
- [ ] API `/api/health` répond 200
- [ ] Base D1 accessible
- [ ] Authentification fonctionne
- [ ] Documents uploadables (si R2 configuré)
- [ ] Logs et monitoring configurés

### Domaine Personnalisé (Optionnel)

- [ ] Domaine ajouté dans Cloudflare
- [ ] DNS configuré (CNAME vers `*.pages.dev`)
- [ ] HTTPS/SSL activé
- [ ] Redirection HTTP → HTTPS

---

## 🆘 Dépannage

### Problème : Build échoue

```powershell
# Vérifier Node.js version
node --version  # Doit être >= 20

# Nettoyer et réinstaller
rm -r node_modules, package-lock.json
npm install

# Build en mode verbose
npm run build -- --verbose
```

### Problème : D1 non accessible

```powershell
# Vérifier la connexion
wrangler d1 execute iaposte-production-db --command "SELECT 1" --remote

# Re-migrer si nécessaire
.\scripts\migrate-to-d1.ps1
```

### Problème : Secrets non reconnus

```powershell
# Lister les secrets
wrangler pages secret list --project-name=iaposte-manager

# Supprimer et recréer
wrangler pages secret delete NEXTAUTH_SECRET --project-name=iaposte-manager
wrangler pages secret put NEXTAUTH_SECRET --project-name=iaposte-manager
```

---

## 📚 Ressources

- [Cloudflare Pages Docs](https://developers.cloudflare.com/pages/)
- [D1 Database Docs](https://developers.cloudflare.com/d1/)
- [R2 Storage Docs](https://developers.cloudflare.com/r2/)
- [Workers AI Docs](https://developers.cloudflare.com/workers-ai/)
- [Wrangler CLI Docs](https://developers.cloudflare.com/workers/wrangler/)
- [Next.js on Cloudflare](https://developers.cloudflare.com/pages/framework-guides/nextjs/)

---

## 🎉 Conclusion

Votre application **IA Poste Manager** est maintenant prête pour Cloudflare ! 🚀

**Avantages Cloudflare :**
- ✅ Déploiement global instantané (300+ PoPs)
- ✅ Coût minimal (gratuit jusqu'à 500 builds/mois)
- ✅ Performance maximale (Edge Computing)
- ✅ Sécurité intégrée (DDoS, WAF, SSL)
- ✅ Scalabilité automatique

**Commandes essentielles :**

```powershell
# Build et déploiement
npm run build
wrangler pages deploy out --project-name=iaposte-manager

# Migration D1
.\scripts\migrate-to-d1.ps1

# Backup
.\backup-cloudflare.ps1

# Monitoring
wrangler pages deployment tail --project-name=iaposte-manager
```

**Support :** Pour toute question, consultez [Cloudflare Developers Discord](https://discord.gg/cloudflaredev)
