# Checklist Go-Live MemoLib

Cette checklist definit le passage vers le pilote avec des donnees reelles. Elle ne
certifie pas la conformite juridique : les decisions de conformite et de securite
doivent etre validees par les responsables competents du cabinet.

## Regle de decision

| Verdict | Conditions |
| --- | --- |
| **NO-GO** | Au moins un controle `Bloquant` est en echec, sans preuve, ou n'a pas ete execute dans l'environnement cible. |
| **GO pilote limite** | Tous les controles bloquants sont valides, les risques non bloquants ont un responsable et une date de correction, et les cinq pilotes ont donne leur accord ecrit. |
| **GO commercial** | Le pilote limite est valide, cinq cabinets utilisent la solution de maniere autonome et au moins deux acceptent de payer. |

Chaque ligne doit etre cochee avec une preuve datee : lien vers un test CI, ticket,
capture non sensible, journal d'audit anonymise ou compte-rendu de test pilote.

| Statut | Type | Signification |
| --- | --- | --- |
| `[ ]` | Bloquant | A valider avant toute donnee client reelle. |
| `[ ]` | Requis | A valider avant la fin du pilote limite. |
| `[ ]` | Suivi | Mesure ou amelioration a suivre pendant le pilote. |
| `A` | Automatise | Test CI, test E2E, scan ou controle reproductible. |
| `M` | Manuel | Controle humain documente. |

## G. Gouvernance de sortie

| ID | Statut | Mode | Controle | Preuve attendue |
| --- | --- | --- | --- | --- |
| G01 | [ ] Bloquant | M | Le perimetre du pilote, les fonctions actives et les limites sont ecrits. | Document de perimetre approuve |
| G02 | [ ] Bloquant | M | Un responsable produit, technique, securite et incident est nomme. | RACI avec coordonnees internes |
| G03 | [ ] Bloquant | M | Les risques connus ont une severite, un responsable et une date de traitement. | Registre des risques |
| G04 | [ ] Bloquant | M | Les environnements pilote et developpement sont distincts. | Configuration d'environnement revue |
| G05 | [ ] Bloquant | A | Le deploiement cible est reproductible depuis la branche de release. | Execution CI verte |
| G06 | [ ] Bloquant | M | Un gel des migrations et changements non critiques est defini avant le pilote. | Plan de release |
| G07 | [ ] Requis | M | La procedure de rollback applicatif est testee. | Compte-rendu de rollback |
| G08 | [ ] Bloquant | M | Les contacts d'escalade et la plage de support pilote sont communiques. | Guide pilote |
| G09 | [ ] Requis | M | Les conditions d'utilisation et l'information RGPD pilote sont accessibles. | Liens verifies |
| G10 | [ ] Bloquant | M | La decision GO/NO-GO est signee et datee. | Proces-verbal de release |

## U. Experience avocat et onboarding

| ID | Statut | Mode | Controle | Preuve attendue |
| --- | --- | --- | --- | --- |
| U01 | [ ] Bloquant | M | Un avocat cree seul un compte neuf en moins de deux minutes. | Observation chronometree |
| U02 | [ ] Bloquant | M | Les champs obligatoires et erreurs d'inscription sont comprehensibles. | Test utilisateur |
| U03 | [ ] Bloquant | M | La verification d'email et la connexion initiale sont explicites. | Test compte neuf |
| U04 | [ ] Requis | M | L'onboarding explique les permissions email demandees avant OAuth. | Capture et revue UX |
| U05 | [ ] Bloquant | M | Le tableau de bord indique clairement la prochaine action utile. | Test utilisateur sans aide |
| U06 | [ ] Requis | M | Un avocat trouve ses emails, dossiers et clients en moins de trente secondes. | Test chronometre |
| U07 | [ ] Requis | M | Les etats vides expliquent quoi faire et ne ressemblent pas a une panne. | Revue UX |
| U08 | [ ] Bloquant | M | Les erreurs affichent une action de reprise sans detail technique. | Tests de cas en erreur |
| U09 | [ ] Requis | M | Les actions irreversibles demandent une confirmation explicite. | Revue UX |
| U10 | [ ] Suivi | M | Les parcours principaux sont utilisables sur les resolutions pilotes ciblees. | Matrice navigateurs/ecrans |

