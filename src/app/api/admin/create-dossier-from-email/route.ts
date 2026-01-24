import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

interface ClientInfo {
  email: string;
  nom?: string;
  prenom?: string;
  typeDemande?: string;
  urgence?: string;
}

function extractClientInfo(emailData: any): ClientInfo {
  const info: ClientInfo = {
    email: emailData.from,
  };

  // Extraire nom/prenom de l'email
  const emailMatch = emailData.from.match(/^([^<]+)</);
  if (emailMatch) {
    const name = emailMatch[1].trim();
    const parts = name.split(' ');
    if (parts.length >= 2) {
      info.prenom = parts[0];
      info.nom = parts.slice(1).join(' ');
    }
  }

  // Detecter le type de demande
  const text = `${emailData.subject} ${emailData.snippet} ${emailData.body || ''}`.toLowerCase();
  
  if (text.includes('titre de sejour') || text.includes('titre de sejour')) {
    info.typeDemande = 'Titre de sejour';
  } else if (text.includes('visa')) {
    info.typeDemande = 'Visa';
  } else if (text.includes('naturalisation')) {
    info.typeDemande = 'Naturalisation';
  } else if (text.includes('regroupement familial')) {
    info.typeDemande = 'Regroupement familial';
  } else if (text.includes('oqtf') || text.includes('expulsion')) {
    info.typeDemande = 'OQTF / Expulsion';
  } else if (text.includes('asile') || text.includes('refugie')) {
    info.typeDemande = 'Demande d\'asile';
  } else {
    info.typeDemande = 'Demande generale';
  }

  if (emailData.priority === 'urgent' || text.includes('urgent')) {
    info.urgence = 'URGENT';
  }

  return info;
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Non autorise' }, { status: 401 });
    }

    const { emailId } = await request.json();

    // Trouver l'email dans les logs
    const emailsDir = path.join(process.cwd(), 'logs', 'emails');
    const files = fs.readdirSync(emailsDir);
    
    const emailFile = files.find(file => {
      const content = fs.readFileSync(path.join(emailsDir, file), 'utf-8');
      const email = JSON.parse(content);
      return email.id === emailId;
    });

    if (!emailFile) {
      return NextResponse.json({ error: 'Email non trouve' }, { status: 404 });
    }

    const emailData = JSON.parse(
      fs.readFileSync(path.join(emailsDir, emailFile), 'utf-8')
    );

    // Extraire les informations
    const clientInfo = extractClientInfo(emailData);

    // Creer ou recuperer le client
    let client = await prisma.client.findFirst({
      where: { email: clientInfo.email }
    });

    if (!client) {
      client = await prisma.client.create({
        data: {
          nom: clientInfo.nom || 'a renseigner',
          prenom: clientInfo.prenom || 'a renseigner',
          email: clientInfo.email,
          telephone: '',
          nationalite: 'a renseigner',
          dateNaissance: new Date('1990-01-01'),
          adresse: '',
          codePostal: '',
          ville: '',
          userId: session.user.id,
        }
      });
    }

    // Creer le dossier
    const dossier = await prisma.dossier.create({
      data: {
        titre: `${clientInfo.typeDemande} - ${client.nom} ${client.prenom}`,
        type: clientInfo.typeDemande || 'Autre',
        statut: 'nouveau',
        description: `Demande recue par email le ${new Date(emailData.date).toLocaleDateString('fr-FR')}\n\nSujet: ${emailData.subject}\n\n${emailData.snippet}`,
        dateOuverture: new Date(emailData.date),
        clientId: client.id,
      }
    });

    // Si urgent, creer une echeance
    if (clientInfo.urgence) {
      await prisma.echeance.create({
        data: {
          titre: `URGENT - ${clientInfo.typeDemande}`,
          type: 'Delai legal',
          dateEcheance: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          statut: 'en_attente',
          dossierId: dossier.id,
        }
      });
    }

    return NextResponse.json({
      success: true,
      client,
      dossier,
      clientInfo,
    });

  } catch (error) {
    console.error('Erreur lors de la creation du dossier:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
