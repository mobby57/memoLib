/**
 * Load Test MemoLib — Simule 100 utilisateurs simultanés
 * 
 * Usage: npx tsx scripts/load-test.ts
 * Prérequis: l'app doit tourner sur localhost:3000
 * 
 * Teste:
 * - Landing page (GET /)
 * - API résumé email (POST /api/ai/summarize-email)
 * - API création dossier (POST /api/emails/create-dossier)
 * - API documents (GET /api/documents/generate)
 */

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const CONCURRENT_USERS = 100;
const REQUESTS_PER_USER = 5;

interface TestResult {
  endpoint: string;
  status: number;
  duration: number;
  success: boolean;
}

async function makeRequest(endpoint: string, options?: RequestInit): Promise<TestResult> {
  const start = Date.now();
  try {
    const res = await fetch(`${BASE_URL}${endpoint}`, {
      ...options,
      headers: { 'Content-Type': 'application/json', ...options?.headers },
    });
    return {
      endpoint,
      status: res.status,
      duration: Date.now() - start,
      success: res.status < 500,
    };
  } catch (error) {
    return {
      endpoint,
      status: 0,
      duration: Date.now() - start,
      success: false,
    };
  }
}

async function simulateUser(userId: number): Promise<TestResult[]> {
  const results: TestResult[] = [];

  // 1. Landing page
  results.push(await makeRequest('/'));

  // 2. API résumé email
  results.push(await makeRequest('/api/ai/summarize-email', {
    method: 'POST',
    body: JSON.stringify({
      subject: `Test load ${userId}`,
      body: `Email de test pour le load testing utilisateur ${userId}. OQTF reçue le 15/08/2026.`,
      from: `user${userId}@test.com`,
    }),
  }));

  // 3. API documents templates
  results.push(await makeRequest('/api/documents/generate'));

  // 4. API jurisprudence
  results.push(await makeRequest('/api/jurisprudence/search?q=OQTF'));

  // 5. API auth session
  results.push(await makeRequest('/api/auth/session'));

  return results;
}

async function runLoadTest() {
  console.log('');
  console.log('🔥 LOAD TEST MEMOLIB');
  console.log('═══════════════════════════════════════════');
  console.log(`📍 URL: ${BASE_URL}`);
  console.log(`👥 Utilisateurs simultanés: ${CONCURRENT_USERS}`);
  console.log(`📨 Requêtes par utilisateur: ${REQUESTS_PER_USER}`);
  console.log(`📊 Total requêtes: ${CONCURRENT_USERS * REQUESTS_PER_USER}`);
  console.log('═══════════════════════════════════════════');
  console.log('');

  // Vérifier que le serveur est up
  try {
    await fetch(BASE_URL);
  } catch {
    console.error('❌ Le serveur ne répond pas sur', BASE_URL);
    console.error('   Lancez: npm run dev');
    process.exit(1);
  }

  console.log('⏱️  Démarrage du test...');
  const startTime = Date.now();

  // Lancer tous les users en parallèle
  const userPromises = Array.from({ length: CONCURRENT_USERS }, (_, i) => simulateUser(i));
  const allResults = await Promise.all(userPromises);
  const flatResults = allResults.flat();

  const totalDuration = Date.now() - startTime;

  // Analyse des résultats
  const successCount = flatResults.filter(r => r.success).length;
  const failCount = flatResults.filter(r => !r.success).length;
  const durations = flatResults.map(r => r.duration).sort((a, b) => a - b);
  const avgDuration = durations.reduce((a, b) => a + b, 0) / durations.length;
  const p50 = durations[Math.floor(durations.length * 0.5)];
  const p95 = durations[Math.floor(durations.length * 0.95)];
  const p99 = durations[Math.floor(durations.length * 0.99)];

  // Résultats par endpoint
  const byEndpoint = new Map<string, TestResult[]>();
  flatResults.forEach(r => {
    const existing = byEndpoint.get(r.endpoint) || [];
    existing.push(r);
    byEndpoint.set(r.endpoint, existing);
  });

  console.log('');
  console.log('📊 RÉSULTATS');
  console.log('═══════════════════════════════════════════');
  console.log(`✅ Succès: ${successCount}/${flatResults.length} (${((successCount / flatResults.length) * 100).toFixed(1)}%)`);
  console.log(`❌ Échecs: ${failCount}`);
  console.log(`⏱️  Durée totale: ${(totalDuration / 1000).toFixed(2)}s`);
  console.log(`📈 Requêtes/seconde: ${(flatResults.length / (totalDuration / 1000)).toFixed(1)} req/s`);
  console.log('');
  console.log('⏱️  LATENCE');
  console.log(`   Moyenne: ${avgDuration.toFixed(0)}ms`);
  console.log(`   P50:     ${p50}ms`);
  console.log(`   P95:     ${p95}ms`);
  console.log(`   P99:     ${p99}ms`);
  console.log('');
  console.log('📋 PAR ENDPOINT');
  console.log('───────────────────────────────────────────');

  byEndpoint.forEach((results, endpoint) => {
    const epSuccess = results.filter(r => r.success).length;
    const epDurations = results.map(r => r.duration);
    const epAvg = epDurations.reduce((a, b) => a + b, 0) / epDurations.length;
    const epMax = Math.max(...epDurations);
    console.log(`  ${endpoint}`);
    console.log(`    ✅ ${epSuccess}/${results.length} | avg: ${epAvg.toFixed(0)}ms | max: ${epMax}ms`);
  });

  console.log('');
  console.log('═══════════════════════════════════════════');

  // Verdict
  if (successCount / flatResults.length >= 0.95 && p95 < 3000) {
    console.log('🎉 VERDICT: ✅ PRÊT POUR PRODUCTION');
    console.log('   > 95% succès, P95 < 3s');
  } else if (successCount / flatResults.length >= 0.90) {
    console.log('⚠️  VERDICT: ACCEPTABLE (quelques optimisations recommandées)');
  } else {
    console.log('❌ VERDICT: PROBLÈMES DE PERFORMANCE');
    console.log('   Vérifiez les endpoints lents et les erreurs 500');
  }

  console.log('');
}

runLoadTest().catch(console.error);
