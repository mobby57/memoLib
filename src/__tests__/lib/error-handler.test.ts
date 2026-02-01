/**
 * Tests pour le Error Handler
 * Couverture: classification des erreurs, messages utilisateur
 */

import {
  ErrorCategory,
  classifyError,
  type ClassifiedError,
} from '@/lib/error-handler';

describe('Error Handler', () => {
  describe('ErrorCategory enum', () => {
    it('devrait avoir toutes les catégories', () => {
      expect(ErrorCategory.NETWORK).toBe('NETWORK');
      expect(ErrorCategory.AUTHENTICATION).toBe('AUTHENTICATION');
      expect(ErrorCategory.AUTHORIZATION).toBe('AUTHORIZATION');
      expect(ErrorCategory.VALIDATION).toBe('VALIDATION');
      expect(ErrorCategory.NOT_FOUND).toBe('NOT_FOUND');
      expect(ErrorCategory.SERVER).toBe('SERVER');
      expect(ErrorCategory.RATE_LIMIT).toBe('RATE_LIMIT');
      expect(ErrorCategory.CONFLICT).toBe('CONFLICT');
      expect(ErrorCategory.UNKNOWN).toBe('UNKNOWN');
    });
  });

  describe('classifyError', () => {
    describe('Erreurs réseau', () => {
      it('devrait classifier les erreurs fetch', () => {
        const error = new Error('fetch failed');
        const result = classifyError(error);

        expect(result.category).toBe(ErrorCategory.NETWORK);
        expect(result.canRetry).toBe(true);
        expect(result.retryDelay).toBeGreaterThan(0);
        expect(result.suggestions).toBeDefined();
      });

      it('devrait classifier les erreurs network', () => {
        const error = new Error('network error occurred');
        const result = classifyError(error);

        expect(result.category).toBe(ErrorCategory.NETWORK);
        expect(result.userMessage).toContain('connexion');
      });

      it('devrait classifier les erreurs timeout', () => {
        const error = new Error('request timeout');
        const result = classifyError(error);

        expect(result.category).toBe(ErrorCategory.NETWORK);
      });

      it('devrait classifier ECONNREFUSED', () => {
        const error = new Error('ECONNREFUSED: Connection refused');
        const result = classifyError(error);

        expect(result.category).toBe(ErrorCategory.NETWORK);
      });

      it('devrait classifier ENOTFOUND', () => {
        const error = new Error('ENOTFOUND: DNS lookup failed');
        const result = classifyError(error);

        expect(result.category).toBe(ErrorCategory.NETWORK);
      });
    });

    describe('Erreurs d\'authentification', () => {
      it('devrait classifier les erreurs 401', () => {
        const error = new Error('401 Unauthorized');
        const result = classifyError(error);

        expect(result.category).toBe(ErrorCategory.AUTHENTICATION);
        expect(result.canRetry).toBe(false);
        expect(result.statusCode).toBe(401);
      });

      it('devrait classifier les erreurs unauthorized', () => {
        const error = new Error('Unauthorized access');
        const result = classifyError(error);

        expect(result.category).toBe(ErrorCategory.AUTHENTICATION);
        expect(result.userMessage).toContain('Session');
      });
    });

    describe('Erreurs d\'autorisation', () => {
      it('devrait classifier les erreurs 403', () => {
        const error = new Error('403 Forbidden');
        const result = classifyError(error);

        expect(result.category).toBe(ErrorCategory.AUTHORIZATION);
        expect(result.canRetry).toBe(false);
        expect(result.statusCode).toBe(403);
      });

      it('devrait classifier les erreurs forbidden', () => {
        const error = new Error('Access forbidden');
        const result = classifyError(error);

        expect(result.category).toBe(ErrorCategory.AUTHORIZATION);
        expect(result.userMessage).toContain('droits');
      });
    });

    describe('Erreurs par défaut', () => {
      it('devrait classifier les erreurs inconnues', () => {
        const error = new Error('Something unexpected happened');
        const result = classifyError(error);

        expect(result.category).toBe(ErrorCategory.UNKNOWN);
        expect(result.canRetry).toBe(true);
        expect(result.originalError).toBe(error);
      });

      it('devrait gérer les non-Error', () => {
        const result = classifyError('string error');

        expect(result.category).toBe(ErrorCategory.UNKNOWN);
        expect(result.originalError).toBeInstanceOf(Error);
      });

      it('devrait gérer null', () => {
        const result = classifyError(null);

        expect(result.category).toBe(ErrorCategory.UNKNOWN);
      });

      it('devrait gérer undefined', () => {
        const result = classifyError(undefined);

        expect(result.category).toBe(ErrorCategory.UNKNOWN);
      });

      it('devrait gérer les objets', () => {
        const result = classifyError({ message: 'error object' });

        expect(result.category).toBe(ErrorCategory.UNKNOWN);
      });
    });

    describe('Structure ClassifiedError', () => {
      it('devrait toujours avoir les propriétés requises', () => {
        const error = new Error('Test error');
        const result = classifyError(error);

        expect(result).toHaveProperty('category');
        expect(result).toHaveProperty('message');
        expect(result).toHaveProperty('userMessage');
        expect(result).toHaveProperty('canRetry');
        expect(result).toHaveProperty('originalError');
      });

      it('devrait avoir un userMessage en français', () => {
        const error = new Error('401 Unauthorized');
        const result = classifyError(error);

        // Vérifier que le message est en français
        expect(result.userMessage).toMatch(/[àâéèêëîïôûùüç]|Session|erreur|connexion|droits/i);
      });
    });

    describe('Suggestions', () => {
      it('devrait fournir des suggestions pour erreurs réseau', () => {
        const error = new Error('network error');
        const result = classifyError(error);

        expect(result.suggestions).toBeDefined();
        expect(result.suggestions!.length).toBeGreaterThan(0);
      });

      it('devrait fournir des suggestions pour erreurs auth', () => {
        const error = new Error('403 Forbidden');
        const result = classifyError(error);

        expect(result.suggestions).toBeDefined();
        expect(result.suggestions!.some(s => s.includes('admin') || s.includes('permission'))).toBe(true);
      });
    });

    describe('Retry logic', () => {
      it('devrait permettre retry pour erreurs réseau', () => {
        const error = new Error('fetch failed');
        const result = classifyError(error);

        expect(result.canRetry).toBe(true);
        expect(result.retryDelay).toBeDefined();
      });

      it('ne devrait pas permettre retry pour erreurs auth', () => {
        const error = new Error('401 Unauthorized');
        const result = classifyError(error);

        expect(result.canRetry).toBe(false);
      });

      it('devrait permettre retry par défaut pour erreurs inconnues', () => {
        const error = new Error('Unknown issue');
        const result = classifyError(error);

        expect(result.canRetry).toBe(true);
      });
    });
  });

  describe('Cas d\'utilisation réels', () => {
    it('devrait classifier une erreur API timeout', () => {
      const error = new Error('fetch failed: network error');
      const result = classifyError(error);

      expect(result.category).toBe(ErrorCategory.NETWORK);
      expect(result.canRetry).toBe(true);
    });

    it('devrait classifier une erreur de session expirée', () => {
      const error = new Error('JWT expired: 401');
      const result = classifyError(error);

      expect(result.category).toBe(ErrorCategory.AUTHENTICATION);
    });

    it('devrait classifier un accès refusé au dossier', () => {
      const error = new Error('Forbidden: Access denied to dossier 123');
      const result = classifyError(error);

      expect(result.category).toBe(ErrorCategory.AUTHORIZATION);
    });

    it('devrait gérer les erreurs Prisma', () => {
      const error = new Error('PrismaClientKnownRequestError: Record not found');
      const result = classifyError(error);

      // Erreur Prisma classifiée comme NOT_FOUND
      expect(result.category).toBe(ErrorCategory.NOT_FOUND);
    });
  });
});
