import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';
import { Packer } from 'docx';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import {
  generateMemoireRecours,
  generateConclusions,
  generateRequeteIntroductive,
  generateNoteDelibere,
  generateMemoireComplementaire,
  DOCX_TEMPLATES,
  type MemoireRecoursVars,
  type ConclusionsVars,
  type RequeteIntroductiveVars,
  type NoteDelibereVars,
  type MemoireComplementaireVars,
} from '@/lib/documents/docx-generator';

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const user = session.user as any;
  const tenantId = user.tenantId;

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Corps invalide. JSON attendu.' }, { status: 400 });
  }

  const { templateType, dossierId, variables } = body;

  if (!templateType) {
    return NextResponse.json({
      error: 'templateType requis',
      available: DOCX_TEMPLATES.map((t) => ({ id: t.id, title: t.title, description: t.description })),
    }, { status: 400 });
  }

  const template = DOCX_TEMPLATES.find((t) => t.id === templateType);
  if (!template) {
    return NextResponse.json({
      error: `Template "${templateType}" inconnu`,
      available: DOCX_TEMPLATES.map((t) => ({ id: t.id, title: t.title })),
    }, { status: 400 });
  }

  // Auto-remplir depuis le dossier
  let dossierData: any = null;
  if (dossierId && tenantId) {
    dossierData = await prisma.dossier.findFirst({
      where: { id: dossierId, tenantId },
      include: { client: true },
    });
  }

  const vars = {
    date: new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }),
    lieu: 'Luxembourg',
    avocat: user.name || 'Maître',
    numeroDossier: dossierData?.numero || '',
    ...(dossierData?.client ? { requerantNom: (dossierData.client as any).nom || '' } : {}),
    ...variables,
  };

  let doc;
  try {
    switch (templateType) {
      case 'memoire_recours':
        doc = generateMemoireRecours(vars as MemoireRecoursVars);
        break;
      case 'conclusions':
        doc = generateConclusions(vars as ConclusionsVars);
        break;
      case 'requete_introductive':
        doc = generateRequeteIntroductive(vars as RequeteIntroductiveVars);
        break;
      case 'note_delibere':
        doc = generateNoteDelibere(vars as NoteDelibereVars);
        break;
      case 'memoire_complementaire':
        doc = generateMemoireComplementaire(vars as MemoireComplementaireVars);
        break;
      default:
        return NextResponse.json({ error: `Générateur non implémenté pour "${templateType}"` }, { status: 501 });
    }
  } catch (err: any) {
    return NextResponse.json({ error: 'Erreur génération', details: err.message }, { status: 500 });
  }

  const buffer = await Packer.toBuffer(doc);
  const uint8 = new Uint8Array(buffer);
  const filename = `${template.title.replace(/[^a-zA-ZÀ-ÿ0-9_-]/g, '_')}_${new Date().toISOString().slice(0, 10)}.docx`;

  return new NextResponse(uint8, {
    status: 200,
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': buffer.length.toString(),
    },
  });
}

export async function GET() {
  return NextResponse.json({
    templates: DOCX_TEMPLATES.map((t) => ({
      id: t.id,
      title: t.title,
      description: t.description,
      category: t.category,
      requiredVars: t.requiredVars,
      optionalVars: t.optionalVars,
    })),
  });
}
