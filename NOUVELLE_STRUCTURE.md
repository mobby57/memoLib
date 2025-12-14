# Nouvelle Structure du Projet

Reorganise: 13/12/2025 15:28:14

## Structure Simplifiee

iaPostemanage/
â”œâ”€â”€ src/
â”‚   â”œâ”€â”€ frontend/         # Application React
â”‚   â”‚   â”œâ”€â”€ src/
â”‚   â”‚   â”œâ”€â”€ tests/        # Tests E2E Playwright
â”‚   â”‚   â”œâ”€â”€ package.json
â”‚   â”‚   â””â”€â”€ vite.config.js
â”‚   â””â”€â”€ backend/          # Application Flask
â”‚       â”œâ”€â”€ app.py
â”‚       â”œâ”€â”€ models/
â”‚       â”œâ”€â”€ routes/
â”‚       â””â”€â”€ requirements.txt
â”œâ”€â”€ docker/               # Configurations Docker
â”œâ”€â”€ tests/                # Tests centralises
â”œâ”€â”€ docs/                 # Documentation
â”œâ”€â”€ scripts/              # Scripts
â””â”€â”€ archive/              # Anciennes versions

## Commandes Demarrage

Backend:
  cd src\backend
  python app.py

Frontend:
  cd src\frontend
  npm run dev

Tests:
  cd src\frontend
  npx playwright test

Docker Dev:
  docker-compose -f docker/docker-compose.dev.yml up

## Changements

1. frontend-react/ -> src/frontend/
2. app_unified_fixed.py -> src/backend/app.py
3. Configs Docker -> docker/
4. Documentation -> docs/
5. Tests centralises -> tests/

## Prochaines Etapes

1. Valider: .\scripts\4_validate_structure.ps1
2. Installer dependances
3. Tester application
