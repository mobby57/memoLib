import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const wwwroot = path.join(__dirname, 'wwwroot');
const API_BASE = 'const API_BASE = window.location.origin;';

const fixes = {
  applied: 0,
  files: []
};

// Fix gdpr-compliance.html div mismatch
const gdprFile = path.join(wwwroot, 'gdpr-compliance.html');
if (fs.existsSync(gdprFile)) {
  let content = fs.readFileSync(gdprFile, 'utf8');
  
  // Count divs
  const openDivs = (content.match(/<div/g) || []).length;
  const closeDivs = (content.match(/<\/div>/g) || []).length;
  
  if (openDivs !== closeDivs) {
    // Add missing closing div before </body>
    content = content.replace('</body>', '</div>\n</body>');
    fs.writeFileSync(gdprFile, content, 'utf8');
    fixes.applied++;
    fixes.files.push('gdpr-compliance.html - Fixed unclosed div');
  }
}

// Fix all files with hardcoded API URLs
const htmlFiles = fs.readdirSync(wwwroot).filter(f => f.endsWith('.html'));

htmlFiles.forEach(file => {
  const filePath = path.join(wwwroot, file);
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;

  // Add API_BASE if using fetch and doesn't have it
  if (content.includes('fetch(') && !content.includes('API_BASE')) {
    // Find script tag
    const scriptMatch = content.match(/<script[^>]*>/);
    if (scriptMatch) {
      const scriptTag = scriptMatch[0];
      const insertPos = content.indexOf(scriptTag) + scriptTag.length;
      content = content.slice(0, insertPos) + '\n    ' + API_BASE + '\n' + content.slice(insertPos);
      modified = true;
    }
  }

  // Replace hardcoded localhost URLs
  const patterns = [
    { from: /fetch\(['"]http:\/\/localhost:5078/g, to: 'fetch(`${API_BASE}' },
    { from: /fetch\(['"]\/api\//g, to: 'fetch(`${API_BASE}/api/' },
    { from: /fetch\("\/api\//g, to: 'fetch(`${API_BASE}/api/' },
    { from: /fetch\('\/api\//g, to: 'fetch(`${API_BASE}/api/' }
  ];

  patterns.forEach(({ from, to }) => {
    if (from.test(content)) {
      content = content.replace(from, to);
      modified = true;
    }
  });

  // Fix undefined references in specific files
  if (['dashboard-pro.html', 'demo-complete.html', 'demo-secure.html', 'demo.html'].includes(file)) {
    // Add null checks for common undefined issues
    if (content.includes('function') && !content.includes('if (!')) {
      // This is a heuristic - would need specific analysis per file
      modified = false; // Skip for now, needs manual review
    }
  }

  if (modified) {
    fs.writeFileSync(filePath, content, 'utf8');
    fixes.applied++;
    fixes.files.push(`${file} - Fixed API URLs`);
  }
});

console.log('\n✅ FIXES APPLIED\n');
console.log(`Total fixes: ${fixes.applied}`);
fixes.files.forEach(f => console.log(`  - ${f}`));
console.log('\n📄 Run check-pages.js again to verify');
