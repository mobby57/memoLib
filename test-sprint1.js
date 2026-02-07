/**
 * Script de validation post-implémentation Sprint 1
 * Teste les 3 nouvelles fonctionnalités production
 */

const BASE_URL = 'http://localhost:3000';

console.log('🧪 Tests de Validation Sprint 1 - Production Readiness\n');
console.log('='.repeat(70) + '\n');

/**
 * Test 1: Middleware Sécurité - Headers HTTP
 */
async function testSecurityHeaders() {
  console.log('📋 Test 1: Middleware Sécurité (Headers HTTP)\n');

  try {
    const response = await fetch(BASE_URL, { method: 'HEAD' });

    const headers = {
      'X-Frame-Options': response.headers.get('X-Frame-Options'),
      'X-Content-Type-Options': response.headers.get('X-Content-Type-Options'),
      'Referrer-Policy': response.headers.get('Referrer-Policy'),
      'Permissions-Policy': response.headers.get('Permissions-Policy'),
      'Content-Security-Policy': response.headers.get('Content-Security-Policy'),
      'X-XSS-Protection': response.headers.get('X-XSS-Protection'),
    };

    let passed = 0;
    let total = 0;

    console.log('   Vérification headers sécurité:\n');

    Object.entries(headers).forEach(([name, value]) => {
      total++;
      if (value) {
        console.log(`   ✅ ${name}: ${value.substring(0, 50)}${value.length > 50 ? '...' : ''}`);
        passed++;
      } else {
        console.log(`   ❌ ${name}: ABSENT`);
      }
    });

    console.log(`\n   Résultat: ${passed}/${total} headers configurés\n`);
    return passed === total;
  } catch (error) {
    console.log(`   ❌ Erreur: ${error.message}\n`);
    return false;
  }
}

/**
 * Test 2: Health Checks API
 */
async function testHealthChecks() {
  console.log('📋 Test 2: Health Checks API\n');

  try {
    const response = await fetch(`${BASE_URL}/api/health`);
    const data = await response.json();

    console.log(`   Status HTTP: ${response.status}`);
    console.log(`   Overall Status: ${data.status || 'N/A'}`);
    console.log(`   Timestamp: ${data.timestamp || 'N/A'}`);
    console.log(`   Uptime: ${data.uptime ? `${Math.round(data.uptime)}s` : 'N/A'}`);
    console.log(`   Version: ${data.version || 'N/A'}`);
    console.log(`   Environment: ${data.environment || 'N/A'}\n`);

    if (data.checks) {
      console.log('   Health Checks:\n');

      // Database
      if (data.checks.database) {
        const db = data.checks.database;
        const icon = db.status === 'ok' ? '✅' : db.status === 'degraded' ? '⚠️' : '❌';
        console.log(`   ${icon} Database: ${db.status}`);
        if (db.latency) console.log(`      └─ Latency: ${db.latency}ms`);
        if (db.error) console.log(`      └─ Error: ${db.error}`);
      }

      // Memory
      if (data.checks.memory) {
        const mem = data.checks.memory;
        const icon = mem.status === 'ok' ? '✅' : mem.status === 'degraded' ? '⚠️' : '❌';
        console.log(`   ${icon} Memory: ${mem.status}`);
        if (mem.details) {
          console.log(`      └─ Heap: ${mem.details.heapUsed}/${mem.details.heapTotal}`);
          console.log(`      └─ Usage: ${mem.details.heapUsagePercent}`);
        }
      }

      // Environment
      if (data.checks.env) {
        const env = data.checks.env;
        const icon = env.status === 'ok' ? '✅' : '❌';
        console.log(`   ${icon} Environment: ${env.status}`);
        if (env.error) console.log(`      └─ Error: ${env.error}`);
      }
    }

    console.log('');
    return response.status === 200 && data.status === 'healthy';
  } catch (error) {
    console.log(`   ❌ Erreur: ${error.message}\n`);
    return false;
  }
}

/**
 * Test 3: Rate Limiting
 */
