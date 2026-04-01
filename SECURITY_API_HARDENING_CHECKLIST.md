# Checklist Securite API - MemoLib

Date: 2026-03-14
Scope: durcissement routes sensibles Next.js App Router

## 1) Routes securisees (auth + role admin)

- `src/app/api/azure/keyvault/secret/route.ts`
- `src/app/api/azure/storage/upload/route.ts`
- `src/app/api/azure/storage/list/route.ts`
- `src/app/api/dev/workflow-stats/route.ts`
- `src/app/api/dev/metrics/route.ts`
- `src/app/api/dev/health/route.ts`
- `src/app/api/dev/ai-stats/route.ts`
- `src/app/api/deployment/status/route.ts`
- `src/app/api/deployment/phase6-production/route.ts`
- `src/app/api/deployment/final-report/route.ts`
- `src/app/api/monitoring/metrics-dashboard/route.ts`
- `src/app/api/monitoring/release-health/route.ts`
- `src/app/api/monitoring/sentry-test/route.ts`
- `src/app/api/test-email/route.ts`
- `src/app/api/test/webhook-validation/route.ts`
- `src/app/api/test/webhook-phase4-debug/route.ts`
- `src/app/api/test/webhook-extraction/route.ts`
- `src/app/api/test/phase5-features/route.ts`
- `src/app/api/test/phase4-phase5-comprehensive/route.ts`
- `src/app/api/test/ceseda-analysis/route.ts`
- `src/app/api/webhooks/manage/route.ts`
- `src/app/api/webhooks/test-multichannel/route.ts`
- `src/app/api/webhooks/test-multichannel/phase4/route.ts`

Controle applique: `getServerSession(authOptions)` + roles `ADMIN`/`SUPER_ADMIN` + reponses `401/403`.

## 2) Webhooks publics autorises (auth par signature/secret)

- `src/app/api/webhooks/route.ts` (signature HMAC)
- `src/app/api/webhooks/github/route.ts` (signature GitHub)
- `src/app/api/webhooks/stripe/route.ts` (signature Stripe)
- `src/app/api/webhooks/email/route.ts` (secret webhook)
- `src/app/api/webhooks/channel/[channel]/route.ts` (secret canal requis en prod)

## 3) Cron proteges

- `src/app/api/cron/workflows/route.ts`
- `src/app/api/cron/deadline-alerts/route.ts`
- `src/app/api/cron/cost-alerts/route.ts`

Regles appliquees:

- Plus de fallback `dev-secret*` en production.
- `CRON_SECRET` requis en non-dev (ou header Vercel Cron pour cost-alerts).
- Reponses 503 si secret non configure en non-dev.

## 4) Durcissement RGPD applique

- `src/app/api/demo/route.ts`: suppression logs PII directs (`nom`, `email`, `telephone`, `commentaire`) remplaces par metadonnees minimales.

## 4b) Durcissement BOLA / multi-tenant applique

- `src/app/api/clients/[id]/route.ts`
- `src/app/api/dossiers/[id]/route.ts`
- `src/app/api/dossiers/route.ts`
- `src/app/api/pending-actions/[id]/route.ts`
- `src/app/api/pending-actions/[id]/approve/route.ts`
- `src/app/api/pending-actions/[id]/reject/route.ts`
- `src/app/api/pending-actions/route.ts`
- `src/app/api/pending-actions/bulk-approve/route.ts`
- `src/app/api/pending-actions/bulk-reject/route.ts`
- `src/app/api/questionnaire/case/[caseId]/responses/route.ts`
- `src/app/api/questionnaire/for-event/[eventId]/route.ts`
- `src/app/api/questionnaire/response/route.ts`
- `src/app/api/tenant/[tenantId]/analytics/route.ts`
- `src/app/api/tenant/[tenantId]/predictions/route.ts`
- `src/app/api/tenant/[tenantId]/learning/route.ts`
- `src/app/api/tenant/[tenantId]/semantic-search/route.ts`
- `src/app/api/tenant/[tenantId]/suggestions/route.ts`
- `src/app/api/tenant/[tenantId]/quick-actions/route.ts`

Controle applique:

- Session obligatoire via `getServerSession(authOptions)`.
- `tenantId` derive de la session (et non du query/body) sur routes sensibles.
- Reponses `401/403` en cas d'absence session ou mismatch tenant.

## 5) Pre-merge: verifications obligatoires

- Verifier que tous les secrets suivants sont configures en production:
- `CRON_SECRET`
- `STRIPE_WEBHOOK_SECRET`
- `EMAIL_WEBHOOK_SECRET`
- `WEBHOOK_SECRET`
- `GITHUB_WEBHOOK_SECRET`
- `CHANNEL_*_SECRET` pour chaque canal actif
- `INCOMING_EMAIL_WEBHOOK_SECRET`
- `DEMO_MODE`, `DEMO_*` uniquement si mode demo explicitement actif

- Verifier qu'aucune route de test/dev n'est exposee sans authentification forte.
- Verifier qu'aucune reponse d'erreur API ne contient stack trace ou details sensibles hors dev.
- Verifier les logs: pas de donnees personnelles brutes inutiles.

## 6) Risques residuels a traiter

- `src/app/api/webhooks/github/route.ts`: `GET` masque en production (`404`), verifier que le comportement dev-only est conserve.
- `src/app/api/webhooks/channel/[channel]/route.ts`: les branches Slack/WhatsApp/Twilio sont marquees "simplifie"; remplacer par verification cryptographique complete.
- `src/app/api/demo/seed/route.ts`: route destructive en mode demo; s'assurer que `DEMO_MODE=false` en production.

## 7) Commandes utiles de controle

- Type check global:
- `NODE_OPTIONS=--max-old-space-size=8192 npx tsc -p tsconfig.json --noEmit`

- Rechercher routes de test/dev:
- `Get-ChildItem src/app/api/dev -Recurse -Filter route.ts`
- `Get-ChildItem src/app/api/test -Recurse -Filter route.ts`

- Rechercher details d'erreur potentiellement fuyants:
- `Select-String -Path src/app/api/**/*.ts -Pattern "stack|details: error|error.message" -CaseSensitive:$false`
