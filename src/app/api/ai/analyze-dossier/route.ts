/**
 * POST /api/ai/analyze-dossier
 * 
 * Analyse un dossier complet (emails + documents + timeline) via IA
 * et retourne les Ã©lÃ©ments structurÃ©s pour prÃ©-remplir un mÃ©moire.
 * 
 * Retourne : faits, moyens, piÃ¨ces, demandes, parties, dates clÃ©s.
 */

import { getServerSessionCompat } from '@/lib/auth/getServerSessionCompat';
import { NextRequest, NextResponse } from 'next/server';
import { getSecurePrisma } from '@/lib/prisma';;
import { hybridAI } from '@/lib/ai/hybrid-client';

export async function POST(req: NextRequest) {
  const prisma = await getSecurePrisma();
  const session = await getServerSessionCompat();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const user = session.user as any;
  const tenantId = user.tenantId;

  let body: any;
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'JSON invalide' }, { status: 400 }); }

  const { dossierId } = body;
  if (!dossierId) return NextResponse.json({ error: 'dossierId requis' }, { status: 400 });

  // Charger le dossier avec contexte
  const dossier = await prisma.dossier.findFirst({
    where: { id: dossierId, tenantId },
    include: {
      client: true,
      Email: { orderBy: { createdAt: 'desc' }, take: 10 },
      Document: { take: 20 },
      LegalDeadline: true,
    },
  });

  if (!dossier) return NextResponse.json({ error: 'Dossier introuvable' }, { status: 404 });

  const client = dossier.client as any;

  // Construire le contexte pour l'IA
  const emailsContext = (dossier.Email || [])
    .map((e: any) => `[${new Date(e.createdAt).toLocaleDateString('fr-FR')}] De: ${e.from} | Objet: ${e.subject} | ${(e.body || '').slice(0, 300)}`)
    .join('\n');

  const documentsContext = (dossier.Document || [])
    .map((d: any, i: number) => `PiÃ¨ce ${i + 1}: ${d.originalName || d.filename} (${d.category || 'non classÃ©'})`)
    .join('\n');

  const deadlinesContext = (dossier.LegalDeadline || [])
    .map((dl: any) => `Ã‰chÃ©ance: ${dl.title || dl.type} â€” ${new Date(dl.dueDate).toLocaleDateString('fr-FR')}`)
    .join('\n');

  const prompt = `Tu es un assistant juridique expert. Analyse ce dossier et extrais les Ã©lÃ©ments pour un mÃ©moire de recours.

DOSSIER:
- NumÃ©ro: ${dossier.numero}
- Type: ${dossier.typeDossier}
- Client: ${client?.firstName} ${client?.lastName}
- Objet: ${dossier.objet || dossier.description || 'Non prÃ©cisÃ©'}
- Juridiction: ${dossier.juridiction || 'Non prÃ©cisÃ©e'}
- Date ouverture: ${dossier.dateOuverture || dossier.createdAt}

EMAILS DU DOSSIER:
${emailsContext || 'Aucun email'}

DOCUMENTS:
${documentsContext || 'Aucun document'}

Ã‰CHÃ‰ANCES:
${deadlinesContext || 'Aucune'}

Retourne UNIQUEMENT un JSON valide (pas de texte avant/aprÃ¨s) avec cette structure:
{
  "adverseParty": "nom de la partie adverse",
  "juridiction": "nom de la juridiction compÃ©tente",
  "objet": "objet du recours en 1-2 phrases",
  "dateDecision": "date de la dÃ©cision attaquÃ©e si trouvÃ©e",
  "dateNotification": "date de notification si trouvÃ©e",
  "delaiLegal": "dÃ©lai en toutes lettres",
  "baseLegale": "articles de loi applicables",
  "lieu": "ville du requÃ©rant",
  "clientAddress": "adresse du client si trouvÃ©e",
  "faits": [
    {"titre": "titre du fait", "contenu": "description factuelle"}
  ],
  "moyens": [
    {"titre": "titre du moyen juridique", "contenu": "argumentation"}
  ],
  "pointsContestes": [
    {"titre": "point contestÃ©", "citationDecision": "citation si disponible", "observations": ["observation 1", "observation 2"]}
  ],
  "pieces": [
    {"numero": 1, "designation": "description de la piÃ¨ce"}
  ],
  "demandes": ["demande 1", "demande 2"]
}`;

  try {
    const aiResult = await hybridAI.generateWithCostControl(prompt, tenantId);
    const jsonMatch = aiResult.response.match(/\{[\s\S]*\}/);

    if (jsonMatch) {
      const analysis = JSON.parse(jsonMatch[0]);
      return NextResponse.json({
        ...analysis,
        _provider: aiResult.provider,
        _model: aiResult.model,
        _latency: aiResult.latency,
      });
    }

    // Fallback : donnÃ©es minimales extraites sans IA
    return NextResponse.json(buildFallbackAnalysis(dossier, client));
  } catch {
    // Fallback complet si IA indisponible
    return NextResponse.json(buildFallbackAnalysis(dossier, client));
  }
}

function buildFallbackAnalysis(dossier: any, client: any) {
  return {
    _fallback: true,
    adverseParty: '[Partie adverse Ã  complÃ©ter]',
    juridiction: dossier.juridiction || 'Tribunal administratif',
    objet: dossier.objet || dossier.description || `Recours â€” dossier ${dossier.numero}`,
    dateDecision: '[Date Ã  complÃ©ter]',
    dateNotification: '[Date Ã  complÃ©ter]',
    delaiLegal: 'deux (2) mois',
    baseLegale: '[Articles Ã  complÃ©ter]',
    lieu: client?.ville || 'Paris',
    clientAddress: client?.address || '[Adresse Ã  complÃ©ter]',
    faits: [
      { titre: 'Contexte', contenu: `Dossier ${dossier.typeDossier} ouvert le ${new Date(dossier.createdAt).toLocaleDateString('fr-FR')} pour ${client?.firstName || ''} ${client?.lastName || ''}.` },
    ],
    moyens: [
      { titre: 'Ã€ complÃ©ter', contenu: 'L\'IA n\'Ã©tait pas disponible. RÃ©digez les moyens manuellement.' },
    ],
    pointsContestes: [],
    pieces: (dossier.Document || []).map((d: any, i: number) => ({
      numero: i + 1,
      designation: d.originalName || d.filename,
    })),
    demandes: [
      'DÃ©clarer le recours recevable ;',
      'Annuler la dÃ©cision attaquÃ©e ;',
    ],
  };
}

