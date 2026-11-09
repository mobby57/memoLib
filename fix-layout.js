const fs = require('fs');
const file = "src/app/[locale]/layout.tsx";

if (!fs.existsSync(file)) {
    console.log("❌ layout.tsx introuvable");
    process.exit(1);
}

let content = fs.readFileSync(file, 'utf8');

// 1. Ajouter l'import si absent
if (!content.includes('AppProviders')) {
    content = content.replace(/(import .* from '.*';\n)/, "$1import { AppProviders } from '@/components/AppProviders';\n");
}

// 2. Envelopper <LayoutWrapper>...</LayoutWrapper> avec <AppProviders>
if (content.includes('<LayoutWrapper>') && !content.includes('<AppProviders>')) {
    content = content.replace('<LayoutWrapper>', '<AppProviders>\n        <LayoutWrapper>');
    content = content.replace('</LayoutWrapper>', '</LayoutWrapper>\n      </AppProviders>');
    console.log("✅ LayoutWrapper enveloppé dans AppProviders.");
} else if (content.includes('<AppProviders>')) {
    console.log("ℹ️ AppProviders déjà présent.");
} else {
    console.log("⚠️ Balise <LayoutWrapper> introuvable dans layout.tsx. Vérifie manuellement.");
}

fs.writeFileSync(file, content, 'utf8');
