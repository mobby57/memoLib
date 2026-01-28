/**
 * Email to Workspace (avec IA Locale)
 * Convertit les emails en dossiers clients avec analyse IA avancée
 */

import fs from 'fs';
import path from 'path';
import { PrismaClient } from '@prisma/client';
import { emailAnalyzer } from '../lib/ai/email-analyzer';
import type { EmailAnalysis } from '../lib/ai/email-analyzer';
import readline from 'readline';

const prisma = new PrismaClient();

interface SavedEmail {
  id?: string;
  from: string;
  subject: string;
  body?: string;
  preview?: string;
  date?: string;
  receivedAt?: string;
  timestamp?: string;
  priority?: string;
  type?: string;
  classification?: {
    type?: string;
    priority?: string;
  };
}

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const question = (query: string): Promise<string> => {
  return new Promise((resolve) => rl.question(query, resolve));
};

/**
 * Lire tous les emails sauvegardés (FILTRÉS)
 */
function loadSavedEmails(): SavedEmail[] {
  const emailsDir = path.join(process.cwd(), 'logs', 'emails');
  
  if (!fs.existsSync(emailsDir)) {
    console.log('❌ Aucun email trouvé. Lancez: npm run email:monitor');
    process.exit(1);
  }

  const files = fs.readdirSync(emailsDir).filter((f) => f.endsWith('.json'));
  
  const allEmails = files.map((file) => {
    const content = fs.readFileSync(path.join(emailsDir, file), 'utf-8');
    return JSON.parse(content);
  });

  // ⚠️ FILTRER les emails Google système
  const filteredEmails = allEmails.filter((email) => {
    const from = email.from.toLowerCase();
    const subject = email.subject.toLowerCase();
    
    // Exclure emails système Google
    if (from.includes('no-reply@accounts.google.com') && subject.includes('security alert')) {
      return false;
    }
    if (from.includes('platformnotifications-noreply@google.com') && subject.includes('shut down')) {
      return false;
    }
    
    // Garder uniquement emails potentiellement clients
    return true;
  });

  console.log(`📊 ${allEmails.length} emails totaux, ${filteredEmails.length} emails clients après filtrage\n`);
  
  return filteredEmails;
}

/**
 * Créer un dossier depuis une analyse IA
 */
async function createDossierFromAnalysis(
  email: SavedEmail,
  analysis: EmailAnalysis
) {
  console.log('\n📊 Analyse IA:');
  console.log('  Client:', analysis.clientInfo.prenom, analysis.clientInfo.nom);
  console.log('  Type:', analysis.demande.type);
  console.log('  Urgence:', analysis.demande.urgence);
  console.log('  Confiance:', analysis.confidence + '%');

  // Trouver ou créer le client
  let client = await prisma.client.findFirst({
    where: { email: analysis.clientInfo.email },
  });

  if (!client) {
    console.log('\n✨ Création nouveau client...');
    client = await prisma.client.create({
      data: {
        nom: analysis.clientInfo.nom || 'À compléter',
        prenom: analysis.clientInfo.prenom || 'À compléter',
        email: analysis.clientInfo.email,
        telephone: analysis.clientInfo.telephone,
        adresse: '',
        ville: '',
        codePostal: '',
        pays: analysis.clientInfo.nationalite || 'France',
      },
    });
    console.log('  ✅ Client créé:', client.id);
  } else {
    console.log('\n✅ Client existant:', client.id);
  }

  // Créer le dossier
  console.log('\n📁 Création dossier...');
  const dossier = await prisma.dossier.create({
    data: {
      titre: analysis.demande.objet || email.subject,
      description: `${analysis.analyse.situationJuridique}\n\nRisques identifiés:\n${analysis.analyse.risques.map((r) => `- ${r}`).join('\n')}\n\nActions recommandées:\n${analysis.analyse.actionsRecommandees.map((a) => `- ${a}`).join('\n')}`,
      type: analysis.demande.type,
      statut: 'En attente',
      clientId: client.id,
      dateCreation: new Date(),
    },
  });
  console.log('  ✅ Dossier créé:', dossier.id);

  // Créer une échéance si urgente
  if (analysis.demande.urgence === 'urgent' || analysis.demande.delai) {
    console.log('\n⏰ Création échéance urgente...');
    
    const delaiDate = analysis.demande.delai
      ? new Date(analysis.demande.delai)
      : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 jours par défaut

    await prisma.echeance.create({
      data: {
        titre: `${analysis.demande.type} - Action requise`,
        description: analysis.analyse.actionsRecommandees.join('\n'),
        dateEcheance: delaiDate,
        statut: 'En cours',
        dossierId: dossier.id,
      },
    });
    console.log('  ✅ Échéance créée');
  }

  // Sauvegarder l'analyse IA
  const analysisPath = path.join(
    process.cwd(),
    'logs',
    'ai-analysis',
    `${email.id}.json`
  );
  fs.mkdirSync(path.dirname(analysisPath), { recursive: true });
  fs.writeFileSync(analysisPath, JSON.stringify(analysis, null, 2));

  console.log('\n✅ Dossier créé avec succès!');
  console.log('  📧 Email ID:', email.id);
  console.log('  👤 Client:', client.id, '-', client.prenom, client.nom);
  console.log('  📁 Dossier:', dossier.id, '-', dossier.titre);
  console.log('  🔍 Analyse IA sauvegardée:', analysisPath);
}

