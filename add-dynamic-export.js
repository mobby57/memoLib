/**
 * Script to add 'export const dynamic = "force-dynamic"' to all client page.tsx files
 * This prevents prerendering errors with React hooks during Azure SWA builds
 */

const fs = require('fs');
const path = require('path');

const srcAppDir = path.join(__dirname, 'src', 'app');

function findPageFiles(dir) {
  let results = [];
  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      results = results.concat(findPageFiles(filePath));
    } else if (file === 'page.tsx') {
      results.push(filePath);
    }
  }
  
  return results;
}

function addDynamicExport(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  
  // Skip if already has dynamic export
  if (content.includes('export const dynamic')) {
    console.log(`⏭️  Skipping (already has dynamic): ${filePath}`);
    return false;
  }
  
  // Only process client components
  if (!content.includes("'use client'") && !content.includes('"use client"')) {
    console.log(`⏭️  Skipping (not client): ${filePath}`);
    return false;
  }
  
  // Add dynamic export after 'use client'
  const newContent = content.replace(
    /(['"])use client\1;?\s*/,
    `$1use client$1;\n\n// Force dynamic to prevent prerendering errors with React hooks\nexport const dynamic = 'force-dynamic';\n\n`
  );
  
  if (newContent === content) {
    console.log(`⚠️  Could not modify: ${filePath}`);
    return false;
  }
  
  fs.writeFileSync(filePath, newContent, 'utf8');
  console.log(`✅ Modified: ${filePath}`);
  return true;
}

console.log('🔍 Searching for page.tsx files...\n');

const pageFiles = findPageFiles(srcAppDir);
console.log(`Found ${pageFiles.length} page.tsx files\n`);

let modified = 0;
for (const file of pageFiles) {
  if (addDynamicExport(file)) {
    modified++;
  }
}

console.log(`\n✅ Modified ${modified} files`);
console.log('🚀 Run "npm run build" to rebuild the project');
