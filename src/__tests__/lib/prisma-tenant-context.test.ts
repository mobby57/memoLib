import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  session: vi.fn(),
  transaction: vi.fn(),
  executeRaw: vi.fn(),
  extension: null as unknown,
  query: vi.fn(),
}));

vi.mock('@prisma/client', () => ({
  PrismaClient: class {
    $transaction(operations: Promise<unknown>[]) {
      return mocks.transaction(operations);
    }

    $executeRaw(strings: TemplateStringsArray, ...values: unknown[]) {
      return mocks.executeRaw(strings, ...values);
    }

    $extends(extension: unknown) {
      mocks.extension = extension;
      return {
        document: {
          findFirst: (args: unknown) =>
            readAllOperations(mocks.extension)({
              model: 'Document',
              operation: 'findFirst',
              args,
              query: mocks.query,
            }),
        },
      };
    }
  },
}));

vi.mock('@/lib/auth/getServerSessionCompat', () => ({
  getServerSessionCompat: mocks.session,
}));

import { getSecurePrisma } from '@/lib/prisma';

describe('getSecurePrisma tenant context', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.session.mockResolvedValue({ user: { tenantId: 'internal-tenant-a' } });
    mocks.transaction.mockImplementation(async (operations: Promise<unknown>[]) =>
      Promise.all(operations)
    );
    mocks.executeRaw.mockResolvedValue(1);
    mocks.query.mockResolvedValue({ id: 'document-a' });
  });

  it('uses the authenticated internal tenant ID in the transaction-local RLS context', async () => {
    const securePrisma = await getSecurePrisma();
    const result = await securePrisma.document.findFirst({ where: { id: 'document-a' } });

    expect(result).toEqual({ id: 'document-a' });
    expect(mocks.session).toHaveBeenCalledOnce();
    expect(mocks.transaction).toHaveBeenCalledOnce();
    expect(mocks.executeRaw.mock.calls[0][1]).toBe('internal-tenant-a');
    expect(mocks.query).toHaveBeenCalledWith({ where: { id: 'document-a' } });
  });

  it('refuses to create a tenant-scoped client without an authenticated tenant', async () => {
    mocks.session.mockResolvedValue(null);

    await expect(getSecurePrisma()).rejects.toThrow('Aucun cabinet');
    expect(mocks.transaction).not.toHaveBeenCalled();
  });
});

interface AllOperationsExtension {
  query: {
    $allModels: {
      $allOperations: (input: {
        model: string;
        operation: string;
        args: unknown;
        query: (args: unknown) => Promise<unknown>;
      }) => Promise<unknown>;
    };
  };
}

function readAllOperations(extension: unknown): AllOperationsExtension['query']['$allModels']['$allOperations'] {
  return (extension as AllOperationsExtension).query.$allModels.$allOperations;
}
