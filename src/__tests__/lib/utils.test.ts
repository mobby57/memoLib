/**
 * Tests pour la fonction utilitaire cn (class merge)
 * Couverture: fusion de classes, tailwind merge
 */

import { cn } from '@/lib/utils';

describe('cn utility function', () => {
  describe('Cas de base', () => {
    it('devrait retourner une string vide pour aucun argument', () => {
      expect(cn()).toBe('');
    });

    it('devrait retourner la classe passée', () => {
      expect(cn('px-4')).toBe('px-4');
    });

    it('devrait fusionner plusieurs classes', () => {
      expect(cn('px-4', 'py-2')).toBe('px-4 py-2');
    });
  });

  describe('Fusion de classes Tailwind', () => {
    it('devrait fusionner des classes conflictuelles (padding)', () => {
      const result = cn('px-4', 'px-8');
      expect(result).toBe('px-8');
    });

    it('devrait fusionner des classes conflictuelles (margin)', () => {
      const result = cn('mt-2', 'mt-4');
      expect(result).toBe('mt-4');
    });

    it('devrait fusionner des classes de couleur de fond', () => {
      const result = cn('bg-red-500', 'bg-blue-500');
      expect(result).toBe('bg-blue-500');
    });

    it('devrait fusionner des classes de texte', () => {
      const result = cn('text-sm', 'text-lg');
      expect(result).toBe('text-lg');
    });
  });

  describe('Classes conditionnelles', () => {
    it('devrait ignorer les valeurs undefined', () => {
      expect(cn('px-4', undefined, 'py-2')).toBe('px-4 py-2');
    });

    it('devrait ignorer les valeurs null', () => {
      expect(cn('px-4', null, 'py-2')).toBe('px-4 py-2');
    });

    it('devrait ignorer les valeurs false', () => {
      expect(cn('px-4', false, 'py-2')).toBe('px-4 py-2');
    });

    it('devrait gérer les conditions booléennes', () => {
      const isActive = true;
      const isDisabled = false;
      
      expect(cn(
        'base-class',
        isActive && 'active-class',
        isDisabled && 'disabled-class'
      )).toBe('base-class active-class');
    });
  });

  describe('Tableaux de classes', () => {
    it('devrait accepter des tableaux', () => {
      expect(cn(['px-4', 'py-2'])).toBe('px-4 py-2');
    });

    it('devrait fusionner tableaux et strings', () => {
      expect(cn('mx-auto', ['px-4', 'py-2'])).toBe('mx-auto px-4 py-2');
    });
  });

  describe('Objets de classes (clsx style)', () => {
    it('devrait accepter des objets', () => {
      expect(cn({ 'px-4': true, 'py-2': true })).toBe('px-4 py-2');
    });

    it('devrait ignorer les propriétés false', () => {
      expect(cn({ 'px-4': true, 'py-2': false })).toBe('px-4');
    });

    it('devrait combiner objets et strings', () => {
      expect(cn('base', { 'active': true, 'disabled': false })).toBe('base active');
    });
  });

  describe('Cas d\'utilisation réels', () => {
    it('devrait gérer les classes de composant Button', () => {
      const baseClasses = 'px-4 py-2 rounded-md font-medium';
      const variantClasses = 'bg-blue-500 text-white';
      const sizeClasses = 'text-sm h-9';
      
      const result = cn(baseClasses, variantClasses, sizeClasses);
      expect(result).toContain('px-4');
      expect(result).toContain('bg-blue-500');
      expect(result).toContain('text-sm');
    });

    it('devrait permettre l\'override des classes par défaut', () => {
      const defaultClasses = 'px-4 py-2 bg-gray-100';
      const customClasses = 'bg-blue-500 px-6';
      
      const result = cn(defaultClasses, customClasses);
      expect(result).toBe('py-2 bg-blue-500 px-6');
    });

    it('devrait gérer les états actif/inactif', () => {
      const isActive = true;
      
      const result = cn(
        'px-4 py-2',
        isActive ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-700'
      );
      
      expect(result).toContain('bg-blue-500');
      expect(result).toContain('text-white');
    });

    it('devrait gérer les classes responsive', () => {
      const result = cn('w-full', 'md:w-1/2', 'lg:w-1/3');
      expect(result).toBe('w-full md:w-1/2 lg:w-1/3');
    });

    it('devrait gérer les classes dark mode', () => {
      const result = cn('bg-white', 'dark:bg-gray-800', 'text-gray-900', 'dark:text-white');
      expect(result).toBe('bg-white dark:bg-gray-800 text-gray-900 dark:text-white');
    });

    it('devrait gérer les classes hover/focus', () => {
      const result = cn('bg-blue-500', 'hover:bg-blue-600', 'focus:ring-2');
      expect(result).toBe('bg-blue-500 hover:bg-blue-600 focus:ring-2');
    });
  });

  describe('Edge cases', () => {
    it('devrait gérer les strings vides', () => {
      expect(cn('', 'px-4', '')).toBe('px-4');
    });

    it('devrait gérer les espaces supplémentaires', () => {
      expect(cn('  px-4  ', '  py-2  ')).toContain('px-4');
      expect(cn('  px-4  ', '  py-2  ')).toContain('py-2');
    });

    it('devrait gérer les classes dupliquées', () => {
      expect(cn('px-4', 'px-4', 'px-4')).toBe('px-4');
    });
  });
});
