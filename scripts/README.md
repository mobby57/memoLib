# Scripts MemoLib.Api (Quick Start)

Ce dossier contient les scripts d'automatisation pour build, smoke test, package local-demo et publication GitHub Release.

## Prérequis

- PowerShell
- `.NET 9 SDK`
- (Optionnel) `gh` CLI authentifié pour la publication GitHub

## 1) Full local (migrations + build + smoke + package)

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\go-all.ps1 -SkipPublish
```

Notes:

- `go-all.ps1` applique automatiquement les migrations EF (`dotnet ef database update`).
- Par défaut, un secret JWT local est injecté pour cette étape.

## 2) Full local avec secret JWT explicite

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\go-all.ps1 -JwtSecret "<secret_32+>" -SkipPublish
```

## 3) Full local sans migrations

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\go-all.ps1 -SkipMigrations -SkipPublish
```

## 4) Test API end-to-end automatique

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\auto-local-flow.ps1
```

Ce script teste automatiquement:

- register
- duplicate register (`409` attendu)
- login
- ingest
- search
- case attach
- timeline
- audit

Résultat attendu:

- JSON avec `"Status": "PASS"`

Options:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\auto-local-flow.ps1 -BaseUrl "http://localhost:8091"
powershell -ExecutionPolicy Bypass -File .\scripts\auto-local-flow.ps1 -Email "manuel.user@memolib.local"
```

Note:
- Si `-BaseUrl` n'est pas fourni, le script lit automatiquement `dist/local-preview-session.json`.
- Fallback par défaut: `http://localhost:8091`.

## 4 bis) Smoke test en 1 ligne sur API déjà démarrée (Docker/local)

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\smoke-running-local.ps1 -BaseUrl "http://localhost:8091"
```

Ce wrapper exécute `auto-local-flow.ps1`, affiche le JSON final et retourne un code de sortie non nul en cas d'échec.

## 4 ter) Connexion avec vos vraies infos (inscription/login + fonctionnalités)

Script: `connect-and-test.ps1`

Inscription + login + test ingest/search:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\connect-and-test.ps1 -BaseUrl "http://localhost:8091" -Email "prenom.nom@domaine.com" -Password "MotDePasseFort!" -Name "Prénom Nom"
```

Compte existant uniquement (sans inscription):

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\connect-and-test.ps1 -BaseUrl "http://localhost:8091" -Email "prenom.nom@domaine.com" -Password "MotDePasseFort!" -SkipRegister
```

Mode interactif (invite email/mot de passe):

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\connect-and-test.ps1 -BaseUrl "http://localhost:8091" -Interactive
```

## 5) Build + smoke + package (sans publication)

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\go-demo.ps1
```

## 6) Package local-demo uniquement

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\publish-local-demo.ps1
```

## 7) Publication GitHub Release

```powershell
$env:GITHUB_TOKEN = [Environment]::GetEnvironmentVariable('GITHUB_TOKEN','User')
powershell -ExecutionPolicy Bypass -File .\scripts\publish-github-release.ps1 -Owner "mobby57" -Repo "memoLib"
```

Exemple avec tag/titre:

```powershell
$env:GITHUB_TOKEN = [Environment]::GetEnvironmentVariable('GITHUB_TOKEN','User')
$tag = 'v' + (Get-Date -Format 'yyyy.MM.dd.HHmmss') + '-local'
powershell -ExecutionPolicy Bypass -File .\scripts\publish-github-release.ps1 -Owner "mobby57" -Repo "memoLib" -Tag $tag -Title "MemoLib Local Demo $tag"
```

## 8) Go complet avec publication

```powershell
$env:GITHUB_TOKEN = [Environment]::GetEnvironmentVariable('GITHUB_TOKEN','User')
powershell -ExecutionPolicy Bypass -File .\scripts\go-all.ps1 -Owner "mobby57" -Repo "memoLib"
```

