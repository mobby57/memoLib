import { auth } from '@/lib/clerk-auth';
// CLERK-MIGRATION: Remplacement auth() -> auth()
// CLERK-MIGRATION: Remplacement auth() -> auth()
import { NextRequest, NextResponse } from 'next/server';
/**
 * POST /api/ai/prepare-ofpra
 * Genere une preparation d'entretien OFPRA (questions probables + points cles).
 */
export async function POST(req: NextRequest) {
  const { user } = await auth();
    const session = user ? { user } : null;
  if (!user) return NextResponse.json({ error: 'Non authentifie' }, { status: 401 });

  const { nationalite, typePersecution, recitResume } = await req.json();

  const questionsTypes = [
    'Pouvez-vous decrire chronologiquement les evenements qui vous ont pousse a quitter votre pays ?',
    'Qui sont les auteurs des persecutions que vous avez subies ?',
    'Avez-vous porte plainte ou cherche la protection des autorites de votre pays ?',
    'Pourquoi ne pouvez-vous pas vous installer dans une autre region de votre pays ?',
    'Quand avez-vous quitte votre pays et par quel itineraire ?',
    'Avez-vous de la famille restee au pays ? Sont-ils en danger ?',
    'Avez-vous des preuves de ce que vous avancez (documents, photos, certificats) ?',
    'Que craignez-vous en cas de retour dans votre pays ?',
    'Avez-vous ete membre d\'un parti politique ou d\'une association ?',
    'Avez-vous deja demande l\'asile dans un autre pays ?',
  ];

  const questionsSpecifiques: Record<string, string[]> = {
    Politique: ['Quel est votre engagement politique ?', 'Avez-vous ete arrete ou detenu ?', 'Votre parti est-il interdit ?'],
    Religieuse: ['Quelle est votre religion ?', 'Comment se manifeste la persecution religieuse ?', 'Pouvez-vous pratiquer librement ?'],
    Ethnique: ['A quelle ethnie appartenez-vous ?', 'Y a-t-il des violences inter-ethniques dans votre region ?'],
    Genre: ['Etes-vous victime de mariage force ou de mutilations ?', 'Avez-vous cherche de l\'aide aupres d\'associations ?'],
    'Orientation sexuelle': ['Quand avez-vous pris conscience de votre orientation ?', 'L\'homosexualite est-elle penalisee dans votre pays ?'],
  };

  const conseils = [
    'Soyez precis sur les dates et les lieux',
    'Restez coherent avec votre recit ecrit',
    'N\'inventez rien — les contradictions sont detectees',
    'Exprimez vos emotions — l\'officier evalue la credibilite',
    'Si vous ne vous souvenez pas, dites-le plutot que d\'inventer',
    'Apportez tous vos documents originaux',
    'L\'entretien dure 1h30 a 3h — soyez prepare mentalement',
  ];

  return NextResponse.json({
    questionsGenerales: questionsTypes,
    questionsSpecifiques: questionsSpecifiques[typePersecution] || [],
    conseils,
    pointsVigilance: [
      'Coherence entre recit ecrit et oral',
      'Precision geographique (noms de villes, quartiers)',
      'Chronologie sans contradiction',
      'Connaissance du contexte politique/social du pays',
    ],
    note: 'Preparation generee par IA. Adaptez selon le cas particulier du client.',
  });
}


