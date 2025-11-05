import { createContext, useContext, useState, useCallback } from 'react';
import type { ReactNode } from 'react';

/**
 * Modal Precedence Levels (higher number = higher priority)
 * Controls which modals can be shown together and in what order
 */
export const ModalPrecedence = {
  // Level 1: Background/informational (always available)
  NETWORK_STATUS: 1,

  // Level 2: Settings and preferences (non-blocking)
  SETTINGS: 2,
  KEYBOARD_SHORTCUTS: 2,

  // Level 3: Session-related (important but not critical)
  RESUME_PROMPT: 3,
  PRIVACY_POLICY: 3,
  TERMS_OF_SERVICE: 3,

  // Level 4: Session state (critical during session)
  SESSION_END_LOADING: 4,
  IDLE_TIMEOUT: 4,
  SESSION_SUMMARY: 4,

  // Level 5: Initial flow (blocking, must complete)
  ONBOARDING: 5,
  CONSENT: 5,
} as const;

export interface ModalState {
  showOnboarding: boolean;
  showConsent: boolean;
  showResumePrompt: boolean;
  showIdleTimeout: boolean;
  showSessionSummary: boolean;
  showPrivacyPolicy: boolean;
  showTermsOfService: boolean;
  showSettings: boolean;
  showKeyboardShortcuts: boolean;
  showSessionEndLoading: boolean;
}

interface ModalContextType {
  modals: ModalState;
  openModal: (modalKey: keyof ModalState) => void;
  closeModal: (modalKey: keyof ModalState) => void;
  toggleModal: (modalKey: keyof ModalState) => void;
  closeAllModals: () => void;
  getHighestPriorityModal: () => keyof ModalState | null;
}

const ModalManagerContext = createContext<ModalContextType | undefined>(undefined);

export function ModalManagerProvider({ children }: { children: ReactNode }) {
  const [modals, setModals] = useState<ModalState>({
    showOnboarding: false,
    showConsent: false,
    showResumePrompt: false,
    showIdleTimeout: false,
    showSessionSummary: false,
    showPrivacyPolicy: false,
    showTermsOfService: false,
    showSettings: false,
    showKeyboardShortcuts: false,
    showSessionEndLoading: false,
  });

  const openModal = useCallback((modalKey: keyof ModalState) => {
    setModals((prev) => ({ ...prev, [modalKey]: true }));
  }, []);

  const closeModal = useCallback((modalKey: keyof ModalState) => {
    setModals((prev) => ({ ...prev, [modalKey]: false }));
  }, []);

  const toggleModal = useCallback((modalKey: keyof ModalState) => {
    setModals((prev) => ({ ...prev, [modalKey]: !prev[modalKey] }));
  }, []);

  const closeAllModals = useCallback(() => {
    setModals({
      showOnboarding: false,
      showConsent: false,
      showResumePrompt: false,
      showIdleTimeout: false,
      showSessionSummary: false,
      showPrivacyPolicy: false,
      showTermsOfService: false,
      showSettings: false,
      showKeyboardShortcuts: false,
      showSessionEndLoading: false,
    });
  }, []);

  const getHighestPriorityModal = useCallback((): keyof ModalState | null => {
    const modalPrecedence: Record<keyof ModalState, number> = {
      showOnboarding: ModalPrecedence.ONBOARDING,
      showConsent: ModalPrecedence.CONSENT,
      showResumePrompt: ModalPrecedence.RESUME_PROMPT,
      showIdleTimeout: ModalPrecedence.IDLE_TIMEOUT,
      showSessionSummary: ModalPrecedence.SESSION_SUMMARY,
      showPrivacyPolicy: ModalPrecedence.PRIVACY_POLICY,
      showTermsOfService: ModalPrecedence.TERMS_OF_SERVICE,
      showSettings: ModalPrecedence.SETTINGS,
      showKeyboardShortcuts: ModalPrecedence.KEYBOARD_SHORTCUTS,
      showSessionEndLoading: ModalPrecedence.SESSION_END_LOADING,
    };

    let highest: keyof ModalState | null = null;
    let highestPrecedence = 0;

    for (const [modalKey, isOpen] of Object.entries(modals) as [keyof ModalState, boolean][]) {
      if (isOpen) {
        const precedence = modalPrecedence[modalKey];
        if (precedence > highestPrecedence) {
          highest = modalKey;
          highestPrecedence = precedence;
        }
      }
    }

    return highest;
  }, [modals]);

  const value: ModalContextType = {
    modals,
    openModal,
    closeModal,
    toggleModal,
    closeAllModals,
    getHighestPriorityModal,
  };

  return (
    <ModalManagerContext.Provider value={value}>
      {children}
    </ModalManagerContext.Provider>
  );
}

export function useModalManager() {
  const context = useContext(ModalManagerContext);
  if (!context) {
    throw new Error('useModalManager must be used within ModalManagerProvider');
  }
  return context;
}
