# MemoLibDev - Plan de validation marche

> Statut : pret a executer  
> Date : 7 octobre 2026

## Hypotheses a invalider rapidement

| Hypothese | Signal attendu | Seuil de decision |
| --- | --- | --- |
| Le risque d'une action autonome freine l'adoption des agents | Les participants citent l'approbation, la preuve ou l'audit parmi leurs trois criteres d'achat | 8 personnes sur 12 |
| Les quatre niveaux rendent le controle comprehensible | Les participants identifient correctement le niveau requis dans des scenarios concrets | 80 % de bonnes reponses |
| Une preuve verifiable augmente la confiance | Les participants preferent un resultat avec sources, diff et test a un resultat sans preuve | 8 personnes sur 12 |
| Le cout previsible est plus important qu'un quota opaque | Les participants demandent estimation, plafond ou budget par mission | 7 personnes sur 12 |
| Un premier cas d'usage est payable | Un segment accepte un pilote payant ou un engagement ecrit conditionnel | 3 organisations |

## Cible et recrutement

Interviewer 12 a 15 personnes, reparties entre developpeurs independants, responsables
techniques de PME et responsables securite/operations. Privilegier les equipes qui
manipulent des depots, une CI/CD ou des donnees sensibles. Ne pas presenter MemoLibDev
comme un produit fini : tester le probleme et le comportement souhaite avant la solution.

## Guide d'entretien (30 minutes)

1. Quelle tache delegueriez-vous a un agent demain ? Laquelle lui interdiriez-vous ?
2. Racontez la derniere fois qu'une automatisation a produit une erreur couteuse.
3. Avant d'autoriser une modification, quelle preuve devez-vous voir ?
4. Parmi observer, preparer, tester et modifier, quels niveaux utiliseriez-vous dans
   votre dernier incident ou changement important ?
5. Qui peut approuver une action et quelles politiques doivent l'empecher ?
6. Quels outils ou environnements devraient etre connectes en premier ?
7. Comment budgetez-vous aujourd'hui l'IA, le cloud et les interventions de support ?
8. Accepteriez-vous un pilote payant ? Sous quelles garanties et a quel resultat ?

## Prototype a montrer

Faire executer les quatre scenarios suivants sur un depot de demonstration sans donnees
client :

| Scenario | Resultat attendu |
| --- | --- |
| Observer | Une explication sourcee, sans ecriture |
| Preparer | Un plan, les fichiers impactes et les risques, sans ecriture |
| Tester | Un diff et les resultats de verification dans une sandbox |
| Modifier | Une ecriture seulement apres une approbation explicite et tracee |

Collecter le niveau choisi, le temps de comprehension, les preuves consultees, la
decision d'approbation et le motif de refus.

## Metriques pilote

- taux de missions avec preuve complete ;
- taux d'approbation apres lecture du plan ;
- taux de rollback et cause ;
- depassement de budget estime ;
- temps entre proposition et approbation ;
- taux de conversion pilote gratuit vers pilote payant.

Le pilote ne passe pas en production si une mutation peut contourner l'approbation, si
la preuve n'identifie pas ses sources, ou si le cout estime ne peut pas etre affiche.
