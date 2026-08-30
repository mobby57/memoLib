import { legalProofService } from '@/lib/services/legal-proof.service';
import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/legal/proof/verify
 *
 * Vérifier l'intégrité d'une preuve légale
 *
 * Body:
 * {
 *   "proofId": "proof_123"
 * }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { proofId } = body;

    if (!proofId) {
      return NextResponse.json({ error: 'proofId is required' }, { status: 400 });
    }

    // Vérifier la preuve
    const verification = await legalProofService.verifyProof(proofId);

    return NextResponse.json({
      success: true,
      verification: {
        isValid: verification.isValid,
        verifiedAt: verification.verifiedAt,
        details: verification.details,
        errors: verification.errors,
        warnings: verification.warnings,
      },
    });
  } catch (error: any) {
    console.error('Error verifying legal proof:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to verify legal proof' },
      { status: 500 }
    );
  }
}
