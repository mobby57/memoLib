const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src');

const replacements = [
  ['\u00C3\u00A9', '\u00E9'], // é
  ['\u00C3\u00A8', '\u00E8'], // è
  ['\u00C3\u00A0', '\u00E0'], // à
  ['\u00C3\u00A7', '\u00E7'], // ç
  ['\u00C3\u00AE', '\u00EE'], // î
  ['\u00C3\u00B4', '\u00F4'], // ô
  ['\u00C3\u00B9', '\u00F9'], // ù
  ['\u00C3\u00AB', '\u00EB'], // ë
  ['\u00C3\u00AF', '\u00EF'], // ï
  ['\u00C3\u00A2', '\u00E2'], // â
  ['\u00C3\u00AA', '\u00EA'], // ê
  ['\u00C3\u00BB', '\u00FB'], // û
  ['\u00C3\u00BC', '\u00FC'], // ü
  ['\u00C3\u0089', '\u00C9'], // É
  ['\u00C3\u0080', '\u00C0'], // À
  ['\u00C3\u0087', '\u00C7'], // Ç
  ['\u00C3\u0094', '\u00D4'], // Ô
  ['\u00C3\u0088', '\u00C8'], // È
  ['\u00C3\u009B', '\u00DB'], // Û
  ['\u00C3\u009C', '\u00DC'], // Ü
  ['\u00C5\u0093', '\u0153'], // œ
];

function walk(dir) {
  let results = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (!['node_modules', '.next', 'bin', 'obj', 'coverage'].includes(entry.name)) {
        results = results.concat(walk(full));
      }
    } else if (/\.(ts|tsx)$/.test(entry.name)) {
      results.push(full);
    }
  }
  return results;
}

let fixed = 0;
for (const file of walk(srcDir)) {
  let content = fs.readFileSync(file, 'utf8');
  let changed = false;
  for (const [from, to] of replacements) {
    if (content.includes(from)) {
      content = content.split(from).join(to);
      changed = true;
    }
  }
  if (changed) {
    fs.writeFileSync(file, content, 'utf8');
    fixed++;
    console.log('Fixed:', path.relative(__dirname, file));
  }
}
console.log(`\nTotal: ${fixed} files fixed`);
