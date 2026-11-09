const fs = require('fs');
const file = "src/components/GlobalCommandPalette.tsx";

if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    
    // 1. Remplacer la dépendance exacte
    content = content.replace(/\}, \[isOpen, session\]\);/g, "}, [isOpen]);");
    content = content.replace(/\}, \[session, isOpen\]\);/g, "}, [isOpen]);");
    
    // 2. Si le mot "session" est utilisé DANS le useEffect sans être défini, on l'enlève
    content = content.replace(/const \{ data: session \} = useSession\(\);/g, "const session = null;");
    content = content.replace(/const \{ data: session \} = useSession\(\);/g, "");
    
    // 3. Sécurité absolue : s'il reste "session" dans les dépendances, on le vire
    content = content.replace(/, session/g, "");
    content = content.replace(/session, /g, "");

    fs.writeFileSync(file, content, 'utf8');
    console.log("✅ Fichier corrigé avec succès.");
} else {
    console.log("❌ Fichier introuvable.");
}
