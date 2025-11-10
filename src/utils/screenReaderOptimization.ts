/**
 * Screen Reader Optimization Utilities (A-03)
 *
 * Provides comprehensive screen reader support:
 * - Live region announcements for dynamic content
 * - Semantic HTML structure utilities
 * - ARIA attribute management
 * - Screen reader testing helpers
 */

import React from 'react';

/**
 * ARIA live region politeness levels
 */
export const ARIA_LIVE_POLITENESS = {
  POLITE: 'polite', // Wait for pause in speech
  ASSERTIVE: 'assertive', // Interrupt current speech
  OFF: 'off', // No announcement
} as const;

export type AriaLivePoliteness = (typeof ARIA_LIVE_POLITENESS)[keyof typeof ARIA_LIVE_POLITENESS];

/**
 * ARIA roles for semantic markup
 */
export const ARIA_ROLES = {
  MAIN: 'main',
  NAVIGATION: 'navigation',
  COMPLEMENTARY: 'complementary',
  CONTENTINFO: 'contentinfo',
  BANNER: 'banner',
  SEARCH: 'search',
  FORM: 'form',
  ALERT: 'alert',
  STATUS: 'status',
  TABLIST: 'tablist',
  TAB: 'tab',
  TABPANEL: 'tabpanel',
  DIALOG: 'dialog',
  MENUBAR: 'menubar',
  MENU: 'menu',
  MENUITEM: 'menuitem',
  LISTBOX: 'listbox',
  OPTION: 'option',
  COMBOBOX: 'combobox',
  REGION: 'region',
  PROGRESSBAR: 'progressbar',
} as const;

export type AriaRole = (typeof ARIA_ROLES)[keyof typeof ARIA_ROLES];

/**
 * Announcement queue for managing screen reader announcements
 */
class AnnouncementQueue {
  private announcements: Array<{
    message: string;
    politeness: AriaLivePoliteness;
    timeout: number;
  }> = [];

  private container: HTMLElement | null = null;

  constructor() {
    this.initializeContainer();
  }

  private initializeContainer(): void {
    if (typeof document === 'undefined') return;

    // Create live region container if it doesn't exist
    let liveRegion = document.querySelector<HTMLElement>('[role="status"][aria-live="polite"]');
    if (!liveRegion) {
      liveRegion = document.createElement('div');
      liveRegion.setAttribute('role', 'status');
      liveRegion.setAttribute('aria-live', 'polite');
      liveRegion.setAttribute('aria-atomic', 'true');
      liveRegion.style.position = 'absolute';
      liveRegion.style.left = '-10000px';
      liveRegion.style.width = '1px';
      liveRegion.style.height = '1px';
      liveRegion.style.overflow = 'hidden';
      document.body.appendChild(liveRegion);
    }

    this.container = liveRegion;
  }

  /**
   * Add an announcement to the queue
   */
  announce(
    message: string,
    politeness: AriaLivePoliteness = ARIA_LIVE_POLITENESS.POLITE,
    timeout = 1000
  ): void {
    this.announcements.push({ message, politeness, timeout });
    this.process();
  }

  /**
   * Process announcements from the queue
   */
  private process(): void {
    if (!this.container || this.announcements.length === 0) {
      return;
    }

    const { message, politeness, timeout } = this.announcements.shift()!;

    // Update live region politeness
    this.container.setAttribute('aria-live', politeness);

    // Announce message
    this.container.textContent = message;

    // Clear after timeout to allow next announcement
    setTimeout(() => {
      this.container!.textContent = '';

      // Process next announcement if any
      if (this.announcements.length > 0) {
        this.process();
      }
    }, timeout);
  }

  /**
   * Clear all pending announcements
   */
  clear(): void {
    this.announcements = [];
    if (this.container) {
      this.container.textContent = '';
    }
  }
}

// Global announcement queue instance
const announcementQueue = new AnnouncementQueue();

/**
 * Announce a message to screen readers
 */
export function announceToScreenReader(
  message: string,
  politeness: AriaLivePoliteness = ARIA_LIVE_POLITENESS.POLITE,
  timeout = 1000
): void {
  announcementQueue.announce(message, politeness, timeout);
}

/**
 * React hook for screen reader announcements
 */