## O. Connexion Gmail, Outlook et identite

| ID | Statut | Mode | Controle | Preuve attendue |
| --- | --- | --- | --- | --- |
| O01 | [ ] Bloquant | A | Les routes OAuth verifient la session et le tenant cote serveur. | Tests de routes |
| O02 | [ ] Bloquant | A | Le parametre `state` OAuth est genere, stocke et valide au callback. | Test callback invalide |
| O03 | [ ] Bloquant | A | Les tokens OAuth sont chiffres au repos et jamais exposes au client. | Revue code/configuration |
| O04 | [ ] Bloquant | A | Un callback OAuth refuse un code, state ou redirect URI invalide. | Tests d'echec OAuth |
| O05 | [ ] Bloquant | M | Les scopes Gmail et Outlook sont limites au besoin reel du pilote. | Revue des ecrans consentement |
| O06 | [ ] Requis | A | Une deconnexion revoque ou invalide localement les tokens concernes. | Test deconnexion |
| O07 | [ ] Bloquant | A | Un token expire declenche une reconnexion claire sans boucle. | Test token expire |
| O08 | [ ] Requis | M | Un compte peut connecter Gmail et Outlook sans melanger les boites. | Test multi-fournisseur |
| O09 | [ ] Bloquant | A | Un utilisateur ne peut consulter ni reconnecter la boite d'un autre tenant. | Test isolation tenant |
| O10 | [ ] Requis | M | La perte d'autorisation fournisseur est visible dans l'interface. | Test retrait de consentement |

## E. Ingestion et traitement d'email

| ID | Statut | Mode | Controle | Preuve attendue |
| --- | --- | --- | --- | --- |
| E01 | [ ] Bloquant | A | Un email entrant est rattache au tenant de la boite connectee. | Test integration tenant |
| E02 | [ ] Bloquant | A | La deduplication utilise un identifiant stable du message ou checksum. | Test doublon |
| E03 | [ ] Bloquant | A | Un email sans piece jointe est traite sans erreur serveur. | Test API/E2E |
| E04 | [ ] Requis | A | Dix pieces jointes valides sont gerees dans les limites documentees. | Test charge controle |
| E05 | [ ] Bloquant | A | Les formats interdits, tailles excessives et MIME incoherents sont rejetes. | Tests upload securite |
| E06 | [ ] Bloquant | A | Un PDF illisible est mis en attente avec une action de reprise. | Test document corrompu |
| E07 | [ ] Bloquant | A | Un expéditeur inconnu cree une proposition, jamais un client automatiquement. | Test flux brouillon |
| E08 | [ ] Bloquant | A | Un dossier inconnu cree une proposition necessitant validation humaine. | Test flux brouillon |
| E09 | [ ] Requis | M | Les emails longs et encodages courants restent lisibles. | Jeu de donnees pilote |
| E10 | [ ] Bloquant | A | Les webhooks email verifient signature et idempotence avant traitement. | Tests webhook |

## I. IA, CESEDA et validation humaine

| ID | Statut | Mode | Controle | Preuve attendue |
| --- | --- | --- | --- | --- |
| I01 | [ ] Bloquant | A | Toute analyse IA est exposee comme proposition et non comme decision. | Test UI/API |
| I02 | [ ] Bloquant | A | Aucun brouillon juridique ne peut etre envoye sans action explicite de l'avocat. | Test de non-envoi |
| I03 | [ ] Bloquant | A | Une faible confiance ou donnee incomplete impose une validation humaine. | Test seuil de confiance |
| I04 | [ ] Bloquant | A | Une deadline ambigue est signalee comme a verifier, jamais validee automatiquement. | Cas de test CESEDA |
| I05 | [ ] Bloquant | A | L'indisponibilite IA echoue proprement sans perte de l'email source. | Test resilience IA |
| I06 | [ ] Requis | A | Une reponse IA malformee est rejetee ou degradee en brouillon sur. | Test JSON malforme |
| I07 | [ ] Requis | A | La source, le fournisseur et la confiance de l'analyse sont tracables. | EventLog/analyse |
| I08 | [ ] Bloquant | M | Les regles de delais pilotees ont ete revues par un professionnel competent. | Revue juridique datee |
| I09 | [ ] Requis | A | Les alertes J-7, J-3 et J-1 sont generees aux bons fuseaux horaires. | Tests de dates |
| I10 | [ ] Bloquant | M | Les avertissements indiquent que l'avocat reste responsable de la decision. | Revue des ecrans et CGU |

