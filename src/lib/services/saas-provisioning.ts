/**
 * 🚀 SaaS Auto-Provisioning Service
 * 
 * Orchestre le flow complet pour un avocat solo:
 * 1. Inscription (compte + tenant + settings)
 * 2. Création client Stripe + Checkout session
 * 3. Provisioning automatique à la confirmation Stripe
 * 4. Email de bienvenue avec accès immédiat
 * 
 * Objectif: avocat opérationnel en < 2 minutes, 0 compétence technique.
 */

import crypto from 'crypto';
import { prisma } from '@/lib/prisma';
import { createStripeCustomer, createCheckoutSession } from '@/lib/billing/stripe-client';
import { getStripePriceId } from '@/lib/billing/plans';
import { logger } from '@/lib/logger';
import { sendEmail } from '@/lib/email/email-service';

// ============================================
// TYPES
// ============================================

export interface SaasSignupInput {
  // Avocat
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone?: string;
  
  // Cabinet
  cabinetName: string;
  barreauVille?: string;
  
  // Plan
  plan: 'SOLO' | 'CABINET' | 'ENTERPRISE';
  billingPeriod: 'monthly' | 'yearly';
}

export interface SaasSignupResult {
  success: boolean;
  userId: string;
  tenantId: string;
  stripeCheckoutUrl: string | null;
  dashboardUrl: string;
  message: string;
}

// ============================================
// PLAN CONFIGURATION
// ============================================

const PLAN_CONFIG = {
  SOLO: {
    dbName: 'solo',
    maxDossiers: 50,
    maxUsers: 1,
    maxClients: 100,
    storageGb: 5,
    aiEnabled: true,
    trialDays: 14,
  },
  CABINET: {
    dbName: 'cabinet',
    maxDossiers: 500,
    maxUsers: 10,
    maxClients: 1000,
    storageGb: 50,
    aiEnabled: true,
    trialDays: 14,
  },
  ENTERPRISE: {
    dbName: 'enterprise',
    maxDossiers: -1, // illimité
    maxUsers: 50,
    maxClients: -1,
    storageGb: 200,
    aiEnabled: true,
    trialDays: 14,
  },
};

// ============================================
// SERVICE PRINCIPAL
// ============================================

/**
 * Inscription SaaS complète — de 0 à opérationnel
 */
export async function saasSignup(input: SaasSignupInput): Promise<SaasSignupResult> {
  const { firstName, lastName, email, password, cabinetName, plan, billingPeriod } = input;
  const planConfig = PLAN_CONFIG[plan];
  
  // 1. Vérifier que l'email n'existe pas déjà
  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    throw new Error('Un compte existe déjà avec cette adresse email.');
  }

  // 2. Générer le subdomain
  const subdomain = generateSubdomain(cabinetName);

  // 3. Hasher le mot de passe
  const bcrypt = await import('bcryptjs');
  const hashedPassword = await bcrypt.hash(password, 12);

  // 4. Créer tout en une transaction Prisma
  const result = await prisma.$transaction(async (tx) => {
    // 4a. Résoudre le plan depuis la DB
    const dbPlan = await tx.plan.findFirst({
      where: { 
        OR: [
          { name: planConfig.dbName },
          { name: plan.toLowerCase() },
          { name: plan },
        ]
      },
    });

    if (!dbPlan) {
      throw new Error(`Plan "${plan}" introuvable en base. Exécutez le seed: npx prisma db seed`);
    }

    // 4b. Créer le Tenant
    const tenant = await tx.tenant.create({
      data: {
        id: crypto.randomUUID(),
        name: cabinetName,
        subdomain,
        planId: dbPlan.id,
        status: 'active',
        updatedAt: new Date(),
      },
    });

    // 4c. Créer l'User (AVOCAT = admin de son cabinet)
    const user = await tx.user.create({
      data: {
        id: crypto.randomUUID(),
        email,
        name: `${firstName} ${lastName}`,
        password: hashedPassword,
        role: 'AVOCAT',
        tenantId: tenant.id,
        status: 'active',
        emailVerified: new Date(),
        updatedAt: new Date(),
      },
    });

    // 4d. Créer TenantSettings (IA cloud activée par défaut)
    await tx.tenantSettings.create({
      data: {
        id: crypto.randomUUID(),
        tenantId: tenant.id,
        maxDossiers: planConfig.maxDossiers,
        maxUsers: planConfig.maxUsers,
        storageLimit: planConfig.storageGb * 1024, // en Mo
        // IA: cloud par défaut (pas besoin d'Ollama)
        ollamaEnabled: false,
        ollamaUrl: '',
        ollamaModel: '',
        // Email
        emailEnabled: true,
        updatedAt: new Date(),
      },
    });

    // 4e. Créer la Subscription (trial 14j)
    const trialEnd = new Date();
    trialEnd.setDate(trialEnd.getDate() + planConfig.trialDays);

    await tx.subscription.create({
      data: {
        id: crypto.randomUUID(),
        tenantId: tenant.id,
        planId: dbPlan.id,
        status: 'trialing',
        trialEnd,
        currentPeriodStart: new Date(),
        currentPeriodEnd: trialEnd,
        pricePerMonth: dbPlan.priceMonthly,
        billingCycle: billingPeriod,
        updatedAt: new Date(),
      },
    });

    return { tenant, user };
  });

  // 5. Créer le client Stripe + Checkout session
  let stripeCheckoutUrl: string | null = null;
  
  try {
    const stripeCustomer = await createStripeCustomer({
      email,
      name: `${firstName} ${lastName}`,
      tenantId: result.tenant.id,
      metadata: {
        userId: result.user.id,
        plan,
        cabinetName,
      },
    });

    // Mettre à jour le tenant avec l'ID Stripe
    await prisma.tenant.update({
      where: { id: result.tenant.id },
      data: { stripeCustomerId: stripeCustomer.id },
    });

    // Créer la session Checkout
    const priceId = getStripePriceId(plan, billingPeriod);
    if (priceId) {
      const session = await createCheckoutSession({
        customerId: stripeCustomer.id,
        priceId,
        tenantId: result.tenant.id,
        successUrl: `${process.env.NEXT_PUBLIC_APP_URL}/fr/dashboard?welcome=true&plan=${plan}`,
        cancelUrl: `${process.env.NEXT_PUBLIC_APP_URL}/fr/pricing?cancelled=true`,
        trialDays: planConfig.trialDays,
      });
      stripeCheckoutUrl = session.url || null;
    }
  } catch (error) {
    // Stripe échoue → pas bloquant, l'avocat peut commencer en trial
    logger.warn('Stripe setup failed during signup, continuing with trial', { error, email });
  }

  // 6. Envoyer email de bienvenue
  try {
    await sendWelcomeEmail({
      email,
      firstName,
      cabinetName,
      plan,
      dashboardUrl: `${process.env.NEXT_PUBLIC_APP_URL}/fr/dashboard`,
    });
  } catch (error) {
    logger.warn('Welcome email failed', { error, email });
  }

  logger.info('SaaS signup completed', {
    userId: result.user.id,
    tenantId: result.tenant.id,
    plan,
    hasStripe: !!stripeCheckoutUrl,
  });

  return {
    success: true,
    userId: result.user.id,
    tenantId: result.tenant.id,
    stripeCheckoutUrl,
    dashboardUrl: `${process.env.NEXT_PUBLIC_APP_URL}/fr/dashboard`,
    message: stripeCheckoutUrl
      ? 'Compte créé ! Finalisez votre inscription via le paiement.'
      : 'Compte créé ! Votre essai gratuit de 14 jours commence maintenant.',
  };
}

