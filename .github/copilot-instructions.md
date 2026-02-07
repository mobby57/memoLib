# Instructions de revue de code GitHub Copilot - MemoLib

## Langue et style
- Répondre en français pour toutes les revues de code
- Utiliser un ton professionnel et constructif

## Sécurité et conformité
- Vérifier la conformité RGPD (pas de logs de données personnelles)
- Valider l'absence de credentials en dur
- Vérifier les headers de sécurité (CSP, HSTS)
- Valider l'authentification et les permissions sur les routes API

## Architecture Next.js
- Privilégier les Server Components par défaut
- Utiliser "use client" uniquement si nécessaire (hooks, événements)
- Valider la structure App Router (app/ directory)
- Vérifier les imports de chemins absolus (@/)

## Base de données et Prisma
- Valider les transactions pour les opérations multiples
- Vérifier la gestion des erreurs Prisma
- S'assurer de la fermeture des connexions

## Performance
- Éviter les nested ternary operators
- Privilégier la lisibilité sur la concision
- Vérifier les dépendances inutiles dans useEffect
- Valider le lazy loading des composants lourds

## TypeScript
- Éviter les `any`, privilégier les types stricts
- Valider la cohérence des interfaces
- Vérifier les null checks

## Tests
- Suggérer des tests pour la logique métier critique
- Valider la couverture des edge cases
