/**
 * Script pour remplacer automatiquement tous les console.error/log/warn
 * par le système de logging professionnel
 * 
 * Usage: node scripts/replace-console-logs.js
 */

const fs = require('fs');
const path = require('path');

const FRONTEND_SRC = path.join(__dirname, '../src/frontend/src');

// Patterns de remplacement
const replacements = [
  {
    pattern: /console\.error\((['"`])(.*?)\1\s*,?\s*(.*?)\);?/g,
    replacement: (match, quote, message, context) => {
      if (context && context.trim()) {
        return `logger.error(${quote}${message}${quote}, ${context.trim()});`;
      }
      return `logger.error(${quote}${message}${quote});`;
    }
  },
  {
    pattern: /console\.log\((['"`])(.*?)\1\s*,?\s*(.*?)\);?/g,
    replacement: (match, quote, message, context) => {
      if (context && context.trim()) {
        return `logger.debug(${quote}${message}${quote}, ${context.trim()});`;
      }
      return `logger.debug(${quote}${message}${quote});`;
    }
  },
  {
    pattern: /console\.warn\((['"`])(.*?)\1\s*,?\s*(.*?)\);?/g,
    replacement: (match, quote, message, context) => {
      if (context && context.trim()) {
        return `logger.warn(${quote}${message}${quote}, ${context.trim()});`;
      }
      return `logger.warn(${quote}${message}${quote});`;
    }
  }
];

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;
  
  // Vérifier si le fichier a déjà l'import logger
  const hasLoggerImport = content.includes("import logger") || content.includes("from '../utils/logger'") || content.includes("from './utils/logger'");
  
  // Appliquer les remplacements
  replacements.forEach(({ pattern, replacement }) => {
    if (pattern.test(content)) {
      content = content.replace(pattern, replacement);
      modified = true;
    }
  });
  
  // Ajouter l'import logger si nécessaire et si on a modifié
  if (modified && !hasLoggerImport && content.includes('logger.')) {
    // Trouver la ligne d'import la plus appropriée
    const importLines = content.split('\n');
    let lastImportIndex = -1;
    
    for (let i = 0; i < importLines.length; i++) {
      if (importLines[i].trim().startsWith('import ')) {
        lastImportIndex = i;
      }
    }
    
    if (lastImportIndex >= 0) {
      // Déterminer le chemin relatif
      const relativePath = path.relative(path.dirname(filePath), path.join(FRONTEND_SRC, 'utils/logger.js'))
        .replace(/\\/g, '/')
        .replace(/^\.\.\//, '')
        .replace(/^src\//, '../')
        .replace(/^utils\//, './utils/');
      
      const loggerImport = `import logger from '${relativePath}';`;
      importLines.splice(lastImportIndex + 1, 0, loggerImport);
      content = importLines.join('\n');
    }
  }
  
  if (modified) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ Modifié: ${filePath}`);
    return true;
  }
  
  return false;
}

function walkDir(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory() && !filePath.includes('node_modules') && !filePath.includes('.git')) {
      walkDir(filePath, fileList);
    } else if (file.endsWith('.js') || file.endsWith('.jsx')) {
      fileList.push(filePath);
    }
  });
  
  return fileList;
}

// Exécution
console.log('🔍 Recherche des fichiers avec console.log/error/warn...\n');

const files = walkDir(FRONTEND_SRC);
let modifiedCount = 0;

files.forEach(file => {
  if (processFile(file)) {
    modifiedCount++;
  }
});

console.log(`\n✅ ${modifiedCount} fichier(s) modifié(s) sur ${files.length} fichier(s) analysé(s)`);


