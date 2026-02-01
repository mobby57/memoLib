# Tests Layout & Strategy

Objectif: organiser les tests frontend/backend et ajouter des smoke tests pour les frontières API.

## Dossiers

- Frontend: `tests/frontend` pour E2E (Playwright) et `__tests__` pour unitaires/jest.
- Backend: `tests/backend` pour pytest (unitaires + intégration).

## Smoke Tests API

- Next route `/api/emails/process` retourne 2xx et payload attendu quand le backend Python répond.
- Webhook `/api/webhooks/twilio` accepte un `formData` et proxy vers Python.
- IA `/api/ai/suggest` retourne 2xx avec forme `{ result, confidence }`.

## Commandes

- Via tâches VS Code:
  - "Full Stack: Test All" (frontend + backend)
  - "Frontend: Test" pour unitaires/E2E front
  - "Backend: Pytest" pour Python

## Guidelines

- Déterministes: pas d’accès réseaux externes en tests unitaires.
- Fixtures: isoler DB (SQLite en dev), mocker appels réseau.
- CI: faire tourner lint, type-check, tests avant build/deploy.
