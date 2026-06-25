import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/ai/copilot/daily-actions
 * Agrège toutes les actions prioritaires du jour pour le "Chef de Cabinet"
 */
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

  const user = session.user as any;
  const tenantId = user.tenantId;
  if (!tenantId) return NextResponse.json({ error: 'Pas de tenant' }, { status: 400 });

  const now = new Date();
  const in7days = new Date(now.getTime() + 7 * 86400000);
  const in3days = new Date(now.getTime() + 3 * 86400000);
  const fiveDaysAgo = new Date(now.getTime() - 5 * 86400000);

  const [deadlines, incompleteDossiers, staleDossiers, newEmails] = await Promise.all([
    // Délais critiques (< 7 jours)
    prisma.legalDeadline.findMany({
      where: { dossier: { tenantId }, status: 'PENDING', dueDate: { lte: in7days, gte: now } },
      include: { dossier: { select: { id: true, numero: true, typeDossier: true } } },
      orderBy: { dueDate: 'asc' },
      take: 10,
    }),
    // Dossiers incomplets (checklist non complète)
    prisma.dossier.findMany({
      where: { tenantId, statut: { not: 'cloture' }, checklistComplete: false, checklistTotal: { gt: 0 } },
      select: { id: true, numero: true, typeDossier: true, checklistComplete: true, checklistTotal: true },
      take: 10,
    }),
    // Dossiers sans activité > 5 jours (relances)
    prisma.dossier.findMany({
      where: {
        tenantId,
        statut: 'en_cours',
        updatedAt: { lt: fiveDaysAgo },
      },
      select: { id: true, numero: true, typeDossier: true, updatedAt: true, client: { select: { firstName: true, lastName: true } } },
      take: 10,
    }),
    // Emails non traités
    prisma.email.count({
      where: { tenantId, isProcessed: false },
    }),
  ]);

  const actions: any[] = [];

  // Deadlines → actions critiques
  deadlines.forEach((dl) => {
    const days = Math.ceil((new Date(dl.dueDate).getTime() - now.getTime()) / 86400000);
    actions.push({
      id: `dl_${dl.id}`,
      type: 'deadline',
      priority: days <= 3 ? 'critical' : 'high',
      title: `${dl.dossier.numero} — ${dl.label}`,
      subtitle: `Échéance dans ${days} jour${days > 1 ? 's' : ''}`,
      href: `/dossiers/${dl.dossier.id}`,
      dossierId: dl.dossier.id,
    });
  });

  // Dossiers incomplets
  incompleteDossiers.forEach((d) => {
    actions.push({
      id: `inc_${d.id}`,
      type: 'incomplete',
      priority: 'medium',
      title: `${d.numero} — Dossier incomplet`,
      subtitle: `Pièces manquantes à compléter`,
      href: `/dossiers/${d.id}`,
      dossierId: d.id,
    });
  });

  // Relances
  staleDossiers.forEach((d) => {
    const daysSince = Math.ceil((now.getTime() - new Date(d.updatedAt).getTime()) / 86400000);
    const clientName = d.client ? `${d.client.firstName} ${d.client.lastName}` : 'Client';
    actions.push({
      id: `rel_${d.id}`,
      type: 'relance',
      priority: daysSince > 14 ? 'high' : 'medium',
      title: `Relancer ${clientName}`,
      subtitle: `${d.numero} — sans activité depuis ${daysSince}j`,
      href: `/dossiers/${d.id}`,
      dossierId: d.id,
    });
  });

  // Trier par priorité
  const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
  actions.sort((a, b) => priorityOrder[a.priority as keyof typeof priorityOrder] - priorityOrder[b.priority as keyof typeof priorityOrder]);

  const hour = now.getHours();
  const greeting = hour < 12 ? 'Bonjour' : hour < 18 ? 'Bon après-midi' : 'Bonsoir';

  return NextResponse.json({
    greeting,
    date: now.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' }),
    counts: {
      critical: deadlines.filter(dl => (new Date(dl.dueDate).getTime() - now.getTime()) < 3 * 86400000).length,
      incomplete: incompleteDossiers.length,
      relance: staleDossiers.length,
      emails: newEmails,
    },
    actions: actions.slice(0, 20),
  });
}
