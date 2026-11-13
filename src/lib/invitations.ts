import { createHash, randomBytes } from 'crypto';

export function generateInvitationToken() {
  const plainToken = randomBytes(32).toString('base64url');
  const tokenHash = createHash('sha256').update(plainToken).digest('hex');
  return { plainToken, tokenHash };
}

export function hashToken(token: string) {
  return createHash('sha256').update(token).digest('hex');
}
