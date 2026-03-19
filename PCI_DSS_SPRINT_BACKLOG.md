# Backlog Sprint - PCI DSS 4.0 (priorise)

## Sprint 1 - Stabilisation perimetre paiement (critique)
1. Unifier les webhooks Stripe
- Decision: conserver une seule route webhook de reference en production.
- Actions:
  - Deprecier routes doublons.
  - Ajouter test d'integration sur route unique.
- Fichiers cibles:
  - `src/frontend/app/api/webhooks/stripe/route.ts`
  - `src/frontend/app/api/v1/payments/route.ts`
  - `src/app/api/payments/webhook/route.ts`
  - `src/backend/routes/payments.py`
- Avancement:
  - Fait: parseur webhook partage pour les routes Next.js (`src/lib/stripe/webhook.ts`).
  - Fait: les routes legacy Next.js deleguent vers la route canonique `src/app/api/payments/webhook/route.ts`.
  - Reste a faire: retirer la duplication metier residuelle avec `src/backend/routes/payments.py`.

2. Idempotence globale webhook
- Actions:
  - Ajouter table de deduplication evenement (event_id unique).
  - Encapsuler traitement webhook dans transaction atomique.
  - Retourner statut explicite `already_processed`.
- Avancement:
  - Fait: modele Prisma `StripeWebhookEvent` avec `stripeEventId @unique`.
  - Fait: route canonique `src/app/api/payments/webhook/route.ts` execute lock + traitement dans une transaction.
  - Fait: reponse duplicate explicite `{ received: true, duplicate: true }`.
  - A executer: `npx prisma migrate dev --name stripe_webhook_event_lock` puis `npx prisma generate`.

3. Secrets stricts en production
- Actions:
  - Startup check bloquant si `STRIPE_WEBHOOK_SECRET` ou `STRIPE_SECRET_KEY` invalide.
  - Interdire les placeholders en production.

## Sprint 2 - Journalisation et protection applicative
1. Logging PCI-safe
- Actions:
  - Centraliser helper de log webhook (pas de payload brut).
  - Redaction des champs sensibles/PII.
  - Correlation ID pour audit.

2. Durcissement headers HTTP
- Actions:
  - CSP affinee par route (billing/pages sensibles).
  - HSTS actif en production uniquement via reverse proxy/TLS termine.
  - Test automatique de headers securite CI.

3. Validation schema des payloads webhook
- Actions:
  - Validation stricte des champs attendus par type d'evenement.
  - Rejet explicite des payloads incoherents.

## Sprint 3 - Evidences compliance niveau 1
1. Cartographie CDE
- Livrables:
  - Data flow carte, frontieres CDE, inventaire actifs.

2. Controle acces et revues periodiques
- Livrables:
  - Matrice droits prod, process de revue trimestrielle.

3. Tests et preuves
- Livrables:
  - ASV scan trimestriel.
  - Pentest cible CDE.
  - Dossier d'evidence pour pre-audit QSA.

## Definition of Done (par item critique)
- Test unitaire/integration vert.
- Journalisation sanitisee verifiee.
- Fallback dev explicite et bloque en prod.
- Documentation mise a jour (`PCI_DSS_LEVEL1_GAP_ANALYSIS.md`).
