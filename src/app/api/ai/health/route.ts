/**
 * API Route: AI Health Check
 *
 * Returns health status of ALL AI providers (Ollama + Cloud)
 */

import { auth } from '@/lib/clerk-auth';
import { NextResponse } from 'next/server';
import { hybridAI } from '@/lib/ai/hybrid-client';
import { withAIRateLimit } from '@/lib/middleware/rate-limit';

export const GET = withAIRateLimit(async () => {
  const { user } = await auth();
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
  if (!user.tenantId) return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });

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
          type: 'cloud',
          cost: 'payant (budget contrôlé)',
        },
        cloudflare: {
          available: availability.cloudflare,
          type: 'legacy',
        },
      },
      fallbackMode: !hasAnyProvider ? 'regex' : null,
      note: !hasAnyProvider 
        ? 'Aucun provider IA actif. Les fonctions IA utilisent le mode regex (dégradé). Configurez MISTRAL_API_KEY ou OPENAI_API_KEY pour activer l\'IA.'
        : undefined,
      timestamp: new Date().toISOString(),
    });
  } catch {
    return NextResponse.json({
      status: 'error',
      error: 'Health check failed',
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
});
