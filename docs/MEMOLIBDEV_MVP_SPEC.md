# MemoLibDev - Specification du MVP

> Statut : MVP cible  
> Date : 7 octobre 2026

## Objectif

Prouver qu'un agent peut aider sur un depot sans effectuer une action non autorisee.
Le moteur Python existant reste la seule autorite d'execution. Le MVP est
volontairement independant de l'IDE et n'inclut ni generation de code autonome, ni
connecteur de production, ni execution sur un environnement client.

## Cas d'usage initial

Un utilisateur soumet une mission sur un depot de demonstration. MemoLibDev collecte
des elements de preuve, prepare une action et impose le niveau adequat :

| Niveau | Effet autorise | Condition non negociable |
| --- | --- | --- |
| Observer | Lecture et synthese | Aucun ecrit externe |
| Preparer | Plan et proposition | Au moins une preuve citee |
| Tester | Execution isolee | Sandbox explicite et preuve de verification |
| Modifier | Mutation de la cible | Approbation humaine explicite et preuve complete |

## Exigences fonctionnelles

1. Une mission a un identifiant, une intention, un niveau demande et un journal
   append-only.
2. Une preuve enregistre son type, sa source et son contenu ou resume.
3. L'Evidence Gate bloque les niveaux Preparer, Tester et Modifier sans preuve.
4. Tester est refuse hors sandbox.
5. Modifier est refuse tant qu'une approbation humaine explicite n'est pas enregistree.
6. Chaque decision, blocage et transition ajoute une entree au journal.
7. Seul `run_from_mission()` peut lancer une action ; les futurs adaptateurs devront
   respecter ses decisions et ne jamais invoquer un outil directement.

## Exigences non fonctionnelles

- Par defaut, refus explicite si une condition de securite manque.
- Pas de donnees client ni de secret dans les preuves de demonstration.
- Types stricts et validation des entrees publiques.
- Les transitions sont deterministes et testables sans reseau, modele ou base de donnees.
- Toute future route devra authentifier l'acteur et persister le journal dans l'audit
  immutable existant.

## Architecture MVP

```text
CLI / Tauri / Web -> API locale (future) -> MemoLibDev Core Python
                                                 |
                                                 +-> run_from_mission()
                                                 +-> Evidence Gate et approbations
                                                 +-> runner sandbox et audit
```

L'API locale et Tauri ne seront ajoutes qu'apres les benchmarks prevus. Cette
separation evite de presenter une interface ou une simple proposition metier MemoLib
comme un agent MemoLibDev.

## Hors perimetre

- acces a un depot client ou a un outil SaaS ;
- execution de commandes et gestion des secrets ;
- appels de modele et routage multi-fournisseur ;
- authentification, facturation et interface graphique ;
- persistance de production.

Ces capacites ne sont ajoutees qu'apres validation du pilote et branchement aux
politiques, au journal d'audit et aux controles d'identite.
