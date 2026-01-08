/**
 * Advanced Security System - Unified Export
 * 
 * Complete security suite for IA Poste Manager:
 * 1. Encryption - AES-256-GCM for sensitive data
 * 2. Audit Trail - RGPD compliant logging
 * 3. Rate Limiting - DDoS protection
 * 4. 2FA - Two-factor authentication
 * 5. Backups - Encrypted automated backups
 */

export * from './encryption'
export * from './audit-trail'
export * from './rate-limiter'
export * from './two-factor-auth'
export * from './backup-system'

// Security configuration
export const SECURITY_CONFIG = {
  encryption: {
    enabled: true,
    algorithm: 'aes-256-gcm',
  },
  auditTrail: {
    enabled: true,
    retentionDays: 365,
  },
  rateLimit: {
    enabled: true,
    adaptive: true,
  },
  twoFactor: {
    enforceForAdmins: true,
    backupCodesCount: 10,
  },
  backup: {
    enabled: true,
    schedule: '2:00', // Daily at 2 AM
    retentionDays: 30,
    encryption: true,
  },
} as const
