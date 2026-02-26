import { legalProofService } from '@/lib/services/legal-proof.service';
import { ProofFormat } from '@/types/legal-proof';
import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/legal/proof/export
 *
 * Exporter une preuve légale dans différents formats
 *
 * Body:
 * {
 *   "proofId": "proof_123",
 *   "format": "PDF",
 *   "includeAuditTrail": true,
 *   "includeSignatures": true,
 *   "watermark": "CONFIDENTIEL",
 *   "language": "fr"
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
      proofId,
      format = ProofFormat.PDF,
      includeAuditTrail = true,
      includeSignatures = true,
      watermark,
      language = 'fr',
    } = body;

    if (!proofId) {
      return NextResponse.json({ error: 'proofId is required' }, { status: 400 });
    }

    // Exporter la preuve
    const buffer = await legalProofService.exportProof(proofId, {
      format,
      includeAuditTrail,
      includeSignatures,
      watermark,
      language,
    });

    // Déterminer le Content-Type
    const contentTypes: Record<ProofFormat, string> = {
      JSON: 'application/json',
      PDF: 'application/pdf',
      XML: 'application/xml',
      BLOCKCHAIN: 'text/plain',
    };

    // Déterminer l'extension
    const extensions: Record<ProofFormat, string> = {
      JSON: 'json',
      PDF: 'pdf',
      XML: 'xml',
      BLOCKCHAIN: 'txt',
    };

    const contentType = contentTypes[format] || 'application/octet-stream';
    const extension = extensions[format] || 'bin';
    const filename = `legal-proof-${proofId}.${extension}`;

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  } catch (error: any) {
    console.error('Error exporting legal proof:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to export legal proof' },
      { status: 500 }
    );
  }
}
