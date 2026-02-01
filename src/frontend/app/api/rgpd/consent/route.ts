/**
 * RGPD Consent API (Phase 9)
 *
 * GET /api/rgpd/consent
 * - Liste consentements utilisateur
 *
 * POST /api/rgpd/consent
 * - Accorde nouveau consentement
 *
 * DELETE /api/rgpd/consent/[id]
 * - Révoque consentement
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { RGPDComplianceService } from '@/lib/services/rgpd-compliance.service';

const rgpdService = new RGPDComplianceService();

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const consents = await rgpdService.listUserConsents({
      userId: session.user.id,
      tenantId: session.user.tenantId || 'default',
    });

    return NextResponse.json({
      success: true,
      consents: consents.map(c => ({
        id: c.id,
        purpose: c.purpose,
        granted: c.granted,
        grantedAt: c.grantedAt,
        revokedAt: c.revokedAt,
        consentMethod: c.consentMethod,
        createdAt: c.createdAt,
      })),
    });
  } catch (error: any) {
    console.error('List consents error:', error);
    return NextResponse.json({ error: error.message || 'Erreur serveur' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const body = await req.json();
    const { purpose } = body;

    if (!purpose) {
      return NextResponse.json({ error: 'Purpose requis' }, { status: 400 });
    }

    const ipAddress =
      req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || undefined;
    const userAgent = req.headers.get('user-agent') || undefined;

    const consent = await rgpdService.grantConsent({
      userId: session.user.id,
      tenantId: session.user.tenantId || 'default',
      purpose,
      ipAddress,
      userAgent,
    });

    return NextResponse.json({
      success: true,
      consent: {
        id: consent.id,
        purpose: consent.purpose,
        granted: consent.granted,
        grantedAt: consent.grantedAt,
      },
    });
  } catch (error: any) {
    console.error('Grant consent error:', error);
    return NextResponse.json({ error: error.message || 'Erreur serveur' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const consentId = searchParams.get('consentId');

    if (!consentId) {
      return NextResponse.json({ error: 'consentId requis' }, { status: 400 });
    }

    const consent = await rgpdService.revokeConsent({
      consentId,
      userId: session.user.id,
      tenantId: session.user.tenantId || 'default',
    });

    return NextResponse.json({
      success: true,
      consent: {
        id: consent.id,
        purpose: consent.purpose,
        granted: consent.granted,
        revokedAt: consent.revokedAt,
      },
    });
  } catch (error: any) {
    console.error('Revoke consent error:', error);
    return NextResponse.json({ error: error.message || 'Erreur serveur' }, { status: 500 });
  }
}
