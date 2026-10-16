/**
 * API Route: POST /api/saas/signup
 * 
 * Point d'entrée unique pour l'inscription SaaS.
 * Un avocat remplit le formulaire → tout est provisionné automatiquement.
 */

import { NextRequest, NextResponse } from 'next/server';
import { saasSignup, SaasSignupInput } from '@/lib/services/saas-provisioning';
import { checkRateLimit } from '@/lib/security/rate-limiter';

export async function POST(req: NextRequest) {
  // Rate limiting: 3 inscriptions / 15 min par IP
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown';
  const rateLimitResult = checkRateLimit(`signup:${ip}`, { windowMs: 15 * 60 * 1000, maxRequests: 3 });
  if (!rateLimitResult.allowed) {
    return NextResponse.json(
      { error: 'Trop de tentatives. Réessayez dans quelques minutes.' },
      { status: 429 }
    );
  }

  try {
    const body = await req.json();

    // Validation des champs obligatoires
    const { firstName, lastName, email, password, cabinetName, plan, billingPeriod } = body;

    if (!firstName || !lastName || !email || !password || !cabinetName) {
      return NextResponse.json(
        { error: 'Tous les champs obligatoires doivent être remplis.' },
        { status: 400 }
      );
    }

    if (!email.includes('@') || email.length < 5) {
      return NextResponse.json(
        { error: 'Adresse email invalide.' },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Le mot de passe doit contenir au moins 8 caractères.' },
        { status: 400 }
      );
    }

    const validPlans = ['SOLO', 'CABINET', 'ENTERPRISE'];
    const selectedPlan = validPlans.includes(plan) ? plan : 'SOLO';

    const input: SaasSignupInput = {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.trim().toLowerCase(),
      password,
      phone: body.phone?.trim(),
      cabinetName: cabinetName.trim(),
      barreauVille: body.barreauVille?.trim(),
      plan: selectedPlan,
      billingPeriod: billingPeriod === 'yearly' ? 'yearly' : 'monthly',
    };

    const result = await saasSignup(input);

    return NextResponse.json(result, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erreur interne';

    if (message.includes('existe déjà')) {
      return NextResponse.json({ error: message }, { status: 409 });
    }

    console.error('SaaS signup error:', error);
    return NextResponse.json(
      { error: 'Une erreur est survenue lors de la création de votre compte. Veuillez réessayer.' },
      { status: 500 }
    );
  }
}
