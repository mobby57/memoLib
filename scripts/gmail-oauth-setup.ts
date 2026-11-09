/**
 * Gmail OAuth Setup — Obtenir un refresh_token
 * 
 * PRÉREQUIS:
 * 1. Aller sur https://console.cloud.google.com
 * 2. Créer un projet (ou utiliser existant)
 * 3. Activer l'API Gmail: APIs & Services > Enable APIs > Gmail API
 * 4. Créer des credentials OAuth 2.0:
 *    - APIs & Services > Credentials > Create Credentials > OAuth client ID
 *    - Type: Web application
 *    - Redirect URI: http://localhost:3000/api/oauth/gmail/callback
 * 5. Copier Client ID et Client Secret dans .env.local
 * 6. Lancer ce script: npx tsx scripts/gmail-oauth-setup.ts
 */

import http from 'http';
import { google } from 'googleapis';

const CLIENT_ID = process.env.GMAIL_CLIENT_ID;
const CLIENT_SECRET = process.env.GMAIL_CLIENT_SECRET;
const REDIRECT_URI = 'http://localhost:3000/api/oauth/gmail/callback';

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error('❌ GMAIL_CLIENT_ID et GMAIL_CLIENT_SECRET doivent être définis dans .env.local');
  console.log('\n📋 Étapes:');
  console.log('1. https://console.cloud.google.com/apis/credentials');
  console.log('2. Créer OAuth 2.0 Client ID (Web application)');
  console.log('3. Redirect URI: http://localhost:3000/api/oauth/gmail/callback');
  console.log('4. Copier Client ID + Secret dans .env.local');
  console.log('5. Relancer: npx tsx scripts/gmail-oauth-setup.ts');
  process.exit(1);
}

const oauth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);

const SCOPES = [
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/gmail.modify',
  'https://www.googleapis.com/auth/gmail.send',
];

const authUrl = oauth2Client.generateAuthUrl({
  access_type: 'offline',
  scope: SCOPES,
  prompt: 'consent',
});

console.log('🔐 Gmail OAuth Setup\n');
console.log('Ouvre cette URL dans ton navigateur:\n');
console.log(authUrl);
console.log('\n⏳ En attente du callback sur http://localhost:3000/api/oauth/gmail/callback...');
console.log('   (Le serveur Next.js doit tourner)\n');
console.log('Après autorisation, copie le "code" de l\'URL de callback et colle-le ici:');

process.stdin.resume();
process.stdin.setEncoding('utf8');
process.stdin.on('data', async (code: string) => {
  try {
    const { tokens } = await oauth2Client.getToken(code.trim());
    console.log('\n✅ Tokens obtenus!\n');
    console.log('Ajoute dans .env.local:\n');
    console.log(`GMAIL_REFRESH_TOKEN=${tokens.refresh_token}`);
    console.log(`\n# Access token (expire, pas besoin de le stocker):`);
    console.log(`# ${tokens.access_token?.slice(0, 30)}...`);
    console.log('\n🎉 Gmail est maintenant connecté à MemoLib!');
  } catch (e: any) {
    console.error('❌ Erreur:', e.message);
  }
  process.exit(0);
});
