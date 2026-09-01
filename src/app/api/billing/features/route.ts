import { auth } from '@/lib/clerk-auth';
// CLERK-MIGRATION: Remplacement user -> user (vérifier)
// CLERK-MIGRATION: Remplacement auth() -> auth()
// CLERK-MIGRATION: Remplacement user -> user (vérifier)
// CLERK-MIGRATION: Remplacement auth() -> auth()
/**
 * API : Features disponibles pour le tenant courant
 *
 * GET /api/billing/features
 * → Retourne la liste des features accessibles + le tier actuel
 *
 * Utilisé par le hook useFeatureGate pour éviter de dupliquer
 * la logique côté client (optionnel — le hook fonctionne aussi en standalone).
 */

import { NextRequest, NextResponse } from 'next/server';
import { getFeatureGate, FEATURE_CATEGORIES } from '@/lib/billing/features';

export async function GET(req: NextRequest) {
  const { user } = await auth();
    const session = user ? { user } : null;
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const tenantId = (user as any)?.tenantId;
  if (!tenantId) {
    return NextResponse.json({ error: 'No tenant' }, { status: 403 });
  }

  const gate = await getFeatureGate(tenantId);
  const available = gate.availableFeatures();
  const nextTier = gate.nextTierFeatures();

  return NextResponse.json({
    currentTier: gate.currentTier,
    availableFeatures: available,
    totalFeatures: Object.keys(FEATURE_CATEGORIES).reduce(
      (acc, cat) => acc + FEATURE_CATEGORIES[cat].features.length, 0
    ),
    nextTierUpgrade: nextTier ? {
      tier: nextTier.tier,
      newFeatures: nextTier.features,
      newFeaturesCount: nextTier.features.length,
    } : null,
    categories: Object.entries(FEATURE_CATEGORIES).map(([key, cat]) => ({
      key,
      label: cat.label,
      features: cat.features.map(f => ({
        id: f,
        available: available.includes(f),
      })),
    })),
  });
}




