/**
 * API Route: Liste des preuves légales
 * GET /api/legal/proof/list
 *
 * Retourne toutes les preuves légales d'un tenant avec filtres optionnels
 */

import { legalProofService } from '@/lib/services/legal-proof.service';
import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    // 1. Vérifier l'authentification
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    // 2. Récupérer les paramètres de requête
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type') || undefined;
    const isValid =
      searchParams.get('isValid') === 'true'
        ? true
        : searchParams.get('isValid') === 'false'
          ? false
          : undefined;
    const userId = searchParams.get('userId') || undefined;

    // 3. Récupérer le tenantId depuis la session
    const tenantId = (session.user as any).tenantId || 'default-tenant';

    // 4. Lister les preuves avec filtres
    const proofs = await legalProofService.listProofs(tenantId, {
      type,
      isValid,
      userId,
    });

    // 5. Retourner les résultats
    return NextResponse.json({
      success: true,
      count: proofs.length,
      proofs,
    });
  } catch (error: any) {
    console.error('Erreur lors de la liste des preuves:', error);
    return NextResponse.json(
      {
        error: 'Erreur interne du serveur',
        details: error.message,
      },
      { status: 500 }
    );
  }
}
