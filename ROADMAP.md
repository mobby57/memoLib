# Roadmap MemoLib — Plan d'exécution par rôle

Ce document traduit chaque tâche du `TODO.md` en actions concrètes ancrées dans le stack réel de MemoLib.

**Stack réel** : Next.js 16 (Vercel) + ASP.NET Core 9 (Docker) + PostgreSQL + Prisma + Stripe + Sentry + Upstash Redis

---

## Timeline globale

```
Semaine 1-2  : Fondations (DevOps + Security + SysAdmin)
Semaine 3-4  : Qualité code + Architecture cloud (Dev + Cloud Architect + AI)
Semaine 5-6  : Produit + Go-to-market (Manager + Business + Network)
Semaine 7-8  : Stabilisation, tests E2E, monitoring prod
```

### Matrice de dépendances

```
Security ──► DevOps ──► Cloud Architect
                │              │
                ▼              ▼
           SysAdmin      Software Dev ◄── AI Specialist
                │              │
                ▼              ▼
         Network Eng    Eng. Manager ──► Business Decision Maker
```

---

## DevOps — Semaine 1-2

### CI/CD (`.github/workflows/ci-cd.yml`)

- [x] Ajouter job `dotnet test` dans le pipeline CI pour le backend .NET
- [x] Ajouter job `docker build` pour valider les Dockerfiles
- [ ] Configurer les GitHub Environments (preview/staging/production) avec approval gates sur `production`
- [x] Ajouter cache npm + cache Prisma generate dans le workflow existant
- [ ] Configurer Dependabot auto-merge pour les patches

### Conteneurisation (`docker-compose.yml`)

- [x] Compléter `docker-compose.yml` : PostgreSQL + frontend Next.js + Nginx + Prometheus
- [ ] Créer `docker-compose.prod.yml` avec le backend .NET + PostgreSQL + Nginx
- [ ] Tester le stack complet localement : `docker-compose up`

### Secrets & Config

- [ ] Migrer les secrets vers GitHub Secrets (VERCEL_TOKEN, PRODUCTION_DATABASE_URL, STRIPE_SECRET_KEY)
- [ ] Documenter le mapping `.env.local` → GitHub Secrets → Vercel Env Variables
- [ ] Valider que `scripts/generate-env.js` couvre tous les secrets requis

### Monitoring

- [x] Configurer Sentry releases dans le pipeline CI (source maps upload)
- [ ] Activer les alertes Sentry sur error rate > 1% et latence P95 > 3s
- [x] Configurer `docker/prometheus/prometheus.yml` pour scraper le backend .NET `/health`

### Rollback

- [x] Script `scripts/rollback-production.ps1` : rollback Vercel + revert Prisma migration

**Métriques** : Déploiement < 5min, rollback < 2min, 0 secret en clair dans le repo

---

## Software Developer — Semaine 3-4

### Qualité du code

- [x] ESLint : 115 → 0 erreurs, 3213 → 1050 warnings (`eslint.config.mjs` nettoyé)
- [x] Dead code fixé : `cloudflare/client.ts`, `disaster-recovery.ts` (unreachable catch)
- [x] `MemoLib.Api.csproj` : exclusion `_archive\**` pour éviter les conflits de compilation
- [ ] Augmenter la couverture de tests de 30% → 60%
- [ ] Corriger les types TypeScript : `npm run type-check` doit passer sans `--skipLibCheck`

### Contract-First Pattern

- [x] Types API complétés dans `src/lib/api-types.ts` : Document, Facture, LegalDeadline, LegalProof, IngestEmail
- [x] 4 mappers créés dans `src/lib/mappers/` : client, email, facture, document
- [x] Zod schemas existants dans `src/lib/validation/schemas.ts` (dossiers, clients, factures, users, documents)
- [ ] Auditer les routes API : vérifier que chaque endpoint utilise les schemas Zod
- [ ] Ajouter des tests d'intégration pour `/api/documents/upload` et `/api/emails/incoming`

### API .NET

- [x] FluentValidation ajouté : `Validators/ApiRequestValidators.cs` (IngestEmail, Search, Login, Register)
- [x] Tests unitaires : 105 passants (GdprAnonymization, Billing, EmailMonitor, Classification, Password, Export, DB)
- [ ] Documenter les endpoints .NET qui n'ont pas d'équivalent Next.js (SignalR, email scan)

### Base de données

- [x] Schémas Prisma nettoyés : 8 dupliqués archivés dans `prisma/_archive_schemas/`
- [ ] Optimiser les requêtes Prisma lentes (`scripts/db-benchmark.ts`)
- [ ] Vérifier les index manquants (`Migrations/AddPerformanceIndexes.sql`)

### Refactoring

- [ ] Consolider les fichiers racine : 400+ fichiers `.md` et `.ps1` → `docs/` et `scripts/`
- [ ] Supprimer le code mort : `wwwroot/` duplique le frontend Next.js

**Métriques** : 0 erreur lint, 60% coverage, type-check clean

---

## System Admin — Semaine 1-2

### PostgreSQL

- [ ] Configurer PostgreSQL local avec `scripts/postgres-init.sql`
- [ ] Mettre en place backup automatique : `scripts/db-backup.ts` → cron quotidien
- [ ] Configurer `pg_stat_statements` pour identifier les requêtes lentes
- [ ] Documenter la procédure de restauration depuis un backup

### Docker

- [x] Health checks configurés dans `docker-compose.yml`
- [x] Service PostgreSQL ajouté dans le docker-compose
- [ ] Optimiser les Dockerfiles : multi-stage build (déjà en place dans `docker/Dockerfile.frontend`)

