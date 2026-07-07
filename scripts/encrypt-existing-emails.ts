/**
 * Script de migration: chiffrer les emails existants en BDD.
 * 
 * USAGE:
 *   ENCRYPTION_MASTER_KEY=xxx npx tsx scripts/encrypt-existing-emails.ts
 * 
 * SÉCURITÉ:
 * - Fait un backup AVANT d'exécuter
 * - Traite par batch de 100 pour éviter les timeouts
 * - Ne modifie que les emails non-encore chiffrés
 * - Réversible (l'ancien body est conservé dans bodyEncrypted, le body clair est remplacé par [ENCRYPTED])
 */

import { PrismaClient } from '@prisma/client';
import { encryptEmailBody, isEmailEncrypted } from '../src/lib/security/email-encryption';

const prisma = new PrismaClient();
const BATCH_SIZE = 100;

async function main() {
  if (!process.env.ENCRYPTION_MASTER_KEY) {
    console.error('❌ ENCRYPTION_MASTER_KEY requis. Génère avec:');
    console.error('   node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"');
    process.exit(1);
  }

  console.log('🔐 Migration chiffrement at-rest des emails...\n');

  // Compter les emails non chiffrés
  const total = await prisma.email.count({
    where: {
      bodyEncrypted: null,
      body: { not: '[ENCRYPTED]' },
    },
  });

  console.log(`📊 ${total} emails à chiffrer\n`);

  if (total === 0) {
    console.log('✅ Tous les emails sont déjà chiffrés.');
    return;
  }

  let processed = 0;
  let errors = 0;

  while (processed < total) {
    const emails = await prisma.email.findMany({
      where: {
        bodyEncrypted: null,
        body: { not: '[ENCRYPTED]' },
      },
      take: BATCH_SIZE,
      select: { id: true, body: true, htmlBody: true },
    });

    if (emails.length === 0) break;

    for (const email of emails) {
      try {
        const encrypted = encryptEmailBody(email.body, email.htmlBody);

        await prisma.email.update({
          where: { id: email.id },
          data: {
            body: encrypted.body,
            bodyEncrypted: encrypted.bodyEncrypted,
            htmlBody: encrypted.htmlBody,
            htmlBodyEncrypted: encrypted.htmlBodyEncrypted,
          },
        });

        processed++;
      } catch (error) {
        errors++;
        console.error(`❌ Erreur email ${email.id}:`, error);
      }
    }

    const percent = Math.round((processed / total) * 100);
    console.log(`  [${percent}%] ${processed}/${total} chiffrés (${errors} erreurs)`);
  }

  console.log(`\n✅ Migration terminée: ${processed} chiffrés, ${errors} erreurs.`);
}

main()
  .catch((e) => {
    console.error('Fatal error:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
