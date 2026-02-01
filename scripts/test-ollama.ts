/**
 * Test de connexion à Ollama
 * Vérifie que le serveur Ollama est accessible et que le modèle llama3.2:latest est disponible
 */

async function testOllamaConnection() {
  console.log('🔍 Test de connexion à Ollama\n');
  
  const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434';
  const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'llama3.2:latest';
  
  console.log(`URL: ${OLLAMA_URL}`);
  console.log(`Modèle: ${OLLAMA_MODEL}\n`);
  
  // Test 1: Vérifier que le serveur Ollama est accessible
  console.log('📡 Test 1: Vérification du serveur Ollama...');
  try {
    const response = await fetch(`${OLLAMA_URL}/api/tags`);
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Serveur Ollama accessible');
      console.log(`   Modèles disponibles: ${data.models?.length || 0}`);
      
      if (data.models && data.models.length > 0) {
        console.log('   Liste des modèles:');
        data.models.forEach((model: any) => {
          console.log(`     - ${model.name}`);
        });
      }
    } else {
      console.log('❌ Serveur Ollama non accessible');
      console.log(`   Status: ${response.status}`);
    }
  } catch (error) {
    console.log('❌ Erreur de connexion au serveur Ollama');
    console.log(`   ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    console.log('\n💡 Solution:');
    console.log('   1. Assurez-vous qu\'Ollama est installé: https://ollama.ai');
    console.log('   2. Lancez Ollama: ollama serve');
    console.log('   3. Téléchargez le modèle: ollama pull llama3.2:latest\n');
    return;
  }
  
  // Test 2: Vérifier que le modèle est disponible
  console.log('\n🤖 Test 2: Vérification du modèle...');
  try {
    const testPrompt = 'Réponds en un mot: quelle est la capitale de la France?';
    
    const response = await fetch(`${OLLAMA_URL}/api/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        prompt: testPrompt,
        stream: false
      })
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Modèle opérationnel');
      console.log(`   Prompt: "${testPrompt}"`);
      console.log(`   Réponse: "${data.response.trim()}"`);
      console.log(`   Temps de réponse: ${data.total_duration ? (data.total_duration / 1000000000).toFixed(2) + 's' : 'N/A'}`);
    } else {
      console.log('❌ Modèle non disponible');
      console.log(`   Status: ${response.status}`);
      const errorText = await response.text();
      console.log(`   Erreur: ${errorText}`);
      
      console.log('\n💡 Solution:');
      console.log(`   Téléchargez le modèle: ollama pull ${OLLAMA_MODEL}\n`);
    }
  } catch (error) {
    console.log('❌ Erreur lors du test du modèle');
    console.log(`   ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
  }
  
  // Test 3: Test avec un prompt système (comme dans AIService)
  console.log('\n📋 Test 3: Test avec prompt système...');
  try {
    const systemPrompt = `Tu es un assistant juridique. Réponds de manière concise et professionnelle.
RÈGLE ABSOLUE: Tu ne dois JAMAIS utiliser les formulations suivantes:
- "vous devez"
- "je vous conseille"
- "je recommande"

À la place, utilise:
- "il serait possible de"
- "une option serait"
- "selon la réglementation"`;

    const userPrompt = 'Mon client veut régulariser sa situation. Que faire?';
    
    const response = await fetch(`${OLLAMA_URL}/api/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        prompt: `${systemPrompt}\n\n${userPrompt}`,
        stream: false,
        options: {
          temperature: 0.7,
          top_p: 0.9
        }
      })
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Test avec prompt système réussi');
      console.log(`   Question: "${userPrompt}"`);
      console.log(`   Réponse: "${data.response.trim().substring(0, 200)}..."`);
      
      // Vérifier les formulations interdites
      const forbiddenPhrases = ['vous devez', 'je vous conseille', 'je recommande'];
      const foundForbidden = forbiddenPhrases.filter(phrase => 
        data.response.toLowerCase().includes(phrase)
      );
      
      if (foundForbidden.length > 0) {
        console.log('   ⚠️ Formulations interdites détectées:', foundForbidden.join(', '));
      } else {
        console.log('   ✅ Aucune formulation interdite détectée');
      }
    } else {
      console.log('❌ Échec du test avec prompt système');
      console.log(`   Status: ${response.status}`);
    }
  } catch (error) {
    console.log('❌ Erreur lors du test avec prompt système');
    console.log(`   ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
  }
  
  console.log('\n' + '═'.repeat(60));
  console.log('🎉 Test de connexion Ollama terminé');
  console.log('═'.repeat(60));
}

// Exécuter le test
testOllamaConnection().catch(console.error);
