# ========================================
# 📊 CONFIGURATION MONITORING AVANCÉ
# ========================================
# Cloudflare Analytics + Sentry + Custom Metrics
# ========================================

param(
    [string]$ProjectName = "iapostemanager",
    [switch]$EnableSentry,
    [switch]$EnableCustomMetrics,
    [switch]$EnableAlerts
)

Write-Host "📊 CONFIGURATION MONITORING CLOUDFLARE" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# ========================================
# CLOUDFLARE WEB ANALYTICS
# ========================================

Write-Host "1️⃣ Cloudflare Web Analytics" -ForegroundColor Yellow

$analyticsScript = @"
<!-- Cloudflare Web Analytics -->
<script defer src='https://static.cloudflareinsights.com/beacon.min.js' 
        data-cf-beacon='{"token": "YOUR_ANALYTICS_TOKEN"}'></script>
<!-- End Cloudflare Web Analytics -->
"@

Write-Host "Ajouter ce script dans src/app/layout.tsx:" -ForegroundColor Gray
Write-Host $analyticsScript -ForegroundColor Green

Write-Host "`n📝 Pour obtenir le token:" -ForegroundColor Gray
Write-Host "1. Dashboard Cloudflare → Analytics → Web Analytics" -ForegroundColor Gray
Write-Host "2. Ajouter un site → Copier le token" -ForegroundColor Gray
Write-Host "3. Remplacer YOUR_ANALYTICS_TOKEN" -ForegroundColor Gray

# ========================================
# SENTRY INTEGRATION
# ========================================

if ($EnableSentry) {
    Write-Host "`n2️⃣ Sentry Error Tracking" -ForegroundColor Yellow
    
    Write-Host "Installation Sentry SDK..." -ForegroundColor Gray
    npm install --save @sentry/nextjs
    
    Write-Host "`n📝 Configuration dans next.config.js:" -ForegroundColor Gray
    
    $sentryConfig = @"
const { withSentryConfig } = require('@sentry/nextjs');

module.exports = withSentryConfig(
  {
    // Next.js config
  },
  {
    silent: true,
    org: "your-org",
    project: "$ProjectName",
  }
);
"@
    
    Write-Host $sentryConfig -ForegroundColor Green
    
    Write-Host "`n📝 Ajouter SENTRY_DSN dans variables Cloudflare" -ForegroundColor Gray
}

# ========================================
# CUSTOM METRICS
# ========================================

if ($EnableCustomMetrics) {
    Write-Host "`n3️⃣ Custom Metrics (Cloudflare Analytics Engine)" -ForegroundColor Yellow
    
    $metricsCode = @"
// lib/metrics.ts
export async function trackMetric(metric: string, value: number) {
  if (typeof window !== 'undefined') {
    // Client-side: Beacon API
    navigator.sendBeacon('/api/metrics', JSON.stringify({
      metric,
      value,
      timestamp: Date.now(),
    }));
  } else {
    // Server-side: Cloudflare Analytics Engine
    // Configuré via Workers
  }
}

// Exemples d'utilisation
trackMetric('auth_success', 1);
trackMetric('api_latency', 150);
trackMetric('redis_hit', 1);
"@
    
    Write-Host $metricsCode -ForegroundColor Green
}

# ========================================
# ALERTES AUTOMATIQUES
# ========================================

if ($EnableAlerts) {
    Write-Host "`n4️⃣ Alertes Automatiques" -ForegroundColor Yellow
    
    Write-Host "Configurer dans Dashboard Cloudflare:" -ForegroundColor Gray
    Write-Host "1. Notifications → Nouvelle notification" -ForegroundColor Gray
    Write-Host "2. Type: Pages deployment failed" -ForegroundColor Gray
    Write-Host "3. Type: Health check failed" -ForegroundColor Gray
    Write-Host "4. Type: Traffic anomaly" -ForegroundColor Gray
    
    Write-Host "`nDestinations possibles:" -ForegroundColor Gray
    Write-Host "- Email: admin@iapostemanager.com" -ForegroundColor Gray
    Write-Host "- Webhook: https://hooks.slack.com/..." -ForegroundColor Gray
    Write-Host "- PagerDuty integration" -ForegroundColor Gray
}

# ========================================
# DASHBOARD CUSTOM
# ========================================

Write-Host "`n5️⃣ Dashboard Custom (Grafana)" -ForegroundColor Yellow

$grafanaSetup = @"
# docker-compose.yml - Ajout Grafana
grafana:
  image: grafana/grafana:latest
  ports:
    - "3001:3000"
  environment:
    - GF_SECURITY_ADMIN_PASSWORD=admin123
    - GF_INSTALL_PLUGINS=cloudflare-app
  volumes:
    - grafana_data:/var/lib/grafana
    - ./monitoring/grafana-dashboards:/etc/grafana/provisioning/dashboards
"@

Write-Host $grafanaSetup -ForegroundColor Green

# ========================================
# EXEMPLE API METRICS
# ========================================

Write-Host "`n6️⃣ API Endpoint Metrics" -ForegroundColor Yellow

$metricsApi = @"
// src/app/api/metrics/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { metric, value, timestamp } = body;
  
  // Envoyer à Cloudflare Analytics Engine
  if (process.env.CLOUDFLARE_ANALYTICS_TOKEN) {
    await fetch('https://api.cloudflare.com/client/v4/accounts/YOUR_ACCOUNT/analytics_engine/sql', {
      method: 'POST',
      headers: {
        'Authorization': \`Bearer \${process.env.CLOUDFLARE_API_TOKEN}\`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        metric,
        value,
        timestamp,
      }),
    });
  }
  
  return NextResponse.json({ ok: true });
}
"@

Write-Host $metricsApi -ForegroundColor Green

# ========================================
# CHECKLIST
# ========================================

Write-Host "`n✅ CHECKLIST MONITORING" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

$checklist = @"
[ ] Web Analytics activé
[ ] Token Analytics dans layout.tsx
[ ] Sentry installé et configuré
[ ] SENTRY_DSN dans variables Cloudflare
[ ] Custom metrics API créée
[ ] Alertes configurées (email/webhook)
[ ] Dashboard Grafana (optionnel)
[ ] Tests monitoring: curl /api/health
[ ] Vérifier métriques Dashboard Cloudflare
"@

Write-Host $checklist -ForegroundColor Yellow

Write-Host "`n📚 Documentation:" -ForegroundColor Cyan
Write-Host "- Analytics: https://developers.cloudflare.com/analytics/" -ForegroundColor Gray
Write-Host "- Sentry: https://docs.sentry.io/platforms/javascript/guides/nextjs/" -ForegroundColor Gray
Write-Host "- Custom Metrics: https://developers.cloudflare.com/analytics/analytics-engine/" -ForegroundColor Gray

Write-Host "`n✅ Configuration monitoring prête!" -ForegroundColor Green
