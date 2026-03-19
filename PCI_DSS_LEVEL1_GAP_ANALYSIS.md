# PCI DSS 4.0 - Gap Analysis Niveau 1 (MemoLib)

## Portee evaluee
- Frontend Next.js (routes API Stripe): `src/frontend/app/api/webhooks/stripe/route.ts`, `src/frontend/app/api/v1/payments/route.ts`
- Backend FastAPI paiements: `src/backend/routes/payments.py`
- Routes paiement Next.js additionnelles: `src/app/api/payments/create-checkout/route.ts`, `src/app/api/payments/webhook/route.ts`
- Configuration headers HTTP: `src/frontend/next.config.js`, `src/frontend/next.config.production.js`

## Conclusion rapide
- L'application semble orientee vers une approche tokenisee Stripe (pas de stockage direct de PAN constate dans les fichiers analyses).
- En l'etat, la cible realiste est d'abord une conformite PCI a perimetre reduit (type SAQ A/A-EP selon architecture finale), pas un niveau 1 immediat.
- Pour viser PCI DSS niveau 1 (ROC par QSA), il manque des controles techniques, process et evidences d'audit.

## Constats techniques (evidence code)
1. Multiples implementations paiements/webhooks en parallele.
- `src/frontend/app/api/webhooks/stripe/route.ts`
- `src/frontend/app/api/v1/payments/route.ts`
- `src/app/api/payments/webhook/route.ts`
- `src/backend/routes/payments.py`
- Risque: divergence de controles (signature, idempotence, authZ, logs), perimetre PCI difficile a prouver.

2. Verification webhook presente, mais niveau de robustesse heterogene.
- Verification `stripe-signature` et secret presente dans plusieurs routes.
- `src/backend/routes/payments.py` accepte un mode sans verification si secret absent (mode dev), ce qui est correct en dev mais doit etre strictement interdit en prod.
- Consolidation partielle effectuee: les routes Next.js webhook s'appuient desormais sur un parseur partage pour secret/signature/erreurs (`src/lib/stripe/webhook.ts`).

3. Logging potentiellement trop verbeux autour des erreurs webhook.
- Usage de `console.error(...)` dans routes webhook Next.js.
- Risque PCI/RGPD: fuite de donnees de contexte si objets d'erreur non sanitizes.

4. Headers securite incomplets pour une posture PCI cible.
- Presents: `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`.
- Non visible dans configs lues: `Strict-Transport-Security`, `Content-Security-Policy` explicite pour flux paiement.

5. Idempotence partielle.
- Backend FastAPI contient logique anti-doublon (`_has_payment_event_id`).
- Non visible comme controle systematique et uniforme sur toutes les routes webhook Next.js.
- Amelioration appliquee: route canonique Next.js (`src/app/api/payments/webhook/route.ts`) filtre maintenant les replays via `event.id` avec stockage Upstash Redis (persistant si configure) et fallback memoire local.

6. Segmentation/perimetre non stabilise.
- Presence simultanee de backend Python et routes Next.js pour paiements.
- Pour un audit niveau 1, il faut un CDE clairement delimite et architecture unique documentee.

## Lecture PCI DSS 4.0 par exigences (vue pratique)
1. Requirement 1 (reseau): Partiel
- Pas d'evidence dans ce scan d'une segmentation CDE formalisee.

2. Requirement 2 (config securisee): Partiel
- Plusieurs chemins paiements actifs, risque de config incoherente.

3. Requirement 3 (protection donnees stockees): A confirmer
- Aucun stockage PAN observe ici, mais il faut preuve formelle (schema, logs, sauvegardes, exports).

4. Requirement 4 (chiffrement en transit): Partiel
- A prouver via enforcement TLS/HSTS en production.

5. Requirement 5 (anti-malware): Non evalue
- Hors code applicatif; preuves infra/endpoints necessaires.

6. Requirement 6 (dev securise): Partiel
- Bonnes pratiques presentes, mais chemins paiements multiples et types `any` dans routes critiques.

