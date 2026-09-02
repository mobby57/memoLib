# Cadrage de decision technique - MemoLib

**Statut :** proposition de cadrage  
**Date :** 1 septembre 2026  
**Audience :** equipe produit, avocat referent, juriste consultant et partenaires

## 1. Objet et principe de decision

MemoLib est un assistant juridique destine aux professionnels du droit des
etrangers. Le pilote doit demontrer qu'un flux assiste, explicable et soumis a
validation humaine permet de transformer des communications entrantes en
propositions fiables, sans automatiser de decision juridique ou de creation
metier.

Ce document distingue :

| Niveau    | Signification                                                                        |
| --------- | ------------------------------------------------------------------------------------ |
| Confirme  | Element present dans le depot ou acte par une decision documentee.                   |
| Propose   | Choix adapte au pilote, a confirmer par les responsables concernes.                  |
| A valider | Hypothese qui exige une verification contractuelle, technique, juridique ou terrain. |

Il complete l'[ADR-0001](ADR/0001-nextjs-modular-monolith.md) et
l'[architecture pilote](MEMOLIB_PILOT_ARCHITECTURE.md). En cas de divergence,
l'ADR prevaut pour les choix d'architecture.

## 2. Perimetre produit

### MVP du pilote

Le pilote vise les avocats en droit des etrangers et couvre les capacites
suivantes :

1. Recevoir un email ou un texte dans un flux authentifie.
2. Extraire une proposition structuree de procedure, de delais et d'actions.
3. Calculer les delais legaux selon des regles versionnees et tracables.
4. Soumettre toute proposition a une validation humaine avant toute mutation
   metier.
5. Conserver la source, le raisonnement utile, la decision humaine et
   l'historique d'audit.

La recherche de jurisprudence, l'export PDF, les integrations institutionnelles
et la collaboration avancee sont hors du chemin critique du pilote. Ils restent
des options produit post-pilote.

### Limites non negociables

- L'outil assiste le professionnel ; il ne rend pas de conseil juridique de
  maniere autonome.
- Aucun dossier, client, ecriture, delai ou message sortant n'est cree sans
  decision humaine authentifiee et autorisee.
- Les entrees libres passent par une adaptation vers un brouillon structure,
  suivie d'une validation humaine.
- Les donnees personnelles et documents sont traites selon un registre de
  sous-traitants, des durees de conservation et une procedure d'exercice des
  droits a valider avant le pilote.

## 3. Contraintes de pilotage

| Dimension    | Hypothese de travail                                          | Consequence                                                                             |
| ------------ | ------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| Utilisateurs | 3 a 5 avocats au pilote, puis 20 a 50 en production initiale. | Optimiser la fiabilite et le support avant la scalabilite massive.                      |
| Volumes      | 50 a 100 dossiers mensuels au pilote, puis 500 a 1 000.       | PostgreSQL et un monolithe modulaire suffisent ; mesurer avant d'extraire des services. |
| Canaux       | Web desktop prioritaire ; mobile web responsive ensuite.      | Eviter une application native ou PWA dediee au pilote.                                  |
| Equipe       | Une equipe reduite, TypeScript/Next.js/Prisma.                | Limiter les technologies et surfaces d'exploitation.                                    |
| Budget       | Maximum indicatif de 200 EUR par mois pour le pilote.         | Suivre par fournisseur le cout, le volume et les alertes de depassement.                |
| Echeance     | Lancement pilote cible sous deux a trois semaines.            | Privilegier le flux critique, la securite et l'observabilite.                           |

Les volumes, budget et echeance sont des hypotheses communiquees pour ce
cadrage. Ils ne constituent ni une prevision contractuelle ni une mesure de
production.

## 4. Decisions techniques

| Couche               | Decision                                                                                    | Statut    | Raison                                                                                                        |
| -------------------- | ------------------------------------------------------------------------------------------- | --------- | ------------------------------------------------------------------------------------------------------------- |
| Application          | Next.js 16, App Router, monolithe modulaire.                                                | Confirme  | Decision adoptee par ADR-0001 ; une seule frontiere applicative limite le cout operationnel.                  |
| Langage et interface | TypeScript et React 19 ; web responsive.                                                    | Confirme  | Dependances presentes dans le projet ; coherent avec l'equipe et le pilote web.                               |
| API                  | Route Handlers Next.js, validation Zod, auth et tenant scope cote serveur.                  | Confirme  | Contrat explicite de l'ADR-0001.                                                                              |
| Donnees              | PostgreSQL via Prisma.                                                                      | Confirme  | Le schema Prisma declare PostgreSQL ; les transactions et contraintes y protegent les mutations metier.       |
| IA                   | Fournisseur configure par environnement, avec sortie structuree et validation humaine.      | Propose   | Isoler le fournisseur derriere un adaptateur, mesurer cout, latence et qualite avant tout mecanisme de repli. |
| Emails               | Connexion Gmail/Outlook et ingestion unique signee et idempotente.                          | Confirme  | Defini dans l'architecture pilote.                                                                            |
| Cache et limitation  | Redis gere, uniquement pour le rate limiting, les caches bornes et les travaux idempotents. | Propose   | L'introduire sur les routes sensibles ; ne pas rendre les decisions metier dependantes du cache.              |
| Observabilite        | Erreurs, metriques techniques, alertes et journaux structures minimises.                    | Propose   | Les journaux ne doivent contenir ni contenu brut d'email ni donnees personnelles inutiles.                    |
| Deploiement          | Plateforme a region UE, sauvegardes et restauration documentees.                            | A valider | Choisir apres verification du contrat, des regions, de la DPA, du RPO/RTO et du cout.                         |

