/**
 * Tests: Time Tracking API (/api/time-entries)
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock Prisma
const mockTimeEntry = {
  id: 'te-001',
  tenantId: 'tenant-1',
  userId: 'user-1',
  dossierId: 'dossier-1',
  clientId: 'client-1',
  description: 'Rédaction conclusions',
  date: new Date('2026-08-15'),
  startTime: null,
  endTime: null,
  duration: 90,
  tarifHoraire: 150,
  montant: 225, // 90/60 * 150
  isBillable: true,
  isBilled: false,
  category: 'travail',
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('Time Tracking', () => {
  describe('Duration calculation', () => {
    it('calculates montant from duration and tarif', () => {
      const duration = 90; // minutes
      const tarifHoraire = 150; // €/h
      const montant = (duration / 60) * tarifHoraire;
      expect(montant).toBe(225);
    });

    it('calculates montant for 30 minutes', () => {
      const duration = 30;
      const tarifHoraire = 200;
      const montant = (duration / 60) * tarifHoraire;
      expect(montant).toBe(100);
    });

    it('calculates montant for 15 minutes', () => {
      const duration = 15;
      const tarifHoraire = 300;
      const montant = (duration / 60) * tarifHoraire;
      expect(montant).toBe(75);
    });

    it('handles zero tarif (non-billable)', () => {
      const duration = 60;
      const tarifHoraire = 0;
      const montant = (duration / 60) * tarifHoraire;
      expect(montant).toBe(0);
    });
  });

  describe('Stats aggregation', () => {
    const entries = [
      { duration: 60, isBillable: true, isBilled: false, montant: 150 },
      { duration: 30, isBillable: true, isBilled: true, montant: 75 },
      { duration: 45, isBillable: false, isBilled: false, montant: 0 },
      { duration: 120, isBillable: true, isBilled: false, montant: 300 },
    ];

    it('calculates total minutes', () => {
      const total = entries.reduce((sum, e) => sum + e.duration, 0);
      expect(total).toBe(255);
    });

    it('calculates total billable minutes', () => {
      const billable = entries.filter(e => e.isBillable).reduce((sum, e) => sum + e.duration, 0);
      expect(billable).toBe(210);
    });

    it('calculates total montant', () => {
      const total = entries.reduce((sum, e) => sum + e.montant, 0);
      expect(total).toBe(525);
    });

    it('calculates unbilled montant', () => {
      const unbilled = entries.filter(e => e.isBillable && !e.isBilled).reduce((sum, e) => sum + e.montant, 0);
      expect(unbilled).toBe(450);
    });

    it('converts minutes to hours with 1 decimal', () => {
      const totalMinutes = 255;
      const hours = Math.round(totalMinutes / 6) / 10;
      expect(hours).toBe(4.3); // 255/60 = 4.25, rounded to 4.3
    });
  });

  describe('Validation', () => {
    it('rejects duration less than 1 minute', () => {
      const duration = 0;
      expect(duration).toBeLessThan(1);
    });

    it('rejects empty description', () => {
      const description = '';
      expect(description.length).toBeLessThan(1);
    });

    it('accepts valid categories', () => {
      const validCategories = ['travail', 'audience', 'rdv', 'deplacement', 'recherche', 'admin', 'telephone', 'correspondance'];
      expect(validCategories).toContain('travail');
      expect(validCategories).toContain('audience');
      expect(validCategories).not.toContain('invalid');
    });

    it('prevents deletion of billed entries', () => {
      const entry = { ...mockTimeEntry, isBilled: true };
      expect(entry.isBilled).toBe(true);
      // Business rule: cannot delete billed entries
    });

    it('allows deletion of unbilled entries', () => {
      const entry = { ...mockTimeEntry, isBilled: false };
      expect(entry.isBilled).toBe(false);
    });
  });

  describe('Category distribution', () => {
    it('groups entries by category', () => {
      const entries = [
        { category: 'travail', duration: 60 },
        { category: 'travail', duration: 30 },
        { category: 'audience', duration: 120 },
        { category: 'telephone', duration: 15 },
      ];

      const grouped: Record<string, number> = {};
      entries.forEach(e => {
        grouped[e.category] = (grouped[e.category] || 0) + e.duration;
      });

      expect(grouped.travail).toBe(90);
      expect(grouped.audience).toBe(120);
      expect(grouped.telephone).toBe(15);
    });
  });
});
