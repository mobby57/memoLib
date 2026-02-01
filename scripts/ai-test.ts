/**
 * Test Ollama - IA Locale
 * Script pour tester l'installation et les capacités d'Ollama
 */

import { ollama } from '../lib/ai/ollama-client';
import { emailAnalyzer } from '../lib/ai/email-analyzer';

async function testOllama() {
  console.log('🤖 Test Ollama - IA Locale\n');
  console.log('========================================\n');

  // 1. Vérifier disponibilité
  console.log('1️⃣ Vérification disponibilité...');
  const available = await ollama.isAvailable();
  
  if (!available) {
    console.error('❌ Ollama n\'est pas disponible');
    console.log('\n💡 Solutions:');
    console.log('   1. Installez Ollama: https://ollama.com/download');
    console.log('   2. Démarrez le serveur: ollama serve');
    console.log('   3. Téléchargez un modèle: ollama pull llama3.2:3b');
    process.exit(1);
  }
  
  console.log('✅ Ollama est disponible\n');

  // 2. Lister modèles
  console.log('2️⃣ Modèles disponibles...');
  try {
    const models = await ollama.listModels();
    if (models.length === 0) {
      console.log('⚠️ Aucun modèle installé');
      console.log('\n💡 Téléchargez un modèle:');
      console.log('   ollama pull llama3.2:3b');
      process.exit(1);
    }
    console.log('✅ Modèles:', models.join(', '));
    console.log('');
  } catch (error) {
    console.error('❌ Erreur liste modèles:', error);
  }

  // 3. Test génération simple
  console.log('3️⃣ Test génération simple...');
  try {
    const start = Date.now();
    const response = await ollama.generate(
      'Réponds en une phrase: Qu\'est-ce que le CESEDA?'
    );
    const duration = Date.now() - start;
    
    console.log('✅ Réponse:', response);
    console.log(`⏱️ Temps: ${duration}ms\n`);
  } catch (error) {
    console.error('❌ Erreur génération:', error);
  }

  // 4. Test extraction JSON
  console.log('4️⃣ Test extraction JSON...');
  try {
    const start = Date.now();
    const result = await ollama.generateJSON<{
      type: string;
      urgence: string;
      confiance: number;
    }>(
      `Analyse ce sujet d'email: "Demande urgente titre de séjour salarié"
      
Réponds en JSON:
{
  "type": "type de demande",
  "urgence": "urgent|normal|faible",
  "confiance": 0-100
}`,
      'Tu es un assistant juridique CESEDA. Réponds uniquement en JSON.'
    );
    const duration = Date.now() - start;
    
    console.log('✅ JSON extrait:', JSON.stringify(result, null, 2));
    console.log(`⏱️ Temps: ${duration}ms\n`);
  } catch (error) {
    console.error('❌ Erreur extraction JSON:', error);
  }

  // 5. Test analyse email complet
  console.log('5️⃣ Test analyse email complet...');
  try {
    const start = Date.now();
    const analysis = await emailAnalyzer.analyzeEmail({
      from: 'jean.dupont@example.com',
      subject: 'Demande urgente renouvellement titre de séjour',
      body: `Bonjour Maître,
      
Je m'appelle Jean Dupont, de nationalité tunisienne. Mon titre de séjour salarié expire dans 30 jours.

J'ai besoin d'aide pour le renouvellement. J'ai:
- Contrat de travail CDI
- Bulletins de salaire des 6 derniers mois
- Justificatif de domicile

Pouvez-vous m'aider rapidement?

Cordialement,
Jean Dupont
Tel: 06 12 34 56 78`,
      date: new Date().toISOString(),
    });
    const duration = Date.now() - start;
    
    console.log('✅ Analyse complète:');
    console.log('   Client:', analysis.clientInfo.prenom, analysis.clientInfo.nom);
    console.log('   Type:', analysis.demande.type);
    console.log('   Urgence:', analysis.demande.urgence);
    console.log('   Confiance:', analysis.confidence + '%');
    console.log(`⏱️ Temps: ${duration}ms\n`);
    
    console.log('📋 Détails:');
    console.log(JSON.stringify(analysis, null, 2));
  } catch (error) {
    console.error('❌ Erreur analyse email:', error);
  }

  // 6. Test génération réponse
  console.log('\n6️⃣ Test génération réponse automatique...');
  try {
    const mockAnalysis = {
      clientInfo: { email: 'test@example.com', nom: 'Dupont', prenom: 'Jean' },
      demande: {
        type: 'Titre de séjour',
        objet: 'Renouvellement titre salarié',
        urgence: 'urgent' as const,
      },
      documents: { mentionnes: [], manquants: [] },
      analyse: {
        situationJuridique: 'Renouvellement de titre de séjour salarié avec CDI',
        risques: [],
        opportunites: [],
        actionsRecommandees: [],
      },
      confidence: 90,
      extractedAt: new Date().toISOString(),
    };

    const start = Date.now();
    const draft = await emailAnalyzer.generateDraftResponse(mockAnalysis);
    const duration = Date.now() - start;
    
    console.log('✅ Brouillon généré:');
    console.log('---');
    console.log(draft);
    console.log('---');
    console.log(`⏱️ Temps: ${duration}ms\n`);
  } catch (error) {
    console.error('❌ Erreur génération réponse:', error);
  }

  console.log('\n========================================');
  console.log('✅ Tests terminés avec succès!');
  console.log('\n💡 Prochaines étapes:');
  console.log('   1. npm run email:to-workspace (avec analyse IA)');
  console.log('   2. Interface web avec analyse automatique');
}

testOllama().catch(console.error);
