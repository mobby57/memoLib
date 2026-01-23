/**
 * NextAuth API Route Handler
 * Uses shared auth configuration from lib/auth-config.ts
 */
import NextAuth from 'next-auth';
import { authOptions } from '@/lib/auth-config';

// Re-export authOptions for backward compatibility
export { authOptions } from '@/lib/auth-config';

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };

