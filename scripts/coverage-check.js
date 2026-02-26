/**
 * Script de vérification de couverture de tests
 * Génère un rapport et vérifie les seuils
 */

const fs = require('fs');
const path = require('path');

const COVERAGE_FILE = path.join(__dirname, '..', 'coverage', 'coverage-summary.json');
const HISTORY_FILE = path.join(__dirname, '..', 'coverage', 'coverage-history.json');

// Seuils de couverture
const THRESHOLDS = {
  minimum: 30,
  target: 50,
  ideal: 80,
};

// Modules critiques à surveiller
const CRITICAL_MODULES = [
  'src/lib/services',
  'src/middleware.ts',
  'src/app/api/auth',
  'src/app/api/dossiers',
  'src/app/api/billing',
];

function formatPercent(value) {
  return `${value.toFixed(2)}%`;
}

function getStatusIcon(value, thresholds) {
  if (value >= thresholds.ideal) return '🟢';
  if (value >= thresholds.target) return '🟡';
  if (value >= thresholds.minimum) return '🟠';
  return '🔴';
}

function loadCoverageData() {
  if (!fs.existsSync(COVERAGE_FILE)) {
    console.error('❌ Fichier de couverture non trouvé. Exécutez: npm run test:coverage');
    process.exit(1);
  }
  return JSON.parse(fs.readFileSync(COVERAGE_FILE, 'utf8'));
}

function loadHistory() {
  if (!fs.existsSync(HISTORY_FILE)) {
    return [];
  }
  return JSON.parse(fs.readFileSync(HISTORY_FILE, 'utf8'));
}

function saveHistory(history) {
  fs.writeFileSync(HISTORY_FILE, JSON.stringify(history, null, 2));
}

function analyzeModule(coverageData, modulePath) {
  const moduleData = {
    path: modulePath,
    files: 0,
    statements: 0,
    branches: 0,
    functions: 0,
    lines: 0,
  };

  Object.entries(coverageData).forEach(([filePath, data]) => {
    if (filePath !== 'total' && filePath.includes(modulePath.replace(/\\/g, '/'))) {
      moduleData.files++;
      moduleData.statements += data.statements?.pct || 0;
      moduleData.branches += data.branches?.pct || 0;
      moduleData.functions += data.functions?.pct || 0;
      moduleData.lines += data.lines?.pct || 0;
    }
  });

  if (moduleData.files > 0) {
    moduleData.statements /= moduleData.files;
    moduleData.branches /= moduleData.files;
    moduleData.functions /= moduleData.files;
    moduleData.lines /= moduleData.files;
  }

  return moduleData;
}

function generateReport() {
  console.log('\n📊 RAPPORT DE COUVERTURE DE TESTS\n');
  console.log('='.repeat(60));

  const coverageData = loadCoverageData();
  const total = coverageData.total;
  const history = loadHistory();

  // Résumé global
  console.log('\n📈 COUVERTURE GLOBALE:\n');
  
  const metrics = ['statements', 'branches', 'functions', 'lines'];
  metrics.forEach(metric => {
    const value = total[metric]?.pct || 0;
    const icon = getStatusIcon(value, THRESHOLDS);
    console.log(`  ${icon} ${metric.padEnd(12)}: ${formatPercent(value).padStart(8)}`);
  });

  const avgCoverage = (
    (total.statements?.pct || 0) +
    (total.branches?.pct || 0) +
    (total.functions?.pct || 0) +
    (total.lines?.pct || 0)
  ) / 4;

  console.log(`\n  📊 Moyenne: ${formatPercent(avgCoverage)}`);

  // Progression
  if (history.length > 0) {
    const lastEntry = history[history.length - 1];
    const diff = avgCoverage - lastEntry.average;
    const diffIcon = diff >= 0 ? '📈' : '📉';
    console.log(`  ${diffIcon} Évolution: ${diff >= 0 ? '+' : ''}${formatPercent(diff)}`);
  }

  // Modules critiques
  console.log('\n\n🎯 MODULES CRITIQUES:\n');
  
  CRITICAL_MODULES.forEach(modulePath => {
    const moduleData = analyzeModule(coverageData, modulePath);
    if (moduleData.files > 0) {
      const avg = (moduleData.statements + moduleData.branches + moduleData.functions + moduleData.lines) / 4;
      const icon = getStatusIcon(avg, THRESHOLDS);
      console.log(`  ${icon} ${modulePath.padEnd(30)}: ${formatPercent(avg).padStart(8)} (${moduleData.files} fichiers)`);
    } else {
      console.log(`  ⚪ ${modulePath.padEnd(30)}: Pas de données`);
    }
  });

  // Seuils
  console.log('\n\n📏 SEUILS DE COUVERTURE:\n');
  console.log(`  🔴 Minimum requis: ${THRESHOLDS.minimum}%`);
  console.log(`  🟡 Objectif:       ${THRESHOLDS.target}%`);
  console.log(`  🟢 Idéal:          ${THRESHOLDS.ideal}%`);

  // Verdict
  console.log('\n\n' + '='.repeat(60));
  
  if (avgCoverage >= THRESHOLDS.minimum) {
    console.log(`✅ SUCCÈS: Couverture (${formatPercent(avgCoverage)}) >= seuil minimum (${THRESHOLDS.minimum}%)`);
  } else {
    console.log(`❌ ÉCHEC: Couverture (${formatPercent(avgCoverage)}) < seuil minimum (${THRESHOLDS.minimum}%)`);
    console.log('\n📝 Actions requises:');
    console.log('   1. Ajouter des tests pour les services métier (src/lib/services)');
    console.log('   2. Tester les endpoints API critiques (auth, dossiers, billing)');
    console.log('   3. Exécuter: npm run test:coverage pour vérifier');
  }

  // Sauvegarder dans l'historique
  history.push({
    date: new Date().toISOString(),
    statements: total.statements?.pct || 0,
    branches: total.branches?.pct || 0,
    functions: total.functions?.pct || 0,
    lines: total.lines?.pct || 0,
    average: avgCoverage,
  });

  // Garder les 30 dernières entrées
  if (history.length > 30) {
    history.shift();
  }

  saveHistory(history);

  console.log('\n');

  // Exit code basé sur le seuil
  return avgCoverage >= THRESHOLDS.minimum ? 0 : 1;
}

// Exécution
const exitCode = generateReport();
process.exit(exitCode);
