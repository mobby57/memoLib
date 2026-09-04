import dotenv from 'dotenv';
import path from 'path';
import { vi } from 'vitest';
import '@testing-library/jest-dom';

// Charger .env.test
dotenv.config({ path: path.resolve(__dirname, '.env.test') });

process.env.NEXTAUTH_SECRET = process.env.NEXTAUTH_SECRET || 'test-secret-32-characters-long-for-testing';
process.env.NEXTAUTH_URL = process.env.NEXTAUTH_URL || 'http://localhost:3000';

// ------------------------------------------------------------------
// Mock bcryptjs (global)
// ------------------------------------------------------------------
vi.mock('bcryptjs', () => ({
    compare: vi.fn(),
    hash: vi.fn(),
}));

// ------------------------------------------------------------------
// Mock ioredis (global)
// ------------------------------------------------------------------
vi.mock('ioredis', () => ({
    default: vi.fn(() => ({
        set: vi.fn().mockResolvedValue('OK'),
        get: vi.fn().mockResolvedValue(null),
    })),
}));

// ------------------------------------------------------------------
// Mock @prisma/client (avec export Prisma)
// ------------------------------------------------------------------
const mockPrismaClient = {
    user: { findUnique: vi.fn(), findMany: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn(), count: vi.fn() },
    tenant: { findUnique: vi.fn(), findMany: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn(), count: vi.fn() },
    plan: { findUnique: vi.fn(), findMany: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn(), count: vi.fn() },
    aiUsage: { aggregate: vi.fn().mockResolvedValue({ _sum: { cost: 0 } }) },
    aIUsageLog: { aggregate: vi.fn().mockResolvedValue({ _sum: { costEur: 0 } }) },
    quotaEvent: { create: vi.fn().mockResolvedValue({}) },
    $connect: vi.fn(),
    $disconnect: vi.fn(),
    $extends: vi.fn(() => mockPrismaClient),
    $on: vi.fn(),
    $use: vi.fn(),
};

class MockPrismaClient {
    constructor() {
        return mockPrismaClient;
    }
}

const Prisma = {
    PrismaClient: MockPrismaClient,
    PrismaClientKnownRequestError: class extends Error {},
};

vi.mock('@prisma/client', () => ({
    ...Prisma,
    PrismaClient: MockPrismaClient,
    Prisma: Prisma,
}));

vi.mock('@/lib/prisma', () => ({
    prisma: mockPrismaClient,
    prismaExtended: mockPrismaClient,
    default: mockPrismaClient,
    connect: vi.fn(),
    disconnect: vi.fn(),
    ensureDbOptimized: vi.fn(),
    resetMetrics: vi.fn(),
}));

// ------------------------------------------------------------------
// Mocks pour les modules manquants
// ------------------------------------------------------------------
vi.mock('@/lib/api', () => ({
    apiFetch: vi.fn(),
    apiGet: vi.fn(),
    apiPost: vi.fn(),
    apiPut: vi.fn(),
    apiDelete: vi.fn(),
}));

vi.mock('@/lib/auth/session', () => ({
    getSession: vi.fn(),
    getServerSession: vi.fn(),
}));

vi.mock('@/lib/config', () => ({
    config: { appName: 'memoLib', apiUrl: 'http://localhost:3000' },
}));

vi.mock('@/lib/constants', () => ({
    APP_NAME: 'memoLib',
    API_BASE_URL: '/api',
    STATUS_COLORS: {},
    TYPE_LABELS: {},
    STATUTS_UI: {},
    PRIORITES_UI: {},
}));

vi.mock('@/lib/formatters', () => ({
    formatDate: vi.fn((d) => d?.toString() || ''),
    formatCurrency: vi.fn((v) => `${v} €`),
    formatPhone: vi.fn((p) => p),
    formatDateForInput: vi.fn((d) => d?.toISOString?.() || ''),
}));

vi.mock('@/lib/security/rate-limit', () => ({
    rateLimit: vi.fn(() => ({ limit: 10, remaining: 9, reset: Date.now() + 1000 })),
}));

vi.mock('@/lib/validators/dossier', () => ({
    validateDossier: vi.fn(() => ({ valid: true, errors: [] })),
}));

vi.mock('@/lib/cron/deadline-alerts', () => ({
    checkDeadlineAlerts: vi.fn(),
}));

vi.mock('next-auth', () => ({ getServerSession: vi.fn() }));
vi.mock('@clerk/nextjs', () => ({
    auth: vi.fn().mockResolvedValue({ userId: 'test-user', tenantId: 'test-tenant' }),
    currentUser: vi.fn().mockResolvedValue({ id: 'test-user' }),
}));
vi.mock('server-only', () => ({}));

process.env.DATABASE_URL = process.env.DATABASE_URL || '';
