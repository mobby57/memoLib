# Matrice de scénarios juridiques

Cette matrice valide le moteur CESEDA.

## Structure
- `scenarios/*.json` : chaque fichier couvre un domaine.
- `matrix.test.ts` : test paramétré.
- `validate-scenarios.ts` : validation des JSON.

## Ajout d’un scénario
Ajouter un objet dans le fichier JSON approprié avec `id`, `description`, `legalBasis`, `input`, `expected`.

## Exécution
```bash
npm test:legal
