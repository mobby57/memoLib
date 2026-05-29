const fs = require('fs');
let c = fs.readFileSync('src/app/[locale]/dashboard/page.tsx', 'utf8');

// Fix "cabinet e{' '}" -> "cabinet - "
c = c.replace(/cabinet e\{' '\}/g, "cabinet -{' '}");

// Fix emoji ?? placeholders with simple text
c = c.replace(/'\?\? Masquer/g, "'Masquer");
c = c.replace(/'\?\? Voir/g, "'Voir");

// Fix "Masquer metriques" labels
c = c.replace(/{showMetrics \? '.*Masquer.*' : '.*Voir.*'}/g, 
  "{showMetrics ? 'Masquer metriques' : 'Voir metriques'}");

console.log('Dashboard fixed');
fs.writeFileSync('src/app/[locale]/dashboard/page.tsx', c, 'utf8');
