/**
 * Keyboard Navigation Utilities (A-02)
 *
 * Provides comprehensive keyboard navigation support:
 * - Tab order optimization
 * - Focus management
 * - Keyboard shortcut handling
 * - Accessibility keyboard patterns
 */

import React from 'react';

/**
 * Keyboard event codes and key names
 */
export const KEYBOARD_KEYS = {
  ENTER: 'Enter',
  SPACE: ' ',
  ESCAPE: 'Escape',
  TAB: 'Tab',
  ARROW_UP: 'ArrowUp',
  ARROW_DOWN: 'ArrowDown',
  ARROW_LEFT: 'ArrowLeft',
  ARROW_RIGHT: 'ArrowRight',
  HOME: 'Home',
  END: 'End',
  PAGE_UP: 'PageUp',
  PAGE_DOWN: 'PageDown',
} as const;

export type KeyboardKey = (typeof KEYBOARD_KEYS)[keyof typeof KEYBOARD_KEYS];

/**
 * Get all focusable elements within a container
 */
export function getFocusableElements(
  container: HTMLElement | Document = document
): HTMLElement[] {
  const focusableSelector = [
    'a[href]',
    'button:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
    'audio[controls]',
    'video[controls]',
  ].join(', ');

  return Array.from(
    container.querySelectorAll<HTMLElement>(focusableSelector)
  ).filter((el) => {
    // Exclude elements that are hidden or disabled
    const style = window.getComputedStyle(el);
    return style.display !== 'none' && style.visibility !== 'hidden';
  });
}

/**
 * Get the first focusable element
 */
export function getFirstFocusable(container?: HTMLElement): HTMLElement | null {
  const focusableElements = getFocusableElements(container);
  return focusableElements[0] || null;
}

/**
 * Get the last focusable element
 */
export function getLastFocusable(container?: HTMLElement): HTMLElement | null {
  const focusableElements = getFocusableElements(container);
  return focusableElements[focusableElements.length - 1] || null;
}

/**
 * Focus an element with proper scroll behavior
 */
export function focusElement(element: HTMLElement | null, smooth = true): void {
  if (!element) return;

  element.focus({ preventScroll: !smooth });

  if (smooth && element.scrollIntoView) {
    element.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
}

/**
 * Manage focus within a container (like modals)
 */
export interface FocusContainerOptions {
  container: HTMLElement | null;
  isActive: boolean;
  returnFocus?: boolean;
}

export function useFocusContainer({
  container,
  isActive,
  returnFocus = true,
}: FocusContainerOptions) {
  const previouslyFocusedElementRef = React.useRef<HTMLElement | null>(null);

  React.useEffect(() => {
    if (!isActive || !container) {
      return;
    }

    // Store previously focused element
    previouslyFocusedElementRef.current = document.activeElement as HTMLElement;

    // Focus first focusable element in container
    const firstFocusable = getFirstFocusable(container);
    if (firstFocusable) {
      focusElement(firstFocusable);
    }

    // Return focus on unmount
    return () => {
      if (returnFocus && previouslyFocusedElementRef.current) {
        focusElement(previouslyFocusedElementRef.current);
      }
    };
  }, [isActive, container, returnFocus]);
}

/**
 * Handle keyboard navigation within a list (arrows, Home, End keys)
 */
export interface KeyboardListOptions {
  items: HTMLElement[];
  currentIndex: number;
  loop?: boolean;
  vertical?: boolean;
}

export function getNextItemIndex(
  event: React.KeyboardEvent,
  { items, currentIndex, loop = true, vertical = true }: KeyboardListOptions
): number | null {
  const isDown = vertical
    ? event.key === KEYBOARD_KEYS.ARROW_DOWN
    : event.key === KEYBOARD_KEYS.ARROW_RIGHT;
  const isUp = vertical
    ? event.key === KEYBOARD_KEYS.ARROW_UP
    : event.key === KEYBOARD_KEYS.ARROW_LEFT;
  const isHome = event.key === KEYBOARD_KEYS.HOME;
  const isEnd = event.key === KEYBOARD_KEYS.END;

  if (!isDown && !isUp && !isHome && !isEnd) {
    return null;
  }

  event.preventDefault();

  if (isHome) return 0;
  if (isEnd) return items.length - 1;

  const nextIndex = isDown ? currentIndex + 1 : currentIndex - 1;

  if (nextIndex < 0) {
    return loop ? items.length - 1 : currentIndex;
  }
  if (nextIndex >= items.length) {
    return loop ? 0 : currentIndex;
  }

  return nextIndex;
}

/**
 * Tab order context configuration
 */
export interface TabOrderConfig {
  groupName: string;
  order: number;
  description?: string;
}

/**
 * Create optimized tab order for a container
 */
export function optimizeTabOrder(container: HTMLElement, groups: TabOrderConfig[]): void {
  const groupMap = new Map(groups.map((g) => [g.groupName, g.order]));
  const focusableElements = getFocusableElements(container);

  focusableElements.forEach((el) => {
    const groupName = el.getAttribute('data-tab-group');
    const order = groupName ? groupMap.get(groupName) : undefined;

    if (order !== undefined) {
      el.setAttribute('tabindex', order.toString());
    }
  });
}

/**
 * Keyboard shortcut handler
 */
export interface KeyboardShortcut {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  meta?: boolean;
  handler: (event: KeyboardEvent) => void;
  description: string;
}

/**
 * Register keyboard shortcuts
 */
export function useKeyboardShortcuts(shortcuts: KeyboardShortcut[]) {
  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      shortcuts.forEach((shortcut) => {
        const keyMatches = event.key === shortcut.key;
        const ctrlMatches = (event.ctrlKey || event.metaKey) === (shortcut.ctrl || shortcut.meta);
        const shiftMatches = event.shiftKey === (shortcut.shift || false);
        const altMatches = event.altKey === (shortcut.alt || false);

        if (keyMatches && ctrlMatches && shiftMatches && altMatches) {
          shortcut.handler(event);
        }
      });
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [shortcuts]);
}

