import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

/**
 * POST /api/ai/urgence
 * Analyse rapide d'un texte/document en mode urgence.
 * Retourne : délai estimé, risque, actions prioritaires, procédure recommandée.
 */
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

  const formData = await req.formData();
  const text = formData.get('text') as string || '';
  const file = formData.get('file') as File | null;

  // Extraire le contenu à analyser
  let content = text;
  if (file && !content) {
    // Pour les fichiers texte, lire directement. PDF/images nécessiteraient OCR.
    if (file.type.includes('text') || file.name.endsWith('.txt')) {
      content = await file.text();
    } else {
      content = `[Document: ${file.name}, ${file.type}, ${file.size} bytes]`;
    }
  }

  if (!content) return NextResponse.json({ error: 'Aucun contenu à analyser' }, { status: 400 });

  // Analyse par heuristiques CESEDA (< 30s garanti)
  const lower = content.toLowerCase();
  const result = analyzeUrgency(lower, content);

  return NextResponse.json(result);
}

function analyzeUrgency(lower: string, content: string) {
  let typeProcedure = 'Non identifié';
  let delaiEstime = 'Non déterminé';
  let joursRestants: number | null = null;
  let niveauRisque: string = 'moyen';
  let procedureRecommandee = '';
  const actionsPrioritaires: string[] = [];
  const documentsManquants: string[] = [];

  // Détection OQTF
  if (lower.includes('oqtf') || lower.includes('quitter le territoire') || lower.includes('obligation de quitter')) {
    if (lower.includes('sans délai') || lower.includes('48 heures') || lower.includes('48h')) {
      typeProcedure = 'OQTF sans délai';
      delaiEstime = '48 heures';
      joursRestants = 2;
      niveauRisque = 'critique';
      procedureRecommandee = 'Référé-liberté immédiat devant le TA + saisine JLD si rétention';
      actionsPrioritaires.push('Déposer un référé-liberté sous 48h');
      actionsPrioritaires.push('Vérifier si placement en rétention');
      actionsPrioritaires.push('Contacter le greffe du TA pour enrôlement urgent');
    } else {
      typeProcedure = 'OQTF avec délai de départ volontaire';
      delaiEstime = '30 jours';
      joursRestants = 30;
      niveauRisque = 'élevé';
      procedureRecommandee = 'Recours en annulation devant le TA dans les 30 jours';
      actionsPrioritaires.push('Préparer le recours en annulation');
      actionsPrioritaires.push('Demander le référé-suspension si risque d\'exécution');
      actionsPrioritaires.push('Rassembler preuves d\'attaches (Art. 8 CEDH)');
    }
    documentsManquants.push('Copie intégrale de la décision OQTF');
    documentsManquants.push('Justificatifs d\'attaches (bail, travail, famille)');
    documentsManquants.push('Attestations de proches');
  }
  // Détection asile
  else if (lower.includes('ofpra') || lower.includes('asile') || lower.includes('cnda')) {
    if (lower.includes('rejet') || lower.includes('décision de rejet')) {
      typeProcedure = 'Rejet OFPRA — Recours CNDA';
      delaiEstime = '1 mois';
      joursRestants = 30;
      niveauRisque = 'élevé';
      procedureRecommandee = 'Recours devant la CNDA dans le délai d\'1 mois';
      actionsPrioritaires.push('Préparer le mémoire CNDA');
      actionsPrioritaires.push('Identifier les éléments nouveaux depuis l\'OFPRA');
      actionsPrioritaires.push('Vérifier le maintien du droit au séjour');
    } else {
      typeProcedure = 'Demande d\'asile';
      delaiEstime = '21 jours pour dépôt';
      joursRestants = 21;
      niveauRisque = 'moyen';
      procedureRecommandee = 'Dépôt demande OFPRA dans les 21 jours suivant l\'enregistrement GUDA';
      actionsPrioritaires.push('Vérifier la date d\'enregistrement GUDA');
      actionsPrioritaires.push('Rédiger le récit de vie');
    }
    documentsManquants.push('Récit de vie détaillé et chronologique');
    documentsManquants.push('Preuves des persécutions (certificats médicaux, articles)');
    documentsManquants.push('Documents d\'identité (si disponibles)');
  }
  // Titre de séjour
  else if (lower.includes('titre de séjour') || lower.includes('refus de séjour') || lower.includes('carte de séjour')) {
    typeProcedure = 'Titre de séjour';
    delaiEstime = '2 mois';
    joursRestants = 60;
    niveauRisque = 'moyen';
    procedureRecommandee = 'Recours gracieux ou contentieux dans les 2 mois';
    actionsPrioritaires.push('Identifier le fondement juridique du titre');
    actionsPrioritaires.push('Vérifier les conditions de ressources et d\'intégration');
    documentsManquants.push('Décision préfectorale de refus');
    documentsManquants.push('Justificatifs de ressources');
    documentsManquants.push('Preuve d\'intégration (travail, langue)');
  }
  // Rétention
  else if (lower.includes('rétention') || lower.includes('cra') || lower.includes('centre de rétention')) {
    typeProcedure = 'Rétention administrative';
    delaiEstime = '48 heures (JLD)';
    joursRestants = 2;
    niveauRisque = 'critique';
    procedureRecommandee = 'Contester devant le JLD avant prolongation + vérifier les vices de procédure';
    actionsPrioritaires.push('Demander la communication du dossier au JLD');
    actionsPrioritaires.push('Vérifier la notification des droits');
    actionsPrioritaires.push('Identifier les vices de procédure (délai, interprète)');
    documentsManquants.push('PV de placement en rétention');
    documentsManquants.push('Notification des droits');
  }
  // Fallback
  else {
    niveauRisque = 'moyen';
    procedureRecommandee = 'Identifier la procédure exacte et les délais applicables';
    actionsPrioritaires.push('Identifier la nature exacte de la décision');
    actionsPrioritaires.push('Vérifier les délais de recours');
    actionsPrioritaires.push('Réunir les pièces du dossier');
  }

  // Détection de dates dans le texte pour affiner le délai
  const dateMatch = content.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/);
  if (dateMatch && joursRestants) {
    // Calcul basique, juste pour enrichir
    actionsPrioritaires.push(`Date détectée dans le document : ${dateMatch[0]} — vérifier si c'est la date de notification`);
  }

  return { typeProcedure, delaiEstime, joursRestants, niveauRisque, procedureRecommandee, actionsPrioritaires, documentsManquants };
}
