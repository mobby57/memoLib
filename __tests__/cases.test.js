import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { CaseService } from '../wwwroot/js/services/cases.js';

describe('CaseService', () => {
  let caseService;
  let mockAuthService;
  const API_URL = 'http://localhost:5078';

  beforeEach(() => {
    mockAuthService = {
      getToken: jest.fn(() => 'test-token'),
      logout: jest.fn()
    };
    caseService = new CaseService(API_URL, mockAuthService);
    jest.clearAllMocks();
    global.fetch?.mockReset?.();
  });

  describe('getCases', () => {
    it('should fetch and cache cases', async () => {
      const mockCases = [{ id: '1', title: 'Case 1' }];
      global.fetch.mockResolvedValueOnce({
        ok: true,
        text: async () => JSON.stringify(mockCases)
      });

      const result = await caseService.getCases();

      expect(result).toEqual(mockCases);
      expect(fetch).toHaveBeenCalledTimes(1);

      // Second call should use cache
      const result2 = await caseService.getCases();
      expect(result2).toEqual(mockCases);
      expect(fetch).toHaveBeenCalledTimes(1);
    });

    it('should bypass cache when useCache is false', async () => {
      const mockCases = [{ id: '1', title: 'Case 1' }];
      global.fetch.mockResolvedValue({
        ok: true,
        text: async () => JSON.stringify(mockCases)
      });

      await caseService.getCases(false);
      await caseService.getCases(false);

      expect(fetch).toHaveBeenCalledTimes(2);
    });

    it('should handle 401 and logout', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 401
      });

      await expect(caseService.getCases()).rejects.toThrow('Session expired');
      expect(mockAuthService.logout).toHaveBeenCalled();
    });

    it('should retry on failure', async () => {
      global.fetch
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({
          ok: true,
          text: async () => JSON.stringify([])
        });

      const result = await caseService.getCases(false);

      expect(result).toEqual([]);
      expect(fetch).toHaveBeenCalledTimes(2);
    });
  });

  describe('getCaseById', () => {
    it('should fetch and cache single case', async () => {
      const mockCase = { id: '1', title: 'Case 1' };
      global.fetch.mockResolvedValueOnce({
        ok: true,
        text: async () => JSON.stringify(mockCase)
      });

      const result = await caseService.getCaseById('1');

      expect(result).toEqual(mockCase);
      expect(fetch).toHaveBeenCalledWith(
        `${API_URL}/api/cases/1`,
        expect.any(Object)
      );
    });
  });

  describe('createCase', () => {
    it('should create case and clear cache', async () => {
      const newCase = { id: '2', title: 'New Case' };
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => newCase
      });

      // Populate cache first
      caseService.setCache('cases', [{ id: '1' }]);

      const result = await caseService.createCase('New Case');

      expect(result).toEqual(newCase);
      expect(caseService.getCached('cases')).toBeNull();
    });
  });

  describe('updateStatus', () => {
    it('should update status and invalidate cache', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true })
      });

      caseService.setCache('case-1', { id: '1', status: 'OPEN' });
      caseService.setCache('cases', [{ id: '1' }]);

      await caseService.updateStatus('1', 'CLOSED');

      expect(caseService.getCached('case-1')).toBeNull();
      expect(caseService.getCached('cases')).toBeNull();
    });
  });

  describe('mergeDuplicates', () => {
    it('should merge duplicates and clear cache', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ merged: 2 })
      });

      caseService.setCache('cases', [{ id: '1' }, { id: '2' }]);

      const result = await caseService.mergeDuplicates();

      expect(result).toEqual({ merged: 2 });
      expect(caseService.getCached('cases')).toBeNull();
    });
  });

  describe('clearCache', () => {
    it('should clear all cached data', () => {
      caseService.setCache('cases', []);
      caseService.setCache('case-1', {});

      caseService.clearCache();

      expect(caseService.getCached('cases')).toBeNull();
      expect(caseService.getCached('case-1')).toBeNull();
    });
  });
});
