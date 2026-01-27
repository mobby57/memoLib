import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { emailMonitor } from '@/lib/email/email-monitor-service';

// GET - Liste des emails
export async function GET(
  req: NextRequest,
  { params }: { params: { tenantId: string } }
) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user || (session.user as any).tenantId !== params.tenantId) {
    return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status');
  const limit = parseInt(searchParams.get('limit') || '50');

  try {
    const emails = await prisma.email.findMany({
      where: {
        tenantId: params.tenantId,
        ...(status === 'pending' && { isProcessed: false }),
        ...(status === 'processed' && { isProcessed: true })
      },
      include: {
        client: { select: { firstName: true, lastName: true } },
        dossier: { select: { numero: true, typeDossier: true } }
      },
      orderBy: { receivedAt: 'desc' },
      take: limit
    });

    return NextResponse.json(emails);
  } catch (error) {
    logger.error('Erreur liste emails:', { error });
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// POST - Retraiter ou lier un email
export async function POST(
  req: NextRequest,
  { params }: { params: { tenantId: string } }
) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user || (session.user as any).tenantId !== params.tenantId) {
    return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
  }

  try {
    const { emailId, action, dossierId, clientId } = await req.json();

    if (action === 'reprocess') {
      const email = await prisma.email.findUnique({ where: { id: emailId } });
      if (!email) {
        return NextResponse.json({ error: 'Email introuvable' }, { status: 404 });
      }

      const rawEmail = `From: ${email.from}\nSubject: ${email.subject}\n\n${email.body}`;
      const result = await emailMonitor.processEmail(params.tenantId, rawEmail);
      return NextResponse.json({ success: true, result });
    }

    if (action === 'link') {
      await prisma.email.update({
        where: { id: emailId },
        data: { dossierId, clientId, isProcessed: true }
      });
      return NextResponse.json({ success: true, message: 'Email lié' });
    }

    return NextResponse.json({ error: 'Action invalide' }, { status: 400 });
  } catch (error) {
    logger.error('Erreur traitement email:', { error });
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