## S. Securite applicative et isolation cabinet

| ID | Statut | Mode | Controle | Preuve attendue |
| --- | --- | --- | --- | --- |
| S01 | [ ] Bloquant | A | Toutes les routes metier protegees exigent une session valide. | Inventaire et tests 401 |
| S02 | [ ] Bloquant | A | Chaque route metier verifie role et abonnement cote serveur. | Tests RBAC |
| S03 | [ ] Bloquant | A | Aucune route ne retourne une ressource d'un autre tenant par identifiant. | Tests cross-tenant |
| S04 | [ ] Bloquant | A | Les parametres et payloads des routes sensibles sont valides avec Zod. | Revue et tests 400 |
| S05 | [ ] Bloquant | A | Les erreurs de production ne revelent ni stack trace ni secret. | Tests erreurs |
| S06 | [ ] Bloquant | A | Les headers HTTPS, CSP, HSTS, anti-clickjacking et MIME sont verifies. | Scan headers cible |
| S07 | [ ] Bloquant | A | Les cookies de session sont Secure, HttpOnly et SameSite adaptes. | Test navigateur |
| S08 | [ ] Bloquant | A | Login, reset password, OAuth, upload et webhooks sont limites en debit. | Tests 429 |
| S09 | [ ] Bloquant | A | Les signatures Stripe, email et autres webhooks sont verifiees. | Tests signature invalide |
| S10 | [ ] Bloquant | A | Un scan de secrets et de dependances ne contient aucun finding critique ouvert. | Rapport CI date |

## R. RGPD, confidentialite et droits des personnes

| ID | Statut | Mode | Controle | Preuve attendue |
| --- | --- | --- | --- | --- |
| R01 | [ ] Bloquant | M | Le registre des traitements couvre emails, documents, IA et sous-traitants. | Registre approuve |
| R02 | [ ] Bloquant | M | Les bases legales, durées de conservation et finalites sont documentees. | Politique de confidentialite |
| R03 | [ ] Bloquant | A | Les logs applicatifs ne contiennent pas d'email, contenu de document, token ou mot de passe. | Revue logs anonymises |
| R04 | [ ] Bloquant | A | L'export d'un tenant contient les donnees prevues, et seulement elles. | Test export isole |
| R05 | [ ] Bloquant | A | La suppression de compte/tenant supprime ou anonymise les donnees definies. | Test suppression |
| R06 | [ ] Requis | M | Le traitement des sauvegardes apres suppression est documente. | Politique backup |
| R07 | [ ] Bloquant | M | Les accords de sous-traitance des fournisseurs actifs sont disponibles. | DPA signes |
| R08 | [ ] Bloquant | M | Les transferts hors UE et mesures associees sont identifies. | Revue fournisseurs |
| R09 | [ ] Requis | A | L'acces aux documents est trace sans enregistrer leur contenu. | Journal d'audit |
| R10 | [ ] Requis | M | La procedure de reponse a une demande d'acces ou suppression est testee. | Exercices documentes |

## F. Fiabilite, sauvegarde et reprise

