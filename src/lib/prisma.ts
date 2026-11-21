import { PrismaClient } from '@prisma/client';
import type { PrismaPromise } from '@prisma/client/runtime/library';
import { decryptData, EncryptedDataPayload, encryptData } from '@/lib/security/encryption';

function isEncryptedDataPayload(value: unknown): value is EncryptedDataPayload {
  if (typeof value !== 'object' || value === null) return false;
  const payload = value as Record<string, unknown>;
  return (
    typeof payload.encrypted === 'string' &&
    typeof payload.iv === 'string' &&
    typeof payload.authTag === 'string' &&
    payload.version === '1.0'
  );
}

function encryptReasoningData(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(encryptReasoningData);
  if (typeof value !== 'object' || value === null) return value;

  const data = { ...(value as Record<string, unknown>) };
  for (const field of ['sourceRaw', 'sourceMetadata']) {
    const fieldValue = data[field];
    let plaintext: string | undefined;
    if (typeof fieldValue === 'string') {
      plaintext = fieldValue;
    } else if (field === 'sourceMetadata' && fieldValue !== undefined && fieldValue !== null) {
      plaintext = JSON.stringify(fieldValue);
    }
    if (plaintext !== undefined) {
      data[field] = JSON.stringify(encryptData(plaintext));
    }
  }
  for (const field of ['create', 'update']) {
    if (data[field] !== undefined) data[field] = encryptReasoningData(data[field]);
  }
  return data;
}

function decryptReasoningResult<T>(value: T): T {
  if (Array.isArray(value)) return value.map(item => decryptReasoningResult(item)) as unknown as T;
  if (typeof value !== 'object' || value === null) return value;

  const result = { ...(value as Record<string, unknown>) };
  for (const field of ['sourceRaw', 'sourceMetadata']) {
    const fieldValue = result[field];
    if (typeof fieldValue === 'string') {
      const payload: unknown = JSON.parse(fieldValue);
      if (!isEncryptedDataPayload(payload)) {
        throw new Error(`Invalid encrypted WorkspaceReasoning field: ${field}`);
      }
      result[field] = decryptData(payload);
    }
  }
  return result as T;
}

const globalForPrisma = global as unknown as { prisma: PrismaClient };
type TenantTransactionClient = Omit<
  PrismaClient,
  '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'
>;

// Client Prisma non sécurisé (pour migrations/seeds)
export const prisma = globalForPrisma.prisma || new PrismaClient();
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export function getSystemPrisma() {
  return prisma.$extends({});
}

// Client Prisma sécurisé par RLS (Row-Level Security)
export async function getSecurePrisma() {
  const { getServerSessionCompat } = await import('@/lib/auth/getServerSessionCompat');
  const session = await getServerSessionCompat();
  const tenantId = session?.user.tenantId;

  if (!tenantId) {
    throw new Error("Accès refusé : Aucun cabinet (tenant) associé à cette session.");
  }

  const baseClient = globalForPrisma.prisma || new PrismaClient();

  return baseClient.$extends({
    query: {
      $allModels: {
        async $allOperations({ model, operation, args, query }) {
          const queryArgs =
            model === 'WorkspaceReasoning' &&
            ['create', 'update', 'upsert', 'createMany'].includes(operation)
              ? { ...args, data: encryptReasoningData(args.data) }
              : args;
          const [, result] = await baseClient.$transaction([
            baseClient.$executeRaw`SELECT set_config('app.current_tenant', ${tenantId}, true)`,
            query(queryArgs),
          ]);
          return model === 'WorkspaceReasoning' ? decryptReasoningResult(result) : result;
        },
      },
    },
  });
}

export async function withTenantContext<T>(
  tenantId: string,
  operation: (client: TenantTransactionClient) => PrismaPromise<T>
): Promise<T> {
  if (!tenantId) {
    throw new Error('Un tenant est requis pour cette operation.');
  }

  const [, result] = await prisma.$transaction([
    prisma.$executeRaw`SELECT set_config('app.current_tenant', ${tenantId}, true)`,
    operation(prisma),
  ]);
  return result as T;
}

export async function withTenantContextTransaction<T>(
  tenantId: string,
  operation: (client: TenantTransactionClient) => Promise<T>,
  options?: { maxWait?: number; timeout?: number }
): Promise<T> {
  if (!tenantId) {
    throw new Error('Un tenant est requis pour cette operation.');
  }

  if (options) {
    return prisma.$transaction(async tx => {
      await tx.$executeRaw`SELECT set_config('app.current_tenant', ${tenantId}, true)`;
      return operation(tx);
    }, options);
  }
  return prisma.$transaction(async tx => {
    await tx.$executeRaw`SELECT set_config('app.current_tenant', ${tenantId}, true)`;
    return operation(tx);
  });
}

export async function withTenantContextBatch(
  tenantId: string,
  operations: (client: TenantTransactionClient) => PrismaPromise<unknown>[]
): Promise<unknown[]> {
  if (!tenantId) {
    throw new Error('Un tenant est requis pour cette operation.');
  }

  const results = await prisma.$transaction([
    prisma.$executeRaw`SELECT set_config('app.current_tenant', ${tenantId}, true)`,
    ...operations(prisma),
  ]);
  return results.slice(1);
}

export default prisma;
