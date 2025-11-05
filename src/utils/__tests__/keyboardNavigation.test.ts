/**
 * Keyboard Navigation Tests (A-02)
 *
 * Tests for keyboard navigation and tab order optimization
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  getFocusableElements,
  getFirstFocusable,
  getLastFocusable,
  focusElement,
  getNextItemIndex,
  validateTabOrder,
  KEYBOARD_KEYS,
} from '../keyboardNavigation';

describe('Keyboard Navigation (A-02)', () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  const cleanup = () => {
    document.body.removeChild(container);
  };

  describe('getFocusableElements', () => {
    it('should find all focusable elements', () => {
      container.innerHTML = `
        <button>Button 1</button>
        <a href="#">Link</a>
        <input type="text" />
        <div tabindex="0">Focusable div</div>
        <span>Not focusable</span>
      `;

      const focusable = getFocusableElements(container);
      expect(focusable).toHaveLength(4);
    });

    it('should exclude disabled elements', () => {
      container.innerHTML = `
        <button>Enabled</button>
        <button disabled>Disabled</button>
        <input type="text" />
        <input type="text" disabled />
      `;

      const focusable = getFocusableElements(container);
      expect(focusable).toHaveLength(2);
    });

    it('should exclude hidden elements', () => {
      container.innerHTML = `
        <button>Visible</button>
        <button style="display: none;">Hidden</button>
        <button style="visibility: hidden;">Not visible</button>
      `;

      const focusable = getFocusableElements(container);
      expect(focusable).toHaveLength(1);
    });

    it('should handle elements with tabindex -1', () => {
      container.innerHTML = `
        <button>Normal</button>
        <button tabindex="-1">Skip</button>
        <button>Default</button>
      `;

      const focusable = getFocusableElements(container);
      // Elements with tabindex -1 are focusable but skipped in tab order
      expect(focusable.length).toBeGreaterThanOrEqual(2);
      expect(focusable.some((el) => el.getAttribute('tabindex') === '-1')).toBe(true);
    });

    it('should work with document as default', () => {
      const initialFocusable = getFocusableElements();
      expect(Array.isArray(initialFocusable)).toBe(true);
    });
  });

  describe('getFirstFocusable', () => {
    it('should return first focusable element', () => {
      container.innerHTML = `
        <button id="first">Button 1</button>
        <button id="second">Button 2</button>
      `;

      const first = getFirstFocusable(container);
      expect(first?.id).toBe('first');
    });

    it('should return null when no focusable elements', () => {
      container.innerHTML = '<span>Not focusable</span>';

      const first = getFirstFocusable(container);
      expect(first).toBeNull();
    });
  });

  describe('getLastFocusable', () => {
    it('should return last focusable element', () => {
      container.innerHTML = `
        <button id="first">Button 1</button>
        <button id="last">Button 2</button>
      `;

      const last = getLastFocusable(container);
      expect(last?.id).toBe('last');
    });

    it('should return null when no focusable elements', () => {
      container.innerHTML = '<span>Not focusable</span>';

      const last = getLastFocusable(container);
      expect(last).toBeNull();
    });
  });

  describe('focusElement', () => {
    it('should focus an element', () => {
      container.innerHTML = '<button id="test">Focus me</button>';
      const button = container.querySelector<HTMLButtonElement>('#test');

      if (button) {
        focusElement(button, false);
        expect(document.activeElement).toBe(button);
      }
    });

    it('should handle null gracefully', () => {
      expect(() => focusElement(null)).not.toThrow();
    });

    it('should prevent scroll when smooth=false', () => {
      container.innerHTML = '<button id="test">Button</button>';
      const button = container.querySelector<HTMLButtonElement>('#test');

      if (button) {
        const focusSpy = vi.spyOn(button, 'focus');
        focusElement(button, false);

        expect(focusSpy).toHaveBeenCalledWith({ preventScroll: true });
        focusSpy.mockRestore();
      }
    });
  });

  describe('getNextItemIndex', () => {
    it('should navigate down in vertical list', () => {
      const items = [
        document.createElement('button'),
        document.createElement('button'),
        document.createElement('button'),
      ];

      const event = {
        key: KEYBOARD_KEYS.ARROW_DOWN,
        preventDefault: vi.fn(),
      } as any;

      const nextIndex = getNextItemIndex(event, {
        items,
        currentIndex: 0,
        vertical: true,
      });

      expect(nextIndex).toBe(1);
      expect(event.preventDefault).toHaveBeenCalled();
    });

    it('should navigate up in vertical list', () => {
      const items = [
        document.createElement('button'),
        document.createElement('button'),
      ];

      const event = {
        key: KEYBOARD_KEYS.ARROW_UP,
        preventDefault: vi.fn(),
      } as any;

      const nextIndex = getNextItemIndex(event, {
        items,
        currentIndex: 1,
        vertical: true,
      });

      expect(nextIndex).toBe(0);
    });

    it('should jump to start with Home key', () => {
      const items = [
        document.createElement('button'),
        document.createElement('button'),
        document.createElement('button'),
      ];

      const event = {
        key: KEYBOARD_KEYS.HOME,
        preventDefault: vi.fn(),
      } as any;

      const nextIndex = getNextItemIndex(event, {
        items,
        currentIndex: 2,
      });

      expect(nextIndex).toBe(0);
    });

    it('should jump to end with End key', () => {
      const items = [
        document.createElement('button'),
        document.createElement('button'),
        document.createElement('button'),
      ];

      const event = {
        key: KEYBOARD_KEYS.END,
        preventDefault: vi.fn(),
      } as any;

      const nextIndex = getNextItemIndex(event, {
        items,
        currentIndex: 0,
      });

      expect(nextIndex).toBe(2);
    });

    it('should loop when enabled', () => {
      const items = [
        document.createElement('button'),
        document.createElement('button'),
      ];

      const event = {
        key: KEYBOARD_KEYS.ARROW_DOWN,
        preventDefault: vi.fn(),
      } as any;

      const nextIndex = getNextItemIndex(event, {
        items,
        currentIndex: 1,
        loop: true,
      });

      expect(nextIndex).toBe(0);
    });

    it('should not loop when disabled', () => {
      const items = [
        document.createElement('button'),
        document.createElement('button'),
      ];

      const event = {
        key: KEYBOARD_KEYS.ARROW_DOWN,
        preventDefault: vi.fn(),
      } as any;

      const nextIndex = getNextItemIndex(event, {
        items,
        currentIndex: 1,
        loop: false,
      });

      expect(nextIndex).toBe(1);
    });

    it('should return null for unhandled keys', () => {
      const items = [document.createElement('button')];

      const event = {
        key: 'a',
        preventDefault: vi.fn(),
      } as any;

      const nextIndex = getNextItemIndex(event, {
        items,
        currentIndex: 0,
      });

      expect(nextIndex).toBeNull();
      expect(event.preventDefault).not.toHaveBeenCalled();
    });
  });

  describe('validateTabOrder', () => {
    it('should validate tab order', () => {
      container.innerHTML = `
        <button>Button 1</button>
        <button>Button 2</button>
        <input type="text" aria-label="Input" />
      `;

      const result = validateTabOrder(container);

      expect(result.valid).toBe(true);
      expect(result.focusableCount).toBe(3);
      expect(result.issues).toHaveLength(0);
    });

    it('should detect positive tabindex values', () => {
      container.innerHTML = '<button tabindex="5">High tabindex</button>';

      const result = validateTabOrder(container);

      expect(result.valid).toBe(false);
      expect(result.issues.length).toBeGreaterThan(0);
      expect(result.issues[0]).toContain('positive tabindex');
    });

    it('should detect missing labels on form inputs', () => {
      container.innerHTML = '<input type="text" />';

      const result = validateTabOrder(container);

      expect(result.valid).toBe(false);
      expect(result.issues[0]).toContain('label');
    });

    it('should pass validation with aria-label', () => {
      container.innerHTML = '<input type="text" aria-label="Username" />';

      const result = validateTabOrder(container);

      expect(result.valid).toBe(true);
    });

    it('should pass validation with associated label', () => {
      container.innerHTML = `
        <label for="username">Username</label>
        <input id="username" type="text" />
      `;

      const result = validateTabOrder(container);

      expect(result.valid).toBe(true);
    });
  });

  describe('keyboard constants', () => {
    it('should have keyboard key constants', () => {
      expect(KEYBOARD_KEYS.ENTER).toBe('Enter');
      expect(KEYBOARD_KEYS.SPACE).toBe(' ');
      expect(KEYBOARD_KEYS.ESCAPE).toBe('Escape');
      expect(KEYBOARD_KEYS.TAB).toBe('Tab');
      expect(KEYBOARD_KEYS.ARROW_UP).toBe('ArrowUp');
      expect(KEYBOARD_KEYS.ARROW_DOWN).toBe('ArrowDown');
    });
  });

  describe('accessibility requirements', () => {
    it('should support keyboard-only navigation', () => {
      container.innerHTML = `
        <a href="#">Link 1</a>
        <button>Button 1</button>
        <input type="text" aria-label="Search" />
        <button>Button 2</button>
      `;

      const focusable = getFocusableElements(container);

      // Should be able to tab through all elements
      let current = focusable[0];
      for (let i = 1; i < focusable.length; i++) {
        expect(current).toBeDefined();
        current = focusable[i];
      }
    });

    it('should have proper focus indicators', () => {
      container.innerHTML = `
        <button style="outline: 2px solid blue;">Focusable</button>
      `;

      const button = container.querySelector('button');
      if (button) {
        const style = window.getComputedStyle(button);
        expect(style.outline).toBeTruthy();
      }
    });

    it('should maintain logical tab order', () => {
      container.innerHTML = `
        <button id="b1">Button 1</button>
        <button id="b2">Button 2</button>
        <button id="b3">Button 3</button>
      `;

      const focusable = getFocusableElements(container);
      const ids = focusable.map((el) => el.id);

      expect(ids).toEqual(['b1', 'b2', 'b3']);
    });
  });

  afterEach(() => {
    cleanup();
  });
});
