import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/middleware/auth';
import { logger, LogCategory } from '@/lib/logger';
import { prisma } from '@/lib/prisma';

// ============================================
// GET /api/example/protected
// Route d'exemple démontrant l'utilisation de withAuth
// ============================================

export const GET = withAuth(['ADMIN', 'SUPER_ADMIN'], async (
  request: NextRequest,
  { session }
) => {
  try {
    const user = session.user;

    logger.log(LogCategory.API, `Example protected route accessed`, {
      userId: user.id,
      role: user.role,
      tenantId: user.tenantId,
    });

    // Exemple: Récupérer des statistiques pour le tenant
    const [userCount, dossierCount, clientCount] = await Promise.all([
      prisma.user.count({
        where: { tenantId: user.tenantId },
      }),
      prisma.dossier.count({
        where: { tenantId: user.tenantId! },
      }),
      prisma.client.count({
        where: { tenantId: user.tenantId! },
      }),
    ]);

    logger.log(LogCategory.API, `✅ Example data retrieved`, {
      userId: user.id,
      stats: { users: userCount, dossiers: dossierCount, clients: clientCount },
    });

    return NextResponse.json({
      success: true,
      message: 'Data retrieved successfully',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        tenantId: user.tenantId,
      },
      stats: {
        users: userCount,
        dossiers: dossierCount,
        clients: clientCount,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error(LogCategory.API, 'Error in example protected route', { error });
    return NextResponse.json(
      { error: 'Failed to fetch data' },
      { status: 500 }
    );
  }
});
