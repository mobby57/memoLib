import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/intake/[type]
 * Retourne le questionnaire d'intake adapte au type de procedure.
 * 
 * POST /api/intake/submit
 * Soumet les reponses du questionnaire.
 */

const INTAKE_FORMS: Record<string, any> = {
  OQTF: {
    title: 'Questionnaire OQTF',
    sections: [
      { title: 'Identite', fields: [
        { id: 'nom', label: 'Nom complet', type: 'text', required: true },
        { id: 'dateNaissance', label: 'Date de naissance', type: 'date', required: true },
        { id: 'nationalite', label: 'Nationalite', type: 'text', required: true },
        { id: 'numPasseport', label: 'Numero de passeport', type: 'text', required: false },
      ]},
      { title: 'Situation actuelle', fields: [
        { id: 'dateArrivee', label: 'Date arrivee en France', type: 'date', required: true },
        { id: 'adresse', label: 'Adresse actuelle', type: 'text', required: true },
        { id: 'situationFamiliale', label: 'Situation familiale', type: 'select', options: ['Celibataire', 'Marie(e)', 'Pacse(e)', 'Divorce(e)'], required: true },
        { id: 'enfants', label: 'Nombre enfants en France', type: 'number', required: true },
        { id: 'enfantsScolarises', label: 'Enfants scolarises ?', type: 'boolean', required: false },
      ]},
      { title: 'OQTF', fields: [
        { id: 'dateNotification', label: 'Date notification OQTF', type: 'date', required: true },
        { id: 'delai', label: 'Delai accorde', type: 'select', options: ['30 jours', 'Sans delai (48h)', 'Autre'], required: true },
        { id: 'motifOQTF', label: 'Motif de l\'OQTF', type: 'textarea', required: false },
        { id: 'ancienTitre', label: 'Ancien titre de sejour ?', type: 'text', required: false },
      ]},
      { title: 'Emploi', fields: [
        { id: 'emploi', label: 'Situation professionnelle', type: 'select', options: ['CDI', 'CDD', 'Interim', 'Sans emploi', 'Auto-entrepreneur'], required: true },
        { id: 'employeur', label: 'Nom employeur', type: 'text', required: false },
        { id: 'salaire', label: 'Salaire mensuel net', type: 'number', required: false },
      ]},
    ],
  },
  Asile: {
    title: 'Questionnaire Demande d\'asile',
    sections: [
      { title: 'Identite', fields: [
        { id: 'nom', label: 'Nom complet', type: 'text', required: true },
        { id: 'dateNaissance', label: 'Date de naissance', type: 'date', required: true },
        { id: 'nationalite', label: 'Nationalite', type: 'text', required: true },
        { id: 'ethnie', label: 'Ethnie / groupe social', type: 'text', required: false },
      ]},
      { title: 'Persecution', fields: [
        { id: 'typePersecution', label: 'Type de persecution', type: 'select', options: ['Politique', 'Religieuse', 'Ethnique', 'Genre', 'Orientation sexuelle', 'Autre'], required: true },
        { id: 'auteurPersecution', label: 'Auteur des persecutions', type: 'text', required: true },
        { id: 'dateDepart', label: 'Date de depart du pays', type: 'date', required: true },
        { id: 'itineraire', label: 'Itineraire (pays traverses)', type: 'textarea', required: false },
      ]},
      { title: 'Situation en France', fields: [
        { id: 'dateArrivee', label: 'Date arrivee en France', type: 'date', required: true },
        { id: 'hebergement', label: 'Type hebergement', type: 'select', options: ['CADA', 'Hotel 115', 'Heberge par un tiers', 'Sans abri', 'Autre'], required: true },
        { id: 'ofpraDepose', label: 'Demande OFPRA deposee ?', type: 'boolean', required: true },
        { id: 'dateEntretien', label: 'Date entretien OFPRA (si connu)', type: 'date', required: false },
      ]},
    ],
  },
  TitreSejour: {
    title: 'Questionnaire Titre de sejour',
    sections: [
      { title: 'Identite', fields: [
        { id: 'nom', label: 'Nom complet', type: 'text', required: true },
        { id: 'dateNaissance', label: 'Date de naissance', type: 'date', required: true },
        { id: 'nationalite', label: 'Nationalite', type: 'text', required: true },
      ]},
      { title: 'Sejour', fields: [
        { id: 'typeTitre', label: 'Type de titre demande', type: 'select', options: ['Vie privee et familiale', 'Salarie', 'Etudiant', 'Passeport talent', 'Carte resident'], required: true },
        { id: 'dateExpiration', label: 'Date expiration titre actuel', type: 'date', required: false },
        { id: 'prefecture', label: 'Prefecture competente', type: 'text', required: true },
        { id: 'refus', label: 'Refus precedent ?', type: 'boolean', required: true },
      ]},
    ],
  },
};

export async function GET(req: NextRequest) {
  const type = req.nextUrl.searchParams.get('type') || 'OQTF';
  const form = INTAKE_FORMS[type] || INTAKE_FORMS['OQTF'];
  return NextResponse.json(form);
}

export async function POST(req: NextRequest) {
  const { type, responses, clientEmail } = await req.json();

  if (!type || !responses) {
    return NextResponse.json({ error: 'type et responses requis' }, { status: 400 });
  }

  return NextResponse.json({
    success: true,
    type,
    fieldsCompleted: Object.keys(responses).length,
    message: 'Questionnaire soumis. Votre avocat va examiner vos reponses.',
  });
}
