import { createContext, useContext, useMemo } from 'react';
import type { ReactNode } from 'react';
import { useSettings } from './SettingsContext';

type Messages = Record<string, string>;

const ko: Messages = {
  'network.online': '온라인에 연결되었습니다.',
  'network.offline': '오프라인 상태입니다. 일부 기능이 제한될 수 있습니다.',
  'settings.title': '설정',
  'settings.language': '언어',
  'settings.language.ko': '한국어',
  'settings.language.en': 'English',
  'loading': '불러오는 중...'
};

const en: Messages = {
  'network.online': 'You are back online.',
  'network.offline': 'You are offline. Some features may be limited.',
  'settings.title': 'Settings',
  'settings.language': 'Language',
  'settings.language.ko': 'Korean',
  'settings.language.en': 'English',
  'loading': 'Loading...'
};

const catalogs: Record<'ko' | 'en', Messages> = { ko, en };

interface I18nContextType {
  t: (key: string) => string;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export function I18nProvider({ children }: { children: ReactNode }) {
  const { language } = useSettings();

  const value = useMemo<I18nContextType>(() => ({
    t: (key: string) => {
      const msg = catalogs[language]?.[key] ?? catalogs.ko[key] ?? key;
      return msg;
    }
  }), [language]);

  return (
    <I18nContext.Provider value={value}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used within I18nProvider');
  return ctx;
}


