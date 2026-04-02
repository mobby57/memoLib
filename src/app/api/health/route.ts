import { NextResponse } from 'next/server';

export async function GET() {
  // Health check rapide sans interroger la base de données
  return NextResponse.json(
    {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        api: 'up',
        database: 'optional', // La DB n'est pas requise pour le mode démo
      },
    },
    { status: 200 }
  );
}
