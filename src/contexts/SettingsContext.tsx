import { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';
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

/**
 * 인증 토큰 확인 헬퍼
 * @returns 토큰이 있으면 true, 없으면 false
 */
function isAuthenticated(): boolean {
  const token = localStorage.getItem('bemore_access_token');
  return !!token;
}

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
   * 로그인한 사용자만 API 호출, 비로그인은 로컬 스토리지만 사용
   */
  const loadRemotePreferences = async () => {
    // 비로그인 사용자는 API 호출하지 않음
    if (!isAuthenticated()) {
      console.debug('[Preferences] Loading from localStorage (no auth)');
      setApiStatus('idle');
      return;
    }

    // 로그인 사용자는 백엔드에서 로드 시도
    setApiStatus('loading');
    setApiError(null);

    try {
      console.debug('[Preferences] Loading from backend (authenticated)');
      const remote = await userAPI.getPreferences();
      if (remote && typeof remote === 'object') {
        setSettings((s) => ({ ...s, ...remote }));
        setApiStatus('success');
        console.debug('[Preferences] Backend load successful');
      }
    } catch (error) {
      // API 에러 시 로컬 스토리지 사용 (이미 초기화되어 있음)
      const errorMessage = error instanceof Error ? error.message : '설정 로드 실패';
      setApiError(errorMessage);
      setApiStatus('error');
      console.debug('[Preferences] Backend load failed, using local fallback', error);
    }
  };

  /**
   * 수동 재시도 함수 (UI에서 호출)
   */
  const retryApiSync = useCallback(async () => {
    await loadRemotePreferences();
  }, []);

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

  const setFontScale = useCallback((scale: FontScale) => setSettings((s) => ({ ...s, fontScale: scale })), []);
  const setLayoutDensity = useCallback((density: LayoutDensity) => setSettings((s) => ({ ...s, layoutDensity: density })), []);
  const setLanguage = useCallback((lang: LanguageCode) => setSettings((s) => ({ ...s, language: lang })), []);
  const setNotificationsOptIn = useCallback((optIn: boolean) => setSettings((s) => ({ ...s, notificationsOptIn: optIn })), []);

  // Sync to backend when settings change (debounced-like simple)
  // 로그인한 사용자만 백엔드에 동기화
  useEffect(() => {
    const id = window.setTimeout(() => {
      // 비로그인 사용자는 로컬 스토리지만 사용 (이미 위 useEffect에서 저장됨)
      if (!isAuthenticated()) {
        console.debug('[Preferences] Skip backend sync (no auth)');
        return;
      }

      // 로그인 사용자는 백엔드에 동기화
      console.debug('[Preferences] Syncing to backend');
      userAPI.setPreferences(settings).then(() => {
        console.debug('[Preferences] Backend sync successful');
      }).catch((error) => {
        // Silently fail - local storage is sufficient fallback
        console.debug('[Preferences] Backend sync failed (local saved)', error);
      });
    }, 300);
    return () => window.clearTimeout(id);
  }, [settings]);

  const requestNotificationPermission = useCallback(async (): Promise<NotificationPermission> => {
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
  }, [setNotificationsOptIn]);

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
  }), [settings, apiStatus, apiError, setFontScale, setLayoutDensity, setLanguage, setNotificationsOptIn, requestNotificationPermission, retryApiSync]);

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
