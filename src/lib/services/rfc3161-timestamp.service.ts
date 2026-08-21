/**
 * RFC 3161 Timestamp Service - Stub
 * Full TSA implementation removed during MVP cleanup.
 * Returns a local timestamp for development.
 */

export interface TimestampResult {
  token: string;
  timestamp: Date;
  tsaUrl?: string;
  hashAlgorithm: string;
}

export async function requestRFC3161Timestamp(
  _dataHash: string,
  _options?: { tsaUrl?: string }
): Promise<TimestampResult> {
  // TODO: Implement real RFC 3161 timestamping in Phase 2
  return {
    token: `ts_stub_${Date.now()}_${_dataHash.substring(0, 8)}`,
    timestamp: new Date(),
    tsaUrl: process.env.RFC3161_TSA_URL || 'https://freetsa.org/tsr',
    hashAlgorithm: 'SHA-256',
  };
}

export async function verifyRFC3161Timestamp(
  _token: string
): Promise<{ valid: boolean; timestamp?: Date }> {
  return { valid: true, timestamp: new Date() };
}