export function useScreenReaderAnnouncement(
  message: string,
  politeness: AriaLivePoliteness = ARIA_LIVE_POLITENESS.POLITE,
  deps: React.DependencyList = []
) {
  React.useEffect(() => {
    if (message) {
      announceToScreenReader(message, politeness);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- Custom deps array pattern for flexible caller dependencies
  }, [message, politeness, ...deps]);
}

/**
 * Semantic HTML element creators
 */
export function createSemanticElement<T extends keyof HTMLElementTagNameMap>(
  tag: T,
  attributes: Record<string, string> = {},
  content?: string
): HTMLElementTagNameMap[T] {
  const element = document.createElement(tag);

  Object.entries(attributes).forEach(([key, value]) => {
    element.setAttribute(key, value);
  });

  if (content) {
    element.textContent = content;
  }

  return element;
}

/**
 * Label form inputs properly
 */
export function labelFormInput(
  input: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement,
  labelText: string,
  id?: string
): HTMLLabelElement {
  const label = document.createElement('label');

  if (id) {
    label.htmlFor = id;
    input.id = id;
  } else if (!input.id) {
    input.id = `input-${Math.random().toString(36).substr(2, 9)}`;
    label.htmlFor = input.id;
  } else {
    // Use existing ID
    label.htmlFor = input.id;
  }

  label.textContent = labelText;
  return label;
}

/**
 * Add accessible description to element
 */
export function addAccessibleDescription(
  element: HTMLElement,
  description: string
): string {
  const descId = `desc-${Math.random().toString(36).substr(2, 9)}`;
  const descElement = document.createElement('span');

  descElement.id = descId;
  descElement.textContent = description;
  descElement.style.display = 'none';

  element.appendChild(descElement);
  element.setAttribute('aria-describedby', descId);

  return descId;
}

/**
 * Create accessible button with proper semantics
 */
export function createAccessibleButton(
  text: string,
  onClick: (event: MouseEvent) => void,
  ariaLabel?: string
): HTMLButtonElement {
  const button = document.createElement('button');

  button.type = 'button';
  button.textContent = text;
  button.addEventListener('click', onClick);

  if (ariaLabel) {
    button.setAttribute('aria-label', ariaLabel);
  }

  return button;
}

/**
 * Validate screen reader accessibility
 */
export interface ScreenReaderAccessibilityResult {
  valid: boolean;
  issues: string[];
  warnings: string[];
  summary: {
    totalElements: number;
    semanticElements: number;
    ariaElements: number;
    unlabeledInputs: number;
  };
}

export function validateScreenReaderAccessibility(
  container: HTMLElement = document.body
): ScreenReaderAccessibilityResult {
  const issues: string[] = [];
  const warnings: string[] = [];

  // Count elements
  const allElements = container.querySelectorAll('*');
  const semanticElements = container.querySelectorAll(
    'main, nav, header, footer, article, section, aside, h1, h2, h3, h4, h5, h6'
  );
  const ariaElements = container.querySelectorAll('[role], [aria-label], [aria-describedby]');
  const inputs = container.querySelectorAll('input, textarea, select');
  const unlabeledInputs: HTMLElement[] = [];

  // Check for landmarks
  const mainElements = container.querySelectorAll('[role="main"], main');
  if (mainElements.length === 0) {
    warnings.push('No main landmark found - use <main> or role="main"');
  }

  // Check inputs for labels
  inputs.forEach((input) => {
    const inputEl = input as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
    const hasLabel =
      inputEl.hasAttribute('aria-label') ||
      inputEl.hasAttribute('aria-labelledby') ||
      container.querySelector(`label[for="${inputEl.id}"]`);

    if (!hasLabel && inputEl.type !== 'hidden') {
      unlabeledInputs.push(inputEl);
      issues.push(`Input missing accessible label: ${inputEl.type || 'text'}`);
    }
  });

  // Check for images with alt text
  const images = container.querySelectorAll('img');
  images.forEach((img) => {
    if (!img.hasAttribute('alt')) {
      issues.push(`Image missing alt text: ${img.src || '(no src)'}`);
    }
  });

  // Check for links with text
  const links = container.querySelectorAll('a');
  links.forEach((link) => {
    const hasText = link.textContent?.trim() || link.hasAttribute('aria-label');
    if (!hasText) {
      issues.push('Link missing visible or ARIA text');
    }
  });

  // Check for color-only information
  const coloredElements = Array.from(container.querySelectorAll('[style*="color"]'));
  if (coloredElements.length > 0) {
    warnings.push('Found inline color styling - ensure information is not color-only');
  }

  return {
    valid: issues.length === 0,
    issues,
    warnings,
    summary: {
      totalElements: allElements.length,
      semanticElements: semanticElements.length,
      ariaElements: ariaElements.length,
      unlabeledInputs: unlabeledInputs.length,
    },
  };
}

/**
 * Get screen reader user tips
 */
export function getScreenReaderTips(): string[] {
  return [
    'Use semantic HTML (main, nav, header, footer, article, section)',
    'Provide alt text for all meaningful images',
    'Label all form inputs with <label> or aria-label',
    'Use ARIA roles and attributes appropriately',
    'Announce dynamic content changes with live regions',
    'Maintain logical heading hierarchy (h1, h2, h3...)',
    'Use list markup for lists (ul, ol, li)',
    'Provide skip links for keyboard navigation',
    'Use aria-describedby for additional descriptions',
    'Test with actual screen readers (NVDA, JAWS, VoiceOver)',
  ];
}

/**
 * Configure ARIA attributes for common patterns
 */
export const ARIA_PATTERNS = {
  // Alert pattern
  alert: {
    role: 'alert',
    attributes: {
      'aria-live': 'assertive',
      'aria-atomic': 'true',
    },
  },
  // Status message pattern
  status: {
    role: 'status',
    attributes: {
      'aria-live': 'polite',
      'aria-atomic': 'true',
    },
  },
  // Loading pattern
  loading: {
    role: 'progressbar',
    attributes: {
      'aria-label': 'Loading',
      'aria-busy': 'true',
    },
  },
  // Modal pattern
  modal: {
    role: 'dialog',
    attributes: {
      'aria-modal': 'true',
    },
  },
} as const;
