#!/usr/bin/env tsx
/**
 * 🔍 Script de diagnostic PISTE/Légifrance
 * Vérifie l'état de la configuration et de l'accès à l'API
 */

import 'dotenv/config';
import { LegifranceOAuthClient } from '@/lib/legifrance/oauth-client';
import { LegifranceApiClient } from '@/lib/legifrance/api-client';

const environment = (process.env.PISTE_ENVIRONMENT || 'sandbox') as 'sandbox' | 'production';

const legifranceOAuth = new LegifranceOAuthClient(environment);
const apiUrl = environment === 'production'
  ? process.env.PISTE_PROD_API_URL!
  : process.env.PISTE_SANDBOX_API_URL!;
const legifranceApi = new LegifranceApiClient(legifranceOAuth, apiUrl);

interface DiagnosticResult {
  step: string;
  status: 'success' | 'warning' | 'error';
  message: string;
  details?: string;
}

const results: DiagnosticResult[] = [];

function logResult(result: DiagnosticResult) {
  results.push(result);
  
  const icon = result.status === 'success' ? '✅' : 
               result.status === 'warning' ? '⚠️' : '❌';
  
  console.log(`${icon} ${result.step}: ${result.message}`);
  if (result.details) {
    console.log(`   ${result.details}\n`);
  }
}

