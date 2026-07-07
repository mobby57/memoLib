import { prisma } from '@/lib/prisma';
import { checkPasswordStrength } from '@/lib/security/password-strength';
import { logger } from '@/lib/logger';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';

// --- Types ---

export interface RegistrationInput {
  prenom: string;
  nom: string;
  email: string;
  password: string;
  telephone?: string;
  cabinetNom?: string;
  numeroBarreau?: string;
  adresse?: string;
  ville?: string;
  codePostal?: string;
  plan?: string;
}

export type RegistrationResult =
  | { success: true; user: { id: string; email: string; name: string }; tenant: { id: string; name: string } }
  | { success: false; error: string; status: number; details?: string[] };

interface RegistrationOptions {
  /** Si true, l'utilisateur est créé en status 'pending_verification' */
  requireEmailVerification?: boolean;
  /** Si true, crée subscription + tenantSettings (route legacy) */
  createSubscription?: boolean;
}

// --- Helpers ---

const PLAN_ALIASES: Record<string, string[]> = {
  SOLO: ['SOLO', 'STARTER'],
  CABINET: ['CABINET', 'PRO'],
  ENTERPRISE: ['ENTERPRISE'],
};

function generateSubdomain(cabinetNom: string | undefined, nom: string): string {
  const baseSubdomain = (cabinetNom || nom || 'cabinet')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 30) || 'cabinet';

  const uniqueSuffix = Date.now().toString().slice(-6);
  return `${baseSubdomain}-${uniqueSuffix}`;
}

// --- Main Service ---

/**
 * Logique métier d'inscription partagée entre les deux routes register.
 * Valide les données, crée le tenant + utilisateur en transaction.
 */
export async function registerUser(
  input: RegistrationInput,
  options: RegistrationOptions = {}
): Promise<RegistrationResult> {
  const { requireEmailVerification = false, createSubscription = true } = options;
  const { prenom, nom, email, password, cabinetNom, plan: planName } = input;

  // 1. Validation champs obligatoires
  if (!prenom || !nom || !email || !password) {
    return { success: false, error: 'Champs obligatoires manquants', status: 400 };
  }

  // 2. Validation format email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { success: false, error: "Format d'email invalide", status: 400 };
  }

  // 3. Validation force mot de passe
  const pwStrength = checkPasswordStrength(password);
  if (!pwStrength.valid) {
    return {
      success: false,
      error: pwStrength.errors[0] || 'Mot de passe trop faible',
      status: 400,
      details: pwStrength.errors,
    };
  }

  // 4. Vérification doublon email
  const existingUser = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
  });

  if (existingUser) {
    return {
      success: false,
      error: 'Impossible de créer le compte. Vérifiez vos informations ou essayez de vous connecter.',
      status: 409,
    };
  }

  // 5. Résolution du plan
  const requestedPlan = String(planName || 'SOLO').toUpperCase();
  const candidatePlanNames = PLAN_ALIASES[requestedPlan] || [requestedPlan];

  const plan = await prisma.plan.findFirst({
    where: { name: { in: candidatePlanNames, mode: 'insensitive' } },
  });

  if (!plan) {
    return { success: false, error: 'Plan tarifaire invalide', status: 400 };
  }

  // 6. Hash mot de passe
  const hashedPassword = await bcrypt.hash(password, 12);

  // 7. Création en transaction
  const result = await prisma.$transaction(async (tx) => {
    const subdomain = generateSubdomain(cabinetNom, nom);

    const tenant = await tx.tenant.create({
      data: {
        id: randomUUID(),
        name: cabinetNom || `Cabinet ${nom}`,
        subdomain,
        planId: plan.id,
        currentWorkspaces: 0,
        currentDossiers: 0,
        currentClients: 0,
        currentUsers: 1,
        currentStorageGb: 0,
      },
    });

    const user = await tx.user.create({
      data: {
        id: randomUUID(),
        email: email.toLowerCase(),
        name: `${prenom} ${nom}`,
        password: hashedPassword,
        role: 'AVOCAT',
        status: requireEmailVerification ? 'pending_verification' : 'active',
        emailVerified: requireEmailVerification ? null : undefined,
        tenantId: tenant.id,
      },
    });

    if (createSubscription) {
      await tx.subscription.create({
        data: {
          id: randomUUID(),
          tenantId: tenant.id,
          planId: plan.id,
          status: 'trialing',
          billingCycle: 'monthly',
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
          trialEnd: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
          pricePerMonth: plan.priceMonthly,
          currency: plan.currency,
          updatedAt: new Date(),
        },
      });

      await tx.tenantSettings.create({
        data: {
          id: randomUUID(),
          tenantId: tenant.id,
          maxDossiers: plan.maxDossiers,
          maxUsers: plan.maxUsers,
          storageLimit: plan.maxStorageGb * 1000,
          ollamaEnabled: true,
          updatedAt: new Date(),
        },
      });
    }

    return { tenant, user };
  });

  logger.info(
    `[REGISTER] Nouvel avocat inscrit${requireEmailVerification ? ' (pending)' : ''}: ${result.user.email} - Cabinet: ${result.tenant.name}`
  );

  return {
    success: true,
    user: { id: result.user.id, email: result.user.email, name: result.user.name! },
    tenant: { id: result.tenant.id, name: result.tenant.name },
  };
}
