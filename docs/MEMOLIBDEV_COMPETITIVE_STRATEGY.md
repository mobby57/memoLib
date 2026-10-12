# MemoLibDev - Etude concurrentielle et positionnement

> Statut : recommandation strategique  
> Mise a jour : 7 octobre 2026  
> Perimetre : GitHub Copilot, Kiro, Cursor, Claude Code, OpenAI Codex, Devin et Windsurf.

## Decision recommandee

Ne pas positionner MemoLibDev comme un nouvel assistant de code ni comme un IDE.
Le positionner comme **l'assistant de travail numerique controle**, capable d'intervenir
sur un depot, des outils et des flux de travail sans prendre de decision irreversible
au nom de l'utilisateur.

La promesse produit doit etre :

> **MemoLibDev travaille pour vous, avec des preuves, mais n'agit jamais au-dela de
> votre autorisation.**

Cette proposition repond a un besoin peu adresse par les assistants de code : une
automatisation agentique explicable, gouvernable et utilisable hors IDE dans des
environnements professionnels sensibles.

## Marche observe

| Produit | Cible et distribution | Modele commercial observe | Forces a retenir | Limites a exploiter |
| --- | --- | --- | --- | --- |
| GitHub Copilot | Developpeurs, IDE, CLI et GitHub | Freemium, sieges et credits/premium requests | Presence dans le workflow, distribution GitHub, agents et revue de code | Forte dependance a GitHub et proposition surtout orientee developpement |
| Kiro | Developpeurs, IDE et AWS | Credits par niveau avec offres entreprise | Workflow spec -> taches -> implementation, choix de modeles, lien AWS | Produit centre IDE ; les credits rendent le cout de taches longues moins previsible |
| Cursor | Developpeurs utilisateurs d'IDE | Freemium, abonnements individuels/teams, consommation de modeles | Selection de contexte, rapidite du flux agentique, experience IDE | Valeur et distribution principalement liees a l'editeur |
| Claude Code | Developpeurs en terminal, IDE et web | Inclus dans les forfaits Claude, capacite partagee, usage additionnel | Travail sur un depot entier, terminal, raisonnement et contexte long | Capacite liee a des limites variables et gouvernance principalement entreprise |
| OpenAI Codex | Developpeurs, agents cloud et ecosysteme OpenAI | Inclus dans les forfaits ChatGPT et offres Business/Enterprise | Execution deleguee, API et couverture multi-surfaces | Dependance a un fournisseur et cout/comportement lies au modele |
| Devin | Equipes qui deleguent des taches logicielles | Quotas, surconsommation API, offre Team/Enterprise | Agent cloud autonome, integrations Git, Jira, Linear et messageries | Autonomie percue comme risque ; verification et controle doivent etre continus |
| Windsurf | Developpeurs IDE | Historiquement freemium, usage agentique et offres entreprise | Agent IDE, completions, contexte et flux rapide | La page Windsurf redirige actuellement vers Devin : ne pas en faire une reference de prix independante sans verification commerciale |

## Ce que le marche valide

1. **Freemium pour decouvrir, abonnement pour travailler, consommation pour depasser.**
   Les offres individuelles commencent typiquement autour de 20 USD par mois ; les
   utilisateurs intensifs paient davantage pour la capacite et la priorite, pas pour
   une liste de fonctions fondamentalement differente.
2. **Le code n'est plus le seul produit.** Les fournisseurs monetisent les agents
   cloud, les revues, les integrations, les modeles premium et le travail asynchrone.
3. **L'entreprise achete surtout de la gouvernance.** SSO, SCIM, RBAC, journaux
   d'audit, controles de reseau, facturation centralisee, isolation et support sont
   des criteres de conversion, pas de simples options techniques.
4. **Le cout reste difficile a predire.** Quotas, fenetres glissantes, credits et
   couts API resolvent la monetisation du fournisseur, mais pas toujours le besoin
   du client de comprendre le cout, le risque et le resultat d'une mission.

## Le modele MemoLibDev

### Parcours universel et explicable

| Niveau | Intention utilisateur | Autorisations MemoLibDev | Preuve produite |
| --- | --- | --- | --- |
| Observer | « Explique-moi ce qui se passe. » | Lecture seule | Sources consultees, synthese et incertitudes |
| Preparer | « Prepare la correction. » | Lecture et planification, sans ecriture | Plan, impacts, fichiers cibles et criteres d'acceptation |
| Tester | « Applique-la dans un environnement isole. » | Ecriture et execution exclusivement dans sandbox | Diff, journaux, resultats de tests et artefacts |
| Modifier | « Je valide. Fais-le sur le projet. » | Ecriture dans la cible apres validation explicite | Approbation, diff applique, verification et trace d'audit |

Ces niveaux sont une promesse commerciale visible, pas seulement un detail
d'implementation. Une action ne doit jamais monter de niveau implicitement.

