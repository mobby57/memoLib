import NextAuth, { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GitHubProvider from 'next-auth/providers/github';
import EmailProvider from 'next-auth/providers/email';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';

export const authOptions: NextAuthOptions = {
  providers: [
    // Email Provider pour authentification par lien magique
    ...(process.env.EMAIL_SERVER ? [
      EmailProvider({
        server: process.env.EMAIL_SERVER,
        from: process.env.EMAIL_FROM || 'noreply@memoLib.com',
      })
    ] : []),
    GitHubProvider({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
      authorization: {
        params: {
          // Scopes pour agir au nom de l'utilisateur
          scope: 'read:user user:email repo write:org',
        },
      },
    }),
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials, req) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Identifiants requis');
        }
        
        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
          include: {
            tenant: { 
              select: { 
                id: true, 
                name: true, 
                status: true,
                plan: { select: { name: true } }
              } 
            },
            client: { 
              select: { 
                id: true, 
                firstName: true, 
                lastName: true 
              } 
            }
          },
        });
        
        if (!user || !await bcrypt.compare(credentials.password, user.password)) {
          throw new Error('Identifiants invalides');
        }
        
        if (user.role === 'ADMIN' && (!user.tenant || user.tenant.status !== 'active')) {
          throw new Error('Cabinet inactif');
        }
        if (user.role === 'CLIENT' && (!user.tenant || user.tenant.status !== 'active' || !user.clientId)) {
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
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === 'github') {
        const existingUser = await prisma.user.findUnique({
          where: { email: user.email! },
          include: { tenant: { select: { id: true, name: true, status: true, plan: { select: { name: true } } } } }
        });

        if (existingUser) {
          await prisma.user.update({
            where: { id: existingUser.id },
            data: { name: user.name || existingUser.name, avatar: user.image, lastLogin: new Date() }
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
            }
          });

          (user as any).role = 'CLIENT';
          (user as any).id = newUser.id;
        }
      }
      return true;
    },
    async redirect({ url, baseUrl }) {
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
      name: process.env.NODE_ENV === 'production' 
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
      name: process.env.NODE_ENV === 'production' 
        ? '__Secure-next-auth.callback-url' 
        : 'next-auth.callback-url',
      options: {
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
      },
    },
    csrfToken: {
      name: process.env.NODE_ENV === 'production' 
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
