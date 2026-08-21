/**
 * Script de migration Jest → Vitest
 * 
 * Transformations :
 * 1. Remplace `import { ... } from '@jest/globals'` → `import { ... } from 'vitest'`
 * 2. Remplace `jest.fn()` → `vi.fn()`
 * 3. Remplace `jest.mock()` → `vi.mock()`
 * 4. Remplace `jest.spyOn()` → `vi.spyOn()`
 * 5. Remplace `jest.resetModules()` → `vi.resetModules()`
 * 6. Remplace `jest.clearAllMocks()` → `vi.clearAllMocks()`
 * 7. Remplace `jest.useFakeTimers()` → `vi.useFakeTimers()`
 * 8. Remplace `jest.useRealTimers()` → `vi.useRealTimers()`
 * 9. Supprime `@jest-environment` directives
 * 10. Ajoute `import { vi } from 'vitest'` si manquant
 * 
 * Usage: npx tsx scripts/migrate-jest-to-vitest.ts [--dry-run] [--path src/__tests__/security]
 */

import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join, relative } from 'path';

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const pathArg = args.find(a => a.startsWith('--path='))?.replace('--path=', '') || 'src/__tests__';

const ROOT = process.cwd();
const TARGET = join(ROOT, pathArg);

let filesProcessed = 0;
let filesModified = 0;
let totalReplacements = 0;

function getAllTestFiles(dir: string): string[] {
  const files: string[] = [];
  for (const entry of readdirSync(dir)) {
    const fullPath = join(dir, entry);
    const stat = statSync(fullPath);
    if (stat.isDirectory()) {
      files.push(...getAllTestFiles(fullPath));
    } else if (entry.match(/\.(test|spec)\.(ts|tsx|js|jsx)$/)) {
      files.push(fullPath);
    }
  }
  return files;
}

function migrateFile(filePath: string): { modified: boolean; replacements: number } {
  let content = readFileSync(filePath, 'utf-8');
  const original = content;
  let replacements = 0;

  // 1. Supprimer @jest-environment directives
  content = content.replace(/\/\*\*?\s*\*?\s*@jest-environment\s+\w+\s*\*?\s*\*\/\n?/g, () => { replacements++; return ''; });

  // 2. Remplacer imports Jest
  content = content.replace(
    /import\s*\{([^}]*)\}\s*from\s*['"]@jest\/globals['"]\s*;?/g,
    (_, imports: string) => {
      replacements++;
      // Extraire les imports et ajouter vi si jest était importé
      const importList = imports.split(',').map((s: string) => s.trim()).filter(Boolean);
      const vitestImports = importList
        .filter((i: string) => i !== 'jest')
        .map((i: string) => i === 'jest' ? 'vi' : i);
      if (importList.includes('jest') && !vitestImports.includes('vi')) {
        vitestImports.push('vi');
      }
      return `import { ${vitestImports.join(', ')} } from 'vitest';`;
    }
  );

  // 3. Remplacer jest.* → vi.*
  const jestToVi = [
    ['jest.fn', 'vi.fn'],
    ['jest.mock', 'vi.mock'],
    ['jest.spyOn', 'vi.spyOn'],
    ['jest.resetModules', 'vi.resetModules'],
    ['jest.clearAllMocks', 'vi.clearAllMocks'],
    ['jest.clearAllTimers', 'vi.clearAllTimers'],
    ['jest.useFakeTimers', 'vi.useFakeTimers'],
    ['jest.useRealTimers', 'vi.useRealTimers'],
    ['jest.advanceTimersByTime', 'vi.advanceTimersByTime'],
    ['jest.runAllTimers', 'vi.runAllTimers'],
    ['jest.runOnlyPendingTimers', 'vi.runOnlyPendingTimers'],
    ['jest.resetAllMocks', 'vi.resetAllMocks'],
    ['jest.restoreAllMocks', 'vi.restoreAllMocks'],
    ['jest.setTimeout', 'vi.setConfig({ testTimeout:'],
  ];

  for (const [from, to] of jestToVi) {
    const regex = new RegExp(from.replace('.', '\\.') + '\\b', 'g');
    const matches = content.match(regex);
    if (matches) {
      replacements += matches.length;
      content = content.replace(regex, to);
    }
  }

  // 4. Remplacer jest.Mock type → vi.Mock (avec ReturnType)
  content = content.replace(/as\s+jest\.Mock/g, () => { replacements++; return 'as any'; });
  content = content.replace(/jest\.Mock/g, () => { replacements++; return 'vi.Mock'; });
  content = content.replace(/jest\.Mocked/g, () => { replacements++; return 'vi.Mocked'; });

  // 5. Si vi est utilisé mais pas importé, ajouter l'import
  if (content.includes('vi.') && !content.includes("from 'vitest'") && !content.includes('from "vitest"')) {
    // Trouver le bon endroit pour ajouter l'import (après les commentaires initiaux)
    const firstImportIdx = content.search(/^import /m);
    if (firstImportIdx >= 0) {
      content = content.slice(0, firstImportIdx) + "import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';\n" + content.slice(firstImportIdx);
      replacements++;
    } else {
      content = "import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';\n\n" + content;
      replacements++;
    }
  }

  // 6. Si describe/it/expect sont utilisés sans import (global Jest), ajouter l'import Vitest
  if (!content.includes("from 'vitest'") && !content.includes('from "vitest"') && content.includes('describe(')) {
    content = "import { describe, it, expect, beforeEach, afterEach } from 'vitest';\n\n" + content;
    replacements++;
  }

  const modified = content !== original;
  if (modified && !dryRun) {
    writeFileSync(filePath, content, 'utf-8');
  }

  return { modified, replacements };
}

// --- Main ---
console.log(`\n🔄 Migration Jest → Vitest`);
console.log(`   Target: ${relative(ROOT, TARGET)}`);
console.log(`   Mode: ${dryRun ? '🔍 DRY RUN (aucune modification)' : '✏️ ÉCRITURE'}\n`);

const files = getAllTestFiles(TARGET);
console.log(`   Fichiers trouvés: ${files.length}\n`);

for (const file of files) {
  filesProcessed++;
  const { modified, replacements } = migrateFile(file);
  if (modified) {
    filesModified++;
    totalReplacements += replacements;
    console.log(`   ✅ ${relative(ROOT, file)} (${replacements} remplacements)`);
  }
}

console.log(`\n📊 Résultats:`);
console.log(`   Fichiers scannés : ${filesProcessed}`);
console.log(`   Fichiers modifiés: ${filesModified}`);
console.log(`   Remplacements    : ${totalReplacements}`);
if (dryRun) {
  console.log(`\n   ℹ️  Mode dry-run. Relancez sans --dry-run pour appliquer.`);
}
console.log('');