### Boucle produit

```text
Comprendre -> Rechercher -> Raisonner -> Prouver -> Proposer
    -> Demander -> Agir -> Verifier -> Apprendre
```

Invariants :

- toute conclusion cite ses sources ou indique son incertitude ;
- toute mutation est precedee d'un plan, d'un diff ou d'un effet attendu lisible ;
- les outils et donnees accessibles sont determines par une politique explicite ;
- les ecritures, commandes et appels externes restent auditables ;
- l'apprentissage ne reutilise pas les donnees client sans base contractuelle et
  consentement approprie.

## Avantages defensables a construire

| Priorite | Capacite | Pourquoi elle cree de la valeur |
| --- | --- | --- |
| P0 | Evidence Gate | Evite les actions fondees sur un contexte insuffisant et rend l'agent defendable devant un responsable |
| P0 | Approbation humaine par niveau et par politique | Transforme le controle en experience produit simple et en argument d'achat |
| P0 | Journal d'audit exportable | Repond a la securite, a la conformite et au diagnostic d'incident |
| P0 | Sandbox reproductible avec verification | Separe exploration et risque operationnel ; fournit une preuve de bon fonctionnement |
| P1 | Moteur de contexte avec provenance | Ameliore les resultats sans enfermer l'utilisateur dans un IDE ou un fournisseur |
| P1 | Connecteurs GitHub, GitLab, terminal, CI/CD et hebergeurs | Rend le produit utile dans le flux de travail reel et reduit le cout de changement |
| P1 | Politiques organisationnelles | Permet de contraindre outils, reseaux, branches, secrets, budgets et validateurs |
| P2 | Multi-fournisseur et modele prive/local | Reduit le verrouillage, ameliore la resilience et ouvre les comptes sensibles |

Ne pas prioriser les animations, un nouvel editeur de code ou l'autonomie sans
preuves : ces elements ne constituent pas le coeur defensable du produit.

## Modele commercial recommande

| Offre | Client | Valeur vendue | Mesure de prix recommandee |
| --- | --- | --- | --- |
| Personal | Independants | Agent controle, sandbox locale, connecteurs essentiels, historique individuel | Siege mensuel avec enveloppe d'usage claire |
| Team | Petites equipes | Espaces partages, approbations, politiques equipe, budget et journal centralise | Siege mensuel + enveloppe d'usage mutualisee |
| Business / Enterprise | IT, cabinets, organisations regulees | SSO/SCIM, RBAC, retention, audit exportable, isolation, connecteurs prives et support | Contrat par siege ou organisation + capacite mutualisee et plafonds negociables |

Principes de facturation :

- publier une enveloppe incluse et un prix de surconsommation avant execution ;
- afficher une estimation de cout et de capacite avant une mission agentique longue ;
- appliquer par defaut un plafond de budget et une approbation en cas de depassement ;
- ne pas vendre des fonctionnalites de securite critiques uniquement comme options
  premium : le produit doit etre sur par defaut.

Les prix exacts MemoLibDev ne doivent etre fixes qu'apres des entretiens de
decouverte et une mesure du cout reel par mission. Copier les prix actuels des
concurrents serait une ancre faible : leurs limites et forfaits evoluent rapidement.

## Plan de validation avant investissement

1. Interroger 10 a 15 personnes ciblees, dont au moins 5 responsables techniques ou
   securite, sur les actions qu'elles n'autorisent pas aujourd'hui un agent a faire.
2. Tester un prototype avec quatre commandes explicites : observer, preparer, tester,
   modifier. Mesurer le taux de comprehension du plan, d'acceptation du diff et de
   rejet justifie.
3. Mesurer le cout complet par mission : contexte, appels de modele, execution,
   sandbox, stockage des preuves et support.
4. Ne retenir comme MVP que le cas d'usage pour lequel les utilisateurs paient pour
   le controle et les preuves, plutot que pour la seule generation de code.
5. Definir les conditions de lancement : taux de missions terminees avec preuve,
   taux de rollback, depassements de budget, temps d'approbation et taux de
   conversion d'un pilote payant.

## Sources primaires a revalider avant toute communication commerciale

Les informations d'offres et de prix changent frequemment. Cette etude est datee du
7 octobre 2026 ; une page tarifaire doit etre reverifiee lors de chaque mise a jour
commerciale.

- [GitHub Copilot - plans et tarifs](https://github.com/features/copilot/plans)
- [Kiro - tarifs](https://kiro.dev/pricing/)
- [Cursor - tarifs](https://cursor.com/pricing)
- [Anthropic Claude - tarifs et limites](https://claude.com/pricing)
- [OpenAI Codex - tarifs](https://chatgpt.com/codex/pricing/)
- [Devin - plans et tarifs](https://devin.ai/pricing)
- [Windsurf - tarifs](https://windsurf.com/pricing) (redirige actuellement vers Devin)
