import { NextRequest } from 'next/server';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { GET, POST, PATCH } from '@/app/api/proofs/route';
import prisma from '@/lib/prisma';

const mockTenantId = 'tenant-123';

const { mockAuth } = vi.hoisted(() => ({
  mockAuth: vi.fn(),
}));

vi.mock('@/lib/clerk-auth', () => ({
  auth: mockAuth,
}));

vi.mock('@/lib/prisma', () => ({
  __esModule: true,
  default: {
    proof: {
      findMany: vi.fn(),
      count: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  },
}));

describe('/api/proofs', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockAuth.mockResolvedValue({
      isAuthenticated: true,
      clerkUserId: 'clerk-user-123',
      orgId: 'org-123',
      user: {
        id: 'user-123',
        role: 'ADMIN',
        tenantId: mockTenantId,
        email: 'user@test.com',
        name: 'Test User',
      },
    });
  });

  describe('GET', () => {
    it('should return proofs', async () => {
      const mockProofs = [{ id: '1', type: 'DOCUMENT_RECEPTION', status: 'PENDING_VALIDATION' }];
      (prisma.proof.findMany as any).mockResolvedValue(mockProofs);
      (prisma.proof.count as any).mockResolvedValue(1);

      const request = new NextRequest(`http://localhost/api/proofs`);
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.proofs).toEqual(mockProofs);
    });
  });

  describe('POST', () => {
    it('should create proof', async () => {
      const mockProof = { id: '1', type: 'DOCUMENT_RECEPTION' };
      (prisma.proof.findFirst as any).mockResolvedValue(null);
      (prisma.proof.create as any).mockResolvedValue(mockProof);

      const request = new NextRequest('http://localhost/api/proofs', {
        method: 'POST',
        body: JSON.stringify({
          type: 'DOCUMENT_RECEPTION',
          title: 'Test Proof',
          proofDate: '2024-01-15',
          capturedBy: 'user-1',
        }),
      });

      const response = await POST(request);
      expect(response.status).toBe(200);
    });
  });

  describe('PATCH', () => {
    it('should validate proof', async () => {
      (prisma.proof.findFirst as any).mockResolvedValue({ id: '1' });
      (prisma.proof.update as any).mockResolvedValue({ id: '1', status: 'VALIDATED' });

      const request = new NextRequest('http://localhost/api/proofs', {
        method: 'PATCH',
        body: JSON.stringify({
          proofId: '1',
          status: 'VALIDATED',
          validatedBy: 'user-1',
        }),
      });

      const response = await PATCH(request);
      expect(response.status).toBe(200);
    });
  });
});
