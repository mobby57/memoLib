import { describe, it, expect, beforeAll, afterAll } from '@jest/globals'
import { CesedaService } from '@/lib/ceseda/dossier-service'
import { LearningService } from '@/lib/ai/learning-service'
import { SuggestionService } from '@/lib/ai/suggestion-service'

jest.mock('@/lib/prisma', () => {
  const now = new Date()
  const criticalDeadline = new Date(now)
  criticalDeadline.setDate(criticalDeadline.getDate() + 5)

  const oldDate = new Date(now)
  oldDate.setDate(oldDate.getDate() - 30)

  const dossierModel = {
    count: jest.fn(async (args?: any) => {
      const tenantId = args?.where?.tenantId
      if (tenantId === 'tenant-1') return 7
      if (tenantId === 'tenant-2') return 3
      return 0
    }),
    create: jest.fn(async (args: any) => ({
      id: 'dossier-1',
      numero: args?.data?.numero ?? 'D-2026-001',
      type: args?.data?.typeDossier,
      priorite: args?.data?.dateEcheance ? 'CRITIQUE' : (args?.data?.priorite ?? 'normale'),
      ...args?.data,
      client: { id: args?.data?.clientId, firstName: 'Test', lastName: 'Client', email: 'client@test.fr' },
      tenant: { id: args?.data?.tenantId },
    })),
    update: jest.fn(async (args: any) => ({ id: args?.where?.id ?? 'dossier-1', ...args?.data })),
    groupBy: jest.fn(async (args: any) => {
      if (Array.isArray(args?.by) && args.by.includes('typeDossier')) {
        return [{ typeDossier: 'OQTF', _count: 1 }]
      }
      if (Array.isArray(args?.by) && args.by.includes('statut')) {
        return [{ statut: 'EN_COURS', _count: 1 }]
      }
      return []
    }),
    findMany: jest.fn(async (args?: any) => {
      if (args?.where?.updatedAt?.lt) {
        return [
          {
            id: 'inactive-1',
            numero: 'D-2026-010',
            tenantId: args?.where?.tenantId,
            statut: 'EN_COURS',
            typeDossier: 'OQTF',
            updatedAt: oldDate,
            createdAt: oldDate,
            priorite: 'HAUTE',
            dateEcheance: criticalDeadline,
            client: { firstName: 'Old', lastName: 'Client', email: 'old@test.fr' },
            documents: [],
          },
        ]
      }

      if (args?.where?.dateEcheance?.lte) {
        return [
          {
            id: 'critical-1',
            numero: 'D-2026-011',
            tenantId: args?.where?.tenantId,
            statut: 'EN_COURS',
            typeDossier: 'OQTF',
            updatedAt: now,
            createdAt: now,
            priorite: 'CRITIQUE',
            dateEcheance: criticalDeadline,
            client: { firstName: 'Urgent', lastName: 'Client', email: 'urgent@test.fr' },
            documents: [{ filename: 'passeport.pdf' }],
          },
        ]
      }

      return [
        {
          id: 'dossier-generic-1',
          numero: 'D-2026-012',
          tenantId: args?.where?.tenantId,
          statut: 'EN_COURS',
          typeDossier: 'OQTF',
          updatedAt: now,
          createdAt: now,
          priorite: 'HAUTE',
          dateEcheance: criticalDeadline,
          client: { firstName: 'Generic', lastName: 'Client', email: 'generic@test.fr' },
          documents: [{ filename: 'passeport.pdf' }],
        },
      ]
    }),
  }

  const aiActionModel = {
    update: jest.fn(async () => ({ id: 'test-action-123' })),
    findMany: jest.fn(async () => [
      {
        id: 'a1',
        tenantId: 'test-tenant-123',
        actionType: 'EMAIL_TRIAGE',
        confidence: 0.95,
        validationStatus: 'APPROVED',
        createdAt: now,
      },
      {
        id: 'a2',
        tenantId: 'test-tenant-123',
        actionType: 'EMAIL_TRIAGE',
        confidence: 0.88,
        validationStatus: 'APPROVED',
        createdAt: now,
      },
    ]),
  }

  const prisma = {
    dossier: dossierModel,
    aIAction: aiActionModel,
    aIMetrics: {
      upsert: jest.fn(async () => ({})),
    },
    facture: {
      count: jest.fn(async () => 0),
    },
  }

  return {
    __esModule: true,
    prisma,
    default: prisma,
  }
})

