import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { logger } from '@/lib/logger';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { tenantId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const user = session.user as any;
    const { tenantId } = params;

    // Seuls les ADMIN peuvent voir cette vue
    if (user.role !== 'ADMIN' || user.tenantId !== tenantId) {
      return NextResponse.json({ error: 'Accès interdit' }, { status: 403 });
    }

    // Récupérer tous les clients du cabinet (role CLIENT)
    const clients = await prisma.user.findMany({
      where: {
        tenantId,
        role: 'CLIENT'
      },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
        updatedAt: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Pour chaque client, calculer ses statistiques
    const clientsWithStats = await Promise.all(
      clients.map(async (client) => {
        // Compter les dossiers du client
        const [activeDossiers, totalDossiers, completedDossiers] = await Promise.all([
          prisma.dossier.count({
            where: {
              tenantId,
              clientId: client.id,
              statut: { in: ['en_cours', 'analyse_ia'] }
            }
          }),
          prisma.dossier.count({
            where: {
              tenantId,
              clientId: client.id
            }
          }),
          prisma.dossier.count({
            where: {
              tenantId,
              clientId: client.id,
              statut: 'termine'
            }
          })
        ]);

        // Dossiers nécessitant une action (documents manquants, validation, etc.)
        const pendingActions = await prisma.dossier.count({
          where: {
            tenantId,
            clientId: client.id,
            statut: { in: ['en_attente', 'documents_requis'] }
          }
        });

        // Dernière activité du client
        const lastDossier = await prisma.dossier.findFirst({
          where: {
            tenantId,
            clientId: client.id
          },
          orderBy: {
            updatedAt: 'desc'
          },
          select: {
            updatedAt: true
          }
        });

        const timeSinceUpdate = lastDossier?.updatedAt 
          ? getTimeSince(lastDossier.updatedAt)
          : 'Aucune activite';

        // Déterminer le statut (attention si actions en attente)
        const status = pendingActions > 0 ? 'attention' : 
                      activeDossiers > 0 ? 'active' : 'inactive';

        // Taux de succès (dossiers terminés / total)
        const successRate = totalDossiers > 0 
          ? Math.round((completedDossiers / totalDossiers) * 100)
          : 0;

        return {
          id: client.id,
          name: client.name || 'Client sans nom',
          email: client.email,
          activeDossiers,
          pendingActions,
          completedDossiers,
          lastActivity: timeSinceUpdate,
          status,
          successRate
        };
      })
    );

    // Statistiques globales du cabinet
    const [totalDossiers, totalDossiersActifs, totalPendingActions] = await Promise.all([
      prisma.dossier.count({ where: { tenantId } }),
      prisma.dossier.count({ 
        where: { 
          tenantId, 
          statut: { in: ['en_cours', 'analyse_ia'] } 
        } 
      }),
      prisma.dossier.count({
        where: {
          tenantId,
          statut: { in: ['en_attente', 'documents_requis'] }
        }
      })
    ]);

    // Dossiers complétés ce mois
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const completedThisMonth = await prisma.dossier.count({
      where: {
        tenantId,
        statut: 'termine',
        updatedAt: {
          gte: startOfMonth
        }
      }
    });

    return NextResponse.json({
      clients: clientsWithStats,
      totalClients: clients.length,
      activeDossiers: totalDossiersActifs,
      pendingActions: totalPendingActions,
      completedThisMonth
    });

  } catch (error) {
    logger.error('Erreur API clients with stats', { error, tenantId: params.tenantId });
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// Helper pour calculer le temps écoulé
function getTimeSince(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - new Date(date).getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 60) return `Il y a ${diffMins}min`;
  if (diffHours < 24) return `Il y a ${diffHours}h`;
  if (diffDays === 1) return 'Il y a 1 jour';
  return `Il y a ${diffDays} jours`;
}
