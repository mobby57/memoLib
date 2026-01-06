import NextAuth, { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GitHubProvider from 'next-auth/providers/github';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const authOptions: NextAuthOptions = {
  providers: [
    GitHubProvider({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
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
    maxAge: 2 * 60 * 60,
    updateAge: 30 * 60,
  },
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
