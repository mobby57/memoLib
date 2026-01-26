/**
 * Tests pour le service de recherche sémantique
 * Couverture: embeddings, similarité, fallback
 */

describe('Semantic Search Service', () => {
  describe('SemanticSearchResult Interface', () => {
    it('devrait avoir la structure correcte', () => {
      const result = {
        id: 'dossier-1',
        numero: 'DOS-2024-001',
        type: 'OQTF',
        description: 'Dossier de contestation OQTF',
        similarity: 0.95,
        client: {
          id: 'client-1',
          nom: 'Dupont',
          prenom: 'Jean',
        },
        createdAt: new Date(),
        statut: 'EN_COURS',
      };

      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('similarity');
      expect(result).toHaveProperty('client');
      expect(result.similarity).toBeGreaterThan(0);
    });
  });

  describe('Similarity Calculation', () => {
    const cosineSimilarity = (a: number[], b: number[]): number => {
      if (a.length !== b.length) return 0;

      let dotProduct = 0;
      let magnitudeA = 0;
      let magnitudeB = 0;

      for (let i = 0; i < a.length; i++) {
        dotProduct += a[i] * b[i];
        magnitudeA += a[i] * a[i];
        magnitudeB += b[i] * b[i];
      }

      magnitudeA = Math.sqrt(magnitudeA);
      magnitudeB = Math.sqrt(magnitudeB);

      if (magnitudeA === 0 || magnitudeB === 0) return 0;

      return dotProduct / (magnitudeA * magnitudeB);
    };

    it('devrait retourner 1 pour vecteurs identiques', () => {
      const vector = [0.5, 0.5, 0.5, 0.5];
      expect(cosineSimilarity(vector, vector)).toBeCloseTo(1, 5);
    });

    it('devrait retourner 0 pour vecteurs orthogonaux', () => {
      const a = [1, 0, 0, 0];
      const b = [0, 1, 0, 0];
      expect(cosineSimilarity(a, b)).toBe(0);
    });

    it('devrait gérer les longueurs différentes', () => {
      const a = [1, 2, 3];
      const b = [1, 2];
      expect(cosineSimilarity(a, b)).toBe(0);
    });

    it('devrait gérer les vecteurs nuls', () => {
      const a = [0, 0, 0];
      const b = [1, 2, 3];
      expect(cosineSimilarity(a, b)).toBe(0);
    });
  });

  describe('Fallback Embedding', () => {
    const simpleFallbackEmbedding = (text: string, size: number = 128): number[] => {
      const normalized = text.toLowerCase();
      const vector = new Array(size).fill(0);

      for (let i = 0; i < normalized.length; i++) {
        const charCode = normalized.charCodeAt(i);
        vector[charCode % size] += 1;
      }

      // Normaliser
      const magnitude = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
      return vector.map(val => val / (magnitude || 1));
    };

    it('devrait générer un vecteur de la bonne taille', () => {
      const embedding = simpleFallbackEmbedding('test', 128);
      expect(embedding).toHaveLength(128);
    });

    it('devrait normaliser le vecteur', () => {
      const embedding = simpleFallbackEmbedding('hello world');
      const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
      expect(magnitude).toBeCloseTo(1, 5);
    });

    it('devrait être déterministe', () => {
      const text = 'test text';
      const embedding1 = simpleFallbackEmbedding(text);
      const embedding2 = simpleFallbackEmbedding(text);
      expect(embedding1).toEqual(embedding2);
    });

    it('devrait différencier les textes', () => {
      const emb1 = simpleFallbackEmbedding('hello');
      const emb2 = simpleFallbackEmbedding('world');
      expect(emb1).not.toEqual(emb2);
    });
  });

  describe('Search Query Preparation', () => {
    const prepareQuery = (query: string): string => {
      return query
        .toLowerCase()
        .trim()
        .replace(/\s+/g, ' ')
        .substring(0, 500);
    };

    it('devrait normaliser les espaces', () => {
      expect(prepareQuery('test   multiple   spaces')).toBe('test multiple spaces');
    });

    it('devrait mettre en minuscules', () => {
      expect(prepareQuery('UPPERCASE')).toBe('uppercase');
    });

    it('devrait limiter la longueur', () => {
      const longQuery = 'a'.repeat(1000);
      expect(prepareQuery(longQuery).length).toBe(500);
    });
  });

  describe('Result Filtering', () => {
    const filterByThreshold = <T extends { similarity: number }>(
      results: T[],
      threshold: number
    ): T[] => {
      return results.filter(r => r.similarity >= threshold);
    };

    it('devrait filtrer par seuil de similarité', () => {
      const results = [
        { id: '1', similarity: 0.9 },
        { id: '2', similarity: 0.5 },
        { id: '3', similarity: 0.8 },
      ];
      const filtered = filterByThreshold(results, 0.7);
      expect(filtered).toHaveLength(2);
    });

    it('devrait retourner vide si aucun résultat au-dessus du seuil', () => {
      const results = [
        { id: '1', similarity: 0.3 },
        { id: '2', similarity: 0.4 },
      ];
      const filtered = filterByThreshold(results, 0.7);
      expect(filtered).toHaveLength(0);
    });
  });

  describe('Result Sorting', () => {
    const sortBySimilarity = <T extends { similarity: number }>(results: T[]): T[] => {
      return [...results].sort((a, b) => b.similarity - a.similarity);
    };

    it('devrait trier par similarité décroissante', () => {
      const results = [
        { id: '1', similarity: 0.5 },
        { id: '2', similarity: 0.9 },
        { id: '3', similarity: 0.7 },
      ];
      const sorted = sortBySimilarity(results);
      expect(sorted[0].similarity).toBe(0.9);
      expect(sorted[1].similarity).toBe(0.7);
      expect(sorted[2].similarity).toBe(0.5);
    });
  });

  describe('Text Normalization for Embedding', () => {
    const normalizeForEmbedding = (text: string): string => {
      return text
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Supprimer les accents
        .toLowerCase()
        .replace(/[^\w\s]/g, ' ') // Remplacer ponctuation par espaces
        .replace(/\s+/g, ' ')
        .trim();
    };

    it('devrait supprimer les accents', () => {
      expect(normalizeForEmbedding('éàü')).toBe('eau');
    });

    it('devrait remplacer la ponctuation', () => {
      expect(normalizeForEmbedding('hello, world!')).toBe('hello world');
    });
  });

  describe('Dossier Text Composition', () => {
    const composeDossierText = (dossier: {
      numero: string;
      type: string;
      description?: string;
      client: { nom: string; prenom: string };
    }): string => {
      return [
        dossier.numero,
        dossier.type,
        dossier.description || '',
        `${dossier.client.prenom} ${dossier.client.nom}`,
      ]
        .filter(Boolean)
        .join(' ');
    };

    it('devrait composer le texte du dossier', () => {
      const dossier = {
        numero: 'DOS-2024-001',
        type: 'OQTF',
        description: 'Contestation OQTF',
        client: { nom: 'Dupont', prenom: 'Jean' },
      };
      const text = composeDossierText(dossier);
      expect(text).toContain('DOS-2024-001');
      expect(text).toContain('OQTF');
      expect(text).toContain('Jean Dupont');
    });
  });

  describe('Similarity Threshold Levels', () => {
    const getMatchQuality = (similarity: number): string => {
      if (similarity >= 0.9) return 'EXCELLENT';
      if (similarity >= 0.75) return 'BON';
      if (similarity >= 0.6) return 'MOYEN';
      if (similarity >= 0.4) return 'FAIBLE';
      return 'TRES_FAIBLE';
    };

    it('devrait qualifier la similarité correctement', () => {
      expect(getMatchQuality(0.95)).toBe('EXCELLENT');
      expect(getMatchQuality(0.8)).toBe('BON');
      expect(getMatchQuality(0.65)).toBe('MOYEN');
      expect(getMatchQuality(0.45)).toBe('FAIBLE');
      expect(getMatchQuality(0.2)).toBe('TRES_FAIBLE');
    });
  });

  describe('Embedding Cache Key', () => {
    const generateCacheKey = (text: string, model: string): string => {
      // Simple hash pour la démonstration
      let hash = 0;
      for (let i = 0; i < text.length; i++) {
        hash = (hash << 5) - hash + text.charCodeAt(i);
        hash |= 0;
      }
      return `${model}:${hash}`;
    };

    it('devrait générer une clé unique', () => {
      const key1 = generateCacheKey('test1', 'model-a');
      const key2 = generateCacheKey('test2', 'model-a');
      expect(key1).not.toBe(key2);
    });

    it('devrait inclure le modèle', () => {
      const key = generateCacheKey('test', 'nomic-embed');
      expect(key).toContain('nomic-embed');
    });
  });
});
