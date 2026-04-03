# Veille GitHub exploitable - MemoLib

Date: 2026-04-03  
Contexte: Transformer une liste de repositories en decisions produit et techniques actionnables.

## 1) Objectif de la veille

- Eviter le piege "copier-coller de repos".
- Prioriser ce qui cree de la valeur immediate pour MemoLib.
- Integrer progressivement, sans casser le pipeline existant.

## 2) Synthese priorisee (Now / Next / Later)

## NOW (impact fort, risque controle)

1. Semantic Kernel (C#)
- Valeur MemoLib: orchestration IA, classification email, extraction d'intention, proposition d'action.
- Pourquoi maintenant: c'est le coeur "email -> decision" du produit.
- Integration cible: service d'analyse externe appele par le pipeline email existant.

2. MailKit
- Valeur MemoLib: ingestion IMAP/SMTP robuste (inbound/outbound).
- Pourquoi maintenant: point d'entree metier.
- Integration cible: connecteur de collecte vers la couche de normalisation email.

3. Elsa Workflows
- Valeur MemoLib: modelisation explicite des etapes (recu, analyse, validation, execution).
- Pourquoi maintenant: rend le workflow auditable et evolutif.
- Integration cible: orchestration des transitions et statuts de traitement.

## NEXT (valeur elevee, depend d'une base stable)

4. Elasticsearch (ou Meilisearch si demarrage rapide)
- Valeur MemoLib: recherche full-text rapide sur emails, dossiers, pieces.
- Pourquoi ensuite: utile une fois les donnees bien normalisees.
- Integration cible: index asynchrone sur objets metier critiques.

5. Serilog
- Valeur MemoLib: logs structures, traces RGPD, audit et diagnostics.
- Pourquoi ensuite: necessaire avant scale production multi-tenant.
- Integration cible: correlation id par workflow, journalisation decisionnelle.

6. OpenIddict
- Valeur MemoLib: auth centralisee, gestion scopes/roles, delegation securisee.
- Pourquoi ensuite: important pour securite avocat et SSO.
- Integration cible: couche identite unifiee pour API et back-office.

## LATER (a lancer quand le coeur est valide)

7. MudBlazor
- Valeur MemoLib: acceleration UI pour un front C# natif.
- Condition: decision explicite de migrer/ajouter un front Blazor.
- Note: ne pas bloquer le delivery actuel si le front Next.js couvre deja l'usage.

8. Paperless-ngx / Docspell
- Valeur MemoLib: gestion documentaire/OCR prets a l'emploi.
- Condition: arbitrer build-vs-buy et contraintes de souverainete donnees.

9. LangChain / Haystack
- Valeur MemoLib: RAG et recherche juridique avancee.
- Condition: besoin de retrieval complexe au-dela du moteur de recherche principal.

## 3) Mapping concret dans MemoLib (etat actuel -> cible)

Flux cible:
- Ingestion email
- Classification IA
- Validation humaine
- Action metier
- Tracabilite

Mapping:
1. Email recu
- Existant: endpoints et services emails deja presents.
- Cible: brancher MailKit/Graph en source d'entree standardisee.

2. Analyse
- Existant: classification/fallback deja present via services email.
- Cible: introduire Semantic Kernel comme moteur principal d'analyse.

3. Validation
- Existant: ecrans/actions pending + approbation/rejet.
- Cible: conserver human-in-the-loop comme garde-fou par defaut.

4. Workflow
- Existant: notions de workflow et statuts en place.
- Cible: porter progressivement les transitions dans Elsa.

5. Recherche
- Existant: donnees structurees disponibles en base.
- Cible: index externe (Elasticsearch/Meilisearch) pour requetes multi-objets.

6. Audit et securite
- Existant: auth session + logs applicatifs.
- Cible: OpenIddict + Serilog pour gouvernance niveau production.

## 4) Plan d'implementation incremental (4 etapes)

Etape 1 - Starter operationnel (1 sprint)
- UI simple de validation email (liste + valider/rejeter + statut).
- API stable pour lister et valider.
- Definition claire des contrats JSON.

Definition of done:
- Un email entrant peut etre valide manuellement en moins de 3 clics.
- Les statuts sont persistants et auditables.

Etape 2 - Ajout IA (Semantic Kernel)
- Ajouter un adaptateur SK (classification + suggestion action).
- Fallback deterministic si SK indisponible.
- Mesurer precision et taux d'acceptation humain.

Definition of done:
- Chaque email recoit categorie, urgence, action suggeree.
- Aucune regression sur le flux manuel.

Etape 3 - Orchestration workflow (Elsa)
- Modeler etat/transition: RECEIVED -> ANALYZED -> READY_FOR_REVIEW -> APPROVED/REJECTED -> EXECUTED.
- Ajouter timeouts, retries, dead-letter.

Definition of done:
- Chaque transition est tracable avec horodatage et acteur.

Etape 4 - Industrialisation (search + logs + auth)
- Ajouter moteur de recherche.
- Ajouter logs structures et observabilite.
- Renforcer auth/roles/scopes.

Definition of done:
- Recherche transverse < 300 ms sur corpus cible.
- Audit complet d'un dossier de bout en bout.

## 5) Regles d'adoption (anti-erreur)

- Ne jamais importer un repository "tel quel" dans MemoLib.
- Toujours passer par un adaptateur local avec interface stable.
- Commencer par un POC limite, puis generaliser.
- Mettre des KPI explicites avant d'etendre.

KPI minimum:
- Taux de bonne classification.
- Temps moyen de traitement d'un email.
- Taux de validation manuelle sans correction.
- Taux d'erreur workflow.

## 6) Starter scope recommande maintenant

A faire tout de suite:
1. Stabiliser l'UX "email -> validation".
2. Ajouter le contrat d'adaptateur IA (Semantic Kernel-ready).
3. Ajouter un journal d'evenements minimal par action.

A ne pas faire tout de suite:
1. Migration front complete vers Blazor.
2. Ajout simultane de plusieurs moteurs de recherche.
3. Refonte auth totale avant stabilisation du coeur metier.

## 7) Stack cible MemoLib (version realiste)

- Frontend: Next.js actuel (court terme), Blazor + MudBlazor seulement si trajectoire C# front confirmee.
- Backend: ASP.NET Core + API actuelle.
- IA: Semantic Kernel.
- Workflow: Elsa.
- Email: MailKit (+ Graph pour M365).
- Search: Elasticsearch (Meilisearch en alternative simple).
- Logs: Serilog.
- Auth: OpenIddict.
- Infra: Azure.

## 8) Prochaine action conseillee

Prendre l'Etape 1 comme lot ferme (UI + API + statuts), puis brancher SK en Etape 2 sans modifier l'experience utilisateur.
