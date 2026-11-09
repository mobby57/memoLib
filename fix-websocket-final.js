const fs = require('fs');
const file = "src/hooks/useWebSocket.ts";

if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    
    // 1. Nettoyer le contenu des directives mal placées
    content = content.replace(/'use client';\n?/g, '');
    content = content.replace(/\/\/ @ts-nocheck\n?/g, '');
    
    // 2. S'assurer que useAuth est importé
    if (!content.includes("import { useAuth }")) {
        content = "import { useAuth } from '@clerk/nextjs';\n" + content;
    }
    
    // 3. Remettre les directives tout en haut dans le bon ordre
    content = "'use client';\n// @ts-nocheck\n" + content.trim();
    
    // 4. Injecter isSignedIn si absent
    if (!content.includes("const { isSignedIn }")) {
        const funcRegex = /(export\s+function\s+useWebSocket\s*\([^)]*\)\s*\{)/;
        if (funcRegex.test(content)) {
            content = content.replace(funcRegex, "$1\n  const { isSignedIn } = useAuth();\n");
        }
    }

    fs.writeFileSync(file, content, 'utf8');
    console.log("✅ useWebSocket.ts corrigé (use client en haut, isSignedIn injecté).");
} else {
    console.log("❌ Fichier introuvable.");
}
