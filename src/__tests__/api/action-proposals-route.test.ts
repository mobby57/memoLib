import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { POST as approve } from '@/app/api/action-proposals/[id]/approve/route';
import { POST as reject } from '@/app/api/action-proposals/[id]/reject/route';
import { ActionProposalStatus, decideActionProposal } from '@/lib/services/action-proposal.service';

const mocks = vi.hoisted(() => ({
  getServerSession: vi.fn(),
  prisma: {
    actionProposal: {
      findMany: vi.fn(),
      count: vi.fn(),
      findUnique: vi.fn(),
      updateMany: vi.fn(),
      upsert: vi.fn(),
    },
    auditLog: {
      findFirst: vi.fn(),
      create: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

const { getServerSession } = mocks;
const mockPrisma = mocks.prisma;

vi.mock('@/lib/clerk-auth', () => ({
  auth: vi.fn(async () => {
    const session = await mocks.getServerSession();
    return session ?? { user: null };
  }),
}));

vi.mock('@/lib/prisma', () => ({
  prisma: mocks.prisma,
  default: mocks.prisma,
}));

describe('action proposal routes', () => {
  const context = (id: string) => ({ params: Promise.resolve({ id }) });

  beforeEach(() => {
    vi.clearAllMocks();
    getServerSession.mockResolvedValue({
      user: { id: 'user-a', tenantId: 'tenant-a', role: 'LAWYER' },
    });
    mockPrisma.$transaction.mockImplementation(async callback => callback(mockPrisma));
    mockPrisma.auditLog.findFirst.mockResolvedValue(null);
    mockPrisma.auditLog.create.mockResolvedValue({ id: 'audit-1' });
  });

  it('rejects a decision without an authenticated session', async () => {
    getServerSession.mockResolvedValue(null);

    const response = await reject(
      new NextRequest('http://localhost/api/action-proposals/proposal-1/reject', {
        method: 'POST',
        body: JSON.stringify({}),
      }),
      context('proposal-1')
    );

    expect(response.status).toBe(401);
    expect(mockPrisma.actionProposal.findUnique).not.toHaveBeenCalled();
  });

  it('refuses a proposal belonging to another tenant', async () => {
    mockPrisma.actionProposal.findUnique.mockResolvedValue({
      id: 'proposal-other',
      tenantId: 'tenant-b',
      status: ActionProposalStatus.PENDING,
    });

    const response = await approve(
      new NextRequest('http://localhost/api/action-proposals/proposal-other/approve', {
        method: 'POST',
        body: JSON.stringify({}),
      }),
      context('proposal-other')
    );

    expect(response.status).toBe(403);
    expect(mockPrisma.actionProposal.updateMany).not.toHaveBeenCalled();
  });

  it('rejects unstructured decision input', async () => {
    const response = await approve(
      new NextRequest('http://localhost/api/action-proposals/proposal-1/approve', {
        method: 'POST',
        body: JSON.stringify({ reason: 'x'.repeat(501), status: 'APPROVED' }),
      }),
      context('proposal-1')
    );

    expect(response.status).toBe(400);
    expect(mockPrisma.actionProposal.findUnique).not.toHaveBeenCalled();
  });

  it('records one atomic decision when approvals race and retries idempotently', async () => {
    const proposal = {
      id: 'proposal-1',
      tenantId: 'tenant-a',
      status: ActionProposalStatus.PENDING,
      type: 'REVIEW_EMAIL',
    };
    mockPrisma.actionProposal.findUnique.mockImplementation(async () => ({ ...proposal }));
    mockPrisma.actionProposal.updateMany.mockImplementation(async ({ where, data }) => {
      if (
        proposal.status === ActionProposalStatus.PENDING &&
        where.status === ActionProposalStatus.PENDING
      ) {
        proposal.status = data.status;
        return { count: 1 };
      }
      return { count: 0 };
    });

    const actor = { tenantId: 'tenant-a', userId: 'user-a', role: 'LAWYER' };
    const [first, second] = await Promise.all([
      decideActionProposal(actor, proposal.id, ActionProposalStatus.APPROVED),
      decideActionProposal(actor, proposal.id, ActionProposalStatus.APPROVED),
    ]);

    expect([first.kind, second.kind].sort()).toEqual(['idempotent', 'updated']);
    expect(proposal.status).toBe(ActionProposalStatus.APPROVED);
    expect(mockPrisma.auditLog.create).toHaveBeenCalledTimes(1);
  });
});
