import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { ReportingService } from '@/lib/services/comptabilite';
import prisma from '@/lib/prisma';

/**
 * GET /api/exports/fec
 * Génère un export au format FEC (Fichier des Écritures Comptables)
 * Conforme à l'article L47 A-1 du Livre des Procédures Fiscales
 *
 * Si le module comptabilité est initialisé, utilise les vraies écritures.
 * Sinon, fallback sur les factures existantes (rétrocompatibilité).
 */
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

  const user = session.user as any;
  const year = parseInt(req.nextUrl.searchParams.get('year') || new Date().getFullYear().toString());

  try {
    const fecContent = await ReportingService.exportFEC(user.tenantId, year);
    const ligneCount = fecContent.split('\n').length - 1;

    if (ligneCount > 0) {
      return NextResponse.json({
        success: true,
        year,
        format: 'FEC',
        ecritures: ligneCount,
        content: fecContent,
        source: 'comptabilite',
        note: 'Export FEC conforme art. L47 A-1 du LPF. À transmettre à votre expert-comptable.',
      });
    }

    // Fallback : générer depuis les factures
    const factures = await prisma.facture.findMany({
      where: {
        tenantId: user.tenantId,
        createdAt: { gte: new Date(`${year}-01-01`), lt: new Date(`${year + 1}-01-01`) },
      },
      include: { Client: { select: { firstName: true, lastName: true } } },
      orderBy: { createdAt: 'asc' },
    });

    const header = 'JournalCode\tJournalLib\tEcritureNum\tEcritureDate\tCompteNum\tCompteLib\tCompAuxNum\tCompAuxLib\tPieceRef\tPieceDate\tEcritureLib\tDebit\tCredit\tEcritureLet\tDateLet\tValidDate\tMontantdevise\tIdevise';

    const lines = factures.map((f, i) => {
      const date = f.createdAt.toISOString().split('T')[0].replace(/-/g, '');
      const clientNom = `${f.Client?.firstName || ''} ${f.Client?.lastName || ''}`.trim();
      const montant = (f.montantTTC || 0).toFixed(2).replace('.', ',');
      return `VE\tVentes\t${i + 1}\t${date}\t706000\tHonoraires\t${f.clientId || ''}\t${clientNom}\t${f.numero}\t${date}\tFacture ${f.numero}\t${montant}\t0,00\t\t\t${date}\t${montant}\tEUR`;
    });

    return NextResponse.json({
      success: true,
      year,
      format: 'FEC',
      ecritures: factures.length,
      content: [header, ...lines].join('\n'),
      source: 'factures_fallback',
      note: 'Export FEC simplifié. Initialisez le module comptabilité pour un export complet conforme.',
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erreur export FEC' },
      { status: 500 }
    );
  }
}
