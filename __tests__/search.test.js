import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { SearchService } from '../wwwroot/js/services/search.js';

describe('SearchService', () => {
  let searchService;
  let mockAuthService;
  const API_URL = 'http://localhost:5078';

  beforeEach(() => {
    global.fetch?.mockReset?.();
    mockAuthService = {
      getToken: jest.fn(() => 'test-token'),
      logout: jest.fn()
    };
    searchService = new SearchService(API_URL, mockAuthService);
  });

  describe('searchEvents', () => {
    it('should search events with text query', async () => {
      const mockResults = [{ id: '1', occurredAt: new Date() }];
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResults
      });

      const results = await searchService.searchEvents('test query');

      expect(fetch).toHaveBeenCalledWith(
        `${API_URL}/api/search/events`,
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ text: 'test query', limit: 500 })
        })
      );
      expect(results).toEqual(mockResults);
    });
  });

  describe('semanticSearch', () => {
    it('should perform semantic search', async () => {
      const mockResults = [{ similarity: 0.95 }];
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResults
      });

      const results = await searchService.semanticSearch('query');

      expect(fetch).toHaveBeenCalledWith(
        `${API_URL}/api/semantic/search`,
        expect.objectContaining({ method: 'POST' })
      );
      expect(results).toEqual(mockResults);
    });
  });

  describe('embeddingSearch', () => {
    it('should search by embeddings', async () => {
      const mockResults = [{ id: '1', similarity: 0.9 }];
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResults
      });

      const results = await searchService.embeddingSearch('query', 5);

      expect(fetch).toHaveBeenCalledWith(
        `${API_URL}/api/embeddings/search`,
        expect.objectContaining({
          body: JSON.stringify({ query: 'query', limit: 5 })
        })
      );
      expect(results).toEqual(mockResults);
    });
  });

  describe('generateEmbeddings', () => {
    it('should call embeddings generation endpoint', async () => {
      const mockResults = { generated: 12 };
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResults
      });

      const results = await searchService.generateEmbeddings();

      expect(fetch).toHaveBeenCalledWith(
        `${API_URL}/api/embeddings/generate-all`,
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({})
        })
      );
      expect(results).toEqual(mockResults);
    });
  });

  describe('error handling', () => {
    it('should logout and throw on 401', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        text: async () => 'Unauthorized'
      });

      await expect(searchService.searchEvents('query')).rejects.toThrow('Session expired');
      expect(mockAuthService.logout).toHaveBeenCalled();
    });

    it('should omit Authorization header when token is missing', async () => {
      mockAuthService.getToken.mockReturnValue(null);
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => []
      });

      await searchService.semanticSearch('query');

      expect(fetch).toHaveBeenCalledWith(
        `${API_URL}/api/semantic/search`,
        expect.objectContaining({
          headers: { 'Content-Type': 'application/json' }
        })
      );
    });
  });
});
