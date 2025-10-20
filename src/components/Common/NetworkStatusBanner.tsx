import { useEffect, useState } from 'react';

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

  return (
    <div className={`w-full sticky top-0 z-20`}>
      <div className={
        `text-center text-xs sm:text-sm py-2 ` +
        (online ? 'bg-green-50 text-green-800 border-b border-green-200 dark:bg-green-900/20 dark:text-green-200 dark:border-green-800'
                : 'bg-amber-50 text-amber-800 border-b border-amber-200 dark:bg-amber-900/20 dark:text-amber-200 dark:border-amber-800')
      }>
        {online ? '온라인에 연결되었습니다.' : '오프라인 상태입니다. 일부 기능이 제한될 수 있습니다.'}
      </div>
    </div>
  );
}
