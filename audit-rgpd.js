#!/usr/bin/env node
/**
 * PHASE 2 AUDIT: Find all console.log statements that log sensitive data
 * and generate a fix plan
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const SENSITIVE_KEYWORDS = [
  'email',
  'userEmail',
  'user\\.email',
  'password',
  'phone',
  'token',
  'secret',
  'key',
  'credential',
  'ssn',
  'creditCard',
  'api_key',
  'apiKey',
  'bearer',
  'authorization',
  'cookie',
];

console.log('🔍 Scanning for RGPD violations in console.log statements...\n');

// Scan all TS files in src/app/api
const apiDir = path.join(process.cwd(), 'src', 'app', 'api');
const findings = [];

function scanDirectory(dir) {
  const files = fs.readdirSync(dir);

  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      scanDirectory(fullPath);
    } else if (file.endsWith('.ts') && !file.endsWith('.test.ts')) {
      const content = fs.readFileSync(fullPath, 'utf8');
      const lines = content.split('\n');

      lines.forEach((line, index) => {
        // Look for console.log with sensitive data
        if (line.includes('console.log') || line.includes('console.error') || line.includes('console.warn')) {
          // Check if line contains sensitive keywords
          for (const keyword of SENSITIVE_KEYWORDS) {
            const regex = new RegExp(`console\\.(log|error|warn)\\s*\\([^)]*\\b${keyword}\\b`, 'i');
            if (regex.test(line)) {
              findings.push({
                file: fullPath.replace(process.cwd(), ''),
                line: index + 1,
                content: line.trim(),
                keyword,
              });
              break;
            }
          }
        }
      });
    }
  }
}

scanDirectory(apiDir);

if (findings.length === 0) {
  console.log('✅ No RGPD violations found in console.log statements!');
  console.log('');
  process.exit(0);
}

console.log(`⚠️  Found ${findings.length} potential RGPD violations:\n`);

// Group by file
const byFile = {};
for (const finding of findings) {
  if (!byFile[finding.file]) {
    byFile[finding.file] = [];
  }
  byFile[finding.file].push(finding);
}

// Print findings
for (const [file, issues] of Object.entries(byFile)) {
  console.log(`📄 ${file}`);
  for (const issue of issues) {
    console.log(`   Line ${issue.line}: ${issue.content.substring(0, 100)}`);
    console.log(`   ⚠️  Sensitive keyword: ${issue.keyword}\n`);
  }
  console.log('');
}

console.log(`\n📊 Summary:`);
console.log(`   Total violations: ${findings.length}`);
console.log(`   Files affected: ${Object.keys(byFile).length}`);
console.log(`\n💡 Fix Strategy:`);
console.log(`   1. Replace console.log(sensitiveData) with logger.info('action', {userId, timestamp})`);
console.log(`   2. Use redactSensitiveData() from src/lib/security/sensitive-data-redaction.ts`);
console.log(`   3. Never log full objects containing email/password/token`);
console.log('');

// Generate fix file
const fixFile = path.join(process.cwd(), 'PHASE_2_RGPD_FIX_PLAN.md');
let markdown = `# Phase 2: RGPD Logging Fix Plan\n\n`;
markdown += `**Generated:** ${new Date().toISOString()}\n`;
markdown += `**Total Violations:** ${findings.length}\n`;
markdown += `**Files Affected:** ${Object.keys(byFile).length}\n\n`;

markdown += `## Violations by File\n\n`;
for (const [file, issues] of Object.entries(byFile)) {
  markdown += `### ${file}\n\n`;
  for (const issue of issues) {
    markdown += `- **Line ${issue.line}**: Keyword: \`${issue.keyword}\`\n`;
    markdown += `  \`\`\`typescript\n`;
    markdown += `  ${issue.content}\n`;
    markdown += `  \`\`\`\n\n`;
  }
}

markdown += `## Fix Template\n\n`;
markdown += `\`\`\`typescript\n`;
markdown += `// BEFORE (RGPD violation):\n`;
markdown += `console.log('User created', {email: user.email, password: user.password});\n\n`;
markdown += `// AFTER (RGPD compliant):\n`;
markdown += `import { logger } from '@/lib/security/logger';\n`;
markdown += `logger.info('user_created', {userId: user.id, timestamp: new Date()});\n`;
markdown += `\`\`\`\n`;

fs.writeFileSync(fixFile, markdown);
console.log(`✅ Fix plan saved to: PHASE_2_RGPD_FIX_PLAN.md`);
