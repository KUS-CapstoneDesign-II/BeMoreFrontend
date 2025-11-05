import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { z } from 'zod';
import { userAPI } from '../services/api';
import type { ReactNode } from 'react';

export type FontScale = 'sm' | 'md' | 'lg' | 'xl';
export type LayoutDensity = 'compact' | 'spacious';
export type LanguageCode = 'ko' | 'en';
export type APIStatus = 'idle' | 'loading' | 'error' | 'success';

export interface SettingsState {
  fontScale: FontScale;
  layoutDensity: LayoutDensity;
  language: LanguageCode;
  notificationsOptIn: boolean;
}

interface SettingsContextType extends SettingsState {
  // 설정 업데이트 함수
  setFontScale: (scale: FontScale) => void;
  setLayoutDensity: (density: LayoutDensity) => void;
  setLanguage: (lang: LanguageCode) => void;
  setNotificationsOptIn: (optIn: boolean) => void;
  requestNotificationPermission: () => Promise<NotificationPermission>;

  // API 상태 추적
  apiStatus: APIStatus;
  apiError: string | null;
  retryApiSync: () => Promise<void>;
}

const DEFAULT_SETTINGS: SettingsState = {
  fontScale: 'md',
  layoutDensity: 'spacious',
  language: 'ko',
  notificationsOptIn: false,
};

const STORAGE_KEY = 'bemore_settings_v1';

const SettingsSchema = z.object({
  fontScale: z.enum(['sm','md','lg','xl']).default('md'),
  layoutDensity: z.enum(['compact','spacious']).default('spacious'),
  language: z.enum(['ko','en']).default('ko'),
  notificationsOptIn: z.boolean().default(false),
});

const FONT_SCALE_VALUE: Record<FontScale, number> = {
  sm: 0.875,
  md: 1,
  lg: 1.125,
  xl: 1.25,
};

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<SettingsState>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = SettingsSchema.safeParse(JSON.parse(raw));
        if (parsed.success) return { ...DEFAULT_SETTINGS, ...parsed.data } as SettingsState;
      }
    } catch {
      // ignore parse errors
    }
    return DEFAULT_SETTINGS;
  });

  // API 상태 추적 (원격 설정 동기화)
  const [apiStatus, setApiStatus] = useState<APIStatus>('idle');
  const [apiError, setApiError] = useState<string | null>(null);

  // Persist to storage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch {
      // ignore storage errors
    }
  }, [settings]);

  /**
   * 원격 설정 로드 및 동기화
   */
  const loadRemotePreferences = async () => {
    setApiStatus('loading');
    setApiError(null);

    try {
      const remote = await userAPI.getPreferences();
      if (remote && typeof remote === 'object') {
        setSettings((s) => ({ ...s, ...remote }));
        setApiStatus('success');
      }
    } catch (error) {
      // API 에러 상태 추적
      const errorMessage = error instanceof Error ? error.message : '설정 로드 실패';
      setApiError(errorMessage);
      setApiStatus('error');
      console.debug('Failed to load remote preferences, using local defaults', error);
    }
  };

  /**
   * 수동 재시도 함수 (UI에서 호출)
   */
  const retryApiSync = async () => {
    await loadRemotePreferences();
  };

  // Load backend preferences on mount (merge into local)
  useEffect(() => {
    loadRemotePreferences();
  }, []);

  // Apply font scale to root for rem-based scaling
  useEffect(() => {
    const root = document.documentElement;
    const value = FONT_SCALE_VALUE[settings.fontScale] || 1;
    root.style.setProperty('--font-scale', String(value));
    // Density and language attributes for global CSS hooks
    root.setAttribute('data-density', settings.layoutDensity === 'compact' ? 'compact' : 'spacious');
    root.setAttribute('lang', settings.language);
  }, [settings.fontScale, settings.layoutDensity, settings.language]);

  const setFontScale = (scale: FontScale) => setSettings((s) => ({ ...s, fontScale: scale }));
  const setLayoutDensity = (density: LayoutDensity) => setSettings((s) => ({ ...s, layoutDensity: density }));
  const setLanguage = (lang: LanguageCode) => setSettings((s) => ({ ...s, language: lang }));
  const setNotificationsOptIn = (optIn: boolean) => setSettings((s) => ({ ...s, notificationsOptIn: optIn }));

  // Sync to backend when settings change (debounced-like simple)
  useEffect(() => {
    const id = window.setTimeout(() => {
      userAPI.setPreferences(settings).catch((error) => {
        // Silently fail - local storage is sufficient fallback
        console.debug('Failed to sync preferences to backend', error);
      });
    }, 300);
    return () => window.clearTimeout(id);
  }, [settings]);

  const requestNotificationPermission = async (): Promise<NotificationPermission> => {
    if (!('Notification' in window)) {
      return 'denied';
    }
    try {
      const permission = await Notification.requestPermission();
      setNotificationsOptIn(permission === 'granted');
      return permission;
    } catch {
      setNotificationsOptIn(false);
      return 'denied';
    }
  };

  const value: SettingsContextType = useMemo(() => ({
    ...settings,
    setFontScale,
    setLayoutDensity,
    setLanguage,
    setNotificationsOptIn,
    requestNotificationPermission,
    // API 상태 추적
    apiStatus,
    apiError,
    retryApiSync,
  }), [settings, requestNotificationPermission, apiStatus, apiError]);

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings must be used within SettingsProvider');
  return ctx;
}
