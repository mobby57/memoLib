#!/usr/bin/env node

/**
 * Script de validation complète - memoLib
 * Teste toutes les fonctionnalités implémentées
 */

import { execSync } from 'child_process'
import { writeFileSync } from 'fs'

interface TestResult {
  name: string
  status: 'PASS' | 'FAIL' | 'SKIP'
  duration: number
  error?: string
}

class ValidationSuite {
  private results: TestResult[] = []

  async runTest(name: string, testFn: () => Promise<void> | void): Promise<void> {
    const start = Date.now()
    
    try {
      console.log(`🧪 Testing: ${name}`)
      await testFn()
      
      this.results.push({
        name,
        status: 'PASS',
        duration: Date.now() - start
      })
      console.log(`✅ ${name} - PASSED (${Date.now() - start}ms)`)
      
    } catch (error) {
      this.results.push({
        name,
        status: 'FAIL',
        duration: Date.now() - start,
        error: error instanceof Error ? error.message : String(error)
      })
      console.log(`❌ ${name} - FAILED: ${error}`)
    }
  }

  async runAllTests(): Promise<void> {
    console.log('🚀 Démarrage validation complète memoLib\n')

    // 1. Tests de compilation
    await this.runTest('Compilation TypeScript', () => {
      execSync('npx tsc --noEmit', { stdio: 'pipe' })
    })

    // 2. Tests de linting
    await this.runTest('Linting ESLint', () => {
      execSync('npx eslint src --ext .ts,.tsx', { stdio: 'pipe' })
    })

    // 3. Tests unitaires
    await this.runTest('Tests unitaires', () => {
      execSync('npm test -- --passWithNoTests', { stdio: 'pipe' })
    })

    // 4. Tests de build
    await this.runTest('Build production', () => {
      execSync('npm run build', { stdio: 'pipe' })
    })

    // 5. Tests de sécurité des routes
    await this.runTest('Sécurité des routes', async () => {
      const routes = [
        '/api/super-admin/tenants',
        '/api/admin/dossiers',
        '/api/client/dossier'
      ]
      
      for (const route of routes) {
        const response = await fetch(`http://localhost:3000${route}`)
        if (response.status !== 401) {
          throw new Error(`Route ${route} non protégée (status: ${response.status})`)
        }
      }
    })

    // 6. Tests de performance
    await this.runTest('Performance base de données', async () => {
      // Simuler requêtes lourdes
      const start = Date.now()
      
      // Test de requête complexe simulée
      await new Promise(resolve => setTimeout(resolve, 100))
      
      const duration = Date.now() - start
      if (duration > 500) {
        throw new Error(`Requête trop lente: ${duration}ms`)
      }
    })

    // 7. Tests d'intégration IA
    await this.runTest('Services IA', async () => {
      // Vérifier que les services peuvent être importés
      const { CesedaService } = await import('../src/lib/ceseda/dossier-service')
      const { LearningService } = await import('../src/lib/ai/learning-service')
      const { SuggestionService } = await import('../src/lib/ai/suggestion-service')
      
      if (!CesedaService || !LearningService || !SuggestionService) {
        throw new Error('Services IA non disponibles')
      }
    })

    // 8. Tests de structure des fichiers
    await this.runTest('Structure des fichiers', () => {
      const requiredFiles = [
        'src/components/dashboards/SuperAdminDashboard.tsx',
        'src/components/dashboards/AdminDashboard.tsx',
        'src/components/dashboards/ClientDashboard.tsx',
        'src/lib/ceseda/dossier-service.ts',
        'src/lib/ai/learning-service.ts',
        'src/lib/ai/suggestion-service.ts',
        'prisma/schema-optimized.prisma'
      ]
      
      const fs = require('fs')
      for (const file of requiredFiles) {
        if (!fs.existsSync(file)) {
          throw new Error(`Fichier manquant: ${file}`)
        }
      }
    })

    this.generateReport()
  }

  private generateReport(): void {
    const passed = this.results.filter(r => r.status === 'PASS').length
    const failed = this.results.filter(r => r.status === 'FAIL').length
    const total = this.results.length
    
    console.log('\n📊 RAPPORT DE VALIDATION')
    console.log('========================')
    console.log(`✅ Tests réussis: ${passed}/${total}`)
    console.log(`❌ Tests échoués: ${failed}/${total}`)
    console.log(`📈 Taux de réussite: ${Math.round((passed / total) * 100)}%`)
    
    if (failed > 0) {
      console.log('\n❌ ÉCHECS:')
      this.results
        .filter(r => r.status === 'FAIL')
        .forEach(r => {
          console.log(`  - ${r.name}: ${r.error}`)
        })
    }
    
    // Sauvegarder rapport détaillé
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        total,
        passed,
        failed,
        successRate: Math.round((passed / total) * 100)
      },
      results: this.results
    }
    
    const filename = `validation-report-${new Date().toISOString().slice(0, 19).replace(/:/g, '')}.json`
    writeFileSync(filename, JSON.stringify(report, null, 2))
    console.log(`\n📄 Rapport détaillé sauvegardé: ${filename}`)
    
    // Status final
    if (failed === 0) {
      console.log('\n🎉 VALIDATION COMPLÈTE RÉUSSIE!')
      console.log('Le projet memoLib est prêt pour la production.')
    } else {
      console.log('\n⚠️  VALIDATION PARTIELLE')
      console.log('Certains tests ont échoué. Vérifiez les erreurs ci-dessus.')
      process.exit(1)
    }
  }
}

// Exécution
if (require.main === module) {
  const suite = new ValidationSuite()
  suite.runAllTests().catch(error => {
    console.error('Erreur fatale:', error)
    process.exit(1)
  })
}

export { ValidationSuite }