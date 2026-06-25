import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/ai/risk-radar
 * Score de risque (0-100) pour chaque dossier actif du tenant.
 * Facteurs : délai proche, pièces manquantes, inactivité, procédure critique, audience proche.
 */
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

  const user = session.user as any;
  const tenantId = user.tenantId;
  if (!tenantId) return NextResponse.json({ error: 'Pas de tenant' }, { status: 400 });

  const now = new Date();

  const dossiers = await prisma.dossier.findMany({
    where: { tenantId, statut: { notIn: ['cloture', 'archive'] } },
    include: {
      client: { select: { firstName: true, lastName: true } },
      legalDeadlines: { where: { status: 'PENDING' } },
      checklistItems: true,
    },
    take: 50,
  });

  const scored = dossiers.map((d) => {
    let score = 0;
    const factors: string[] = [];

    // Facteur 1 : Délai proche
    const closestDeadline = d.legalDeadlines
      .map(dl => (new Date(dl.dueDate).getTime() - now.getTime()) / 86400000)
      .sort((a, b) => a - b)[0];

    if (closestDeadline !== undefined) {
      if (closestDeadline <= 2) { score += 40; factors.push(`Échéance dans ${Math.max(0, Math.ceil(closestDeadline))}j`); }
      else if (closestDeadline <= 7) { score += 25; factors.push(`Échéance dans ${Math.ceil(closestDeadline)}j`); }
      else if (closestDeadline <= 14) { score += 10; }
    }

    // Facteur 2 : Pièces manquantes
    const missing = d.checklistItems.filter(i => i.status === 'missing' && i.required);
    if (missing.length >= 3) { score += 25; factors.push(`${missing.length} pièces manquantes`); }
    else if (missing.length > 0) { score += 10; factors.push(`${missing.length} pièce(s) manquante(s)`); }

    // Facteur 3 : Inactivité
    const daysSinceUpdate = (now.getTime() - new Date(d.updatedAt).getTime()) / 86400000;
    if (daysSinceUpdate > 14) { score += 15; factors.push(`Inactif depuis ${Math.ceil(daysSinceUpdate)}j`); }
    else if (daysSinceUpdate > 7) { score += 5; }

    // Facteur 4 : Procédure critique
    if (d.typeDossier?.includes('OQTF_SANS_DELAI')) { score += 20; factors.push('OQTF sans délai'); }
    else if (d.typeDossier?.includes('OQTF')) { score += 10; factors.push('Procédure OQTF'); }
    else if (d.typeDossier?.includes('RETENTION')) { score += 15; factors.push('Rétention'); }

    score = Math.min(100, score);
    const level = score >= 70 ? 'critical' : score >= 45 ? 'high' : score >= 20 ? 'medium' : 'low';

    return {
      id: d.id,
      numero: d.numero || d.id.slice(0, 8),
      typeDossier: d.typeDossier || 'Non défini',
      clientName: d.client ? `${d.client.firstName} ${d.client.lastName}` : 'Client',
      score,
      level,
      factors,
    };
  });

  // Trier par score décroissant
  scored.sort((a, b) => b.score - a.score);

  return NextResponse.json({ dossiers: scored.filter(d => d.score > 0) });
}
