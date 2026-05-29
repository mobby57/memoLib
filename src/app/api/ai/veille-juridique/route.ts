import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

/**
 * GET /api/ai/veille-juridique
 * Retourne les alertes de veille juridique personnalisees.
 */
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Non authentifie' }, { status: 401 });

  const type = req.nextUrl.searchParams.get('type') || 'all';

  // Veille simulee (en production: scraping Legifrance + alertes)
  const alertes = [
    { id: '1', date: '2026-05-28', type: 'jurisprudence', titre: 'CE, 15 mai 2026 — OQTF et scolarisation des enfants', impact: 'high', resume: 'Le Conseil d\'Etat precise que la scolarisation des enfants depuis plus de 3 ans constitue un element determinant pour apprecier la vie privee et familiale.', dossiersImpactes: 3 },
    { id: '2', date: '2026-05-25', type: 'legislation', titre: 'Decret 2026-456 — Modification delais recours OQTF', impact: 'critical', resume: 'Les delais de recours contre les OQTF avec delai passent de 30 a 15 jours pour certaines categories.', dossiersImpactes: 8 },
    { id: '3', date: '2026-05-20', type: 'circulaire', titre: 'Circulaire NOR/INT — Regularisation travailleurs sans-papiers', impact: 'medium', resume: 'Nouvelles instructions aux prefets pour l\'examen des demandes de regularisation par le travail (art. L.435-1 CESEDA).', dossiersImpactes: 5 },
  ];

  const filtered = type === 'all' ? alertes : alertes.filter(a => a.type === type);

  return NextResponse.json({
    alertes: filtered,
    total: filtered.length,
    lastUpdate: new Date().toISOString(),
    note: 'Veille automatisee. Verifiez les sources officielles.',
  });
}
