/**
 * API Messages Multi-Canal
 * Récupération et gestion des messages de tous les canaux
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { multiChannelService } from '@/lib/multichannel/channel-service';
import { auditService } from '@/lib/multichannel/audit-service';
import { ChannelType } from '@/lib/multichannel/types';

/**
 * GET /api/multichannel/messages
 * Récupérer les messages avec filtrage
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const user = session.user as any;
    const tenantId = user.tenantId;

    if (!tenantId && user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Tenant non trouvé' }, { status: 403 });
    }

    const url = new URL(request.url);
    const options = {
      channel: url.searchParams.get('channel') as ChannelType | undefined,
      status: url.searchParams.get('status') || undefined,
      clientId: url.searchParams.get('clientId') || undefined,
      dossierId: url.searchParams.get('dossierId') || undefined,
      startDate: url.searchParams.get('startDate') ? new Date(url.searchParams.get('startDate')!) : undefined,
      endDate: url.searchParams.get('endDate') ? new Date(url.searchParams.get('endDate')!) : undefined,
      page: parseInt(url.searchParams.get('page') || '1'),
      limit: parseInt(url.searchParams.get('limit') || '50'),
    };

    const result = await multiChannelService.getMessages(tenantId, options);

    return NextResponse.json({
      success: true,
      ...result,
      page: options.page,
      limit: options.limit,
      totalPages: Math.ceil(result.total / options.limit),
    });

  } catch (error) {
    console.error('Erreur récupération messages:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/multichannel/messages
 * Créer un message sortant
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const user = session.user as any;
    const body = await request.json();

    const { channel, recipient, subject, message: messageBody, clientId, dossierId } = body;

    if (!channel || !messageBody) {
      return NextResponse.json(
        { error: 'Canal et message requis' },
        { status: 400 }
      );
    }

    // Log de l'envoi
    await auditService.log({
      action: 'MESSAGE_SENT',
      channel,
      actorType: 'USER',
      actorId: user.id,
      actorName: user.name,
      resourceType: 'MESSAGE',
      resourceId: 'new',
      tenantId: user.tenantId,
      clientId,
      details: {
        recipient,
        subject,
        dossierId,
      },
    });

    // TODO: Implémenter l'envoi réel via les APIs (Twilio, WhatsApp Business, etc.)
    
    return NextResponse.json({
      success: true,
      message: 'Message envoyé (simulation)',
    });

  } catch (error) {
    console.error('Erreur envoi message:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
