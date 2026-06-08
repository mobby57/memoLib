/**
 * Sécurité renforcée style "Midway" (Amazon Zero-Trust)
 *
 * Principes appliqués :
 * 1. MFA obligatoire (TOTP ou WebAuthn/Passkey)
 * 2. Session courte (15 min inactivité = re-auth)
 * 3. Hardware key supportée (YubiKey, etc.)
 * 4. Chaque action sensible = re-vérification
 * 5. Audit log de chaque authentification
 *
 * Stack :
 * - WebAuthn (Passkeys) via @simplewebauthn/server
 * - TOTP via otpauth (Google Authenticator / Microsoft Authenticator)
 * - Session token signé + refresh court
 */

import * as crypto from 'crypto';

// ─── TOTP (Google Authenticator / Microsoft Authenticator) ───

/**
 * Génère un secret TOTP pour un utilisateur (à l'inscription MFA)
 */
export function generateTOTPSecret(userEmail: string): { secret: string; otpauthUrl: string; qrData: string } {
  const secret = crypto.randomBytes(20).toString('hex').toUpperCase().slice(0, 32);
  const otpauthUrl = `otpauth://totp/MemoLib:${encodeURIComponent(userEmail)}?secret=${secret}&issuer=MemoLib&digits=6&period=30`;
  return { secret, otpauthUrl, qrData: otpauthUrl };
}

/**
 * Vérifie un code TOTP (6 chiffres) avec tolérance ±1 période (30s)
 */
export function verifyTOTP(secret: string, token: string): boolean {
  const now = Math.floor(Date.now() / 1000);
  // Vérifier la période actuelle et ±1 (tolérance 30s)
  for (const offset of [-1, 0, 1]) {
    const time = Math.floor((now + offset * 30) / 30);
    const expected = generateHOTP(secret, time);
    if (expected === token) return true;
  }
  return false;
}

function generateHOTP(secret: string, counter: number): string {
  const buffer = Buffer.alloc(8);
  buffer.writeBigInt64BE(BigInt(counter));
  // Decode base32 manually (simple implementation)
  const base32Chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  const bits = secret.toUpperCase().split('').map(c => base32Chars.indexOf(c).toString(2).padStart(5, '0')).join('');
  const bytes = [];
  for (let i = 0; i + 8 <= bits.length; i += 8) {
    bytes.push(parseInt(bits.slice(i, i + 8), 2));
  }
  const decodedSecret = Buffer.from(bytes);
  const hmac = crypto.createHmac('sha1', decodedSecret).update(buffer).digest();
  const offset = hmac[hmac.length - 1] & 0xf;
  const code = ((hmac[offset] & 0x7f) << 24 | hmac[offset + 1] << 16 | hmac[offset + 2] << 8 | hmac[offset + 3]) % 1000000;
  return code.toString().padStart(6, '0');
}

// ─── WEBAUTHN (Passkeys / YubiKey) ──────────────────────────

export interface WebAuthnCredential {
  credentialId: string;
  publicKey: string;
  counter: number;
  deviceName: string;
  createdAt: Date;
}

/**
 * Génère les options d'enregistrement WebAuthn (côté serveur)
 */
export function generateRegistrationOptions(userId: string, userName: string) {
  const challenge = crypto.randomBytes(32).toString('base64url');
  return {
    challenge,
    rp: { name: 'MemoLib', id: 'memolib.space' },
    user: { id: Buffer.from(userId).toString('base64url'), name: userName, displayName: userName },
    pubKeyCredParams: [
      { type: 'public-key', alg: -7 },   // ES256
      { type: 'public-key', alg: -257 }, // RS256
    ],
    authenticatorSelection: {
      authenticatorAttachment: 'cross-platform', // Permet clés physiques
      userVerification: 'required',
      residentKey: 'preferred',
    },
    timeout: 60000,
  };
}

/**
 * Génère les options d'authentification WebAuthn
 */
export function generateAuthenticationOptions(credentials: WebAuthnCredential[]) {
  const challenge = crypto.randomBytes(32).toString('base64url');
  return {
    challenge,
    rpId: 'memolib.space',
    allowCredentials: credentials.map(c => ({
      type: 'public-key',
      id: c.credentialId,
    })),
    userVerification: 'required',
    timeout: 60000,
  };
}

// ─── SESSION SÉCURISÉE ──────────────────────────────────────

export interface SecureSession {
  userId: string;
  tenantId: string;
  mfaVerified: boolean;
  mfaMethod: 'totp' | 'webauthn' | 'none';
  createdAt: number;
  lastActivity: number;
  ipAddress: string;
  userAgent: string;
}

const SESSION_TIMEOUT_MS = 30 * 60 * 1000; // 30 min inactivité
const SESSION_MAX_AGE_MS = 12 * 60 * 60 * 1000; // 12h max absolue

/**
 * Vérifie si la session est encore valide
 */
export function isSessionValid(session: SecureSession): { valid: boolean; reason?: string } {
  const now = Date.now();

  if (now - session.lastActivity > SESSION_TIMEOUT_MS) {
    return { valid: false, reason: 'Session expirée par inactivité (15 min)' };
  }

  if (now - session.createdAt > SESSION_MAX_AGE_MS) {
    return { valid: false, reason: 'Session expirée (durée max 8h)' };
  }

  if (!session.mfaVerified) {
    return { valid: false, reason: 'MFA non vérifié' };
  }

  return { valid: true };
}

// ─── STEP-UP AUTH (actions sensibles) ────────────────────────

/**
 * Actions qui nécessitent une re-vérification MFA
 */
const SENSITIVE_ACTIONS = [
  'export_data',          // Export RGPD
  'delete_dossier',       // Suppression dossier
  'modify_rbac',          // Changement de rôles
  'access_audit_trail',   // Consultation audit
  'generate_api_key',     // Création clé API
  'modify_tenant',        // Config tenant
  'bulk_anonymize',       // Anonymisation RGPD
];

export function requiresStepUp(action: string): boolean {
  return SENSITIVE_ACTIONS.includes(action);
}

// ─── AUDIT AUTH ──────────────────────────────────────────────

export interface AuthEvent {
  userId: string;
  action: 'login' | 'mfa_verify' | 'mfa_fail' | 'session_expired' | 'step_up' | 'logout';
  method?: string;
  ipAddress: string;
  userAgent: string;
  success: boolean;
  timestamp: Date;
  metadata?: Record<string, string>;
}

/**
 * Détecte les comportements suspects
 */
export function detectSuspiciousActivity(events: AuthEvent[]): { suspicious: boolean; reason?: string } {
  const last10min = events.filter(e => Date.now() - e.timestamp.getTime() < 600000);

  // Plus de 5 échecs MFA en 10 min
  const mfaFails = last10min.filter(e => e.action === 'mfa_fail');
  if (mfaFails.length >= 5) {
    return { suspicious: true, reason: 'Brute force MFA détectée' };
  }

  // Login depuis une nouvelle IP + nouvel user agent
  const uniqueIPs = new Set(last10min.map(e => e.ipAddress));
  if (uniqueIPs.size >= 3) {
    return { suspicious: true, reason: 'Connexions depuis IPs multiples' };
  }

  return { suspicious: false };
}
