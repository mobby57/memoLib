const { google } = require('googleapis');
const readline = require('readline');

const oauth2Client = new google.auth.OAuth2(
  process.env.GMAIL_CLIENT_ID,
  process.env.GMAIL_CLIENT_SECRET,
  'http://localhost:3000/oauth/callback'
);

const authUrl = oauth2Client.generateAuthUrl({
  access_type: 'offline',
  scope: [
    'https://www.googleapis.com/auth/gmail.readonly',
    'https://www.googleapis.com/auth/gmail.modify'
  ]
});

console.log('\n📧 Configuration Gmail OAuth\n');
console.log('1. Ouvrir cette URL dans votre navigateur:\n');
console.log(authUrl);
console.log('\n2. Autoriser l\'application');
console.log('3. Copier le code de la page de redirection\n');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

rl.question('Coller le code ici: ', async (code) => {
  try {
    const { tokens } = await oauth2Client.getToken(code);
    
    console.log('\n✅ Authentification réussie!\n');
    console.log('Ajouter cette ligne à votre .env.local:\n');
    console.log(`GMAIL_REFRESH_TOKEN=${tokens.refresh_token}\n`);
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
  
  rl.close();
});
