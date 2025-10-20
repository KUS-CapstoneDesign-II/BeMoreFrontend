import { useEffect, useRef } from 'react';
import { useSettings } from '../../contexts/SettingsContext';
import { subscribeToPush, unsubscribeFromPush } from '../../utils/push';
import { useAccessibility } from '../../contexts/AccessibilityContext';

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SettingsPanel({ isOpen, onClose }: SettingsPanelProps) {
  const {
    fontScale,
    layoutDensity,
    language,
    notificationsOptIn,
    setFontScale,
    setLayoutDensity,
    setLanguage,
    setNotificationsOptIn,
    requestNotificationPermission,
  } = useSettings();

  const panelRef = useRef<HTMLDivElement>(null);
  const { highContrast, reducedMotion, setHighContrast, setReducedMotion } = useAccessibility();

  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label="설정">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div ref={panelRef} className="absolute right-0 top-0 bottom-0 w-full sm:w-[420px] bg-white dark:bg-gray-900 shadow-xl p-4 sm:p-6 overflow-y-auto focus:outline-none">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">설정</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300" aria-label="닫기">✕</button>
        </div>

        <div className="mt-4 space-y-6">
          <section>
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">글꼴 크기</h3>
            <div className="mt-2 grid grid-cols-4 gap-2">
              {(['sm','md','lg','xl'] as const).map((s) => (
                <button
                  key={s}
                  className={`px-3 py-2 rounded border text-sm ${fontScale===s? 'bg-primary-500 text-white border-primary-500':'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border-gray-300 dark:border-gray-700'}`}
                  onClick={() => setFontScale(s)}
                  aria-pressed={fontScale===s}
                >{s.toUpperCase()}</button>
              ))}
            </div>
          </section>

          <section>
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">레이아웃 밀도</h3>
            <div className="mt-2 flex gap-2">
              {(['compact','spacious'] as const).map((d) => (
                <button
                  key={d}
                  className={`px-3 py-2 rounded border text-sm ${layoutDensity===d? 'bg-primary-500 text-white border-primary-500':'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border-gray-300 dark:border-gray-700'}`}
                  onClick={() => setLayoutDensity(d)}
                  aria-pressed={layoutDensity===d}
                >{d === 'compact' ? '컴팩트' : '넓게'}</button>
              ))}
            </div>
          </section>

          <section>
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">언어</h3>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {(['ko','en'] as const).map((lng) => (
                <button
                  key={lng}
                  className={`px-3 py-2 rounded border text-sm ${language===lng? 'bg-primary-500 text-white border-primary-500':'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border-gray-300 dark:border-gray-700'}`}
                  onClick={() => setLanguage(lng)}
                  aria-pressed={language===lng}
                >{lng === 'ko' ? '한국어' : 'English'}</button>
              ))}
            </div>
          </section>

          <section>
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">알림</h3>
            <div className="mt-2 flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-300">브라우저 알림 허용</span>
              <button
                className={`px-3 py-2 rounded border text-sm ${notificationsOptIn? 'bg-green-600 text-white border-green-600':'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border-gray-300 dark:border-gray-700'}`}
                onClick={async () => {
                  const perm = await requestNotificationPermission();
                  if (perm === 'granted') {
                    const sub = await subscribeToPush();
                    if (!sub) {
                      setNotificationsOptIn(false);
                    }
                  } else {
                    await unsubscribeFromPush();
                    setNotificationsOptIn(false);
                  }
                }}
                aria-pressed={notificationsOptIn}
              >{notificationsOptIn ? '허용됨' : '요청'}</button>
            </div>
          </section>

          <section>
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">접근성</h3>
            <div className="mt-2 space-y-2">
              <label className="flex items-center justify-between gap-4">
                <span className="text-sm text-gray-700 dark:text-gray-300">고대비 모드</span>
                <input type="checkbox" checked={highContrast} onChange={(e) => setHighContrast(e.target.checked)} />
              </label>
              <label className="flex items-center justify-between gap-4">
                <span className="text-sm text-gray-700 dark:text-gray-300">감소된 모션</span>
                <input type="checkbox" checked={reducedMotion} onChange={(e) => setReducedMotion(e.target.checked)} />
              </label>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
