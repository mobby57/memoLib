import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import {
  loadWorkflowConfig,
  saveWorkflowConfig,
  validateWorkflowConfig,
  DEFAULT_WORKFLOW_CONFIG,
  PRESET_CONFIGS,
} from '@/lib/workflows/workflow-config';

/**
 * GET /api/workflows/config
 * Récupère la configuration actuelle
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const config = await loadWorkflowConfig();
    
    return NextResponse.json(config);
  } catch (error) {
    console.error('Erreur GET config:', error);
    return NextResponse.json(
      { error: 'Erreur chargement configuration' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/workflows/config
 * Sauvegarde une nouvelle configuration
 */
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const newConfig = await request.json();

    // Valider la configuration
    const validation = validateWorkflowConfig(newConfig);
    if (!validation.valid) {
      return NextResponse.json(
        { error: 'Configuration invalide', errors: validation.errors },
        { status: 400 }
      );
    }

    // Sauvegarder
    await saveWorkflowConfig(newConfig);

    return NextResponse.json({
      success: true,
      message: 'Configuration sauvegardée avec succès',
    });
  } catch (error) {
    console.error('Erreur PUT config:', error);
    return NextResponse.json(
      { error: 'Erreur sauvegarde configuration' },
      { status: 500 }
    );
  }
}
