import { NextRequest, NextResponse } from 'next/server';
import { PRESET_CONFIGS } from '@/lib/workflows/workflow-config';
import { withAuth } from '@/middleware/auth';
import { logger, LogCategory } from '@/lib/logger';
import { z } from 'zod';

// ============================================
// VALIDATION SCHEMAS
// ============================================

const PresetNameSchema = z.object({
  name: z.string().min(1).max(50).toUpperCase(),
});

// ============================================
// GET /api/workflows/config/preset/[name]
// Charge une configuration prédéfinie de workflow
// ============================================

export const GET = withAuth(['ADMIN', 'SUPER_ADMIN'], async (
  request: NextRequest,
  { params }: { params: { name: string } }
) => {
  try {
    // Validation du nom de preset
    const { name: presetName } = PresetNameSchema.parse({ name: params.name });

    logger.log(LogCategory.API, `Loading workflow preset: ${presetName}`, { presetName });

    const preset = PRESET_CONFIGS[presetName as keyof typeof PRESET_CONFIGS];

    if (!preset) {
      logger.warn(LogCategory.API, `Preset not found: ${presetName}`, { presetName });
      return NextResponse.json(
        { error: 'Preset inconnu', availablePresets: Object.keys(PRESET_CONFIGS) },
        { status: 404 }
      );
    }

    logger.log(LogCategory.API, `✅ Preset loaded: ${presetName}`, { 
      presetName,
      stepsCount: preset.steps?.length || 0,
    });

    return NextResponse.json({
      success: true,
      preset,
      presetName,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      logger.warn(LogCategory.API, 'Invalid preset name', { error: error.errors });
      return NextResponse.json(
        { error: 'Nom de preset invalide', details: error.errors },
        { status: 400 }
      );
    }

    logger.error(LogCategory.API, 'Error loading preset', { error });
    return NextResponse.json(
      { error: 'Erreur chargement preset' },
      { status: 500 }
    );
  }
});
