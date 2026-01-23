import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const user = session.user as any;
    const tenantId = user.tenantId;

    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant non trouvé' }, { status: 404 });
    }

    // Récupérer le tenant avec son plan
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      include: {
        plan: {
          select: {
            maxWorkspaces: true,
            maxDossiers: true,
            maxClients: true,
            maxUsers: true,
            maxStorageGb: true,
          },
        },
      },
    });

    if (!tenant) {
      return NextResponse.json({ error: 'Tenant non trouvé' }, { status: 404 });
    }

    // Calculer les quotas
    const quotas = [
      {
        type: 'workspaces',
        current: tenant.currentWorkspaces,
        limit: tenant.plan.maxWorkspaces,
        percentage: tenant.plan.maxWorkspaces === -1 
          ? 0 
          : (tenant.currentWorkspaces / tenant.plan.maxWorkspaces) * 100,
      },
      {
        type: 'dossiers',
        current: tenant.currentDossiers,
        limit: tenant.plan.maxDossiers,
        percentage: tenant.plan.maxDossiers === -1 
          ? 0 
          : (tenant.currentDossiers / tenant.plan.maxDossiers) * 100,
      },
      {
        type: 'clients',
        current: tenant.currentClients,
        limit: tenant.plan.maxClients,
        percentage: tenant.plan.maxClients === -1 
          ? 0 
          : (tenant.currentClients / tenant.plan.maxClients) * 100,
      },
      {
        type: 'users',
        current: tenant.currentUsers,
        limit: tenant.plan.maxUsers,
        percentage: tenant.plan.maxUsers === -1 
          ? 0 
          : (tenant.currentUsers / tenant.plan.maxUsers) * 100,
      },
      {
        type: 'storage',
        current: tenant.currentStorageGb,
        limit: tenant.plan.maxStorageGb,
        percentage: tenant.plan.maxStorageGb === -1 
          ? 0 
          : (tenant.currentStorageGb / tenant.plan.maxStorageGb) * 100,
      },
    ];

    // Filtrer les quotas illimités pour l'affichage
    const visibleQuotas = quotas.filter(q => q.limit !== -1);

    return NextResponse.json({ 
      success: true,
      quotas: visibleQuotas,
      tenant: {
        name: tenant.name,
        planName: tenant.plan.maxWorkspaces === 1 ? 'SOLO' : tenant.plan.maxWorkspaces === 10 ? 'CABINET' : 'ENTERPRISE',
      }
    });
  } catch (error) {
    console.error('Erreur récupération quotas:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
