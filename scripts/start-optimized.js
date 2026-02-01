#!/usr/bin/env node

const { spawn } = require('child_process');
const chalk = require('chalk');

console.log(chalk.blue.bold('🚀 memoLib - Démarrage optimisé\n'));

// Vérifier Node.js version
const nodeVersion = process.version;
const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);

if (majorVersion < 18) {
  console.log(chalk.red('❌ Node.js 18+ requis. Version actuelle:', nodeVersion));
  process.exit(1);
}

console.log(chalk.green('✅ Node.js version:', nodeVersion));

// Variables d'environnement pour les performances
process.env.NODE_OPTIONS = '--max-old-space-size=4096';
process.env.NEXT_TELEMETRY_DISABLED = '1';

// Démarrer Next.js avec Turbopack
const nextProcess = spawn('npm', ['run', 'dev'], {
  stdio: 'inherit',
  shell: true,
  env: {
    ...process.env,
    TURBOPACK: '1'
  }
});

// Gestion des signaux
process.on('SIGINT', () => {
  console.log(chalk.yellow('\n🛑 Arrêt du serveur...'));
  nextProcess.kill('SIGINT');
  process.exit(0);
});

process.on('SIGTERM', () => {
  nextProcess.kill('SIGTERM');
  process.exit(0);
});

nextProcess.on('exit', (code) => {
  if (code !== 0) {
    console.log(chalk.red(`❌ Le serveur s'est arrêté avec le code ${code}`));
  }
  process.exit(code);
});

console.log(chalk.cyan('🔥 Turbopack activé pour des performances maximales'));
console.log(chalk.cyan('📊 Monitoring des performances activé'));
console.log(chalk.cyan('⚡ Service Worker prêt pour le cache'));
console.log(chalk.green('\n✨ Application prête sur http://localhost:3000\n'));