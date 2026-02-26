import { authOptions } from '@/lib/auth';
import { logger } from '@/lib/logger';
import fs from 'fs';
import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';
import path from 'path';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Non autorise' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const priority = searchParams.get('priority');
    const limit = parseInt(searchParams.get('limit') || '50');

    // Lire tous les emails sauvegardes
    const emailsDir = path.join(process.cwd(), 'logs', 'emails');

    if (!fs.existsSync(emailsDir)) {
      return NextResponse.json({ emails: [], stats: {} });
    }

    const files = fs
      .readdirSync(emailsDir)
      .filter(file => file.endsWith('.json'))
      .sort((a, b) => b.localeCompare(a)) // Plus recents en premier
      .slice(0, limit);

    const emails = files.map(file => {
      const content = fs.readFileSync(path.join(emailsDir, file), 'utf-8');
      return JSON.parse(content);
    });

    // Filtrer selon les parametres
    let filteredEmails = emails;

    if (type) {
      filteredEmails = filteredEmails.filter(email => email.type === type);
    }

    if (priority) {
      filteredEmails = filteredEmails.filter(email => email.priority === priority);
    }

    // Calculer les statistiques
    const stats = {
      total: emails.length,
      nouveauClient: emails.filter(e => e.tags?.includes('Nouveau Client')).length,
      urgent: emails.filter(e => e.priority === 'urgent').length,
      spam: emails.filter(e => e.type === 'spam').length,
      nonLus: emails.filter(e => !e.read).length,
      today: emails.filter(e => {
        const emailDate = new Date(e.date);
        const today = new Date();
        return emailDate.toDateString() === today.toDateString();
      }).length,
    };

    return NextResponse.json({
      emails: filteredEmails,
      stats,
      total: filteredEmails.length,
    });
  } catch (error) {
    logger.error('Erreur lors de la recuperation des emails:', { error });
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// Marquer un email comme lu
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Non autorise' }, { status: 401 });
    }

    const { emailId, read } = await request.json();

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

    const filePath = path.join(emailsDir, emailFile);
    const email = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    email.read = read;
    fs.writeFileSync(filePath, JSON.stringify(email, null, 2));

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Erreur lors de la mise a jour:', { error });
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
