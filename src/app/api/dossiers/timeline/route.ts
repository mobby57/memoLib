import { getServerSessionCompat } from '@/lib/auth/getServerSessionCompat';
import { NextRequest, NextResponse } from 'next/server';
import { getSecurePrisma } from '@/lib/prisma';;
interface TimelineEvent {
  date: string;
  type: 'email_recu' | 'email_envoye' | 'document' | 'deadline' | 'action' | 'creation';
  title: string;
  description: string;
  source: string;
  importance: 'haute' | 'moyenne' | 'basse';
}

export async function GET(req: NextRequest) {
  const prisma = await getSecurePrisma();
  const session = await getServerSessionCompat();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const tenantId = (session.user as any).tenantId;
  const dossierId = req.nextUrl.searchParams.get('dossierId');
  if (!dossierId || !tenantId) return NextResponse.json({ error: 'dossierId requis' }, { status: 400 });

  // VÃ©rifier accÃ¨s au dossier
  const dossier = await prisma.dossier.findFirst({
    where: { id: dossierId, tenantId },
    include: { client: true },
  });
  if (!dossier) return NextResponse.json({ error: 'Dossier non trouvÃ©' }, { status: 404 });

  // RÃ©cupÃ©rer tous les Ã©vÃ©nements liÃ©s
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

  // CrÃ©ation du dossier
  timeline.push({
    date: (dossier.createdAt as Date).toISOString(),
    type: 'creation',
    title: `Dossier ${dossier.numero} ouvert`,
    description: `Type: ${dossier.type} â€” Client: ${(dossier.client as any)?.nom || 'N/A'}`,
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
      description: isIncoming ? `De: ${email.from || 'inconnu'}` : `EnvoyÃ© Ã : ${email.from || 'client'}`,
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
      description: `Statut: ${dl.status} â€” Type: ${dl.type}`,
      source: 'deadline',
      importance: 'haute',
    });
  }

  // Trier par date
  timeline.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  return NextResponse.json({
    dossierId,
    numero: dossier.numero,
    client: (dossier.client as any)?.nom,
    totalEvents: timeline.length,
    timeline,
  });
}