/**
 * Skip link functionality for accessibility
 */
export function useSkipLink() {
  const handleSkipLink = (event: React.KeyboardEvent) => {
    if (event.key === KEYBOARD_KEYS.ENTER && (event.ctrlKey || event.metaKey)) {
      const mainElement = document.querySelector('main');
      const headingElement = mainElement?.querySelector('h1');
      const focusElement = headingElement || mainElement;

      if (focusElement instanceof HTMLElement) {
        focusElement.tabIndex = -1;
        focusElement.focus();
      }
    }
  };

  return { handleSkipLink };
}

/**
 * Tab order validation
 */
export function validateTabOrder(container: HTMLElement): {
  valid: boolean;
  issues: string[];
  focusableCount: number;
} {
  const focusableElements = getFocusableElements(container);
  const issues: string[] = [];

  focusableElements.forEach((el, index) => {
    const tabindex = el.getAttribute('tabindex');

    // Check for positive tabindex (generally not recommended)
    if (tabindex && parseInt(tabindex, 10) > 0) {
      issues.push(
        `Element at index ${index} has positive tabindex value (${tabindex}) - use 0 or -1 instead`
      );
    }

    // Check for hidden focusable elements
    const style = window.getComputedStyle(el);
    if (style.display === 'none' || style.visibility === 'hidden') {
      issues.push(`Element at index ${index} is hidden but focusable`);
    }

    // Check for missing labels on form inputs
    if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT') {
      const hasAriaLabel = el.hasAttribute('aria-label');
      const hasAriaLabelledBy = el.hasAttribute('aria-labelledby');
      const hasLabel = container.querySelector(`label[for="${el.id}"]`);

      if (!hasAriaLabel && !hasAriaLabelledBy && !hasLabel) {
        issues.push(`Form input at index ${index} lacks accessible label`);
      }
    }
  });

  return {
    valid: issues.length === 0,
    issues,
    focusableCount: focusableElements.length,
  };
}

/**
 * Get keyboard navigation help text
 */
export function getKeyboardHelpText(): Record<string, string> {
  return {
    'Tab / Shift+Tab': 'Navigate between interactive elements',
    'Enter / Space': 'Activate buttons and links',
    'Arrow Keys': 'Navigate within lists and menus',
    Home: 'Jump to first item in list',
    End: 'Jump to last item in list',
    Escape: 'Close dialogs and menus',
    'Alt+Shift+?': 'Show keyboard shortcuts help',
  };
}
