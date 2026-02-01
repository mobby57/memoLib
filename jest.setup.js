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
jest.mock('@otplib/preset-default', () => {
  const authenticator = {
    // Génère des secrets pseudo-uniques pour satisfaire les tests d'unicité
    generateSecret: jest.fn(() => `TESTSECRET_${Math.random().toString(36).slice(2, 10)}`),
    // Force le nom d'application attendu par les tests
    keyuri: jest.fn(
      (email, _app, secret) =>
        `otpauth://totp/${encodeURIComponent('IA Poste Manager')}:${encodeURIComponent(email)}?secret=${secret}`
    ),
    verify: jest.fn(
      ({ token, secret }) => Boolean(secret) && typeof token === 'string' && token.length === 6
    ),
  };
  return { authenticator };
});

// (Stripe est mocké par test au besoin; pas de mock global ici pour éviter les conflits)
