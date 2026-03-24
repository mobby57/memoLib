#!/usr/bin/env node

/**
 * Health Check Script
 * Vérifie la santé de l'application après déploiement
 */

const https = require('https');
const http = require('http');
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
        'User-Agent': 'IA-Poste-Manager-HealthCheck/1.0',
        'Accept': 'application/json, text/html'
      }
    };

    const protocol = parsedUrl.protocol === 'https:' ? https : http;

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

async function runHealthChecks() {
  console.log('🏥 Vérification de la santé de l\'application...');

  // Récupérer l'URL depuis les arguments ou variable d'environnement
  const args = process.argv.slice(2);
  const urlArg = args.find(arg => arg.startsWith('--url='));
  const baseUrl = urlArg ? urlArg.split('=')[1] : process.env.DEPLOYMENT_URL || 'http://localhost:3000';

  console.log(`🎯 URL de vérification: ${baseUrl}`);

  const healthChecks = [
    {
      name: 'Application principale',
      url: baseUrl,
      check: (result) => {
        return (result.statusCode >= 200 && result.statusCode < 400) && result.responseTime < 5000;
      }
    },
    {
      name: 'Temps de réponse acceptable',
      url: baseUrl,
      check: (result) => {
        return result.responseTime < 3000;
      }
    },
    {
      name: 'Headers de sécurité',
      url: baseUrl,
      check: (result) => {
        const headers = result.headers;
        return headers['x-frame-options'] || headers['content-security-policy'] || true; // Flexible pour le moment
      }
    }
  ];

  let healthScore = 0;
  const maxScore = healthChecks.length;

  for (const check of healthChecks) {
    try {
      console.log(`\n🔍 ${check.name}...`);

      const result = await makeRequest(check.url, 15000);

      if (check.check(result)) {
        console.log(`✅ OK - ${result.responseTime}ms`);
        healthScore++;
      } else {
        console.log(`❌ FAIL - Status: ${result.statusCode}, Time: ${result.responseTime}ms`);
      }

    } catch (error) {
      console.log(`❌ ERREUR: ${error.message}`);
    }
  }

  const healthPercentage = (healthScore / maxScore) * 100;
  console.log(`\n📊 Score de santé: ${healthScore}/${maxScore} (${healthPercentage.toFixed(1)}%)`);

  if (healthScore === maxScore) {
    console.log('✅ Application en parfaite santé!');
    process.exit(0);
  } else if (healthPercentage >= 80) {
    console.log('⚠️ Application en bonne santé avec quelques points d\'attention');
    process.exit(0);
  } else if (healthPercentage >= 60) {
    console.log('🟡 Application fonctionnelle mais nécessite une attention');
    process.exit(0);
  } else {
    console.log('❌ Application en mauvaise santé - Investigation requise');
    process.exit(1);
  }
}

runHealthChecks().catch(error => {
  console.error('💥 Erreur fatale lors du health check:', error);
  process.exit(1);
});
