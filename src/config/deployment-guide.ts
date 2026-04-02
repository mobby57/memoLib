/**
 * Production Deployment Configuration Guide
 * Complete checklist and deployment procedures
 */

export const DeploymentGuide = {
  version: '1.0.0',
  releaseDate: new Date().toISOString().split('T')[0],
  phases: {
    phase4: 'Améliorations Importantes (Validation, Rate Limiting, Field Extraction)',
    phase5: 'Optimisations (Logging, Retry, Caching, Compression, Metrics)',
    phase6: 'Production Deployment (Build, Test, Deploy, Monitor)',
  },

  preDeploymentChecklist: {
    codeQuality: [
      {
        check: 'No TypeScript errors',
        command: 'NODE_OPTIONS=--max-old-space-size=16384 npx tsc --noEmit',
        expected: 'No errors',
        critical: true,
      },
      {
        check: 'ESLint passes',
        command: 'npm run lint',
        expected: 'No critical warnings',
        critical: true,
      },
      {
        check: 'All tests pass',
        command: 'npm test',
        expected: 'All tests passing',
        critical: true,
      },
      {
        check: 'No hardcoded secrets',
        command: 'grep -r "password\\|secret\\|key" src/ | grep -v node_modules',
        expected: 'No secrets in code',
        critical: true,
      },
    ],

    securityChecks: [
      {
        check: 'Environment variables documented',
        file: '.env.example',
        required: true,
      },
      {
        check: 'SENTRY_AUTH_TOKEN configured',
        env: 'SENTRY_AUTH_TOKEN',
        required: true,
      },
      {
        check: 'Database credentials in env',
        env: 'DATABASE_URL',
        required: true,
      },
      {
        check: 'API keys secured',
        env: 'UPSTASH_REDIS_REST_TOKEN, NEXTAUTH_SECRET',
        required: true,
      },
      {
        check: 'No console.log in production',
        scan: 'src/ (excluding tests)',
        required: true,
      },
    ],

    databaseChecks: [
      {
        check: 'Production database exists',
        command: 'psql -h <host> -U <user> -d memolib -c "SELECT version();"',
        expected: 'PostgreSQL 16',
      },
      {
        check: 'All 13 migrations ready',
        command: 'prisma migrate status',
        expected: '13 migrations applied',
        critical: true,
      },
      {
        check: 'Database user has correct permissions',
        permissions: ['SELECT', 'INSERT', 'UPDATE', 'DELETE', 'CREATE'],
      },
      {
        check: 'Backup configured',
        tool: 'pg_dump or cloud provider backup',
        schedule: 'Daily',
      },
    ],

    monitoringSetup: [
      {
        check: 'Sentry project created',
        url: 'https://sentry.io/settings/projects/',
        required: true,
      },
      {
        check: 'Sentry release configured',
        file: 'sentry.client.config.ts, sentry.server.config.ts',
        version: 'v1.0.0 or git hash',
      },
      {
        check: 'Metrics dashboard configured',
        endpoint: '/api/monitoring/metrics-dashboard',
        accessibleFromBrowser: true,
      },
      {
        check: 'Alerts configured in Sentry',
        triggers: ['Error rate > 5%', 'P99 latency > 5000ms'],
      },
    ],

    performanceOptimization: [
      {
        check: 'Build size < 500MB',
        command: 'ls -lh .next',
        target: '100-500MB',
      },
      {
        check: 'Image optimization enabled',
        file: 'next.config.js',
        setting: 'images.unoptimized=false for production',
      },
      {
        check: 'Compression middleware active',
        file: 'src/lib/compression.ts',
        level: 'gzip level 6 default',
      },
      {
        check: 'Caching headers configured',
        file: 'src/lib/response-cache.ts',
        ttl: '60 seconds default',
      },
    ],
  },

  buildSteps: [
    {
      step: 1,
      title: 'Clean Previous Build',
      commands: [
        'rm -rf .next',
        'rm -rf node_modules',
        'rm -rf .turbo',
        'npm cache clean --force',
      ],
      duration: '1-2 minutes',
      onWindows:
        'rmdir /s /q .next && rmdir /s /q node_modules && rmdir /s /q .turbo',
    },
    {
      step: 2,
      title: 'Install Dependencies',
      commands: [
        'npm install --legacy-peer-deps',
        'npx prisma generate',
      ],
      duration: '5-10 minutes',
      memory: '4GB+ recommended',
    },
    {
      step: 3,
      title: 'Type Check',
      commands: [
        'NODE_OPTIONS=--max-old-space-size=16384 npx tsc --noEmit --incremental',
      ],
      duration: '2-3 minutes',
      output: 'No TypeScript errors',
    },
    {
      step: 4,
      title: 'Production Build',
      commands: [
        'npm run build',
      ],
      duration: '3-5 minutes',
      output: '.next folder with optimized bundles',
    },
    {
      step: 5,
      title: 'Verify Build Artifacts',
      checks: [
        '.next/server exists',
        '.next/static exists',
        'No build errors in output',
        'Source maps generated',
      ],
    },
  ],

  environmentVariables: {
    production: [
      {
        name: 'DATABASE_URL',
        description: 'PostgreSQL production connection string',
        example: 'postgresql://user:pass@prod-db.azure.com:5432/memolib',
        sensitive: true,
      },
      {
        name: 'SENTRY_AUTH_TOKEN',
        description: 'Sentry API token for releases',
        getFrom: 'https://sentry.io/settings/auth-tokens/',
        sensitive: true,
      },
      {
        name: 'NEXT_PUBLIC_SENTRY_DSN',
        description: 'Sentry DSN (public)',
        getFrom: 'https://sentry.io/settings/projects/[org]/[project]/keys/dsn/',
        sensitive: false,
      },
      {
        name: 'UPSTASH_REDIS_REST_URL',
        description: 'Upstash Redis API endpoint',
        getFrom: 'https://console.upstash.com () → Redis → Database',
        sensitive: true,
      },
      {
        name: 'UPSTASH_REDIS_REST_TOKEN',
        description: 'Upstash Redis API token',
        getFrom: 'Upstash Console → Copy token',
        sensitive: true,
      },
      {
        name: 'NEXTAUTH_URL',
        description: 'NextAuth callback URL',
        example: 'https://your-production-domain.com',
        sensitive: false,
      },
      {
        name: 'NEXTAUTH_SECRET',
        description: 'NextAuth encryption secret',
        generate: 'openssl rand -base64 32',
        sensitive: true,
      },
      {
        name: 'AZURE_AD_CLIENT_ID',
        description: 'Azure AD application ID',
        getFrom: 'Azure Portal → App registrations',
        sensitive: false,
      },
      {
        name: 'AZURE_AD_CLIENT_SECRET',
        description: 'Azure AD client secret',
        getFrom: 'Azure Portal → App registrations → Certificates & secrets',
        sensitive: true,
      },
    ],
  },

  smokeTesting: [
    {
      name: 'Health Check',
      method: 'GET',
      endpoint: '/api/monitoring/release-health',
      expectedStatus: 200,
    },
    {
      name: 'Metrics Dashboard',
      method: 'GET',
      endpoint: '/api/monitoring/metrics-dashboard',
      expectedStatus: 200,
    },
    {
      name: 'Phase4+5 Validation',
      method: 'GET',
      endpoint: '/api/test/phase4-phase5-comprehensive',
      expectedStatus: 200,
    },
    {
      name: 'Valid Email Webhook',
      method: 'POST',
      endpoint: '/api/webhooks/test-multichannel/phase4',
      payload: {
        channel: 'EMAIL',
        from: 'test@example.com',
        to: 'verified@test.com',
        subject: 'Smoke test',
        text: 'Production test',
      },
      expectedStatus: 200,
    },
    {
      name: 'Invalid Email Validation',
      method: 'POST',
      endpoint: '/api/webhooks/test-multichannel/phase4',
      payload: {
        channel: 'EMAIL',
        from: 'invalid-email',
        to: 'test@test.com',
        subject: 'Should fail',
        text: 'Test',
      },
      expectedStatus: 400,
    },
    {
      name: 'Duplicate Detection',
      method: 'POST',
      endpoint: '/api/webhooks/test-multichannel/phase4',
      payload: {
        channel: 'EMAIL',
        from: 'dup@test.com',
        to: 'test@test.com',
        subject: 'Send twice',
        text: 'Test',
      },
      expectedStatusFirstCall: 200,
      expectedStatusSecondCall: 409,
    },
  ],

  deploymentPlatforms: {
    Vercel: {
      setup: [
        '1. Push main branch to GitHub',
        '2. Vercel automatically deploys',
        '3. Set environment variables in Vercel dashboard',
        '4. Enable "Automatically Deploy Pull Requests"',
      ],
      deploymentTime: '3-5 minutes',
      rollback: 'Click "Rollback to previous" in dashboard',
    },
    Render: {
      setup: [
        '1. Connect Git repository',
        '2. Create Web Service',
        '3. Set environment variables',
        '4. Auto-deploy on git push',
      ],
      deploymentTime: '5-10 minutes',
      rollback: 'Revert commit or use Render rollback',
    },
    'Azure App Service': {
      setup: [
        '1. Create App Service resource',
        '2. Connect Git repository',
        '3. Set environment variables',
        '4. Configure deployment slots (production/staging)',
        '5. Enable continuous deployment',
      ],
      deploymentTime: '5-10 minutes',
      rollback: 'Switch traffic to staging slot',
    },
  },

  postDeploymentMonitoring: {
    firstHour: {
      timeframe: '0-60 minutes',
      checks: [
        'Success rate > 98%',
        'Error rate < 2%',
        'P99 latency < 3000ms',
        'No database connection errors',
        'Sentry release active',
      ],
      frequency: 'Every 5 minutes',
    },
    firstDay: {
      timeframe: '1-24 hours',
      checks: [
        'Sustained success rate > 98%',
        'No memory leaks detected',
        'Cache hit rate > 80%',
        'Database performance stable',
        'No critical errors in Sentry',
      ],
      frequency: 'Every hour',
    },
    ongoing: {
      timeframe: 'Continuous',
      checks: [
        'Daily metrics trends',
        'Weekly error analysis',
        'Monthly performance review',
        'Quarterly cost optimization',
      ],
      dashboard: '/api/monitoring/metrics-dashboard',
      alertThresholds: {
        errorRate: '> 5%',
        p99Latency: '> 5000ms',
        successRate: '< 95%',
      },
    },
  },

  rollbackProcedure: {
    automatic: [
      'If error rate > 10% for 5 minutes',
      'If P99 latency > 10000ms for 5 minutes',
      'If database connection failures > 20%',
    ],
    manual: [
      'Identify issue in Sentry dashboard',
      'Revert to previous Git commit',
      'Trigger redeployment',
      'Monitor metrics for 15 minutes',
      'If still failing, switch infrastructure (Docker rollback)',
    ],
    blueGreen: [
      'Keep previous version running (Blue)',
      'Deploy new version to new infrastructure (Green)',
      'Route traffic: 5% Green → 50% Green → 100% Green',
      'If issues, switch back to Blue immediately',
    ],
  },

  successCriteria: {
    deployment: [
      '✅ Build completes without errors',
      '✅ All environment variables configured',
      '✅ Database migrations applied successfully',
      '✅ Sentry release created',
    ],
    testing: [
      '✅ All 6 smoke tests pass',
      '✅ End-to-end webhook flow works',
      '✅ Validation/rate-limiting/caching working',
      '✅ Error handling verified',
    ],
    monitoring: [
      '✅ Metrics dashboard showing live data',
      '✅ Sentry Release Health tracking events',
      '✅ Alerts configured and active',
      '✅ No critical errors in first hour',
    ],
    performance: [
      '✅ Success rate > 98%',
      '✅ Error rate < 2%',
      '✅ P99 latency < 3000ms',
      '✅ Cache hit rate > 80%',
    ],
  },

  documentationLinks: {
    sentry: 'https://docs.sentry.io/product/releases/',
    nextjs: 'https://nextjs.org/docs/deployment',
    prisma: 'https://www.prisma.io/docs/orm/prisma-migrate/get-started',
    vercel: 'https://vercel.com/docs/deployments',
  },
};

export default DeploymentGuide;