/**
 * Appelé par le webhook Stripe après paiement réussi
 * Active pleinement le compte
 */
export async function activateAfterPayment(tenantId: string, stripeSubscriptionId: string): Promise<void> {
  await prisma.$transaction(async (tx) => {
    // Activer la subscription et enregistrer l'ID Stripe
    await tx.subscription.updateMany({
      where: { tenantId },
      data: {
        status: 'active',
        stripeSubscriptionId,
      },
    });

    // Confirmer le tenant
    await tx.tenant.update({
      where: { id: tenantId },
      data: { status: 'active' },
    });
  });

  logger.info('Tenant activated after Stripe payment', { tenantId, stripeSubscriptionId });
}

// ============================================
// HELPERS
// ============================================

function generateSubdomain(cabinetName: string): string {
  const base = cabinetName
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Supprimer accents
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 30);
  
  const suffix = Date.now().toString(36).slice(-4);
  return `${base}-${suffix}`;
}

async function sendWelcomeEmail(params: {
  email: string;
  firstName: string;
  cabinetName: string;
  plan: string;
  dashboardUrl: string;
}): Promise<void> {
  const { email, firstName, cabinetName, plan, dashboardUrl } = params;
  
  await sendEmail({
    to: email,
    subject: `🎉 Bienvenue sur MemoLib, ${firstName} !`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #1a1a1a;">Bienvenue sur MemoLib !</h1>
        <p>Bonjour ${firstName},</p>
        <p>Votre espace <strong>${cabinetName}</strong> est prêt (plan ${plan}).</p>
        
        <h2 style="color: #333;">🚀 Premiers pas</h2>
        <ol>
          <li><strong>Ajoutez votre premier client</strong> — 30 secondes</li>
          <li><strong>Connectez votre email</strong> — Gmail ou Outlook en 1 clic</li>
          <li><strong>Créez un dossier</strong> — L'IA analyse automatiquement</li>
        </ol>
        
        <a href="${dashboardUrl}" style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: bold; margin: 16px 0;">
          Accéder à mon cabinet →
        </a>
        
        <h2 style="color: #333;">✨ L'IA est déjà active</h2>
        <p>Aucune installation requise. L'IA analyse vos emails, détecte les urgences et génère des brouillons de réponse automatiquement.</p>
        
        <p style="color: #666; margin-top: 32px; font-size: 14px;">
          Essai gratuit 14 jours • Aucun engagement • Support : support@memolib.fr
        </p>
      </div>
    `,
  });
}
