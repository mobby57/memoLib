import fs from 'fs';
import path from 'path';

const dir = path.join(__dirname, 'scenarios');
const files = fs.readdirSync(dir).filter(f => f.endsWith('.json'));
let errors = 0;
for (const file of files) {
const content = fs.readFileSync(path.join(dir, file), 'utf-8');
const scenarios = JSON.parse(content);
for (const s of scenarios) {
if (!s.id || !s.description || !s.legalBasis || !s.input || !s.expected) {
console.error(❌ ${file} : scénario invalide, s);
errors++;
}
}
}
if (errors) process.exit(1);
console.log('✅ Tous les scénarios sont valides.');
