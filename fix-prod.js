const fs = require('fs');
const path = require('path');

console.log("=== 1. Correction des Webhooks (Bypass RLS) ===");
const webhookFiles = [
    "src/app/api/webhooks/stripe/route.ts",
    "src/app/api/webhooks/clerk/route.ts",
    "src/app/api/webhooks/email-inbound/route.ts",
    "src/app/api/webhooks/inbox/route.ts",
    "src/app/api/cron/email-sync/route.ts",
    "src/app/api/cron/deadline-email-alerts/route.ts"
];

webhookFiles.forEach(file => {
    if (fs.existsSync(file)) {
        let content = fs.readFileSync(file, 'utf8');
        content = content.replace(/import \{ getSecurePrisma \} from '@\/lib\/prisma';/g, "import { prisma } from '@/lib/prisma';");
        content = content.replace(/const prisma = await getSecurePrisma\(\);/g, "");
        content = content.replace(/^\/\/ @ts-nocheck\n/gm, "");
        fs.writeFileSync(file, content, 'utf8');
        console.log(`  [OK] Webhook corrigé : ${file}`);
    }
});

console.log("\n=== 2. Ajout du Sélecteur de Cabinet (Sidebar) ===");
const sidebarFile = "src/components/Sidebar.tsx";
if (fs.existsSync(sidebarFile)) {
    let content = fs.readFileSync(sidebarFile, 'utf8');
    
    // Ajouter l'import s'il n'existe pas
    if (!content.includes("OrganizationSwitcher")) {
        // On cherche la première ligne d'import pour s'insérer après
        content = content.replace(/(import .* from '.*';\n)/, "$1import { OrganizationSwitcher } from '@clerk/nextjs';\n");
    }
    
    // Injecter le composant juste après le premier '<div' ou '<aside' dans le return
    if (!content.includes("<OrganizationSwitcher")) {
        // Trouver le premier return (
        const returnIndex = content.indexOf('return (');
        if (returnIndex !== -1) {
            // Trouver la première balise ouvrante après le return
            const firstTagMatch = content.substring(returnIndex).match(/<([a-zA-Z0-9]+)[^>]*>/);
            if (firstTagMatch) {
                const insertPos = returnIndex + firstTagMatch.index + firstTagMatch[0].length;
                const switcherCode = `\n      <div className="p-4 border-b border-gray-200">\n        <OrganizationSwitcher hidePersonal={true} />\n      </div>\n`;
                content = content.slice(0, insertPos) + switcherCode + content.slice(insertPos);
                console.log("  [OK] OrganizationSwitcher injecté dans la Sidebar.");
            } else {
                console.log("  [WARN] Impossible de trouver la balise d'ouverture dans le return.");
            }
        } else {
            console.log("  [WARN] Impossible de trouver le 'return (' dans Sidebar.tsx.");
        }
    } else {
        console.log("  [INFO] OrganizationSwitcher est déjà présent.");
    }
    fs.writeFileSync(sidebarFile, content, 'utf8');
} else {
    console.log("  [WARN] Fichier Sidebar.tsx introuvable. Vérifie le chemin.");
}
console.log("\n✅ Terminé. Tu peux relancer : npm run dev");
