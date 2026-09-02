import { auth } from '@/lib/clerk-auth';
// CLERK-MIGRATION: Remplacement user -> user (vérifier)
// CLERK-MIGRATION: Remplacement auth() -> auth()
// CLERK-MIGRATION: Remplacement user -> user (vérifier)
// CLERK-MIGRATION: Remplacement auth() -> auth()
/**
 * API Route : GET /api/dossiers/export?dossierId=xxx
 * 
 * Exporte un dossier complet en PDF pour audience.
 * Inclut : page de garde, chronologie, pièces, audit trail.
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateDossierPDF, type DossierExportData } from '@/lib/documents/dossier-pdf-export';

export async function GET(req: NextRequest) {
  const { user } = await auth();
    const session = user ? { user } : null;
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const tenantId = user.tenantId;
  const role = user.role?.toUpperCase();

  // Seuls les avocats/admins peuvent exporter
  if (['CLIENT'].includes(role)) {
    return NextResponse.json({ error: 'Export réservé aux avocats' }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const dossierId = searchParams.get('dossierId');

  if (!dossierId) {
    return NextResponse.json({ error: 'dossierId requis' }, { status: 400 });
  }

  // Charger le dossier avec toutes les relations
  const dossier = await prisma.dossier.findFirst({
    where: { id: dossierId, tenantId },
    include: {
      client: true,
      Document: { orderBy: { createdAt: 'asc' } },
      LegalDeadline: { orderBy: { dueDate: 'asc' } },
      Email: { orderBy: { createdAt: 'asc' }, take: 50 },
    },
  });

  if (!dossier) {
    return NextResponse.json({ error: 'Dossier introuvable' }, { status: 404 });
  }

  // Charger l'audit trail
  const auditLogs = await prisma.auditLog.findMany({
    where: {
      tenantId,
      entityId: dossierId,
    },
    orderBy: { createdAt: 'asc' },
    take: 100,
  });

  // Construire les données d'export
  const client = dossier.client as any;
  const exportData: DossierExportData = {
    numero: dossier.numero,
    typeDossier: dossier.typeDossier,
    statut: dossier.statut,
    priorite: dossier.priorite,
    juridiction: dossier.juridiction || undefined,
    objet: dossier.objet || dossier.description || undefined,

    client: {
      nom: client?.lastName || '',
      prenom: client?.firstName || '',
      email: client?.email,
      telephone: client?.phone || undefined,
      adresse: client?.address || undefined,
      nationalite: client?.nationality || undefined,
      dateNaissance: client?.dateOfBirth ? new Date(client.dateOfBirth).toLocaleDateString('fr-FR') : undefined,
    },

    avocat: {
      nom: user.name || 'Maître',
      cabinet: undefined,
      barreau: undefined,
    },

    dateOuverture: dossier.dateOuverture
      ? new Date(dossier.dateOuverture).toLocaleDateString('fr-FR')
      : new Date(dossier.createdAt).toLocaleDateString('fr-FR'),
    dateEcheance: dossier.dateEcheance
      ? new Date(dossier.dateEcheance).toLocaleDateString('fr-FR')
      : undefined,
    dateCloture: dossier.dateCloture
      ? new Date(dossier.dateCloture).toLocaleDateString('fr-FR')
      : undefined,

    documents: (dossier.Document || []).map((d: any) => ({
      id: d.id,
      nom: d.originalName || d.filename,
      categorie: d.category || undefined,
      date: new Date(d.createdAt).toLocaleDateString('fr-FR'),
      hash: d.sha256 || undefined,
    })),

    timeline: [
      // Emails comme événements
      ...(dossier.Email || []).map((e: any) => ({
        date: new Date(e.createdAt).toLocaleDateString('fr-FR'),
        action: `Email ${e.direction === 'INBOUND' ? 'reçu' : 'envoyé'}`,
        auteur: e.from || 'Système',
        details: e.subject || '',
      })),
      // Documents comme événements
      ...(dossier.Document || []).map((d: any) => ({
        date: new Date(d.createdAt).toLocaleDateString('fr-FR'),
        action: 'Document ajouté',
        auteur: 'Avocat',
        details: d.originalName || d.filename,
      })),
    ].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),

    echeances: (dossier.LegalDeadline || []).map((dl: any) => ({
      label: dl.title || dl.type,
      date: new Date(dl.dueDate).toLocaleDateString('fr-FR'),
      statut: dl.status || 'PENDING',
    })),

    auditTrail: auditLogs.map((log: any) => ({
      action: log.action,
      date: new Date(log.createdAt).toLocaleDateString('fr-FR', {
        day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
      }),
      utilisateur: log.userEmail || log.userId,
      hash: log.id, // L'ID AuditLog fait partie de la chain
    })),

    exportDate: new Date().toLocaleDateString('fr-FR', {
      day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit',
    }),
    exportBy: user.name || user.email,
  };

  // Générer le PDF
  const pdf = generateDossierPDF(exportData);
  const pdfBuffer = Buffer.from(pdf.output('arraybuffer'));

  const filename = `Dossier_${dossier.numero.replace(/[^a-zA-Z0-9-]/g, '_')}_export.pdf`;

  return new NextResponse(new Uint8Array(pdfBuffer), {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': pdfBuffer.length.toString(),
    },
  });
}