async function diagnose() {
  console.log('\n🔍 DIAGNOSTIC PISTE/LÉGIFRANCE\n');
  console.log('='.repeat(60));
  console.log();

  // ====================================
  // 1. Configuration .env
  // ====================================
  console.log('1️⃣ Vérification configuration .env...\n');
  
  const environment = process.env.PISTE_ENVIRONMENT;
  const clientId = environment === 'production' 
    ? process.env.PISTE_PROD_CLIENT_ID 
    : process.env.PISTE_SANDBOX_CLIENT_ID;
  const clientSecret = environment === 'production'
    ? process.env.PISTE_PROD_CLIENT_SECRET
    : process.env.PISTE_SANDBOX_CLIENT_SECRET;

  if (!environment) {
    logResult({
      step: 'Environnement',
      status: 'error',
      message: 'PISTE_ENVIRONMENT non défini',
      details: 'Ajoutez PISTE_ENVIRONMENT="production" ou "sandbox" dans .env',
    });
    return;
  }

  logResult({
    step: 'Environnement',
    status: 'success',
    message: environment.toUpperCase(),
    details: environment === 'sandbox' 
      ? '⚠️ Données limitées en sandbox. Passez en production pour données complètes.'
      : '✅ Mode production - données CESEDA complètes disponibles',
  });

  if (!clientId || !clientSecret) {
    logResult({
      step: 'Credentials OAuth',
      status: 'error',
      message: 'Client ID ou Secret manquant',
      details: `Vérifiez PISTE_${environment.toUpperCase()}_CLIENT_ID et CLIENT_SECRET dans .env`,
    });
    return;
  }

  logResult({
    step: 'Credentials OAuth',
    status: 'success',
    message: 'Configurés',
    details: `Client ID: ${clientId.substring(0, 20)}...`,
  });

  // ====================================
  // 2. Test OAuth
  // ====================================
  console.log('\n2️⃣ Test authentification OAuth...\n');

  let token: string | null = null;
  
  try {
    token = await legifranceOAuth.getValidToken();
    
    logResult({
      step: 'Token OAuth',
      status: 'success',
      message: 'Obtenu avec succès',
      details: `Token: ${token.substring(0, 20)}...`,
    });
  } catch (error: any) {
    logResult({
      step: 'Token OAuth',
      status: 'error',
      message: 'Échec d\'obtention',
      details: error.message,
    });
    
    if (error.message.includes('invalid_client')) {
      console.log('\n💡 Suggestions:');
      console.log('   - Vérifiez que vous utilisez les OAUTH credentials (pas les API Keys)');
      console.log('   - Client ID OAuth commence par: d9b038a6...');
      console.log('   - API Key commence par: 704d09b0... (NE PAS UTILISER)\n');
    }
    
    return;
  }

  // ====================================
  // 3. Test connectivité API
  // ====================================
  console.log('\n3️⃣ Test connectivité API...\n');

  try {
    const testSearch = await legifranceApi.search({
      fond: 'CODE_ETAT',
      recherche: {
        champs: [{
          typeChamp: 'TITLE',
          criteres: [{
            valeur: 'CODE',
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

    logResult({
      step: 'Connectivité API',
      status: 'success',
      message: 'API accessible',
      details: `${testSearch.totalResultNumber || 0} résultat(s) de test`,
    });
  } catch (error: any) {
    logResult({
      step: 'Connectivité API',
      status: 'error',
      message: 'Erreur d\'accès à l\'API',
      details: error.message,
    });

    if (error.message.includes('403')) {
      console.log('\n❌ ERREUR 403 FORBIDDEN\n');
      console.log('Votre authentification OAuth fonctionne, mais vous n\'avez PAS souscrit à l\'API Légifrance.\n');
      console.log('📋 ÉTAPES POUR ACTIVER L\'ACCÈS:\n');
      console.log('1. Allez sur: https://piste.gouv.fr/ (ou https://aife.economie.gouv.fr/)');
      console.log('2. Cliquez sur "Catalogue d\'API"');
      console.log('3. Trouvez "API Légifrance"');
      console.log('4. Cliquez sur "Souscrire" ou "S\'abonner"');
      console.log('5. Sélectionnez votre application');
      console.log('6. ✅ IMPORTANT: Cochez "J\'accepte les CGU de l\'API Légifrance"');
      console.log('7. Validez la souscription');
      console.log('8. Vérifiez dans "Mes Applications" → "APIs" que "API Légifrance" est "Actif"\n');
      console.log('📖 Guide complet: ANALYSE_CGU_LEGIFRANCE.md\n');
    }

    return;
  }

  // ====================================
  // 4. Test recherche CESEDA
  // ====================================
  console.log('\n4️⃣ Test recherche CESEDA...\n');

  try {
    const cesedaSearch = await legifranceApi.search({
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
        pageSize: 5,
        operateur: 'ET',
        sort: 'PERTINENCE',
        typePagination: 'DEFAUT',
      },
    });

    const resultCount = cesedaSearch.totalResultNumber || 0;
    
    logResult({
      step: 'Recherche CESEDA',
      status: resultCount > 0 ? 'success' : 'warning',
      message: `${resultCount} résultat(s) trouvé(s)`,
      details: resultCount === 0 && environment === 'sandbox'
        ? 'Sandbox peut avoir des données limitées. Essayez en production.'
        : resultCount > 0
        ? `Premiers résultats: ${cesedaSearch.results?.slice(0, 2).map(r => r.title || r.id).join(', ')}`
        : undefined,
    });
  } catch (error: any) {
    logResult({
      step: 'Recherche CESEDA',
      status: 'error',
      message: 'Échec',
      details: error.message,
    });
  }

  // ====================================
  // Résumé
  // ====================================
  console.log('\n' + '='.repeat(60));
  console.log('\n📊 RÉSUMÉ DU DIAGNOSTIC\n');

  const successCount = results.filter(r => r.status === 'success').length;
  const warningCount = results.filter(r => r.status === 'warning').length;
  const errorCount = results.filter(r => r.status === 'error').length;

  console.log(`✅ Succès: ${successCount}`);
  console.log(`⚠️  Avertissements: ${warningCount}`);
  console.log(`❌ Erreurs: ${errorCount}\n`);

  if (errorCount === 0 && warningCount === 0) {
    console.log('🎉 TOUT FONCTIONNE PARFAITEMENT!\n');
    console.log('Vous pouvez maintenant utiliser l\'API Légifrance dans votre application.\n');
    console.log('📝 Exemple d\'utilisation:');
    console.log('   import { legifranceApi } from "@/lib/legifrance/api-client"');
    console.log('   const article = await legifranceApi.getCesedaArticle("L313-11");\n');
  } else if (errorCount === 0) {
    console.log('✅ Configuration fonctionnelle avec quelques avertissements.\n');
  } else {
    console.log('❌ Des problèmes doivent être résolus avant d\'utiliser l\'API.\n');
  }
}

diagnose().catch(console.error);
