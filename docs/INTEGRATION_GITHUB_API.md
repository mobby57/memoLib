# 🚀 Intégration API REST GitHub - IA Poste Manager

**Date:** 22 janvier 2026  
**Version:** 1.0  
**Statut:** Production Ready ✅

---

## 📋 Table des Matières

1. [Vue d'ensemble](#vue-densemble)
2. [Authentification GitHub](#authentification-github)
3. [Points de terminaison utilisés](#points-de-terminaison-utilisés)
4. [Implémentation actuelle](#implémentation-actuelle)
5. [Opportunités d'amélioration](#opportunités-damélioration)
6. [Guide d'utilisation](#guide-dutilisation)
7. [Sécurité & Bonnes pratiques](#sécurité--bonnes-pratiques)

---

## 🎯 Vue d'ensemble

IA Poste Manager utilise l'**API REST GitHub** pour :
- ✅ Automatiser les déploiements via GitHub Actions
- ✅ Gérer les artefacts de build (upload/download)
- ✅ Configurer les secrets et variables d'environnement
- ✅ Interagir avec CodeQL pour la sécurité (Trivy scans)
- ✅ Déclencher des workflows programmatiquement

### Architecture d'intégration

```
┌─────────────────────────────────────────────────┐
│           IA Poste Manager (Next.js)            │
└────────────────────┬────────────────────────────┘
                     │
         ┌───────────┴───────────┐
         │                       │
    ┌────▼────┐           ┌──────▼─────┐
    │ GitHub  │           │ Cloudflare │
    │ Actions │◄──────────┤   Pages    │
    └────┬────┘           └────────────┘
         │
    ┌────▼────────────────────────────┐
    │  GitHub API REST (2022-11-28)   │
    ├──────────────────────────────────┤
    │ • Actions (artifacts, secrets)  │
    │ • Deployments (status, logs)    │
    │ • Code Scanning (CodeQL, SARIF) │
    │ • Repositories (commits, PRs)   │
    └─────────────────────────────────┘
```

---

## 🔐 Authentification GitHub

### 1. **GITHUB_TOKEN (Automatique dans Actions)**

**Type:** Jeton temporaire auto-généré  
**Durée:** Durée du workflow uniquement  
**Permissions:** Configurables via `permissions:` dans le workflow

**Exemple d'utilisation:**

```yaml
# .github/workflows/example.yml
jobs:
  build:
    runs-on: ubuntu-latest
    permissions:
      contents: read          # Lire le code
      actions: read           # Lire les artefacts
      security-events: write  # Écrire les résultats CodeQL
    
    steps:
      - uses: actions/checkout@v4
      
      # Authentification automatique
      - name: Upload SARIF results
        uses: github/codeql-action/upload-sarif@v4
        with:
          sarif_file: results.sarif
          token: ${{ secrets.GITHUB_TOKEN }}  # ✅ Auto-fourni
```

**Actuellement utilisé dans:**
- ✅ `cloudflare-pages.yml` → Checkout et Wrangler
- ✅ `trivy-scan.yml` → Upload résultats SARIF (4 jobs)
- ✅ `ci-cd-advanced.yml` → Gestion artefacts + déploiement

---

### 2. **Secrets personnalisés (manuels)**

**Type:** Jetons configurés manuellement  
**Localisation:** GitHub Settings → Secrets → Actions  
**Persistance:** Permanents jusqu'à suppression

**Secrets configurés actuellement:**

| Secret                 | Usage                        | Workflow                |
|------------------------|------------------------------|-------------------------|
| `CLOUDFLARE_API_TOKEN` | Déploiement Cloudflare Pages | `cloudflare-pages.yml`  |
| `CLOUDFLARE_ACCOUNT_ID`| Identification compte        | `cloudflare-pages.yml`  |
| `NEXTAUTH_SECRET`      | Authentification Next.js     | Tous les workflows      |

**Exemple d'utilisation:**

```yaml
- name: Deploy to Cloudflare
  run: npx wrangler pages deploy .next
  env:
    CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
    CLOUDFLARE_ACCOUNT_ID: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
```

---

### 3. **Personal Access Token (PAT)**

**Type:** Jeton créé manuellement par l'utilisateur  
**Cas d'usage:** Actions nécessitant accès étendu (créer releases, modifier workflows)  
**Scopes recommandés:** `repo`, `workflow`, `write:packages`

**Création:**
1. GitHub → Settings → Developer Settings → Personal Access Tokens → Tokens (classic)
2. Generate new token
3. Sélectionner scopes: `repo`, `workflow`, `admin:repo_hook`
4. Copier le token
5. Ajouter dans GitHub Secrets: `GH_PAT` ou `PERSONAL_ACCESS_TOKEN`

**Exemple (si nécessaire):**

```yaml
- name: Create GitHub Release
  uses: actions/create-release@v1
  env:
    GITHUB_TOKEN: ${{ secrets.GH_PAT }}  # PAT requis pour releases
  with:
    tag_name: v${{ github.run_number }}
    release_name: Release ${{ github.run_number }}
```

---

## 📊 Points de terminaison utilisés

### **Actions API**

#### 1. **Artifacts** (`/repos/{owner}/{repo}/actions/artifacts`)

**Usage actuel:**
- Upload artefacts build Next.js (`.next/`)
- Download artefacts pour déploiement
- Gestion rétention (3 jours)

**Endpoints:**
```
GET  /repos/mobby57/iapostemanager/actions/artifacts
GET  /repos/mobby57/iapostemanager/actions/artifacts/{artifact_id}
POST /repos/mobby57/iapostemanager/actions/artifacts/{artifact_id}/zip
DELETE /repos/mobby57/iapostemanager/actions/artifacts/{artifact_id}
```

**Implémentation:**

```yaml
# Upload
- uses: actions/upload-artifact@v4
  with:
    name: build-${{ github.sha }}
    path: .next/
    retention-days: 3
    if-no-files-found: error

# Download
- uses: actions/download-artifact@v4
  with:
    name: build-${{ github.sha }}
    path: .next/
```

---

#### 2. **Secrets** (`/repos/{owner}/{repo}/actions/secrets`)

**Usage potentiel:**
- Lister les secrets configurés
- Créer/modifier secrets programmatiquement
- Rotation automatique de secrets

**Endpoints:**
```
GET    /repos/mobby57/iapostemanager/actions/secrets
GET    /repos/mobby57/iapostemanager/actions/secrets/{secret_name}
PUT    /repos/mobby57/iapostemanager/actions/secrets/{secret_name}
DELETE /repos/mobby57/iapostemanager/actions/secrets/{secret_name}
```

**Exemple (rotation automatique NEXTAUTH_SECRET):**

```typescript
// scripts/rotate-nextauth-secret.ts
import { Octokit } from '@octokit/rest';

const octokit = new Octokit({ auth: process.env.GH_PAT });

async function rotateSecret() {
  const newSecret = generateSecureSecret(); // Votre fonction
  
  await octokit.actions.createOrUpdateRepoSecret({
    owner: 'mobby57',
    repo: 'iapostemanager',
    secret_name: 'NEXTAUTH_SECRET',
    encrypted_value: await encryptSecret(newSecret), // Chiffrement requis
  });
  
  console.log('✅ NEXTAUTH_SECRET rotated successfully');
}
```

---

#### 3. **Workflow Runs** (`/repos/{owner}/{repo}/actions/runs`)

**Usage actuel:**
- Monitoring automatique de workflows
- Logs de déploiement
- Statuts de build

**Endpoints:**
```
GET  /repos/mobby57/iapostemanager/actions/runs
GET  /repos/mobby57/iapostemanager/actions/runs/{run_id}
POST /repos/mobby57/iapostemanager/actions/runs/{run_id}/rerun
POST /repos/mobby57/iapostemanager/actions/runs/{run_id}/cancel
```

**Exemple (monitoring dashboard):**

```typescript
// app/api/admin/workflows/route.ts
import { NextResponse } from 'next/server';
import { Octokit } from '@octokit/rest';

export async function GET() {
  const octokit = new Octokit({ auth: process.env.GH_PAT });
  
  const { data } = await octokit.actions.listWorkflowRunsForRepo({
    owner: 'mobby57',
    repo: 'iapostemanager',
    per_page: 10,
  });
  
  return NextResponse.json({
    runs: data.workflow_runs.map(run => ({
      id: run.id,
      name: run.name,
      status: run.status,
      conclusion: run.conclusion,
      created_at: run.created_at,
      html_url: run.html_url,
    })),
  });
}
```

---

### **Code Scanning API**

#### **CodeQL / SARIF Upload** (`/repos/{owner}/{repo}/code-scanning/sarifs`)

**Usage actuel:**
- Upload résultats Trivy (4 jobs: dependencies, docker, config, secrets)
- Intégration GitHub Security tab

**Workflow actuel:**

```yaml
# .github/workflows/trivy-scan.yml
- name: Upload SARIF to GitHub Security
  uses: github/codeql-action/upload-sarif@v4
  with:
    sarif_file: trivy-results.sarif
    token: ${{ secrets.GITHUB_TOKEN }}  # ✅ Permissions: security-events: write
    category: trivy-dependencies
```

**Endpoints:**
```
POST /repos/mobby57/iapostemanager/code-scanning/sarifs
GET  /repos/mobby57/iapostemanager/code-scanning/alerts
GET  /repos/mobby57/iapostemanager/code-scanning/analyses
```

**Exemple (récupérer alertes):**

```typescript
const { data: alerts } = await octokit.codeScanning.listAlertsForRepo({
  owner: 'mobby57',
  repo: 'iapostemanager',
  state: 'open',
  severity: 'critical',
});

console.log(`🚨 ${alerts.length} alertes critiques trouvées`);
```

---

### **Deployments API**

#### **Statuts de déploiement** (`/repos/{owner}/{repo}/deployments`)

**Usage potentiel:**
- Créer marqueurs de déploiement
- Notifier statut Cloudflare
- Historique déploiements

**Endpoints:**
```
POST /repos/mobby57/iapostemanager/deployments
POST /repos/mobby57/iapostemanager/deployments/{deployment_id}/statuses
GET  /repos/mobby57/iapostemanager/deployments
```

**Exemple (créer déploiement):**

```typescript
// Dans workflow Cloudflare
const { data: deployment } = await octokit.repos.createDeployment({
  owner: 'mobby57',
  repo: 'iapostemanager',
  ref: process.env.GITHUB_SHA,
  environment: 'production',
  description: 'Deploy to Cloudflare Pages',
});

// Après succès
await octokit.repos.createDeploymentStatus({
  owner: 'mobby57',
  repo: 'iapostemanager',
  deployment_id: deployment.id,
  state: 'success',
  environment_url: 'https://9fd537bc.iapostemanage.pages.dev',
  description: 'Deployed successfully to Cloudflare',
});
```

---

## 🛠️ Implémentation actuelle

### **Workflow 1: Cloudflare Pages Deploy**

```yaml
# .github/workflows/cloudflare-pages.yml
name: 🚀 Deploy to Cloudflare Pages

on:
  push:
    branches: [main, develop]  # ✅ Fixed from multitenant-render
  workflow_dispatch:

jobs:
  deploy:
    runs-on: ubuntu-latest
    permissions:
      contents: read  # ✅ GITHUB_TOKEN pour checkout
    
    steps:
      - uses: actions/checkout@v4
      
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci --legacy-peer-deps
      
      - name: Generate Prisma Client
        run: npx prisma generate
      
      - name: Build Next.js
        run: npm run build
        env:
          DATABASE_URL: file:./dev.db  # Build-time only
      
      - name: Deploy to Cloudflare
        run: npx wrangler pages deploy .next
        env:
          CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}  # ✅ Secret manuel
          CLOUDFLARE_ACCOUNT_ID: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
```

**API GitHub utilisée:**
- `actions/checkout@v4` → Implicit API call pour clone repo
- `actions/setup-node@v4` → Download Node.js binary
- **Pas d'upload artifact** (déploiement direct)

---

### **Workflow 2: Trivy Security Scan**

```yaml
# .github/workflows/trivy-scan.yml (extrait)
jobs:
  scan-dependencies:
    permissions:
      contents: read
      security-events: write  # ✅ Required pour upload SARIF
    
    steps:
      - name: Run Trivy scanner
        uses: aquasecurity/trivy-action@master
        with:
          scan-type: 'fs'
          format: 'sarif'
          output: 'trivy-results.sarif'
      
      - name: Upload to GitHub Security
        uses: github/codeql-action/upload-sarif@v4  # ✅ Fixed v3→v4
        with:
          sarif_file: trivy-results.sarif
          token: ${{ secrets.GITHUB_TOKEN }}  # ✅ Explicit token required v4
          category: trivy-dependencies
```

**API GitHub utilisée:**
- `/repos/{owner}/{repo}/code-scanning/sarifs` → Upload SARIF
- GitHub Security tab → Affichage résultats

---

### **Workflow 3: Advanced CI/CD**

```yaml
# .github/workflows/ci-cd-advanced.yml (extrait)
jobs:
  build:
    steps:
      - name: Build Next.js
        run: npm run build
      
      - name: ✅ Verify Build Output  # ✅ Enhancement
        id: verify_build
        run: |
          if [ -d ".next" ]; then
            echo "build_exists=true" >> $GITHUB_OUTPUT
          fi
      
      - name: 📤 Upload Build Artifacts
        uses: actions/upload-artifact@v4
        with:
          name: build-${{ github.sha }}
          path: .next/
          retention-days: 3
          if-no-files-found: error  # ✅ Strict error handling
  
  deploy-production:
    needs: build
    steps:
      - name: 📥 Download Build (with fallback)  # ✅ Enhancement
        id: download_build
        continue-on-error: true
        uses: actions/download-artifact@v4
        with:
          name: build-${{ github.sha }}
      
      - name: 🔄 Fallback: Rebuild if artifact missing  # ✅ Enhancement
        if: steps.download_build.outcome == 'failure'
        run: |
          npm ci --legacy-peer-deps
          npx prisma generate
          npm run build
      
      - name: 🚀 Deploy with retry  # ✅ Enhancement (3 attempts)
        run: |
          if ! wrangler pages deploy .next; then
            sleep 5
            if ! wrangler pages deploy .next; then
              sleep 10
              wrangler pages deploy .next
            fi
          fi
```

**API GitHub utilisée:**
- `actions/upload-artifact@v4` → `/repos/{owner}/{repo}/actions/artifacts`
- `actions/download-artifact@v4` → `/repos/{owner}/{repo}/actions/artifacts/{id}/zip`

---

## 💡 Opportunités d'amélioration

### **1. Dashboard de monitoring avancé**

**Objectif:** Page admin temps réel des déploiements

**Implémentation:**

```typescript
// app/admin/deployments/page.tsx
'use client';

import { useEffect, useState } from 'react';

export default function DeploymentsPage() {
  const [runs, setRuns] = useState([]);
  
  useEffect(() => {
    fetch('/api/admin/github/workflow-runs')
      .then(res => res.json())
      .then(data => setRuns(data.runs));
  }, []);
  
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">📊 Déploiements GitHub Actions</h1>
      
      <div className="space-y-4">
        {runs.map(run => (
          <div key={run.id} className="border p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold">{run.name}</h3>
                <p className="text-sm text-gray-600">{run.created_at}</p>
              </div>
              
              <div className="flex gap-2">
                {run.status === 'completed' && run.conclusion === 'success' ? (
                  <span className="px-3 py-1 bg-green-100 text-green-800 rounded">✅ Success</span>
                ) : run.status === 'in_progress' ? (
                  <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded">⏳ Running</span>
                ) : (
                  <span className="px-3 py-1 bg-red-100 text-red-800 rounded">❌ Failed</span>
                )}
                
                <a href={run.html_url} target="_blank" className="px-3 py-1 bg-gray-100 rounded hover:bg-gray-200">
                  Voir logs →
                </a>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

**API Route:**

```typescript
// app/api/admin/github/workflow-runs/route.ts
import { NextResponse } from 'next/server';
import { Octokit } from '@octokit/rest';

export async function GET() {
  const octokit = new Octokit({ auth: process.env.GH_PAT });
  
  const { data } = await octokit.actions.listWorkflowRunsForRepo({
    owner: 'mobby57',
    repo: 'iapostemanager',
    per_page: 20,
  });
  
  return NextResponse.json({
    runs: data.workflow_runs.map(run => ({
      id: run.id,
      name: run.name,
      status: run.status,
      conclusion: run.conclusion,
      created_at: run.created_at,
      updated_at: run.updated_at,
      html_url: run.html_url,
    })),
  });
}
```

---

### **2. Déploiements automatiques via API**

**Objectif:** Déclencher redéploiement depuis l'interface admin

**Implémentation:**

```typescript
// app/api/admin/deploy/trigger/route.ts
import { NextResponse } from 'next/server';
import { Octokit } from '@octokit/rest';

export async function POST() {
  const octokit = new Octokit({ auth: process.env.GH_PAT });
  
  // Trigger workflow_dispatch
  await octokit.actions.createWorkflowDispatch({
    owner: 'mobby57',
    repo: 'iapostemanager',
    workflow_id: 'cloudflare-pages.yml',
    ref: 'main',
    inputs: {
      environment: 'production',
      reason: 'Manual deployment from admin panel',
    },
  });
  
  return NextResponse.json({
    success: true,
    message: 'Déploiement lancé avec succès',
  });
}
```

**UI Component:**

```tsx
<button
  onClick={async () => {
    const res = await fetch('/api/admin/deploy/trigger', {
      method: 'POST',
    });
    const data = await res.json();
    alert(data.message);
  }}
  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
>
  🚀 Déployer maintenant
</button>
```

---

### **3. Rotation automatique de secrets**

**Objectif:** Rotation mensuelle `NEXTAUTH_SECRET`

**Implémentation:**

```typescript
// scripts/rotate-secrets.ts
import { Octokit } from '@octokit/rest';
import crypto from 'crypto';
import sodium from 'libsodium-wrappers';

const octokit = new Octokit({ auth: process.env.GH_PAT });

async function rotateNextAuthSecret() {
  // 1. Générer nouveau secret
  const newSecret = crypto.randomBytes(32).toString('base64');
  
  // 2. Récupérer clé publique du repo
  const { data: { key_id, key } } = await octokit.actions.getRepoPublicKey({
    owner: 'mobby57',
    repo: 'iapostemanager',
  });
  
  // 3. Chiffrer le secret
  await sodium.ready;
  const messageBytes = Buffer.from(newSecret);
  const keyBytes = Buffer.from(key, 'base64');
  const encryptedBytes = sodium.crypto_box_seal(messageBytes, keyBytes);
  const encrypted_value = Buffer.from(encryptedBytes).toString('base64');
  
  // 4. Mettre à jour le secret
  await octokit.actions.createOrUpdateRepoSecret({
    owner: 'mobby57',
    repo: 'iapostemanager',
    secret_name: 'NEXTAUTH_SECRET',
    encrypted_value,
    key_id,
  });
  
  console.log('✅ NEXTAUTH_SECRET rotated successfully');
  
  // 5. Mettre à jour Cloudflare Pages
  // TODO: Intégrer Cloudflare API pour sync
}

rotateNextAuthSecret();
```

**Cronjob GitHub Actions:**

```yaml
# .github/workflows/rotate-secrets.yml
name: 🔐 Rotate Secrets

on:
  schedule:
    - cron: '0 0 1 * *'  # 1er jour de chaque mois à minuit
  workflow_dispatch:

jobs:
  rotate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      
      - name: Install dependencies
        run: npm install @octokit/rest libsodium-wrappers
      
      - name: Rotate secrets
        run: npx tsx scripts/rotate-secrets.ts
        env:
          GH_PAT: ${{ secrets.GH_PAT }}
```

---

### **4. Intégration GitHub Releases**

**Objectif:** Créer releases automatiques à chaque déploiement

**Workflow ajout:**

```yaml
# .github/workflows/cloudflare-pages.yml (ajout)
- name: Create GitHub Release
  if: github.ref == 'refs/heads/main'
  uses: actions/create-release@v1
  env:
    GITHUB_TOKEN: ${{ secrets.GH_PAT }}
  with:
    tag_name: v${{ github.run_number }}
    release_name: Production Release ${{ github.run_number }}
    body: |
      🚀 Déploiement automatique sur Cloudflare Pages
      
      - Build: #${{ github.run_number }}
      - Commit: ${{ github.sha }}
      - Deployed: https://9fd537bc.iapostemanage.pages.dev
      
      **Changelog:**
      ${{ github.event.head_commit.message }}
    draft: false
    prerelease: false
```

---

### **5. Webhooks GitHub → Application**

**Objectif:** Recevoir notifications GitHub en temps réel

**Setup:**

1. **Créer endpoint webhook:**

```typescript
// app/api/webhooks/github/route.ts
import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

export async function POST(req: NextRequest) {
  const payload = await req.text();
  const signature = req.headers.get('x-hub-signature-256');
  
  // Vérifier signature
  const hmac = crypto.createHmac('sha256', process.env.GITHUB_WEBHOOK_SECRET!);
  const digest = `sha256=${hmac.update(payload).digest('hex')}`;
  
  if (signature !== digest) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }
  
  const data = JSON.parse(payload);
  const event = req.headers.get('x-github-event');
  
  // Gérer événements
  if (event === 'workflow_run') {
    const { action, workflow_run } = data;
    
    if (action === 'completed') {
      console.log(`✅ Workflow "${workflow_run.name}" completed with conclusion: ${workflow_run.conclusion}`);
      
      // TODO: Notifier admins via WebSocket ou email
    }
  }
  
  return NextResponse.json({ received: true });
}
```

2. **Configurer sur GitHub:**
   - Repo → Settings → Webhooks → Add webhook
   - Payload URL: `https://9fd537bc.iapostemanage.pages.dev/api/webhooks/github`
   - Content type: `application/json`
   - Secret: Générer et ajouter dans `.env` comme `GITHUB_WEBHOOK_SECRET`
   - Events: `Workflow runs`, `Deployments`, `Push`

---

## 🔒 Sécurité & Bonnes pratiques

### **1. Principe du moindre privilège**

**Permissions minimales par workflow:**

```yaml
# ✅ GOOD - Permissions explicites
permissions:
  contents: read
  security-events: write

# ❌ BAD - Trop permissif
permissions: write-all
```

---

### **2. Rotation régulière des tokens**

**Fréquence recommandée:**
- `GITHUB_TOKEN`: Auto-géré (expire après workflow)
- `GH_PAT`: Rotation tous les 90 jours
- `CLOUDFLARE_API_TOKEN`: Rotation tous les 6 mois

---

### **3. Secrets jamais en clair**

**❌ Ne JAMAIS faire:**

```yaml
# DANGER - Secret exposé dans logs
- name: Deploy
  run: echo "Token: ${{ secrets.API_TOKEN }}"  # ❌ Visible dans logs
```

**✅ À faire:**

```yaml
# ✅ SAFE - Secret utilisé directement
- name: Deploy
  run: wrangler pages deploy .next
  env:
    CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}  # ✅ Jamais loggé
```

---

### **4. Validation des webhooks**

**Toujours vérifier signature HMAC:**

```typescript
function verifyWebhookSignature(payload: string, signature: string, secret: string): boolean {
  const hmac = crypto.createHmac('sha256', secret);
  const digest = `sha256=${hmac.update(payload).digest('hex')}`;
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(digest));
}
```

---

### **5. Rate limiting**

**Limites API GitHub:**
- Authentifié: 5000 requêtes/heure
- Non authentifié: 60 requêtes/heure
- GitHub Actions: 1000 requêtes/heure

**Protection:**

```typescript
import { Octokit } from '@octokit/rest';
import { throttling } from '@octokit/plugin-throttling';

const MyOctokit = Octokit.plugin(throttling);

const octokit = new MyOctokit({
  auth: process.env.GH_PAT,
  throttle: {
    onRateLimit: (retryAfter, options) => {
      console.warn(`Rate limit hit for ${options.method} ${options.url}`);
      if (options.request.retryCount < 2) {
        console.log(`Retrying after ${retryAfter} seconds`);
        return true;
      }
    },
    onSecondaryRateLimit: (retryAfter, options) => {
      console.warn(`Secondary rate limit hit for ${options.method} ${options.url}`);
      return true;
    },
  },
});
```

---

## 📚 Guide d'utilisation

### **Installation Octokit (si besoin API dans app)**

```bash
npm install @octokit/rest @octokit/plugin-throttling
npm install --save-dev @types/libsodium-wrappers
```

---

### **Exemple complet: API Admin Dashboard**

```typescript
// app/api/admin/github/stats/route.ts
import { NextResponse } from 'next/server';
import { Octokit } from '@octokit/rest';

export async function GET() {
  const octokit = new Octokit({ auth: process.env.GH_PAT });
  
  // 1. Récupérer workflows récents
  const { data: runs } = await octokit.actions.listWorkflowRunsForRepo({
    owner: 'mobby57',
    repo: 'iapostemanager',
    per_page: 10,
  });
  
  // 2. Récupérer alertes sécurité
  const { data: alerts } = await octokit.codeScanning.listAlertsForRepo({
    owner: 'mobby57',
    repo: 'iapostemanager',
    state: 'open',
  });
  
  // 3. Récupérer déploiements
  const { data: deployments } = await octokit.repos.listDeployments({
    owner: 'mobby57',
    repo: 'iapostemanager',
    per_page: 5,
  });
  
  return NextResponse.json({
    workflows: {
      total: runs.total_count,
      recent: runs.workflow_runs.slice(0, 5).map(r => ({
        name: r.name,
        status: r.status,
        conclusion: r.conclusion,
        url: r.html_url,
      })),
    },
    security: {
      openAlerts: alerts.length,
      criticalAlerts: alerts.filter(a => a.rule.severity === 'critical').length,
    },
    deployments: {
      total: deployments.length,
      latest: deployments[0],
    },
  });
}
```

---

## 🎯 Checklist d'implémentation

### **Phase 1: Audit actuel** ✅

- [x] Identifier tous les workflows utilisant GitHub API
- [x] Vérifier permissions `GITHUB_TOKEN`
- [x] Lister secrets configurés
- [x] Analyser logs d'authentification

### **Phase 2: Sécurisation** ✅

- [x] Upgrade CodeQL v3 → v4 (trivy-scan.yml)
- [x] Ajout tokens explicites (upload-sarif)
- [x] Permissions minimales par workflow
- [ ] Rotation automatique secrets (optionnel)

### **Phase 3: Dashboard Admin** (Optionnel)

- [ ] Créer `/admin/github` page
- [ ] API route monitoring workflows
- [ ] Widget temps réel déploiements
- [ ] Bouton "Déployer maintenant"

### **Phase 4: Webhooks** (Optionnel)

- [ ] Endpoint `/api/webhooks/github`
- [ ] Configuration GitHub repo
- [ ] Notifications temps réel (WebSocket)
- [ ] Logs événements GitHub

### **Phase 5: Automatisations avancées** (Optionnel)

- [ ] Rotation secrets mensuelle
- [ ] GitHub Releases automatiques
- [ ] Backup artefacts vers S3/Azure
- [ ] Intégration Slack/Discord

---

## 📞 Support & Documentation

**Ressources officielles:**
- [API REST GitHub](https://docs.github.com/fr/rest)
- [Authentification GitHub Actions](https://docs.github.com/fr/rest/authentication/authenticating-to-the-rest-api#authenticating-in-a-github-actions-workflow)
- [Octokit.js Documentation](https://octokit.github.io/rest.js)
- [GitHub Actions API](https://docs.github.com/fr/rest/actions)

**Liens internes:**
- [Workflow Cloudflare Pages](.github/workflows/cloudflare-pages.yml)
- [Workflow Trivy Scan](.github/workflows/trivy-scan.yml)
- [Workflow CI/CD Advanced](.github/workflows/ci-cd-advanced.yml)

---

**🎉 Félicitations !** L'intégration API GitHub est maintenant documentée et prête pour extension ! 🚀
