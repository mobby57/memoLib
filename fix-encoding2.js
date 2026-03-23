const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src');

// Fullwidth mojibake patterns found in the codebase
const replacements = [
  // Fullwidth characters (another encoding corruption pattern)
  ['\uFF28', 'é'],   // Ｈ → é (légal → legal with é)
  ['\uFF33', 'é'],   // Ｓ → é (référence)
  ['\uFF2F', 'é'],   // Ｏ → é (Générer)
  ['\uFF34', 'é'],   // Ｔ → é (activités)
  ['\uFF26', 'é'],   // Ｆ → é (données)
  ['\uFF2B', 'é'],   // Ｋ → é (séjour)
  ['\uFF24', 'é'],   // Ｄ → é
  ['\u89E6', 'É'],   // 触 → É
  ['\u8077', 'E'],   // 職 → E
  ['\u90ED', 'è'],   // 郭 → è
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
console.log(`\nTotal: ${fixed} files fixed (pass 2)`);
