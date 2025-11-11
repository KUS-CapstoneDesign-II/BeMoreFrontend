interface IdleTimeoutModalProps {
  isOpen: boolean;
  onContinue: () => void;
  onEnd: () => void;
  secondsRemaining: number;
}

export function IdleTimeoutModal({ isOpen, onContinue, onEnd, secondsRemaining }: IdleTimeoutModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label="활동 없음 경고">
      <div className="absolute inset-0 bg-black/40" />
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[92%] sm:w-[420px] bg-white dark:bg-gray-900 rounded-xl shadow-soft-lg p-5 sm:p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">계속 진행하시겠어요?</h2>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">오랜 시간 활동이 없어 세션이 종료될 예정입니다. {secondsRemaining}초 내에 응답하지 않으면 자동으로 종료됩니다.</p>
        <div className="mt-4 flex justify-end gap-2">
          <button onClick={onEnd} className="px-4 py-2 min-h-[44px] rounded-lg border text-sm bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border-gray-300 dark:border-gray-700 transition-colors hover:bg-gray-50 dark:hover:bg-gray-700">종료</button>
          <button onClick={onContinue} className="px-4 py-2 min-h-[44px] rounded-lg text-sm bg-primary-600 hover:bg-primary-700 text-white transition-colors">계속</button>
        </div>
      </div>
    </div>
  );
}
