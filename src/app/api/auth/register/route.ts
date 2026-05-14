import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { prisma } from '@/lib/prisma';
import { checkPasswordStrength } from '@/lib/security/password-strength';
import { withRateLimit } from '@/lib/middleware/rate-limit';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';

export const dynamic = 'force-dynamic';

/**
 * POST /api/auth/register
 * Rate-limited: 5 req / 15 min par IP
 */
export const POST = withRateLimit(async function registerHandler(request: NextRequest) {
  try {
    const data = await request.json();

    const {
      prenom,
      nom,
      email,
      password,
      telephone,
      cabinetNom,
      numeroBarreau,
      adresse,
      ville,
      codePostal,
      plan: planName,
    } = data;

    // Validation basique
    if (!prenom || !nom || !email || !password) {
      return NextResponse.json(
        { error: 'Champs obligatoires manquants' },
        { status: 400 }
      );
    }

    const pwStrength = checkPasswordStrength(password);
    if (!pwStrength.valid) {
      return NextResponse.json(
        { error: pwStrength.errors[0], details: pwStrength.errors },
        { status: 400 }
      );
    }

    // Vérifier si l'email existe déjà
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'Un compte existe déjà avec cet email' },
        { status: 409 }
      );
    }

    const requestedPlan = String(planName || 'SOLO').toUpperCase();
    const planAliases: Record<string, string[]> = {
      SOLO: ['SOLO', 'STARTER'],
      CABINET: ['CABINET', 'PRO'],
      ENTERPRISE: ['ENTERPRISE'],
    };

    const candidatePlanNames = planAliases[requestedPlan] || [requestedPlan];

    const plan = await prisma.plan.findFirst({
      where: {
        name: {
          in: candidatePlanNames,
          mode: 'insensitive',
        },
      },
    });

    if (!plan) {
      return NextResponse.json(
        { error: 'Plan tarifaire invalide' },
        { status: 400 }
      );
    }

    // Hash du mot de passe
    const hashedPassword = await bcrypt.hash(password, 12);

    // Créer le tenant (cabinet) et l'utilisateur en transaction
    const result = await prisma.$transaction(async (tx) => {
      const baseSubdomain = (cabinetNom || nom || 'cabinet')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 30) || 'cabinet';

      const uniqueSuffix = Date.now().toString().slice(-6);
      const subdomain = `${baseSubdomain}-${uniqueSuffix}`;

      // 1. Créer le tenant (cabinet)
      const tenant = await tx.tenant.create({
        data: {
          id: randomUUID(),
          name: cabinetNom || `Cabinet ${nom}`,
          subdomain,
          planId: plan.id,

          // Compteurs initiaux
          currentWorkspaces: 0,
          currentDossiers: 0,
          currentClients: 0,
          currentUsers: 1,
          currentStorageGb: 0,
        },
      });

      // 2. Créer l'utilisateur avocat (admin du cabinet)
      const user = await tx.user.create({
        data: {
          id: randomUUID(),
          email: email.toLowerCase(),
          name: `${prenom} ${nom}`,
          password: hashedPassword,
          role: 'AVOCAT',
          status: 'active',
          tenant: {
            connect: { id: tenant.id },
          },
        },
      });

      // 3. Créer la subscription (essai gratuit)
      const subscription = await tx.subscription.create({
        data: {
          id: randomUUID(),
          tenantId: tenant.id,
          planId: plan.id,
          status: 'trialing',
          billingCycle: 'monthly',
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 jours
          trialEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          pricePerMonth: plan.priceMonthly,
          currency: plan.currency,
        },
      });

      // 4. Créer les réglages par défaut
      const settings = await tx.tenantSettings.create({
        data: {
          id: randomUUID(),
          tenantId: tenant.id,
          maxDossiers: plan.maxDossiers,
          maxUsers: plan.maxUsers,
          storageLimit: plan.maxStorageGb * 1000, // Convert to MB if needed
          ollamaEnabled: true,
        },
      });

      return { tenant, user, subscription, settings };
    });

    // Log de l'inscription
    logger.info(`[REGISTER] Nouvel avocat inscrit: ${result.user.email} - Cabinet: ${result.tenant.name}`);

    return NextResponse.json({
      success: true,
      message: 'Inscription réussie',
      user: {
        id: result.user.id,
        email: result.user.email,
        name: result.user.name,
      },
      tenant: {
        id: result.tenant.id,
        name: result.tenant.name,
      },
    });

  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const isDatabaseUnavailable = message.includes("Can't reach database server");

    logger.error('[REGISTER] Erreur inscription', error);

    if (isDatabaseUnavailable) {
      return NextResponse.json(
        { error: 'Service d’inscription temporairement indisponible (base de données).' },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { error: 'Erreur lors de l\'inscription' },
      { status: 500 }
    );
  }
});
