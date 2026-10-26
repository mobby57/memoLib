import { vi } from 'vitest';

export const clerkState = {
  userId: null as string | null,
  sessionId: null as string | null,
};

export function setClerkUser(userId: string | null) {
  clerkState.userId = userId;
  clerkState.sessionId = userId ? `sess_${userId}` : null;
}

vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn(async () => ({
    userId: clerkState.userId,
    sessionId: clerkState.sessionId,
    getToken: vi.fn(async () => null),
    has: vi.fn(() => false),
    protect: vi.fn(),
    redirectToSignIn: vi.fn(),
  })),
  currentUser: vi.fn(async () => null),
  clerkClient: {
    users: { getUser: vi.fn(async () => null) },
    sessions: { getSession: vi.fn(async () => null) },
  },
}));
