module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      [
        'feat',     // Nouvelle fonctionnalité
        'fix',      // Correction de bug
        'docs',     // Documentation
        'style',    // Formatage, sans impact fonctionnel
        'refactor', // Refactorisation
        'perf',     // Amélioration de performance
        'test',     // Ajout/modification de tests
        'chore',    // Maintenance, configuration
        'ci',       // CI/CD
        'build',    // Build system
        'revert',   // Revert d'un commit précédent
      ],
    ],
    'subject-case': [2, 'never', ['upper-case']],
    'subject-empty': [2, 'never'],
    'subject-max-length': [2, 'always', 100],
    'type-case': [2, 'always', 'lower-case'],
    'type-empty': [2, 'never'],
    'scope-case': [2, 'always', 'lower-case'],
  },
};