/**
 * Afficher les emails non traités
 */
async function displayUnprocessedEmails(emails: SavedEmail[]): Promise<void> {
  console.log('\n📧 Emails détectés:\n');

  emails.slice(0, 20).forEach((email, index) => {
    const date = email.date ? new Date(email.date).toLocaleString('fr-FR') : 'Date inconnue';
    const priority = email.priority === 'high' || email.classification?.priority === 'high' ? '🔴' : '🟢';
    const type = email.type || email.classification?.type || 'général';
    
    console.log(`${index + 1}. ${priority} De: ${email.from}`);
    console.log(`   Sujet: ${email.subject}`);
    console.log(`   Date: ${date}`);
    console.log(`   Type: ${type}`);
    console.log('');
  });

  if (emails.length > 20) {
    console.log(`... et ${emails.length - 20} autres emails\n`);
  }
}

/**
 * Main
 */
async function main() {
  console.log('🤖 memoLib - Email to Workspace (IA Locale)');
  console.log('========================================\n');

  // Charger les emails
  const emails = loadSavedEmails();
  
  if (emails.length === 0) {
    console.log('✅ Aucun email client trouvé (emails système Google filtrés)');
    console.log('💡 Lancez: npm run email:monitor pour scanner de nouveaux emails');
    rl.close();
    await prisma.$disconnect();
    process.exit(0);
  }

  console.log(`📬 ${emails.length} email(s) client(s) trouvé(s)\n`);

  await displayUnprocessedEmails(emails);

  // Menu interactif
  console.log('Options:');
  console.log('  1-20 : Analyser un email spécifique (affichés ci-dessus)');
  console.log('  all  : Analyser TOUS les emails (peut être long!)');
  console.log('  quit : Quitter\n');

  const choice = await question('Votre choix: ');

  if (choice.toLowerCase() === 'quit') {
    console.log('👋 Au revoir!');
    rl.close();
    await prisma.$disconnect();
    process.exit(0);
  }

  let selectedEmails: SavedEmail[] = [];

  if (choice.toLowerCase() === 'all') {
    selectedEmails = emails;
  } else {
    const index = parseInt(choice) - 1;
    if (index >= 0 && index < emails.length) {
      selectedEmails = [emails[index]];
    } else {
      console.log('❌ Choix invalide');
      rl.close();
      await prisma.$disconnect();
      process.exit(1);
    }
  }

  // Analyser et créer les dossiers
  console.log(`\n🔍 Analyse de ${selectedEmails.length} email(s) avec IA locale...\n`);

  for (const email of selectedEmails) {
    try {
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log(`📧 Email: ${email.subject}`);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

      // Analyse IA
      console.log('🤖 Analyse IA en cours...');
      const analysis = await emailAnalyzer.analyzeEmail({
        from: email.from,
        subject: email.subject,
        body: email.body || email.preview || 'Aucun contenu',
        date: email.receivedAt,
      });

      // Créer le dossier
      await createDossierFromAnalysis(email, analysis);
    } catch (error) {
      console.error('❌ Erreur:', error);
      console.log('⚠️ Email ignoré');
    }

    console.log('');
  }

  console.log('========================================');
  console.log('✅ Traitement terminé!');
  console.log('\n💡 Accédez aux dossiers: http://localhost:3000/admin/dossiers');

  rl.close();
  await prisma.$disconnect();
}

main().catch(console.error);
