const crypto = require('crypto');
const fs = require('fs');

function generateSecrets() {
  return {
    JWT_SECRET: crypto.randomBytes(32).toString('base64'),
    NEXTAUTH_SECRET: crypto.randomBytes(32).toString('base64'),
    ENCRYPTION_KEY: crypto.randomBytes(32).toString('hex'),
    GITHUB_WEBHOOK_SECRET: crypto.randomBytes(32).toString('hex'),
    WEBHOOK_CUSTOM_SECRET: `custom_${crypto.randomBytes(16).toString('hex')}_2024`,
    API_SECRET_KEY: crypto.randomBytes(24).toString('base64'),
    BUILD_TIMESTAMP: new Date().toISOString(),
    GIT_COMMIT_SHA: crypto.randomBytes(4).toString('hex')
  };
}

const secrets = generateSecrets();
let envContent = fs.readFileSync('.env.local', 'utf8');

Object.entries(secrets).forEach(([key, value]) => {
  const regex = new RegExp(`${key}="[^"]*"`, 'g');
  if (envContent.includes(`${key}=`)) {
    envContent = envContent.replace(regex, `${key}="${value}"`);
  }
});

fs.writeFileSync('.env.local', envContent);

console.log('✅ Secrets générés:');
Object.entries(secrets).forEach(([key, value]) => {
  console.log(`${key}: ${value.substring(0, 16)}...`);
});
console.log('\n⚠️  Veuillez vérifier le fichier .env.local pour vous assurer que les secrets ont été correctement mis à jour.');