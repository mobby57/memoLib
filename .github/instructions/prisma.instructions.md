# Instructions pour le schéma Prisma (prisma/schema.prisma)

## Modélisation des données
- Toujours définir les relations avec onDelete approprié
- Utiliser des index sur les champs fréquemment requêtés
- Ajouter des contraintes d'unicité où nécessaire

## Audit et traçabilité
- Inclure createdAt et updatedAt sur tous les modèles
- Utiliser EventLog pour l'audit trail immutable

## RGPD
- Marquer les champs sensibles avec @map pour le chiffrement
- Documenter les données personnelles avec des commentaires
- Prévoir les cascades de suppression pour le droit à l'oubli

## Performance
- Éviter les relations N+N sans table de jointure explicite
- Utiliser @@index pour les requêtes complexes
