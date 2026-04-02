import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { AuthService } from '../wwwroot/js/services/auth.js';

describe('AuthService', () => {
  let authService;
  const API_URL = 'http://localhost:5078';
  let getItemSpy;
  let setItemSpy;
  let removeItemSpy;
  let sessionSetItemSpy;
  let sessionRemoveItemSpy;

  beforeEach(() => {
    authService = new AuthService(API_URL);
    global.fetch?.mockReset?.();
    getItemSpy = jest.spyOn(Storage.prototype, 'getItem');
    setItemSpy = jest.spyOn(Storage.prototype, 'setItem');
    removeItemSpy = jest.spyOn(Storage.prototype, 'removeItem');
    sessionSetItemSpy = jest.spyOn(global.sessionStorage, 'setItem');
    sessionRemoveItemSpy = jest.spyOn(global.sessionStorage, 'removeItem');
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('login', () => {
    it('should store token on successful login', async () => {
      const mockToken = 'test-token-123';
      global.fetch.mockResolvedValueOnce({
        ok: true,
        text: async () => JSON.stringify({ token: mockToken })
      });

      const result = await authService.login('test@example.com', 'password');

      expect(result.success).toBe(true);
      expect(result.token).toBe(mockToken);
      expect(setItemSpy).toHaveBeenCalledWith('authToken', mockToken);
      expect(setItemSpy).toHaveBeenCalledWith('memolibAuthToken', mockToken);
      expect(sessionSetItemSpy).toHaveBeenCalledWith('authToken', mockToken);
    });

    it('should return error on failed login', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        text: async () => 'Invalid credentials'
      });

      const result = await authService.login('test@example.com', 'wrong');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid credentials');
    });

    it('should validate required credentials', async () => {
      const result = await authService.login('', '');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Email and password are required');
      expect(fetch).not.toHaveBeenCalled();
    });

    it('should handle invalid JSON response', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        text: async () => 'invalid-json'
      });

      const result = await authService.login('test@example.com', 'password');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid server response');
    });

    it('should handle network failure', async () => {
      global.fetch.mockRejectedValueOnce(new Error('Network down'));

      const result = await authService.login('test@example.com', 'password');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Network down');
    });
  });

  describe('getToken', () => {
    it('should retrieve token from localStorage', () => {
      const mockToken = 'stored-token';
      getItemSpy
        .mockReturnValueOnce(mockToken)
        .mockReturnValueOnce(null)
        .mockReturnValueOnce(null);

      const token = authService.getToken();

      expect(token).toBe(mockToken);
    });
  });

  describe('logout', () => {
    it('should remove token from storage', () => {
      authService.logout();

      expect(removeItemSpy).toHaveBeenCalledWith('authToken');
      expect(removeItemSpy).toHaveBeenCalledWith('memolibAuthToken');
      expect(sessionRemoveItemSpy).toHaveBeenCalledWith('authToken');
    });
  });

  describe('isAuthenticated', () => {
    it('should return true when token exists', () => {
      getItemSpy.mockReturnValue('token');
      expect(authService.isAuthenticated()).toBe(true);
    });

    it('should return false when no token', () => {
      getItemSpy.mockReturnValue(null);
      expect(authService.isAuthenticated()).toBe(false);
    });
  });
});
