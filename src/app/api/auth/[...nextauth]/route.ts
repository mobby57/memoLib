import { prisma } from '@/lib/prisma';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import bcrypt from 'bcryptjs';
import NextAuth, { NextAuthOptions } from 'next-auth';
import AzureADProvider from 'next-auth/providers/azure-ad';
import CredentialsProvider from 'next-auth/providers/credentials';
import EmailProvider from 'next-auth/providers/email';
import GitHubProvider from 'next-auth/providers/github';
import GoogleProvider from 'next-auth/providers/google';
import { buildRbacContext, RBAC_PERMISSIONS } from '@/lib/auth/rbac';

async function handleOAuthSignIn(user: any, providerName: string) {
  const existingUser = await prisma.user.findUnique({
    where: { email: user.email! },
    include: {
      tenant: {
        select: { id: true, name: true, status: true, plan: { select: { name: true } } },
      },
    },
  });

  if (existingUser) {
    await prisma.user.update({
      where: { id: existingUser.id },
      data: {
        name: user.name || existingUser.name,
        avatar: user.image,
        lastLogin: new Date(),
      },
    });

    (user as any).role = existingUser.role;
    (user as any).tenantId = existingUser.tenantId;
    (user as any).tenantName = existingUser.tenant?.name;
    (user as any).tenantPlan = existingUser.tenant?.plan?.name;
    (user as any).clientId = existingUser.clientId;
    (user as any).id = existingUser.id;
  } else {
    const newUser = await prisma.user.create({
      data: {
        email: user.email!,
        name: user.name || `Utilisateur ${providerName}`,
        password: '',
        role: 'CLIENT',
        avatar: user.image,
        status: 'active',
        lastLogin: new Date(),
      },
    });

    (user as any).role = 'CLIENT';
    (user as any).id = newUser.id;
  }
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    // Azure AD Provider pour authentification SSO
    ...(process.env.AZURE_CLIENT_ID &&
    process.env.AZURE_CLIENT_SECRET &&
    process.env.AZURE_TENANT_ID
      ? [
          AzureADProvider({
            clientId: process.env.AZURE_CLIENT_ID,
            clientSecret: process.env.AZURE_CLIENT_SECRET,
            tenantId: process.env.AZURE_TENANT_ID,
            authorization: { params: { scope: 'openid profile email' } },
          }),
        ]
      : []),
    // Email Provider pour lien magique
    ...(process.env.EMAIL_SERVER
      ? [
          EmailProvider({
            server: process.env.EMAIL_SERVER,
            from: process.env.EMAIL_FROM || 'noreply@memoLib.com',
          }),
        ]
      : []),
    // GitHub Provider
    ...(process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET
      ? [
          GitHubProvider({
            clientId: process.env.GITHUB_CLIENT_ID,
            clientSecret: process.env.GITHUB_CLIENT_SECRET,
            authorization: {
              params: { scope: 'read:user user:email repo write:org' },
            },
          }),
        ]
      : []),
    // Google Provider
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? [
          GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          }),
        ]
      : []),
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials, req) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Identifiants requis');
        }

        const isDemoMode = process.env.NODE_ENV === 'development' || process.env.DEMO_MODE === 'true';

        if (isDemoMode) {
          const demoUsers: Record<string, any> = {
            'admin@memolib.fr': {
              id: 'demo-admin-1',
              email: 'admin@memolib.fr',
              name: 'Admin Demo',
              role: 'SUPER_ADMIN',
              password: process.env.DEMO_ADMIN_PASSWORD || 'demo123',
              tenantId: 'demo-tenant-1',
              tenantName: 'Cabinet Demo',
              tenantPlan: 'enterprise',
              clientId: null,
            },
            'avocat@memolib.fr': {
              id: 'demo-lawyer-1',
              email: 'avocat@memolib.fr',
              name: 'Me. Sarra Boudjellal',
              role: 'AVOCAT',
              password: process.env.DEMO_LAWYER_PASSWORD || 'demo123',
              tenantId: 'demo-tenant-1',
              tenantName: 'Cabinet Boudjellal',
              tenantPlan: 'professional',
              clientId: null,
              monitoredEmail: 'sarraboudjellal57@gmail.com',
            },
            'associe@memolib.fr': {
              id: 'demo-associe-1',
              email: 'associe@memolib.fr',
              name: 'Me. Pierre Durand',
              role: 'ASSOCIE',
              password: 'demo123',
              tenantId: 'demo-tenant-1',
              tenantName: 'Cabinet Demo',
              tenantPlan: 'professional',
              clientId: null,
            },
            'collaborateur@memolib.fr': {
              id: 'demo-collab-1',
              email: 'collaborateur@memolib.fr',
              name: 'Me. Julie Petit',
              role: 'COLLABORATEUR',
              password: 'demo123',
              tenantId: 'demo-tenant-1',
              tenantName: 'Cabinet Demo',
              tenantPlan: 'professional',
              clientId: null,
            },
            'stagiaire@memolib.fr': {
              id: 'demo-stagiaire-1',
              email: 'stagiaire@memolib.fr',
              name: 'Lucas Bernard',
              role: 'STAGIAIRE',
              password: 'demo123',
              tenantId: 'demo-tenant-1',
              tenantName: 'Cabinet Demo',
              tenantPlan: 'professional',
              clientId: null,
            },
            'secretaire@memolib.fr': {
              id: 'demo-secretaire-1',
              email: 'secretaire@memolib.fr',
              name: 'Marie Leroy',
              role: 'SECRETAIRE',
              password: 'demo123',
              tenantId: 'demo-tenant-1',
              tenantName: 'Cabinet Demo',
              tenantPlan: 'professional',
              clientId: null,
            },
            'comptable@memolib.fr': {
              id: 'demo-comptable-1',
              email: 'comptable@memolib.fr',
              name: 'Anne Moreau',
              role: 'COMPTABLE',
              password: 'demo123',
              tenantId: 'demo-tenant-1',
              tenantName: 'Cabinet Demo',
              tenantPlan: 'professional',
              clientId: null,
            },
            'client@memolib.fr': {
              id: 'demo-client-1',
              email: 'client@memolib.fr',
              name: 'Client Demo',
              role: 'CLIENT',
              password: process.env.DEMO_CLIENT_PASSWORD || 'demo123',
              tenantId: 'demo-tenant-1',
              tenantName: 'Cabinet Demo',
              tenantPlan: 'professional',
              clientId: 'demo-client-1',
            },
          };

          const demoUser = demoUsers[credentials.email];
          if (demoUser && demoUser.password === credentials.password) {
            const { password, ...userWithoutPassword } = demoUser;
            return userWithoutPassword;
          }
        }

        try {
          const user = await prisma.user.findUnique({
            where: { email: credentials.email },
            include: {
              tenant: {
                select: { id: true, name: true, status: true, plan: { select: { name: true } } },
              },
              client: {
                select: { id: true, firstName: true, lastName: true },
              },
            },
          });

          if (!user || !(await bcrypt.compare(credentials.password, user.password))) {
            throw new Error('Identifiants invalides');
          }

          if (user.role === 'ADMIN' && (!user.tenant || user.tenant.status !== 'active')) {
            throw new Error('Cabinet inactif');
          }
          if (
            user.role === 'CLIENT' &&
            (!user.tenant || user.tenant.status !== 'active' || !user.clientId)
          ) {
            throw new Error('Profil client incomplet');
          }

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            tenantId: user.tenantId,
            tenantName: user.tenant?.name,
            tenantPlan: user.tenant?.plan?.name,
            clientId: user.clientId,
          } as any;
        } catch (dbError: any) {
          if (dbError.message?.includes("Can't reach database")) {
            throw new Error('Identifiants invalides (DB indisponible)');
          }
          throw dbError;
        }
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === 'azure-ad') {
        await handleOAuthSignIn(user, 'Azure AD');
        return true;
      }

      if (account?.provider === 'github' || account?.provider === 'google') {
        await handleOAuthSignIn(user, account.provider === 'github' ? 'GitHub' : 'Google');
      }
      return true;
    },
    async redirect({ url, baseUrl }) {
      if (url.startsWith('/auth/')) {
        return `${baseUrl}/dashboard`;
      }
      if (url.startsWith('/')) return `${baseUrl}${url}`;
      if (new URL(url).origin === baseUrl) return url;
      return baseUrl;
    },
    async jwt({ token, user, account }) {
      if (user) {
        token.id = (user as any).id;
        token.role = (user as any).role;
        token.tenantId = (user as any).tenantId;
        token.tenantName = (user as any).tenantName;
        token.tenantPlan = (user as any).tenantPlan;
        token.clientId = (user as any).clientId;
        token.provider = account?.provider;
      }

      if (account?.provider === 'github') {
        token.githubAccessToken = account.access_token;
        token.githubRefreshToken = account.refresh_token;
        token.githubTokenExpiry = account.expires_at;
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        const rbac = buildRbacContext({
          role: token.role as string | undefined,
          groups: token.groups as string[] | undefined,
        });

        (session.user as any).id = token.id;
        (session.user as any).role = token.role;
        (session.user as any).tenantId = token.tenantId;
        (session.user as any).tenantName = token.tenantName;
        (session.user as any).tenantPlan = token.tenantPlan;
        (session.user as any).clientId = token.clientId;
        (session.user as any).provider = token.provider;
        (session.user as any).groups = rbac.groups;
        (session.user as any).rbacPermissions = rbac.permissions;

        (session as any).githubAccessToken = token.githubAccessToken;
        (session as any).githubRefreshToken = token.githubRefreshToken;
        (session as any).githubTokenExpiry = token.githubTokenExpiry;

        const STAFF_ROLES = ['SUPER_ADMIN', 'ADMIN', 'AVOCAT', 'ASSOCIE', 'COLLABORATEUR', 'SECRETAIRE', 'COMPTABLE', 'STAGIAIRE'];
        const MANAGE_ROLES = ['SUPER_ADMIN', 'ADMIN', 'AVOCAT', 'ASSOCIE'];
        const FINANCE_ROLES = ['SUPER_ADMIN', 'ADMIN', 'AVOCAT', 'ASSOCIE', 'COMPTABLE'];
        const userRole = token.role as string;

        (session.user as any).permissions = {
          canManageTenants: userRole === 'SUPER_ADMIN',
          canManageClients: MANAGE_ROLES.includes(userRole) || userRole === 'SECRETAIRE',
          canManageDossiers: MANAGE_ROLES.includes(userRole) || userRole === 'COLLABORATEUR',
          canViewOwnDossier: userRole === 'CLIENT',
          canManageFactures: FINANCE_ROLES.includes(userRole),
          canViewOwnFactures: userRole === 'CLIENT',
          canAccessAnalytics: FINANCE_ROLES.includes(userRole),
          canManageUsers: MANAGE_ROLES.includes(userRole),
          canManageCalendar: STAFF_ROLES.includes(userRole),
          canManageDocuments: STAFF_ROLES.filter(r => r !== 'STAGIAIRE').includes(userRole),
          canAccessRbacDossiers:
            rbac.permissions.includes('*') ||
            rbac.permissions.includes(RBAC_PERMISSIONS.DOSSIERS_READ),
          canAccessRbacFactures:
            rbac.permissions.includes('*') ||
            rbac.permissions.includes(RBAC_PERMISSIONS.FACTURES_READ),
        };
      }
      return session;
    },
  },
  pages: {
    signIn: '/auth/login',
    error: '/auth/error',
  },
  session: {
    strategy: 'jwt',
    maxAge: 8 * 60 * 60,
    updateAge: 15 * 60,
  },
  cookies: {
    sessionToken: {
      name:
        process.env.NODE_ENV === 'production'
          ? '__Secure-next-auth.session-token'
          : 'next-auth.session-token',
      options: {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 8 * 60 * 60,
      },
    },
    callbackUrl: {
      name:
        process.env.NODE_ENV === 'production'
          ? '__Secure-next-auth.callback-url'
          : 'next-auth.callback-url',
      options: {
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
      },
    },
    csrfToken: {
      name:
        process.env.NODE_ENV === 'production'
          ? '__Host-next-auth.csrf-token'
          : 'next-auth.csrf-token',
      options: {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
      },
    },
  },
  debug: process.env.NODE_ENV === 'development',
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
