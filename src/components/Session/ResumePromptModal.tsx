interface ResumePromptModalProps {
  isOpen: boolean;
  onResume: () => void;
  onDiscard: () => void;
}

export function ResumePromptModal({ isOpen, onResume, onDiscard }: ResumePromptModalProps) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label="세션 재개">
      <div className="absolute inset-0 bg-black/40" />
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[92%] sm:w-[520px] bg-white dark:bg-gray-900 rounded-xl shadow-soft-lg p-5 sm:p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">이전 세션을 재개할까요?</h2>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">중단된 세션이 있습니다. 계속 진행하거나 새로 시작할 수 있어요.</p>
        <div className="mt-4 flex justify-end gap-2">
          <button onClick={onDiscard} className="px-3 py-2 rounded-lg border text-sm bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border-gray-300 dark:border-gray-700">새로 시작</button>
          <button onClick={onResume} className="px-3 py-2 rounded-lg text-sm bg-primary-600 hover:bg-primary-700 text-white">재개</button>
        </div>
      </div>
    </div>
  );
}