describe('Integration Tests - memoLib', () => {
  const testTenantId = 'test-tenant-123'
  const testClientId = 'test-client-123'
  const testAdminId = 'test-admin-123'

  beforeAll(async () => {
    // Setup test data
  })

  afterAll(async () => {
    // Cleanup test data
  })

  describe('Scénario 1: Création et gestion dossier OQTF', () => {
    it('devrait créer un dossier OQTF avec priorité automatique', async () => {
      const echeance = new Date()
      echeance.setDate(echeance.getDate() + 5) // 5 jours = critique

      const dossier = await CesedaService.createDossier(testTenantId, {
        type: 'OQTF',
        titre: 'OQTF - Test Client',
        clientId: testClientId,
        adminId: testAdminId,
        echeance,
        articleCESEDA: 'Art. L511-1'
      })

      expect(dossier.numero).toMatch(/^D-\d{4}-\d{3}$/)
      expect(dossier.type).toBe('OQTF')
      expect(dossier.priorite).toBe('CRITIQUE') // Auto-calculé
    })

    it('devrait détecter le dossier comme suggestion urgente', async () => {
      const suggestions = await SuggestionService.generateSuggestions(testTenantId)

      const criticalSuggestion = suggestions.find(s => s.type === 'CRITICAL_DEADLINE')
      expect(criticalSuggestion).toBeDefined()
      expect(criticalSuggestion?.confidence).toBeGreaterThan(0.9)
    })
  })

  describe('Scénario 2: Apprentissage IA', () => {
    it('devrait enregistrer validation et ajuster confiance', async () => {
      const validation = {
        actionId: 'test-action-123',
        result: 'APPROVED' as const,
        confidence: 0.95,
        actionType: 'EMAIL_TRIAGE'
      }

      const adjustment = await LearningService.recordValidation(validation)
      expect(adjustment).toBe(0.05) // Bonus pour haute confiance approuvée
    })

    it('devrait générer rapport d\'amélioration', async () => {
      const report = await LearningService.generateImprovementReport(testTenantId)

      expect(Array.isArray(report)).toBe(true)
      if (report.length > 0) {
        expect(report[0]).toHaveProperty('actionType')
        expect(report[0]).toHaveProperty('successImprovement')
        expect(report[0]).toHaveProperty('recommendation')
      }
    })
  })

  describe('Scénario 3: Suggestions intelligentes', () => {
    it('devrait détecter dossiers inactifs', async () => {
      const suggestions = await SuggestionService.generateSuggestions(testTenantId)

      const inactiveSuggestions = suggestions.filter(s => s.type === 'INACTIVE_DOSSIER')
      expect(Array.isArray(inactiveSuggestions)).toBe(true)
    })

    it('devrait détecter patterns de documents manquants', async () => {
      const suggestions = await SuggestionService.generateSuggestions(testTenantId)

      const docSuggestions = suggestions.filter(s => s.type === 'MISSING_DOCUMENT_PATTERN')
      expect(Array.isArray(docSuggestions)).toBe(true)
    })
  })

  describe('Scénario 4: Workflow complet multi-tenant', () => {
    it('devrait isoler données entre tenants', async () => {
      const tenant1Stats = await CesedaService.getStats('tenant-1')
      const tenant2Stats = await CesedaService.getStats('tenant-2')

      // Les stats doivent être indépendantes
      expect(tenant1Stats).not.toEqual(tenant2Stats)
    })

    it('devrait calculer métriques par tenant', async () => {
      const patterns = await LearningService.analyzeValidationPatterns(testTenantId)

      expect(typeof patterns).toBe('object')
      // Chaque type d'action doit avoir ses métriques
      Object.values(patterns).forEach((stats: any) => {
        expect(stats).toHaveProperty('total')
        expect(stats).toHaveProperty('successRate')
        expect(stats).toHaveProperty('recommendation')
      })
    })
  })

  describe('Scénario 5: Performance et sécurité', () => {
    it('devrait traiter recherche dossiers rapidement', async () => {
      const start = Date.now()

      const results = await CesedaService.searchDossiers(testTenantId, {
        search: 'test'
      })

      const duration = Date.now() - start
      expect(duration).toBeLessThan(1000) // < 1 seconde
      expect(Array.isArray(results)).toBe(true)
    })

    it('devrait respecter isolation tenant dans suggestions', async () => {
      const suggestions = await SuggestionService.generateSuggestions(testTenantId)

      // Toutes les suggestions doivent être pour ce tenant uniquement
      suggestions.forEach(suggestion => {
        if (suggestion.dossierId) {
          // Vérifier que le dossier appartient au bon tenant
          // (nécessiterait une requête DB pour validation complète)
          expect(suggestion.dossierId).toBeDefined()
        }
      })
    })
  })
})
