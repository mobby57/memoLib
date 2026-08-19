/**
 * POST /api/ai/analyze-dossier
 * 
 * Analyse un dossier complet (emails + documents + timeline) via IA
 * et retourne les éléments structurés pour pré-remplir un mémoire.
 * 
 * Retourne : faits, moyens, pièces, demandes, parties, dates clés.
 */

import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { hybridAI } from '@/lib/ai/hybrid-client';

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
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
    .map((d: any, i: number) => `Pièce ${i + 1}: ${d.originalName || d.filename} (${d.category || 'non classé'})`)
    .join('\n');

  const deadlinesContext = (dossier.LegalDeadline || [])
    .map((dl: any) => `Échéance: ${dl.title || dl.type} — ${new Date(dl.dueDate).toLocaleDateString('fr-FR')}`)
    .join('\n');

  const prompt = `Tu es un assistant juridique expert. Analyse ce dossier et extrais les éléments pour un mémoire de recours.

DOSSIER:
- Numéro: ${dossier.numero}
- Type: ${dossier.typeDossier}
- Client: ${client?.firstName} ${client?.lastName}
- Objet: ${dossier.objet || dossier.description || 'Non précisé'}
- Juridiction: ${dossier.juridiction || 'Non précisée'}
- Date ouverture: ${dossier.dateOuverture || dossier.createdAt}

EMAILS DU DOSSIER:
${emailsContext || 'Aucun email'}

DOCUMENTS:
${documentsContext || 'Aucun document'}

ÉCHÉANCES:
${deadlinesContext || 'Aucune'}

Retourne UNIQUEMENT un JSON valide (pas de texte avant/après) avec cette structure:
{
  "adverseParty": "nom de la partie adverse",
  "juridiction": "nom de la juridiction compétente",
  "objet": "objet du recours en 1-2 phrases",
  "dateDecision": "date de la décision attaquée si trouvée",
  "dateNotification": "date de notification si trouvée",
  "delaiLegal": "délai en toutes lettres",
  "baseLegale": "articles de loi applicables",
  "lieu": "ville du requérant",
  "clientAddress": "adresse du client si trouvée",
  "faits": [
    {"titre": "titre du fait", "contenu": "description factuelle"}
  ],
  "moyens": [
    {"titre": "titre du moyen juridique", "contenu": "argumentation"}
  ],
  "pointsContestes": [
    {"titre": "point contesté", "citationDecision": "citation si disponible", "observations": ["observation 1", "observation 2"]}
  ],
  "pieces": [
    {"numero": 1, "designation": "description de la pièce"}
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

    // Fallback : données minimales extraites sans IA
    return NextResponse.json(buildFallbackAnalysis(dossier, client));
  } catch {
    // Fallback complet si IA indisponible
    return NextResponse.json(buildFallbackAnalysis(dossier, client));
  }
}

function buildFallbackAnalysis(dossier: any, client: any) {
  return {
    _fallback: true,
    adverseParty: '[Partie adverse à compléter]',
    juridiction: dossier.juridiction || 'Tribunal administratif',
    objet: dossier.objet || dossier.description || `Recours — dossier ${dossier.numero}`,
    dateDecision: '[Date à compléter]',
    dateNotification: '[Date à compléter]',
    delaiLegal: 'deux (2) mois',
    baseLegale: '[Articles à compléter]',
    lieu: client?.ville || 'Paris',
    clientAddress: client?.address || '[Adresse à compléter]',
    faits: [
      { titre: 'Contexte', contenu: `Dossier ${dossier.typeDossier} ouvert le ${new Date(dossier.createdAt).toLocaleDateString('fr-FR')} pour ${client?.firstName || ''} ${client?.lastName || ''}.` },
    ],
    moyens: [
      { titre: 'À compléter', contenu: 'L\'IA n\'était pas disponible. Rédigez les moyens manuellement.' },
    ],
    pointsContestes: [],
    pieces: (dossier.Document || []).map((d: any, i: number) => ({
      numero: i + 1,
      designation: d.originalName || d.filename,
    })),
    demandes: [
      'Déclarer le recours recevable ;',
      'Annuler la décision attaquée ;',
    ],
  };
}
