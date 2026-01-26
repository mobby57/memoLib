#!/usr/bin/env node

/**
 * Synthetic Monitoring
 * Tests synthétiques post-déploiement
 */

const https = require('https');
const { URL } = require('url');

async function makeRequest(url, timeout = 5000) {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url);
    const options = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port || 443,
      path: parsedUrl.pathname,
      method: 'GET',
      timeout: timeout
    };

    const req = https.request(options, (res) => {
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

async function runSyntheticTests() {
  console.log('🔍 Exécution des tests synthétiques...');
  
  const baseUrl = process.env.DEPLOYMENT_URL || 'https://iapostemanager.pages.dev';
  
  const tests = [
    {
      name: 'Page d\'accueil',
      url: baseUrl,
      expectedStatus: 200,
      maxResponseTime: 2000
    },
    {
      name: 'API Health Check',
      url: `${baseUrl}/api/health`,
      expectedStatus: 200,
      maxResponseTime: 1000
    },
    {
      name: 'Login Page',
      url: `${baseUrl}/login`,
      expectedStatus: 200,
      maxResponseTime: 2000
    }
  ];

  let allPassed = true;

  for (const test of tests) {
    try {
      console.log(`\n🧪 Test: ${test.name}`);
      console.log(`📍 URL: ${test.url}`);
      
      const result = await makeRequest(test.url);
      
      // Vérifier le status code
      if (result.statusCode === test.expectedStatus) {
        console.log(`✅ Status Code: ${result.statusCode}`);
      } else {
        console.log(`❌ Status Code: ${result.statusCode} (attendu: ${test.expectedStatus})`);
        allPassed = false;
      }
      
      // Vérifier le temps de réponse
      if (result.responseTime <= test.maxResponseTime) {
        console.log(`✅ Temps de réponse: ${result.responseTime}ms`);
      } else {
        console.log(`❌ Temps de réponse: ${result.responseTime}ms (max: ${test.maxResponseTime}ms)`);
        allPassed = false;
      }
      
    } catch (error) {
      console.log(`❌ Erreur: ${error.message}`);
      allPassed = false;
    }
  }

  if (allPassed) {
    console.log('\n✅ Tous les tests synthétiques sont passés!');
    process.exit(0);
  } else {
    console.log('\n❌ Certains tests synthétiques ont échoué!');
    process.exit(1);
  }
}

runSyntheticTests();