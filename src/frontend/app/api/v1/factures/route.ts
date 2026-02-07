import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/v1/factures
 * List invoices for tenant with filters
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user?.tenantId) {
      return NextResponse.json({ error: 'No tenant found' }, { status: 400 });
    }

    const { searchParams } = new URL(req.url);
    const statut = searchParams.get('statut');
    const clientId = searchParams.get('clientId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    const where: any = { tenantId: user.tenantId };
    if (statut) where.statut = statut;
    if (clientId) where.clientId = clientId;

    const [factures, total] = await Promise.all([
      prisma.facture.findMany({
        where,
        include: { client: true, lignes: true, paiements: true },
        skip,
        take: limit,
        orderBy: { dateEmission: 'desc' },
      }),
      prisma.facture.count({ where }),
    ]);

    return NextResponse.json({
      data: factures,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error('[GET /api/v1/factures]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/v1/factures
 * Create a new invoice
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user?.tenantId) {
      return NextResponse.json({ error: 'No tenant found' }, { status: 400 });
    }

    const body = await req.json();
    const { clientId, dossierId, numero, montantHT, tauxTVA, dateEcheance, lignes } = body;

    if (!clientId || !numero || !montantHT || !dateEcheance) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Create facture
    const montantTVA = montantHT * (tauxTVA / 100);
    const montantTTC = montantHT + montantTVA;

    const facture = await prisma.facture.create({
      data: {
        tenantId: user.tenantId,
        clientId,
        dossierId: dossierId || null,
        numero,
        montantHT,
        tauxTVA: tauxTVA || 20,
        montantTVA,
        montantTTC,
        dateEcheance: new Date(dateEcheance),
        dateEmission: new Date(),
        statut: 'brouillon',
        lignes: {
          create: lignes?.map((l: any) => ({
            description: l.description,
            quantite: l.quantite || 1,
            prixUnitaire: l.prixUnitaire,
            montantHT: l.montantHT,
          })) || [],
        },
      },
      include: { client: true, lignes: true },
    });

    // Log to audit
    await prisma.auditLog.create({
      data: {
        tenantId: user.tenantId,
        userId: user.id,
        userEmail: user.email,
        userRole: user.role,
        action: 'CREATE',
        entityType: 'facture',
        entityId: facture.id,
        newValue: JSON.stringify(facture),
        ipAddress: req.headers.get('x-forwarded-for') || '',
      },
    });

    return NextResponse.json(facture, { status: 201 });
  } catch (error) {
    console.error('[POST /api/v1/factures]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
