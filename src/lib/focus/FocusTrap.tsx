import { useEffect, useRef } from 'react';

/**
 * Hook to manage focus trap for modals
 * Keeps focus within the modal element and restores focus when closed
 */
export function useFocusTrap(isActive: boolean) {
  const containerRef = useRef<HTMLDivElement>(null);
  const previouslyFocusedElementRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!isActive || !containerRef.current) {
      return;
    }

    // Store previously focused element
    previouslyFocusedElementRef.current = document.activeElement as HTMLElement;

    // Focus first interactive element in modal
    const focusableElements = containerRef.current.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstElement = focusableElements[0] as HTMLElement;
    if (firstElement) {
      firstElement.focus();
    }

    // Handle Tab key to trap focus
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') {
        return;
      }

      const focusableEls = Array.from(
        containerRef.current?.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        ) || []
      ) as HTMLElement[];

      if (focusableEls.length === 0) {
        event.preventDefault();
        return;
      }

      const firstEl = focusableEls[0];
      const lastEl = focusableEls[focusableEls.length - 1];
      const activeEl = document.activeElement as HTMLElement;

      // Shift + Tab on first element → focus last element
      if (event.shiftKey && activeEl === firstEl) {
        event.preventDefault();
        lastEl.focus();
      }
      // Tab on last element → focus first element
      else if (!event.shiftKey && activeEl === lastEl) {
        event.preventDefault();
        firstEl.focus();
      }
    };

    const container = containerRef.current;
    container?.addEventListener('keydown', handleKeyDown);

    return () => {
      container?.removeEventListener('keydown', handleKeyDown);

      // Restore focus to previously focused element
      if (previouslyFocusedElementRef.current?.focus) {
        previouslyFocusedElementRef.current.focus();
      }
    };
  }, [isActive]);

  return containerRef;
}

/**
 * Component to apply focus trap and aria-hidden to surrounding elements
 */
interface FocusTrapProps {
  isActive: boolean;
  children: React.ReactNode;
}

export function FocusTrap({ isActive, children }: FocusTrapProps) {
  const containerRef = useFocusTrap(isActive);

  useEffect(() => {
    if (!isActive) {
      return;
    }

    // Apply aria-hidden to siblings (excluding modal)
    const bodyChildren = Array.from(document.body.children) as HTMLElement[];

    bodyChildren.forEach((child) => {
      if (!containerRef.current?.contains(child)) {
        child.setAttribute('aria-hidden', 'true');
      }
    });

    return () => {
      bodyChildren.forEach((child) => {
        if (!containerRef.current?.contains(child)) {
          child.removeAttribute('aria-hidden');
        }
      });
    };
  }, [isActive]);

  return (
    <div
      ref={containerRef}
      role="dialog"
      aria-modal="true"
    >
      {children}
    </div>
  );
}
