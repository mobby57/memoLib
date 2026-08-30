/**
 * eIDAS Signature Service - Stub
 * Full implementation (DocuSign, Adobe Sign, Yousign) removed during MVP cleanup.
 * Returns a placeholder signature for development.
 */

import { SignatureType, type DigitalSignature } from '@/types/legal-proof';

export interface EIDASSignatureRequest {
  documentHash: string;
  signerEmail: string;
  signerName: string;
  signatureType: string;
  reason?: string;
  metadata?: any;
}

export interface EIDASSignatureResult {
  signatureId: string;
  provider: string;
  level: string;
  signedAt: string;
  certificate?: string;
  signature: DigitalSignature;
}

export async function createEIDASSignature(
  request: EIDASSignatureRequest
): Promise<EIDASSignatureResult> {
  // TODO: Implement real eIDAS signing in Phase 2
  const sigType = (request.signatureType as SignatureType) || SignatureType.SIMPLE;

  return {
    signatureId: `sig_stub_${Date.now()}`,
    provider: 'stub',
    level: request.signatureType || 'simple',
    signedAt: new Date().toISOString(),
    signature: {
      signerId: `signer_${Date.now()}`,
      signerEmail: request.signerEmail,
      signerName: request.signerName,
      type: sigType,
      algorithm: 'RSA-SHA256',
      timestamp: new Date(),
      signatureHash: `hash_stub_${request.documentHash.substring(0, 8)}`,
    },
  };
}

export async function verifyEIDASSignature(
  _signatureId: string
): Promise<{ valid: boolean; details?: string }> {
  return { valid: true, details: 'Stub verification' };
}
