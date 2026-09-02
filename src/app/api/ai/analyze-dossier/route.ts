import { auth } from '@/lib/clerk-auth';
import { hybridAI } from '@/lib/ai/hybrid-client';
import { canAccessDossier } from '@/lib/auth/dossier-access';
import { withAIRateLimit } from '@/lib/middleware/rate-limit';
import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const requestSchema = z.object({ dossierId: z.string().trim().min(1).max(128) }).strict();
const analysisSchema = z.object({
  adverseParty: z.string().trim().max(500).nullable(),
  juridiction: z.string().trim().max(300).nullable(),
  objet: z.string().trim().max(1_000),
  dateDecision: z.string().trim().max(100).nullable(),
  dateNotification: z.string().trim().max(100).nullable(),
  delaiLegal: z.string().trim().max(300).nullable(),
  baseLegale: z.string().trim().max(2_000).nullable(),
  faits: z.array(z.object({ titre: z.string().trim().max(300), contenu: z.string().trim().max(2_000) }).strict()).max(20),
  moyens: z.array(z.object({ titre: z.string().trim().max(300), contenu: z.string().trim().max(2_000) }).strict()).max(20),
  pointsContestes: z.array(z.object({
    titre: z.string().trim().max(300),
    citationDecision: z.string().trim().max(1_000).nullable(),
    observations: z.array(z.string().trim().max(1_000)).max(10),
  }).strict()).max(20),
  pieces: z.array(z.object({ numero: z.number().int().positive(), designation: z.string().trim().max(500) }).strict()).max(30),
  demandes: z.array(z.string().trim().max(1_000)).max(20),
}).strict();

export const POST = withAIRateLimit(async (req: NextRequest) => {
  const { user } = await auth();
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
  if (!user.tenantId) return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });

  const parsed = requestSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'Requête d’analyse invalide' }, { status: 400 });
  const { dossierId } = parsed.data;
  const access = await canAccessDossier({
    userId: user.id, tenantId: user.tenantId, role: user.role, groups: user.groups,
    dossierId, action: 'read',
  });
  if (!access.allowed) return NextResponse.json({ error: 'Dossier non trouvé' }, { status: 404 });

  const dossier = await prisma.dossier.findFirst({
    where: { id: dossierId, tenantId: user.tenantId },
    select: {
      numero: true, typeDossier: true, objet: true, description: true, juridiction: true, createdAt: true,
      Email: { select: { createdAt: true, subject: true, body: true }, orderBy: { createdAt: 'desc' }, take: 10 },
      Document: { select: { originalName: true, filename: true, category: true }, take: 20 },
      LegalDeadline: { select: { title: true, type: true, dueDate: true } },
    },
  });
  if (!dossier) return NextResponse.json({ error: 'Dossier non trouvé' }, { status: 404 });

  const emails = dossier.Email.map(email =>
    `[${email.createdAt.toLocaleDateString('fr-FR')}] Objet : ${email.subject || 'Sans objet'}\n${(email.body || '').slice(0, 300)}`
  ).join('\n');
  const documents = dossier.Document.map((document, index) =>
    `Pièce ${index + 1} : ${document.originalName || document.filename} (${document.category || 'non classé'})`
  ).join('\n');
  const deadlines = dossier.LegalDeadline.map(deadline =>
    `Échéance : ${deadline.title || deadline.type} — ${deadline.dueDate.toLocaleDateString('fr-FR')}`
  ).join('\n');

  try {
    const result = await hybridAI.generateWithCostControl(
      `Tu es un assistant juridique. Analyse ce dossier et fournis une aide préparatoire pour un mémoire.
N'inclus aucune adresse, coordonnée, identité de personne ni élément non vérifié.

DOSSIER :
- Numéro : ${dossier.numero}
- Type : ${dossier.typeDossier}
- Objet : ${dossier.objet || 'Non précisé'}
- Juridiction : ${dossier.juridiction || 'Non précisée'}
- Date d'ouverture : ${dossier.createdAt.toLocaleDateString('fr-FR')}

EMAILS :
${emails || 'Aucun email'}

DOCUMENTS :
${documents || 'Aucun document'}

ÉCHÉANCES :
${deadlines || 'Aucune'}

Retourne uniquement ce JSON :
{"adverseParty":"partie adverse ou null","juridiction":"juridiction ou null","objet":"objet","dateDecision":"date ou null","dateNotification":"date ou null","delaiLegal":"délai ou null","baseLegale":"textes ou null","faits":[{"titre":"titre","contenu":"contenu"}],"moyens":[{"titre":"titre","contenu":"contenu"}],"pointsContestes":[{"titre":"titre","citationDecision":"citation ou null","observations":["observation"]}],"pieces":[{"numero":1,"designation":"désignation"}],"demandes":["demande"]}`,
      user.tenantId
    );
    const jsonMatch = result.response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('Réponse IA non structurée');
    const analysis = analysisSchema.safeParse(JSON.parse(jsonMatch[0]));
    if (!analysis.success) throw new Error('Réponse IA invalide');
    return NextResponse.json({ ...analysis.data, requiresHumanReview: true });
  } catch {
    return NextResponse.json(buildFallbackAnalysis(dossier));
  }
});

function buildFallbackAnalysis(dossier: {
  numero: string; typeDossier: string; objet: string | null; description: string | null;
  juridiction: string | null; createdAt: Date;
  Document: Array<{ originalName: string; filename: string }>;
}) {
  return {
    _fallback: true, adverseParty: null, juridiction: dossier.juridiction || 'Tribunal administratif',
    objet: dossier.objet || dossier.description || `Recours — dossier ${dossier.numero}`,
    dateDecision: null, dateNotification: null, delaiLegal: null, baseLegale: null,
    faits: [{ titre: 'Contexte', contenu: `Dossier ${dossier.typeDossier} ouvert le ${dossier.createdAt.toLocaleDateString('fr-FR')}.` }],
    moyens: [{ titre: 'À compléter', contenu: 'L’analyse automatisée est indisponible. Rédigez les moyens après vérification.' }],
    pointsContestes: [],
    pieces: dossier.Document.map((document, index) => ({ numero: index + 1, designation: document.originalName || document.filename })),
    demandes: ['Déterminer les demandes après vérification du dossier.'],
    requiresHumanReview: true,
  };
}
