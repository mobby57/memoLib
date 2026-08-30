import { legalProofService } from '@/lib/services/legal-proof.service';
import { SignatureType } from '@/types/legal-proof';
import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/legal/proof/sign
 *
 * Ajouter une signature électronique à une preuve existante
 *
 * Body:
 * {
 *   "proofId": "proof_123",
 *   "signerName": "Marie Martin",
 *   "signerEmail": "marie@example.com",
 *   "type": "ADVANCED",
 *   "certificate": "-----BEGIN CERTIFICATE-----..."
 * }
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { proofId, signerName, signerEmail, type = SignatureType.SIMPLE, certificate } = body;

    // Validation
    if (!proofId || !signerName || !signerEmail) {
      return NextResponse.json(
        { error: 'proofId, signerName, and signerEmail are required' },
        { status: 400 }
      );
    }

    // Ajouter la signature
    const updatedProof = await legalProofService.addSignature(proofId, {
      signerId: session.user.email || 'unknown',
      signerName,
      signerEmail,
      type,
      certificate,
      algorithm: 'SHA-256',
    });

    return NextResponse.json({
      success: true,
      proof: {
        id: updatedProof.id,
        signaturesCount: updatedProof.signatures.length,
        lastSignature: updatedProof.signatures[updatedProof.signatures.length - 1],
      },
    });
  } catch (error: any) {
    console.error('Error signing legal proof:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to sign legal proof' },
      { status: 500 }
    );
  }
}
