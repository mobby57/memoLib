import { legalProofService } from '@/lib/services/legal-proof.service';
import { ProofType } from '@/types/legal-proof';
import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/legal/proof/generate
 *
 * Générer une preuve légale pour une entité
 *
 * Body:
 * {
 *   "entityType": "dossier",
 *   "entityId": "dossier-123",
 *   "type": "DOCUMENT",
 *   "reason": "Preuve de réception du dossier",
 *   "jurisdiction": "FR",
 *   "includeTimestampAuthority": true,
 *   "signatures": [
 *     {
 *       "signerId": "user-123",
 *       "signerName": "Jean Dupont",
 *       "signerEmail": "jean@example.com",
 *       "type": "SIMPLE"
 *     }
 *   ]
 * }
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const {
      entityType,
      entityId,
      type = ProofType.DOCUMENT,
      reason,
      jurisdiction,
      includeTimestampAuthority = false,
      signatures = [],
    } = body;

    // Validation
    if (!entityType || !entityId) {
      return NextResponse.json({ error: 'entityType and entityId are required' }, { status: 400 });
    }

    // Générer la preuve
    const proof = await legalProofService.generateProofBundle({
      type,
      tenantId: (session.user as any).tenantId || 'default',
      entityId,
      entityType,
      createdBy: session.user.email || 'unknown',
      reason,
      jurisdiction,
      includeTimestampAuthority,
      signatures,
    });

    return NextResponse.json({
      success: true,
      proof: {
        id: proof.id,
        type: proof.type,
        documentHash: proof.documentHash,
        timestamp: proof.timestamp,
        proofHash: proof.proofHash,
        signaturesCount: proof.signatures.length,
        hasTimestampAuthority: !!proof.timestampAuthority,
        validationStatus: proof.validationStatus,
      },
    });
  } catch (error: any) {
    console.error('Error generating legal proof:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate legal proof' },
      { status: 500 }
    );
  }
}
