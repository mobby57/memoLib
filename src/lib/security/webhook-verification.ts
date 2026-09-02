import crypto from 'crypto';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Verify webhook signature using HMAC-SHA256
 * Standard implementation (similar to Stripe, GitHub, etc.)
 */
export function verifyWebhookSignature(
  payload: string | Buffer,
  signature: string,
  secret: string,
  algorithm: string = 'sha256'
): boolean {
  try {
    const expectedSignature = crypto
      .createHmac(algorithm, secret)
      .update(payload)
      .digest('hex');

    // Use timing-safe comparison to prevent timing attacks
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  } catch {
    return false;
  }
}

/**
 * Verify webhook timestamp (prevent replay attacks)
 * Default: request must be less than 5 minutes old
 */
export function verifyWebhookTimestamp(
  timestamp: number | string,
  maxAgeSeconds: number = 5 * 60
): { valid: boolean; error?: string } {
  const ts = typeof timestamp === 'string' ? parseInt(timestamp, 10) : timestamp;

  if (isNaN(ts)) {
    return { valid: false, error: 'Invalid timestamp format' };
  }

  const ageSeconds = (Date.now() - ts * 1000) / 1000;

  if (ageSeconds < 0) {
    return { valid: false, error: 'Timestamp is in the future' };
  }

  if (ageSeconds > maxAgeSeconds) {
    return { valid: false, error: `Timestamp too old (${ageSeconds}s > ${maxAgeSeconds}s)` };
  }

  return { valid: true };
}

/**
 * Verify webhook with signature and timestamp
 * Returns error response if verification fails
 */
export function verifyWebhookRequest(
  req: NextRequest,
  payload: string | Buffer,
  secret: string,
  options: {
    signatureHeader?: string;
    timestampHeader?: string;
    maxAge?: number;
  } = {}
): { valid: true } | { valid: false; response: NextResponse } {
  const {
    signatureHeader = 'x-webhook-signature',
    timestampHeader = 'x-webhook-timestamp',
    maxAge = 5 * 60, // 5 minutes
  } = options;

  // Get signature from header
  const signature = req.headers.get(signatureHeader);
  if (!signature) {
    return {
      valid: false,
      response: NextResponse.json(
        { error: 'Missing webhook signature' },
        { status: 401 }
      ),
    };
  }

  // Get timestamp from header
  const timestamp = req.headers.get(timestampHeader);
  if (!timestamp) {
    return {
      valid: false,
      response: NextResponse.json(
        { error: 'Missing webhook timestamp' },
        { status: 401 }
      ),
    };
  }

  // Verify timestamp
  const timeVerify = verifyWebhookTimestamp(timestamp, maxAge);
  if (!timeVerify.valid) {
    return {
      valid: false,
      response: NextResponse.json(
        { error: timeVerify.error },
        { status: 401 }
      ),
    };
  }

  // Verify signature
  if (!verifyWebhookSignature(payload, signature, secret)) {
    return {
      valid: false,
      response: NextResponse.json(
        { error: 'Invalid webhook signature' },
        { status: 401 }
      ),
    };
  }

  return { valid: true };
}

/**
 * Generate webhook signature for testing/debugging
 */
export function generateWebhookSignature(
  payload: string | Buffer,
  secret: string,
  algorithm: string = 'sha256'
): string {
  return crypto
    .createHmac(algorithm, secret)
    .update(payload)
    .digest('hex');
}

/**
 * Generate webhook headers for outgoing requests
 */
export function generateWebhookHeaders(
  payload: string | Buffer,
  secret: string
): {
  'x-webhook-signature': string;
  'x-webhook-timestamp': string;
} {
  const timestamp = Math.floor(Date.now() / 1000);
  const signature = generateWebhookSignature(payload, secret);

  return {
    'x-webhook-signature': signature,
    'x-webhook-timestamp': timestamp.toString(),
  };
}
