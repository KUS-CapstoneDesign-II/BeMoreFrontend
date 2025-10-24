import { useEffect, useState } from 'react';
import { useI18n } from '../../contexts/I18nContext';

export default function SettingsPage() {
  const { t } = useI18n();
  const [language, setLanguage] = useState<'ko'|'en'>(() => {
    try { return JSON.parse(localStorage.getItem('bemore_settings_v1')||'{}').language || 'ko'; } catch { return 'ko'; }
  });

  useEffect(() => {
    try {
      const cur = JSON.parse(localStorage.getItem('bemore_settings_v1')||'{}');
      localStorage.setItem('bemore_settings_v1', JSON.stringify({ ...cur, language }));
    } catch {}
  }, [language]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      <div className="max-w-3xl mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold mb-4">{t('settings.title')}</h1>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-soft p-4 space-y-4">
          <div>
            <label className="block text-sm mb-1">{t('settings.language')}</label>
            <select
              aria-label={t('settings.language')}
              className="px-2 py-2 rounded border text-sm bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 border-gray-300 dark:border-gray-600"
              value={language}
              onChange={(e) => setLanguage(e.target.value as 'ko'|'en')}
            >
              <option value="ko">{t('settings.language.ko')}</option>
              <option value="en">{t('settings.language.en')}</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}


