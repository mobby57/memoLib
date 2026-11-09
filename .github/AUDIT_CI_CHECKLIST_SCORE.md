# Audit CI PR — Checklist + Score (MemoLib)

Objectif: rejouer un audit technique homogène à chaque Pull Request, aligné sur la stack réelle du repo (Next.js App Router + API Routes, Prisma/PostgreSQL, backends Python Flask/FastAPI legacy).

## Règles de décision (gating)

- **Blocage immédiat (FAIL)** si **au moins 1 critère P0** est en échec.
- Sinon, calcul du score global sur 100:
  - **>= 90**: PASS
  - **80–89**: PASS conditionnel (correctifs mineurs exigés)
  - **< 80**: FAIL

## Barème (100 points)

### 1) Sécurité & conformité — 35 pts

| ID | Critère | Priorité | Points |
|---|---|---:|---:|
| SEC-01 | Aucun secret/credential en dur dans le code runtime | P0 | 10 |
| SEC-02 | AuthN/AuthZ opérationnelle sur routes protégées (401/403 cohérents) | P0 | 8 |
| SEC-03 | Signatures webhooks validées (Stripe/GitHub) | P0 | 5 |
| SEC-04 | Rate limiting actif sur endpoints sensibles (auth/webhooks/cron) | P1 | 5 |
| SEC-05 | Logs sans données sensibles/PII brute (RGPD) | P1 | 7 |

### 2) Contrats API/Front — 20 pts

| ID | Critère | Priorité | Points |
|---|---|---:|---:|
| API-01 | Routes front consomment des endpoints existants uniquement | P0 | 8 |
| API-02 | Validation d’entrée standardisée (Zod) sur endpoints critiques | P1 | 6 |
| API-03 | Format d’erreur API homogène (code/message/details) | P1 | 3 |
| API-04 | Codes HTTP sémantiques (400/401/403/404/409/429/500) | P1 | 3 |

### 3) Robustesse runtime — 15 pts

| ID | Critère | Priorité | Points |
|---|---|---:|---:|
| ROB-01 | Toutes les URLs externes sont configurables via variables d’environnement | P0 | 6 |
| ROB-02 | Timeouts explicites sur appels réseau critiques | P1 | 5 |
| ROB-03 | Fallback/gestion d’erreurs réseau robuste | P1 | 4 |

### 4) Qualité & tests — 20 pts

| ID | Critère | Priorité | Points |
|---|---|---:|---:|
| QLT-01 | CI verte sur checks existants (lint/type/test/build) | P0 | 8 |
| QLT-02 | Aucun import cassé dans code touché | P0 | 4 |
| QLT-03 | Couverture des flux critiques impactés (test ajouté ou existant mis à jour) | P1 | 4 |
| QLT-04 | Pas de dette ajoutée évitable (duplication, any gratuit, hacks) | P2 | 4 |

### 5) Architecture & scope V1 — 10 pts

| ID | Critère | Priorité | Points |
|---|---|---:|---:|
| ARC-01 | Respect de la stack cible déclarée pour la PR (pas de dispersion) | P1 | 5 |
| ARC-02 | Changements strictement dans le périmètre métier annoncé | P2 | 5 |

---

## Checklist exécutable par reviewer

Cocher chaque item et documenter la preuve (fichier, log CI, commande, capture).

- [ ] **SEC-01 (P0)** Secrets hardcodés absents du code runtime
- [ ] **SEC-02 (P0)** AuthN/AuthZ valide sur routes protégées
- [ ] **SEC-03 (P0)** Vérification signature webhook active
- [ ] **SEC-04 (P1)** Rate limit actif sur endpoints sensibles
- [ ] **SEC-05 (P1)** Logs RGPD-safe
- [ ] **API-01 (P0)** Contrats front/API cohérents (pas d’endpoint manquant)
- [ ] **API-02 (P1)** Validation Zod sur endpoints critiques modifiés
- [ ] **API-03 (P1)** Schéma d’erreur homogène
- [ ] **API-04 (P1)** HTTP status corrects
- [ ] **ROB-01 (P0)** URLs externes via env uniquement
- [ ] **ROB-02 (P1)** Timeouts explicites présents
- [ ] **ROB-03 (P1)** Gestion erreurs/fallbacks présents
- [ ] **QLT-01 (P0)** CI verte
- [ ] **QLT-02 (P0)** Imports/références OK
- [ ] **QLT-03 (P1)** Tests flux critiques impactés
- [ ] **QLT-04 (P2)** Dette non augmentée
- [ ] **ARC-01 (P1)** Architecture cohérente
- [ ] **ARC-02 (P2)** Scope respecté

---

## Feuille de score (à remplir)

| Catégorie | Score obtenu | Score max |
|---|---:|---:|
| Sécurité & conformité |  | 35 |
| Contrats API/Front |  | 20 |
| Robustesse runtime |  | 15 |
| Qualité & tests |  | 20 |
| Architecture & scope |  | 10 |
| **TOTAL** |  | **100** |

### Verdict

- [ ] PASS (>= 90)
- [ ] PASS conditionnel (80–89)
- [ ] FAIL (< 80)
- [ ] FAIL immédiat (au moins un P0 KO)

### P0 en échec (obligatoire si FAIL)

- 

### Correctifs exigés avant merge

1. 
2. 
3. 

---

## Commandes minimales recommandées (local/CI)

- Front lint: `npx eslint src`
- Front typecheck: `npx tsc -p tsconfig.json --noEmit`
- Front tests: `npx jest --config jest.tasks.config.cjs`
- Backend tests: `python -m pytest -v --tb=short`
- Secret scan: workflow `trufflehog.yml`

> Note: utiliser en priorité les jobs/workflows déjà présents dans `.github/workflows/`.
