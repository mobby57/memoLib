/**
 * Consent gate helper for authenticated application routes. This is not the
 * Next.js root middleware: database access must remain in a Node.js runtime.
 */
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/clerk-auth';
import { prisma } from '@/lib/prisma';
import { CURRENT_PRIVACY_POLICY_VERSION } from '@/lib/compliance/gdpr';

const EXEMPT_PATHS = ['/api/auth', '/login', '/register', '/legal', '/privacy', '/_next', '/static'];
const REQUIRED_CONSENT_TYPE = 'essential';

export async function consentCheckMiddleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (EXEMPT_PATHS.some((path) => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  try {
    const { user } = await auth();
    if (!user) {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    if (!(await hasUserConsent(user.id, REQUIRED_CONSENT_TYPE))) {
      const redirect = new URL('/accept-cgu', request.url);
      redirect.searchParams.set('redirect', pathname);
      return NextResponse.redirect(redirect);
    }

    return NextResponse.next();
  } catch {
    return NextResponse.redirect(new URL('/login', request.url));
  }
}

export async function recordUserConsent(
  userId: string,
  type: 'essential' | 'analytics' | 'marketing' | 'personalization' | 'third_party',
  policyVersion: string
) {
  await prisma.userConsent.create({
    data: {
      userId,
      type,
      granted: true,
      policyVersion,
    },
  });
}

export async function hasUserConsent(userId: string, type: string): Promise<boolean> {
  const consent = await prisma.userConsent.findFirst({
    where: { userId, type, policyVersion: CURRENT_PRIVACY_POLICY_VERSION },
    orderBy: { grantedAt: 'desc' },
    select: { granted: true },
  });
  return consent?.granted ?? false;
}
