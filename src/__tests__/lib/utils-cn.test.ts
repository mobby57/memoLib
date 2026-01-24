/**
 * Tests pour l'utilitaire cn (className merger)
 * Couverture: fusion de classes Tailwind
 */

import { cn } from '@/lib/utils';

describe('cn utility', () => {
  describe('Fonctionnement de base', () => {
    it('devrait retourner une chaîne vide sans arguments', () => {
      expect(cn()).toBe('');
    });

    it('devrait retourner une classe simple', () => {
      expect(cn('text-red-500')).toBe('text-red-500');
    });

    it('devrait combiner plusieurs classes', () => {
      const result = cn('text-red-500', 'bg-blue-500');
      expect(result).toContain('text-red-500');
      expect(result).toContain('bg-blue-500');
    });
  });

  describe('Fusion de classes Tailwind', () => {
    it('devrait fusionner les classes conflictuelles', () => {
      const result = cn('text-red-500', 'text-blue-500');
      expect(result).toBe('text-blue-500');
    });

    it('devrait gérer les paddings conflictuels', () => {
      const result = cn('p-4', 'p-8');
      expect(result).toBe('p-8');
    });

    it('devrait gérer les marges conflictuelles', () => {
      const result = cn('m-2', 'm-4');
      expect(result).toBe('m-4');
    });

    it('devrait conserver les classes non conflictuelles', () => {
      const result = cn('p-4', 'text-red-500', 'bg-blue-500');
      expect(result).toContain('p-4');
      expect(result).toContain('text-red-500');
      expect(result).toContain('bg-blue-500');
    });
  });

  describe('Valeurs conditionnelles', () => {
    it('devrait ignorer les valeurs undefined', () => {
      expect(cn('text-red-500', undefined)).toBe('text-red-500');
    });

    it('devrait ignorer les valeurs null', () => {
      expect(cn('text-red-500', null)).toBe('text-red-500');
    });

    it('devrait ignorer les valeurs false', () => {
      expect(cn('text-red-500', false)).toBe('text-red-500');
    });

    it('devrait ignorer les chaînes vides', () => {
      expect(cn('text-red-500', '')).toBe('text-red-500');
    });

    it('devrait gérer les conditions', () => {
      const isActive = true;
      const result = cn('base', isActive && 'active');
      expect(result).toContain('base');
      expect(result).toContain('active');
    });

    it('devrait gérer les conditions false', () => {
      const isActive = false;
      const result = cn('base', isActive && 'active');
      expect(result).toBe('base');
    });
  });

  describe('Objets de classes', () => {
    it('devrait gérer les objets avec valeurs booléennes', () => {
      const result = cn({ 'text-red-500': true, 'bg-blue-500': false });
      expect(result).toBe('text-red-500');
    });

    it('devrait combiner objets et strings', () => {
      const result = cn('base-class', { 'conditional-class': true });
      expect(result).toContain('base-class');
      expect(result).toContain('conditional-class');
    });
  });

  describe('Tableaux', () => {
    it('devrait gérer les tableaux de classes', () => {
      const result = cn(['text-red-500', 'bg-blue-500']);
      expect(result).toContain('text-red-500');
      expect(result).toContain('bg-blue-500');
    });

    it('devrait combiner tableaux et strings', () => {
      const result = cn('base', ['class-1', 'class-2']);
      expect(result).toContain('base');
      expect(result).toContain('class-1');
      expect(result).toContain('class-2');
    });
  });

  describe('Cas d\'utilisation réels', () => {
    it('devrait fonctionner pour un bouton avec variantes', () => {
      const variant = 'primary';
      const size = 'lg';
      const disabled = false;

      const result = cn(
        'inline-flex items-center justify-center rounded-md',
        variant === 'primary' && 'bg-blue-600 text-white',
        size === 'lg' && 'h-11 px-8',
        disabled && 'opacity-50 cursor-not-allowed'
      );

      expect(result).toContain('inline-flex');
      expect(result).toContain('bg-blue-600');
      expect(result).toContain('h-11');
      expect(result).not.toContain('opacity-50');
    });

    it('devrait fonctionner pour un input avec état', () => {
      const hasError = true;

      const result = cn(
        'flex h-10 w-full rounded-md border px-3 py-2',
        hasError ? 'border-red-500 focus:ring-red-500' : 'border-gray-300'
      );

      expect(result).toContain('border-red-500');
      expect(result).not.toContain('border-gray-300');
    });

    it('devrait gérer les overrides de composants', () => {
      const baseClasses = 'p-4 rounded-lg bg-white';
      const customClasses = 'p-8 bg-gray-100';

      const result = cn(baseClasses, customClasses);

      expect(result).toContain('p-8'); // Override
      expect(result).toContain('bg-gray-100'); // Override
      expect(result).toContain('rounded-lg'); // Conservé
    });
  });
});
