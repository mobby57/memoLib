// Optional: configure or set up a testing framework before each test.
// If you delete this file, remove `setupFilesAfterEnv` from `jest.config.js`

// Used for __tests__/testing-library.js
// Learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';

// Polyfill TextEncoder/TextDecoder for Node.js test environment
if (typeof globalThis.TextEncoder === 'undefined') {
  const { TextEncoder, TextDecoder } = require('util');
  globalThis.TextEncoder = TextEncoder;
  globalThis.TextDecoder = TextDecoder;
}

// Polyfill Web APIs for Next.js API route tests
// These are needed for next/server imports
if (typeof globalThis.Request === 'undefined') {
  //  Polyfill TextEncoder/TextDecoder for Node.js test environment
  globalThis.Request = class Request {
    constructor(input, init = {}) {
      this.url = typeof input === 'string' ? input : input.url;
      this.method = init.method || 'GET';
      this.headers = new Map(Object.entries(init.headers || {}));
      this.body = init.body;
    }
    json() {
      return Promise.resolve(JSON.parse(this.body || '{}'));
    }
    text() {
      return Promise.resolve(this.body || '');
    }
  };

  globalThis.Response = class Response {
    constructor(body, init = {}) {
      this.body = body;
      this.status = init.status || 200;
      this.headers = new Map(Object.entries(init.headers || {}));
    }
    json() {
      return Promise.resolve(JSON.parse(this.body || '{}'));
    }
    text() {
      return Promise.resolve(this.body || '');
    }
  };

  globalThis.Headers = class Headers extends Map {
    constructor(init = {}) {
      super(Object.entries(init));
    }
  };
}

// Mock Next.js router
jest.mock('next/router', () => ({
  useRouter() {
    return {
      route: '/',
      pathname: '/',
      query: {},
      asPath: '/',
      push: jest.fn(),
      pop: jest.fn(),
      reload: jest.fn(),
      back: jest.fn(),
      prefetch: jest.fn().mockResolvedValue(undefined),
      beforePopState: jest.fn(),
      events: {
        on: jest.fn(),
        off: jest.fn(),
        emit: jest.fn(),
      },
    };
  },
}));

// Mock Next.js navigation
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn(),
    };
  },
  useSearchParams() {
    return new URLSearchParams();
  },
  usePathname() {
    return '/';
  },
}));

// Mock environment variables
process.env.NEXTAUTH_SECRET = 'test-secret';
process.env.NEXTAUTH_URL = 'http://localhost:3000';
process.env.STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || 'sk_test_12345';
// Use a dummy valid PostgreSQL URL to satisfy Prisma datasource validation
if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = 'postgresql://user:pass@localhost:5432/testdb';
}

// ===== Mocks: 2FA (otplib) =====
jest.mock('otplib', () => {
  class TOTPMock {
    keyuri(email, app, secret) {
      return `otpauth://totp/${encodeURIComponent(app)}:${encodeURIComponent(email)}?secret=${secret}`;
    }
    check(token, secret) {
      return Boolean(secret) && typeof token === 'string' && token.length === 6;
    }
  }

  return {
    TOTP: TOTPMock,
    generateSecret: jest.fn(() => `TESTSECRET_${Math.random().toString(36).slice(2, 10)}`),
  };
});

jest.mock('@otplib/preset-default', () => {
  const authenticator = {
    // Génère des secrets pseudo-uniques pour satisfaire les tests d'unicité
    generateSecret: jest.fn(() => `TESTSECRET_${Math.random().toString(36).slice(2, 10)}`),
    // Force le nom d'application attendu par les tests
    keyuri: jest.fn(
      (email, _app, secret) =>
        `otpauth://totp/${encodeURIComponent('MemoLib Assistant')}:${encodeURIComponent(email)}?secret=${secret}`
    ),
    verify: jest.fn(
      ({ token, secret }) => Boolean(secret) && typeof token === 'string' && token.length === 6
    ),
  };
  return { authenticator };
});

// (Stripe est mocké par test au besoin; pas de mock global ici pour éviter les conflits)

// ===== Mocks: Redis / Cache =====
// Mock Redis pour éviter les erreurs de connexion dans les tests
jest.mock('@/lib/cache/redis', () => ({
  redis: {
    get: jest.fn().mockResolvedValue(null),
    set: jest.fn().mockResolvedValue('OK'),
    del: jest.fn().mockResolvedValue(1),
    exists: jest.fn().mockResolvedValue(0),
    expire: jest.fn().mockResolvedValue(1),
    ttl: jest.fn().mockResolvedValue(-1),
    scan: jest.fn().mockResolvedValue(['0', []]),
    keys: jest.fn().mockResolvedValue([]),
    flushall: jest.fn().mockResolvedValue('OK'),
    quit: jest.fn().mockResolvedValue('OK'),
  },
  getRedisClient: jest.fn(() => ({
    get: jest.fn().mockResolvedValue(null),
    set: jest.fn().mockResolvedValue('OK'),
    del: jest.fn().mockResolvedValue(1),
    exists: jest.fn().mockResolvedValue(0),
    expire: jest.fn().mockResolvedValue(1),
    quit: jest.fn().mockResolvedValue('OK'),
  })),
}));

// Mock du SmartCache pour éviter les erreurs Redis
jest.mock('@/lib/cache/smart-cache', () => ({
  SmartCache: jest.fn().mockImplementation(() => ({
    get: jest.fn().mockResolvedValue(null),
    set: jest.fn().mockResolvedValue(true),
    delete: jest.fn().mockResolvedValue(true),
    invalidate: jest.fn().mockResolvedValue(true),
    clear: jest.fn().mockResolvedValue(true),
  })),
  smartCache: {
    get: jest.fn().mockResolvedValue(null),
    set: jest.fn().mockResolvedValue(true),
    delete: jest.fn().mockResolvedValue(true),
    invalidate: jest.fn().mockResolvedValue(true),
    clear: jest.fn().mockResolvedValue(true),
  },
}));

// Suppression des logs de cache dans les tests
const originalConsoleError = console.error;
console.error = (...args) => {
  // Ignorer les erreurs Redis dans les tests
  if (
    typeof args[0] === 'string' &&
    (args[0].includes('[Cache]') ||
      args[0].includes('Redis connection failed') ||
      args[0].includes('Redis write failed') ||
      args[0].includes('Redis delete failed') ||
      args[0].includes('Redis scan failed'))
  ) {
    return;
  }
  originalConsoleError.call(console, ...args);
};

// ===== Mock Global Prisma pour tous les tests =====
// Cela évite les conflits avec les mocks individuels dans les tests
global.createPrismaMock = () => ({
  tenant: {
    findMany: jest.fn().mockResolvedValue([]),
    findUnique: jest.fn().mockResolvedValue(null),
    create: jest.fn().mockResolvedValue({}),
    update: jest.fn().mockResolvedValue({}),
    delete: jest.fn().mockResolvedValue({}),
  },
  aiUsage: {
    aggregate: jest.fn().mockResolvedValue({ _sum: { costUSD: 0 } }),
    findMany: jest.fn().mockResolvedValue([]),
    create: jest.fn().mockResolvedValue({}),
  },
  quotaEvent: {
    create: jest.fn().mockResolvedValue({}),
    findMany: jest.fn().mockResolvedValue([]),
  },
  eventLog: {
    create: jest.fn().mockResolvedValue({}),
    findMany: jest.fn().mockResolvedValue([]),
    count: jest.fn().mockResolvedValue(0),
  },
  $on: jest.fn(),
  $disconnect: jest.fn().mockResolvedValue(null),
});
