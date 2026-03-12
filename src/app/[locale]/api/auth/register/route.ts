import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
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

    if (!prenom || !nom || !email || !password) {
      return NextResponse.json(
        { error: 'Champs obligatoires manquants' },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Le mot de passe doit contenir au moins 8 caractères' },
        { status: 400 }
      );
    }

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

    const hashedPassword = await bcrypt.hash(password, 12);

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
          status: 'active',
          tenant: {
            connect: { id: tenant.id },
          },
        },
      });

      return { tenant, user };
    });

    logger.info(
      `[REGISTER] Nouvel avocat inscrit: ${result.user.email} - Cabinet: ${result.tenant.name}`
    );

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
}