### Automatisation

- [x] Script `scripts/bootstrap.ps1` : installe Node, .NET, PostgreSQL, génère `.env.local`
- [ ] Consolider les scripts PowerShell : `scripts/start-all.ps1`, `scripts/setup-local.ps1`
- [ ] Automatiser la rotation des logs

### Monitoring système

- [x] Prometheus configuré dans `docker/prometheus/prometheus.yml`
- [ ] Ajouter Grafana au docker-compose avec dashboards pré-configurés
- [ ] Configurer alertes : disk > 80%, memory > 90%, PostgreSQL connections > 80%

**Métriques** : Setup dev local en < 5min, backup quotidien vérifié, 0 downtime non planifié

---

## Security Engineer — Semaine 1-2

### Audit immédiat

- [ ] Vérifier qu'aucun secret n'est dans le repo : `npm run security:scan`
- [ ] Valider les workflows de sécurité existants : `snyk.yml`, `trivy.yml`, `trufflehog.yml`, `codeql.yml`
- [x] `.env`, `.env.local`, `.env.vault` dans `.gitignore`

### RGPD

- [ ] Tester le droit à l'oubli end-to-end
- [ ] Vérifier le registre des traitements (`docs/RGPD_REGISTRY.md`)
- [ ] Auditer la rétention des données

### Auth & Accès

- [ ] Auditer NextAuth config : session strategy, token rotation, CSRF
- [ ] Vérifier le RBAC multi-tenant
- [ ] Tester la protection brute-force
- [ ] Valider les headers de sécurité dans `vercel.json`

### Upload & Documents

- [ ] Tester l'antivirus scan sur les uploads
- [ ] Vérifier le blocage des extensions dangereuses
- [ ] Valider Vercel Blob permissions

### Pentesting

- [ ] Exécuter `security/attack-simulation-memolib.py`
- [ ] Tester injections SQL via Prisma
- [ ] Tester XSS sur les formulaires

**Métriques** : 0 secret exposé, RGPD 100% conforme, 0 vulnérabilité critique

---

## Cloud Architect — Semaine 3-4

### Architecture

```
Vercel (CDG1)                    Docker (local/VPS)
┌─────────────────┐              ┌──────────────────┐
│ Next.js 16      │              │ ASP.NET Core 9   │
│ API Routes      │              │ Port 5078        │
│ Prisma → PG     │              │ EF Core → PG     │
│ Vercel Blob     │              │ SignalR           │
│ Vercel Cron     │              │ MailKit IMAP      │
└────────┬────────┘              └────────┬─────────┘
         │                                │
         └──────── PostgreSQL ────────────┘
```

- [ ] Créer ADR : pourquoi Vercel + Docker et pas full Vercel
- [ ] Documenter les limites Vercel
- [ ] Évaluer Neon PostgreSQL serverless vs Supabase vs RDS
- [ ] Configurer connection pooling Prisma
- [ ] Créer budget mensuel réaliste
- [ ] Configurer alertes coûts Vercel et Stripe

---

## AI Specialist — Semaine 3-4

- [ ] Implémenter classification emails avec Ollama
- [ ] Pipeline : Email → Ollama → `LegalCaseDraft` → Validation humaine → Dossier
- [ ] Améliorer `Services/ClientInfoExtractor.cs` avec modèle local
- [ ] Ajouter score de confiance par champ extrait
- [ ] Compléter `Services/EmbeddingService.cs` + évaluer pgvector
- [ ] Tester OCR sur PDF juridiques

**Métriques** : Précision extraction > 80%, latence classification < 2s, coût Ollama = 0€

---

## Network Engineer — Semaine 5-6

- [ ] Configurer domaine personnalisé Vercel avec DNSSEC
- [ ] Configurer TLS backend .NET via Nginx
- [ ] Évaluer Cloudflare WAF devant Vercel
- [ ] Documenter architecture réseau
- [ ] Configurer webhooks Stripe avec IP whitelisting

---

## Engineering Manager — Semaine 5-6

- [ ] Auditer dette technique : 400+ fichiers racine, code mort `wwwroot/`
- [ ] Créer backlog priorisé RICE dans GitHub Projects
- [ ] Définir métriques DORA
- [ ] Configurer branch protection rules
- [ ] Définir OKR trimestriels
- [ ] Planifier sprint de nettoyage : réduire fichiers racine de 400+ à < 30

---

## Business Decision Maker — Semaine 5-8

- [ ] Définir plans Stripe : Starter, Pro, Enterprise
- [ ] Configurer facturation à l'usage
- [ ] Identifier 5 cabinets beta France
- [ ] Préparer pitch client
- [ ] Préparer DPA
- [ ] Vérifier CGU/CGV SaaS juridique

**Métriques** : 5 cabinets beta signés, MRR > 500€ à M+3, NPS > 8

---

## Checklist inter-rôles

- [ ] Matrice RACI publiée dans `docs/RACI.md`
- [ ] Canal de communication défini
- [ ] Convention de documentation : tout dans `docs/`, rien à la racine
- [ ] Réunion hebdo : lundi planning, vendredi démo + rétro
- [ ] OKR trimestriels trackés dans GitHub Projects
- [ ] Procédure d'incident documentée

---

## Prochaine action

1. **Semaine 1** : Security + DevOps + SysAdmin en parallèle (fondations)
2. **Semaine 3** : Software Dev + AI + Cloud Architect (qualité + architecture)
3. **Semaine 5** : Manager + Business + Network (produit + go-to-market)
4. **Semaine 7** : Stabilisation finale, tests E2E complets, onboarding premier cabinet beta
