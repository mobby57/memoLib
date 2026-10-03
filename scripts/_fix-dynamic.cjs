const fs = require('node:fs');
const path = require('node:path');

const API_ROOT = path.join(process.cwd(), 'src', 'app', 'api');
let fixed = [];

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (entry.name === 'route.ts' || entry.name === 'route.tsx') processFile(full);
  }
}

function isImportComplete(code) {
  // Heuristique: compte des accolades équilibrées sur les lignes d'import de tête
  return true;
}

function processFile(file) {
  let src = fs.readFileSync(file, 'utf-8');
  const DIRECTIVE = "export const dynamic = 'force-dynamic';";

  // Retirer TOUTES les occurrences de la directive (et la ligne vide éventuelle autour)
  const occurrences = (src.match(/export\s+const\s+dynamic\s*=\s*'force-dynamic';/g) || []).length;
  if (occurrences === 0) return;

  const lines = src.split(/\r?\n/).filter(l => l.trim() !== DIRECTIVE);

  // Recalculer la fin réelle du bloc d'imports en équilibrant les accolades
  let i = 0;
  let lastImportEnd = -1;
  while (i < lines.length) {
    const t = lines[i].trim();
    if (t.startsWith('import ')) {
      // consommer jusqu'à la fin de l'import (équilibre des accolades + présence de 'from' ou ';')
      let stmt = t;
      let j = i;
      // si l'import contient déjà 'from' ou finit par ';' sans accolade ouverte non fermée
      const open = (stmt.match(/\{/g) || []).length;
      const close = (stmt.match(/\}/g) || []).length;
      if (open > close) {
        // multi-lignes: avancer jusqu'à équilibrer
        let bal = open - close;
        while (bal > 0 && j + 1 < lines.length) {
          j++;
          bal += (lines[j].match(/\{/g) || []).length;
          bal -= (lines[j].match(/\}/g) || []).length;
        }
      }
      lastImportEnd = j;
      i = j + 1;
    } else if (t === '' || t.startsWith('//') || t.startsWith('/*') || t.startsWith('*') || t.endsWith('*/')) {
      i++;
    } else {
      break;
    }
  }

  // Réinsérer la directive proprement après le dernier import
  if (lastImportEnd >= 0) {
    lines.splice(lastImportEnd + 1, 0, '', DIRECTIVE);
  } else {
    lines.unshift(DIRECTIVE);
  }

  fs.writeFileSync(file, lines.join('\n'), 'utf-8');
  fixed.push(path.relative(process.cwd(), file));
}

walk(API_ROOT);
console.log(`Repaired ${fixed.length} route files.`);
