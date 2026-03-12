import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { debounce, paginate, formatDate, formatFileSize } from '../wwwroot/js/utils/helpers.js';

describe('Helpers', () => {
  describe('debounce', () => {
    it('should delay function execution', () => {
      jest.useFakeTimers();
      const fn = jest.fn();
      const debounced = debounce(fn, 300);

      debounced();
      expect(fn).not.toHaveBeenCalled();

      jest.advanceTimersByTime(300);
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should cancel previous calls', () => {
      const fn = jest.fn();
      const debounced = debounce(fn, 300);

      debounced();
      debounced();
      debounced();

      jest.advanceTimersByTime(300);
      expect(fn).toHaveBeenCalledTimes(1);
    });
  });

  describe('paginate', () => {
    const items = Array.from({ length: 50 }, (_, i) => i + 1);

    it('should return first page correctly', () => {
      const result = paginate(items, 1, 20);

      expect(result.items).toHaveLength(20);
      expect(result.items[0]).toBe(1);
      expect(result.page).toBe(1);
      expect(result.pages).toBe(3);
      expect(result.hasNext).toBe(true);
      expect(result.hasPrev).toBe(false);
    });

    it('should return middle page correctly', () => {
      const result = paginate(items, 2, 20);

      expect(result.items).toHaveLength(20);
      expect(result.items[0]).toBe(21);
      expect(result.hasNext).toBe(true);
      expect(result.hasPrev).toBe(true);
    });

    it('should return last page correctly', () => {
      const result = paginate(items, 3, 20);

      expect(result.items).toHaveLength(10);
      expect(result.items[0]).toBe(41);
      expect(result.hasNext).toBe(false);
      expect(result.hasPrev).toBe(true);
    });
  });

  describe('formatFileSize', () => {
    it('should format bytes correctly', () => {
      expect(formatFileSize(0)).toBe('0 B');
      expect(formatFileSize(1024)).toBe('1 KB');
      expect(formatFileSize(1048576)).toBe('1 MB');
      expect(formatFileSize(1073741824)).toBe('1 GB');
    });
  });

  describe('formatDate', () => {
    it('should format date in French locale', () => {
      const date = new Date('2025-01-30T10:30:00');
      const formatted = formatDate(date);
      expect(formatted).toContain('2025');
    });
  });
});
