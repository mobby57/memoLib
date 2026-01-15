#!/usr/bin/env node

/**
 * Security Monitoring Script
 * Run weekly to check for vulnerabilities and generate reports
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

async function runSecurityAudit() {
  console.log('🔍 Running security audit...\n');
  
  try {
    // Run npm audit and capture output
    const auditResult = execSync('npm audit --json', { encoding: 'utf8' });
    const audit = JSON.parse(auditResult);
    
    // Generate summary
    const summary = {
      timestamp: new Date().toISOString(),
      vulnerabilities: audit.metadata?.vulnerabilities || {},
      totalVulns: Object.values(audit.metadata?.vulnerabilities || {}).reduce((a, b) => a + b, 0),
      productionAffected: checkProductionDependencies(audit)
    };
    
    // Create report
    const report = generateReport(summary);
    
    // Save to file
    const reportPath = path.join(__dirname, '..', 'security-reports', `audit-${Date.now()}.md`);
    fs.mkdirSync(path.dirname(reportPath), { recursive: true });
    fs.writeFileSync(reportPath, report);
    
    console.log(`📊 Report saved: ${reportPath}`);
    
    // Alert if critical vulnerabilities found
    if (summary.vulnerabilities.critical > 0 || summary.productionAffected) {
      console.log('🚨 CRITICAL: Production vulnerabilities detected!');
      process.exit(1);
    }
    
    console.log('✅ Security audit completed successfully');
    
  } catch (error) {
    console.error('❌ Security audit failed:', error.message);
    process.exit(1);
  }
}

function checkProductionDependencies(audit) {
  // Check if any vulnerabilities affect production dependencies
  const prodDeps = require('../package.json').dependencies || {};
  
  for (const [name, vuln] of Object.entries(audit.vulnerabilities || {})) {
    if (prodDeps[name]) {
      return true;
    }
  }
  return false;
}

function generateReport(summary) {
  return `# Security Audit Report

**Date:** ${new Date(summary.timestamp).toLocaleDateString()}
**Total Vulnerabilities:** ${summary.totalVulns}
**Production Affected:** ${summary.productionAffected ? '🚨 YES' : '✅ NO'}

## Vulnerability Breakdown

- **Critical:** ${summary.vulnerabilities.critical || 0}
- **High:** ${summary.vulnerabilities.high || 0}
- **Moderate:** ${summary.vulnerabilities.moderate || 0}
- **Low:** ${summary.vulnerabilities.low || 0}

## Status

${summary.vulnerabilities.critical > 0 || summary.productionAffected 
  ? '🚨 **IMMEDIATE ACTION REQUIRED**' 
  : '✅ **SECURE FOR PRODUCTION**'}

## Next Steps

${summary.totalVulns > 0 
  ? '1. Review vulnerabilities with `npm audit`\n2. Update dependencies with `npm update`\n3. Run `npm audit fix` for automatic fixes'
  : '1. Continue regular monitoring\n2. Keep dependencies updated\n3. Review monthly'}
`;
}

if (require.main === module) {
  runSecurityAudit();
}

module.exports = { runSecurityAudit };