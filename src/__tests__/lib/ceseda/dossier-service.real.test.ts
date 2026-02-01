/**
 * Real tests for ceseda/dossier-service.ts - calculatePriorite function
 * Tests the pure priority calculation logic
 */

import { CesedaService } from '@/lib/ceseda/dossier-service'

describe('CesedaService - REAL TESTS', () => {
  describe('calculatePriorite', () => {
    const today = new Date()

    const addDays = (days: number): Date => {
      const result = new Date(today)
      result.setDate(result.getDate() + days)
      return result
    }

    describe('OQTF type', () => {
      it('should return critique when deadline is 7 days or less', () => {
        expect(CesedaService.calculatePriorite('OQTF', addDays(1))).toBe('critique')
        expect(CesedaService.calculatePriorite('OQTF', addDays(5))).toBe('critique')
        expect(CesedaService.calculatePriorite('OQTF', addDays(7))).toBe('critique')
      })

      it('should return haute when deadline is between 8-15 days', () => {
        expect(CesedaService.calculatePriorite('OQTF', addDays(8))).toBe('haute')
        expect(CesedaService.calculatePriorite('OQTF', addDays(10))).toBe('haute')
        expect(CesedaService.calculatePriorite('OQTF', addDays(15))).toBe('haute')
      })

      it('should return normale when deadline is more than 15 days', () => {
        expect(CesedaService.calculatePriorite('OQTF', addDays(16))).toBe('normale')
        expect(CesedaService.calculatePriorite('OQTF', addDays(30))).toBe('normale')
        expect(CesedaService.calculatePriorite('OQTF', addDays(60))).toBe('normale')
      })
    })

    describe('ASILE type', () => {
      it('should return critique when deadline is 15 days or less', () => {
        expect(CesedaService.calculatePriorite('ASILE', addDays(1))).toBe('critique')
        expect(CesedaService.calculatePriorite('ASILE', addDays(10))).toBe('critique')
        expect(CesedaService.calculatePriorite('ASILE', addDays(15))).toBe('critique')
      })

      it('should return haute when deadline is between 16-30 days', () => {
        expect(CesedaService.calculatePriorite('ASILE', addDays(16))).toBe('haute')
        expect(CesedaService.calculatePriorite('ASILE', addDays(20))).toBe('haute')
        expect(CesedaService.calculatePriorite('ASILE', addDays(30))).toBe('haute')
      })

      it('should return normale when deadline is more than 30 days', () => {
        expect(CesedaService.calculatePriorite('ASILE', addDays(31))).toBe('normale')
        expect(CesedaService.calculatePriorite('ASILE', addDays(60))).toBe('normale')
      })
    })

    describe('Other types (default behavior)', () => {
      it('should return haute when deadline is 30 days or less', () => {
        expect(CesedaService.calculatePriorite('TITRE_SEJOUR', addDays(10))).toBe('haute')
        expect(CesedaService.calculatePriorite('NATURALISATION', addDays(20))).toBe('haute')
        expect(CesedaService.calculatePriorite('VISA', addDays(30))).toBe('haute')
      })

      it('should return normale when deadline is more than 30 days', () => {
        expect(CesedaService.calculatePriorite('TITRE_SEJOUR', addDays(31))).toBe('normale')
        expect(CesedaService.calculatePriorite('NATURALISATION', addDays(60))).toBe('normale')
        expect(CesedaService.calculatePriorite('VISA', addDays(90))).toBe('normale')
      })
    })

    describe('No deadline cases', () => {
      it('should return normale when no deadline provided', () => {
        expect(CesedaService.calculatePriorite('OQTF')).toBe('normale')
        expect(CesedaService.calculatePriorite('ASILE')).toBe('normale')
        expect(CesedaService.calculatePriorite('TITRE_SEJOUR')).toBe('normale')
      })

      it('should return normale for undefined deadline', () => {
        expect(CesedaService.calculatePriorite('OQTF', undefined)).toBe('normale')
      })
    })

    describe('Edge cases', () => {
      it('should handle deadline today', () => {
        // Today means 0-1 days, should be urgent for OQTF
        const todayDate = new Date()
        todayDate.setHours(23, 59, 59, 999)
        
        const result = CesedaService.calculatePriorite('OQTF', todayDate)
        expect(['critique', 'haute']).toContain(result)
      })

      it('should handle past deadline gracefully', () => {
        const pastDate = addDays(-5)
        // Past deadlines should still work (negative days)
        const result = CesedaService.calculatePriorite('OQTF', pastDate)
        expect(result).toBe('critique') // Very urgent if past due
      })

      it('should handle unknown type with default rules', () => {
        expect(CesedaService.calculatePriorite('UNKNOWN_TYPE', addDays(15))).toBe('haute')
        expect(CesedaService.calculatePriorite('UNKNOWN_TYPE', addDays(45))).toBe('normale')
      })
    })

    describe('Priority escalation scenarios', () => {
      it('should properly escalate OQTF as deadline approaches', () => {
        expect(CesedaService.calculatePriorite('OQTF', addDays(30))).toBe('normale')
        expect(CesedaService.calculatePriorite('OQTF', addDays(14))).toBe('haute')
        expect(CesedaService.calculatePriorite('OQTF', addDays(5))).toBe('critique')
      })

      it('should properly escalate ASILE as deadline approaches', () => {
        expect(CesedaService.calculatePriorite('ASILE', addDays(60))).toBe('normale')
        expect(CesedaService.calculatePriorite('ASILE', addDays(25))).toBe('haute')
        expect(CesedaService.calculatePriorite('ASILE', addDays(10))).toBe('critique')
      })
    })
  })
})
