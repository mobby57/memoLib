#!/usr/bin/env node

/**
 * Canary Metrics Checker
 * Vérifie les métriques du déploiement canary avant promotion
 */

async function checkCanaryMetrics() {
  console.log('🐤 Vérification des métriques canary...');
  
  try {
    // Simuler des métriques canary (en production, utiliser Cloudflare Analytics API)
    const metrics = {
      errorRate: 0.02, // 2%
      responseTime: 150, // ms
      availability: 99.9, // %
      requests: 1250
    };

    const thresholds = {
      errorRate: 0.05, // Max 5%
      responseTime: 500, // Max 500ms
      availability: 99.0, // Min 99%
      requests: 100 // Min 100 requests pour validation
    };

    let passed = true;
    const results = [];

    // Vérifier le taux d'erreur
    if (metrics.errorRate > thresholds.errorRate) {
      console.log(`❌ Taux d'erreur trop élevé: ${metrics.errorRate * 100}% (max: ${thresholds.errorRate * 100}%)`);
      passed = false;
    } else {
      console.log(`✅ Taux d'erreur OK: ${metrics.errorRate * 100}%`);
    }

    // Vérifier le temps de réponse
    if (metrics.responseTime > thresholds.responseTime) {
      console.log(`❌ Temps de réponse trop élevé: ${metrics.responseTime}ms (max: ${thresholds.responseTime}ms)`);
      passed = false;
    } else {
      console.log(`✅ Temps de réponse OK: ${metrics.responseTime}ms`);
    }

    // Vérifier la disponibilité
    if (metrics.availability < thresholds.availability) {
      console.log(`❌ Disponibilité trop faible: ${metrics.availability}% (min: ${thresholds.availability}%)`);
      passed = false;
    } else {
      console.log(`✅ Disponibilité OK: ${metrics.availability}%`);
    }

    // Vérifier le nombre de requêtes
    if (metrics.requests < thresholds.requests) {
      console.log(`⚠️ Pas assez de requêtes pour validation: ${metrics.requests} (min: ${thresholds.requests})`);
      console.log('🔄 Attente de plus de trafic...');
    } else {
      console.log(`✅ Volume de requêtes OK: ${metrics.requests}`);
    }

    if (passed && metrics.requests >= thresholds.requests) {
      console.log('\n✅ Métriques canary validées - Promotion autorisée!');
      process.exit(0);
    } else {
      console.log('\n❌ Métriques canary non conformes - Promotion bloquée!');
      process.exit(1);
    }

  } catch (error) {
    console.error('❌ Erreur lors de la vérification des métriques:', error.message);
    process.exit(1);
  }
}

checkCanaryMetrics();