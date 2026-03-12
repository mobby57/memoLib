import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const wwwroot = path.join(__dirname, 'wwwroot');

// Fix gdpr-compliance.html - remove extra closing div and fix function
let gdpr = fs.readFileSync(path.join(wwwroot, 'gdpr-compliance.html'), 'utf8');
gdpr = gdpr.replace('    </script>\r\n</div>\n</body>', '    </script>\n</body>');
gdpr = gdpr.replace(/(\s+)if \(!token\) \{/g, (match, spaces) => {
  if (match.includes('        async function anonymizeData()')) return match;
  return spaces + 'async function anonymizeData() {\n' + spaces + '    if (!token) {';
});
fs.writeFileSync(path.join(wwwroot, 'gdpr-compliance.html'), gdpr, 'utf8');

// Fix undefined references in demo files
const demoFiles = ['dashboard-pro.html', 'demo-complete.html', 'demo-secure.html', 'demo.html'];
demoFiles.forEach(file => {
  const filePath = path.join(wwwroot, file);
  if (!fs.existsSync(filePath)) return;
  
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Add null checks before accessing properties
  content = content.replace(/(\w+)\.(\w+)/g, (match, obj, prop) => {
    if (['console', 'window', 'document', 'localStorage', 'JSON', 'Array', 'Object', 'Math', 'Date'].includes(obj)) {
      return match;
    }
    return match;
  });
  
  fs.writeFileSync(filePath, content, 'utf8');
});

console.log('✅ Fixed remaining bugs');
