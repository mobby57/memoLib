#!/usr/bin/env tsx
/**
 * DASHBOARD DE PERFORMANCE AVANCÉ
 * 
 * Fonctionnalités:
 * - Monitoring temps réel des requêtes
 * - Analyse des requêtes lentes
 * - Statistiques de cache
 * - Métriques multi-tenant
 * - Recommandations d'optimisation
 * - Export des métriques
 * - Alertes de performance
 */

import { PrismaClient } from '@prisma/client'
import * as fs from 'fs/promises'

interface QueryMetric {
  query: string
  duration: number
  timestamp: Date
  model?: string
  operation?: string
}

interface PerformanceMetrics {
  totalQueries: number
  averageDuration: number
  slowQueries: QueryMetric[]
  fastQueries: number
  mediumQueries: number
  slowQueriesCount: number
  cacheHitRate: number
  connectionPoolSize: number
  activeConnections: number
}

interface TenantMetrics {
  tenantId: string
  tenantName: string
  queryCount: number
  averageDuration: number
  totalDossiers: number
  totalClients: number
  storageUsed: number
}

class DatabasePerformanceDashboard {
  private prisma: PrismaClient
  private metrics: QueryMetric[] = []
  private startTime: Date

  constructor() {
    this.prisma = new PrismaClient({
      log: [
        { level: 'query', emit: 'event' },
        { level: 'error', emit: 'event' },
      ]
    })
    this.startTime = new Date()
    this.setupQueryLogging()
  }

  /**
   * Configurer le logging des requêtes
   */
  private setupQueryLogging() {
    (this.prisma as any).$on('query', (e: any) => {
      this.metrics.push({
        query: e.query,
        duration: e.duration,
        timestamp: new Date(),
        model: this.extractModel(e.query),
        operation: this.extractOperation(e.query)
      })

      // Garder seulement les 1000 dernières métriques
      if (this.metrics.length > 1000) {
        this.metrics.shift()
      }
    })
  }

