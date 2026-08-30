import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import NextAuth, { NextAuthOptions } from 'next-auth';
import AzureADProvider from 'next-auth/providers/azure-ad';
import CredentialsProvider from 'next-auth/providers/credentials';
import EmailProvider from 'next-auth/providers/email';
import GitHubProvider from 'next-auth/providers/github';
import GoogleProvider from 'next-auth/providers/google';
import { buildRbacContext, RBAC_PERMISSIONS } from '@/lib/auth/rbac';
import { NextRequest, NextResponse } from 'next/server';
import { withLoginRateLimit } from '@/lib/middleware/rate-limit';

/**
 * Types
 */

type SessionUser = {
  id?: string;
  role?: string;
  tenantId?: string;
  tenantName?: string;
  tenantPlan?: string;
  clientId?: string | null;
  provider?: string;
  groups?: string[];
  rbacPermissions?: string[];
  permissions?: Record<string, boolean>;
};

function asSessionUser(u: unknown): SessionUser {
  return u as SessionUser;
}

type OAuthUser = {
  email?: string;
  name?: string;
  image?: string;
  id?: string;
  role?: string;
  tenantId?: string;
  tenantName?: string;
  tenantPlan?: string;
  clientId?: string | null;
};

function asOAuthUser(u: unknown): OAuthUser {
  return u as OAuthUser;
}

function asSession(u: unknown): Record<string, any> {
  return u as Record<string, any>;
}

/**
 * Gestion des connexions OAuth
 *
 * Seuls les utilisateurs déjà présents en base peuvent
 * se connecter via Google / GitHub / Azure AD.
 */
