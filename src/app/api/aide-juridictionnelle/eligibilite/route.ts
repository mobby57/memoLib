import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/aide-juridictionnelle/eligibilite
 * Calcule l'eligibilite a l'aide juridictionnelle selon les revenus.
 * Bareme 2026.
 */
export async function POST(req: NextRequest) {
  const { revenuMensuel, personnesACharge, patrimoine } = await req.json();

  if (!revenuMensuel && revenuMensuel !== 0) {
    return NextResponse.json({ error: 'revenuMensuel requis' }, { status: 400 });
  }

  const charges = personnesACharge || 0;
  // Bareme 2026 (approximatif)
  const plafonds = {
    totale: 1017 + (charges * 194),
    partielle55: 1225 + (charges * 194),
    partielle25: 1531 + (charges * 194),
  };

  let eligibilite: string;
  let tauxPriseEnCharge: number;

  if (revenuMensuel <= plafonds.totale) {
    eligibilite = 'totale';
    tauxPriseEnCharge = 100;
  } else if (revenuMensuel <= plafonds.partielle55) {
    eligibilite = 'partielle';
    tauxPriseEnCharge = 55;
  } else if (revenuMensuel <= plafonds.partielle25) {
    eligibilite = 'partielle';
    tauxPriseEnCharge = 25;
  } else {
    eligibilite = 'non_eligible';
    tauxPriseEnCharge = 0;
  }

  return NextResponse.json({
    eligible: eligibilite !== 'non_eligible',
    eligibilite,
    tauxPriseEnCharge,
    plafonds,
    revenuDeclare: revenuMensuel,
    personnesACharge: charges,
    documentsRequis: [
      'Dernier avis d\'imposition',
      'Justificatifs de revenus (3 derniers mois)',
      'Justificatif de domicile',
      'Piece d\'identite',
      'Formulaire CERFA 16146*03',
    ],
    note: 'Calcul indicatif base sur le bareme 2026. La decision finale appartient au BAJ.',
  });
}
