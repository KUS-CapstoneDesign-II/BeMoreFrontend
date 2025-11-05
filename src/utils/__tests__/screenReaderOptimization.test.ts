/**
 * Screen Reader Optimization Tests (A-03)
 *
 * Tests for screen reader support and semantic accessibility
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  announceToScreenReader,
  addAccessibleDescription,
  labelFormInput,
  validateScreenReaderAccessibility,
  ARIA_LIVE_POLITENESS,
  ARIA_ROLES,
  ARIA_PATTERNS,
  getScreenReaderTips,
} from '../screenReaderOptimization';

describe('Screen Reader Optimization (A-03)', () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.removeChild(container);
  });

  describe('ARIA live politeness levels', () => {
    it('should have correct politeness values', () => {
      expect(ARIA_LIVE_POLITENESS.POLITE).toBe('polite');
      expect(ARIA_LIVE_POLITENESS.ASSERTIVE).toBe('assertive');
      expect(ARIA_LIVE_POLITENESS.OFF).toBe('off');
    });
  });

  describe('ARIA roles', () => {
    it('should have main content roles', () => {
      expect(ARIA_ROLES.MAIN).toBe('main');
      expect(ARIA_ROLES.NAVIGATION).toBe('navigation');
      expect(ARIA_ROLES.COMPLEMENTARY).toBe('complementary');
    });

    it('should have interactive element roles', () => {
      expect(ARIA_ROLES.BUTTON).toBeUndefined();
      expect(ARIA_ROLES.DIALOG).toBe('dialog');
      expect(ARIA_ROLES.TABLIST).toBe('tablist');
      expect(ARIA_ROLES.MENUBAR).toBe('menubar');
    });
  });

  describe('screen reader announcements', () => {
    it('should announce messages to screen readers', () => {
      const message = 'Content loaded successfully';
      expect(() => {
        announceToScreenReader(message, ARIA_LIVE_POLITENESS.POLITE);
      }).not.toThrow();
    });

    it('should handle assertive announcements', () => {
      const message = 'Error: Please correct the form';
      expect(() => {
        announceToScreenReader(message, ARIA_LIVE_POLITENESS.ASSERTIVE);
      }).not.toThrow();
    });

    it('should handle custom timeout', () => {
      const message = 'Quick announcement';
      expect(() => {
        announceToScreenReader(message, ARIA_LIVE_POLITENESS.POLITE, 500);
      }).not.toThrow();
    });
  });

  describe('form input labeling', () => {
    it('should create accessible label for input', () => {
      const input = document.createElement('input');
      input.type = 'text';
      container.appendChild(input);

      const label = labelFormInput(input, 'Username');

      expect(label.textContent).toBe('Username');
      expect(input.id).toBeTruthy();
      expect(label.htmlFor).toBe(input.id);
    });

    it('should use provided ID', () => {
      const input = document.createElement('input');
      input.type = 'text';
      container.appendChild(input);

      const label = labelFormInput(input, 'Email', 'email-input');

      expect(input.id).toBe('email-input');
      expect(label.htmlFor).toBe('email-input');
    });

    it('should preserve existing ID', () => {
      const input = document.createElement('input');
      input.type = 'text';
      input.id = 'existing-id';
      container.appendChild(input);

      const label = labelFormInput(input, 'Search');

      expect(label.htmlFor).toBe('existing-id');
    });
  });

  describe('accessible descriptions', () => {
    it('should add accessible description', () => {
      const element = document.createElement('div');
      container.appendChild(element);

      const descId = addAccessibleDescription(element, 'This is a description');

      expect(descId).toBeTruthy();
      expect(element.getAttribute('aria-describedby')).toBe(descId);
      expect(document.getElementById(descId)?.textContent).toBe('This is a description');
    });

    it('should hide description from visual display', () => {
      const element = document.createElement('div');
      container.appendChild(element);

      addAccessibleDescription(element, 'Hidden description');

      const desc = element.querySelector('span');
      expect(desc?.style.display).toBe('none');
    });
  });

  describe('screen reader accessibility validation', () => {
    it('should validate accessible HTML', () => {
      container.innerHTML = `
        <main>
          <h1>Page Title</h1>
          <label for="name">Name:</label>
          <input id="name" type="text" />
          <img src="test.jpg" alt="Test image" />
          <a href="#">Link text</a>
        </main>
      `;

      const result = validateScreenReaderAccessibility(container);

      expect(result.valid).toBe(true);
      expect(result.issues.length).toBe(0);
    });

    it('should detect missing alt text on images', () => {
      container.innerHTML = '<img src="test.jpg" />';

      const result = validateScreenReaderAccessibility(container);

      expect(result.issues.some((issue) => issue.includes('alt text'))).toBe(true);
    });

    it('should detect unlabeled inputs', () => {
      container.innerHTML = '<input type="text" />';

      const result = validateScreenReaderAccessibility(container);

      expect(result.issues.some((issue) => issue.includes('label'))).toBe(true);
      expect(result.summary.unlabeledInputs).toBeGreaterThan(0);
    });

    it('should detect missing link text', () => {
      container.innerHTML = '<a href="#"></a>';

      const result = validateScreenReaderAccessibility(container);

      expect(result.issues.some((issue) => issue.includes('Link'))).toBe(true);
    });

    it('should warn about missing main landmark', () => {
      container.innerHTML = '<div>No main element</div>';

      const result = validateScreenReaderAccessibility(container);

      expect(result.warnings.some((warning) => warning.includes('main'))).toBe(true);
    });

    it('should count semantic elements', () => {
      container.innerHTML = `
        <main>
          <h1>Title</h1>
          <nav>Navigation</nav>
          <article>Content</article>
        </main>
      `;

      const result = validateScreenReaderAccessibility(container);

      expect(result.summary.semanticElements).toBeGreaterThan(0);
    });

    it('should count ARIA elements', () => {
      container.innerHTML = `
        <div role="main" aria-label="Main content">
          <button aria-describedby="desc">Click me</button>
          <span id="desc">Description</span>
        </div>
      `;

      const result = validateScreenReaderAccessibility(container);

      expect(result.summary.ariaElements).toBeGreaterThan(0);
    });
  });

  describe('screen reader tips', () => {
    it('should provide helpful tips', () => {
      const tips = getScreenReaderTips();

      expect(Array.isArray(tips)).toBe(true);
      expect(tips.length).toBeGreaterThan(0);
    });

    it('should include semantic HTML tips', () => {
      const tips = getScreenReaderTips();

      expect(tips.some((tip) => tip.includes('semantic'))).toBe(true);
    });

    it('should include testing recommendations', () => {
      const tips = getScreenReaderTips();

      expect(tips.some((tip) => tip.includes('screen reader'))).toBe(true);
    });
  });

  describe('ARIA patterns', () => {
    it('should provide alert pattern', () => {
      expect(ARIA_PATTERNS.alert.role).toBe('alert');
      expect(ARIA_PATTERNS.alert.attributes['aria-live']).toBe('assertive');
    });

    it('should provide status pattern', () => {
      expect(ARIA_PATTERNS.status.role).toBe('status');
      expect(ARIA_PATTERNS.status.attributes['aria-live']).toBe('polite');
    });

    it('should provide modal pattern', () => {
      expect(ARIA_PATTERNS.modal.role).toBe('dialog');
      expect(ARIA_PATTERNS.modal.attributes['aria-modal']).toBe('true');
    });
  });

  describe('accessibility compliance', () => {
    it('should support WCAG 2.1 AA standards', () => {
      container.innerHTML = `
        <main>
          <h1>Accessible Page</h1>
          <section aria-label="Content">
            <p>Well-structured content with proper semantics.</p>
          </section>
        </main>
      `;

      const result = validateScreenReaderAccessibility(container);

      expect(result.summary.semanticElements).toBeGreaterThan(0);
    });

    it('should validate form accessibility', () => {
      container.innerHTML = `
        <form>
          <label for="username">Username:</label>
          <input id="username" type="text" />

          <label for="password">Password:</label>
          <input id="password" type="password" />

          <button type="submit">Login</button>
        </form>
      `;

      const result = validateScreenReaderAccessibility(container);

      expect(result.summary.unlabeledInputs).toBe(0);
    });

    it('should validate list accessibility', () => {
      container.innerHTML = `
        <ul>
          <li><a href="#">Item 1</a></li>
          <li><a href="#">Item 2</a></li>
          <li><a href="#">Item 3</a></li>
        </ul>
      `;

      const result = validateScreenReaderAccessibility(container);

      expect(result.valid).toBe(true);
    });
  });
});