async function handleOAuthSignIn(
  user: OAuthUser,
  providerName: string
): Promise<boolean> {
  try {
    if (!user.email) {
      console.error(`[OAuth:${providerName}] Email utilisateur absent`);
      return false;
    }

    const existingUser = await prisma.user.findUnique({
      where: {
        email: user.email.toLowerCase(),
      },
      include: {
        Tenant: {
          select: {
            id: true,
            name: true,
            status: true,
            Plan: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    if (!existingUser) {
      console.error(
        `[OAuth:${providerName}] Utilisateur absent de la base: ${user.email}`
      );
      return false;
    }

    // Vérification du cabinet pour les comptes qui en dépendent.
    if (
      existingUser.role !== 'SUPER_ADMIN' &&
      existingUser.Tenant &&
      existingUser.Tenant.status !== 'active'
    ) {
      console.error(
        `[OAuth:${providerName}] Cabinet inactif: ${user.email}`
      );
      return false;
    }

    await prisma.user.update({
      where: {
        id: existingUser.id,
      },
      data: {
        name: user.name || existingUser.name,
        avatar: user.image || existingUser.avatar,
        lastLogin: new Date(),
      },
    });

    user.role = existingUser.role;
    user.tenantId = existingUser.tenantId;
    user.tenantName = existingUser.Tenant?.name;
    user.tenantPlan = existingUser.Tenant?.Plan?.name;
    user.clientId = existingUser.clientId;
    user.id = existingUser.id;

    console.log(
      `[OAuth:${providerName}] Login OK: ${user.email} (${existingUser.role})`
    );

    return true;
  } catch (error) {
    console.error(
      `[OAuth:${providerName}] Erreur pendant la connexion:`,
      error
    );

    return false;
  }
}

/**
 * Configuration NextAuth
 */
export const authOptions: NextAuthOptions = {
  /**
   * JWT uniquement.
   *
   * Pas de PrismaAdapter :
   * les sessions sont stockées dans le JWT.
   */
  providers: [
    /**
     * Azure AD
     */
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

    /**
     * Email / Magic Link
     *
     * IMPORTANT :
     * Aucun import Nodemailer ici.
     *
     * NextAuth utilise directement le serveur SMTP configuré
     * dans EMAIL_SERVER.
     *
     * La fonction sendVerificationRequest personnalisée a été
     * supprimée afin d'éviter l'utilisation directe de Nodemailer.
     */
    ...(process.env.EMAIL_SERVER
      ? [
          EmailProvider({
            server: process.env.EMAIL_SERVER,
            from:
              process.env.EMAIL_FROM || 'noreply@memolib.com',

            async sendVerificationRequest({
              identifier: email,
              url,
              provider,
            }) {
              /**
               * Sécurité :
               * un magic link ne doit être envoyé qu'à un compte
               * déjà présent dans notre base.
               */
              const existingUser = await prisma.user.findUnique({
                where: {
                  email: email.toLowerCase(),
                },
              });

              if (!existingUser) {
                console.warn(
                  `[AUTH EMAIL] Tentative de magic link pour un compte inexistant: ${email}`
                );

                throw new Error('Compte inexistant');
              }

              /**
               * On utilise ici le mécanisme email de NextAuth.
               *
               * Pas de createTransport().
               * Pas de sendMail().
               * Pas d'import Nodemailer.
               */
              const response = await fetch(
                `${process.env.NEXTAUTH_URL || ''}/api/internal/auth/send-verification`,
                {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'X-Internal-Auth':
                      process.env.NEXTAUTH_SECRET || '',
                  },
                  body: JSON.stringify({
                    email,
                    url,
                    from: provider.from,
                  }),
                }
              );

              if (!response.ok) {
                throw new Error(
                  `Impossible d'envoyer le lien de connexion (${response.status})`
                );
              }
            },
          }),
        ]
      : []),

    /**
     * GitHub
     */
    ...(process.env.GITHUB_CLIENT_ID &&
    process.env.GITHUB_CLIENT_SECRET
      ? [
          GitHubProvider({
            clientId: process.env.GITHUB_CLIENT_ID,
            clientSecret: process.env.GITHUB_CLIENT_SECRET,
            authorization: {
              params: {
                scope: 'read:user user:email repo write:org',
              },
            },
          }),
        ]
      : []),

    /**
     * Google
     */
    ...(process.env.GOOGLE_CLIENT_ID &&
    process.env.GOOGLE_CLIENT_SECRET
      ? [
          GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          }),
        ]
      : []),

    /**
     * Credentials
     */
    CredentialsProvider({
      name: 'Credentials',

      credentials: {
        email: {
          label: 'Email',
          type: 'email',
        },
        password: {
          label: 'Password',
          type: 'password',
        },
      },

      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Identifiants requis');
        }

        const emailNormalized = credentials.email
          .trim()
          .toLowerCase();

        const passwordInput = credentials.password.trim();

        /**
         * SECURITY :
         * Le mode démo est interdit en production.
         */
        const isDemoMode =
          process.env.NODE_ENV !== 'production' &&
          process.env.DEMO_MODE === 'true';

        if (
          process.env.NODE_ENV === 'production' &&
          process.env.DEMO_MODE === 'true'
        ) {
          console.error(
            '[SECURITY] DEMO_MODE activé en production - connexion refusée'
          );

          throw new Error('Service indisponible');
        }

        /**
         * Utilisateurs de démonstration.
         */
        if (isDemoMode) {
          const demoUsers: Record<string, any> = {
            'superadmin@memolib.com': {
              id: 'demo-superadmin-1',
              email: 'superadmin@memolib.com',
              name: 'Super Admin',
              role: 'SUPER_ADMIN',
              passwordHash:
                process.env.DEMO_SUPERADMIN_PASSWORD_HASH ||
                '$2b$10$o33Pm4.4OBZVhsRiuzQuLuyPHz92nziKtCKi3ER8GaqxcT.cNFmVa',
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
              passwordHash:
                process.env.DEMO_ADMIN_PASSWORD_HASH ||
                '$2b$10$w7SIzTM2e3HBL7IAKE3QMur1ZtQPBfo8a5z6Tzv9B4aQwF59qKr/K',
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
              passwordHash:
                process.env.DEMO_AVOCAT_PASSWORD_HASH ||
                '$2b$10$2omTdPlTbikxuxF/t6nAleAs5GwX/jEvae40vCsDXk05AReCI7QG.',
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
              passwordHash:
                process.env.DEMO_LAWYER_PASSWORD_HASH ||
                '$2b$10$w7SIzTM2e3HBL7IAKE3QMur1ZtQPBfo8a5z6Tzv9B4aQwF59qKr/K',
              tenantId: 'demo-tenant-1',
              tenantName: 'Cabinet Boudjellal',
              tenantPlan: 'professional',
              clientId: null,
            },

            'associe@memolib.fr': {
              id: 'demo-associe-1',
              email: 'associe@memolib.fr',
              name: 'Me. Pierre Durand',
              role: 'ASSOCIE',
              passwordHash:
                process.env.DEMO_ASSOCIE_PASSWORD_HASH ||
                '$2b$10$w7SIzTM2e3HBL7IAKE3QMur1ZtQPBfo8a5z6Tzv9B4aQwF59qKr/K',
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
              passwordHash:
                process.env.DEMO_COLLAB_PASSWORD_HASH ||
                '$2b$10$w7SIzTM2e3HBL7IAKE3QMur1ZtQPBfo8a5z6Tzv9B4aQwF59qKr/K',
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
              passwordHash:
                process.env.DEMO_STAGIAIRE_PASSWORD_HASH ||
                '$2b$10$w7SIzTM2e3HBL7IAKE3QMur1ZtQPBfo8a5z6Tzv9B4aQwF59qKr/K',
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
              passwordHash:
                process.env.DEMO_SECRETAIRE_PASSWORD_HASH ||
                '$2b$10$w7SIzTM2e3HBL7IAKE3QMur1ZtQPBfo8a5z6Tzv9B4aQwF59qKr/K',
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
              passwordHash:
                process.env.DEMO_COMPTABLE_PASSWORD_HASH ||
                '$2b$10$w7SIzTM2e3HBL7IAKE3QMur1ZtQPBfo8a5z6Tzv9B4aQwF59qKr/K',
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
              passwordHash:
                process.env.DEMO_CLIENT_PASSWORD_HASH ||
                '$2b$10$w7SIzTM2e3HBL7IAKE3QMur1ZtQPBfo8a5z6Tzv9B4aQwF59qKr/K',
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
              passwordHash:
                process.env.DEMO_AVOCAT_EXT_PASSWORD_HASH ||
                '$2b$10$8WXef7PUTohkm2.C7WoEzOEiyAfERYI9hbDZuHFztEMzDnYBWJEGy',
              tenantId: 'demo-tenant-1',
              tenantName: 'Cabinet Martin',
              tenantPlan: 'pilot',
              clientId: null,
            },
          };

          const demoUser = demoUsers[emailNormalized];

          if (
            demoUser &&
            (await bcrypt.compare(
              passwordInput,
              demoUser.passwordHash
            ))
          ) {
            const {
              passwordHash: _passwordHash,
              ...userWithoutPassword
            } = demoUser;

            return userWithoutPassword;
          }
        }

        /**
         * Authentification DB
         */
        try {
          const user = await prisma.user.findUnique({
            where: {
              email: emailNormalized,
            },
            include: {
              Tenant: {
                select: {
                  id: true,
                  name: true,
                  status: true,
                  Plan: {
                    select: {
                      name: true,
                    },
                  },
                },
              },

              Client: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                },
              },
            },
          });

          if (
            !user ||
            !user.password ||
            !(await bcrypt.compare(
              passwordInput,
              user.password
            ))
          ) {
            throw new Error('Identifiants invalides');
          }

          /**
           * Vérification du cabinet pour les administrateurs.
           */
          if (
            user.role === 'ADMIN' &&
            (!user.Tenant ||
              user.Tenant.status !== 'active')
          ) {
            throw new Error('Cabinet inactif');
          }

          /**
           * Vérification du profil client.
           */
          if (
            user.role === 'CLIENT' &&
            (!user.Tenant ||
              user.Tenant.status !== 'active' ||
              !user.clientId)
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
          } as OAuthUser;
        } catch (dbError: unknown) {
          if (
            typeof dbError === 'object' &&
            dbError !== null &&
            'message' in dbError &&
            String(
              (dbError as { message?: unknown }).message
            ).includes("Can't reach database")
          ) {
            throw new Error(
              'Identifiants invalides (DB indisponible)'
            );
          }

          throw dbError;
        }
      },
    }),
  ],

  /**
   * Callbacks
   */
  callbacks: {
    async signIn({ user, account }) {
      if (
        account?.provider &&
        account.provider !== 'credentials' &&
        account.provider !== 'email'
      ) {
        const allowed = await handleOAuthSignIn(
          user as OAuthUser,
          account.provider
        );

        if (!allowed) {
          return '/fr/auth/error?error=OAuthAccountNotLinked';
        }
      }

      return true;
    },

    async redirect({ url, baseUrl }) {
      if (url.startsWith('/')) {
        return `${baseUrl}${url}`;
      }

      try {
        if (new URL(url).origin === baseUrl) {
          return url;
        }
      } catch {
        // URL invalide : fallback sécurisé
      }

      return `${baseUrl}/fr/dashboard`;
    },

    async jwt({ token, user, account }) {
      if (user) {
        const oUser = asOAuthUser(user);

        token.id = oUser.id;
        token.role = oUser.role;
        token.tenantId = oUser.tenantId;
        token.tenantName = oUser.tenantName;
        token.tenantPlan = oUser.tenantPlan;
        token.clientId = oUser.clientId;
        token.provider = account?.provider;
      }

      /**
       * Tokens GitHub conservés pour les fonctionnalités
       * GitHub de l'application.
       */
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

        const sUser = asSessionUser(session.user);

        sUser.id = token.id as string | undefined;
        sUser.role = token.role as string | undefined;
        sUser.tenantId =
          token.tenantId as string | undefined;
        sUser.tenantName =
          token.tenantName as string | undefined;
        sUser.tenantPlan =
          token.tenantPlan as string | undefined;
        sUser.clientId =
          token.clientId as string | null | undefined;
        sUser.provider =
          token.provider as string | undefined;

        sUser.groups = rbac.groups;
        sUser.rbacPermissions = rbac.permissions;

        const s = asSession(session);

        s.githubAccessToken = token.githubAccessToken;
        s.githubRefreshToken = token.githubRefreshToken;
        s.githubTokenExpiry = token.githubTokenExpiry;

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

        const MANAGE_ROLES = [
          'SUPER_ADMIN',
          'ADMIN',
          'AVOCAT',
          'ASSOCIE',
        ];

        const FINANCE_ROLES = [
          'SUPER_ADMIN',
          'ADMIN',
          'AVOCAT',
          'ASSOCIE',
          'COMPTABLE',
        ];

        const userRole = token.role as string;

        sUser.permissions = {
          canManageTenants:
            userRole === 'SUPER_ADMIN',

          canManageClients:
            MANAGE_ROLES.includes(userRole) ||
            userRole === 'SECRETAIRE',

          canManageDossiers:
            MANAGE_ROLES.includes(userRole) ||
            userRole === 'COLLABORATEUR',

          canViewOwnDossier:
            userRole === 'CLIENT',

          canManageFactures:
            FINANCE_ROLES.includes(userRole),

          canViewOwnFactures:
            userRole === 'CLIENT',

          canAccessAnalytics:
            FINANCE_ROLES.includes(userRole),

          canManageUsers:
            MANAGE_ROLES.includes(userRole),

          canManageCalendar:
            STAFF_ROLES.includes(userRole),

          canManageDocuments:
            STAFF_ROLES.filter(
              (role) => role !== 'STAGIAIRE'
            ).includes(userRole),

          canAccessRbacDossiers:
            rbac.permissions.includes('*') ||
            rbac.permissions.includes(
              RBAC_PERMISSIONS.DOSSIERS_READ
            ),

          canAccessRbacFactures:
            rbac.permissions.includes('*') ||
            rbac.permissions.includes(
              RBAC_PERMISSIONS.FACTURES_READ
            ),
        };
      }

      return session;
    },
  },

  /**
   * Pages personnalisées
   */
  pages: {
    signIn: '/fr/auth/login',
    error: '/fr/auth/error',
  },

  /**
   * Session JWT
   */
  session: {
    strategy: 'jwt',
    maxAge: 8 * 60 * 60,
    updateAge: 15 * 60,
  },

  /**
   * Cookies sécurisés
   */
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

/**
 * Handler NextAuth
 */
const handler = NextAuth(authOptions);

/**
 * App Router
 */
const GET = async (
  req: NextRequest,
  context?: any
): Promise<NextResponse> => {
  try {
    const res = await handler(req, context);

    return (
      res instanceof Response
        ? res
        : new NextResponse(res)
    ) as NextResponse;
  } catch (error) {
    console.error('[AUTH_ROUTE] GET Error:', error);

    return NextResponse.json(
      {
        error: 'Authentication error',
      },
      {
        status: 500,
      }
    );
  }
};

const POST = withLoginRateLimit(
  async (
    req: NextRequest,
    context?: any
  ): Promise<NextResponse> => {
    try {
      const res = await handler(req, context);

      return (
        res instanceof Response
          ? res
          : new NextResponse(res)
      ) as NextResponse;
    } catch (error) {
      console.error('[AUTH_ROUTE] POST Error:', error);

      return NextResponse.json(
        {
          error: 'Authentication error',
        },
        {
          status: 500,
        }
      );
    }
  }
);

export { GET, POST };