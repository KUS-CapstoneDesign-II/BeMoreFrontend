interface SessionSummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmitFeedback: (rating: number, note?: string) => void;
  durationLabel: string;
}

export function SessionSummaryModal({ isOpen, onClose, onSubmitFeedback, durationLabel }: SessionSummaryModalProps) {
  if (!isOpen) return null;

  let rating = 0;
  let note = '';
  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label="세션 요약">
      <div className="absolute inset-0 bg-black/40" />
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[92%] sm:w-[520px] bg-white dark:bg-gray-900 rounded-xl shadow-soft-lg p-5 sm:p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">세션 요약</h2>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">총 진행 시간: {durationLabel}</p>

        <div className="mt-4">
          <label className="text-sm text-gray-700 dark:text-gray-300">이번 세션은 얼마나 도움이 되었나요?</label>
          <div className="mt-2 flex gap-1" role="radiogroup" aria-label="세션 만족도">
            {Array.from({ length: 5 }).map((_, i) => (
              <button key={i} onClick={() => { rating = i + 1; }} aria-label={`${i+1}점`} className="px-3 py-2 rounded border text-sm bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border-gray-300 dark:border-gray-700 hover:bg-gray-50">{i+1}</button>
            ))}
          </div>
        </div>

        <div className="mt-4">
          <label className="text-sm text-gray-700 dark:text-gray-300" htmlFor="feedback-note">추가 의견 (선택)</label>
          <textarea id="feedback-note" className="mt-1 w-full rounded-lg border bg-white dark:bg-gray-800 text-sm p-2 border-gray-300 dark:border-gray-700 text-gray-800 dark:text-gray-200" rows={3} onChange={(e) => { note = e.target.value; }} />
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <button onClick={onClose} className="px-3 py-2 rounded-lg border text-sm bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border-gray-300 dark:border-gray-700">닫기</button>
          <button onClick={() => onSubmitFeedback(rating, note)} className="px-3 py-2 rounded-lg text-sm bg-primary-600 hover:bg-primary-700 text-white">제출</button>
        </div>
      </div>
    </div>
  );
}
