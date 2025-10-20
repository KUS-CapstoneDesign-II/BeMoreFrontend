import { useConsent } from '../../contexts/ConsentContext';

interface ConsentDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ConsentDialog({ isOpen, onClose }: ConsentDialogProps) {
  const { setConsent, shouldRespectDNT } = useConsent();
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label="동의 설정">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[92%] sm:w-[520px] bg-white dark:bg-gray-900 rounded-xl shadow-soft-lg p-5 sm:p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">개인정보 및 쿠키 동의</h2>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
          더 나은 서비스 제공을 위해 분석 쿠키와 오류 보고를 사용할 수 있습니다. 원하실 경우 언제든지 설정에서 변경하실 수 있습니다.
        </p>

        {shouldRespectDNT && (
          <div className="mt-3 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded p-2">
            브라우저의 Do Not Track 설정을 감지했습니다. 기본값으로 분석과 오류 보고를 비활성화합니다.
          </div>
        )}

        <div className="mt-4 grid grid-cols-2 gap-3">
          <button
            className="px-3 py-2 rounded-lg border text-sm bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border-gray-300 dark:border-gray-700"
            onClick={() => setConsent({ analytics: false, crashReporting: false })}
          >필수만 허용</button>
          <button
            className="px-3 py-2 rounded-lg text-sm bg-primary-600 hover:bg-primary-700 text-white shadow-soft"
            onClick={() => setConsent({ analytics: true, crashReporting: true })}
          >모두 허용</button>
        </div>

        <div className="mt-3 text-xs text-gray-500">
          계속 진행 시 <a href="#" className="underline">개인정보 처리방침</a> 및 <a href="#" className="underline">이용약관</a>에 동의하게 됩니다.
        </div>
      </div>
    </div>
  );
}
