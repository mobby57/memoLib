/**
 * API Route: AI Health Check
 *
 * Returns health status of ALL AI providers (Ollama + Cloud)
 */

import { NextResponse } from 'next/server';
import { hybridAI } from '@/lib/ai/hybrid-client';

export async function GET() {
  try {
    const availability = await hybridAI.checkAvailability();
    
    const hasAnyProvider = availability.ollama || availability.cloud || availability.cloudflare;
    const status = hasAnyProvider ? 'healthy' : 'degraded';

    return NextResponse.json({
      status,
      providers: {
        ollama: {
          available: availability.ollama,
          type: 'local',
          cost: 'gratuit',
        },
        cloud: {
          available: availability.cloud,
          provider: availability.cloudProvider,
          type: 'cloud',
          cost: 'payant (budget contrôlé)',
        },
        cloudflare: {
          available: availability.cloudflare,
          type: 'legacy',
        },
      },
      recommended: availability.recommended,
      preferred: hybridAI.getPreferredProvider(),
      fallbackMode: !hasAnyProvider ? 'regex' : null,
      note: !hasAnyProvider 
        ? 'Aucun provider IA actif. Les fonctions IA utilisent le mode regex (dégradé). Configurez MISTRAL_API_KEY ou OPENAI_API_KEY pour activer l\'IA.'
        : undefined,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json({
      status: 'error',
      error: error instanceof Error ? error.message : 'Health check failed',
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
}
