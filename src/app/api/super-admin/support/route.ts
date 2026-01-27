import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import { logger } from '@/lib/logger';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Mock data for support tickets
    const tickets = [
      {
        id: '1',
        tenantId: 'demo',
        tenantName: 'Cabinet Demo',
        subject: 'Probleme de connexion',
        status: 'open',
        priority: 'high',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];

    return NextResponse.json(tickets);
  } catch (error) {
    logger.error('Erreur GET support tickets', error instanceof Error ? error : undefined, {
      route: '/api/super-admin/support',
    });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();

    // Mock: in production, save to database
    const ticket = {
      id: Date.now().toString(),
      ...data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    return NextResponse.json(ticket, { status: 201 });
  } catch (error) {
    logger.error('Erreur POST support ticket', error instanceof Error ? error : undefined, {
      route: '/api/super-admin/support',
    });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