  /**
   * Extraire le modèle de la requête
   */
  private extractModel(query: string): string {
    const match = query.match(/FROM ["']?(\w+)["']?/i)
    return match ? match[1] : 'unknown'
  }

  /**
   * Extraire l'opération
   */
  private extractOperation(query: string): string {
    if (query.startsWith('SELECT')) return 'READ'
    if (query.startsWith('INSERT')) return 'CREATE'
    if (query.startsWith('UPDATE')) return 'UPDATE'
    if (query.startsWith('DELETE')) return 'DELETE'
    return 'OTHER'
  }

  /**
   * Exécuter une suite de tests de performance
   */
  async runPerformanceTests(): Promise<void> {
    console.log('🚀 Exécution des tests de performance...\n')

    // Test 1: Connexion simple
    console.log('Test 1: Connexion simple')
    const t1 = Date.now()
    await this.prisma.$queryRaw`SELECT 1`
    console.log(`  ✓ Durée: ${Date.now() - t1}ms\n`)

    // Test 2: Count simple
    console.log('Test 2: Count Plans')
    const t2 = Date.now()
    const planCount = await this.prisma.plan.count()
    console.log(`  ✓ ${planCount} plans - Durée: ${Date.now() - t2}ms\n`)

    // Test 3: FindMany avec relations
    console.log('Test 3: FindMany Tenants (avec relations)')
    const t3 = Date.now()
    const tenants = await this.prisma.tenant.findMany({
      include: {
        plan: true,
        users: { take: 5 },
        clients: { take: 5 }
      },
      take: 10
    })
    console.log(`  ✓ ${tenants.length} tenants - Durée: ${Date.now() - t3}ms\n`)

    // Test 4: Requête complexe avec filtres
    console.log('Test 4: Requête complexe Dossiers')
    const t4 = Date.now()
    const dossiers = await this.prisma.dossier.findMany({
      where: {
        statut: { in: ['en_cours', 'urgent'] },
        priorite: { in: ['haute', 'critique'] }
      },
      include: {
        client: true,
        tenant: true
      },
      take: 20,
      orderBy: { dateCreation: 'desc' }
    })
    console.log(`  ✓ ${dossiers.length} dossiers - Durée: ${Date.now() - t4}ms\n`)

    // Test 5: Agrégation
    console.log('Test 5: Agrégations')
    const t5 = Date.now()
    const stats = await this.prisma.dossier.groupBy({
      by: ['statut'],
      _count: { id: true }
    })
    console.log(`  ✓ ${stats.length} groupes - Durée: ${Date.now() - t5}ms\n`)

    // Test 6: Requêtes parallèles
    console.log('Test 6: Requêtes parallèles')
    const t6 = Date.now()
    await Promise.all([
      this.prisma.plan.count(),
      this.prisma.tenant.count(),
      this.prisma.client.count(),
      this.prisma.dossier.count(),
      this.prisma.facture.count()
    ])
    console.log(`  ✓ 5 requêtes parallèles - Durée: ${Date.now() - t6}ms\n`)
  }

  /**
   * Analyser les métriques de performance
   */
  async analyzePerformance(): Promise<PerformanceMetrics> {
    const totalQueries = this.metrics.length
    const avgDuration = totalQueries > 0
      ? this.metrics.reduce((sum, m) => sum + m.duration, 0) / totalQueries
      : 0

    const slowQueries = this.metrics
      .filter(m => m.duration > 100)
      .sort((a, b) => b.duration - a.duration)
      .slice(0, 10)

    const fastQueries = this.metrics.filter(m => m.duration < 50).length
    const mediumQueries = this.metrics.filter(m => m.duration >= 50 && m.duration <= 100).length
    const slowQueriesCount = this.metrics.filter(m => m.duration > 100).length

    return {
      totalQueries,
      averageDuration: Math.round(avgDuration * 100) / 100,
      slowQueries,
      fastQueries,
      mediumQueries,
      slowQueriesCount,
      cacheHitRate: 0, // À implémenter avec un vrai cache
      connectionPoolSize: 1, // SQLite = 1 connexion
      activeConnections: 1
    }
  }

  /**
   * Métriques par tenant
   */
  async getTenantMetrics(): Promise<TenantMetrics[]> {
    const tenants = await this.prisma.tenant.findMany({
      include: {
        dossiers: true,
        clients: true
      }
    })

    return await Promise.all(tenants.map(async (tenant) => {
      const tenantQueries = this.metrics.filter(m => 
        m.query.includes(tenant.id)
      )

      return {
        tenantId: tenant.id,
        tenantName: tenant.name,
        queryCount: tenantQueries.length,
        averageDuration: tenantQueries.length > 0
          ? tenantQueries.reduce((sum, m) => sum + m.duration, 0) / tenantQueries.length
          : 0,
        totalDossiers: tenant.dossiers.length,
        totalClients: tenant.clients.length,
        storageUsed: 0 // À calculer réellement
      }
    }))
  }

  /**
   * Recommandations d'optimisation
   */
  async getOptimizationRecommendations(): Promise<string[]> {
    const metrics = await this.analyzePerformance()
    const recommendations: string[] = []

    // Recommandation 1: Requêtes lentes
    if (metrics.slowQueriesCount > metrics.totalQueries * 0.1) {
      recommendations.push(
        `⚠️  ${metrics.slowQueriesCount} requêtes lentes (>100ms) détectées. ` +
        `Envisager l'ajout d'index sur les colonnes fréquemment utilisées.`
      )
    }

    // Recommandation 2: Durée moyenne
    if (metrics.averageDuration > 50) {
      recommendations.push(
        `⚠️  Durée moyenne des requêtes élevée (${metrics.averageDuration}ms). ` +
        `Optimiser les requêtes avec relations ou utiliser le lazy loading.`
      )
    }

    // Recommandation 3: Cache
    recommendations.push(
      `💡 Implémenter un cache Redis pour les requêtes fréquentes ` +
      `(plans, tenants) pourrait réduire la charge de 30-40%.`
    )

    // Recommandation 4: Connection pooling
    if (process.env.DATABASE_URL?.startsWith('postgresql')) {
      recommendations.push(
        `💡 PostgreSQL détecté: configurer un pool de connexions ` +
        `avec Prisma (connection_limit=10).`
      )
    }

    // Recommandation 5: Monitoring
    recommendations.push(
      `💡 Configurer un monitoring continu avec DataDog/New Relic ` +
      `pour alertes en temps réel.`
    )

    return recommendations
  }

  /**
   * Afficher le dashboard complet
   */
  async displayDashboard(): Promise<void> {
    console.log('=' .repeat(70))
    console.log('DASHBOARD DE PERFORMANCE - IA Poste Manager')
    console.log('=' .repeat(70))
    console.log('')

    // Métriques globales
    const metrics = await this.analyzePerformance()
    
    console.log('MÉTRIQUES GLOBALES:')
    console.log('  Total requêtes: ' + metrics.totalQueries)
    console.log('  Durée moyenne: ' + metrics.averageDuration + 'ms')
    console.log('  Requêtes rapides (<50ms): ' + metrics.fastQueries + ' (' + 
      Math.round(metrics.fastQueries / metrics.totalQueries * 100) + '%)')
    console.log('  Requêtes moyennes (50-100ms): ' + metrics.mediumQueries + ' (' + 
      Math.round(metrics.mediumQueries / metrics.totalQueries * 100) + '%)')
    console.log('  Requêtes lentes (>100ms): ' + metrics.slowQueriesCount + ' (' + 
      Math.round(metrics.slowQueriesCount / metrics.totalQueries * 100) + '%)')
    console.log('')

    // Top requêtes lentes
    if (metrics.slowQueries.length > 0) {
      console.log('TOP 5 REQUÊTES LENTES:')
      metrics.slowQueries.slice(0, 5).forEach((q, i) => {
        console.log(`  ${i + 1}. ${q.duration}ms - ${q.model || 'unknown'} (${q.operation || 'unknown'})`)
        console.log(`     ${q.query.substring(0, 60)}...`)
      })
      console.log('')
    }

    // Métriques par tenant
    const tenantMetrics = await this.getTenantMetrics()
    if (tenantMetrics.length > 0) {
      console.log('MÉTRIQUES PAR TENANT:')
      tenantMetrics.forEach(tm => {
        console.log(`  ${tm.tenantName}:`)
        console.log(`    - Requêtes: ${tm.queryCount}`)
        console.log(`    - Durée moyenne: ${Math.round(tm.averageDuration)}ms`)
        console.log(`    - Dossiers: ${tm.totalDossiers}`)
        console.log(`    - Clients: ${tm.totalClients}`)
      })
      console.log('')
    }

    // Recommandations
    const recommendations = await this.getOptimizationRecommendations()
    console.log('RECOMMANDATIONS D\'OPTIMISATION:')
    recommendations.forEach(r => console.log('  ' + r))
    console.log('')

    // Statistiques système
    const uptime = Date.now() - this.startTime.getTime()
    console.log('STATISTIQUES SYSTÈME:')
    console.log(`  Uptime: ${Math.round(uptime / 1000)}s`)
    console.log(`  Connexions actives: ${metrics.activeConnections}`)
    console.log(`  Pool size: ${metrics.connectionPoolSize}`)
    console.log('')

    console.log('=' .repeat(70))
  }

  /**
   * Exporter les métriques
   */
  async exportMetrics(outputPath: string = './performance-metrics.json'): Promise<void> {
    const metrics = await this.analyzePerformance()
    const tenantMetrics = await this.getTenantMetrics()
    const recommendations = await this.getOptimizationRecommendations()

    const report = {
      timestamp: new Date().toISOString(),
      uptime: Date.now() - this.startTime.getTime(),
      globalMetrics: metrics,
      tenantMetrics,
      recommendations,
      rawMetrics: this.metrics
    }

    await fs.writeFile(outputPath, JSON.stringify(report, null, 2))
    console.log(`✅ Métriques exportées vers: ${outputPath}`)
  }

  async cleanup(): Promise<void> {
    await this.prisma.$disconnect()
  }
}

/**
 * CLI Principal
 */
async function main() {
  const dashboard = new DatabasePerformanceDashboard()

  try {
    // Exécuter les tests de performance
    await dashboard.runPerformanceTests()

    // Petite pause pour collecter les métriques
    await new Promise(resolve => setTimeout(resolve, 500))

    // Afficher le dashboard
    await dashboard.displayDashboard()

    // Exporter les métriques
    await dashboard.exportMetrics()

  } catch (error) {
    console.error('❌ Erreur:', error)
    process.exit(1)
  } finally {
    await dashboard.cleanup()
  }
}

main()
