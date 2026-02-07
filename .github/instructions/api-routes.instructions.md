# Instructions pour les routes API (src/frontend/app/api/**)

## Validation des entrées
- Toujours valider les paramètres de requête avec Zod
- Vérifier les types et formats avant traitement

## Gestion des erreurs
- Retourner des codes HTTP appropriés (400, 401, 403, 404, 500)
- Ne jamais exposer les stack traces en production
- Logger les erreurs avec le contexte nécessaire

## Authentification
- Vérifier la session NextAuth sur toutes les routes protégées
- Valider les permissions utilisateur (rôle, abonnement)

## Rate limiting
- Vérifier la présence du rate limiting sur les endpoints sensibles
- Utiliser Upstash Redis pour le tracking

## Webhooks
- Valider les signatures (Stripe, WhatsApp, etc.)
- Implémenter la déduplication avec checksum
- Gérer l'idempotence avec messageId unique
