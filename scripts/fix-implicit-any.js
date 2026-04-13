const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Run tsc and capture errors
let output;
try {
  output = execSync('npx tsc --noEmit 2>&1', {
    cwd: path.resolve(__dirname, '..'),
    encoding: 'utf-8',
    env: { ...process.env, NODE_OPTIONS: '--max-old-space-size=8192' },
    maxBuffer: 50 * 1024 * 1024,
  });
} catch (e) {
  output = e.stdout || '';
}

// Parse TS7006 errors: Parameter 'x' implicitly has an 'any' type
const regex = /^(.+?)\((\d+),(\d+)\): error TS7006: Parameter '(.+?)' implicitly/gm;
const fixes = new Map(); // file -> [{line, col, param}]

let match;
while ((match = regex.exec(output)) !== null) {
  const [, file, line, col, param] = match;
  const absFile = path.resolve(__dirname, '..', file);
  if (!fixes.has(absFile)) fixes.set(absFile, []);
  fixes.get(absFile).push({ line: parseInt(line), col: parseInt(col), param });
}

console.log(`Found ${Array.from(fixes.values()).flat().length} TS7006 errors in ${fixes.size} files`);

for (const [file, fileFixList] of fixes) {
  try {
    const content = fs.readFileSync(file, 'utf-8');
    const lines = content.split('\n');
    
    // Sort fixes by line desc, col desc to avoid offset issues
    fileFixList.sort((a, b) => b.line - a.line || b.col - a.col);
    
    for (const fix of fileFixList) {
      const lineIdx = fix.line - 1;
      if (lineIdx >= lines.length) continue;
      
      let line = lines[lineIdx];
      // Find the parameter and add : any after it
      // Match patterns like (param => , (param) => , (param, , param)
      const paramRegex = new RegExp(`\\b${fix.param}\\b(?!\\s*[:\\.])`);
      const paramMatch = paramRegex.exec(line.substring(fix.col - 1));
      
      if (paramMatch) {
        const insertPos = fix.col - 1 + paramMatch.index + paramMatch[0].length;
        line = line.substring(0, insertPos) + ': any' + line.substring(insertPos);
        lines[lineIdx] = line;
      }
    }
    
    fs.writeFileSync(file, lines.join('\n'), 'utf-8');
    console.log(`Fixed ${fileFixList.length} errors in ${path.relative(path.resolve(__dirname, '..'), file)}`);
  } catch (e) {
    console.error(`Error fixing ${file}: ${e.message}`);
  }
}

console.log('Done!');
