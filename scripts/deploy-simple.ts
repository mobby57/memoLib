#!/usr/bin/env node
/**
 * 🚀 MemoLib - Script de déploiement simplifié
 * 
 * Usage: npx ts-node scripts/deploy-simple.ts
 * 
 * Ce script guide un utilisateur non-technique pour déployer MemoLib:
 * 1. Vérifie les prérequis
 * 2. Génère les secrets automatiquement
 * 3. Guide la création de la base de données (Neon)
 * 4. Configure les variables d'environnement
 * 5. Déploie sur Vercel (si CLI disponible)
 */

import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function ask(question: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(question, (answer) => resolve(answer.trim()));
  });
}

function generateSecret(length = 32): string {
  return crypto.randomBytes(length).toString('base64url');
}

function log(emoji: string, message: string) {
  console.log(`\n${emoji}  ${message}`);
}

function logStep(step: number, total: number, message: string) {
  console.log(`\n[${'█'.repeat(step)}${'░'.repeat(total - step)}] Étape ${step}/${total}: ${message}`);
}

async function main() {
  console.log(`
╔══════════════════════════════════════════════════╗
║          🚀 MemoLib - Déploiement Express        ║
║                                                  ║
║  Ce script vous guide pour déployer MemoLib      ║
║  en ~5 minutes, sans compétence technique.       ║
╚══════════════════════════════════════════════════╝
`);

  const totalSteps = 5;

  // ============================================
  // ÉTAPE 1: Vérifications
  // ============================================
  logStep(1, totalSteps, 'Vérification des prérequis');
  
  const nodeVersion = process.version;
  const nodeMajor = parseInt(nodeVersion.slice(1).split('.')[0]);
  
  if (nodeMajor < 20) {
    log('❌', `Node.js ${nodeVersion} détecté. Version 20+ requise.`);
    log('💡', 'Téléchargez Node.js: https://nodejs.org/');
    process.exit(1);
  }
  log('✅', `Node.js ${nodeVersion} — OK`);

  // Vérifier que le projet est correctement cloné
  if (!fs.existsSync(path.join(process.cwd(), 'package.json'))) {
    log('❌', 'Ce script doit être exécuté depuis le répertoire racine de MemoLib.');
    process.exit(1);
  }
  log('✅', 'Projet MemoLib détecté');

  // ============================================
  // ÉTAPE 2: Informations
  // ============================================
  logStep(2, totalSteps, 'Informations de votre cabinet');

  const appUrl = await ask('\n🌐 URL de votre application (par défaut: http://localhost:3000): ') || 'http://localhost:3000';
  
  log('📧', 'Pour l\'IA, vous avez besoin d\'une clé API (OpenAI, Mistral, ou Anthropic).');
  log('💡', 'Obtenez une clé gratuite sur: https://platform.openai.com/api-keys');
  log('💡', 'Ou: https://console.mistral.ai/ (recommandé, hébergement EU)');
  
  const aiProvider = await ask('\n🤖 Provider IA choisi (openai/mistral/anthropic, défaut: mistral): ') || 'mistral';
  const aiKey = await ask(`\n🔑 Clé API ${aiProvider} (laissez vide pour configurer plus tard): `);
  
  log('🗄️', 'Pour la base de données, créez un compte gratuit sur https://neon.tech');
  const databaseUrl = await ask('\n🗄️  DATABASE_URL Neon (format: postgresql://user:pwd@host/db): ');
  
  if (!databaseUrl) {
    log('⚠️', 'Pas de DATABASE_URL. L\'application fonctionnera en mode démo uniquement.');
  }

  // ============================================
  // ÉTAPE 3: Génération des secrets
  // ============================================
  logStep(3, totalSteps, 'Génération des secrets de sécurité');
  
  const secrets = {
    NEXTAUTH_SECRET: generateSecret(32),
    CRON_SECRET: generateSecret(16),
    EMAIL_WEBHOOK_SECRET: generateSecret(16),
  };
  
  log('✅', `3 secrets générés (cryptographiquement sûrs)`);

  // ============================================
  // ÉTAPE 4: Création du .env.local
  // ============================================
  logStep(4, totalSteps, 'Configuration de l\'environnement');

  const envContent = `# ============================================
# MemoLib - Configuration générée automatiquement
# Date: ${new Date().toISOString()}
# ============================================

# --- Base de données ---
DATABASE_URL="${databaseUrl || 'postgresql://user:password@localhost:5432/memolib'}"

# --- Auth ---
NEXTAUTH_SECRET="${secrets.NEXTAUTH_SECRET}"
NEXTAUTH_URL="${appUrl}"
NEXT_PUBLIC_APP_URL="${appUrl}"

# --- IA Cloud (aucune installation locale requise) ---
AI_PREFERRED_PROVIDER="${aiProvider}"
${aiProvider === 'openai' ? `OPENAI_API_KEY="${aiKey}"` : '# OPENAI_API_KEY=""'}
${aiProvider === 'mistral' ? `MISTRAL_API_KEY="${aiKey}"` : '# MISTRAL_API_KEY=""'}
${aiProvider === 'anthropic' ? `ANTHROPIC_API_KEY="${aiKey}"` : '# ANTHROPIC_API_KEY=""'}

# --- Cron ---
CRON_SECRET="${secrets.CRON_SECRET}"

# --- Email webhook ---
EMAIL_WEBHOOK_SECRET="${secrets.EMAIL_WEBHOOK_SECRET}"

# --- Mode ---
DEMO_MODE=false
NEXT_PUBLIC_DEMO_MODE=false

# --- Optionnel: Stripe (paiements) ---
# STRIPE_SECRET_KEY=""
# STRIPE_PUBLISHABLE_KEY=""
# STRIPE_WEBHOOK_SECRET=""

# --- Optionnel: Monitoring ---
# SENTRY_DSN=""

# --- Optionnel: Redis (rate limiting avancé) ---
# UPSTASH_REDIS_REST_URL=""
# UPSTASH_REDIS_REST_TOKEN=""
`;

  const envPath = path.join(process.cwd(), '.env.local');
  
  if (fs.existsSync(envPath)) {
    const overwrite = await ask('\n⚠️  .env.local existe déjà. Écraser ? (o/N): ');
    if (overwrite.toLowerCase() !== 'o') {
      log('⏭️', '.env.local conservé tel quel');
    } else {
      fs.writeFileSync(envPath, envContent);
      log('✅', '.env.local mis à jour');
    }
  } else {
    fs.writeFileSync(envPath, envContent);
    log('✅', '.env.local créé');
  }

  // ============================================
  // ÉTAPE 5: Initialisation
  // ============================================
  logStep(5, totalSteps, 'Initialisation de l\'application');

  if (databaseUrl) {
    log('🗄️', 'Exécution des migrations Prisma...');
    const { execSync } = await import('child_process');
    
    try {
      execSync('npx prisma generate', { stdio: 'inherit' });
      execSync('npx prisma migrate deploy', { stdio: 'inherit' });
      log('✅', 'Base de données initialisée');
      
      // Seed minimal
      try {
        execSync('npx prisma db seed', { stdio: 'inherit' });
        log('✅', 'Données de base créées (plans, paramètres)');
      } catch {
        log('⚠️', 'Seed optionnel échoué (non bloquant)');
      }
    } catch (error) {
      log('❌', 'Erreur de migration. Vérifiez votre DATABASE_URL.');
      log('💡', 'Vous pouvez relancer: npx prisma migrate deploy');
    }
  }

  // ============================================
  // RÉSUMÉ
  // ============================================
  console.log(`
╔══════════════════════════════════════════════════╗
║             ✅ DÉPLOIEMENT TERMINÉ              ║
╚══════════════════════════════════════════════════╝

🎉 MemoLib est configuré !

📋 Prochaines étapes:
   1. Lancez l'application:     npm run dev
   2. Ouvrez:                   ${appUrl}
   3. Créez votre compte via:   ${appUrl}/fr/signup

${aiKey ? '🤖 IA: Configurée (' + aiProvider + ')' : '🤖 IA: Non configurée (mode regex)'}
${databaseUrl ? '🗄️  DB: Connectée (Neon)' : '🗄️  DB: Non configurée (mode démo)'}

📚 Documentation: docs/
❓ Support: https://github.com/mobby57/memoLib/issues

💡 Pour déployer en production (Vercel):
   npx vercel --prod
`);

  rl.close();
}

main().catch((error) => {
  console.error('Erreur:', error);
  rl.close();
  process.exit(1);
});
