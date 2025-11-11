import { useEffect, useRef } from 'react';
import { useSettings } from '../../contexts/SettingsContext';
import { subscribeToPush, unsubscribeFromPush } from '../../utils/push';
import { useAccessibility } from '../../contexts/AccessibilityContext';
import { useToast } from '../../contexts/ToastContext';

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
  const { addToast } = useToast();

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

        {/* 설정 항목 (Hick의 법칙: 아코디언으로 정보 계층화) */}
        <div className="mt-4 space-y-3">
          <details className="group rounded-lg border border-gray-200 dark:border-gray-700" open>
            <summary className="flex items-center justify-between cursor-pointer px-4 py-3 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors rounded-lg list-none">
              <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">🎨 외관 설정</h3>
              <span className="text-gray-500 dark:text-gray-400 group-open:rotate-180 transition-transform">▼</span>
            </summary>
            <div className="px-4 py-3 space-y-4">
              {/* 글꼴 크기 */}
              <div>
                <h4 className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">글꼴 크기</h4>
                <div className="grid grid-cols-4 gap-2">
              {(['sm','md','lg','xl'] as const).map((s) => (
                <button
                  key={s}
                  className={`px-3 py-2 rounded border text-sm ${fontScale===s? 'bg-primary-500 text-white border-primary-500':'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border-gray-300 dark:border-gray-700'}`}
                  onClick={() => { setFontScale(s); addToast('글꼴 크기를 적용했습니다', 'success', 2200); }}
                  aria-pressed={fontScale===s}
                >{s.toUpperCase()}</button>
              ))}
                </div>
              </div>

              {/* 레이아웃 밀도 */}
              <div>
                <h4 className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">레이아웃 밀도</h4>
                <div className="flex gap-2">
                  {(['compact','spacious'] as const).map((d) => (
                    <button
                      key={d}
                      className={`px-3 py-2 rounded border text-sm ${layoutDensity===d? 'bg-primary-500 text-white border-primary-500':'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border-gray-300 dark:border-gray-700'}`}
                      onClick={() => { setLayoutDensity(d); addToast('레이아웃 밀도를 적용했습니다', 'success', 2200); }}
                      aria-pressed={layoutDensity===d}
                    >{d === 'compact' ? '컴팩트' : '넓게'}</button>
                  ))}
                </div>
              </div>
            </div>
          </details>

          <details className="group rounded-lg border border-gray-200 dark:border-gray-700" open>
            <summary className="flex items-center justify-between cursor-pointer px-4 py-3 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors rounded-lg list-none">
              <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">🌐 언어 및 지역</h3>
              <span className="text-gray-500 dark:text-gray-400 group-open:rotate-180 transition-transform">▼</span>
            </summary>
            <div className="px-4 py-3">
              <h4 className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">언어</h4>
              <div className="grid grid-cols-2 gap-2">
              {(['ko','en'] as const).map((lng) => (
                <button
                  key={lng}
                  className={`px-3 py-2 rounded border text-sm ${language===lng? 'bg-primary-500 text-white border-primary-500':'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border-gray-300 dark:border-gray-700'}`}
                  onClick={() => { setLanguage(lng); addToast('언어 설정을 적용했습니다', 'success', 2200); }}
                  aria-pressed={language===lng}
                >{lng === 'ko' ? '한국어' : 'English'}</button>
              ))}
              </div>
            </div>
          </details>

          <details className="group rounded-lg border border-gray-200 dark:border-gray-700">
            <summary className="flex items-center justify-between cursor-pointer px-4 py-3 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors rounded-lg list-none">
              <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">🔔 알림 설정</h3>
              <span className="text-gray-500 dark:text-gray-400 group-open:rotate-180 transition-transform">▼</span>
            </summary>
            <div className="px-4 py-3">
              <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-300">브라우저 알림 허용</span>
              <button
                className={`px-3 py-2 rounded border text-sm ${notificationsOptIn? 'bg-green-600 text-white border-green-600':'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border-gray-300 dark:border-gray-700'}`}
                onClick={async () => {
                  const perm = await requestNotificationPermission();
                  if (perm === 'granted') {
                    const sub = await subscribeToPush();
                    if (!sub) {
                      setNotificationsOptIn(false);
                      addToast('푸시 구독에 실패했습니다', 'error');
                    } else {
                      addToast('브라우저 알림이 활성화되었습니다', 'success', 2500);
                    }
                  } else {
                    await unsubscribeFromPush();
                    setNotificationsOptIn(false);
                    addToast('브라우저 알림이 비활성화되었습니다', 'info', 2500);
                  }
                }}
                aria-pressed={notificationsOptIn}
              >{notificationsOptIn ? '허용됨' : '요청'}</button>
              </div>
            </div>
          </details>

          <details className="group rounded-lg border border-gray-200 dark:border-gray-700">
            <summary className="flex items-center justify-between cursor-pointer px-4 py-3 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors rounded-lg list-none">
              <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">♿ 접근성</h3>
              <span className="text-gray-500 dark:text-gray-400 group-open:rotate-180 transition-transform">▼</span>
            </summary>
            <div className="px-4 py-3 space-y-2">
              <label className="flex items-center justify-between gap-4">
                <span className="text-sm text-gray-700 dark:text-gray-300">고대비 모드</span>
                <input type="checkbox" checked={highContrast} onChange={(e) => { setHighContrast(e.target.checked); addToast('고대비 모드를 변경했습니다', 'success', 2000); }} />
              </label>
              <label className="flex items-center justify-between gap-4">
                <span className="text-sm text-gray-700 dark:text-gray-300">감소된 모션</span>
                <input type="checkbox" checked={reducedMotion} onChange={(e) => { setReducedMotion(e.target.checked); addToast('모션 감소 설정을 변경했습니다', 'success', 2000); }} />
              </label>
            </div>
          </details>
        </div>
      </div>
    </div>
  );
}
