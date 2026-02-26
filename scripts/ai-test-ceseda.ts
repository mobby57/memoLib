/**
 * Tests CESEDA - Scénarios réalistes
 * Test de l'analyse IA avec des cas concrets de droit des étrangers
 */

import { emailAnalyzer } from '../lib/ai/email-analyzer';
import { PROCEDURES_CESEDA } from '../lib/ai/ceseda-reference';

/**
 * Scénarios de test réalistes CESEDA
 */
const SCENARIOS_TEST = [
  {
    nom: '📋 Renouvellement titre de séjour salarié',
    email: {
      from: 'ahmed.benali@example.com',
      subject: 'Demande urgente - Renouvellement titre de séjour salarié',
      body: `Bonjour Maître,

Je m'appelle Ahmed Benali, de nationalité tunisienne. Mon titre de séjour salarié expire le 15 février 2026 (dans 40 jours).

Je travaille en CDI depuis 3 ans dans une entreprise de BTP à Paris. J'ai tous mes documents :
- Contrat de travail CDI
- 6 derniers bulletins de salaire
- Justificatif de domicile (facture EDF)
- Passeport tunisien

Je souhaite renouveler mon titre. Pouvez-vous m'aider pour constituer le dossier ?

Cordialement,
Ahmed Benali
Tél: 06 12 34 56 78`,
      date: new Date().toISOString(),
    },
  },

  {
    nom: '⚠️ OQTF - Urgence absolue',
    email: {
      from: 'marie.kouadio@example.com',
      subject: 'URGENT - OQTF reçue hier - Besoin aide avocat',
      body: `Bonjour,

Je m'appelle Marie Kouadio, ivoirienne, 32 ans. J'ai reçu hier une OQTF avec délai de 30 jours.

Je vis en France depuis 8 ans. Je suis mère de 2 enfants français (Jules 7 ans, Emma 4 ans scolarisés à Paris).
Mon mari est français, nous sommes mariés depuis 5 ans.

J'avais déposé une demande de titre de séjour "vie privée et familiale" il y a 6 mois mais pas encore de réponse.

Documents disponibles :
- Acte de mariage avec traduction
- Actes de naissance des enfants
- Certificats de scolarité
- Justificatif de domicile commun
- Avis d'imposition du foyer

C'est très urgent, je risque l'expulsion. Pouvez-vous m'aider pour un recours ?

Marie Kouadio
Tél: 07 45 67 89 01`,
      date: new Date().toISOString(),
    },
  },

  {
    nom: '🎓 Titre de séjour étudiant',
    email: {
      from: 'li.wang@example.com',
      subject: 'Demande titre de séjour étudiant - Master 2',
      body: `Bonjour,

Je suis Li Wang, chinoise, 24 ans. Je viens d'être acceptée en Master 2 Finance à HEC Paris pour septembre 2026.

J'ai obtenu mon Master 1 à Pékin et je viens en France pour la première fois.

Documents que j'ai :
- Lettre d'admission HEC
- Relevés bancaires (parents) montrant 12000€
- Assurance santé internationale
- Réservation logement CROUS

J'ai besoin d'aide pour :
1. Obtenir le visa long séjour étudiant
2. Préparer le dossier préfecture
3. Connaître mes droits pour travailler en France

Merci,
Li Wang
Email: li.wang@outlook.com`,
      date: new Date().toISOString(),
    },
  },

  {
    nom: '🏠 Regroupement familial',
    email: {
      from: 'karim.sadek@example.com',
      subject: 'Regroupement familial - faire venir ma femme et mes enfants',
      body: `Bonjour Maître,

Je suis Karim Sadek, marocain, 38 ans. Je vis en France depuis 4 ans avec un titre de séjour salarié renouvelé l'année dernière (valable jusqu'en 2027).

Je travaille comme chauffeur routier en CDI, salaire net 1850€/mois.

Je souhaite faire venir ma femme Fatima (35 ans) et nos 3 enfants (12, 9 et 6 ans) du Maroc.

J'ai un appartement T4 de 75m² à Marseille (bail à mon nom).

Questions :
- Quels documents exactement pour le regroupement familial ?
- Combien de temps ça prend ?
- Est-ce que mon salaire est suffisant ?

Documents disponibles :
- Acte de mariage (Maroc)
- Actes de naissance des enfants
- Bail d'habitation
- 12 derniers bulletins de salaire
- Titre de séjour en cours

Merci pour votre aide,
Karim Sadek
Tél: 06 88 99 00 11`,
      date: new Date().toISOString(),
    },
  },

  {
    nom: '🛡️ Demande d\'asile',
    email: {
      from: 'hassan.ali@example.com',
      subject: 'Demande asile politique - Persécutions Somalie',
      body: `Bonjour,

Je m'appelle Hassan Ali, somalien, 29 ans. Je suis arrivé en France il y a 2 mois.

J'ai fui la Somalie car j'étais journaliste et j'ai reçu des menaces de mort du groupe Al-Shabaab après avoir publié des articles critiques.

J'ai été enregistré à l'OFII la semaine dernière. On m'a donné une attestation de demande d'asile.

Je suis actuellement hébergé au CADA de Créteil.

Documents que j'ai :
- Passeport somalien
- Articles de presse que j'ai écrits
- Captures d'écran des menaces reçues
- Attestation OFII
- Certificat médical (traces de violence)

Je dois remplir le formulaire OFPRA mais c'est très compliqué. J'ai besoin d'aide pour :
1. Rédiger mon récit de persécutions
2. Rassembler les preuves
3. Préparer l'entretien OFPRA

Merci,
Hassan Ali
Tél (CADA): 01 23 45 67 89`,
      date: new Date().toISOString(),
    },
  },

  {
    nom: '🇫🇷 Naturalisation française',
    email: {
      from: 'elena.popescu@example.com',
      subject: 'Naturalisation - 6 ans en France',
      body: `Bonjour,

Je suis Elena Popescu, roumaine, 35 ans. Je vis en France depuis 6 ans de manière continue.

Situation :
- Mariée avec un français depuis 4 ans
- 1 enfant français (né en France, 2 ans)
- CDI comme infirmière depuis 5 ans
- Propriétaire d'un appartement à Lyon

J'ai le niveau B2 en français (DELF B2 obtenu l'année dernière).

Je souhaite demander la naturalisation française.

Documents disponibles :
- Acte de naissance roumain avec traduction
- Acte de mariage
- Acte de naissance de notre fils
- 3 derniers avis d'imposition
- Justificatifs de résidence continue (factures, contrats)
- Diplôme DELF B2
- Casier judiciaire vierge

Questions :
- Puis-je faire la demande maintenant ?
- Quels autres documents nécessaires ?
- Combien de temps pour obtenir la réponse ?

Merci,
Elena Popescu
Tél: 06 55 66 77 88`,
      date: new Date().toISOString(),
    },
  },
];

