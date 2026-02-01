/**
 * Test des Fonctionnalités Avancées IA
 * Script de test pour vérifier les nouvelles APIs
 */

const BASE_URL = 'http://localhost:3000';
const TENANT_ID = 'cabinet-dupont';

async function testAdvancedFeatures() {
  console.log('🧪 Test des Fonctionnalités Avancées IA\n');

  // Test 1: Analytics API
  console.log('📊 Test Analytics API...');
  try {
    const analyticsResponse = await fetch(`${BASE_URL}/api/tenant/${TENANT_ID}/analytics?range=30d`);
    if (analyticsResponse.ok) {
      const analytics = await analyticsResponse.json();
      console.log('✅ Analytics API fonctionne');
      console.log(`   - Taux de succès global: ${(analytics.globalSuccessRate * 100).toFixed(1)}%`);
      console.log(`   - Total actions: ${analytics.totalActions}`);
      console.log(`   - Types d'actions: ${analytics.actionsByType.length}`);
    } else {
      console.log('❌ Analytics API erreur:', analyticsResponse.status);
    }
  } catch (error) {
    console.log('❌ Analytics API erreur:', error.message);
  }

  console.log('');

  // Test 2: Suggestions API
  console.log('💡 Test Suggestions API...');
  try {
    const suggestionsResponse = await fetch(`${BASE_URL}/api/tenant/${TENANT_ID}/suggestions`);
    if (suggestionsResponse.ok) {
      const suggestions = await suggestionsResponse.json();
      console.log('✅ Suggestions API fonctionne');
      console.log(`   - Nombre de suggestions: ${suggestions.totalSuggestions}`);
      suggestions.suggestions.forEach((s, i) => {
        console.log(`   ${i + 1}. ${s.title} (${s.priority})`);
      });
    } else {
      console.log('❌ Suggestions API erreur:', suggestionsResponse.status);
    }
  } catch (error) {
    console.log('❌ Suggestions API erreur:', error.message);
  }

  console.log('');

  // Test 3: Semantic Search API
  console.log('🔍 Test Semantic Search API...');
  try {
    const searchResponse = await fetch(`${BASE_URL}/api/tenant/${TENANT_ID}/semantic-search?q=régulariser situation administrative&limit=5`);
    if (searchResponse.ok) {
      const searchResults = await searchResponse.json();
      console.log('✅ Semantic Search API fonctionne');
      console.log(`   - Résultats trouvés: ${searchResults.totalResults}`);
      console.log(`   - Suggestions: ${searchResults.suggestions.length}`);
      if (searchResults.results.length > 0) {
        console.log(`   - Meilleur match: ${searchResults.results[0].similarity}% de similarité`);
      }
    } else {
      console.log('❌ Semantic Search API erreur:', searchResponse.status);
    }
  } catch (error) {
    console.log('❌ Semantic Search API erreur:', error.message);
  }

  console.log('');

  // Test 4: Learning API
  console.log('🧠 Test Learning API...');
  try {
    const learningResponse = await fetch(`${BASE_URL}/api/tenant/${TENANT_ID}/learning?action=analyze&period=30`);
    if (learningResponse.ok) {
      const learning = await learningResponse.json();
      console.log('✅ Learning API fonctionne');
      console.log(`   - Actions analysées: ${learning.totalActions}`);
      console.log(`   - Types d'actions: ${learning.actionTypes.length}`);
      console.log(`   - Taux de succès global: ${(learning.globalSuccessRate * 100).toFixed(1)}%`);
    } else {
      console.log('❌ Learning API erreur:', learningResponse.status);
    }
  } catch (error) {
    console.log('❌ Learning API erreur:', error.message);
  }

  console.log('');

  // Test 5: Prédiction d'approbation
  console.log('🎯 Test Prédiction d\'Approbation...');
  try {
    const predictionResponse = await fetch(`${BASE_URL}/api/tenant/${TENANT_ID}/learning`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        actionType: 'EMAIL_TRIAGE',
        confidence: 0.85
      })
    });
    
    if (predictionResponse.ok) {
      const prediction = await predictionResponse.json();
      console.log('✅ Prédiction API fonctionne');
      console.log(`   - Probabilité d'approbation: ${(prediction.probability * 100).toFixed(1)}%`);
      console.log(`   - Recommandation: ${prediction.recommendation}`);
      console.log(`   - Raisonnement: ${prediction.reasoning}`);
    } else {
      console.log('❌ Prédiction API erreur:', predictionResponse.status);
    }
  } catch (error) {
    console.log('❌ Prédiction API erreur:', error.message);
  }

  console.log('');
  console.log('🎉 Tests terminés!');
  console.log('');
  console.log('📋 Résumé:');
  console.log('   - Analytics: Métriques IA et apprentissage continu');
  console.log('   - Suggestions: IA proactive avec recommandations');
  console.log('   - Semantic Search: Recherche par sens et contexte');
  console.log('   - Learning: Apprentissage automatique et prédictions');
  console.log('');
  console.log('🚀 Accédez aux fonctionnalités avancées:');
  console.log('   http://localhost:3000/advanced');
}

// Exécuter les tests
testAdvancedFeatures().catch(console.error);