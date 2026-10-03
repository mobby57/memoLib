const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(process.cwd(), 'src');
const exts = new Set(['.ts', '.tsx', '.js', '.jsx']);
const USE_CLIENT_RE = /^\s*(['"])use client\1\s*;?\s*$/;

let fixed = [];
let scanned = 0;

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name === '.next') continue;
      walk(full);
    } else if (exts.has(path.extname(entry.name))) {
      processFile(full);
    }
  }
}

function processFile(file) {
  scanned++;
  const src = fs.readFileSync(file, 'utf-8');
  const lines = src.split(/\r?\n/);

  // Trouver l'index de la directive use client
  let directiveIdx = -1;
  for (let i = 0; i < lines.length; i++) {
    if (USE_CLIENT_RE.test(lines[i])) { directiveIdx = i; break; }
    // Si on rencontre du code réel avant, on continue à chercher quand même
  }
  if (directiveIdx === -1) return; // pas de directive

  // Est-elle déjà valide ? (première ligne non vide du fichier)
  let firstMeaningful = -1;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].trim() === '') continue;
    firstMeaningful = i;
    break;
  }
  if (directiveIdx === firstMeaningful) return; // déjà OK

  // Vérifier qu'avant la directive il n'y a QUE des imports / commentaires / vide
  // (sinon déplacer changerait la sémantique — on log et on saute)
  let safe = true;
  for (let i = 0; i < directiveIdx; i++) {
    const t = lines[i].trim();
    if (t === '') continue;
    if (t.startsWith('//')) continue;
    if (t.startsWith('/*') || t.startsWith('*') || t.endsWith('*/')) continue;
    if (t.startsWith('import ')) continue;
    if (t.startsWith('export ')) { safe = false; break; }
    // toute autre expression => non sûr
    safe = false;
    break;
  }
  if (!safe) {
    console.log('SKIP (non trivial avant directive):', path.relative(process.cwd(), file));
    return;
  }

  // Retirer la directive de sa position et la remettre tout en haut
  const directiveLine = "'use client';";
  lines.splice(directiveIdx, 1);
  // enlever une éventuelle ligne vide laissée juste après l'ancienne position n'est pas nécessaire
  const newSrc = directiveLine + '\n' + lines.join('\n');
  fs.writeFileSync(file, newSrc, 'utf-8');
  fixed.push(path.relative(process.cwd(), file));
}

walk(ROOT);
console.log(`\nScanned ${scanned} files. Fixed ${fixed.length}:`);
fixed.forEach(f => console.log('  ', f));
