import { NextRequest } from 'next/server';
import { GET, POST, PATCH } from '@/app/api/proofs/route';
import prisma from '@/lib/prisma';

jest.mock('@/lib/prisma');

describe('/api/proofs', () => {
  const mockTenantId = 'tenant-123';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET', () => {
    it('should return proofs', async () => {
      const mockProofs = [{ id: '1', type: 'DOCUMENT_RECEPTION', status: 'PENDING_VALIDATION' }];
      (prisma.proof.findMany as jest.Mock).mockResolvedValue(mockProofs);
      (prisma.proof.count as jest.Mock).mockResolvedValue(1);

      const request = new NextRequest(`http://localhost/api/proofs?tenantId=${mockTenantId}`);
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.proofs).toEqual(mockProofs);
    });
  });

  describe('POST', () => {
    it('should create proof', async () => {
      const mockProof = { id: '1', type: 'DOCUMENT_RECEPTION' };
      (prisma.proof.findFirst as jest.Mock).mockResolvedValue(null);
      (prisma.proof.create as jest.Mock).mockResolvedValue(mockProof);

      const request = new NextRequest('http://localhost/api/proofs', {
        method: 'POST',
        body: JSON.stringify({
          tenantId: mockTenantId,
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
      (prisma.proof.findUnique as jest.Mock).mockResolvedValue({ id: '1' });
      (prisma.proof.update as jest.Mock).mockResolvedValue({ id: '1', status: 'VALIDATED' });

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
