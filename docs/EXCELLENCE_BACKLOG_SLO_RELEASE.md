# Plan Excellence Produit - Backlog, KPI/SLO, Release 6 Sprints

Date: 2026-04-02
Version: 1.0.0
Scope: MemoLib Communication Workflow

---

## 1. Backlog priorise (P0 / P1 / P2)

## P0 - Critique (fiabilite, securite, conformite)

| ID | Epic | User Story | Priorite | Estimation | Definition of Done |
|---|---|---|---|---|---|
| P0-01 | Observabilite | En tant qu'ops, je veux voir chaque etape du workflow en temps reel pour detecter vite les incidents. | P0 | 8 pts | Dashboard live + alertes + logs corrélés par `communicationId`. |
| P0-02 | EventLog immuable | En tant qu'auditeur, je veux une trace complete non modifiable de toutes les transitions. | P0 | 8 pts | 100% transitions journalisees, table append-only, verification integrite. |
| P0-03 | Idempotence ingestion | En tant que systeme, je veux ignorer les doublons entrants sans perte. | P0 | 5 pts | Contrainte unique (`externalMessageId`,`sourceSystem`) + tests concurrence. |
| P0-04 | Validation humaine obligatoire | En tant que responsable, je veux bloquer tout envoi externe non valide. | P0 | 5 pts | Guard applicatif + test E2E prouvant blocage si non valide. |
| P0-05 | Retry diffusion robuste | En tant qu'utilisateur, je veux que les echecs transitoires soient auto-rattrapes. | P0 | 5 pts | Backoff exponentiel + dead-letter queue + reprise manuelle. |
| P0-06 | RBAC/ABAC dossiers | En tant qu'avocat, je veux uniquement voir les dossiers autorises. | P0 | 8 pts | Controle acces sur API + UI + audit des refus. |
| P0-07 | Secrets et chiffrement | En tant que RSSI, je veux des secrets hors code et donnees chiffrees. | P0 | 5 pts | Vault actif, rotation cles, TLS force, chiffrement au repos documente. |
| P0-08 | Conformite template | En tant que compliance officer, je veux bloquer les messages sans clauses legales requises. | P0 | 5 pts | Validateur schema + erreurs explicites + tests metier. |

## P1 - Elevé (performance, gouvernance, UX avancee)

| ID | Epic | User Story | Priorite | Estimation | Definition of Done |
|---|---|---|---|---|---|
| P1-01 | Console operations | Vue unique incidents, files, retries, escalades. | P1 | 8 pts | Console avec filtres, actions rapides, historique interventions. |
| P1-02 | Gouvernance templates | Workflow approbation template a 2 niveaux. | P1 | 8 pts | Etats DRAFT/APPROVED/RETIRED + rollback version. |
| P1-03 | Seuils IA par tenant | Reglages confiance IA par secteur/cabinet. | P1 | 5 pts | Parametrage multi-tenant + tests regression. |
| P1-04 | Diff intelligent validation | Comparer suggestion IA vs final avant envoi. | P1 | 5 pts | Diff lisible + alerte suppression clause legale. |
| P1-05 | SLA escalade auto | Urgence high non traitee dans delai => escalade. | P1 | 5 pts | Scheduler + notifications superviseur + journalisation. |
| P1-06 | Tests de charge | Garantir comportement stable en pic d'activite. | P1 | 8 pts | Scenarios charge + rapport + seuils validés. |

## P2 - Differenciation (excellence produit)

| ID | Epic | User Story | Priorite | Estimation | Definition of Done |
|---|---|---|---|---|---|
| P2-01 | Score qualite message | Evaluer clarte/conformite/actionnabilite avant envoi. | P2 | 8 pts | Score calcule + seuil blocant configurable. |
| P2-02 | Copilote juridique | Suggérer corrections juridiques en revue. | P2 | 13 pts | Recommandations contextualisees + taux d'acceptation suivi. |
| P2-03 | Feedback loop IA | Apprendre des modifications utilisateur validees. | P2 | 13 pts | Pipeline feedback + tableau impact qualite IA. |
| P2-04 | Personnalisation tonalite | Adapter style selon tenant, role, type dossier. | P2 | 8 pts | Profils de communication paramétrables. |
| P2-05 | Mobile review premium | Validation rapide mobile avec actions critiques. | P2 | 8 pts | Flux mobile complet, accessibilite AA, perf mobile validee. |

---

## 2. Matrice KPI / SLO (avec seuils)

