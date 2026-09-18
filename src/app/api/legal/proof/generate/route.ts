import { auth } from '@/lib/clerk-auth';
import { legalProofService } from '@/lib/services/legal-proof.service';
import { ProofType } from '@/types/legal-proof';
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
    const { user } = await auth();
    const session = user ? { user } : null;
    if (!user) {
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
      tenantId: (user as any).tenantId || 'default',
      entityId,
      entityType,
      createdBy: user.email || 'unknown',
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




