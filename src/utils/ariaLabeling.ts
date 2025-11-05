/**
 * ARIA Labeling Utilities (A-04)
 *
 * Complete ARIA labeling system for accessibility:
 * - Automatic label generation for interactive elements
 * - aria-label, aria-labelledby, aria-describedby management
 * - Validation and compliance checking
 */

/**
 * Set accessible name using aria-label
 */
export function setAriaLabel(element: HTMLElement, label: string): void {
  element.setAttribute('aria-label', label);
}

/**
 * Set accessible name using aria-labelledby
 */
export function setAriaLabelledBy(element: HTMLElement, labelId: string): void {
  element.setAttribute('aria-labelledby', labelId);
}

/**
 * Set accessible description using aria-describedby
 */
export function setAriaDescribedBy(element: HTMLElement, descriptionId: string): void {
  element.setAttribute('aria-describedby', descriptionId);
}

/**
 * Check if element has accessible name
 */
export function hasAccessibleName(element: HTMLElement): boolean {
  // Check for visible text content
  if (element.textContent?.trim()) {
    return true;
  }

  // Check for aria-label
  if (element.hasAttribute('aria-label')) {
    return true;
  }

  // Check for aria-labelledby
  if (element.hasAttribute('aria-labelledby')) {
    return true;
  }

  // Check for label element (for form inputs)
  if (element.id && element.ownerDocument?.querySelector(`label[for="${element.id}"]`)) {
    return true;
  }

  // Check for title attribute
  if (element.hasAttribute('title')) {
    return true;
  }

  // Check for alt attribute (for images)
  if (element instanceof HTMLImageElement && element.hasAttribute('alt')) {
    return true;
  }

  // Check for value attribute (for buttons)
  if ((element instanceof HTMLButtonElement || element instanceof HTMLInputElement) &&
      element.hasAttribute('value')) {
    return true;
  }

  return false;
}

/**
 * Get the accessible name of an element
 */
export function getAccessibleName(element: HTMLElement): string {
  // Priority order for accessible name computation (ARIA)
  const ariaLabel = element.getAttribute('aria-label');
  if (ariaLabel) return ariaLabel;

  // aria-labelledby
  const ariaLabelledBy = element.getAttribute('aria-labelledby');
  if (ariaLabelledBy) {
    const labelElement = element.ownerDocument?.getElementById(ariaLabelledBy);
    if (labelElement) return labelElement.textContent || '';
  }

  // Native label
  if (element.id && element.ownerDocument) {
    const label = element.ownerDocument.querySelector(`label[for="${element.id}"]`);
    if (label) return label.textContent || '';
  }

  // Visible text content
  if (element.textContent?.trim()) {
    return element.textContent.trim();
  }

  // Title attribute
  const title = element.getAttribute('title');
  if (title) return title;

  // Alt attribute
  if (element instanceof HTMLImageElement) {
    const alt = element.getAttribute('alt');
    if (alt) return alt;
  }

  // Value attribute
  if (element instanceof HTMLButtonElement || element instanceof HTMLInputElement) {
    const value = element.getAttribute('value');
    if (value) return value;
  }

  return '';
}

/**
 * Create an accessible button with proper labeling
 */
export function createAccessibleButton(
  text: string,
  ariaLabel?: string
): HTMLButtonElement {
  const button = document.createElement('button');
  button.textContent = text;

  if (ariaLabel) {
    button.setAttribute('aria-label', ariaLabel);
  }

  return button;
}

/**
 * Create an accessible icon button
 */
export function createAccessibleIconButton(
  iconClass: string,
  ariaLabel: string
): HTMLButtonElement {
  const button = document.createElement('button');
  button.innerHTML = `<i class="${iconClass}"></i>`;
  button.setAttribute('aria-label', ariaLabel);
  button.setAttribute('type', 'button');

  return button;
}

/**
 * Create accessible form group with label
 */
export function createAccessibleFormGroup(
  inputId: string,
  labelText: string,
  inputElement: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
): { container: HTMLDivElement; label: HTMLLabelElement; input: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement } {
  const container = document.createElement('div');
  const label = document.createElement('label');

  label.htmlFor = inputId;
  label.textContent = labelText;
  inputElement.id = inputId;

  container.appendChild(label);
  container.appendChild(inputElement);

  return { container, label, input: inputElement };
}

/**
 * ARIA labeling patterns for common components
 */
export const ARIA_LABEL_PATTERNS = {
  // Button patterns
  closeButton: {
    text: '✕',
    ariaLabel: 'Close',
  },
  menuButton: {
    text: '☰',
    ariaLabel: 'Menu',
  },
  searchButton: {
    text: '🔍',
    ariaLabel: 'Search',
  },

  // Form patterns
  requiredField: {
    indicator: '*',
    ariaLabel: 'required',
  },

  // Loading patterns
  loadingSpinner: {
    ariaLabel: 'Loading...',
    ariaLive: 'polite',
    ariaAtomic: 'true',
  },

  // Alert patterns
  alertSuccess: {
    role: 'alert',
    ariaLive: 'polite',
  },
  alertError: {
    role: 'alert',
    ariaLive: 'assertive',
  },
} as const;

