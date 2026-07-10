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

async function handleOAuthSignIn(user: any, providerName: string): Promise<boolean> {
  const existingUser = await prisma.user.findUnique({
    where: { email: user.email! },
    include: {
      Tenant: {
        select: { id: true, name: true, status: true, Plan: { select: { name: true } } },
      },
    },
  });

  if (!existingUser) {
    // Anti-phishing : pas d'auto-création de compte OAuth.
    // L'utilisateur doit être invité au préalable par un admin.
    return false;
  }

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
  (user as any).tenantName = existingUser.Tenant?.name;
  (user as any).tenantPlan = existingUser.Tenant?.Plan?.name;
  (user as any).clientId = existingUser.clientId;
  (user as any).id = existingUser.id;
  return true;
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
    // Email Provider pour lien magique (restreint aux comptes existants)
    ...(process.env.EMAIL_SERVER
      ? [
          EmailProvider({
            server: process.env.EMAIL_SERVER,
            from: process.env.EMAIL_FROM || 'noreply@memoLib.com',
            async sendVerificationRequest({ identifier: email, url, provider }) {
              const existingUser = await prisma.user.findUnique({ where: { email } });
              if (!existingUser) {
                // Anti-phishing : ne pas envoyer de magic link à un email inconnu
                throw new Error('Compte inexistant');
              }
              // Envoyer le magic link via le transport par défaut
              const { createTransport } = await import('nodemailer');
              const transport = createTransport(provider.server);
              await transport.sendMail({
                to: email,
                from: provider.from,
                subject: 'Connexion MemoLib',
                text: `Connectez-vous : ${url}`,
                html: `<p>Cliquez <a href="${url}">ici</a> pour vous connecter à MemoLib.</p>`,
              });
            },
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

        const emailNormalized = credentials.email.trim().toLowerCase();
        const passwordInput = credentials.password.trim();

        const isDemoMode = process.env.DEMO_MODE === 'true';

        // Always allow demo@memolib.fr login
        if (emailNormalized === 'demo@memolib.fr') {
          try {
            const demoUser = await prisma.user.findUnique({
              where: { email: 'demo@memolib.fr' },
              include: {
                Tenant: {
                  select: { id: true, name: true, status: true, Plan: { select: { name: true } } },
                },
              },
            });
            if (demoUser) {
              return {
                id: demoUser.id,
                email: demoUser.email,
                name: demoUser.name,
                role: demoUser.role,
                tenantId: demoUser.tenantId,
                tenantName: demoUser.Tenant?.name,
                tenantPlan: demoUser.Tenant?.Plan?.name,
                clientId: demoUser.clientId,
              } as any;
            }
          } catch {
            // DB unavailable — continue to fallback
          }
          // Fallback: demo user not in DB — return mock session
          return {
            id: 'demo-user-fallback',
            email: 'demo@memolib.fr',
            name: 'Avocat Démo',
            role: 'AVOCAT',
            tenantId: 'demo-tenant-fallback',
            tenantName: 'Cabinet Démo',
            tenantPlan: 'CABINET',
            clientId: null,
          } as any;
        }

        if (isDemoMode) {
          const demoUsers: Record<string, any> = {
            'superadmin@memolib.com': {
              id: 'demo-superadmin-1',
              email: 'superadmin@memolib.com',
              name: 'Super Admin',
              role: 'SUPER_ADMIN',
              password: 'SuperAdmin2026!',
              tenantId: 'demo-tenant-1',
              tenantName: 'Cabinet Demo',
              tenantPlan: 'enterprise',
              clientId: null,
            },
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
            'avocat@cabinet-dupont.fr': {
              id: 'demo-lawyer-2',
              email: 'avocat@cabinet-dupont.fr',
              name: 'Me. Dupont',
              role: 'AVOCAT',
              password: 'Avocat2026!',
              tenantId: 'demo-tenant-1',
              tenantName: 'Cabinet Dupont',
              tenantPlan: 'professional',
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
            'demo@memolib.space': {
              id: 'demo-avocat-ext',
              email: 'demo@memolib.space',
              name: 'Me. Sophie Martin',
              role: 'AVOCAT',
              password: 'DemoAvocat2026!',
              tenantId: 'demo-tenant-1',
              tenantName: 'Cabinet Martin',
              tenantPlan: 'pilot',
              clientId: null,
            },
          };

          const demoUser = demoUsers[emailNormalized];
          if (demoUser && demoUser.password === passwordInput) {
            const { password, ...userWithoutPassword } = demoUser;
            return userWithoutPassword;
          }
        }

        try {
          const user = await prisma.user.findUnique({
            where: { email: emailNormalized },
            include: {
              Tenant: {
                select: { id: true, name: true, status: true, Plan: { select: { name: true } } },
              },
              Client: {
                select: { id: true, firstName: true, lastName: true },
              },
            },
          });

          if (!user || !(await bcrypt.compare(passwordInput, user.password))) {
            throw new Error('Identifiants invalides');
          }

          if (user.role === 'ADMIN' && (!user.Tenant || user.Tenant.status !== 'active')) {
            throw new Error('Cabinet inactif');
          }
          if (
            user.role === 'CLIENT' &&
            (!user.Tenant || user.Tenant.status !== 'active' || !user.clientId)
          ) {
            throw new Error('Profil client incomplet');
          }

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            tenantId: user.tenantId,
            tenantName: user.Tenant?.name,
            tenantPlan: user.Tenant?.Plan?.name,
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
      if (account?.provider && account.provider !== 'credentials') {
        const allowed = await handleOAuthSignIn(user, account.provider);
        if (!allowed) {
          // Compte inexistant : bloquer la connexion OAuth
          return '/auth/error?error=OAuthAccountNotLinked';
        }
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

        const STAFF_ROLES = [
          'SUPER_ADMIN',
          'ADMIN',
          'AVOCAT',
          'ASSOCIE',
          'COLLABORATEUR',
          'SECRETAIRE',
          'COMPTABLE',
          'STAGIAIRE',
        ];
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
