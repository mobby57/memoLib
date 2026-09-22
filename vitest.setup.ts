import { vi } from 'vitest';

vi.mock('server-only', () => ({}));

vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn().mockResolvedValue({
    userId: null,
    sessionId: null,
    orgId: null,
    isAuthenticated: false,
  }),
  currentUser: vi.fn().mockResolvedValue(null),
  clerkMiddleware: vi.fn(() => (_req: any, _res: any, next: any) => next?.()),
  createRouteMatcher: vi.fn(() => () => false),
}));
