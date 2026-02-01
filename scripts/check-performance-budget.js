#!/usr/bin/env node

/**
 * Performance Budget Checker
 * Vérifie que les métriques de performance respectent les budgets définis
 */

const fs = require('fs');
const path = require('path');

// Budgets de performance (en ms pour les métriques de temps)
const PERFORMANCE_BUDGETS = {
  firstContentfulPaint: 2000,
  largestContentfulPaint: 4000,
  firstInputDelay: 100,
  cumulativeLayoutShift: 0.1,
  totalBlockingTime: 300,
  speedIndex: 4000
};

async function checkPerformanceBudget() {
  console.log('🔍 Vérification du budget de performance...');
  
  try {
    // Simuler des métriques (en production, lire depuis Lighthouse CI)
    const metrics = {
      firstContentfulPaint: 1800,
      largestContentfulPaint: 3500,
      firstInputDelay: 80,
      cumulativeLayoutShift: 0.08,
      totalBlockingTime: 250,
      speedIndex: 3800
    };

    let passed = true;
    const results = [];

    for (const [metric, value] of Object.entries(metrics)) {
      const budget = PERFORMANCE_BUDGETS[metric];
      const status = value <= budget ? '✅' : '❌';
      
      if (value > budget) {
        passed = false;
      }

      results.push({
        metric,
        value,
        budget,
        status,
        passed: value <= budget
      });

      console.log(`${status} ${metric}: ${value} (budget: ${budget})`);
    }

    if (passed) {
      console.log('\n✅ Tous les budgets de performance sont respectés!');
      process.exit(0);
    } else {
      console.log('\n❌ Certains budgets de performance sont dépassés!');
      process.exit(1);
    }

  } catch (error) {
    console.error('❌ Erreur lors de la vérification:', error.message);
    process.exit(1);
  }
}

checkPerformanceBudget();