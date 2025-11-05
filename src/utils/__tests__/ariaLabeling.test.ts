/**
 * ARIA Labeling Tests (A-04)
 *
 * Tests for ARIA labeling and accessible naming
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  setAriaLabel,
  setAriaLabelledBy,
  setAriaDescribedBy,
  hasAccessibleName,
  getAccessibleName,
  validateAriaLabels,
  generateUniqueId,
  connectLabelToInput,
  makeIconButtonAccessible,
  getAriaLabelingRecommendations,
  ARIA_LABEL_PATTERNS,
  createAccessibleButton,
  createAccessibleIconButton,
  createAccessibleFormGroup,
} from '../ariaLabeling';

describe('ARIA Labeling (A-04)', () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.removeChild(container);
  });

  describe('setAriaLabel', () => {
    it('should set aria-label attribute', () => {
      const element = document.createElement('button');
      setAriaLabel(element, 'Close dialog');

      expect(element.getAttribute('aria-label')).toBe('Close dialog');
    });
  });

  describe('setAriaLabelledBy', () => {
    it('should set aria-labelledby attribute', () => {
      const element = document.createElement('div');
      setAriaLabelledBy(element, 'label-id');

      expect(element.getAttribute('aria-labelledby')).toBe('label-id');
    });
  });

  describe('setAriaDescribedBy', () => {
    it('should set aria-describedby attribute', () => {
      const element = document.createElement('input');
      setAriaDescribedBy(element, 'desc-id');

      expect(element.getAttribute('aria-describedby')).toBe('desc-id');
    });
  });

  describe('hasAccessibleName', () => {
    it('should detect button with text content', () => {
      const button = document.createElement('button');
      button.textContent = 'Click me';

      expect(hasAccessibleName(button)).toBe(true);
    });

    it('should detect element with aria-label', () => {
      const button = document.createElement('button');
      button.setAttribute('aria-label', 'Close');

      expect(hasAccessibleName(button)).toBe(true);
    });

    it('should detect element with aria-labelledby', () => {
      const element = document.createElement('div');
      element.setAttribute('aria-labelledby', 'label-id');

      expect(hasAccessibleName(element)).toBe(true);
    });

    it('should detect input with associated label', () => {
      const input = document.createElement('input');
      input.id = 'test-input';
      container.appendChild(input);

      const label = document.createElement('label');
      label.htmlFor = 'test-input';
      label.textContent = 'Username';
      container.appendChild(label);

      expect(hasAccessibleName(input)).toBe(true);
    });

    it('should detect image with alt text', () => {
      const img = document.createElement('img');
      img.alt = 'Decorative image';

      expect(hasAccessibleName(img)).toBe(true);
    });

    it('should return false for unlabeled element', () => {
      const button = document.createElement('button');

      expect(hasAccessibleName(button)).toBe(false);
    });
  });

  describe('getAccessibleName', () => {
    it('should get name from aria-label', () => {
      const element = document.createElement('button');
      element.setAttribute('aria-label', 'Save changes');

      expect(getAccessibleName(element)).toBe('Save changes');
    });

    it('should get name from visible text', () => {
      const button = document.createElement('button');
      button.textContent = 'Submit';

      expect(getAccessibleName(button)).toBe('Submit');
    });

    it('should get name from aria-labelledby', () => {
      const label = document.createElement('h2');
      label.id = 'heading-id';
      label.textContent = 'Form Title';
      container.appendChild(label);

      const element = document.createElement('form');
      element.setAttribute('aria-labelledby', 'heading-id');
      container.appendChild(element);

      expect(getAccessibleName(element)).toBe('Form Title');
    });

    it('should get name from associated label', () => {
      const input = document.createElement('input');
      input.id = 'email';
      container.appendChild(input);

      const label = document.createElement('label');
      label.htmlFor = 'email';
      label.textContent = 'Email address';
      container.appendChild(label);

      expect(getAccessibleName(input)).toBe('Email address');
    });

    it('should get name from alt text', () => {
      const img = document.createElement('img');
      img.alt = 'Company logo';

      expect(getAccessibleName(img)).toBe('Company logo');
    });

    it('should return empty string when no name found', () => {
      const element = document.createElement('div');

      expect(getAccessibleName(element)).toBe('');
    });
  });

  describe('generateUniqueId', () => {
    it('should generate unique IDs', () => {
      const id1 = generateUniqueId();
      const id2 = generateUniqueId();

      expect(id1).not.toBe(id2);
      expect(id1).toMatch(/^aria-/);
    });

    it('should use custom prefix', () => {
      const id = generateUniqueId('label');

      expect(id).toMatch(/^label-/);
    });
  });

  describe('connectLabelToInput', () => {
    it('should create label and connect to input', () => {
      const input = document.createElement('input');
      const label = connectLabelToInput('Name', input);

      expect(label.htmlFor).toBeTruthy();
      expect(input.id).toBeTruthy();
      expect(label.htmlFor).toBe(input.id);
      expect(label.textContent).toBe('Name');
    });

    it('should preserve existing input ID', () => {
      const input = document.createElement('input');
      input.id = 'existing-id';
      const label = connectLabelToInput('Email', input);

      expect(label.htmlFor).toBe('existing-id');
      expect(input.id).toBe('existing-id');
    });
  });

  describe('makeIconButtonAccessible', () => {
    it('should add aria-label to icon button', () => {
      const button = document.createElement('button');
      button.innerHTML = '<i class="icon-close"></i>';

      makeIconButtonAccessible(button, 'Close');

      expect(button.getAttribute('aria-label')).toBe('Close');
      expect(button.textContent).toBe('');
    });

    it('should ensure button is keyboard accessible', () => {
      const button = document.createElement('button');
      button.innerHTML = '<i class="icon"></i>';

      makeIconButtonAccessible(button, 'Action');

      expect(button.hasAttribute('tabindex')).toBe(true);
    });
  });

  describe('validateAriaLabels', () => {
    it('should validate properly labeled elements', () => {
      container.innerHTML = `
        <button>Click me</button>
        <button aria-label="Submit">→</button>
        <a href="#">Link text</a>
      `;

      const result = validateAriaLabels(container);

      expect(result.valid).toBe(true);
      expect(result.summary.unlabeledElements).toBe(0);
    });

    it('should detect unlabeled buttons', () => {
      container.innerHTML = '<button></button>';

      const result = validateAriaLabels(container);

      expect(result.valid).toBe(false);
      expect(result.issues.length).toBeGreaterThan(0);
    });

    it('should detect unlabeled links', () => {
      container.innerHTML = '<a href="#"></a>';

      const result = validateAriaLabels(container);

      expect(result.valid).toBe(false);
      expect(result.issues.some((issue) => issue.includes('Link'))).toBe(true);
    });

    it('should warn about redundant aria-labels', () => {
      container.innerHTML = `
        <button aria-label="Save">Save</button>
      `;

      const result = validateAriaLabels(container);

      expect(result.warnings.some((warning) => warning.includes('Redundant'))).toBe(true);
    });

    it('should count properly labeled elements', () => {
      container.innerHTML = `
        <button>Button 1</button>
        <button aria-label="Button 2">Icon</button>
        <a href="#">Link</a>
      `;

      const result = validateAriaLabels(container);

      expect(result.summary.properlyLabeledElements).toBe(3);
    });

    it('should calculate issue rate correctly', () => {
      container.innerHTML = `
        <button>OK</button>
        <button></button>
      `;

      const result = validateAriaLabels(container);

      expect(result.summary.issueRate).toBe(50);
    });
  });

  describe('createAccessibleButton', () => {
    it('should create button with text', () => {
      const button = createAccessibleButton('Submit');

      expect(button.textContent).toBe('Submit');
      expect(button instanceof HTMLButtonElement).toBe(true);
    });

    it('should add aria-label if provided', () => {
      const button = createAccessibleButton('Save', 'Save changes');

      expect(button.getAttribute('aria-label')).toBe('Save changes');
    });
  });

  describe('createAccessibleIconButton', () => {
    it('should create icon button with aria-label', () => {
      const button = createAccessibleIconButton('icon-close', 'Close');

      expect(button.getAttribute('aria-label')).toBe('Close');
      expect(button.type).toBe('button');
    });
  });

  describe('createAccessibleFormGroup', () => {
    it('should create form group with label', () => {
      const input = document.createElement('input');
      const { container: formGroup, label } = createAccessibleFormGroup(
        'username',
        'Username',
        input
      );

      expect(label.htmlFor).toBe('username');
      expect(input.id).toBe('username');
      expect(formGroup.contains(label)).toBe(true);
      expect(formGroup.contains(input)).toBe(true);
    });
  });

  describe('ARIA label patterns', () => {
    it('should have close button pattern', () => {
      expect(ARIA_LABEL_PATTERNS.closeButton.ariaLabel).toBe('Close');
    });

    it('should have menu button pattern', () => {
      expect(ARIA_LABEL_PATTERNS.menuButton.ariaLabel).toBe('Menu');
    });

    it('should have loading spinner pattern', () => {
      expect(ARIA_LABEL_PATTERNS.loadingSpinner.ariaLabel).toBe('Loading...');
      expect(ARIA_LABEL_PATTERNS.loadingSpinner.ariaLive).toBe('polite');
    });

    it('should have alert patterns', () => {
      expect(ARIA_LABEL_PATTERNS.alertSuccess.role).toBe('alert');
      expect(ARIA_LABEL_PATTERNS.alertError.ariaLive).toBe('assertive');
    });
  });

  describe('getAriaLabelingRecommendations', () => {
    it('should provide helpful recommendations', () => {
      const recommendations = getAriaLabelingRecommendations();

      expect(Array.isArray(recommendations)).toBe(true);
      expect(recommendations.length).toBeGreaterThan(0);
    });

    it('should include semantic HTML recommendation', () => {
      const recommendations = getAriaLabelingRecommendations();

      expect(recommendations.some((rec) => rec.includes('semantic'))).toBe(true);
    });

    it('should include testing recommendation', () => {
      const recommendations = getAriaLabelingRecommendations();

      expect(recommendations.some((rec) => rec.includes('screen reader'))).toBe(true);
    });
  });

  describe('accessibility compliance', () => {
    it('should support WCAG 2.1 AA labeling requirements', () => {
      container.innerHTML = `
        <form>
          <label for="name">Name:</label>
          <input id="name" type="text" />

          <button type="submit">Submit</button>
        </form>
      `;

      const result = validateAriaLabels(container);

      expect(result.valid).toBe(true);
    });

    it('should validate complex interactive elements', () => {
      container.innerHTML = `
        <div role="tablist">
          <button role="tab" aria-selected="true">Tab 1</button>
          <button role="tab" aria-selected="false">Tab 2</button>
        </div>
      `;

      const result = validateAriaLabels(container);

      expect(result.valid).toBe(true);
    });
  });
});
