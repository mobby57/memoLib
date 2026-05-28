import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * POST /api/webhooks/inbox
 * Recoit les emails envoyes a [dossier]@inbox.memolib.space
 * Classe automatiquement la piece et met a jour la checklist
 */
export async function POST(req: NextRequest) {
  const secret = req.headers.get('x-webhook-secret');
  if (secret !== (process.env.INBOX_WEBHOOK_SECRET || 'inbox-secret')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { to, from, subject, attachments, body } = await req.json();

  // Find dossier by inbox email
  const dossier = await prisma.dossier.findFirst({
    where: { inboxEmail: to },
    include: { checklistItems: true },
  });

  if (!dossier) {
    return NextResponse.json({ error: 'Dossier non trouve pour cet email' }, { status: 404 });
  }

  // Try to match attachment/subject to a checklist item
  const matchedItem = matchDocumentToChecklist(subject, attachments, dossier.checklistItems);

  if (matchedItem) {
    await prisma.dossierChecklistItem.update({
      where: { id: matchedItem.id },
      data: {
        status: 'received',
        receivedAt: new Date(),
        receivedVia: 'email',
        notes: `Recu de ${from} — ${subject}`,
      },
    });

    // Recalculate progress
    const allItems = await prisma.dossierChecklistItem.findMany({ where: { dossierId: dossier.id } });
    const received = allItems.filter(i => i.status === 'received' || i.status === 'validated').length;
    const requiredItems = allItems.filter(i => i.required);
    const requiredReceived = requiredItems.filter(i => i.status === 'received' || i.status === 'validated').length;
    const complete = requiredReceived === requiredItems.length;

    await prisma.dossier.update({
      where: { id: dossier.id },
      data: { checklistReceived: received, checklistComplete: complete },
    });

    return NextResponse.json({
      success: true,
      matched: matchedItem.label,
      progress: `${received}/${allItems.length}`,
      complete,
      message: complete ? 'DOSSIER COMPLET' : `Piece recue: ${matchedItem.label}`,
    });
  }

  return NextResponse.json({
    success: true,
    matched: null,
    message: 'Email recu mais aucune piece identifiee automatiquement. A classer manuellement.',
  });
}

/**
 * Tente de matcher un document recu avec un item de la checklist
 */
function matchDocumentToChecklist(subject: string, attachments: any[], items: any[]): any | null {
  const text = (subject || '').toLowerCase();
  const attachNames = (attachments || []).map((a: any) => (a.name || '').toLowerCase()).join(' ');
  const combined = `${text} ${attachNames}`;

  const keywords: Record<string, string[]> = {
    'passeport': ['passeport', 'passport', 'identite', 'id card'],
    'domicile': ['domicile', 'edf', 'electricite', 'quittance', 'loyer', 'hebergement'],
    'paie': ['paie', 'salaire', 'bulletin', 'fiche de paie'],
    'travail': ['contrat', 'travail', 'employeur', 'attestation employeur', 'cdi', 'cdd'],
    'imposition': ['imposition', 'impot', 'avis', 'fiscal'],
    'scolarite': ['scolarite', 'ecole', 'college', 'lycee', 'inscription'],
    'medical': ['medical', 'medecin', 'certificat medical', 'sante'],
    'naissance': ['naissance', 'acte de naissance', 'birth'],
    'mariage': ['mariage', 'acte de mariage'],
    'photo': ['photo', 'identite', 'portrait'],
    'oqtf': ['oqtf', 'obligation', 'quitter'],
    'recit': ['recit', 'vie', 'histoire', 'persecution'],
    'timbre': ['timbre', 'fiscal'],
    'assurance': ['assurance', 'maladie', 'securite sociale', 'cpam'],
    'casier': ['casier', 'judiciaire', 'criminal'],
    'diplome': ['diplome', 'b1', 'francais', 'delf', 'tcf'],
  };

  // Find missing items and try to match
  const missingItems = items.filter((i: any) => i.status === 'missing');

  for (const item of missingItems) {
    const itemLabel = item.label.toLowerCase();
    for (const [, kws] of Object.entries(keywords)) {
      if (kws.some(kw => itemLabel.includes(kw)) && kws.some(kw => combined.includes(kw))) {
        return item;
      }
    }
  }

  return null;
}
