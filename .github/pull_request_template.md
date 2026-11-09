# Résumé PR

<!-- Décris le besoin, le scope et l'impact métier -->

## Périmètre technique

- Frontend impacté:
- API Routes impactées:
- Backend Python impacté:
- DB/Prisma impacté:

## Audit CI (obligatoire)

Référence: [.github/AUDIT_CI_CHECKLIST_SCORE.md](.github/AUDIT_CI_CHECKLIST_SCORE.md)

### Critères P0 (bloquants)

- [ ] SEC-01 Secrets hardcodés absents
- [ ] SEC-02 AuthN/AuthZ conforme (401/403)
- [ ] SEC-03 Signatures webhooks validées
- [ ] API-01 Contrats front/API cohérents
- [ ] ROB-01 URLs externes via env uniquement
- [ ] QLT-01 CI verte (lint/type/test/build)
- [ ] QLT-02 Imports/références non cassés

### Score

- Sécurité & conformité ( /35):
- Contrats API/Front ( /20):
- Robustesse runtime ( /15):
- Qualité & tests ( /20):
- Architecture & scope ( /10):
- **Total ( /100):**

### Verdict

- [ ] PASS (>=90)
- [ ] PASS conditionnel (80–89)
- [ ] FAIL
- [ ] FAIL immédiat (P0 KO)

## Preuves

- Lien run CI:
- Lint/Typecheck:
- Tests backend:
- Tests frontend:
- Vérification sécurité (secrets/webhooks/rate-limit):

## Risques & rollback

- Risques:
- Plan rollback:
