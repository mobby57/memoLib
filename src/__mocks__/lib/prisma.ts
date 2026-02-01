// Manual mock for '@/lib/prisma' used across billing tests
// Provides consistent shape and configurable jest fns

export const __mockFindMany = jest.fn();
export const __mockFindUnique = jest.fn();
export const __mockUpdate = jest.fn();
export const __mockAggregate = jest.fn();
export const __mockQuotaCreate = jest.fn();

export const prisma = {
  tenant: {
    findMany: __mockFindMany,
    findUnique: __mockFindUnique,
    update: __mockUpdate,
  },
  aiUsage: {
    aggregate: __mockAggregate,
  },
  aIUsageLog: {
    aggregate: __mockAggregate,
  },
  quotaEvent: {
    create: __mockQuotaCreate,
  },
  $on: jest.fn(),
  $disconnect: jest.fn(),
};

export default prisma;
