import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';

export const dynamic = 'force-dynamic';

type RegisterPayload = {
  prenom?: string;
  nom?: string;
  email?: string;
  password?: string;
  telephone?: string;
  cabinetNom?: string;
  numeroBarreau?: string;
  adresse?: string;
  ville?: string;
  codePostal?: string;
  plan?: string;
};

function buildBillingAddress(data: Pick<RegisterPayload, 'adresse' | 'codePostal' | 'ville'>): string | null {
  const parts = [data.adresse, [data.codePostal, data.ville].filter(Boolean).join(' ') || undefined]
    .filter((value): value is string => Boolean(value && value.trim()))
    .map((value) => value.trim());

  return parts.length > 0 ? parts.join(', ') : null;
}

function validatePayload(data: RegisterPayload): string | null {
  if (!data.prenom || !data.nom || !data.email || !data.password) {
    return 'Champs obligatoires manquants';
  }

  if (data.password.length < 8) {
    return 'Le mot de passe doit contenir au moins 8 caractères';
  }

  return null;
}

/**
 * POST /api/auth/register
 * Inscription d'un nouvel avocat avec création du cabinet (tenant)
 */
export async function POST(request: NextRequest) {
  try {
    const data = (await request.json()) as RegisterPayload;
    
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

    const validationError = validatePayload(data);
    if (validationError) {
      return NextResponse.json(
        { error: validationError },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase();
    const normalizedPhone = telephone?.trim() || null;
    const billingAddress = buildBillingAddress({ adresse, codePostal, ville });

    // Vérifier si l'email existe déjà
    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'Un compte existe déjà avec cet email' },
        { status: 409 }
      );
    }

    // Récupérer le plan choisi
    let plan = await prisma.plan.findUnique({
      where: { name: planName || 'SOLO' },
    });

    // Compatibilité avec les labels front (SOLO/CABINET/ENTERPRISE) ou autres variantes
    if (!plan && planName) {
      const normalized = planName.toUpperCase();
      const aliases: Record<string, string[]> = {
        SOLO: ['SOLO', 'STARTER', 'BASIC'],
        CABINET: ['CABINET', 'PRO', 'PROFESSIONAL'],
        ENTERPRISE: ['ENTERPRISE', 'BUSINESS', 'PREMIUM'],
      };

      const candidates = aliases[normalized] ?? [planName];
      plan = await prisma.plan.findFirst({
        where: {
          OR: candidates.map((name) => ({ name })),
          isActive: true,
        },
      });
    }

    if (!plan) {
      plan = await prisma.plan.findFirst({
        where: { isActive: true },
        orderBy: { priceMonthly: 'asc' },
      });
    }

    if (!plan) {
      return NextResponse.json(
        { error: 'Plan tarifaire invalide' },
        { status: 400 }
      );
    }

    // Hash du mot de passe
    const hashedPassword = await bcrypt.hash(password, 12);

    const baseSlug = nom.toLowerCase().replace(/\s+/g, '-');
    const uniqueSuffix = Date.now().toString();

    // Créer le tenant (cabinet) et l'utilisateur en transaction
    const result = await prisma.$transaction(async (tx) => {
      // 1. Créer le tenant (cabinet)
      const tenant = await tx.tenant.create({
        data: {
          id: randomUUID(),
          name: cabinetNom || `Cabinet ${nom}`,
          subdomain: `${baseSlug}-${uniqueSuffix}`.slice(0, 63),
          planId: plan.id,
          billingEmail: normalizedEmail,
          billingAddress,
          
          // Compteurs initiaux
          currentWorkspaces: 0,
          currentDossiers: 0,
          currentClients: 0,
          currentUsers: 1,
          currentStorageGb: 0,
          settings: {
            create: {
              numeroBarreau: numeroBarreau?.trim() || null,
              adresse: adresse?.trim() || null,
              ville: ville?.trim() || null,
              codePostal: codePostal?.trim() || null,
              telephone: normalizedPhone,
            },
          },
        },
      });

      // 2. Créer l'utilisateur avocat (admin du cabinet)
      const user = await tx.user.create({
        data: {
          id: randomUUID(),
          email: normalizedEmail,
          name: `${prenom} ${nom}`,
          password: hashedPassword,
          phone: normalizedPhone,
          role: 'AVOCAT',
          tenant: { connect: { id: tenant.id } },
        },
      });

      return { tenant, user };
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
    logger.error('[REGISTER] Erreur:', { error });
    return NextResponse.json(
      { error: 'Erreur lors de l\'inscription' },
      { status: 500 }
    );
  }
}
