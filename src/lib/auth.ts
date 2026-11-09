
/**
 * Stub NextAuthOptions — utilisé en fallback après migration partielle.
 * TODO: remplacer par la config Clerk ou restaurer l'ancienne route NextAuth.
 */
export const authOptions: Record<string, any> = {
  providers: [],
  session: { strategy: 'jwt' },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role;
        token.tenantId = (user as any).tenantId;
      }
      return token;
    },
    async session({ session, token }) {
      (session.user as any).role = token.role;
      (session.user as any).tenantId = token.tenantId;
      return session;
    },
  },
};

