/**
 * Two-Factor Authentication (2FA) System
 * - TOTP (Time-based One-Time Password)
 * - QR code generation for authenticator apps
 * - Backup codes for account recovery
 * - Enforce 2FA for admins
 */

import crypto from 'crypto';
import { authenticator } from '@otplib/preset-default';
import QRCode from 'qrcode';

/**
 * Generate 2FA secret for user
 */
export function generate2FASecret(userEmail: string): {
  secret: string;
  qrCodeUrl: string;
} {
  const secret = authenticator.generateSecret();

  const otpauthUrl = authenticator.keyuri(userEmail, 'memoLib', secret);

  return {
    secret,
    qrCodeUrl: otpauthUrl,
  };
}

/**
 * Generate QR code image for 2FA setup
 */
export async function generateQRCode(otpauthUrl: string): Promise<string> {
  try {
    const qrCodeDataUrl = await QRCode.toDataURL(otpauthUrl);
    return qrCodeDataUrl;
  } catch (error) {
    console.error('[2FA] QR code generation failed:', error);
    throw new Error('Failed to generate QR code');
  }
}

/**
 * Verify 2FA token
 */
export function verify2FAToken(token: string, secret: string): boolean {
  try {
    return authenticator.verify({
      token,
      secret,
    });
  } catch (error) {
    console.error('[2FA] Token verification failed:', error);
    return false;
  }
}

/**
 * Generate backup codes for account recovery
 */
export function generateBackupCodes(count: number = 10): string[] {
  const codes: string[] = [];

  for (let i = 0; i < count; i++) {
    const code = crypto.randomBytes(4).toString('hex').toUpperCase();
    codes.push(code);
  }

  return codes;
}

/**
 * Hash backup code for storage
 */
export function hashBackupCode(code: string): string {
  return crypto.createHash('sha256').update(code).digest('hex');
}

/**
 * Verify backup code
 */
export function verifyBackupCode(providedCode: string, hashedCodes: string[]): boolean {
  const hashedProvided = hashBackupCode(providedCode);
  return hashedCodes.includes(hashedProvided);
}

/**
 * Check if 2FA is required for user role
 */
export function is2FARequired(userRole: string): boolean {
  return ['SUPER_ADMIN', 'ADMIN'].includes(userRole);
}

/**
 * 2FA setup flow for user
 */
export interface TwoFactorSetup {
  secret: string;
  qrCode: string;
  backupCodes: string[];
}

export async function setup2FA(userEmail: string): Promise<TwoFactorSetup> {
  const { secret, qrCodeUrl } = generate2FASecret(userEmail);
  const qrCode = await generateQRCode(qrCodeUrl);
  const backupCodes = generateBackupCodes();

  return {
    secret,
    qrCode,
    backupCodes,
  };
}

/**
 * Validate 2FA during login
 */
export async function validate2FALogin(
  userId: string,
  token: string,
  secret: string,
  backupCodes: string[]
): Promise<{ success: boolean; usedBackupCode?: boolean }> {
  // First try TOTP token
  if (verify2FAToken(token, secret)) {
    return { success: true };
  }

  // If TOTP fails, try backup code
  if (verifyBackupCode(token, backupCodes)) {
    // Mark backup code as used (remove from list)
    const hashedToken = hashBackupCode(token);
    const updatedCodes = backupCodes.filter(code => code !== hashedToken);

    // Update user's backup codes in database
    try {
      const { PrismaClient } = await import('@prisma/client');
      const prisma = new PrismaClient();
      await prisma.user.update({
        where: { id: userId },
        data: { backupCodes: updatedCodes },
      });
      await prisma.$disconnect();
    } catch (error) {
      console.error('[2FA] Failed to update backup codes:', error);
    }

    return { success: true, usedBackupCode: true };
  }

  return { success: false };
}

/**
 * Enforce 2FA for sensitive operations
 */
export function require2FA(userRole: string) {
  return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const session = args[0]?.session; // Assume first arg contains session

      if (is2FARequired(userRole) && !session?.user?.twoFactorVerified) {
        throw new Error('2FA verification required for this operation');
      }

      return originalMethod.apply(this, args);
    };

    return descriptor;
  };
}
