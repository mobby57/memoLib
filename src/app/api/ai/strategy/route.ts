import { auth } from '@/lib/clerk-auth';
// CLERK-MIGRATION: Remplacement auth() -> auth()
// CLERK-MIGRATION: Remplacement auth() -> auth()
import { NextRequest, NextResponse } from 'next/server';
import { withAIRateLimit } from '@/lib/middleware/rate-limit';
import { z } from 'zod';
/**
 * POST /api/ai/strategy
 * Suggere une strategie juridique basee sur le type de dossier et les elements.
 */
const strategySchema = z.object({
  typeDossier: z.enum(['OQTF', 'OQTF_SANS_DELAI', 'Asile', 'TitreSejour']),
}).strict();

export const POST = withAIRateLimit(async (req: NextRequest) => {
  const { user } = await auth();
  if (!user) return NextResponse.json({ error: 'Non authentifie' }, { status: 401 });
  if (!user.tenantId) return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });

  const parsed = strategySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'Requête de stratégie invalide' }, { status: 400 });
  const { typeDossier } = parsed.data;

  const strategies = {
    OQTF: {
      principale: 'Recours en annulation devant le TA (2 mois)',
      subsidiaire: 'Refere-suspension si execution imminente',
      moyens: [
        'Violation art. 8 CEDH (vie privee et familiale)',
        'Erreur manifeste d\'appreciation',
        'Vice de procedure (defaut de motivation)',
        'Violation art. L.611-3 CESEDA (protection contre eloignement)',
      ],
      timeline: ['J+0: Depot recours TA', 'J+0: Demande aide juridictionnelle', 'J+15: Memoire complementaire', 'J+60: Audience'],
      conseils: ['Rassembler preuves integration (travail, scolarite enfants)', 'Obtenir attestations de proches', 'Certificat medical si probleme de sante'],
    },
    OQTF_SANS_DELAI: {
      principale: 'Refere-liberte (48h) + recours au fond',
      subsidiaire: 'Demande de mise en liberte si retention',
      moyens: [
        'Atteinte grave et manifestement illegale a une liberte fondamentale',
        'Urgence (execution imminente)',
        'Violation art. 8 CEDH',
        'Erreur sur la menace a l\'ordre public',
      ],
      timeline: ['J+0: Refere-liberte IMMEDIAT', 'J+0: Recours au fond', 'J+1: Audience refere (48h)', 'J+30: Audience fond'],
      conseils: ['URGENCE ABSOLUE — agir dans les heures', 'Preparer memoire refere en priorite', 'Contacter le greffe pour audience rapide'],
    },
    Asile: {
      principale: 'Preparation entretien OFPRA + recours CNDA si rejet',
      subsidiaire: 'Demande de reexamen si elements nouveaux',
      moyens: [
        'Craintes fondees de persecution (Convention Geneve)',
        'Protection subsidiaire (risques reels)',
        'Principe de non-refoulement',
        'Vulnerabilite particuliere',
      ],
      timeline: ['J+0: Preparation recit detaille', 'J+7: Rassemblement preuves', 'J+14: Simulation entretien', 'Entretien OFPRA', 'Si rejet: recours CNDA (1 mois)'],
      conseils: ['Recit chronologique et detaille', 'Certificat medical si traces de violence', 'Attestations de compatriotes', 'Articles de presse sur la situation au pays'],
    },
    TitreSejour: {
      principale: 'Recours gracieux puis contentieux (TA)',
      subsidiaire: 'Refere-suspension si urgence',
      moyens: [
        'Droit au sejour (art. L.423-23 CESEDA — vie privee)',
        'Erreur de droit sur les conditions',
        'Erreur manifeste d\'appreciation',
        'Violation du contradictoire',
      ],
      timeline: ['J+0: Recours gracieux prefet', 'J+60: Si silence = rejet implicite', 'J+60: Recours TA', 'J+120: Audience'],
      conseils: ['Recours gracieux d\'abord (gratuit, suspend le delai)', 'Constituer un dossier solide (emploi, logement, integration)', 'Demander l\'aide juridictionnelle'],
    },
  };

  const strategy = strategies[typeDossier] || strategies['TitreSejour'];

  return NextResponse.json({
    typeDossier,
    ...strategy,
    note: 'Suggestions generees par IA. L\'avocat doit adapter la strategie au cas particulier.',
  });
});
