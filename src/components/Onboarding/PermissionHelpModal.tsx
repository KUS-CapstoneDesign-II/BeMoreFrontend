interface PermissionHelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function PermissionHelpModal({ isOpen, onClose }: PermissionHelpModalProps) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label="권한 문제 해결">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[92%] sm:w-[520px] bg-white dark:bg-gray-900 rounded-xl shadow-soft-lg p-5 sm:p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">권한 문제 해결</h2>
        <ol className="mt-3 list-decimal list-inside space-y-2 text-sm text-gray-700 dark:text-gray-300">
          <li>브라우저 주소창 왼쪽의 자물쇠 아이콘을 클릭하세요.</li>
          <li>카메라와 마이크 권한을 "허용"으로 변경하세요.</li>
          <li>변경 후 페이지를 새로고침하세요.</li>
        </ol>
        <div className="mt-4 text-xs text-gray-500">Safari: 사파리 &gt; 설정 &gt; 웹사이트 &gt; 카메라/마이크에서 도메인 권한을 확인하세요.</div>
        <div className="mt-5 text-right">
          <button onClick={onClose} className="px-4 py-2 min-h-[44px] rounded-lg border text-sm bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">닫기</button>
        </div>
      </div>
    </div>
  );
}
