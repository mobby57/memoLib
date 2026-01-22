import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/middleware/auth';
import { logger, LogCategory } from '@/lib/logger';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// ============================================
// VALIDATION SCHEMAS
// ============================================

const DossierQuerySchema = z.object({
  status: z.enum(['en_attente', 'documents_requis', 'en_cours', 'analyse_ia', 'termine']).optional(),
  sortBy: z.enum(['createdAt', 'priority', 'status']).default('createdAt'),
  order: z.enum(['asc', 'desc']).default('desc'),
});

// ============================================
// GET /api/tenant/[tenantId]/clients/[clientId]/dossiers
// Récupère tous les dossiers d'un client spécifique
// ============================================

export const GET = withAuth(['ADMIN', 'SUPER_ADMIN'], async (
  request: NextRequest,
  { params, session }
) => {
  try {
    const { tenantId, clientId } = params as { tenantId: string; clientId: string };
    const { searchParams } = new URL(request.url);

    // Validation des paramètres
    const { status, sortBy, order } = DossierQuerySchema.parse({
      status: searchParams.get('status'),
      sortBy: searchParams.get('sortBy'),
      order: searchParams.get('order'),
    });

    // Vérification d'accès tenant
    if (session.user.role === 'ADMIN' && session.user.tenantId !== tenantId) {
      logger.warn(LogCategory.SECURITY, 'Unauthorized tenant access attempt', {
        userId: session.user.id,
        attemptedTenant: tenantId,
        userTenant: session.user.tenantId,
      });
      return NextResponse.json({ error: 'Accès interdit' }, { status: 403 });
    }

    logger.log(LogCategory.API, `Fetching dossiers for client`, { tenantId, clientId, status });

    // Construire le filtre
    const where: any = { tenantId, clientId };
    if (status) {
      where.statut = status;
    }

    // Récupérer les dossiers
    const dossiers = await prisma.dossier.findMany({
      where,
      include: {
        client: {
          select: { firstName: true, lastName: true, email: true },
        },
        _count: {
          select: { documents: true },
        },
      },
      orderBy: { [sortBy]: order },
    });

    // Formater les données avec progression calculée
    const formattedDossiers = dossiers.map((dossier) => {
      const hasDocuments = dossier._count.documents > 0;
      const hasDescription = dossier.description && dossier.description.length > 50;
      const clientDataComplete = hasDocuments && hasDescription;

      // Calculer la progression
      let progression = 0;
      if (dossier.statut === 'en_attente') progression = 20;
      else if (dossier.statut === 'documents_requis') progression = 30;
      else if (dossier.statut === 'en_cours') progression = clientDataComplete ? 65 : 40;
      else if (dossier.statut === 'analyse_ia') progression = 80;
      else if (dossier.statut === 'termine') progression = 100;

      // Calculer la priorité basée sur l'ancienneté
      const daysSinceCreation = Math.floor(
        (new Date().getTime() - new Date(dossier.createdAt).getTime()) / (1000 * 60 * 60 * 24)
      );
      const priorite = daysSinceCreation > 14 ? 'haute' : 
                       daysSinceCreation > 7 ? 'moyenne' : 'basse';

      return {
        id: dossier.id,
        numero: dossier.numero,
        titre: dossier.objet || 'Sans objet',
        type: dossier.typeDossier || 'Réclamation',
        statut: dossier.statut,
        priorite,
        progression,
        clientDataComplete,
        documentsCount: dossier._count.documents,
        createdAt: dossier.createdAt.toISOString(),
        client: dossier.client,
      };
    });

    logger.log(LogCategory.API, `✅ Dossiers fetched for client`, {
      tenantId,
      clientId,
      count: formattedDossiers.length,
    });

    return NextResponse.json({
      success: true,
      dossiers: formattedDossiers,
      total: formattedDossiers.length,
      filters: { status, sortBy, order },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      logger.warn(LogCategory.API, 'Invalid dossier query parameters', { error: error.errors });
      return NextResponse.json(
        { error: 'Paramètres invalides', details: error.errors },
        { status: 400 }
      );
    }

    logger.error(LogCategory.API, 'Error fetching client dossiers', { error });
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
});