7. Requirement 7 (moindre privilege): Partiel
- Des controles auth existent, mais pas de modele unique sur toutes routes paiements.

8. Requirement 8 (authentification): Partiel
- Couvre auth applicative, mais pas toutes exigences IAM infra/audit.

9. Requirement 9 (acces physique): Non evalue
- Hors scope code.

10. Requirement 10 (journalisation/monitoring): Partiel
- Logs presents, mais manque de politique de redaction/sanitization uniforme et retention auditable.

11. Requirement 11 (tests securite): Partiel
- Tests paiements existent en backend, mais pas de preuve d'ASV trimestriel/pentest cible CDE.

12. Requirement 12 (gouvernance): Non evalue
- Politique SSI/PCI, gestion risques, formation, evidence fournisseurs a formaliser.

## Ecarts critiques a fermer pour viser Niveau 1
1. Unifier l'architecture paiement/webhook.
- Garder une seule implementation de reference en production (par exemple Next.js OU FastAPI, pas les deux pour le meme flux).
- Supprimer/neutraliser les routes alternatives non utilisees.
- Etat courant: harmonisation des controles Next.js faite, mais duplication metier encore presente entre routes Next.js et backend FastAPI.
- Reduction du doublon Next.js: les routes legacy sous `src/frontend/app/api/...` deleguent maintenant vers la route canonique `src/app/api/payments/webhook/route.ts`.

2. Rendre la verification webhook obligatoire en production.
- Refuser tout webhook si `STRIPE_WEBHOOK_SECRET` absent.
- Ajouter garde-fou d'environnement (startup check bloquant).

3. Generaliser idempotence et replay protection.
- Table dediee `stripe_event_id` unique + transaction atomique sur traitement evenement.
- Retour explicite sur doublons (already processed).
- Etat courant: anti-replay actif sur route canonique; etape suivante recommandee = garantie forte DB (index unique) en plus du cache distribue.

4. Standardiser les logs PCI-safe.
- Interdire log brut des payloads Stripe.
- Redacter champs sensibles et limiter les details d'erreur en reponse API.

5. Durcir headers et transport.
- Ajouter `Strict-Transport-Security`.
- Ajouter `Content-Security-Policy` stricte (surtout pages billing/checkout).

6. Formaliser le perimetre CDE.
- Diagramme de flux carte, frontieres CDE, inventaire actifs, proprietaires, evidences de controles.

## Plan 30/60/90 jours (realiste)
### 0-30 jours
- Geler une seule stack paiement en prod.
- Ajouter checks bloquants secrets Stripe en prod.
- Uniformiser verification webhook + idempotence partout.
- Mettre en place politique de log redaction pour routes paiement.

### 31-60 jours
- Ajouter CSP/HSTS + tests automatiques securite headers.
- Produire data-flow PCI et inventaire CDE.
- Mettre en place collecte de preuves: revues d'acces, scans vulns, tickets remediations.

### 61-90 jours
- Pre-audit interne PCI DSS 4.0.
- Pentest cible CDE + ASV scan.
- Preparation ROC/QSA (si niveau 1 confirme par volume/acquereur).

## Recommandation strategique MemoLib
- Si objectif business n'impose pas niveau 1 immediat, optimiser d'abord pour reduction de scope PCI (tokenisation Stripe, zero stockage CHD, endpoints strictement minimaux).
- Ensuite seulement engager trajectoire ROC niveau 1 avec QSA, car l'effort principal est organisationnel + preuve continue, pas uniquement code.

## Decision a prendre
- Option A: viser rapidement un perimetre reduit (plus rapide, cout moindre).
- Option B: engager programme complet niveau 1 (plus lourd, exige evidences infra/process/audit).

Si tu veux, je peux produire la version "Option A" en checklist de taches techniques directement actionnable par sprint (avec fichiers cibles a modifier dans ce repo).
