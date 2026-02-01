import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';

export const dynamic = 'force-dynamic';

/**
 * POST /api/auth/register
 * Inscription d'un nouvel avocat avec création du cabinet (tenant)
 */
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

    // Validation basique
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

    // Récupérer le plan choisi
    const plan = await prisma.plan.findUnique({
      where: { name: planName || 'SOLO' },
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
      // 1. Créer le tenant (cabinet)
      const tenant = await tx.tenant.create({
        data: {
          id: randomUUID(),
          name: cabinetNom || `Cabinet ${nom}`,
          slug: `${nom.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`,
          planId: plan.id,
          
          // Compteurs initiaux
          currentWorkspaces: 0,
          currentDossiers: 0,
          currentClients: 0,
          currentUsers: 1,
          currentStorageGb: 0,
          
          // Métadonnées
          settings: {
            numeroBarreau,
            adresse,
            ville,
            codePostal,
            telephone,
          },
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
          tenantId: tenant.id,
          isActive: true,
          emailVerified: null, // À vérifier par email
        },
      });

      return { tenant, user };
    });

    // Log de l'inscription
    logger.info('[REGISTER] Nouvel avocat inscrit: ${result.user.email} - Cabinet: ${result.tenant.name}');

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
