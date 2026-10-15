import crypto from 'crypto';

const TTL_MS = 10 * 60 * 1000; // 10 minutes

// Read the secret when OAuth state is used, not at module import time.
// Next.js imports route modules during build, when runtime secrets may not exist.
function getSecret(): string {
  const secret = process.env.OAUTH_STATE_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error(
      "OAUTH_STATE_SECRET manquant ou trop court dans les variables d'environnement",
    );
  }
  return secret;
}

export interface OAuthStatePayload {
  tenantId: string;
  userId: string;
}

export function createOAuthState(payload: OAuthStatePayload): string {
  const body = {
    ...payload,
    iat: Date.now(),
    nonce: crypto.randomBytes(16).toString('hex'),
  };
  const bodyB64 = Buffer.from(JSON.stringify(body)).toString('base64url');
  const sig = crypto
    .createHmac('sha256', SECRET!)
    .update(bodyB64)
    .digest('base64url');
  return `${bodyB64}.${sig}`;
}

export function verifyOAuthState(state: string): OAuthStatePayload {
  const parts = state.split('.');
  if (parts.length !== 2) {
    throw new Error('state mal forme');
  }
  const [bodyB64, sigReceived] = parts;
  const sigExpected = crypto
    .createHmac('sha256', SECRET!)
    .update(bodyB64)
    .digest('base64url');
  if (
    sigReceived.length !== sigExpected.length ||
    !crypto.timingSafeEqual(
      Buffer.from(sigReceived),
      Buffer.from(sigExpected),
    )
  ) {
    throw new Error('signature invalide');
  }
  const decoded = JSON.parse(Buffer.from(bodyB64, 'base64url').toString());
  if (typeof decoded.iat !== 'number' || Date.now() - decoded.iat > TTL_MS) {
    throw new Error('state expire');
  }
  if (
    typeof decoded.tenantId !== 'string' ||
    typeof decoded.userId !== 'string'
  ) {
    throw new Error('payload invalide');
  }
  return { tenantId: decoded.tenantId, userId: decoded.userId };
}
