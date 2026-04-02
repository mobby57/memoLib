/**
 * Real tests for ceseda/dossier-service.ts - calculatePriorite function
 * Tests the pure priority calculation logic
 */

import { CesedaService, type Priorite } from '@/lib/ceseda/dossier-service'

describe('CesedaService - REAL TESTS', () => {
  describe('calculatePriorite', () => {
    const today = new Date()

    const addDays = (days: number): Date => {
      const result = new Date(today)
      result.setDate(result.getDate() + days)
      return result
    }

    describe('OQTF type', () => {
      it('should return CRITIQUE when deadline is 7 days or less', () => {
        expect(CesedaService.calculatePriorite('OQTF', addDays(1))).toBe('CRITIQUE')
        expect(CesedaService.calculatePriorite('OQTF', addDays(5))).toBe('CRITIQUE')
        expect(CesedaService.calculatePriorite('OQTF', addDays(7))).toBe('CRITIQUE')
      })

      it('should return HAUTE when deadline is between 8-15 days', () => {
        expect(CesedaService.calculatePriorite('OQTF', addDays(8))).toBe('HAUTE')
        expect(CesedaService.calculatePriorite('OQTF', addDays(10))).toBe('HAUTE')
        expect(CesedaService.calculatePriorite('OQTF', addDays(15))).toBe('HAUTE')
      })

      it('should return NORMALE when deadline is more than 15 days', () => {
        expect(CesedaService.calculatePriorite('OQTF', addDays(16))).toBe('NORMALE')
        expect(CesedaService.calculatePriorite('OQTF', addDays(30))).toBe('NORMALE')
        expect(CesedaService.calculatePriorite('OQTF', addDays(60))).toBe('NORMALE')
      })
    })

    describe('ASILE type', () => {
      it('should return CRITIQUE when deadline is 15 days or less', () => {
        expect(CesedaService.calculatePriorite('ASILE', addDays(1))).toBe('CRITIQUE')
        expect(CesedaService.calculatePriorite('ASILE', addDays(10))).toBe('CRITIQUE')
        expect(CesedaService.calculatePriorite('ASILE', addDays(15))).toBe('CRITIQUE')
      })

      it('should return HAUTE when deadline is between 16-30 days', () => {
        expect(CesedaService.calculatePriorite('ASILE', addDays(16))).toBe('HAUTE')
        expect(CesedaService.calculatePriorite('ASILE', addDays(20))).toBe('HAUTE')
        expect(CesedaService.calculatePriorite('ASILE', addDays(30))).toBe('HAUTE')
      })

      it('should return NORMALE when deadline is more than 30 days', () => {
        expect(CesedaService.calculatePriorite('ASILE', addDays(31))).toBe('NORMALE')
        expect(CesedaService.calculatePriorite('ASILE', addDays(60))).toBe('NORMALE')
      })
    })

    describe('Other types (default behavior)', () => {
      it('should return HAUTE when deadline is 30 days or less', () => {
        expect(CesedaService.calculatePriorite('TITRE_SEJOUR', addDays(10))).toBe('HAUTE')
        expect(CesedaService.calculatePriorite('NATURALISATION', addDays(20))).toBe('HAUTE')
        expect(CesedaService.calculatePriorite('VISA', addDays(30))).toBe('HAUTE')
      })

      it('should return NORMALE when deadline is more than 30 days', () => {
        expect(CesedaService.calculatePriorite('TITRE_SEJOUR', addDays(31))).toBe('NORMALE')
        expect(CesedaService.calculatePriorite('NATURALISATION', addDays(60))).toBe('NORMALE')
        expect(CesedaService.calculatePriorite('VISA', addDays(90))).toBe('NORMALE')
      })
    })

    describe('No deadline cases', () => {
      it('should return NORMALE when no deadline provided', () => {
        expect(CesedaService.calculatePriorite('OQTF')).toBe('NORMALE')
        expect(CesedaService.calculatePriorite('ASILE')).toBe('NORMALE')
        expect(CesedaService.calculatePriorite('TITRE_SEJOUR')).toBe('NORMALE')
      })

      it('should return NORMALE for undefined deadline', () => {
        expect(CesedaService.calculatePriorite('OQTF', undefined)).toBe('NORMALE')
      })
    })

    describe('Edge cases', () => {
      it('should handle deadline today', () => {
        const todayDate = new Date()
        todayDate.setHours(23, 59, 59, 999)

        const result = CesedaService.calculatePriorite('OQTF', todayDate)
        expect(['CRITIQUE', 'HAUTE'] satisfies Priorite[]).toContain(result)
      })

      it('should handle past deadline gracefully', () => {
        const pastDate = addDays(-5)
        const result = CesedaService.calculatePriorite('OQTF', pastDate)
        expect(result).toBe('CRITIQUE')
      })

      it('should handle unknown type with default rules', () => {
        expect(CesedaService.calculatePriorite('UNKNOWN_TYPE', addDays(15))).toBe('HAUTE')
        expect(CesedaService.calculatePriorite('UNKNOWN_TYPE', addDays(45))).toBe('NORMALE')
      })
    })

    describe('Priority escalation scenarios', () => {
      it('should properly escalate OQTF as deadline approaches', () => {
        expect(CesedaService.calculatePriorite('OQTF', addDays(30))).toBe('NORMALE')
        expect(CesedaService.calculatePriorite('OQTF', addDays(14))).toBe('HAUTE')
        expect(CesedaService.calculatePriorite('OQTF', addDays(5))).toBe('CRITIQUE')
      })

      it('should properly escalate ASILE as deadline approaches', () => {
        expect(CesedaService.calculatePriorite('ASILE', addDays(60))).toBe('NORMALE')
        expect(CesedaService.calculatePriorite('ASILE', addDays(25))).toBe('HAUTE')
        expect(CesedaService.calculatePriorite('ASILE', addDays(10))).toBe('CRITIQUE')
      })
    })
  })
})
