import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { ClientService } from '../wwwroot/js/services/clients.js';

describe('ClientService', () => {
  let clientService;
  let mockAuthService;
  const API_URL = 'http://localhost:5078';

  beforeEach(() => {
    mockAuthService = {
      getToken: jest.fn(() => 'test-token'),
      logout: jest.fn()
    };
    clientService = new ClientService(API_URL, mockAuthService);
    jest.clearAllMocks();
    global.fetch?.mockReset?.();
  });

  describe('getClients', () => {
    it('should fetch and cache clients', async () => {
      const mockClients = [{ id: '1', name: 'Client A' }];
      global.fetch.mockResolvedValueOnce({
        ok: true,
        text: async () => JSON.stringify(mockClients)
      });

      const result = await clientService.getClients();

      expect(result).toEqual(mockClients);
      expect(fetch).toHaveBeenCalledTimes(1);

      // Cache hit
      const result2 = await clientService.getClients();
      expect(result2).toEqual(mockClients);
      expect(fetch).toHaveBeenCalledTimes(1);
    });

    it('should handle empty response', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        text: async () => ''
      });

      const result = await clientService.getClients();

      expect(result).toEqual([]);
    });

    it('should retry on network failure', async () => {
      global.fetch
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({
          ok: true,
          text: async () => JSON.stringify([])
        });

      const result = await clientService.getClients(false);

      expect(result).toEqual([]);
      expect(fetch).toHaveBeenCalledTimes(2);
    });
  });

  describe('getClientById', () => {
    it('should fetch and cache single client', async () => {
      const mockClient = { id: '1', name: 'Client A', email: 'a@test.com' };
      global.fetch.mockResolvedValueOnce({
        ok: true,
        text: async () => JSON.stringify(mockClient)
      });

      const result = await clientService.getClientById('1');

      expect(result).toEqual(mockClient);
      expect(fetch).toHaveBeenCalledWith(
        `${API_URL}/api/client/1/detail`,
        expect.any(Object)
      );
    });

    it('should use cache on second call', async () => {
      const mockClient = { id: '1', name: 'Client A' };
      global.fetch.mockResolvedValueOnce({
        ok: true,
        text: async () => JSON.stringify(mockClient)
      });

      await clientService.getClientById('1');
      const result2 = await clientService.getClientById('1');

      expect(result2).toEqual(mockClient);
      expect(fetch).toHaveBeenCalledTimes(1);
    });
  });

  describe('createClient', () => {
    it('should create client and clear cache', async () => {
      const newClient = { id: '2', name: 'Client B' };
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => newClient
      });

      clientService.setCache('clients', [{ id: '1' }]);

      const result = await clientService.createClient({ name: 'Client B' });

      expect(result).toEqual(newClient);
      expect(clientService.getCached('clients')).toBeNull();
    });
  });

  describe('updateClient', () => {
    it('should update client and invalidate cache', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true })
      });

      clientService.setCache('client-1', { id: '1', name: 'Old' });
      clientService.setCache('clients', [{ id: '1' }]);

      await clientService.updateClient('1', { name: 'New' });

      expect(clientService.getCached('client-1')).toBeNull();
      expect(clientService.getCached('clients')).toBeNull();
    });
  });

  describe('error handling', () => {
    it('should handle 401 and logout', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 401
      });

      await expect(clientService.getClients()).rejects.toThrow('Session expired');
      expect(mockAuthService.logout).toHaveBeenCalled();
    });

    it('should throw after max retries', async () => {
      global.fetch.mockRejectedValue(new Error('Network error'));

      await expect(clientService.getClients(false)).rejects.toThrow('Network error');
      expect(fetch).toHaveBeenCalledTimes(3); // Initial + 2 retries
    });
  });

  describe('clearCache', () => {
    it('should clear all cached data', () => {
      clientService.setCache('clients', []);
      clientService.setCache('client-1', {});

      clientService.clearCache();

      expect(clientService.getCached('clients')).toBeNull();
      expect(clientService.getCached('client-1')).toBeNull();
    });
  });
});
