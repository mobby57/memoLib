import { getServerSessionCompat } from '@/lib/auth/getServerSessionCompat';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
export async function GET() {
  const session = await getServerSessionCompat();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const tenantId = (session.user as any).tenantId;
  if (!tenantId) return NextResponse.json({ needsOnboarding: true, steps: getEmptySteps() });

  const [dossierCount, emailCount, clientCount] = await Promise.all([
    prisma.dossier.count({ where: { tenantId } }),
    prisma.email.count({ where: { tenantId } }),
    prisma.client.count({ where: { tenantId } }),
  ]);

  const steps = {
    accountCreated: true,
    firstClient: clientCount > 0,
    firstEmail: emailCount > 0,
    firstDossier: dossierCount > 0,
  };

  const completed = Object.values(steps).every(Boolean);

  return NextResponse.json({ needsOnboarding: !completed, steps, stats: { dossierCount, emailCount, clientCount } });
}

function getEmptySteps() {
  return { accountCreated: true, firstClient: false, firstEmail: false, firstDossier: false };
}
