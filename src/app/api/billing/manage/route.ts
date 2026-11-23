/**
 * API Route: POST /api/billing/manage
 * 
 * DISABLED FOR MVP - Stripe integration not configured yet
 * Re-enable when STRIPE_SECRET_KEY is set
 */

/*
import { getServerSessionCompat } from '@/lib/auth/getServerSessionCompat';
import { NextRequest, NextResponse } from 'next/server';
import { getSecurePrisma } from '@/lib/prisma';;
import { createCustomerPortalSession } from '@/lib/billing/stripe-client';
*/

import { NextResponse } from 'next/server';

// DISABLED FOR MVP - Stripe integration not configured
// To re-enable: set STRIPE_SECRET_KEY and uncomment the imports above
export async function POST() {
  return NextResponse.json(
    { error: 'Stripe billing portal not available in MVP' },
    { status: 503 }
  );
}