| ID | Statut | Mode | Controle | Preuve attendue |
| --- | --- | --- | --- | --- |
| F01 | [ ] Bloquant | A | Les migrations Prisma sont executees et reversibles selon le plan de release. | CI migration |
| F02 | [ ] Bloquant | M | Une sauvegarde de base pilote est restauree dans un environnement isole. | Compte-rendu restauration |
| F03 | [ ] Bloquant | M | Le RPO et le RTO pilotes sont definis et realistes. | Objectifs operationnels |
| F04 | [ ] Bloquant | A | Une erreur base de donnees retourne un message de reprise sans corruption. | Test panne DB |
| F05 | [ ] Bloquant | A | Une erreur reseau n'entraine pas de creation dupliquee. | Test retry/idempotence |
| F06 | [ ] Requis | A | Les jobs cron sont authentifies et prevenus contre les executions multiples. | Tests cron |
| F07 | [ ] Requis | M | La supervision alerte sur indisponibilite, taux d'erreur et backlog email. | Test d'alerte |
| F08 | [ ] Requis | A | Les limites de taille, duree et concurrence sont appliquees aux traitements lourds. | Test de charge |
| F09 | [ ] Bloquant | M | La procedure d'incident distingue les obligations produit, securite et RGPD. | Runbook incident |
| F10 | [ ] Suivi | M | Les metriques de latence et echec sont revues chaque semaine du pilote. | Tableau de suivi |

## B. Facturation, support et operations cabinet

| ID | Statut | Mode | Controle | Preuve attendue |
| --- | --- | --- | --- | --- |
| B01 | [ ] Bloquant | A | Les webhooks de paiement valident signature et evenement unique. | Tests Stripe |
| B02 | [ ] Bloquant | A | Un statut d'abonnement ne donne jamais plus de droits que le plan actif. | Tests de quota |
| B03 | [ ] Requis | A | Echec, remboursement et annulation de paiement sont traites proprement. | Tests billing |
| B04 | [ ] Requis | M | Les prix, taxes et conditions pilote sont explicites avant paiement. | Revue parcours |
| B05 | [ ] Bloquant | M | Le support sait identifier le tenant sans demander d'informations excessives. | Procedure support |
| B06 | [ ] Requis | M | Les demandes de support sont classifiees sans copier de contenu confidentiel inutile. | Modele de ticket |
| B07 | [ ] Requis | A | Les exports documentaires respectent les permissions du dossier. | Test export RBAC |
| B08 | [ ] Requis | M | Un cabinet peut obtenir ses donnees dans un format documente. | Export de test |
| B09 | [ ] Requis | M | La fermeture du compte est expliquée, y compris retention et sauvegardes. | Guide de sortie |
| B10 | [ ] Suivi | M | Les couts IA, stockage et support sont mesures par tenant pilote. | Tableau de couts |

## P. Pilote avocat et preuve de valeur

| ID | Statut | Mode | Controle | Preuve attendue |
| --- | --- | --- | --- | --- |
| P01 | [ ] Bloquant | M | Cinq cabinets pilotes ont accepte le protocole et le perimetre. | Accords pilotes |
| P02 | [ ] Bloquant | M | Chaque pilote utilise une boite mail reelle avec consentement approprie. | Attestation pilote |
| P03 | [ ] Bloquant | M | Chaque avocat connecte sa boite sans assistance en moins de cinq minutes. | Observations chronometrees |
| P04 | [ ] Requis | M | Chaque avocat traite son premier email en moins de deux minutes. | Observation chronometree |
| P05 | [ ] Requis | M | Chaque avocat cree ou associe un dossier en moins d'une minute. | Observation chronometree |
| P06 | [ ] Bloquant | M | Aucune erreur bloquante non resolue ne survient pendant le parcours principal. | Journal pilote |
| P07 | [ ] Requis | M | Les interventions de l'equipe sont mesurees par cabinet et motif. | Journal support |
| P08 | [ ] Requis | M | Les avocats comprennent que les analyses sont des propositions a valider. | Questionnaire pilote |
| P09 | [ ] Requis | M | La question de valeur est posee : usage perdu et prix mensuel acceptable. | Entretiens dates |
| P10 | [ ] Bloquant | M | Au moins deux des cinq cabinets acceptent de payer pour continuer. | Engagement ecrit ou paiement |

## Execution minimale avant le premier pilote

1. Executer les suites existantes de type unitaire, integration, E2E, securite et
   charge sur l'environnement cible.
2. Completer les preuves des controles `Bloquant`, puis prendre la decision
   **GO pilote limite** dans G10.
3. Faire le pilote avec cinq cabinets, relever P03 a P10 et ne passer au
   **GO commercial** que si P10 est satisfait.
