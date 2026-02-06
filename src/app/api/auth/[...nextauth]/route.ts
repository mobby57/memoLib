import { prisma } from '@/lib/prisma';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import bcrypt from 'bcryptjs';
import NextAuth, { NextAuthOptions } from 'next-auth';
import AzureADProvider from 'next-auth/providers/azure-ad';
import CredentialsProvider from 'next-auth/providers/credentials';
import EmailProvider from 'next-auth/providers/email';
import GitHubProvider from 'next-auth/providers/github';

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    // Azure AD Provider pour authentification SSO (avocats CESEDA)
    ...(process.env.AZURE_CLIENT_ID &&
    process.env.AZURE_CLIENT_SECRET &&
    process.env.AZURE_TENANT_ID
      ? [
          AzureADProvider({
            clientId: process.env.AZURE_CLIENT_ID,
            clientSecret: process.env.AZURE_CLIENT_SECRET,
            tenantId: process.env.AZURE_TENANT_ID,
            authorization: {
              params: {
                scope: 'openid profile email',
              },
            },
          }),
        ]
      : []),
    // Email Provider pour authentification par lien magique
    ...(process.env.EMAIL_SERVER
      ? [
          EmailProvider({
            server: process.env.EMAIL_SERVER,
            from: process.env.EMAIL_FROM || 'noreply@memoLib.com',
          }),
        ]
      : []),
    // GitHub Provider (optionnel)
    ...(process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET
      ? [
          GitHubProvider({
            clientId: process.env.GITHUB_CLIENT_ID,
            clientSecret: process.env.GITHUB_CLIENT_SECRET,
            authorization: {
              params: {
                // Scopes pour agir au nom de l'utilisateur
                scope: 'read:user user:email repo write:org',
              },
            },
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

        // MODE DEMO - Comptes de démonstration hardcodés
        const demoUsers: Record<string, any> = {
          'admin@memolib.fr': {
            id: 'demo-admin-1',
            email: 'admin@memolib.fr',
            name: 'Admin Demo',
            role: 'SUPER_ADMIN',
            password: 'admin123',
            tenantId: 'demo-tenant-1',
            tenantName: 'Cabinet Demo',
            tenantPlan: 'enterprise',
            clientId: null,
          },
          'avocat@memolib.fr': {
            id: 'demo-lawyer-1',
            email: 'avocat@memolib.fr',
            name: 'Avocat Demo',
            role: 'LAWYER',
            password: 'admin123',
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
            password: 'demo123',
            tenantId: 'demo-tenant-1',
            tenantName: 'Cabinet Demo',
            tenantPlan: 'professional',
            clientId: 'demo-client-1',
          },
        };

        // Vérifier les comptes de démo
        const demoUser = demoUsers[credentials.email];
        if (demoUser) {
          console.log('[DEMO AUTH] Tentative avec compte démo:', credentials.email);
          console.log('[DEMO AUTH] Password fourni:', credentials.password);
          console.log('[DEMO AUTH] Password attendu:', demoUser.password);

          if (demoUser.password === credentials.password) {
            console.log('[DEMO AUTH] ✅ Authentification réussie');
            // Retourner sans les données sensibles
            const { password, ...userWithoutPassword } = demoUser;
            return userWithoutPassword;
          } else {
            console.log('[DEMO AUTH] ❌ Mot de passe incorrect');
            throw new Error('Identifiants invalides');
          }
        }

        // Sinon, chercher dans la base de données
        try {
          console.log('[DB AUTH] Recherche dans la base de données:', credentials.email);
          const user = await prisma.user.findUnique({
            where: { email: credentials.email },
            include: {
              tenant: {
                select: {
                  id: true,
                  name: true,
                  status: true,
                  plan: { select: { name: true } },
                },
              },
              client: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                },
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
          // Si la base de données n'est pas accessible et on est en démo, accepter les comptes démo
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
      // Handle Azure AD login
      if (account?.provider === 'azure-ad') {
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
              name: user.name || 'Utilisateur Azure AD',
              password: '', // No password for SSO users
              role: 'CLIENT',
              avatar: user.image,
              status: 'active',
              lastLogin: new Date(),
            },
          });

          (user as any).role = 'CLIENT';
          (user as any).id = newUser.id;
        }
        return true;
      }

      if (account?.provider === 'github') {
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
              name: user.name || 'Utilisateur GitHub',
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
      return true;
    },
    async redirect({ url, baseUrl, user }) {
      // Redirection intelligente selon le rôle
      if (url.startsWith('/auth/')) {
        // Depuis la page de login, rediriger selon le rôle
        if ((user as any)?.role === 'SUPER_ADMIN') {
          return `${baseUrl}/super-admin/dashboard`;
        } else if ((user as any)?.role === 'LAWYER' || (user as any)?.role === 'ADMIN') {
          return `${baseUrl}/dashboard`;
        } else if ((user as any)?.role === 'CLIENT') {
          return `${baseUrl}/client-dashboard`;
        }
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

      // Sauvegarder le token GitHub pour user-to-server auth
      if (account?.provider === 'github') {
        token.githubAccessToken = account.access_token;
        token.githubRefreshToken = account.refresh_token;
        token.githubTokenExpiry = account.expires_at;
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id;
        (session.user as any).role = token.role;
        (session.user as any).tenantId = token.tenantId;
        (session.user as any).tenantName = token.tenantName;
        (session.user as any).tenantPlan = token.tenantPlan;
        (session.user as any).clientId = token.clientId;
        (session.user as any).provider = token.provider;

        // Tokens GitHub pour user-to-server auth
        (session as any).githubAccessToken = token.githubAccessToken;
        (session as any).githubRefreshToken = token.githubRefreshToken;
        (session as any).githubTokenExpiry = token.githubTokenExpiry;

        (session.user as any).permissions = {
          canManageTenants: token.role === 'SUPER_ADMIN',
          canManageClients: ['SUPER_ADMIN', 'ADMIN'].includes(token.role as string),
          canManageDossiers: ['SUPER_ADMIN', 'ADMIN'].includes(token.role as string),
          canViewOwnDossier: token.role === 'CLIENT',
          canManageFactures: ['SUPER_ADMIN', 'ADMIN'].includes(token.role as string),
          canViewOwnFactures: token.role === 'CLIENT',
          canAccessAnalytics: ['SUPER_ADMIN', 'ADMIN'].includes(token.role as string),
          canManageUsers: ['SUPER_ADMIN', 'ADMIN'].includes(token.role as string),
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
    // Session expire apres 1 heure d'inactivite pour la securite
    maxAge: 60 * 60, // 1 heure (3600 secondes)
    updateAge: 5 * 60, // Mise a jour toutes les 5 minutes
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
        maxAge: 60 * 60, // 1 heure
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
