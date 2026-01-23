import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { logger } from '@/lib/logger';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const user = session.user as any;

    if (user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Accès interdit' }, { status: 403 });
    }

    // Récupérer tous les tenants avec leurs statistiques
    const tenants = await prisma.tenant.findMany({
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
            dossiers: true,
            factures: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Calculer les revenus par tenant
    const tenantsWithStats = await Promise.all(
      tenants.map(async (tenant) => {
        const revenus = await prisma.facture.aggregate({
          where: { 
            tenantId: tenant.id,
            statut: 'payee'
          },
          _sum: { montant: true }
        });

        return {
          id: tenant.id,
          name: tenant.name,
          plan: tenant.plan.name,
          status: tenant.status,
          userCount: tenant._count.users,
          dossierCount: tenant._count.dossiers,
          revenue: revenus._sum.montant || 0,
          createdAt: tenant.createdAt.toISOString()
        };
      })
    );

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
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const user = session.user as any;

    if (user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Accès interdit' }, { status: 403 });
    }

    const body = await request.json();
    const { name, subdomain, planId, adminEmail, adminName, adminPassword } = body;

    // Validation
    if (!name || !subdomain || !planId || !adminEmail || !adminName || !adminPassword) {
      return NextResponse.json({ error: 'Données manquantes' }, { status: 400 });
    }

    // Vérifier que le subdomain est unique
    const existingTenant = await prisma.tenant.findUnique({
      where: { subdomain }
    });

    if (existingTenant) {
      return NextResponse.json({ error: 'Subdomain déjà utilisé' }, { status: 400 });
    }

    // Créer le tenant
    const tenant = await prisma.tenant.create({
      data: {
        name,
        subdomain,
        planId,
        status: 'active'
      }
    });

    // Créer l'utilisateur admin du tenant
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
    logger.error('Erreur création tenant', { error });
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
