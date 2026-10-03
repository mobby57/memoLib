const fs = require('node:fs');
const path = require('node:path');

const API_ROOT = path.join(process.cwd(), 'src', 'app', 'api');
let added = [];
let skipped = 0;

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (entry.name === 'route.ts' || entry.name === 'route.tsx') processFile(full);
  }
}

function processFile(file) {
  const src = fs.readFileSync(file, 'utf-8');

  // Déjà présent ?
  if (/export\s+const\s+dynamic\s*=/.test(src)) { skipped++; return; }

  const lines = src.split(/\r?\n/);

  // Trouver l'index de la dernière ligne d'import de tête (bloc d'imports initial)
  let lastImport = -1;
  for (let i = 0; i < lines.length; i++) {
    const t = lines[i].trim();
    if (t.startsWith('import ')) lastImport = i;
    // continuation d'import multi-lignes
    else if (lastImport === i - 1 && (t.startsWith('}') || t.endsWith(',') || t.includes('from '))) lastImport = i;
    // on s'arrête si on rencontre du code après les imports
    else if (t !== '' && !t.startsWith('//') && !t.startsWith('/*') && !t.startsWith('*') && lastImport >= 0) break;
  }

  const directive = "\nexport const dynamic = 'force-dynamic';";
  if (lastImport >= 0) {
    lines.splice(lastImport + 1, 0, directive);
  } else {
    lines.unshift(directive.trim());
  }
  fs.writeFileSync(file, lines.join('\n'), 'utf-8');
  added.push(path.relative(process.cwd(), file));
}

walk(API_ROOT);
console.log(`Added dynamic to ${added.length} routes. Skipped (already had it): ${skipped}.`);
