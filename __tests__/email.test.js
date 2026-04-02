import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { EmailService } from '../wwwroot/js/services/email.js';

describe('EmailService', () => {
  let emailService;
  let mockAuthService;
  const API_URL = 'http://localhost:5078';

  beforeEach(() => {
    mockAuthService = {
      getToken: jest.fn(() => 'test-token'),
      logout: jest.fn()
    };
    emailService = new EmailService(API_URL, mockAuthService);
    jest.clearAllMocks();
    global.fetch?.mockReset?.();
  });

  describe('ingestEmail', () => {
    it('should ingest email with auto timestamp', async () => {
      const mockResponse = { success: true, eventId: '123' };
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      const emailData = {
        from: 'test@example.com',
        subject: 'Test',
        body: 'Content'
      };

      const result = await emailService.ingestEmail(emailData);

      expect(result).toEqual(mockResponse);
      expect(fetch).toHaveBeenCalledWith(
        `${API_URL}/api/ingest/email`,
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('occurredAt')
        })
      );
    });

    it('should preserve custom occurredAt', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true })
      });

      const customDate = '2025-01-01T00:00:00Z';
      await emailService.ingestEmail({
        from: 'test@example.com',
        occurredAt: customDate
      });

      const callBody = JSON.parse(fetch.mock.calls[0][1].body);
      expect(callBody.occurredAt).toBe(customDate);
    });
  });

  describe('manualScan', () => {
    it('should perform manual scan with default limit', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ scanned: 10 })
      });

      const result = await emailService.manualScan();

      expect(result).toEqual({ scanned: 10 });
      expect(fetch).toHaveBeenCalledWith(
        `${API_URL}/api/email-scan/manual?previewLimit=500`,
        expect.any(Object)
      );
    });

    it('should cancel previous scan request', async () => {
      const abortSpy = jest.fn();
      global.AbortController = jest.fn(() => ({
        signal: {},
        abort: abortSpy
      }));

      global.fetch.mockImplementation(() => new Promise(() => {}));

      emailService.manualScan();
      emailService.manualScan();

      expect(abortSpy).toHaveBeenCalled();
    });
  });

  describe('sendEmail', () => {
    it('should send email successfully', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ sent: true })
      });

      const result = await emailService.sendEmail(
        'client@test.com',
        'Subject',
        'Body content'
      );

      expect(result).toEqual({ sent: true });
    });

    it('should validate required fields', async () => {
      await expect(emailService.sendEmail('', 'Subject', 'Body'))
        .rejects.toThrow('Missing required fields');

      await expect(emailService.sendEmail('to@test.com', '', 'Body'))
        .rejects.toThrow('Missing required fields');

      await expect(emailService.sendEmail('to@test.com', 'Subject', ''))
        .rejects.toThrow('Missing required fields');
    });
  });

  describe('getTemplates', () => {
    it('should fetch email templates', async () => {
      const mockTemplates = [
        { id: '1', name: 'Welcome', subject: 'Welcome!' }
      ];
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockTemplates
      });

      const result = await emailService.getTemplates();

      expect(result).toEqual(mockTemplates);
    });

    it('should retry on failure', async () => {
      global.fetch
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({
          ok: true,
          json: async () => []
        });

      const result = await emailService.getTemplates();

      expect(result).toEqual([]);
      expect(fetch).toHaveBeenCalledTimes(2);
    });
  });

  describe('createTemplate', () => {
    it('should create template successfully', async () => {
      const newTemplate = {
        name: 'New Template',
        subject: 'Subject',
        body: 'Body'
      };
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: '1', ...newTemplate })
      });

      const result = await emailService.createTemplate(newTemplate);

      expect(result.id).toBe('1');
    });

    it('should validate required template fields', async () => {
      await expect(emailService.createTemplate({ name: 'Test' }))
        .rejects.toThrow('Missing required template fields');

      await expect(emailService.createTemplate({ subject: 'Test' }))
        .rejects.toThrow('Missing required template fields');

      await expect(emailService.createTemplate({ body: 'Test' }))
        .rejects.toThrow('Missing required template fields');
    });
  });

  describe('error handling', () => {
    it('should handle 401 and logout', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 401
      });

      await expect(emailService.getTemplates()).rejects.toThrow('Session expired');
      expect(mockAuthService.logout).toHaveBeenCalled();
    });

    it('should not retry on AbortError', async () => {
      const abortError = new Error('Aborted');
      abortError.name = 'AbortError';
      global.fetch.mockRejectedValueOnce(abortError);

      await expect(emailService.getTemplates()).rejects.toThrow('Aborted');
      expect(fetch).toHaveBeenCalledTimes(1);
    });

    it('should not retry on non-retriable 4xx errors', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 400
      });

      await expect(emailService.getTemplates()).rejects.toThrow('HTTP 400');
      expect(fetch).toHaveBeenCalledTimes(1);
    });
  });

  describe('cancelAllRequests', () => {
    it('should cancel all pending requests', () => {
      const abortSpy = jest.fn();
      global.AbortController = jest.fn(() => ({
        signal: {},
        abort: abortSpy
      }));

      global.fetch.mockImplementation(() => new Promise(() => {}));

      emailService.manualScan();
      emailService.cancelAllRequests();

      expect(abortSpy).toHaveBeenCalled();
    });
  });
});
