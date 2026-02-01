#!/usr/bin/env node
/**
 * CLI pour synchroniser les icônes depuis Figma
 * Usage: node scripts/figma-cli.js [command]
 */

const { spawn } = require('child_process');
const path = require('path');

const commands = {
  sync: {
    description: 'Synchronise les design tokens depuis Figma',
    script: 'tsx scripts/figma-sync.ts'
  },
  icons: {
    description: 'Synchronise les icônes depuis Figma',
    script: 'tsx scripts/figma-icons.ts'
  },
  all: {
    description: 'Synchronise tout depuis Figma',
    script: 'npm run figma:all'
  }
};

const command = process.argv[2];

if (!command || command === 'help') {
  console.log('\n📦 Figma CLI - Synchronisation des assets\n');
  console.log('Usage: node scripts/figma-cli.js [command]\n');
  console.log('Commandes disponibles:\n');
  Object.entries(commands).forEach(([cmd, { description }]) => {
    console.log(`  ${cmd.padEnd(10)} - ${description}`);
  });
  console.log('\nExemples:');
  console.log('  node scripts/figma-cli.js sync');
  console.log('  node scripts/figma-cli.js icons');
  console.log('  node scripts/figma-cli.js all\n');
  process.exit(0);
}

const cmd = commands[command];
if (!cmd) {
  console.error(`❌ Commande inconnue: ${command}`);
  console.log('Utilisez "help" pour voir les commandes disponibles');
  process.exit(1);
}

console.log(`🚀 Exécution: ${cmd.description}\n`);

const [program, ...args] = cmd.script.split(' ');
const child = spawn(program, args, {
  stdio: 'inherit',
  shell: true
});

child.on('close', (code) => {
  process.exit(code);
});
