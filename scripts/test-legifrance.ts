/**
 * Script de test pour l'intégration API Légifrance (PISTE)
 * 
 * Usage: npx tsx scripts/test-legifrance.ts
 */

import 'dotenv/config';
import { legifranceApi } from '../src/lib/legifrance/api-client';
import { legifranceOAuth } from '../src/lib/legifrance/oauth-client';

async function testLegifranceIntegration() {
  console.log('🧪 Test de l\'intégration API Légifrance (PISTE)\n');

  try {
    // ============================================
    // Test 1: Vérifier la configuration
    // ============================================
    console.log('1️⃣ Vérification de la configuration...');
    
    if (!legifranceOAuth.isConfigured()) {
      console.error('❌ Configuration PISTE manquante dans .env');
      console.log('\nAjoutez dans votre .env.local:');
      console.log('PISTE_SANDBOX_CLIENT_ID=votre-client-id');
      console.log('PISTE_SANDBOX_CLIENT_SECRET=votre-client-secret');
      console.log('PISTE_ENVIRONMENT=sandbox\n');
      return;
    }

    console.log(`✅ Environnement: ${legifranceOAuth.getEnvironment()}`);
    console.log(`✅ URL API: ${legifranceOAuth.getApiUrl()}\n`);

    // ============================================
    // Test 2: Obtenir un token OAuth
    // ============================================
    console.log('2️⃣ Obtention du token OAuth...');
    const token = await legifranceOAuth.getValidToken();
    console.log(`✅ Token obtenu: ${token.substring(0, 20)}...\n`);

    // ============================================
    // Test 3: Test de connectivité (recherche simple)
    // ============================================
    console.log('3️⃣ Test de connectivité (recherche simple)...');
    try {
      const testSearch = await legifranceApi.search({
        fond: 'CODE_ETAT',
        recherche: {
          champs: [{
            typeChamp: 'TITLE',
            criteres: [{
              valeur: 'CESEDA',
              typeRecherche: 'EXACTE',
              operateur: 'ET',
            }],
            operateur: 'ET',
          }],
          pageNumber: 1,
          pageSize: 1,
          operateur: 'ET',
          sort: 'PERTINENCE',
          typePagination: 'DEFAUT',
        },
      });
      console.log(`✅ API disponible (${testSearch.totalResultNumber || 0} résultats test)\n`);
    } catch (error) {
      console.error('❌ L\'API Légifrance ne répond pas.');
      console.error('   Vérifiez que vous avez bien validé les CGU et coché l\'API Légifrance\n');
      throw error;
    }

    // ============================================
    // Test 4: Recherche CESEDA (version simplifiée)
    // ============================================
    console.log('4️⃣ Recherche dans le CESEDA...');
    
    try {
      // Recherche simple dans CESEDA
      const cesedaResults = await legifranceApi.search({
        fond: 'CODE_ETAT',
        recherche: {
          champs: [{
            typeChamp: 'TITLE',
            criteres: [{
              valeur: 'CESEDA',
              typeRecherche: 'EXACTE',
              operateur: 'ET',
            }],
            operateur: 'ET',
          }, {
            typeChamp: 'NUM_ARTICLE',
            criteres: [{
              valeur: 'L313-11',
              typeRecherche: 'EXACTE',
              operateur: 'ET',
            }],
            operateur: 'ET',
          }],
          pageNumber: 1,
          pageSize: 5,
          operateur: 'ET',
          sort: 'PERTINENCE',
          typePagination: 'DEFAUT',
        },
      });
      
      console.log(`✅ Recherche CESEDA réussie: ${cesedaResults.totalResultNumber || 0} résultats`);
      
      if (cesedaResults.results && cesedaResults.results.length > 0) {
        const firstResult = cesedaResults.results[0];
        console.log(`   Premier résultat: ${firstResult.title || 'N/A'}`);
        console.log(`   Type: ${firstResult.nature || 'N/A'}`);
        console.log(`   ID: ${firstResult.id || 'N/A'}\n`);
      } else {
        console.log('⚠️  Aucun résultat trouvé dans le CESEDA\n');
      }
    } catch (error: any) {
      console.error('❌ Erreur recherche CESEDA:', error.message);
      console.log('⚠️  Le sandbox peut ne pas contenir de données CESEDA complètes\n');
    }

    // ============================================
    // Test 5: Recherche par mots-clés CESEDA
    // ============================================
    console.log('5️⃣ Recherche mots-clés "regroupement familial"...');
    
    try {
      const searchResults = await legifranceApi.searchCesedaByKeywords(
        'regroupement familial',
        { pageSize: 5 }
      );

      console.log(`✅ ${searchResults.totalResultNumber} résultats trouvés`);
      console.log(`   Affichage des ${searchResults.results.length} premiers:\n`);

      searchResults.results.forEach((result, index) => {
        console.log(`   ${index + 1}. ${result.title || result.id}`);
        if (result.numero) console.log(`      Numéro: ${result.numero}`);
      });
      console.log();
    } catch (error: any) {
      console.error('❌ Erreur recherche mots-clés:', error.message);
      console.log('⚠️  Sandbox limité - essayez avec environnement production\n');
    }

    // ============================================
    // Test 6: Jurisprudence CESEDA récente
    // ============================================
    console.log('6️⃣ Recherche jurisprudence CESEDA (6 derniers mois)...');
    
    try {
      const caseLaw = await legifranceApi.getCesedaRecentCaseLaw({
        keywords: 'CESEDA OQTF',
        months: 6,
        pageSize: 5,
      });

      console.log(`✅ ${caseLaw.totalResultNumber} arrêts trouvés`);
      console.log(`   Affichage des ${caseLaw.results.length} premiers:\n`);

      caseLaw.results.forEach((result, index) => {
        console.log(`   ${index + 1}. ${result.title || result.id}`);
        if (result.dateDecision) {
          console.log(`      Date: ${new Date(result.dateDecision).toLocaleDateString('fr-FR')}`);
        }
      });
      console.log();
    } catch (error: any) {
      console.error('❌ Erreur recherche jurisprudence:', error.message);
      console.log('⚠️  Sandbox peut ne pas contenir de jurisprudence récente\n');
    }

    // ============================================
    // Résumé
    // ============================================
    console.log('✅ Tests complétés!');
    console.log('🎉 L\'authentification OAuth fonctionne!');
    console.log('ℹ️  Note: L\'environnement sandbox peut avoir des données limitées.\n');
    console.log('💡 Pour des tests complets, passez à l\'environnement PRODUCTION dans .env:\n');
    console.log('   PISTE_ENVIRONMENT="production"');
    console.log('   PISTE_PROD_CLIENT_ID="[votre OAuth Client ID]"');
    console.log('   PISTE_PROD_CLIENT_SECRET="[votre OAuth Secret]"\n');

    console.log('📚 Pour utiliser l\'API dans votre code:');
    console.log('   import { legifranceApi } from "@/lib/legifrance/api-client"');
    console.log('   const article = await legifranceApi.getCesedaArticle("L313-11");\n');

  } catch (error) {
    console.error('\n❌ Erreur lors des tests:', error);
    
    if (error instanceof Error) {
      console.error(`   Message: ${error.message}`);
      
      if (error.message.includes('401') || error.message.includes('403')) {
        console.log('\n💡 Vérifiez:');
        console.log('   1. Vos credentials PISTE sont corrects');
        console.log('   2. Vous avez validé les CGU sur https://piste.gouv.fr');
        console.log('   3. Vous avez coché l\'API Légifrance dans votre application PISTE');
      }
    }
  }
}

// Exécuter les tests
testLegifranceIntegration();
