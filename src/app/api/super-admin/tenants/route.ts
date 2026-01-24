import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { logger } from '@/lib/logger';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Non authentifie' }, { status: 401 });
    }

    const user = session.user as any;

    if (user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Acces interdit' }, { status: 403 });
    }

    // Parse query params
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');

    // Recuperer tous les tenants avec leurs statistiques
    const tenants = await prisma.tenant.findMany({
      take: limit,
      include: {
        plan: {
          select: {
            name: true,
            displayName: true
          }
        },
        _count: {
          select: {
            users: true,
            dossiers: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Format response without factures (model not yet implemented)
    const tenantsWithStats = tenants.map((tenant) => ({
      id: tenant.id,
      name: tenant.name,
      plan: tenant.plan.name,
      status: tenant.status,
      userCount: tenant._count.users,
      dossierCount: tenant._count.dossiers,
      revenue: 0, // Facture model not yet implemented
      createdAt: tenant.createdAt.toISOString()
    }));

    return NextResponse.json(tenantsWithStats);

  } catch (error) {
    logger.error('Erreur API super admin tenants', { error });
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Non authentifie' }, { status: 401 });
    }

    const user = session.user as any;

    if (user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Acces interdit' }, { status: 403 });
    }

    const body = await request.json();
    const { name, subdomain, planId, adminEmail, adminName, adminPassword } = body;

    // Validation
    if (!name || !subdomain || !planId || !adminEmail || !adminName || !adminPassword) {
      return NextResponse.json({ error: 'Donnees manquantes' }, { status: 400 });
    }

    // Verifier que le subdomain est unique
    const existingTenant = await prisma.tenant.findUnique({
      where: { subdomain }
    });

    if (existingTenant) {
      return NextResponse.json({ error: 'Subdomain deja utilise' }, { status: 400 });
    }

    // Creer le tenant
    const tenant = await prisma.tenant.create({
      data: {
        name,
        subdomain,
        planId,
        status: 'active'
      }
    });

    // Creer l'utilisateur admin du tenant
    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash(adminPassword, 12);

    const adminUser = await prisma.user.create({
      data: {
        email: adminEmail,
        name: adminName,
        password: hashedPassword,
        role: 'ADMIN',
        tenantId: tenant.id
      }
    });

    return NextResponse.json({
      tenant: {
        id: tenant.id,
        name: tenant.name,
        subdomain: tenant.subdomain,
        status: tenant.status
      },
      admin: {
        id: adminUser.id,
        email: adminUser.email,
        name: adminUser.name
      }
    }, { status: 201 });

  } catch (error) {
    logger.error('Erreur creation tenant', { error });
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
