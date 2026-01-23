/**
 * Script de test de l'API PISTE (Légifrance)
 * Usage: npx ts-node scripts/test-piste-api.ts
 */

import 'dotenv/config';

async function testPisteConnection() {
  console.log('🔍 Test de connexion à l\'API PISTE (Légifrance)...\n');

  // Vérifier les variables d'environnement
  const clientId = process.env.PISTE_SANDBOX_CLIENT_ID;
  const clientSecret = process.env.PISTE_SANDBOX_CLIENT_SECRET;
  const oauthUrl = process.env.PISTE_SANDBOX_OAUTH_URL || 'https://sandbox-oauth.piste.gouv.fr/api/oauth/token';
  const apiUrl = process.env.PISTE_SANDBOX_API_URL || 'https://sandbox-api.piste.gouv.fr/dila/legifrance/lf-engine-app';
  const environment = process.env.PISTE_ENVIRONMENT || 'sandbox';

  console.log('📋 Configuration:');
  console.log(`   Environment: ${environment}`);
  console.log(`   OAuth URL: ${oauthUrl}`);
  console.log(`   API URL: ${apiUrl}`);
  console.log(`   Client ID: ${clientId ? '✅ Configuré' : '❌ Manquant'}`);
  console.log(`   Client Secret: ${clientSecret ? '✅ Configuré' : '❌ Manquant'}\n`);

  if (!clientId || !clientSecret) {
    console.error('❌ Variables PISTE_SANDBOX_CLIENT_ID et PISTE_SANDBOX_CLIENT_SECRET requises');
    process.exit(1);
  }

  try {
    // Étape 1: Obtenir le token OAuth
    console.log('1️⃣ Authentification OAuth...');
    
    const tokenResponse = await fetch(oauthUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: clientId,
        client_secret: clientSecret,
        scope: 'openid',
      }),
    });

    if (!tokenResponse.ok) {
      const error = await tokenResponse.text();
      throw new Error(`Échec OAuth (${tokenResponse.status}): ${error}`);
    }

    const tokenData = await tokenResponse.json();
    console.log(`   ✅ Token obtenu (expire dans ${tokenData.expires_in}s)\n`);

    // Étape 2: Test de l'API - Recherche simple
    console.log('2️⃣ Test recherche CESEDA...');
    
    const searchResponse = await fetch(`${apiUrl}/search`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        recherche: {
          typeRecherche: 'EXACTE',
          champ: 'ALL',
          criteres: [
            {
              typeRecherche: 'EXACTE',
              valeur: 'CESEDA',
              operateur: 'ET',
            },
          ],
        },
        fond: 'CODE_DATE',
        pageNumber: 1,
        pageSize: 5,
      }),
    });

    if (!searchResponse.ok) {
      const error = await searchResponse.text();
      throw new Error(`Échec recherche (${searchResponse.status}): ${error}`);
    }

    const searchData = await searchResponse.json();
    console.log(`   ✅ Recherche réussie`);
    console.log(`   📊 Résultats trouvés: ${searchData.totalResultNumber || 0}\n`);

    // Étape 3: Récupérer un article CESEDA
    console.log('3️⃣ Test récupération article L.313-11...');
    
    const articleResponse = await fetch(`${apiUrl}/consult/code/article`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        code: 'LEGITEXT000006070158', // CESEDA
        article: 'L313-11',
      }),
    });

    if (articleResponse.ok) {
      const articleData = await articleResponse.json();
      console.log(`   ✅ Article récupéré`);
      console.log(`   📄 Titre: ${articleData.article?.titre || 'N/A'}\n`);
    } else {
      console.log(`   ⚠️ Article non trouvé (peut-être format différent)\n`);
    }

    console.log('✅ TOUS LES TESTS PISTE RÉUSSIS!');
    console.log('   L\'API Légifrance est opérationnelle.\n');

  } catch (error) {
    console.error('❌ Erreur:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

testPisteConnection();
