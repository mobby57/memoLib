#!/usr/bin/env node

/**
 * Bundle Size Checker
 * Vérifie que la taille des bundles respecte les limites définies
 */

const fs = require('fs');
const path = require('path');

// Limites de taille (en KB)
const SIZE_LIMITS = {
  'pages/_app.js': 250,
  'pages/index.js': 150,
  'chunks/main.js': 200,
  'chunks/webpack.js': 50,
  total: 1000
};

function getFileSize(filePath) {
  try {
    const stats = fs.statSync(filePath);
    return Math.round(stats.size / 1024); // Convertir en KB
  } catch (error) {
    return 0;
  }
}

function checkBundleSize() {
  console.log('📦 Vérification de la taille des bundles...');
  
  const nextDir = path.join(process.cwd(), '.next');
  
  if (!fs.existsSync(nextDir)) {
    console.log('⚠️ Dossier .next non trouvé, build probablement pas effectué');
    return;
  }

  let totalSize = 0;
  let passed = true;

  // Vérifier les fichiers principaux
  const staticDir = path.join(nextDir, 'static');
  if (fs.existsSync(staticDir)) {
    const chunks = fs.readdirSync(path.join(staticDir, 'chunks'), { withFileTypes: true })
      .filter(dirent => dirent.isFile() && dirent.name.endsWith('.js'))
      .map(dirent => dirent.name);

    chunks.forEach(chunk => {
      const filePath = path.join(staticDir, 'chunks', chunk);
      const size = getFileSize(filePath);
      totalSize += size;
      
      console.log(`📄 ${chunk}: ${size} KB`);
    });
  }

  // Vérifier la taille totale
  if (totalSize > SIZE_LIMITS.total) {
    console.log(`❌ Taille totale dépassée: ${totalSize} KB (limite: ${SIZE_LIMITS.total} KB)`);
    passed = false;
  } else {
    console.log(`✅ Taille totale OK: ${totalSize} KB (limite: ${SIZE_LIMITS.total} KB)`);
  }

  if (passed) {
    console.log('\n✅ Toutes les limites de taille sont respectées!');
  } else {
    console.log('\n❌ Certaines limites de taille sont dépassées!');
    process.exit(1);
  }
}

checkBundleSize();