/**
 * Exécuter les tests CESEDA
 */
async function testCESEDA() {
  console.log('🇫🇷 Tests CESEDA - Scénarios réalistes\n');
  console.log('========================================\n');

  for (const scenario of SCENARIOS_TEST) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`${scenario.nom}`);
    console.log('='.repeat(60));

    try {
      const start = Date.now();
      const analysis = await emailAnalyzer.analyzeEmail(scenario.email);
      const duration = Date.now() - start;

      console.log('\n📊 RÉSULTAT DE L\'ANALYSE:\n');
      
      console.log('👤 CLIENT:');
      console.log(`   Nom: ${analysis.clientInfo.prenom || ''} ${analysis.clientInfo.nom || '(non détecté)'}`);
      console.log(`   Email: ${analysis.clientInfo.email}`);
      console.log(`   Tél: ${analysis.clientInfo.telephone || '(non détecté)'}`);
      console.log(`   Nationalité: ${analysis.clientInfo.nationalite || '(non détectée)'}`);

      console.log('\n📋 DEMANDE:');
      console.log(`   Type: ${analysis.demande.type}`);
      console.log(`   Catégorie: ${analysis.demande.categorie || '(non spécifiée)'}`);
      console.log(`   Urgence: ${analysis.demande.urgence.toUpperCase()}`);
      console.log(`   Délai: ${analysis.demande.delai || '(aucun)'}`);

      console.log('\n📄 DOCUMENTS:');
      console.log(`   Mentionnés: ${analysis.documents.mentionnes.length || 0}`);
      if (analysis.documents.mentionnes.length > 0) {
        analysis.documents.mentionnes.forEach(doc => console.log(`     - ${doc}`));
      }
      
      console.log(`\n   📌 OBLIGATOIRES (${analysis.documents.obligatoires?.length || 0}):`);
      if (analysis.documents.obligatoires) {
        analysis.documents.obligatoires.forEach(doc => {
          console.log(`     ✅ ${doc.nom}`);
          console.log(`        ${doc.description}`);
          console.log(`        Formats: ${doc.formats.join(', ')}`);
        });
      }

      console.log(`\n   📎 OPTIONNELS (${analysis.documents.optionnels?.length || 0}):`);
      if (analysis.documents.optionnels) {
        analysis.documents.optionnels.forEach(doc => {
          console.log(`     ⭕ ${doc.nom}`);
          console.log(`        ${doc.description}`);
        });
      }

      console.log('\n⚖️ ANALYSE JURIDIQUE:');
      console.log(`   Situation: ${analysis.analyse.situationJuridique}`);
      
      if (analysis.analyse.risques.length > 0) {
        console.log('\n   ⚠️ RISQUES:');
        analysis.analyse.risques.forEach(r => console.log(`     - ${r}`));
      }

      if (analysis.analyse.recoursInformations) {
        console.log('\n   📜 RECOURS DISPONIBLES:');
        console.log(`     ${analysis.analyse.recoursInformations}`);
      }

      if (analysis.analyse.actionsRecommandees.length > 0) {
        console.log('\n   ✓ ACTIONS RECOMMANDÉES:');
        analysis.analyse.actionsRecommandees.forEach((a, i) => console.log(`     ${i + 1}. ${a}`));
      }

      console.log(`\n📊 Confiance: ${analysis.confidence}%`);
      console.log(`⏱️  Temps d'analyse: ${duration}ms`);

    } catch (error) {
      console.error('\n❌ ERREUR:', error);
    }
  }

  console.log('\n\n========================================');
  console.log('✅ Tests terminés!');
  console.log('========================================\n');

  console.log('📚 Référence CESEDA:');
  console.log(`   ${Object.keys(PROCEDURES_CESEDA).length} procédures référencées`);
  console.log('   - Titres de séjour (salarié, vie privée, étudiant)');
  console.log('   - Visas long séjour');
  console.log('   - Naturalisation');
  console.log('   - OQTF et recours');
  console.log('   - Demande d\'asile');
  console.log('   - Regroupement familial');
}

testCESEDA().catch(console.error);
