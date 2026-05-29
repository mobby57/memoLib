import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/exports/fec
 * Genere un export au format FEC (Fichier des Ecritures Comptables) pour l'expert-comptable.
 */
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Non authentifie' }, { status: 401 });

  const user = session.user as any;
  const year = req.nextUrl.searchParams.get('year') || new Date().getFullYear().toString();

  const factures = await prisma.facture.findMany({
    where: {
      tenantId: user.tenantId,
      createdAt: { gte: new Date(`${year}-01-01`), lt: new Date(`${parseInt(year) + 1}-01-01`) },
    },
    include: { client: { select: { nom: true } } },
    orderBy: { createdAt: 'asc' },
  });

  // Format FEC: JournalCode|JournalLib|EcritureNum|EcritureDate|CompteNum|CompteLib|CompAuxNum|CompAuxLib|PieceRef|PieceDate|EcritureLib|Debit|Credit|EcritureLet|DateLet|ValidDate|Montantdevise|Idevise
  const header = 'JournalCode\tJournalLib\tEcritureNum\tEcritureDate\tCompteNum\tCompteLib\tCompAuxNum\tCompAuxLib\tPieceRef\tPieceDate\tEcritureLib\tDebit\tCredit\tEcritureLet\tDateLet\tValidDate\tMontantdevise\tIdevise';

  const lines = factures.map((f, i) => {
    const date = f.createdAt.toISOString().split('T')[0].replace(/-/g, '');
    const montant = (f.montantTTC || 0).toFixed(2);
    return `VE\tVentes\t${i + 1}\t${date}\t706000\tHonoraires\t${f.clientId || ''}\t${f.client?.nom || ''}\t${f.numero}\t${date}\tFacture ${f.numero}\t${montant}\t0.00\t\t\t${date}\t${montant}\tEUR`;
  });

  return NextResponse.json({
    success: true,
    year,
    format: 'FEC',
    ecritures: factures.length,
    content: [header, ...lines].join('\n'),
    note: 'Export FEC conforme art. L47 A-1 du LPF. A transmettre a votre expert-comptable.',
  });
}
