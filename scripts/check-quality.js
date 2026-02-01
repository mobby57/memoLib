#!/usr/bin/env node

/**
 * 🔍 Repository Quality Checker
 * 
 * Ce script vérifie la qualité globale du repository :
 * - Formatage du code (Prettier)
 * - Linting (ESLint)
 * - Vérification des types (TypeScript)
 * - Tests unitaires
 * - Sécurité (npm audit)
 * - Dépendances obsolètes
 */

const { execSync } = require('child_process');
const chalk = require('chalk');

const checks = [
  {
    name: '🎨 Prettier - Formatage du code',
    command: 'npm run format:check',
    optional: false,
  },
  {
    name: '🔍 ESLint - Qualité du code',
    command: 'npm run lint',
    optional: false,
  },
  {
    name: '📘 TypeScript - Vérification des types',
    command: 'npm run type-check',
    optional: false,
  },
  {
    name: '🧪 Jest - Tests unitaires',
    command: 'npm run test:ci',
    optional: false,
  },
  {
    name: '🔒 NPM Audit - Vulnérabilités de sécurité',
    command: 'npm audit --audit-level=moderate',
    optional: true,
  },
  {
    name: '📦 Dépendances obsolètes',
    command: 'npm outdated',
    optional: true,
  },
];

const results = {
  passed: [],
  failed: [],
  skipped: [],
};

console.log(chalk.bold.blue('\n🔍 Vérification de la qualité du repository...\n'));

for (const check of checks) {
  process.stdout.write(chalk.gray(`⏳ ${check.name}... `));

  try {
    execSync(check.command, { 
      stdio: 'pipe',
      encoding: 'utf-8'
    });
    
    console.log(chalk.green('✅ OK'));
    results.passed.push(check.name);
  } catch (error) {
    if (check.optional) {
      console.log(chalk.yellow('⚠️  AVERTISSEMENT'));
      results.skipped.push(check.name);
    } else {
      console.log(chalk.red('❌ ÉCHEC'));
      results.failed.push(check.name);
      
      // Afficher le détail de l'erreur
      console.log(chalk.red('\n📋 Détails de l\'erreur:'));
      console.log(chalk.gray(error.stdout || error.message));
    }
  }
}

// Résumé
console.log(chalk.bold.blue('\n📊 Résumé de la vérification:\n'));
console.log(chalk.green(`✅ Réussis: ${results.passed.length}`));
if (results.failed.length > 0) {
  console.log(chalk.red(`❌ Échoués: ${results.failed.length}`));
  results.failed.forEach(name => console.log(chalk.red(`   - ${name}`)));
}
if (results.skipped.length > 0) {
  console.log(chalk.yellow(`⚠️  Avertissements: ${results.skipped.length}`));
  results.skipped.forEach(name => console.log(chalk.yellow(`   - ${name}`)));
}

// Code de sortie
if (results.failed.length > 0) {
  console.log(chalk.bold.red('\n❌ Des vérifications ont échoué!\n'));
  console.log(chalk.yellow('💡 Suggestions:'));
  console.log(chalk.gray('   - Exécutez "npm run format" pour corriger le formatage'));
  console.log(chalk.gray('   - Exécutez "npm run lint:fix" pour corriger les erreurs de linting'));
  console.log(chalk.gray('   - Vérifiez les erreurs TypeScript avec "npm run type-check"'));
  console.log(chalk.gray('   - Lancez les tests avec "npm run test:watch"\n'));
  
  process.exit(1);
} else {
  console.log(chalk.bold.green('\n✅ Toutes les vérifications ont réussi! 🎉\n'));
  process.exit(0);
}
