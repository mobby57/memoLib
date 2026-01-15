#!/usr/bin/env node

/**
 * Script pour configurer GitHub App - IA Poste Manager
 * Usage: node scripts/setup-github-app.js
 */

const crypto = require('crypto');
const { execSync } = require('child_process');

console.log('🚀 Configuration GitHub App - IA Poste Manager');

// Générer les secrets
const webhookSecret = `whsec_${crypto.randomBytes(32).toString('hex')}`;
const nextAuthSecret = crypto.randomBytes(32).toString('hex');

console.log('\n🔑 Secrets générés:');
console.log(`Webhook Secret: ${webhookSecret}`);
console.log(`NextAuth Secret: ${nextAuthSecret}`);

// Configuration pour GitHub App
const config = {
  name: "IA Poste Manager",
  description: "Assistant juridique digital CESEDA - Gestion sécurisée multi-tenant",
  homepage: "https://your-domain.com",
  callback: "https://your-domain.com/api/auth/callback/github",
  webhook: "https://your-domain.com/api/webhooks/github",
  webhookSecret: webhookSecret
};

console.log('\n📋 Configuration GitHub App:');
console.log(`App name: ${config.name}`);
console.log(`Description: ${config.description}`);
console.log(`Homepage URL: ${config.homepage}`);
console.log(`User authorization callback URL: ${config.callback}`);
console.log(`Webhook URL: ${config.webhook}`);
console.log(`Webhook secret: ${config.webhookSecret}`);

console.log('\n🔧 Permissions requises:');
console.log('Repository permissions:');
console.log('  - Contents: Read & write');
console.log('  - Issues: Read & write');
console.log('  - Metadata: Read');
console.log('  - Pull requests: Read & write');
console.log('\nAccount permissions:');
console.log('  - Email addresses: Read');

console.log('\n📡 Événements webhook:');
console.log('  ☑️ Issues');
console.log('  ☑️ Issue comments');
console.log('  ☑️ Pull requests');
console.log('  ☑️ Pull request reviews');
console.log('  ☑️ Push');
console.log('  ☑️ Repository');

// Ouvrir l'URL de création
const createUrl = 'https://github.com/settings/apps/new';
console.log(`\n🌐 Création: ${createUrl}`);

try {
  // Ouvrir automatiquement dans le navigateur
  const open = process.platform === 'win32' ? 'start' : 
               process.platform === 'darwin' ? 'open' : 'xdg-open';
  execSync(`${open} "${createUrl}"`, { stdio: 'ignore' });
  console.log('✅ Page ouverte dans le navigateur');
} catch (error) {
  console.log('⚠️  Ouvrez manuellement le lien ci-dessus');
}

console.log('\n📝 Après création de l\'app:');
console.log('1. Générer une clé privée');
console.log('2. Générer un client secret');
console.log('3. Installer l\'app sur votre compte');
console.log('4. Exécuter: node scripts/generate-env.js');