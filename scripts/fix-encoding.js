const fs = require('fs');
const path = require('path');
let fixed = 0;

function fix(dir) {
  const files = fs.readdirSync(dir, { withFileTypes: true });
  for (const f of files) {
    const full = path.join(dir, f.name);
    if (f.isDirectory() && !f.name.includes('node_modules') && !f.name.includes('.next') && !f.name.includes('.git')) {
      fix(full);
    } else if (f.name.endsWith('.tsx') || f.name.endsWith('.ts')) {
      try {
        const buf = fs.readFileSync(full);
        let c = buf.toString('utf8');
        if (/\xef\xbf\xbd|\xc3[\xa0-\xbf]|\xc2[\xa0-\xbf]|\xc3\x89/.test(buf.toString('latin1')) || /\ufffd/.test(c)) {
          // Try reading as latin1 (Windows-1252) and re-encoding as UTF-8
          const latin1 = buf.toString('latin1');
          // Check if it looks like double-encoded UTF-8
          if (/Ã©|Ã¨|Ã |Ã§|Ã®|Ã´/.test(latin1)) {
            // Double encoded: latin1 bytes are actually UTF-8
            const fixed_buf = Buffer.from(latin1, 'latin1');
            c = fixed_buf.toString('utf8');
          }
          // Replace remaining replacement characters
          c = c.replace(/\ufffd/g, 'e');
          fs.writeFileSync(full, c, 'utf8');
          fixed++;
        }
      } catch (e) {}
    }
  }
}

fix('src');
console.log('Fixed', fixed, 'files');
