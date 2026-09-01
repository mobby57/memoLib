import { auth } from '@/lib/clerk-auth';
// CLERK-MIGRATION: Remplacement user -> user (vérifier)
// CLERK-MIGRATION: Remplacement auth() -> auth()
// CLERK-MIGRATION: Remplacement user -> user (vérifier)
// CLERK-MIGRATION: Remplacement auth() -> auth()
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
interface TimelineEvent {
  date: string;
  type: 'email_recu' | 'email_envoye' | 'document' | 'deadline' | 'action' | 'creation';
  title: string;
  description: string;
  source: string;
  importance: 'haute' | 'moyenne' | 'basse';
}

export async function GET(req: NextRequest) {
  const { user } = await auth();
    const session = user ? { user } : null;
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const tenantId = (user as any).tenantId;
  const dossierId = req.nextUrl.searchParams.get('dossierId');
  if (!dossierId || !tenantId) return NextResponse.json({ error: 'dossierId requis' }, { status: 400 });

  // Vérifier accès au dossier
  const dossier = await prisma.dossier.findFirst({
    where: { id: dossierId, tenantId },
    include: { Client: true },
  });
  if (!dossier) return NextResponse.json({ error: 'Dossier non trouvé' }, { status: 404 });

  // Récupérer tous les événements liés
  const [emails, documents, deadlines] = await Promise.all([
    prisma.email.findMany({
      where: { dossierId, tenantId },
      orderBy: { createdAt: 'asc' },
      select: { id: true, subject: true, from: true, createdAt: true, direction: true },
    }),
    prisma.document.findMany({
      where: { dossierId, tenantId },
      orderBy: { createdAt: 'asc' },
      select: { id: true, title: true, type: true, createdAt: true, fileName: true },
    }),
    prisma.legalDeadline.findMany({
      where: { dossierId, tenantId },
      orderBy: { dueDate: 'asc' },
      select: { id: true, label: true, dueDate: true, status: true, type: true },
    }),
  ]);

  // Construire la timeline
  const timeline: TimelineEvent[] = [];

  // Création du dossier
  timeline.push({
    date: (dossier.createdAt as Date).toISOString(),
    type: 'creation',
    title: `Dossier ${dossier.numero} ouvert`,
    description: `Type: ${dossier.typeDossier} — Client: ${dossier.Client ? `${dossier.Client.firstName} ${dossier.Client.lastName}` : 'N/A'}`,
    source: 'system',
    importance: 'haute',
  });

  // Emails
  for (const email of emails) {
    const isIncoming = !email.direction || email.direction === 'INCOMING';
    timeline.push({
      date: (email.createdAt as Date).toISOString(),
      type: isIncoming ? 'email_recu' : 'email_envoye',
      title: email.subject || 'Sans objet',
      description: isIncoming ? `De: ${email.from || 'inconnu'}` : `Envoyé à: ${email.from || 'client'}`,
      source: 'email',
      importance: 'moyenne',
    });
  }

  // Documents
  for (const doc of documents) {
    timeline.push({
      date: (doc.createdAt as Date).toISOString(),
      type: 'document',
      title: doc.title || doc.fileName || 'Document',
      description: `Type: ${doc.type || 'autre'}`,
      source: 'document',
      importance: 'moyenne',
    });
  }

  // Deadlines
  for (const dl of deadlines) {
    timeline.push({
      date: (dl.dueDate as Date).toISOString(),
      type: 'deadline',
      title: dl.label,
      description: `Statut: ${dl.status} — Type: ${dl.type}`,
      source: 'deadline',
      importance: 'haute',
    });
  }

  // Trier par date
  timeline.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  return NextResponse.json({
    dossierId,
    numero: dossier.numero,
    client: dossier.Client ? `${dossier.Client.firstName} ${dossier.Client.lastName}` : undefined,
    totalEvents: timeline.length,
    timeline,
  });
}




