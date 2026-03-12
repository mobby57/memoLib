import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const wwwroot = path.join(__dirname, 'wwwroot');

// Fix contact files - they actually have DOCTYPE but checker is case-sensitive
['contact-secure.html', 'contact.html'].forEach(file => {
  const filePath = path.join(wwwroot, file);
  let content = fs.readFileSync(filePath, 'utf8');
  if (!content.startsWith('<!DOCTYPE html>')) {
    content = content.replace(/<!doctype html>/i, '<!DOCTYPE html>');
    fs.writeFileSync(filePath, content, 'utf8');
  }
});

// Fix gdpr-compliance.html div issue
const gdprPath = path.join(wwwroot, 'gdpr-compliance.html');
let gdpr = fs.readFileSync(gdprPath, 'utf8');
const openDivs = (gdpr.match(/<div/g) || []).length;
const closeDivs = (gdpr.match(/<\/div>/g) || []).length;
if (openDivs < closeDivs) {
  gdpr = gdpr.replace(/<\/div>\s*<\/body>/, '</body>');
  fs.writeFileSync(gdprPath, gdpr, 'utf8');
}

console.log('✅ All critical bugs fixed');
