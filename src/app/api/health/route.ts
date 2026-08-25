import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  const timestamp = new Date().toISOString();

  try {
    await prisma.$queryRaw`SELECT 1`;

    return NextResponse.json(
      {
        status: 'healthy',
        timestamp,
        services: {
          api: 'up',
          database: 'up',
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[Health] Database check failed:', error);

    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp,
        services: {
          api: 'up',
          database: 'down',
        },
      },
      { status: 503 }
    );
  }
}
