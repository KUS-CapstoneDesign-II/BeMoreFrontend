import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';

export interface AccessibilityState {
  highContrast: boolean;
  reducedMotion: boolean;
}

interface AccessibilityContextType extends AccessibilityState {
  setHighContrast: (v: boolean) => void;
  setReducedMotion: (v: boolean) => void;
}

const STORAGE_KEY = 'bemore_a11y_v1';

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined);

export function AccessibilityProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AccessibilityState>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? (JSON.parse(raw) as AccessibilityState) : { highContrast: false, reducedMotion: false };
    } catch {
      return { highContrast: false, reducedMotion: false };
    }
  });

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch {}
    const root = document.documentElement;
    root.toggleAttribute('data-contrast', state.highContrast);
    root.setAttribute('data-contrast', state.highContrast ? 'high' : 'normal');
    root.setAttribute('data-motion', state.reducedMotion ? 'reduced' : 'normal');
  }, [state]);

  const setHighContrast = (v: boolean) => setState((s) => ({ ...s, highContrast: v }));
  const setReducedMotion = (v: boolean) => setState((s) => ({ ...s, reducedMotion: v }));

  const value = useMemo(() => ({ ...state, setHighContrast, setReducedMotion }), [state]);

  return (
    <AccessibilityContext.Provider value={value}>
      {children}
    </AccessibilityContext.Provider>
  );
}

export function useAccessibility() {
  const ctx = useContext(AccessibilityContext);
  if (!ctx) throw new Error('useAccessibility must be used within AccessibilityProvider');
  return ctx;
}
