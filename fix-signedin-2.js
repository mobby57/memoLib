const fs = require('fs');
const file = "src/hooks/useWebSocket.ts";

if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    
    // 1. S'assurer que useAuth est importé
    if (!content.includes("from '@clerk/nextjs'")) {
        // Ajouter l'import après le premier import existant
        content = content.replace(/^(import .*?\n)/m, "$1import { useAuth } from '@clerk/nextjs';\n");
    }
    
    // 2. Injecter la variable isSignedIn au début de la fonction useWebSocket
    if (!content.includes("const { isSignedIn }")) {
        // Trouver la déclaration de la fonction useWebSocket
        const funcRegex = /(export\s+function\s+useWebSocket\s*\([^)]*\)\s*\{)/;
        if (funcRegex.test(content)) {
            content = content.replace(funcRegex, "$1\n  const { isSignedIn } = useAuth();\n");
            console.log("✅ isSignedIn injecté dans useWebSocket.ts");
        } else {
            // Fallback : chercher un export const useWebSocket = (...) => {
            const arrowRegex = /(export\s+const\s+useWebSocket\s*=\s*\([^)]*\)\s*=>\s*\{)/;
            if (arrowRegex.test(content)) {
                content = content.replace(arrowRegex, "$1\n  const { isSignedIn } = useAuth();\n");
                console.log("✅ isSignedIn injecté (arrow function)");
            } else {
                console.log("❌ Fonction useWebSocket introuvable.");
            }
        }
    } else {
        console.log("ℹ️ isSignedIn est déjà présent.");
    }
    
    fs.writeFileSync(file, content, 'utf8');
} else {
    console.log("❌ Fichier useWebSocket.ts introuvable.");
}