NextAuth, Railway, Neon, Upstash, Resend et un fournisseur IA precis ne sont pas
des engagements de ce document. Leur usage, leur region de traitement, leur
DPA et leur configuration de production doivent etre verifies dans les
configurations et contrats effectifs.

## 5. Exigences de securite et de conformite avant ouverture

| Domaine                          | Exigence de sortie                                                                                                                      |
| -------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| Authentification et autorisation | Chaque route protegee exige une session ; les acces sont tenant-scopes et controles par role.                                           |
| Entrees et webhooks              | Les payloads sont valides par Zod ; les webhooks verifient la signature, une fenetre temporelle et l'idempotence.                       |
| Secrets                          | Aucune cle applicative n'est exposee au navigateur ; inventaire, rotation et procedure de revocation documentes.                        |
| Donnees et audit                 | Les operations sensibles sont auditees avec identifiants et hashes ; les logs ne copient pas inutilement les sources brutes.            |
| Fichiers                         | Type, taille et contenu sont controles ; la strategie d'analyse antimalware et de quarantaine est definie avant les uploads externes.   |
| Continuite                       | Sauvegarde, PITR, restauration testee et procedure d'incident documentees avec RPO/RTO cibles.                                          |
| RGPD                             | Registre des traitements, sous-traitants, regions, base legale, retention, export et effacement sont valides avant les donnees pilotes. |

## 6. Mesures du pilote

Les decisions de capacite et de produit doivent s'appuyer sur des mesures
anonymisees et minimales, pas sur des predictions non verifiees.

| Indicateur                                                 | Usage de la mesure                                          |
| ---------------------------------------------------------- | ----------------------------------------------------------- |
| Dossiers et emails traites                                 | Dimensionner le support et les couts.                       |
| Taux d'acceptation, modification et rejet des propositions | Evaluer la qualite et la valeur de l'assistance IA.         |
| Latence p50/p95 par etape                                  | Identifier les goulots avant d'ajouter de l'infrastructure. |
| Cout IA par dossier et par tache                           | Definir des garde-fous budgetaires.                         |
| Erreurs d'ingestion, doublons et echecs de validation      | Verifier l'idempotence et la robustesse du flux.            |
| Signalements utilisateur et incidents                      | Prioriser les corrections produit et conformite.            |

Chaque indicateur doit disposer d'une finalite, d'une retention et d'un acces
documentes. Les donnees brutes ne sont pas necessaires pour les tableaux de
bord d'exploitation.

## 7. Roadmap de decision

### Avant le pilote

1. Faire valider le perimetre MVP et les regles de delai par le juriste et
   l'avocat referent.
2. Confirmer la configuration de production : fournisseurs, regions, DPA,
   sauvegardes, restauration et plafonds de cout.
3. Executer les controles de securite du flux email, des routes sensibles, des
   sessions, des uploads et de l'isolation des tenants.
4. Definir les criteres de succes, les metriques minimales et le protocole de
   feedback pilote.

### Pendant le pilote

1. Accompagner chaque avocat dans un flux limite et observable.
2. Revoir regulierement les propositions corrigees ou rejetees avec le juriste.
3. Mesurer la fiabilite, le temps gagne, les couts et les incidents sans
   instrumenter de donnees personnelles superflues.

### Apres le pilote

1. Decider, sur les mesures collectees, des integrations prioritaires,
   fonctionnalites collaboratives et capacites de recherche.
2. Reevaluer l'hebergement et la separation eventuelle de workers seulement si
   une contrainte mesuree ne peut etre satisfaite par le monolithe.
3. Mettre a jour cet arbitrage et les ADR associes avant tout engagement
   commercial ou institutionnel etendu.

## 8. Decision demandee aux parties prenantes

La decision immediate est de lancer un pilote controle uniquement si les
exigences de la section 5 sont confirmees et si le flux de validation humaine
decrit en section 2 est respecté de bout en bout. Toute option hors MVP doit
etre evaluee apres collecte des mesures du pilote.
