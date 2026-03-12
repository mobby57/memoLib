import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { buildRbacContext } from '@/lib/auth/rbac';

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const context = buildRbacContext({
    role: session.user.role,
    groups: session.user.groups,
  });

  return NextResponse.json({
    userId: session.user.id,
    role: context.role,
    groups: context.groups,
    permissions: context.permissions,
  });
}
