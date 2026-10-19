import { auth } from '@/lib/clerk-auth';
import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { prisma } from '@/lib/prisma';
import { emailMonitor } from '@/lib/email/email-monitor-service';

// GET - Liste des emails
export async function GET(
  req: NextRequest,
  { params }: { params: { tenantId: string } }
) {
  const { user } = await auth();
    const session = user ? { user } : null;
  
  if (!user || (user as any).tenantId !== params.tenantId) {
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
  const { user } = await auth();
    const session = user ? { user } : null;
  
  if (!user || (user as any).tenantId !== params.tenantId) {
    return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
  }

  try {
    const { emailId, action, dossierId, clientId } = await req.json();

    if (typeof emailId !== 'string' || !emailId.trim()) {
      return NextResponse.json({ error: 'Identifiant email invalide' }, { status: 400 });
    }

    if (action === 'reprocess') {
      const email = await prisma.email.findFirst({
        where: { id: emailId, tenantId: params.tenantId },
      });
      if (!email) {
        return NextResponse.json({ error: 'Email introuvable' }, { status: 404 });
      }

      const rawEmail = `From: ${email.from}\nSubject: ${email.subject}\n\n${email.body}`;
      const result = await emailMonitor.processEmail(params.tenantId, rawEmail);
      return NextResponse.json({ success: true, result });
    }

    if (action === 'link') {
      if (dossierId != null && typeof dossierId !== 'string') {
        return NextResponse.json({ error: 'Identifiant dossier invalide' }, { status: 400 });
      }
      if (clientId != null && typeof clientId !== 'string') {
        return NextResponse.json({ error: 'Identifiant client invalide' }, { status: 400 });
      }

      const email = await prisma.email.findFirst({
        where: { id: emailId, tenantId: params.tenantId },
        select: { id: true },
      });
      if (!email) {
        return NextResponse.json({ error: 'Email introuvable' }, { status: 404 });
      }

      if (dossierId) {
        const dossier = await prisma.dossier.findFirst({
          where: { id: dossierId, tenantId: params.tenantId },
          select: { id: true },
        });
        if (!dossier) {
          return NextResponse.json({ error: 'Dossier introuvable dans ce cabinet' }, { status: 404 });
        }
      }

      if (clientId) {
        const client = await prisma.client.findFirst({
          where: { id: clientId, tenantId: params.tenantId },
          select: { id: true },
        });
        if (!client) {
          return NextResponse.json({ error: 'Client introuvable dans ce cabinet' }, { status: 404 });
        }
      }

      const updated = await prisma.email.updateMany({
        where: { id: emailId, tenantId: params.tenantId },
        data: { dossierId, clientId, isProcessed: true },
      });
      if (updated.count !== 1) {
        return NextResponse.json({ error: 'Email introuvable' }, { status: 404 });
      }

      return NextResponse.json({ success: true, message: 'Email lié' });
    }

    return NextResponse.json({ error: 'Action invalide' }, { status: 400 });
  } catch (error) {
    logger.error('Erreur traitement email:', { error });
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
