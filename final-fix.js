const fs = require('fs');

// ============================================
// 1. NotificationCenter.tsx (Version blindée)
// ============================================
const ncContent = `'use client';

import { useNotifications } from '@/components/NotificationProvider';

export default function NotificationCenter() {
  const { notifications } = useNotifications();
  
  // Sécurité absolue : si le provider n'est pas prêt, on affiche un tableau vide
  const safe = notifications || {
    emails: [],
    dossiers: [],
    deadlines: [],
    system: []
  };

  const allNotifications = [
    ...(safe.emails || []).map(n => ({ ...n, category: 'email' })),
    ...(safe.dossiers || []).map(n => ({ ...n, category: 'dossier' })),
    ...(safe.deadlines || []).map(n => ({ ...n, category: 'deadline' })),
    ...(safe.system || []).map(n => ({ ...n, category: 'system' }))
  ];

  return (
    <div className="relative">
      <div className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
          <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
        </svg>
        {allNotifications.length > 0 && (
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
        )}
      </div>
    </div>
  );
}
`;
fs.writeFileSync('src/components/NotificationCenter.tsx', ncContent, 'utf8');
console.log('✅ NotificationCenter.tsx écrasé (blindé).');

// ============================================
// 2. Correction de tous les imports Prisma
// ============================================
function fixPrismaImport(file) {
    if (!fs.existsSync(file)) return;
    let content = fs.readFileSync(file, 'utf8');
    // Corrige "import prisma from" en "import { prisma } from"
    if (content.includes("import prisma from '@/lib/prisma'")) {
        content = content.replace(/import prisma from '@\/lib\/prisma'/g, "import { prisma } from '@/lib/prisma'");
        fs.writeFileSync(file, content, 'utf8');
        console.log(`  [FIX IMPORT] ${file}`);
    }
}
fixPrismaImport('src/app/api/clients/route.ts');

// ============================================
// 3. Injection du OrganizationSwitcher
// ============================================
const sidebarFile = "src/components/Sidebar.tsx";
if (fs.existsSync(sidebarFile)) {
    let content = fs.readFileSync(sidebarFile, 'utf8');
    if (!content.includes("OrganizationSwitcher")) {
        // Ajouter l'import
        content = content.replace(/(import .* from '.*';\n)/, "$1import { OrganizationSwitcher } from '@clerk/nextjs';\n");
        // Trouver le premier <div ou <nav dans le return
        const returnIndex = content.indexOf('return (');
        if (returnIndex !== -1) {
            const match = content.substring(returnIndex).match(/<([a-zA-Z0-9]+)[^>]*>/);
            if (match) {
                const insertPos = returnIndex + match.index + match[0].length;
                const switcher = `\n      <div className="p-4 border-b border-gray-200 dark:border-gray-700">\n        <OrganizationSwitcher hidePersonal={true} />\n      </div>\n`;
                content = content.slice(0, insertPos) + switcher + content.slice(insertPos);
                fs.writeFileSync(sidebarFile, content, 'utf8');
                console.log('✅ OrganizationSwitcher injecté dans la Sidebar.');
            }
        }
    } else {
        console.log('ℹ️ OrganizationSwitcher déjà présent.');
    }
}
