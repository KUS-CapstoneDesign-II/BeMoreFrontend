import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';

export interface ConsentState {
  analytics: boolean;
  crashReporting: boolean;
  givenAt?: number;
}

interface ConsentContextType {
  consent: ConsentState | null;
  setConsent: (next: ConsentState) => void;
  isDialogOpen: boolean;
  openDialog: () => void;
  closeDialog: () => void;
  shouldRespectDNT: boolean;
}

const STORAGE_KEY = 'bemore_consent_v1';

const ConsentContext = createContext<ConsentContextType | undefined>(undefined);

// Extended interface for Do Not Track support across browsers
interface NavigatorWithDNT extends Navigator {
  msDoNotTrack?: string | number | null;
}

interface WindowWithDNT extends Window {
  doNotTrack?: string | null;
}

function readDNT(): boolean {
  const nav = navigator as NavigatorWithDNT;
  const win = window as WindowWithDNT;
  const dnt = nav.doNotTrack || win.doNotTrack || nav.msDoNotTrack;
  return dnt === '1' || dnt === 1;
}

export function ConsentProvider({ children }: { children: ReactNode }) {
  const [consent, setConsentState] = useState<ConsentState | null>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? (JSON.parse(raw) as ConsentState) : null;
    } catch {
      return null;
    }
  });
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const shouldRespectDNT = readDNT();

  useEffect(() => {
    if (consent) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(consent));
      } catch {}
    }
  }, [consent]);

  const openDialog = useCallback(() => setIsDialogOpen(true), []);
  const closeDialog = useCallback(() => setIsDialogOpen(false), []);

  const setConsent = useCallback((next: ConsentState) => {
    setConsentState({ ...next, givenAt: Date.now() });
    closeDialog();
  }, [closeDialog]);

  const value: ConsentContextType = useMemo(() => ({
    consent,
    setConsent,
    isDialogOpen,
    openDialog,
    closeDialog,
    shouldRespectDNT,
  }), [consent, setConsent, isDialogOpen, openDialog, closeDialog, shouldRespectDNT]);

  return (
    <ConsentContext.Provider value={value}>
      {children}
    </ConsentContext.Provider>
  );
}

export function useConsent() {
  const ctx = useContext(ConsentContext);
  if (!ctx) throw new Error('useConsent must be used within ConsentProvider');
  return ctx;
}
