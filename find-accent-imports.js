const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory() && !['node_modules', '.next', 'bin', 'obj', 'coverage'].includes(entry.name)) {
      results = results.concat(walk(full));
    } else if (/\.(ts|tsx)$/.test(entry.name)) {
      results.push(full);
    }
  }
  return results;
}

const accentRe = /[\u00e0-\u00ff\u00c0-\u00df]/;
for (const file of walk('src')) {
  const lines = fs.readFileSync(file, 'utf8').split('\n');
  lines.forEach((line, i) => {
    if (/from\s+['"]@\//.test(line) && accentRe.test(line)) {
      console.log(path.relative('.', file) + ':' + (i + 1) + ': ' + line.trim());
    }
  });
}
