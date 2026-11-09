import { NextRequest, NextResponse } from 'next/server';
import { getBlockedFeature } from '@/lib/feature-flags';

/**
 * API Feature Gate Middleware
 * 
 * Blocks API routes for disabled feature modules.
 * Returns a clean 404 with a message indicating the feature is not available.
 * 
 * Usage in API routes:
 *   import { featureGateResponse } from '@/lib/middleware/feature-gate';
 *   
 *   export async function GET(request: NextRequest) {
 *     const blocked = featureGateResponse(request);
 *     if (blocked) return blocked;
 *     // ... normal handler
 *   }
 * 
 * Or use the wrapper:
 *   import { withFeatureGate } from '@/lib/middleware/feature-gate';
 *   
 *   export const GET = withFeatureGate(async (request) => {
 *     // ... normal handler
 *   });
 */

/**
 * Check if the request should be blocked. Returns a 404 response if blocked, null otherwise.
 */
export function featureGateResponse(request: NextRequest): NextResponse | null {
  const pathname = request.nextUrl.pathname;
  const blockedModule = getBlockedFeature(pathname);

  if (blockedModule) {
    return NextResponse.json(
      {
        error: 'Feature not available',
        message: `Le module "${blockedModule}" n'est pas disponible dans votre plan actuel.`,
        code: 'FEATURE_DISABLED',
        module: blockedModule,
      },
      { status: 404 }
    );
  }

  return null;
}

/**
 * HOF wrapper that adds feature gate check before the handler
 */
export function withFeatureGate(
  handler: (request: NextRequest, context?: unknown) => Promise<NextResponse> | NextResponse
) {
  return async (request: NextRequest, context?: unknown) => {
    const blocked = featureGateResponse(request);
    if (blocked) return blocked;
    return handler(request, context);
  };
}
