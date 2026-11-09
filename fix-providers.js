const fs = require('fs');
const file = "src/components/LayoutWrapper.tsx";

if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    
    // On s'assure que les providers sont importés
    if (!content.includes("ToastProvider")) {
        content = content.replace(/(import .* from '.*';\n)/, "$1import { ToastProvider } from '@/components/ui/Toast';\n");
    }
    if (!content.includes("NotificationProvider")) {
        content = content.replace(/(import .* from '.*';\n)/, "$1import { NotificationProvider } from '@/components/NotificationProvider';\n");
    }

    // On cherche la première balise ouvrante du return pour envelopper
    const returnIndex = content.indexOf('return (');
    if (returnIndex !== -1) {
        const firstTagMatch = content.substring(returnIndex).match(/<([a-zA-Z0-9]+)[^>]*>/);
        if (firstTagMatch) {
            const insertPos = returnIndex + firstTagMatch.index;
            // On enveloppe avec les providers
            content = content.slice(0, insertPos) + 
                      "<ToastProvider>\n      <NotificationProvider>\n        " + 
                      content.slice(insertPos);
            
            // On ferme les balises juste avant la parenthèse finale
            const endReturnIndex = content.lastIndexOf(');');
            if (endReturnIndex !== -1) {
                content = content.slice(0, endReturnIndex) + 
                          "      </NotificationProvider>\n    </ToastProvider>\n  " + 
                          content.slice(endReturnIndex);
            }
            console.log("✅ Providers injectés dans LayoutWrapper.tsx.");
        }
    } else {
        console.log("⚠️ Impossible de trouver le 'return (' dans LayoutWrapper.tsx.");
    }

    fs.writeFileSync(file, content, 'utf8');
} else {
    console.log("❌ Fichier LayoutWrapper.tsx introuvable.");
}