/**
 * Validate ARIA labels in a container
 */
export interface AriaLabelValidationResult {
  valid: boolean;
  issues: string[];
  warnings: string[];
  summary: {
    totalElements: number;
    unlabeledElements: number;
    properlyLabeledElements: number;
    issueRate: number;
  };
}

export function validateAriaLabels(
  container: HTMLElement = document.body
): AriaLabelValidationResult {
  const issues: string[] = [];
  const warnings: string[] = [];
  const interactiveSelectors = [
    'button',
    'a',
    'input:not([type="hidden"])',
    'textarea',
    'select',
    '[role="button"]',
    '[role="tab"]',
    '[role="menuitem"]',
    '[role="link"]',
  ].join(', ');

  const interactiveElements = container.querySelectorAll<HTMLElement>(interactiveSelectors);
  let unlabeledElements = 0;
  let properlyLabeledElements = 0;

  interactiveElements.forEach((element) => {
    if (hasAccessibleName(element)) {
      properlyLabeledElements++;
    } else {
      unlabeledElements++;

      // Determine element type for specific feedback
      if (element instanceof HTMLButtonElement) {
        issues.push(`Button missing accessible label at line ${getElementPosition(element)}`);
      } else if (element instanceof HTMLAnchorElement) {
        issues.push(`Link missing accessible label at line ${getElementPosition(element)}`);
      } else if (
        element instanceof HTMLInputElement ||
        element instanceof HTMLTextAreaElement ||
        element instanceof HTMLSelectElement
      ) {
        issues.push(
          `Form input (${element.tagName}) missing accessible label at line ${getElementPosition(element)}`
        );
      } else {
        issues.push(`Interactive element missing accessible label at line ${getElementPosition(element)}`);
      }
    }
  });

  // Check for redundant aria-labels
  const ariaLabeledElements = container.querySelectorAll('[aria-label]');
  ariaLabeledElements.forEach((element) => {
    const ariaLabel = element.getAttribute('aria-label');
    const visibleText = element.textContent?.trim();

    if (visibleText && ariaLabel === visibleText) {
      warnings.push(`Redundant aria-label matches visible text: "${ariaLabel}"`);
    }
  });

  // Check for orphaned aria-labelledby references
  const labelledByElements = container.querySelectorAll('[aria-labelledby]');
  labelledByElements.forEach((element) => {
    const labelledBy = element.getAttribute('aria-labelledby');
    if (labelledBy) {
      const labelElement = container.ownerDocument?.getElementById(labelledBy);
      if (!labelElement) {
        issues.push(`aria-labelledby references non-existent element: "${labelledBy}"`);
      }
    }
  });

  const totalElements = interactiveElements.length;
  const issueRate = totalElements > 0 ? (unlabeledElements / totalElements) * 100 : 0;

  return {
    valid: issues.length === 0,
    issues,
    warnings,
    summary: {
      totalElements,
      unlabeledElements,
      properlyLabeledElements,
      issueRate: Math.round(issueRate),
    },
  };
}

/**
 * Helper function to get approximate element position
 */
function getElementPosition(element: HTMLElement): string {
  // This is a simplified approximation
  return element.id || 'unknown';
}

/**
 * List of elements that require accessible names
 */
export const ELEMENTS_REQUIRING_LABELS = [
  'button',
  'a',
  'input',
  'textarea',
  'select',
  'img',
  '[role="button"]',
  '[role="tab"]',
  '[role="menuitem"]',
  '[role="link"]',
  '[role="checkbox"]',
  '[role="radio"]',
  '[role="switch"]',
] as const;

/**
 * Generate unique ID for labeling
 */
export function generateUniqueId(prefix = 'aria'): string {
  return `${prefix}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Connect label to input programmatically
 */
export function connectLabelToInput(
  labelText: string,
  input: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
): HTMLLabelElement {
  const label = document.createElement('label');

  if (!input.id) {
    input.id = generateUniqueId('input');
  }

  label.htmlFor = input.id;
  label.textContent = labelText;

  return label;
}

/**
 * Make icon-only button accessible
 */
export function makeIconButtonAccessible(
  button: HTMLButtonElement,
  label: string
): void {
  // Remove any text content
  button.textContent = '';

  // Set aria-label
  button.setAttribute('aria-label', label);

  // Ensure it's keyboard accessible
  if (!button.hasAttribute('tabindex')) {
    button.setAttribute('tabindex', '0');
  }
}

/**
 * Get ARIA labeling recommendations
 */
export function getAriaLabelingRecommendations(): string[] {
  return [
    'Prefer visible text labels over aria-label',
    'Use aria-labelledby to reference existing labels',
    'Use aria-label for icon buttons without text',
    'Ensure all form inputs have associated labels',
    'Use aria-describedby for additional descriptions',
    'Keep aria-labels concise and descriptive',
    'Avoid redundant aria-labels that match visible text',
    'Use semantic HTML (label for, fieldset, legend)',
    'Test labels with screen reader software',
    'Validate aria-labelledby references exist',
  ];
}
