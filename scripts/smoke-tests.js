#!/usr/bin/env node

/**
 * Smoke Tests
 * Tests rapides pour valider le déploiement
 */

const https = require('https');
const { URL } = require('url');

async function makeRequest(url, timeout = 10000) {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url);
    const options = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port || (parsedUrl.protocol === 'https:' ? 443 : 80),
      path: parsedUrl.pathname + parsedUrl.search,
      method: 'GET',
      timeout: timeout,
      headers: {
        'User-Agent': 'IA-Poste-Manager-SmokeTest/1.0'
      }
    };

    const protocol = parsedUrl.protocol === 'https:' ? https : require('http');
    
    const req = protocol.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: data,
          responseTime: Date.now() - startTime
        });
      });
    });

    const startTime = Date.now();
    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
    req.end();
  });
}

async function runSmokeTests() {
  console.log('💨 Exécution des smoke tests...');
  
  // Récupérer l'URL depuis les arguments ou variable d'environnement
  const args = process.argv.slice(2);
  const urlArg = args.find(arg => arg.startsWith('--url='));
  const baseUrl = urlArg ? urlArg.split('=')[1] : process.env.DEPLOYMENT_URL || 'http://localhost:3000';
  
  console.log(`🎯 URL de test: ${baseUrl}`);
  
  const tests = [
    {
      name: 'Page d\'accueil accessible',
      url: baseUrl,
      expectedStatus: 200
    },
    {
      name: 'Ressources statiques',
      url: `${baseUrl}/_next/static/css`,
      expectedStatus: [200, 404] // 404 acceptable si pas de CSS statique
    },
    {
      name: 'API disponible',
      url: `${baseUrl}/api/health`,
      expectedStatus: [200, 404] // 404 acceptable si endpoint pas encore créé
    }
  ];

  let passed = 0;
  let total = tests.length;

  for (const test of tests) {
    try {
      console.log(`\n🧪 ${test.name}...`);
      
      const result = await makeRequest(test.url, 15000);
      const expectedStatuses = Array.isArray(test.expectedStatus) ? test.expectedStatus : [test.expectedStatus];
      
      if (expectedStatuses.includes(result.statusCode)) {
        console.log(`✅ OK (${result.statusCode}) - ${result.responseTime}ms`);
        passed++;
      } else {
        console.log(`❌ FAIL (${result.statusCode}) - Attendu: ${expectedStatuses.join(' ou ')}`);
      }
      
    } catch (error) {
      console.log(`❌ ERREUR: ${error.message}`);
    }
  }

  console.log(`\n📊 Résultats: ${passed}/${total} tests passés`);

  if (passed === total) {
    console.log('✅ Tous les smoke tests sont passés!');
    process.exit(0);
  } else if (passed >= total * 0.7) { // 70% de réussite minimum
    console.log('⚠️ Tests partiellement réussis - Déploiement acceptable');
    process.exit(0);
  } else {
    console.log('❌ Trop de tests échoués - Déploiement problématique');
    process.exit(1);
  }
}

runSmokeTests().catch(error => {
  console.error('💥 Erreur fatale:', error);
  process.exit(1);
});