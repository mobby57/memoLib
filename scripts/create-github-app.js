#!/usr/bin/env node

/**
 * Script automatisé pour créer une GitHub App avec GitHub CLI
 * Usage: node scripts/create-github-app.js
 */

const { execSync } = require('child_process');
const fs = require('fs');
const crypto = require('crypto');
const path = require('path');

console.log('🚀 Création automatique de la GitHub App - IA Poste Manager');

// Configuration
const config = {
  name: "IA Poste Manager",
  description: "Assistant juridique digital CESEDA - Gestion sécurisée multi-tenant",
  url: "https://your-domain.com",
  callback_urls: ["https://your-domain.com/api/auth/callback/github"],
  webhook_url: "https://your-domain.com/api/webhooks/github",
  webhook_secret: `whsec_${crypto.randomBytes(32).toString('hex')}`,
  public: true,
  default_permissions: {
    contents: "write",
    issues: "write",
    metadata: "read",
    pull_requests: "write"
  },
  default_events: [
    "issues",
    "issue_comment",
    "pull_request",
    "pull_request_review",
    "push",
    "repository"
  ]
};

console.log(`🔑 Secret webhook généré: ${config.webhook_secret}`);

async function createGitHubApp() {
  try {
    // Vérifier que gh CLI est installé
    try {
      execSync('gh --version', { stdio: 'ignore' });
    } catch (error) {
      console.error('❌ GitHub CLI non installé. Installer avec: https://cli.github.com/');
      process.exit(1);
    }

    // Créer le fichier de configuration temporaire
    const configPath = path.join(__dirname, '../temp-github-app-config.json');
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));

    // GitHub Apps doivent être créées manuellement
    const createUrl = 'https://github.com/settings/apps/new';
    console.log(`🌐 Ouvrir: ${createUrl}`);
    
    console.log('\n📋 Configuration:');
    console.log(`App name: ${config.name}`);
    console.log(`Description: ${config.description}`);
    console.log(`Homepage URL: ${config.url}`);
    console.log(`Callback URL: ${config.callback_urls[0]}`);
    console.log(`Webhook URL: ${config.webhook_url}`);
    console.log(`Webhook secret: ${config.webhook_secret}`);
    
    const readline = require('readline');
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    const question = (prompt) => new Promise(resolve => rl.question(prompt, resolve));
    
    console.log('\n⏳ Après création, entrez:');
    const appId = await question('App ID: ');
    const clientId = await question('Client ID: ');
    const appSlug = await question('App Slug: ');
    const privateKeyPath = await question('Chemin clé privée (.pem): ');
    const clientSecret = await question('Client secret: ');
    
    rl.close();
    
    const privateKey = fs.readFileSync(privateKeyPath, 'utf8');
    const privateKeyBase64 = Buffer.from(privateKey).toString('base64');
    fs.writeFileSync('./github-app-private-key.pem', privateKey);

    // Générer NextAuth secret
    const nextAuthSecret = crypto.randomBytes(32).toString('hex');

    // Créer le fichier .env.local
    const envContent = `# GitHub App Configuration (Généré automatiquement)
GITHUB_APP_ID=${appId}
GITHUB_CLIENT_ID=${clientId}
GITHUB_CLIENT_SECRET=${clientSecret}
GITHUB_PRIVATE_KEY="${privateKeyBase64}"
WEBHOOK_SECRET=${config.webhook_secret}

# NextAuth Configuration
NEXTAUTH_URL=https://your-domain.com
NEXTAUTH_SECRET=${nextAuthSecret}

# Database
DATABASE_URL="postgresql://username:password@localhost:5432/iapostemanage"
`;

    fs.writeFileSync('./.env.local', envContent);
    console.log('📄 Fichier .env.local créé avec toutes les variables');

    // URL d'installation
    const installUrl = `https://github.com/apps/${appSlug}/installations/new`;
    console.log(`🌐 Ouvrir ce lien pour installer l'app: ${installUrl}`);

    // Nettoyer les fichiers temporaires
    fs.unlinkSync(configPath);

    console.log('\n🎉 Configuration terminée!\n');
    console.log('📋 Résumé:');
    console.log(`   - App ID: ${appId}`);
    console.log(`   - Client ID: ${clientId}`);
    console.log('   - Clé privée: ./github-app-private-key.pem');
    console.log('   - Variables d\'environnement: ./.env.local\n');
    console.log('📌 Prochaines étapes:');
    console.log(`   1. Installer l'app: ${installUrl}`);
    console.log('   2. Configurer votre domaine dans .env.local');
    console.log('   3. Démarrer l\'application: npm run dev\n');

  } catch (error) {
    console.error('❌ Erreur lors de la création:', error.message);
    process.exit(1);
  }
}

createGitHubApp();