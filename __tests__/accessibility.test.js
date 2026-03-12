import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import {
  enhanceAccessibility,
  trapFocus,
  announceToScreenReader,
  setLoadingState,
  addKeyboardNavigation
} from '../wwwroot/js/utils/accessibility.js';

describe('Accessibility Utils', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    delete document.body.dataset.a11yEnhanced;
    global.requestAnimationFrame = (cb) => setTimeout(cb, 0);
  });

  describe('enhanceAccessibility', () => {
    it('should add aria-label to buttons without one', () => {
      document.body.innerHTML = '<button>Click Me</button>';

      enhanceAccessibility();

      const button = document.querySelector('button');
      expect(button.getAttribute('aria-label')).toBe('Click Me');
    });

    it('should add role to onclick elements', () => {
      document.body.innerHTML = '<div onclick="test()">Clickable</div>';

      enhanceAccessibility();

      const div = document.querySelector('div');
      expect(div.getAttribute('role')).toBe('button');
      expect(div.getAttribute('tabindex')).toBe('0');
    });

    it('should add skip link', () => {
      enhanceAccessibility();

      const skipLink = document.querySelector('.skip-link');
      expect(skipLink).toBeTruthy();
      expect(skipLink.textContent).toBe('Aller au contenu principal');
    });

    it('should not duplicate skip link when called twice', () => {
      enhanceAccessibility();
      enhanceAccessibility();

      expect(document.querySelectorAll('.skip-link')).toHaveLength(1);
    });

    it('should close modal on Escape key', () => {
      document.body.innerHTML = '<div class="modal" style="display: block;"></div>';

      enhanceAccessibility();

      const event = new KeyboardEvent('keydown', { key: 'Escape' });
      document.dispatchEvent(event);

      const modal = document.querySelector('.modal');
      expect(modal.style.display).toBe('none');
      expect(modal.getAttribute('aria-hidden')).toBe('true');
    });
  });

  describe('trapFocus', () => {
    it('should trap focus within modal', () => {
      document.body.innerHTML = `
        <div id="modal">
          <button id="first">First</button>
          <button id="last">Last</button>
        </div>
      `;

      const modal = document.getElementById('modal');
      const first = document.getElementById('first');
      const last = document.getElementById('last');

      const cleanup = trapFocus(modal);
      expect(document.activeElement).toBe(first);

      // Simulate Tab on last element
      last.focus();
      const tabEvent = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true });
      Object.defineProperty(tabEvent, 'target', { value: last });
      modal.dispatchEvent(tabEvent);

      expect(document.activeElement).toBe(first);
      cleanup();
    });

    it('should return noop cleanup when modal is missing', () => {
      const cleanup = trapFocus(null);
      expect(typeof cleanup).toBe('function');
      expect(() => cleanup()).not.toThrow();
    });
  });

  describe('announceToScreenReader', () => {
    it('should create announcement with polite priority', (done) => {
      announceToScreenReader('Test message');

      setTimeout(() => {
        const announcement = document.getElementById('sr-announcer-polite');
        expect(announcement).toBeTruthy();
        expect(announcement.getAttribute('aria-live')).toBe('polite');
        expect(announcement.textContent).toBe('Test message');
        done();
      }, 5);
    });

    it('should create alert with assertive priority', () => {
      announceToScreenReader('Urgent!', 'assertive');

      const announcement = document.querySelector('[role="alert"]');
      expect(announcement).toBeTruthy();
      expect(announcement.getAttribute('aria-live')).toBe('assertive');
    });

    it('should reuse polite announcer node', (done) => {
      announceToScreenReader('First message');
      announceToScreenReader('Second message');

      setTimeout(() => {
        expect(document.querySelectorAll('#sr-announcer-polite')).toHaveLength(1);
        expect(document.getElementById('sr-announcer-polite').textContent).toBe('Second message');
        done();
      }, 5);
    });
  });

  describe('setLoadingState', () => {
    it('should set loading state on element', () => {
      document.body.innerHTML = '<button id="btn">Submit</button>';
      const button = document.getElementById('btn');

      setLoadingState(button, true);

      expect(button.getAttribute('aria-busy')).toBe('true');
      expect(button.hasAttribute('disabled')).toBe(true);
    });

    it('should remove loading state', () => {
      document.body.innerHTML = '<button id="btn" aria-busy="true" disabled>Submit</button>';
      const button = document.getElementById('btn');

      setLoadingState(button, false);

      expect(button.hasAttribute('aria-busy')).toBe(false);
      expect(button.hasAttribute('disabled')).toBe(false);
    });
  });

  describe('addKeyboardNavigation', () => {
    it('should trigger callback on Enter key', () => {
      document.body.innerHTML = '<div id="item">Item</div>';
      const item = document.getElementById('item');
      const callback = jest.fn();

      addKeyboardNavigation(item, callback);

      const event = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true });
      item.dispatchEvent(event);

      expect(callback).toHaveBeenCalled();
    });

    it('should trigger callback on Space key', () => {
      document.body.innerHTML = '<div id="item">Item</div>';
      const item = document.getElementById('item');
      const callback = jest.fn();

      addKeyboardNavigation(item, callback);

      const event = new KeyboardEvent('keydown', { key: ' ', bubbles: true });
      item.dispatchEvent(event);

      expect(callback).toHaveBeenCalled();
    });

    it('should not trigger on other keys', () => {
      document.body.innerHTML = '<div id="item">Item</div>';
      const item = document.getElementById('item');
      const callback = jest.fn();

      addKeyboardNavigation(item, callback);

      const event = new KeyboardEvent('keydown', { key: 'a', bubbles: true });
      item.dispatchEvent(event);

      expect(callback).not.toHaveBeenCalled();
    });
  });
});
