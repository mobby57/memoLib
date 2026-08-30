/**
 * Middleware Feature Gate — MemoLib
 *
 * HOF (Higher-Order Function) pour protéger les API routes
 * avec vérification automatique du plan.
 *
 * Usage dans une route API :
 *
 *   import { withFeatureGate } from '@/lib/billing/feature-gate-middleware';
 *
 *   export const POST = withFeatureGate('ai_draft_reply', async (request, context) => {
 *     // Code exécuté seulement si le tenant a accès
 *     return NextResponse.json({ success: true });
 *   });
 *
 * Usage avec plusieurs features (toutes requises) :
 *
 *   export const POST = withFeatureGate(
 *     ['ai_draft_reply', 'emails_inbound'],
 *     handler
 *   );
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { Feature, checkFeatureAccess, FeatureCheckResult } from './features';

interface RouteContext {
  params?: Record<string, string>;
}

type RouteHandler = (
  request: NextRequest,
  context: RouteContext & { featureGate: FeatureCheckResult }
) => Promise<NextResponse> | NextResponse;

/**
 * Protège une route API par feature gate.
 * Extrait automatiquement le tenantId de la session.
 */
export function withFeatureGate(
  feature: Feature | Feature[],
  handler: RouteHandler,
): (request: NextRequest, context?: RouteContext) => Promise<NextResponse> {
  return async (request: NextRequest, context: RouteContext = {}) => {
    // 1. Vérifier la session
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Non autorisé', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    const tenantId = (session.user as any).tenantId;
    if (!tenantId) {
      return NextResponse.json(
        { error: 'Tenant non identifié', code: 'NO_TENANT' },
        { status: 403 }
      );
    }

    // 2. Vérifier les features
    const features = Array.isArray(feature) ? feature : [feature];
    
    for (const f of features) {
      const result = await checkFeatureAccess(tenantId, f);
      
      if (!result.allowed) {
        return NextResponse.json(
          {
            error: 'FEATURE_GATED',
            feature: result.feature,
            currentTier: result.currentTier,
            requiredTier: result.requiredTier,
            message: result.message,
            upgradeUrl: '/settings/billing?upgrade=true',
          },
          { status: 403 }
        );
      }
    }

    // 3. Exécuter le handler
    const firstFeature = features[0];
    const gateResult = await checkFeatureAccess(tenantId, firstFeature);
    
    return handler(request, { ...context, featureGate: gateResult });
  };
}

/**
 * Version légère : vérifie juste le feature gate et retourne le résultat.
 * Utile quand on veut gérer le comportement manuellement (soft gate).
 *
 * Usage :
 *   const access = await softFeatureCheck(request, 'ai_draft_reply');
 *   if (!access.allowed) {
 *     // Montrer un message d'upgrade au lieu de bloquer
 *   }
 */
export async function softFeatureCheck(
  request: NextRequest,
  feature: Feature,
): Promise<FeatureCheckResult & { tenantId: string | null }> {
  const session = await getServerSession(authOptions);
  const tenantId = (session?.user as any)?.tenantId || null;

  if (!tenantId) {
    return {
      allowed: false,
      feature,
      currentTier: 'PILOT',
      requiredTier: 'PILOT',
      upgradeRequired: false,
      message: 'Utilisateur non authentifié',
      tenantId: null,
    };
  }

  const result = await checkFeatureAccess(tenantId, feature);
  return { ...result, tenantId };
}
