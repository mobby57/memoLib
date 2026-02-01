#!/usr/bin/env tsx
/**
 * Email to Workspace Converter
 * Convertit automatiquement les emails en dossiers/workspaces clients
 */

import fs from 'fs';
import path from 'path';
import { PrismaClient } from '@prisma/client';
import readline from 'readline';

const prisma = new PrismaClient();

interface EmailData {
  id: string;
  from: string;
  subject: string;
  date: string;
  snippet: string;
  body?: string;
  type: string;
  priority: string;
  tags: string[];
  confidence: number;
}

interface ClientInfo {
  email: string;
  nom?: string;
  prenom?: string;
  typeDemande?: string;
  urgence?: string;
}

// Extraction intelligente des informations client
function extractClientInfo(email: EmailData): ClientInfo {
  const info: ClientInfo = {
    email: email.from,
  };

  // Extraire nom/prénom de l'email ou du sujet
  const emailMatch = email.from.match(/^([^<]+)</);
  if (emailMatch) {
    const name = emailMatch[1].trim();
    const parts = name.split(' ');
    if (parts.length >= 2) {
      info.prenom = parts[0];
      info.nom = parts.slice(1).join(' ');
    }
  }

  // Détecter le type de demande CESEDA
  const text = `${email.subject} ${email.snippet} ${email.body || ''}`.toLowerCase();
  
  if (text.includes('titre de séjour') || text.includes('titre de sejour')) {
    info.typeDemande = 'Titre de séjour';
  } else if (text.includes('visa')) {
    info.typeDemande = 'Visa';
  } else if (text.includes('naturalisation')) {
    info.typeDemande = 'Naturalisation';
  } else if (text.includes('regroupement familial')) {
    info.typeDemande = 'Regroupement familial';
  } else if (text.includes('oqtf') || text.includes('expulsion')) {
    info.typeDemande = 'OQTF / Expulsion';
  } else if (text.includes('asile') || text.includes('réfugié')) {
    info.typeDemande = 'Demande d\'asile';
  } else {
    info.typeDemande = 'Demande générale';
  }

  // Détecter urgence
  if (email.priority === 'urgent' || text.includes('urgent') || text.includes('délai')) {
    info.urgence = 'URGENT';
  }

  return info;
}

// Créer un dossier depuis un email
async function createDossierFromEmail(email: EmailData, adminId: string): Promise<any> {
  const clientInfo = extractClientInfo(email);

  console.log('\n📋 Informations extraites:');
  console.log(`   Nom: ${clientInfo.nom || 'Non détecté'}`);
  console.log(`   Prénom: ${clientInfo.prenom || 'Non détecté'}`);
  console.log(`   Email: ${clientInfo.email}`);
  console.log(`   Type: ${clientInfo.typeDemande}`);
  console.log(`   Urgence: ${clientInfo.urgence || 'Normale'}`);

  // Créer le client (ou récupérer s'il existe)
  let client = await prisma.client.findFirst({
    where: { email: clientInfo.email }
  });

  if (!client) {
    console.log('\n✨ Création du client...');
    client = await prisma.client.create({
      data: {
        nom: clientInfo.nom || 'À renseigner',
        prenom: clientInfo.prenom || 'À renseigner',
        email: clientInfo.email,
        telephone: '',
        nationalite: 'À renseigner',
        dateNaissance: new Date('1990-01-01'),
        adresse: '',
        codePostal: '',
        ville: '',
        userId: adminId, // L'admin qui gère ce client
      }
    });
    console.log(`   ✅ Client créé: ${client.nom} ${client.prenom}`);
  } else {
    console.log(`   ℹ️  Client existant: ${client.nom} ${client.prenom}`);
  }

  // Créer le dossier
  console.log('\n📁 Création du dossier...');
  const dossier = await prisma.dossier.create({
    data: {
      titre: `${clientInfo.typeDemande} - ${client.nom} ${client.prenom}`,
      type: clientInfo.typeDemande || 'Autre',
      statut: 'nouveau',
      description: `Demande reçue par email le ${new Date(email.date).toLocaleDateString('fr-FR')}\n\nSujet: ${email.subject}\n\n${email.snippet}`,
      dateOuverture: new Date(email.date),
      clientId: client.id,
    }
  });

  console.log(`   ✅ Dossier créé: ${dossier.titre}`);
  console.log(`   ID: ${dossier.id}`);

  // Si urgent, créer une échéance
  if (clientInfo.urgence) {
    console.log('\n⏰ Création d\'une échéance urgente...');
    await prisma.echeance.create({
      data: {
        titre: `URGENT - ${clientInfo.typeDemande}`,
        type: 'Délai légal',
        dateEcheance: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 jours
        statut: 'en_attente',
        dossierId: dossier.id,
      }
    });
    console.log('   ✅ Échéance créée (7 jours)');
  }

  return { client, dossier };
}

