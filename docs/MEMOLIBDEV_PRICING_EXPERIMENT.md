# MemoLibDev - Hypotheses de tarification

> Statut : hypotheses de test, pas une grille tarifaire publique  
> Date : 7 octobre 2026

## Valeur facturee

MemoLibDev ne facture pas une promesse vague d'agent autonome. Il facture une mission
controlee : contexte source, proposition lisible, preuve, sandbox, approbation et
audit. Le prix doit rester previsible avant l'execution.

## Metrique hybride a tester

| Composant | Pourquoi |
| --- | --- |
| Siege | Finance l'acces, l'historique et les controles individuels |
| Enveloppe de capacite mutualisee | Couvre modele, sandbox et execution sans penaliser les utilisateurs intensifs isoles |
| Plafond de budget | Evite les surprises et declenche une approbation avant depassement |
| Options entreprise | Finance isolation, retention, SSO/SCIM, connecteurs prives et support |

Le cout affiche par mission doit dissocier le cout estime du modele, de la sandbox et
des outils externes. La surconsommation ne doit jamais s'activer silencieusement.

## Offres a tester en entretien

| Offre | Client | Promesse | Question a tester |
| --- | --- | --- | --- |
| Personal | Independant | Controle individuel et sandbox locale | Quel prix mensuel remplace une heure de correction manuelle ? |
| Team | Petite equipe | Approbations, budgets et preuves partagees | Qui paie : chaque developpeur ou le budget de l'equipe ? |
| Business | Organisation sensible | Politiques, audit, identite et connecteurs | Quel controle debloque le pilote payant ? |

## Garde-fous commerciaux

- inclure l'estimation et le plafond avant les missions couteuses ;
- ne pas masquer une limite derriere le terme « illimite » ;
- offrir l'export d'audit des le pilote Business ;
- reserver les capacites d'isolation et de support contractuel a l'offre Business,
  sans retirer les controles de securite de base ;
- mesurer marge brute par mission avant de fixer un tarif public.

## Decision de prix

Fixer les prix apres cinq conversations avec intention de payer et un pilote mesurant
le cout reel par mission. Le seuil de lancement est atteint si trois organisations
acceptent un pilote payant dont la capacite, les garanties et les conditions de
depassement sont explicites.
