import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { PRESET_CONFIGS } from '@/lib/workflows/workflow-config';

/**
 * GET /api/workflows/config/preset/[name]
 * Charge une configuration prédéfinie
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { name: string } }
) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const presetName = params.name.toUpperCase();
    const preset = PRESET_CONFIGS[presetName as keyof typeof PRESET_CONFIGS];

    if (!preset) {
      return NextResponse.json(
        { error: 'Preset inconnu' },
        { status: 404 }
      );
    }

    return NextResponse.json(preset);
  } catch (error) {
    console.error('Erreur GET preset:', error);
    return NextResponse.json(
      { error: 'Erreur chargement preset' },
      { status: 500 }
    );
  }
}
