import React from 'react';
import { FocusTrap } from '../../lib/focus/FocusTrap';
import { ModalPrecedence } from '../../contexts/ModalManagerContext';

/**
 * ModalWrapper provides consistent modal behavior:
 * - Focus trap (keeps focus within modal, Tab wraps)
 * - aria-hidden for surrounding content
 * - aria-modal for accessibility
 * - Escape key support (handled by parent)
 * - Precedence styling (visual distinction)
 */

interface ModalWrapperProps {
  isOpen: boolean;
  children: React.ReactNode;
  precedenceLevel?: number;
  onClose?: () => void;
  title?: string;
  className?: string;
}

export function ModalWrapper({
  isOpen,
  children,
  precedenceLevel = 1,
  onClose,
  title,
  className = '',
}: ModalWrapperProps) {
  // Handle Escape key
  React.useEffect(() => {
    if (!isOpen || !onClose) {
      return;
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        // Only close if not a blocking modal (Level 5)
        if (precedenceLevel < ModalPrecedence.ONBOARDING) {
          event.preventDefault();
          onClose();
        }
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose, precedenceLevel]);

  if (!isOpen) {
    return null;
  }

  // Determine background overlay color based on precedence
  const backdropColor = getPrecedenceBackdrop(precedenceLevel);

  return (
    <FocusTrap isActive={isOpen}>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-40 ${backdropColor}`}
        onClick={() => {
          // Allow closing non-blocking modals by clicking backdrop
          if (onClose && precedenceLevel < ModalPrecedence.ONBOARDING) {
            onClose();
          }
        }}
        aria-hidden="true"
      />

      {/* Modal Content */}
      <div className={`fixed inset-0 z-50 flex items-center justify-center pointer-events-none`}>
        <div
          className={`
            bg-white dark:bg-gray-800 rounded-lg shadow-2xl
            pointer-events-auto max-w-md w-full mx-4
            max-h-[90vh] overflow-y-auto
            ${className}
          `}
          role="dialog"
          aria-modal="true"
          aria-labelledby={title ? `modal-title-${title}` : undefined}
        >
          {title && (
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h2
                id={`modal-title-${title}`}
                className="text-lg font-semibold text-gray-900 dark:text-white"
              >
                {title}
              </h2>
            </div>
          )}
          <div className="p-6">
            {children}
          </div>
        </div>
      </div>
    </FocusTrap>
  );
}

/**
 * Get backdrop color based on modal precedence
 */
function getPrecedenceBackdrop(precedenceLevel: number): string {
  // Higher precedence = darker, more opaque backdrop
  switch (precedenceLevel) {
    case ModalPrecedence.NETWORK_STATUS:
      return 'bg-black/10';
    case ModalPrecedence.SETTINGS:
    case ModalPrecedence.KEYBOARD_SHORTCUTS:
      return 'bg-black/20';
    case ModalPrecedence.RESUME_PROMPT:
    case ModalPrecedence.PRIVACY_POLICY:
    case ModalPrecedence.TERMS_OF_SERVICE:
      return 'bg-black/40';
    case ModalPrecedence.SESSION_END_LOADING:
    case ModalPrecedence.IDLE_TIMEOUT:
    case ModalPrecedence.SESSION_SUMMARY:
      return 'bg-black/50';
    case ModalPrecedence.ONBOARDING:
    case ModalPrecedence.CONSENT:
      return 'bg-black/60'; // Most opaque for blocking modals
    default:
      return 'bg-black/20';
  }
}

// Export FocusTrap for direct use if needed
export { FocusTrap } from '../../lib/focus/FocusTrap';
