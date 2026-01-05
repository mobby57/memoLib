import NextAuth, { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
import { logger } from '@/lib/logger';

const prisma = new PrismaClient();

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials, req) {
        if (!credentials?.email || !credentials?.password) {
          logger.debug('Authentification échouée: identifiants manquants');
          throw new Error('Identifiants requis');
        }
        
        logger.debug('Tentative authentification', { email: credentials.email });
        
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
        
        if (!user) {
          logger.debug('Authentification échouée: utilisateur non trouvé', { email: credentials.email });
          throw new Error('Identifiants invalides');
        }
        
        logger.debug('Utilisateur trouvé, vérification mot de passe', { email: user.email, role: user.role });
        
        const isValid = await bcrypt.compare(credentials.password, user.password);
        
        if (!isValid) {
          logger.debug('Authentification échouée: mot de passe incorrect', { email: credentials.email });
          throw new Error('Identifiants invalides');
        }
        
        // Vérifications spécifiques par rôle
        if (user.role === 'SUPER_ADMIN') {
          // Super admin : accès global, pas de tenant requis
        } else if (user.role === 'ADMIN') {
          // Admin : doit avoir un tenant actif
          if (!user.tenant || user.tenant.status !== 'active') {
            throw new Error('Cabinet inactif');
          }
        } else if (user.role === 'CLIENT') {
          // Client : doit avoir un tenant ET un client associé
          if (!user.tenant || user.tenant.status !== 'active') {
            throw new Error('Cabinet inactif');
          }
          if (!user.clientId) {
            throw new Error('Profil client incomplet');
          }
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
    async jwt({ token, user }) {
      if (user) {
        token.id = (user as any).id;
        token.role = (user as any).role;
        token.tenantId = (user as any).tenantId;
        token.tenantName = (user as any).tenantName;
        token.tenantPlan = (user as any).tenantPlan;
        token.clientId = (user as any).clientId;
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
        
        // Calculer les permissions
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
    maxAge: 2 * 60 * 60, // 2 heures - redemande mot de passe automatique
    updateAge: 30 * 60, // Rafraîchit le token toutes les 30 minutes si actif
  },
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);

// Wrapper pour ajouter CORS
const corsHandler = (method: string) => async (req: Request) => {
  const response = await handler(req);
  
  // Ajouter headers CORS
  const headers = new Headers(response.headers);
  headers.set('Access-Control-Allow-Origin', '*');
  headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  headers.set('Access-Control-Allow-Headers', 'Content-Type');
  
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers
  });
};

export const GET = corsHandler('GET');
export const POST = corsHandler('POST');
export const OPTIONS = () => new Response(null, {
  status: 200,
  headers: {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  }
});