/**
 * API Routes — Portail Client : Partages de documents
 * 
 * POST /api/client-portal/shares         — Avocat partage un document au client
 * GET  /api/client-portal/shares         — Liste les partages (avocat: par dossier, client: ses partages)
 * PATCH /api/client-portal/shares        — Client: acknowledge/sign | Avocat: revoke
 */

import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { clientShareService } from '@/lib/services/client-share.service';

// ─── POST : Partager un document ────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const user = session.user as any;
  const tenantId = user.tenantId;
  const role = user.role?.toUpperCase();

  // Seuls AVOCAT, ADMIN, SUPER_ADMIN, COLLABORATEUR peuvent partager
  if (!['AVOCAT', 'ADMIN', 'SUPER_ADMIN', 'COLLABORATEUR', 'ASSOCIE'].includes(role)) {
    return NextResponse.json({ error: 'Seuls les avocats peuvent partager des documents' }, { status: 403 });
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'JSON invalide' }, { status: 400 });
  }

  const { documentId, dossierId, clientUserId, title, message, requiresAcknowledgment, requiresSignature, expiresAt, confidentialityLevel } = body;

  if (!dossierId || !clientUserId || !title) {
    return NextResponse.json({ error: 'dossierId, clientUserId et title requis' }, { status: 400 });
  }

  try {
    const share = await clientShareService.shareDocument({
      tenantId,
      documentId,
      dossierId,
      clientUserId,
      sharedByUserId: user.id,
      title,
      message,
      requiresAcknowledgment: requiresAcknowledgment ?? false,
      requiresSignature: requiresSignature ?? false,
      expiresAt: expiresAt ? new Date(expiresAt) : undefined,
      confidentialityLevel: confidentialityLevel || 'standard',
    });

    return NextResponse.json({ success: true, share }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// ─── GET : Lister les partages ──────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const user = session.user as any;
  const tenantId = user.tenantId;
  const role = user.role?.toUpperCase();

  const { searchParams } = new URL(req.url);
  const dossierId = searchParams.get('dossierId');

  try {
    if (role === 'CLIENT') {
      // Vue client : ses propres partages
      const shares = await clientShareService.listForClient(user.id);
      return NextResponse.json({ shares });
    } else {
      // Vue avocat : partages d'un dossier
      if (!dossierId) {
        return NextResponse.json({ error: 'dossierId requis pour la vue avocat' }, { status: 400 });
      }
      const shares = await clientShareService.listByDossier(tenantId, dossierId);
      return NextResponse.json({ shares });
    }
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// ─── PATCH : Actions sur un partage ─────────────────────────────────────────────

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const user = session.user as any;
  const role = user.role?.toUpperCase();
  const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
  const userAgent = req.headers.get('user-agent') || 'unknown';

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'JSON invalide' }, { status: 400 });
  }

  const { shareId, action } = body;
  if (!shareId || !action) {
    return NextResponse.json({ error: 'shareId et action requis' }, { status: 400 });
  }

  try {
    switch (action) {
      case 'view': {
        // Client consulte le document
        await clientShareService.recordView({
          shareId,
          viewedAt: new Date(),
          ipAddress: ip,
          userAgent,
          clientUserId: user.id,
        });
        return NextResponse.json({ success: true, action: 'viewed' });
      }

      case 'acknowledge': {
        // Client accuse réception
        if (role !== 'CLIENT') {
          return NextResponse.json({ error: 'Seul le client peut accuser réception' }, { status: 403 });
        }
        await clientShareService.acknowledge(shareId, user.id, ip);
        return NextResponse.json({ success: true, action: 'acknowledged' });
      }

      case 'sign': {
        // Client signe
        if (role !== 'CLIENT') {
          return NextResponse.json({ error: 'Seul le client peut signer' }, { status: 403 });
        }
        const { consentText } = body;
        if (!consentText) {
          return NextResponse.json({ error: 'consentText requis pour signer' }, { status: 400 });
        }
        const signatureHash = await clientShareService.sign(shareId, {
          shareId,
          signedAt: new Date(),
          signedByUserId: user.id,
          signedByName: user.name || '',
          signedByEmail: user.email || '',
          ipAddress: ip,
          userAgent,
          consentText,
        });
        return NextResponse.json({ success: true, action: 'signed', signatureHash });
      }

      case 'revoke': {
        // Avocat révoque le partage
        if (role === 'CLIENT') {
          return NextResponse.json({ error: 'Seul l\'avocat peut révoquer' }, { status: 403 });
        }
        const { reason } = body;
        await clientShareService.revoke(shareId, user.id, reason || 'Révoqué par l\'avocat');
        return NextResponse.json({ success: true, action: 'revoked' });
      }

      case 'export_proof': {
        // Avocat exporte le bundle de preuve
        if (role === 'CLIENT') {
          return NextResponse.json({ error: 'Export réservé aux avocats' }, { status: 403 });
        }
        const bundle = await clientShareService.exportProofBundle(shareId, user.tenantId);
        return NextResponse.json({ success: true, proof: bundle });
      }

      default:
        return NextResponse.json({ error: `Action inconnue: ${action}` }, { status: 400 });
    }
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
