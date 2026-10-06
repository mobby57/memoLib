import { auth } from '@/lib/clerk-auth';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
export async function GET() {
  const { user } = await auth();
    const session = user ? { user } : null;
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const tenantId = (user as any).tenantId;
  if (!tenantId) return NextResponse.json({ needsOnboarding: true, steps: getEmptySteps() });

  const [dossierCount, emailCount, clientCount, emailAccountCount] = await Promise.all([
    prisma.dossier.count({ where: { tenantId } }),
    prisma.email.count({ where: { tenantId } }),
    prisma.client.count({ where: { tenantId } }),
    prisma.emailAccount.count({ where: { tenantId, isActive: true } }),
  ]);

  const steps = {
    accountCreated: true,
    emailConnected: emailAccountCount > 0,
    firstClient: clientCount > 0,
    firstEmail: emailCount > 0,
    firstDossier: dossierCount > 0,
  };

  const completed = Object.values(steps).every(Boolean);

  return NextResponse.json({
    needsOnboarding: !completed,
    steps,
    stats: { dossierCount, emailCount, clientCount, emailAccountCount },
  });
}

function getEmptySteps() {
  return {
    accountCreated: true,
    emailConnected: false,
    firstClient: false,
    firstEmail: false,
    firstDossier: false,
  };
}