| Domaine | KPI | SLO cible | Seuil alerte | Fenetre mesure |
|---|---|---|---|---|
| Ingestion | Latence reception -> communication creee (P95) | <= 10 s | > 20 s | 7 jours glissants |
| Analyse IA | Latence ingestion -> suggestion IA (P95) | <= 60 s | > 90 s | 7 jours glissants |
| Validation | Delai median proposition -> decision humaine | <= 15 min | > 25 min | 30 jours |
| Validation | Taux communications urgentes traitees < 10 min | >= 95% | < 90% | 30 jours |
| Diffusion | Taux succes envoi apres retries | >= 99.0% | < 98.0% | 30 jours |
| Diffusion | Latence decision -> envoi confirme (P95) | <= 30 s | > 60 s | 7 jours glissants |
| Fiabilite | Taux duplicats non traites | = 0 | > 0 | quotidien |
| Audit | Completeness EventLog (event attendu present) | = 100% | < 99.9% | quotidien |
| Conformite | Taux envois sans clauses obligatoires | = 0 | > 0 | quotidien |
| IA | Taux suggestions acceptees sans retouche majeure | >= 70% | < 55% | 30 jours |
| UX | Satisfaction review (CSAT interne) | >= 4.5 / 5 | < 4.0 / 5 | mensuel |

SLI techniques de reference:

- `event_log_completeness = events_written / events_expected`
- `dispatch_success_rate = successful_dispatches / total_dispatch_attempts`
- `urgent_on_time_rate = urgent_validated_under_10m / urgent_total`
- `ai_acceptance_rate = ai_suggestions_accepted / ai_suggestions_total`

Error budget mensuel recommande:

- Disponibilite workflow coeur: 99.9% (budget ~43 min/mois).
- Diffusion externe: 99.0% (budget adapte aux dependances provider).

---

## 3. Plan release 6 sprints (2 semaines / sprint)

## Sprint 1 - Fondations traces + idempotence

Objectif:

- Stabiliser ingestion, dedup, correlation et observabilite minimale.

Stories cibles:

- P0-01, P0-03.

Criteres d'acceptation:

- Chaque message entrant possede un `communicationId` unique.
- Un doublon exact n'ouvre jamais un second workflow.
- Dashboard montre volume, erreurs, latence ingestion.

## Sprint 2 - EventLog + validation obligatoire

Objectif:

- Verrouiller la tracabilite et le gate humain.

Stories cibles:

- P0-02, P0-04.

Criteres d'acceptation:

- Toute transition d'etat cree un event append-only.
- Aucun envoi externe possible sans validation explicite.
- Timeline d'un dossier reconstituable en lecture seule.

## Sprint 3 - Diffusion robuste + securite essentielle

Objectif:

- Assurer fiabilite d'envoi et hygiene securite.

Stories cibles:

- P0-05, P0-07.

Criteres d'acceptation:

- Retry policy active avec dead-letter queue.
- Chiffrement en transit + secrets externalises.
- Rapport de tests de resilience diffusion valide.

## Sprint 4 - Conformite + gouvernance templates

Objectif:

- Industrialiser la qualite legale des messages.

Stories cibles:

- P0-08, P1-02.

Criteres d'acceptation:

- Blocage automatique si clause obligatoire absente.
- Workflow template DRAFT -> APPROVED -> RETIRED actif.
- Rollback template en moins de 5 minutes.

## Sprint 5 - Ops console + SLA escalade

Objectif:

- Donner le controle operationnel temps reel.

Stories cibles:

- P1-01, P1-05, P1-06.

Criteres d'acceptation:

- Console ops utilisable en production avec actions rapides.
- Escalade auto declenchee pour urgences hors SLA.
- Tests de charge atteignent les SLO cibles P95.

## Sprint 6 - Excellence UX + IA adaptee

Objectif:

- Augmenter valeur produit percue et precision decisionnelle.

Stories cibles:

- P1-03, P1-04, P2-01 (MVP), P2-03 (pilot).

Criteres d'acceptation:

- Diff IA/final visible et actionnable en revue.
- Seuil IA configurable par tenant.
- Score qualite message disponible avant envoi.
- Boucle feedback IA activee sur un perimetre pilote.

---

## 4. Sequencement de gouvernance

Rituels recommandes:

1. Weekly ops review (incidents, error budget, SLO).
2. Weekly product quality review (retouches, satisfaction, templates).
3. Mensuel compliance review (audit, retention, acces, clauses).

Gates de passage entre sprints:

1. Tous tests critiques verts.
2. SLO du sprint precedent non regressifs.
3. Checklist securite/conformite signee.

---

## 5. Ready-to-start (prochaine action)

1. Transformer les P0 en tickets techniques avec owners nominatifs.
2. Definir dashboards et alertes selon la matrice KPI/SLO.
3. Lancer Sprint 1 avec objectif ferme: dedup + observabilite exploitable.
