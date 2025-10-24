import { useEffect, useState } from 'react';
import { useI18n } from '../../contexts/I18nContext';

export function NetworkStatusBanner() {
  const [online, setOnline] = useState<boolean>(navigator.onLine);
  const [visible, setVisible] = useState<boolean>(!navigator.onLine);

  useEffect(() => {
    const onOnline = () => {
      setOnline(true);
      setVisible(true);
      // Hide after brief success message
      const t = window.setTimeout(() => setVisible(false), 2000);
      return () => window.clearTimeout(t);
    };
    const onOffline = () => {
      setOnline(false);
      setVisible(true);
    };
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, []);

  if (!visible) return null;
  const { t } = useI18n();

  return (
    <div className={`w-full sticky top-0 z-20`}>
      <div className={
        `flex items-center justify-center gap-3 px-3 text-center text-xs sm:text-sm py-2 ` +
        (online ? 'bg-green-50 text-green-800 border-b border-green-200 dark:bg-green-900/20 dark:text-green-200 dark:border-green-800'
                : 'bg-amber-50 text-amber-800 border-b border-amber-200 dark:bg-amber-900/20 dark:text-amber-200 dark:border-amber-800')
      }>
        <span>{online ? t('network.online') : t('network.offline')}</span>
        {!online && (
          <button
            className="px-2 py-1 rounded border text-xs bg-white/70 dark:bg-gray-700 text-amber-800 dark:text-amber-200 border-amber-300 dark:border-amber-700 hover:bg-white/90 dark:hover:bg-gray-600"
            onClick={async () => {
              try {
                // 간단한 핑 요청으로 네트워크 복구 시도
                await fetch('/', { cache: 'no-store', mode: 'no-cors' });
              } catch {}
              // 브라우저의 online 이벤트를 기다리지 않고 UI를 시도 갱신
              setOnline(navigator.onLine);
            }}
          >재시도</button>
        )}
      </div>
    </div>
  );
}
