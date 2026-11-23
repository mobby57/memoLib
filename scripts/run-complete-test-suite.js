#!/usr/bin/env node

/**
 * MemoLib Complete Automated Test Suite
 * Runs all tests with comprehensive reporting and health checks
 * Date: 2026-11-23
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const chalk = require('chalk');

const RESULTS_DIR = path.join(__dirname, '..', '.test-results');
const REPORT_FILE = path.join(RESULTS_DIR, 'test-report.json');
const SUMMARY_FILE = path.join(RESULTS_DIR, 'test-summary.txt');

// Ensure results directory exists
if (!fs.existsSync(RESULTS_DIR)) {
  fs.mkdirSync(RESULTS_DIR, { recursive: true });
}

class TestRunner {
  constructor() {
    this.results = {
      timestamp: new Date().toISOString(),
      suites: [],
      totalTests: 0,
      passed: 0,
      failed: 0,
      skipped: 0,
      duration: 0,
    };
    this.startTime = Date.now();
  }

  log(message, type = 'info') {
    const colors = {
      info: chalk.blue,
      success: chalk.green,
      error: chalk.red,
      warning: chalk.yellow,
      header: chalk.cyan.bold,
    };
    console.log(colors[type]?.(message) || message);
  }

  async runCommand(cmd, args, label, description) {
    return new Promise((resolve) => {
      this.log(`\n📋 ${label}`, 'header');
      this.log(`   ${description}`, 'info');

      const startTime = Date.now();
      const child = spawn(cmd, args, {
        stdio: 'inherit',
        shell: true,
        cwd: path.join(__dirname, '..'),
      });

      child.on('close', (code) => {
        const duration = Date.now() - startTime;
        const passed = code === 0;

        this.results.suites.push({
          label,
          description,
          passed,
          duration,
          command: `${cmd} ${args.join(' ')}`,
        });

        if (passed) {
          this.log(`✅ ${label} passed (${(duration / 1000).toFixed(2)}s)`, 'success');
        } else {
          this.log(`❌ ${label} failed (${(duration / 1000).toFixed(2)}s)`, 'error');
        }

        resolve(passed);
      });
    });
  }

  async runAllTests() {
    this.log('\n╔════════════════════════════════════════════════════╗', 'header');
    this.log('║  🚀 MemoLib Complete Automated Test Suite         ║', 'header');
    this.log('╚════════════════════════════════════════════════════╝', 'header');

    const testSuites = [
      // 1. Unit Tests
      {
        cmd: 'npm',
        args: ['run', 'test:unit'],
        label: '1️⃣  Unit Tests',
        description: 'Core business logic, utils, constants, types',
      },
      // 2. Component Tests
      {
        cmd: 'npm',
        args: ['run', 'test:components'],
        label: '2️⃣  Component Tests',
        description: 'React components, UI elements, hooks',
      },
      // 3. Integration Tests
      {
        cmd: 'npm',
        args: ['run', 'test:integration'],
        label: '3️⃣  Integration Tests',
        description: 'API routes, database integration, external services',
      },
      // 4. CI Test Suite
      {
        cmd: 'npm',
        args: ['run', 'test:ci'],
        label: '4️⃣  CI Test Suite',
        description: 'Fast CI-optimized tests (excludes slow paths)',
      },
      // 5. E2E Tests
      {
        cmd: 'npm',
        args: ['run', 'test:e2e'],
        label: '5️⃣  E2E Tests',
        description: 'Full user workflows with Playwright',
      },
      // 6. Security Tests
      {
        cmd: 'npm',
        args: ['run', 'test:security'],
        label: '6️⃣  Security Tests',
        description: 'Authentication, authorization, encryption, RGPD',
      },
      // 7. Performance Tests
      {
        cmd: 'npm',
        args: ['run', 'test:performance'],
        label: '7️⃣  Performance Tests',
        description: 'Load testing, response times, memory usage',
      },
      // 8. Health Checks
      {
        cmd: 'npm',
        args: ['run', 'test:health'],
        label: '8️⃣  Health Checks',
        description: 'Application status, database connectivity',
      },
      // 9. Smoke Tests
      {
        cmd: 'npm',
        args: ['run', 'test:smoke'],
        label: '9️⃣  Smoke Tests',
        description: 'Critical path verification',
      },
      // 10. Type Checking
      {
        cmd: 'npm',
        args: ['run', 'type-check'],
        label: '🔟 Type Checking',
        description: 'TypeScript strict mode validation',
      },
      // 11. Linting
      {
        cmd: 'npm',
        args: ['run', 'lint'],
        label: '1️⃣1️⃣  Code Linting',
        description: 'ESLint, code quality, style violations',
      },
      // 12. Coverage Report
      {
        cmd: 'npm',
        args: ['run', 'test:coverage'],
        label: '1️⃣2️⃣  Coverage Report',
        description: 'Test coverage metrics and analysis',
      },
    ];

    for (const suite of testSuites) {
      const passed = await this.runCommand(
        suite.cmd,
        suite.args,
        suite.label,
        suite.description
      );
      if (passed) {
        this.results.passed++;
      } else {
        this.results.failed++;
      }
    }

    this.results.duration = Date.now() - this.startTime;
    this.results.totalTests = testSuites.length;

    this.printSummary();
    this.saveResults();
  }

  printSummary() {
    const duration = (this.results.duration / 1000 / 60).toFixed(2);
    const passRate = ((this.results.passed / this.results.totalTests) * 100).toFixed(1);

    this.log('\n╔════════════════════════════════════════════════════╗', 'header');
    this.log('║  📊 Test Suite Summary                            ║', 'header');
    this.log('╚════════════════════════════════════════════════════╝', 'header');

    console.log('\n');
    this.log(`Total Suites: ${this.results.totalTests}`, 'info');
    this.log(`✅ Passed: ${this.results.passed}`, 'success');
    this.log(`❌ Failed: ${this.results.failed}`, this.results.failed > 0 ? 'error' : 'success');
    this.log(`⏱️  Duration: ${duration} minutes`, 'info');
    this.log(`📈 Pass Rate: ${passRate}%`, passRate === '100.0' ? 'success' : 'warning');

    if (passRate === '100.0') {
      this.log('\n🎉 ALL TESTS PASSED! MemoLib is production-ready.', 'success');
    } else {
      this.log(
        `\n⚠️  ${this.results.failed} test suite(s) failed. Review logs above.`,
        'warning'
      );
    }
  }

  saveResults() {
    fs.writeFileSync(REPORT_FILE, JSON.stringify(this.results, null, 2));

    let summary = `MemoLib Complete Test Suite Report\n`;
    summary += `Generated: ${new Date().toISOString()}\n`;
    summary += `\n${'='.repeat(60)}\n`;
    summary += `Total Test Suites: ${this.results.totalTests}\n`;
    summary += `Passed: ${this.results.passed}\n`;
    summary += `Failed: ${this.results.failed}\n`;
    summary += `Duration: ${(this.results.duration / 1000 / 60).toFixed(2)} minutes\n`;
    summary += `Pass Rate: ${((this.results.passed / this.results.totalTests) * 100).toFixed(1)}%\n`;
    summary += `${'='.repeat(60)}\n\n`;

    summary += `Test Suites:\n`;
    this.results.suites.forEach((suite) => {
      const status = suite.passed ? '✅' : '❌';
      summary += `${status} ${suite.label}\n`;
      summary += `   ${suite.description}\n`;
      summary += `   Duration: ${(suite.duration / 1000).toFixed(2)}s\n`;
      summary += `   Command: ${suite.command}\n\n`;
    });

    fs.writeFileSync(SUMMARY_FILE, summary);
    this.log(`\n📁 Report saved to: ${REPORT_FILE}`, 'info');
    this.log(`📄 Summary saved to: ${SUMMARY_FILE}`, 'info');
  }
}

async function main() {
  const runner = new TestRunner();
  await runner.runAllTests();
  process.exit(runner.results.failed > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
