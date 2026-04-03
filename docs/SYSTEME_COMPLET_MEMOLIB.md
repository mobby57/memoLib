# Systeme complet MemoLib (Tech + Business + UX + Securite)

Date: 2026-04-03

## Vision produit

MemoLib doit fournir un parcours simple:
1. Recevoir les donnees (email, pieces, formulaires)
2. Comprendre le contenu (IA)
3. Orchestrer les actions (workflow)
4. Garder l'humain en controle (validation)
5. Rendre tout retrouvable (base + recherche)
6. Prouver la conformite (audit + securite)

## Architecture globale cible

```text
[Email / Docs / API]
      |
      v
[Ingestion Layer]
MailKit | Graph | Upload API
      |
      v
[Intelligence Layer]
Semantic Kernel (primary) -> local fallback
      |
      v
[Workflow Layer]
Elsa states + business rules + SLA timers
      |
      v
[Human Validation]
Inbox intelligente | ecran validation | decisions
      |
      v
[Domain Core]
Cases | Clients | Tasks | Events | Attachments
      |
      v
[Search + Memory]
PostgreSQL + Elasticsearch/Meilisearch
      |
      v
[Security + Audit + Observability]
OpenIddict | Serilog | immutable event trail
      |
      v
[Business Layer]
Plans | quotas | usage IA | conversion demo -> client
```

## Les 6 piliers et decisions

## 1) Ingestion

Objectif:
- Accepter plusieurs sources sans coupler le metier a un provider.

Decisions:
- Standardiser un contrat `IngestEmailRequest` unique.
- Ajouter `sourceProvider`, `messageId`, `threadId`, `attachments[]`.
- Utiliser un adaptateur par source (MailKit, Graph).

DoD:
- Un email entrant est visible en inbox en moins de 5 secondes.

## 2) Intelligence IA

Objectif:
- Classifier et proposer une action, pas remplacer l'expert.

Decisions:
- Semantic Kernel en moteur prioritaire.
- Fallback local (Ollama / regles) si indisponible.
- Stocker `confidence`, `reasoningSummary`, `suggestedActions`.

DoD:
- Chaque message a categorie + urgence + suggestion.

## 3) Workflow

Objectif:
- Pipeline explicite et traçable.

State machine cible:
- RECEIVED
- ANALYZED
- READY_FOR_REVIEW
- APPROVED | REJECTED
- EXECUTED
- CLOSED

DoD:
- Chaque transition a acteur, horodatage, raison.

## 4) Interface UX

Objectif:
- Comprendre la situation en 10 secondes.

Ecrans minimaux:
- Inbox intelligente (file d'attente)
- Ecran de validation (approve/reject + notes)
- Dashboard (volumes, SLA, taux d'acceptation)

UX rules:
- Une action principale par ecran.
- Priorite visible par couleur + tag texte.
- Zero ambiguite sur l'etat du dossier.

## 5) Securite et conformite

Objectif:
- Produit vendable a un cabinet juridique.

Decisions:
- OpenIddict (roles/scopes/tokens)
- Serilog structure + correlation id
- Journal d'audit immuable sur transitions et decisions
- Redaction PII avant envoi IA externe

DoD:
- Audit complet d'un dossier de bout en bout.

## 6) Business et distribution

Objectif:
- Transformer la valeur produit en revenu repetable.

Decisions:
- Plans: Starter, Cabinet, Enterprise
- Quotas: volume ingestion, requetes IA, stockage
- Conversion: demo guidee -> essai -> abonnement
- KPI: activation, retention, conversion, MRR

DoD:
- Dashboard business avec funnel demo -> actif -> payant.

## Dossier fonctionnel (v1)

Entites coeur:
- Tenant
- User
- Client
- Dossier
- Email
- WorkflowExecution
- WorkflowTransition
- ValidationDecision
- AuditEvent
- SearchDocument
- Subscription

## Parcours utilisateur cible

1. Reception email
2. Analyse automatique
3. Proposition d'action
4. Validation humaine
5. Creation ou mise a jour dossier
6. Indexation recherche
7. Suivi dans dashboard

## Regles anti-dispersion

- Ne jamais integrer un repo brut dans le coeur metier.
- Toujours passer par un adaptateur local.
- Une brique = un objectif de pilier.
- Si pas de valeur pilier, ne pas ajouter.

## Priorisation concrete

Now:
1. Inbox + validation stable
2. Contrats API pipeline
3. Semantic Kernel adapter + fallback

Next:
1. Elsa transitions + SLA timers
2. Index recherche
3. Audit et logs structures

Later:
1. SSO avance et federation
2. Optimisation pricing et analytics growth
3. Front Blazor si trajectoire validee
