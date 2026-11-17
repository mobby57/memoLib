# 🚀 COPY-PASTE COMMANDS — Démarrage immédiat

**PHASE 1 : VALIDATION (10 min)**

```bash
# Ouvrir terminal dans VS Code ou PowerShell
cd C:\Users\moros\Desktop\PROD\memolib-production

# Vérifier node/npm
node --version
npm --version

# Exécuter validation (Windows PowerShell)
powershell -ExecutionPolicy Bypass -File .\scripts\validate-diagnostic.ps1

# Ou (WSL Bash)
bash scripts/validate-diagnostic.sh

# Vérifier résultat
cat diagnostic-validation-results.json
```

**PHASE 2 : GITHUB SECRETS (15 min) — MANUEL**

GitHub UI → Settings → Secrets and variables → Actions

```
Secret 1: CRON_SECRET
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Générer (PowerShell Windows):
  $key = -join (1..32 | % {'{0:X2}' -f (Get-Random -Minimum 0 -Maximum 256)})
  Write-Host $key

Ou (Bash/WSL):
  openssl rand -hex 32

Copier et coller le résultat dans GitHub
```

```
Secret 2: SLACK_WEBHOOK_URL
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Format: https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXX

Obtenir:
  1. https://api.slack.com/apps
  2. Create New App → From scratch
  3. App name: "MemoLib Diagnostic"
  4. Workspace: [ta workspace]
  5. Left menu → Incoming Webhooks
  6. Add New Webhook to Workspace
  7. Select channel: #alerts (ou #general)
  8. Copy Webhook URL
  9. Coller dans GitHub secret
```

```
Secret 3: DATABASE_URL
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Doit déjà exister. Vérifier que ça commence par:
  postgresql://

Tester (terminal):
  psql $DATABASE_URL -c "SELECT 1"
  
Si erreur, copier depuis .env ou Railway dashboard
```

**PHASE 3 : DÉPLOIEMENT (10 min)**

```bash
# Vérifier état
git status

# Ajouter tous les fichiers
git add .

# Vérifier changements
git diff --cached --name-only | head -20

# Commit
git commit -m "feat: PostgreSQL diagnostic automation system

- Add diagnostic runner (scripts/diagnostic-postgres.ts)
- Add GitHub Actions workflow (postgres-diagnostic.yml)
- Add cron endpoint (src/app/api/cron/pg-diagnostic.ts)
- Add E2E tests (tests/e2e/database-diagnostic.spec.ts)
- Add Prisma migration (DatabaseDiagnosticLog model)

This system:
✅ Runs diagnostics on schedule (Mon 8h, Thu 14h UTC)
✅ Monitors database health 24/7
✅ Sends Slack alerts on issues
✅ Saves results to database (25 metrics)

Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"

# Push
git push origin main

# Vérifier Actions
# GitHub UI → Actions → postgres-diagnostic.yml → Vérifier ✅
```

**PHASE 4 : COMMERCIAL JOUR 1 (30 min)**

```bash
# 4A: Email Barreau
# Google: "Barreau de Metz bâtonnier email contact"
# Envoyer email (voir template dans EXECUTION_PLAN_COMPLET.md)

# 4B: Mettre à jour tarification
# Modifier: src/components/PricingPage.tsx
# (Ou fichier équivalent si existe)

# Chercher fichier:
grep -r "pricing" src --include="*.tsx" | grep -i "const\|export" | head -5

# Edit fichier et remplacer par:
# Plans: Starter (€0), Pro (€79), Plus (€199), Enterprise (€499)
# (Voir EXECUTION_PLAN_COMPLET.md pour détails)

# 4C: Référral program
# Créer: src/components/ReferralProgram.tsx
# (Code fourni dans EXECUTION_PLAN_COMPLET.md)

# Deploy
npm run build
# Ou si Vercel: auto-deploy sur push
```

**PHASE 5 : COMMERCIAL JOUR 2 (40 min)**

```bash
# 5A: LinkedIn Sales Navigator
# 1. salesnavigator.linkedin.com
# 2. Subscribe (€99/mois)
# 3. Create saved searches pour "CESEDA avocats"
# (Voir EXECUTION_PLAN_COMPLET.md pour détails)

# 5B: Email automation
# 1. brevo.com (Sendinblue)
# 2. Sign up
# 3. Create automation with 6 emails
# (Voir EXECUTION_PLAN_COMPLET.md pour templates)

# 5C: Setup tools
# Intercom: intercom.com
# Zapier: zapier.com
# Google Analytics 4: analytics.google.com
# (Voir EXECUTION_PLAN_COMPLET.md pour étapes)
```

---

## ✅ QUICK CHECKLIST

```bash
# MORNING DAY 1
[ ] Read EXECUTION_PLAN_COMPLET.md (10 min)
[ ] Run validation script (10 min)
[ ] Check result: diagnostic-validation-results.json

# AFTERNOON DAY 1
[ ] Add GitHub secrets (CRON_SECRET, SLACK_WEBHOOK_URL)
[ ] Verify DATABASE_URL secret
[ ] Test workflow manually

# EVENING DAY 1
[ ] git commit + git push
[ ] Verify GitHub Actions ran
[ ] Email Barreau de Metz
[ ] Update pricing page

# MORNING DAY 2
[ ] Subscribe LinkedIn Sales Navigator
[ ] Create Brevo automation (6 emails)
[ ] Setup Intercom chatbot

# RESULT
✅ Diagnostic running 24/7
✅ Commercial plan activated
✅ Ready for growth
```

---

## 🆘 TROUBLESHOOTING

**If validation fails:**
```bash
# Check dependencies
node --version  # Need v18+
npm --version   # Need v9+

# Try installing:
npm install
npm run prisma:generate

# Check database connection
psql $DATABASE_URL -c "SELECT 1"

# If still fails: Read GUIDE_EXECUTION_TESTS.md
```

**If GitHub Actions fails:**
```bash
# Check Action logs at:
# GitHub → Actions → postgres-diagnostic.yml → Click failed job

# Common issues:
# - DATABASE_URL secret missing
# - SLACK_WEBHOOK_URL incorrect format
# - Node version mismatch
# - Prisma client not generated

# Solution:
# 1. Verify all 3 secrets exist
# 2. Test DATABASE_URL locally: psql $DATABASE_URL -c "SELECT 1"
# 3. Verify SLACK_WEBHOOK_URL starts with https://hooks.slack.com
# 4. Run: npm run prisma:generate
```

**If email not working:**
```bash
# Check Slack webhook is valid:
curl -X POST -H 'Content-type: application/json' \
  --data '{"text":"Test"}' \
  YOUR_SLACK_WEBHOOK_URL

# If 200 OK: Webhook is valid
# If 404: Webhook is wrong
```

---

## 📞 SUPPORT

If anything fails:
1. Check GUIDE_EXECUTION_TESTS.md (Phase by phase explanation)
2. Check EXECUTION_PLAN_COMPLET.md (Full context)
3. Check error message in GitHub Actions logs
4. Google the error (usually obvious fix)

Good luck! 🚀
