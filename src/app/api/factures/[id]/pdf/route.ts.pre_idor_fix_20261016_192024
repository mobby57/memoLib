import { auth } from '@/lib/clerk-auth';
/**
 * GET /api/factures/[id]/pdf — Génère et retourne le PDF d'une facture
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateFacturePDF } from '@/lib/services/facture-pdf.service';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user } = await auth();
    const session = user ? { user } : null;
    if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

    const tenantId = (user as any).tenantId;
    if (!tenantId) return NextResponse.json({ error: 'Tenant requis' }, { status: 403 });

    const { id } = await params;

    const facture = await prisma.facture.findFirst({
      where: { id, tenantId },
      include: {
        client: { select: { firstName: true, lastName: true, email: true, address: true } },
        lignes: { orderBy: { ordre: 'asc' } },
      },
    });

    if (!facture) return NextResponse.json({ error: 'Facture non trouvée' }, { status: 404 });

    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { name: true, billingAddress: true, vatNumber: true },
    });

    const pdfBuffer = generateFacturePDF({
      numero: facture.numero,
      dateEmission: facture.dateEmission.toISOString(),
      dateEcheance: facture.dateEcheance.toISOString(),
      client: {
        firstName: facture.client.firstName,
        lastName: facture.client.lastName,
        email: facture.client.email,
        address: facture.client.address || undefined,
      },
      cabinet: {
        name: tenant?.name || 'Cabinet',
        address: tenant?.billingAddress || undefined,
        siret: tenant?.vatNumber || undefined,
      },
      lignes: facture.lignes.map(l => ({
        description: l.description,
        quantite: l.quantite,
        prixUnitaire: l.prixUnitaire,
        montantHT: l.montantHT,
      })),
      montantHT: facture.montantHT,
      tauxTVA: facture.tauxTVA,
      montantTVA: facture.montantTVA,
      montantTTC: facture.montantTTC,
      notes: facture.notes || undefined,
      conditions: facture.conditions || undefined,
    });

    return new NextResponse(pdfBuffer as unknown as BodyInit, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="facture-${facture.numero}.pdf"`,
      },
    });
  } catch (error) {
    console.error('[FACTURES] PDF error:', error);
    return NextResponse.json({ error: 'Erreur génération PDF' }, { status: 500 });
  }
}
