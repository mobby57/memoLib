#!/usr/bin/env node

const { execSync } = require('child_process');

console.log('🧪 Tests Avancés MemoLib\n');

const testSuites = [
  {
    name: 'Tests E2E Avancés',
    command: 'npx playwright test tests/e2e/advanced-scenarios.spec.ts',
    timeout: 300000
  },
  {
    name: 'Tests Performance',
    command: 'npx playwright test tests/performance/load-testing.spec.ts',
    timeout: 180000
  },
  {
    name: 'Tests Sécurité',
    command: 'npx playwright test tests/security/security-advanced.spec.ts',
    timeout: 120000
  }
];

async function runTests() {
  const results = [];
  
  for (const suite of testSuites) {
    console.log(`▶️ ${suite.name}...`);
    
    try {
      const start = Date.now();
      execSync(suite.command, { 
        stdio: 'inherit',
        timeout: suite.timeout
      });
      const duration = Date.now() - start;
      
      console.log(`✅ ${suite.name} - ${duration}ms\n`);
      results.push({ name: suite.name, status: 'PASS', duration });
    } catch (error) {
      console.log(`❌ ${suite.name} - FAILED\n`);
      results.push({ name: suite.name, status: 'FAIL' });
    }
  }
  
  console.log('\n📊 Rapport Final:');
  console.log('='.repeat(50));
  
  results.forEach(result => {
    const status = result.status === 'PASS' ? '✅ PASS' : '❌ FAIL';
    const duration = result.duration ? `(${result.duration}ms)` : '';
    console.log(`${status} ${result.name} ${duration}`);
  });
  
  const passed = results.filter(r => r.status === 'PASS').length;
  const total = results.length;
  
  console.log('\n' + '='.repeat(50));
  console.log(`Total: ${passed}/${total} suites passées`);
  
  if (passed === total) {
    console.log('🎉 Tous les tests avancés sont passés!');
    process.exit(0);
  } else {
    console.log('💥 Certains tests ont échoué');
    process.exit(1);
  }
}

runTests().catch(console.error);