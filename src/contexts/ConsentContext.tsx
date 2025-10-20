import { createContext, useContext, useEffect, useMemo, useState } from 'react';
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

function readDNT(): boolean {
  const dnt = (navigator as any).doNotTrack || (window as any).doNotTrack || (navigator as any).msDoNotTrack;
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

  const openDialog = () => setIsDialogOpen(true);
  const closeDialog = () => setIsDialogOpen(false);

  const setConsent = (next: ConsentState) => {
    setConsentState({ ...next, givenAt: Date.now() });
    closeDialog();
  };

  const value: ConsentContextType = useMemo(() => ({
    consent,
    setConsent,
    isDialogOpen,
    openDialog,
    closeDialog,
    shouldRespectDNT,
  }), [consent, isDialogOpen, shouldRespectDNT]);

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
