import { NextResponse } from 'next/server';

// ============================================
// GET /api/auth/test
// Route de test simple pour vérifier l'API Auth
// ============================================

export async function GET() {
  return NextResponse.json({ 
    status: 'ok',
    service: 'Authentication API',
    message: 'Auth API is working correctly',
    timestamp: new Date().toISOString(),
    version: '2.0',
  });
}