// Interface interactive
async function interactive() {
  console.log('╔══════════════════════════════════════════╗');
  console.log('║   📧➡️📁  EMAIL TO WORKSPACE           ║');
  console.log('╚══════════════════════════════════════════╝\n');

  // Lire les emails
  const emailsDir = path.join(process.cwd(), 'logs', 'emails');
  if (!fs.existsSync(emailsDir)) {
    console.log('❌ Aucun email trouvé dans logs/emails/');
    process.exit(1);
  }

  const files = fs.readdirSync(emailsDir)
    .filter(file => file.endsWith('.json'))
    .sort((a, b) => b.localeCompare(a)); // Plus récents en premier

  if (files.length === 0) {
    console.log('❌ Aucun email sauvegardé');
    process.exit(1);
  }

  console.log(`📊 ${files.length} email(s) trouvé(s)\n`);

  // Filtrer les emails "nouveau client"
  const newClientEmails = files
    .map(file => {
      const content = fs.readFileSync(path.join(emailsDir, file), 'utf-8');
      return JSON.parse(content);
    })
    .filter(email => 
      email.tags?.includes('Nouveau Client') || 
      email.type === 'nouveau_client' ||
      email.priority === 'high'
    )
    .slice(0, 10); // Max 10

  if (newClientEmails.length === 0) {
    console.log('ℹ️  Aucun email "Nouveau Client" détecté');
    console.log('Conseil: Relancez npm run email:monitor pour scanner de nouveaux emails');
    process.exit(0);
  }

  console.log(`🎯 ${newClientEmails.length} email(s) potentiel(s) nouveau client:\n`);

  // Afficher les emails
  newClientEmails.forEach((email, index) => {
    console.log(`${index + 1}. De: ${email.from}`);
    console.log(`   Sujet: ${email.subject}`);
    console.log(`   Date: ${new Date(email.date).toLocaleString('fr-FR')}`);
    console.log(`   Tags: ${email.tags?.join(', ') || 'Aucun'}\n`);
  });

  // Récupérer l'admin (premier ADMIN trouvé)
  const admin = await prisma.user.findFirst({
    where: { role: 'ADMIN' }
  });

  if (!admin) {
    console.log('❌ Aucun utilisateur ADMIN trouvé dans la base de données');
    process.exit(1);
  }

  // Interface de sélection
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  const question = (query: string): Promise<string> => {
    return new Promise(resolve => rl.question(query, resolve));
  };

  try {
    const choice = await question('\n📋 Sélectionnez un email (numéro) ou "all" pour tous: ');

    if (choice.toLowerCase() === 'all') {
      console.log('\n🚀 Création de dossiers pour tous les emails...\n');
      
      for (const email of newClientEmails) {
        console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
        console.log(`📧 Traitement: ${email.subject}`);
        await createDossierFromEmail(email, admin.id);
      }
    } else {
      const index = parseInt(choice) - 1;
      if (index >= 0 && index < newClientEmails.length) {
        const email = newClientEmails[index];
        await createDossierFromEmail(email, admin.id);
      } else {
        console.log('❌ Choix invalide');
      }
    }

    console.log('\n✅ Terminé!');
    console.log('\n📊 Consultez les dossiers: http://localhost:3000/admin/dossiers');

  } finally {
    rl.close();
    await prisma.$disconnect();
  }
}

// Lancer l'interface
interactive().catch(console.error);