## 9) Test pré-déploiement local (avant Vercel)

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\predeploy-local.ps1
```

Ce script valide automatiquement:

- build + smoke + package local (`go-all -SkipPublish`)
- présence des artefacts (`latest.zip`, checksum, exe, `run-demo.bat`)
- génération d'un rapport: `dist/predeploy-local-report.json`

Option:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\predeploy-local.ps1 -SkipMigrations
```

## 10) Démarrage preview local robuste (port auto)

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\run-local-preview.ps1
```

Le script:
- trouve un port libre (`8091`→`8120`)
- démarre l'API en `Development`
- attend `/health`
- écrit la session dans `dist/local-preview-session.json`

Option ouverture navigateur:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\run-local-preview.ps1 -OpenBrowser
```

Arrêt:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\stop-local-preview.ps1
```

## 11) Prédeploy + preview en une commande (recommandé)

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\predeploy-and-preview.ps1
```

Ce script enchaîne automatiquement:
- `predeploy-local.ps1`
- `run-local-preview.ps1`
- `auto-local-flow.ps1`

Option arrêt automatique après test:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\predeploy-and-preview.ps1 -StopAfterTest
```

Option ouverture navigateur (si la preview reste active):

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\predeploy-and-preview.ps1 -OpenBrowser
```

## 12) Connexion + test rapide (manuel)

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\connect-and-test.ps1 -Name "Ton Nom" -Email "ton.email@exemple.com" -Password "TonMotDePasse!2026"
```

Le script fait: register/login/ingest/search et retourne `Status: PASS`.

## 12) Prédeploy full-stack (backend + frontend)

Strict (type-check frontend):

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\predeploy-fullstack.ps1 -SkipMigrations
```

Profil frontend build rapide:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\predeploy-fullstack.ps1 -FrontendProfile build-fast -SkipMigrations
```

Profil backend uniquement (frontend ignoré):

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\predeploy-fullstack.ps1 -FrontendProfile skip -SkipMigrations

## 13) Série de démo interactive (toutes fonctions principales)

Menu interactif pas-à-pas:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\demo-series-interactive.ps1 -BaseUrl "http://localhost:5078"
```

Mode présentation client (ordre optimisé + ouverture UI):

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\demo-series-interactive.ps1 -BaseUrl "http://localhost:5078" -Profile Client -OpenUi
```

Exécution complète automatique:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\demo-series-interactive.ps1 -BaseUrl "http://localhost:5078" -RunAll -AutoStartApi
```

Exécution complète en mode client:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\demo-series-interactive.ps1 -BaseUrl "http://localhost:5078" -Profile Client -RunAll -AutoStartApi
```

Le parcours couvre notamment:

- démo API rapide
- démo E2E complète
- scénario client + audit
- passerelle SMS forwarded
- webhook Vonage simulé
- vérification inbox SMS authentifiée
```

Logs frontend: `dist/predeploy-fullstack-frontend.log`

## 12) Gate prédeploy full-stack (backend + frontend type-check)

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\predeploy-fullstack.ps1
```

Ce script exécute:
- backend: `predeploy-local.ps1`
- frontend: `npm run type-check` (dans `c:\Users\moros\Desktop\memolib`)

Rapport généré:
- `dist/predeploy-fullstack-report.json`

Option:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\predeploy-fullstack.ps1 -SkipMigrations
```

## Dépannage rapide

- Si un script échoue pendant un test local, vérifier que l'API répond:

```powershell
Invoke-RestMethod -Uri "http://localhost:8091/health"
```

- Si publication GitHub échoue, vérifier le token:

```powershell
if ([string]::IsNullOrWhiteSpace($env:GITHUB_TOKEN)) { 'NO_GITHUB_TOKEN' } else { 'TOKEN_OK' }
```

## Profils copier-coller (recommandé)

### 1) Dev rapide
```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\profile-dev-rapide.ps1
```

### 2) Préprod stricte
```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\profile-preprod-stricte.ps1
```

### 3) Release GitHub
```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\profile-release-github.ps1 -Owner "mobby57" -Repo "memoLib"
```
