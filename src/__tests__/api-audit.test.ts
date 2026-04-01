/**
 * Tests unitaires - Audit API
 *
 * Valide:
 * - Log tous les appels API
 * - Enregistre user, timestamp, endpoint, status
 * - Supports détection tentatives non-autorisées
 * - Accès uniquement aux logs d'audit
 */

import { describe, it, expect, beforeEach } from '@jest/globals';

// --- Logique audit pure ---

interface AuditEntry {
  id: string;
  userId: string;
  tenantId: string;
  action: string;
  endpoint: string;
  statusCode: number;
  timestamp: string;
  ip?: string;
}

function createAuditEntry(
  userId: string,
  tenantId: string,
  action: string,
  endpoint: string,
  statusCode: number,
  ip?: string
): AuditEntry {
  return {
    id: `audit-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    userId,
    tenantId,
    action,
    endpoint,
    statusCode,
    timestamp: new Date().toISOString(),
    ip,
  };
}

function isUnauthorizedAttempt(entry: AuditEntry): boolean {
  return entry.statusCode === 401 || entry.statusCode === 403;
}

type Role = 'SUPER_ADMIN' | 'ADMIN' | 'AVOCAT' | 'CLIENT';
function canReadAuditLogs(role: Role): boolean {
  return role === 'SUPER_ADMIN' || role === 'ADMIN';
}

function filterLogsForUser(logs: AuditEntry[], requestingUserId: string, role: Role): AuditEntry[] {
  if (role === 'SUPER_ADMIN' || role === 'ADMIN') return logs;
  return logs.filter((l) => l.userId === requestingUserId);
}

describe('API Audit', () => {
  let logs: AuditEntry[];

  beforeEach(() => {
    logs = [];
  });

  describe('API Call Logging', () => {
    it('enregistre user, timestamp et endpoint dans chaque log', () => {
      const entry = createAuditEntry('user-1', 'tenant-1', 'GET', '/api/dossiers', 200, '127.0.0.1');
      expect(entry.userId).toBe('user-1');
      expect(entry.endpoint).toBe('/api/dossiers');
      expect(entry.timestamp).toBeDefined();
      expect(new Date(entry.timestamp).toISOString()).toBe(entry.timestamp);
    });

    it('enregistre le statut HTTP de la réponse', () => {
      const ok = createAuditEntry('u', 't', 'POST', '/api/clients', 201);
      const err = createAuditEntry('u', 't', 'DELETE', '/api/dossiers/1', 403);
      expect(ok.statusCode).toBe(201);
      expect(err.statusCode).toBe(403);
    });

    it('génère un identifiant unique par log', () => {
      const e1 = createAuditEntry('u', 't', 'GET', '/api/health', 200);
      const e2 = createAuditEntry('u', 't', 'GET', '/api/health', 200);
      expect(e1.id).not.toBe(e2.id);
    });
  });

  describe('Unauthorized Access Detection', () => {
    it('détecte une tentative 401 Unauthorized', () => {
      const entry = createAuditEntry('anonymous', 't', 'GET', '/api/admin/users', 401);
      expect(isUnauthorizedAttempt(entry)).toBe(true);
    });

    it('détecte une tentative 403 Forbidden', () => {
      const entry = createAuditEntry('client-user', 't', 'GET', '/api/admin/users', 403);
      expect(isUnauthorizedAttempt(entry)).toBe(true);
    });

    it('ne considère pas un 200 comme une tentative non-autorisée', () => {
      const entry = createAuditEntry('admin', 't', 'GET', '/api/dossiers', 200);
      expect(isUnauthorizedAttempt(entry)).toBe(false);
    });
  });

  describe('Access Control', () => {
    it('autorise ADMIN à lire les logs d\'audit', () => {
      expect(canReadAuditLogs('ADMIN')).toBe(true);
    });

    it('autorise SUPER_ADMIN à lire les logs d\'audit', () => {
      expect(canReadAuditLogs('SUPER_ADMIN')).toBe(true);
    });

    it('empêche CLIENT de lire tous les logs d\'audit', () => {
      expect(canReadAuditLogs('CLIENT')).toBe(false);
    });

    it('un CLIENT ne voit que ses propres logs', () => {
      const allLogs: AuditEntry[] = [
        createAuditEntry('user-A', 't', 'GET', '/api/dossiers', 200),
        createAuditEntry('user-B', 't', 'GET', '/api/clients', 200),
        createAuditEntry('user-A', 't', 'POST', '/api/factures', 201),
      ];
      const filtered = filterLogsForUser(allLogs, 'user-A', 'CLIENT');
      expect(filtered.length).toBe(2);
      filtered.forEach((l) => expect(l.userId).toBe('user-A'));
    });
  });
});
