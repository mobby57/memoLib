import { describe, it, expect, vi } from 'vitest';
import { buildRelativeDateFilter } from '@/lib/prisma.extended';

describe('Prisma Extended - Pure Unit Tests', () => {
  describe('date filters', () => {
    it('should build relative date filter', () => {
      // On mock la date pour éviter les problèmes de fuseau horaire
      const mockDate = new Date('2024-01-01T12:00:00Z');
      vi.useFakeTimers();
      vi.setSystemTime(mockDate);

      const filter = buildRelativeDateFilter('7d');
      
      expect(filter).toBeDefined();
      expect(filter.gte).toBeDefined();
      expect(filter.lte).toBeDefined();
      
      vi.useRealTimers();
    });
  });
});
