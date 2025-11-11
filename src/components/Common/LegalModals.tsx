interface LegalModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function PrivacyPolicyModal({ isOpen, onClose }: LegalModalProps) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label="개인정보 처리방침">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[92%] sm:w-[720px] max-h-[80vh] overflow-auto bg-white dark:bg-gray-900 rounded-xl shadow-soft-lg p-5 sm:p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">개인정보 처리방침</h2>
        <div className="mt-3 space-y-2 text-sm text-gray-700 dark:text-gray-300">
          <p>본 서비스는 서비스 제공을 위해 최소한의 개인정보를 처리합니다. 상세 내용은 추후 업데이트됩니다.</p>
        </div>
        <div className="mt-4 text-right">
          <button onClick={onClose} className="px-4 py-2 min-h-[44px] rounded-lg border text-sm bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">닫기</button>
        </div>
      </div>
    </div>
  );
}

export function TermsOfServiceModal({ isOpen, onClose }: LegalModalProps) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label="이용약관">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[92%] sm:w-[720px] max-h-[80vh] overflow-auto bg-white dark:bg-gray-900 rounded-xl shadow-soft-lg p-5 sm:p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">이용약관</h2>
        <div className="mt-3 space-y-2 text-sm text-gray-700 dark:text-gray-300">
          <p>서비스 이용에 관한 기본 약관입니다. 상세 내용은 추후 업데이트됩니다.</p>
        </div>
        <div className="mt-4 text-right">
          <button onClick={onClose} className="px-4 py-2 min-h-[44px] rounded-lg border text-sm bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">닫기</button>
        </div>
      </div>
    </div>
  );
}
