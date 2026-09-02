# Éléments de preuve — durcissement phase 4

**Date :** 1er septembre 2026  
**Périmètre :** gestion des clés, confidentialité des logs, intégrité Prisma et sauvegardes.

## Contrôles implémentés

- `ENCRYPTION_MASTER_KEY` est désormais refusée si elle fait moins de 32 caractères.
  Le garde de production empêche alors le démarrage.
- Le chiffrement d'email refuse tout repli en clair lorsqu'il échoue en production.
  Le repli de développement reste explicitement limité aux environnements non-production.
- Les payloads AES-GCM sont contrôlés avant déchiffrement (version, Base64, IV de 16
  octets et tag de 16 octets). Le logger principal réutilise le redacteur récursif
  afin de masquer les secrets, URLs de connexion et données personnelles, y compris
  lorsque le contexte se déclare conforme RGPD.
- La transition de raisonnement persiste les résultats, le changement d'état et
  l'historique dans une transaction Prisma. Une mise à jour conditionnelle évite
  qu'une exécution concurrente ne valide deux fois le même état.
- Le helper de sauvegarde n'utilise plus de shell : `pg_dump` reçoit l'URL comme
  argument, les données ne sont jamais écrites en clair, seuls les fichiers `.enc`
  sont acceptés à la restauration, et `allowRestore: true` est obligatoire.

## Intégrité Prisma : suivi de migration

`npx prisma validate` confirme que le schéma actuel est valide. Aucun changement de
schéma ni migration n'a été créé ou exécuté : une telle opération doit être revue
avec les données de production. L'audit relève notamment que `DossierChecklistItem`
conserve un `dossierId` sans relation Prisma, et que plusieurs relations facultatives
utilisent l'action par défaut. Avant une migration dédiée, confirmer pour chaque
relation la conservation voulue (`Restrict`/`SetNull`) ou la suppression en cascade,
puis tester cette migration exclusivement sur une copie de staging.

## Validation automatisée

- `npx prisma validate` : réussi (schéma `prisma/schema.prisma` valide).
- `npx eslint` sur les sept modules de production modifiés : réussi, sans avertissement.
- `npx vitest run` ciblé : 70 tests réussis (chiffrement, email, sauvegarde,
  logger et garde de production). Aucun backup, restore, migration Prisma ni accès
  à une base externe n'est exécuté par cette validation.

## Actions manuelles bloquantes avant production

1. Stocker une clé maître unique de 32 octets ou plus dans le gestionnaire de secrets
   du fournisseur de déploiement; ne jamais l'écrire dans Git ou les logs.
2. Vérifier dans Neon l'activation du PITR, la durée de rétention contractuelle et
   l'adéquation avec le RPO de 15 minutes. Archiver une capture/export daté comme
   preuve de release.
3. Effectuer et documenter une restauration PITR vers une branche de staging isolée.
   Toute bascule de production nécessite une validation à deux personnes.
4. Si les sauvegardes applicatives sont activées, provisionner `BACKUP_DIR` sur un
   volume privé chiffré, contrôler les permissions, planifier l'exécution via un
   ordonnanceur géré et tester la restauration isolée trimestriellement.
