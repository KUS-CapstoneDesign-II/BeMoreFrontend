interface ResumePromptModalProps {
  isOpen: boolean;
  onResume: () => void;
  onDiscard: () => void;
  sessionStartedAt?: number; // timestamp when session started
}

export function ResumePromptModal({ isOpen, onResume, onDiscard, sessionStartedAt }: ResumePromptModalProps) {
  if (!isOpen) return null;

  // Calculate time elapsed
  const getTimeAgo = (timestamp: number | undefined) => {
    if (!timestamp) return '알 수 없음';
    const elapsedMs = Date.now() - timestamp;
    const elapsedMins = Math.floor(elapsedMs / 60000);
    const elapsedHours = Math.floor(elapsedMs / 3600000);

    if (elapsedMins < 1) return '방금 전';
    if (elapsedMins < 60) return `${elapsedMins}분 전`;
    if (elapsedHours < 24) return `${elapsedHours}시간 ${Math.floor((elapsedMins % 60))}분 전`;
    return '어제';
  };

  const timeInfo = getTimeAgo(sessionStartedAt);

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label="세션 재개">
      <div className="absolute inset-0 bg-black/40" />
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[92%] sm:w-[520px] bg-white dark:bg-gray-900 rounded-xl shadow-soft-lg p-5 sm:p-6">
        <div className="flex items-start gap-3">
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              ⏸️ 진행 중이던 세션이 있습니다
            </h2>
            <div className="mt-3 space-y-2">
              <p className="text-sm text-gray-600 dark:text-gray-300">
                <span className="font-medium text-gray-900 dark:text-gray-100">{timeInfo}</span>
                {' '}시작했던 세션을 이어서 진행할 수 있습니다.
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                재개하면 그때까지의 상담 기록이 유지됩니다.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-6 flex flex-col-reverse sm:flex-row justify-end gap-2">
          <button
            onClick={onDiscard}
            className="px-4 py-2.5 rounded-lg border text-sm font-medium bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            aria-label="새 세션 시작"
          >
            새로 시작하기
          </button>
          <button
            onClick={onResume}
            className="px-4 py-2.5 rounded-lg text-sm font-medium bg-primary-600 hover:bg-primary-700 text-white transition-colors shadow-soft"
            aria-label="이전 세션 재개"
          >
            이어서 진행하기
          </button>
        </div>

        <p className="mt-4 text-xs text-gray-400 dark:text-gray-500 text-center">
          "새로 시작하기"를 선택하면 이전 세션이 저장되지 않습니다.
        </p>
      </div>
    </div>
  );
}
