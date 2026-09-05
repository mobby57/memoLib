import { auth } from '@/lib/clerk-auth';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { canAccessDossier } from '@/lib/auth/dossier-access';

/**
 * GET /api/dossiers/[id]/honoraires
 * Calcule les honoraires bases sur le temps passe et le taux horaire.
 */
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { user } = await auth();
    const session = user ? { user } : null;
  if (!user) return NextResponse.json({ error: 'Non authentifie' }, { status: 401 });

  const { id } = await params;
  const tauxHoraire = parseInt(req.nextUrl.searchParams.get('taux') || '150');

  if (!user.tenantId) return NextResponse.json({ error: 'Acces refuse' }, { status: 403 });
  const access = await canAccessDossier({ userId: user.id, tenantId: user.tenantId, role: user.role, groups: user.groups, dossierId: id, action: 'read' });
  if (!access.allowed) return NextResponse.json({ error: 'Dossier non trouve' }, { status: 404 });

  const dossier = await prisma.dossier.findFirst({
    where: { id, tenantId: user.tenantId },
    select: { id: true, numero: true, typeDossier: true, createdAt: true },
  });

  if (!dossier) return NextResponse.json({ error: 'Dossier non trouve' }, { status: 404 });

  // Estimation temps par type de procedure
  const tempsEstime: Record<string, { heures: number; detail: string[] }> = {
    OQTF: { heures: 8, detail: ['Analyse dossier (2h)', 'Redaction recours (4h)', 'Audience TA (2h)'] },
    OQTF_SANS_DELAI: { heures: 6, detail: ['Analyse urgente (1h)', 'Refere-liberte (3h)', 'Audience (2h)'] },
    Asile: { heures: 12, detail: ['Entretien client (2h)', 'Preparation recit (4h)', 'Accompagnement OFPRA (3h)', 'Recours CNDA (3h)'] },
    TitreSejour: { heures: 6, detail: ['Analyse (1h)', 'Constitution dossier (3h)', 'Recours (2h)'] },
    Naturalisation: { heures: 5, detail: ['Analyse (1h)', 'Constitution dossier (3h)', 'Suivi (1h)'] },
    RegroupementFamilial: { heures: 7, detail: ['Analyse (1h)', 'Constitution dossier (4h)', 'Recours si refus (2h)'] },
  };

  const estimation = tempsEstime[dossier.typeDossier] || { heures: 5, detail: ['Estimation standard'] };
  const montantHT = estimation.heures * tauxHoraire;
  const tva = montantHT * 0.20;
  const montantTTC = montantHT + tva;

  return NextResponse.json({
    dossierId: id,
    numero: dossier.numero,
    typeDossier: dossier.typeDossier,
    tauxHoraire: `${tauxHoraire} EUR/h`,
    tempsEstime: `${estimation.heures}h`,
    detail: estimation.detail,
    montantHT: `${montantHT} EUR`,
    tva: `${tva.toFixed(0)} EUR (20%)`,
    montantTTC: `${montantTTC.toFixed(0)} EUR`,
  });
}
