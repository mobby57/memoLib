const fs = require('fs');
const path = require('path');

const file = path.join('src', 'app', '[locale]', 'clients', 'page.tsx');

if (!fs.existsSync(file)) {
    console.error("❌ Fichier introuvable :", file);
    process.exit(1);
}

let content = fs.readFileSync(file, 'utf8');
const original = content;

// --- 1. Import de Link (détection robuste) ---
const hasLinkImport = /import\s+Link\s+from\s+['"]next\/link['"]/.test(content);
if (!hasLinkImport) {
    // insérer après le premier import existant
    const firstImport = content.match(/^import .*;?$/m);
    if (firstImport) {
        content = content.replace(firstImport[0], firstImport[0] + "\nimport Link from 'next/link';");
    } else {
        content = "import Link from 'next/link';\n" + content;
    }
    console.log("➕ import Link ajouté");
} else {
    console.log("ℹ️  import Link déjà présent");
}

// --- 2. Remplacement du <button> contenant "Nouveau client" ---
// On capture les attributs jusqu'au '>' en gérant les {…} et les quotes
const buttonRegex = /<button\b([^>]*?)>([\s\S]*?Nouveau client[\s\S]*?)<\/button>/;

if (!buttonRegex.test(content)) {
    console.warn("⚠️  Aucun <button> 'Nouveau client' trouvé.");
    console.warn("    → Vérifie la ligne ~891 dans le fichier :");
    console.warn("    Select-String -Path '" + file + "' -Pattern 'Nouveau client' -Context 2,2");
    process.exit(2);
}

content = content.replace(buttonRegex, (match, attrs, inner) => {
    // récupère className="..." (gère aussi className={...})
    let className;
    const classStr = attrs.match(/className\s*=\s*"([^"]*)"/);
    const classExpr = attrs.match(/className\s*=\s*\{([^}]*)\}/);
    if (classStr) className = classStr[1];
    else if (classExpr) className = `{${classExpr[1]}}`;

    // Nettoie les attributs : on ne garde que ce qui est utile au Link
    // (on retire onClick, type, disabled qui n'ont pas de sens sur un <Link>)
    const href = "clients/nouveau"; // relatif → next-intl gère la locale
    const cls = className
        ? (className.startsWith('{') ? `className=${className}` : `className="${className}"`)
        : 'className="inline-flex items-center gap-2 px-4 py-2 bg-white text-blue-700 rounded-lg"';

    return `<Link href="${href}" ${cls}>${inner}</Link>`;
});

if (content === original) {
    console.log("ℹ️  Aucune modification effectuée (déjà à jour ?)");
} else {
    fs.writeFileSync(file, content, 'utf8');
    console.log("✅ Bouton → <Link href=\"clients/nouveau\">");
}
