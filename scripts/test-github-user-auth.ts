/**
 * Script de test: Authentification GitHub User-to-Server
 * Teste les fonctionnalités d'authentification et d'actions pour le compte utilisateur
 */

import { config } from 'dotenv';
config();

console.log('🧪 Test de l\'authentification GitHub User-to-Server\n');

// Vérification de la configuration
console.log('📋 Configuration:');
console.log('  GITHUB_APP_ID:', process.env.GITHUB_APP_ID || '❌ Non configuré');
console.log('  GITHUB_CLIENT_ID:', process.env.GITHUB_CLIENT_ID || '❌ Non configuré');
console.log('  GITHUB_CLIENT_SECRET:', process.env.GITHUB_CLIENT_SECRET ? '✓ Configuré' : '❌ Non configuré');
console.log('  GITHUB_CALLBACK_URL:', process.env.GITHUB_CALLBACK_URL || '❌ Non configuré');
console.log('  GITHUB_REPOSITORY:', process.env.GITHUB_REPOSITORY || '❌ Non configuré');
console.log('');

// Checklist de configuration
const checks = [
  {
    name: 'GitHub App ID',
    valid: !!process.env.GITHUB_APP_ID,
  },
  {
    name: 'GitHub OAuth Client ID',
    valid: !!process.env.GITHUB_CLIENT_ID,
  },
  {
    name: 'GitHub OAuth Client Secret',
    valid: !!process.env.GITHUB_CLIENT_SECRET,
  },
  {
    name: 'GitHub Callback URL',
    valid: !!process.env.GITHUB_CALLBACK_URL,
  },
];

console.log('✅ Checklist de configuration:\n');

checks.forEach((check) => {
  const status = check.valid ? '✓' : '✗';
  const color = check.valid ? '\x1b[32m' : '\x1b[31m';
  console.log(`  ${color}${status}\x1b[0m ${check.name}`);
});

console.log('');

// Instructions de configuration
if (!checks.every((c) => c.valid)) {
  console.log('⚠️  Configuration incomplète!\n');
  console.log('📝 Pour configurer GitHub User-to-Server:\n');
  console.log('1. Aller sur: https://github.com/settings/apps/[your-app-name]');
  console.log('');
  console.log('2. Activer "Request user authorization (OAuth) during installation"');
  console.log('');
  console.log('3. Configurer Callback URL:');
  console.log('   http://localhost:3000/api/auth/callback/github');
  console.log('');
  console.log('4. Copier Client ID et Client Secret dans .env.local:');
  console.log('   GITHUB_CLIENT_ID=Iv23...');
  console.log('   GITHUB_CLIENT_SECRET=...');
  console.log('');
  console.log('5. Configurer les User Permissions:');
  console.log('   - Issues: Read & Write');
  console.log('   - Pull Requests: Read & Write');
  console.log('   - Contents: Read & Write');
  console.log('');
} else {
  console.log('✅ Configuration complète!\n');
  console.log('🎉 Prochaines étapes:\n');
  console.log('1. Démarrer le serveur: npm run dev');
  console.log('');
  console.log('2. Aller sur: http://localhost:3000/lawyer/settings');
  console.log('');
  console.log('3. Cliquer sur "Autoriser GitHub"');
  console.log('');
  console.log('4. Autoriser l\'application sur GitHub');
  console.log('');
  console.log('5. Tester la création d\'une issue:');
  console.log('   fetch(\'/api/github/issues/create\', {');
  console.log('     method: \'POST\',');
  console.log('     headers: { \'Content-Type\': \'application/json\' },');
  console.log('     body: JSON.stringify({');
  console.log('       repo: \'owner/repo\',');
  console.log('       title: \'Test Issue\',');
  console.log('       body: \'Created by IA Poste Manager\'');
  console.log('     })');
  console.log('   })');
  console.log('');
}

// Endpoints disponibles
console.log('📡 API Endpoints disponibles:\n');
const endpoints = [
  { method: 'GET', path: '/api/github/user', description: 'Infos utilisateur GitHub' },
  { method: 'POST', path: '/api/github/issues/create', description: 'Créer une issue' },
  { method: 'POST', path: '/api/github/sync-dossier', description: 'Synchroniser un dossier' },
];

endpoints.forEach((endpoint) => {
  console.log(`  ${endpoint.method.padEnd(6)} ${endpoint.path}`);
  console.log(`         ${endpoint.description}`);
  console.log('');
});

// Documentation
console.log('📚 Documentation:\n');
console.log('  Guide complet: GITHUB_USER_AUTH.md');
console.log('  GitHub Docs: https://docs.github.com/en/apps');
console.log('');

console.log('✨ Test terminé!\n');