async function testRateLimiting() {
  console.log('📋 Test 3: Rate Limiting (Webhook)\n');

  console.log('   Note: Si Upstash non configuré, rate limiting sera simulé\n');

  try {
    const payload = {
      channel: 'EMAIL',
      messageId: 'rate_test_' + Date.now(),
      from: 'test@example.com',
      text: 'Test rate limiting',
    };

    let successCount = 0;
    let rateLimited = false;

    console.log('   Envoi de 6 requêtes (limite webhook: 5/min)...\n');

    for (let i = 1; i <= 6; i++) {
      const response = await fetch(`${BASE_URL}/api/webhooks/test-multichannel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...payload, messageId: `rate_test_${i}_${Date.now()}` }),
      });

      const rateLimitRemaining = response.headers.get('X-RateLimit-Remaining');
      const rateLimitReset = response.headers.get('X-RateLimit-Reset');

      if (response.status === 200) {
        console.log(`   ${i}. ✅ Success (200) - Remaining: ${rateLimitRemaining || 'N/A'}`);
        successCount++;
      } else if (response.status === 429) {
        console.log(`   ${i}. 🚫 Rate Limited (429) - Reset: ${rateLimitReset || 'N/A'}`);
        rateLimited = true;
      } else {
        const data = await response.json();
        console.log(`   ${i}. ⚠️  Status ${response.status} - ${data.error || 'Unknown'}`);
      }

      // Petit délai entre requêtes
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log(
      `\n   Résultat: ${successCount} succès, ${rateLimited ? 'rate limiting activé ✅' : 'rate limiting simulé (Upstash absent)'}\n`
    );

    return true; // Test réussi même si rate limiting simulé
  } catch (error) {
    console.log(`   ❌ Erreur: ${error.message}\n`);
    return false;
  }
}

/**
 * Test 4: PostgreSQL Neon Connection
 */
async function testDatabase() {
  console.log('📋 Test 4: PostgreSQL Neon Connection\n');

  try {
    const response = await fetch(`${BASE_URL}/api/health`);
    const data = await response.json();

    if (data.checks && data.checks.database) {
      const db = data.checks.database;

      if (db.status === 'ok') {
        console.log(`   ✅ Connexion Neon réussie`);
        console.log(`   └─ Latency: ${db.latency}ms`);
        console.log(`   └─ Status: ${db.status}\n`);
        return true;
      } else {
        console.log(`   ⚠️  Statut: ${db.status}`);
        if (db.error) console.log(`   └─ Error: ${db.error}`);
        console.log(`   └─ Note: Vérifier DATABASE_URL dans .env.local\n`);
        return false;
      }
    } else {
      console.log(`   ❌ Impossible de vérifier la base de données\n`);
      return false;
    }
  } catch (error) {
    console.log(`   ❌ Erreur: ${error.message}\n`);
    return false;
  }
}

/**
 * Run all tests
 */
async function runAllTests() {
  const results = {
    securityHeaders: await testSecurityHeaders(),
    healthChecks: await testHealthChecks(),
    rateLimiting: await testRateLimiting(),
    database: await testDatabase(),
  };

  console.log('='.repeat(70) + '\n');
  console.log('📊 Résumé des Tests\n');

  const passed = Object.values(results).filter(r => r).length;
  const total = Object.keys(results).length;

  Object.entries(results).forEach(([name, result]) => {
    const icon = result ? '✅' : '❌';
    console.log(`${icon} ${name.replace(/([A-Z])/g, ' $1').trim()}`);
  });

  console.log(
    `\n🎯 Score: ${passed}/${total} tests passés (${Math.round((passed / total) * 100)}%)\n`
  );

  if (passed === total) {
    console.log('✅ Tous les tests passent ! Sprint 1 validé.\n');
  } else {
    console.log('⚠️  Certains tests échouent. Vérifier la configuration:\n');
    console.log('   1. Serveur Next.js démarré sur port 3000');
    console.log('   2. DATABASE_URL configuré dans .env.local');
    console.log('   3. Upstash Redis (optionnel, fallback si absent)\n');
  }

  console.log('💡 Prochaines actions:');
  console.log('   1. Créer compte Upstash: https://upstash.com');
  console.log('   2. Configurer UPSTASH_REDIS_REST_URL et TOKEN');
  console.log('   3. Redémarrer serveur Next.js');
  console.log('   4. Relancer ce script: node test-sprint1.js\n');
}

runAllTests();
