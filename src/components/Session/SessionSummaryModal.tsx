import { useState } from 'react';

interface SessionSummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmitFeedback: (rating: number, note?: string) => Promise<void>;
  durationLabel: string;
}

export function SessionSummaryModal({ isOpen, onClose, onSubmitFeedback, durationLabel }: SessionSummaryModalProps) {
  const [rating, setRating] = useState(0);
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (rating === 0) {
      setError('평점을 선택해주세요.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await onSubmitFeedback(rating, note);
      setRating(0);
      setNote('');
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : '피드백 제출에 실패했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setRating(0);
    setNote('');
    setError(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label="세션 요약">
      <div className="absolute inset-0 bg-black/40" onClick={handleClose} />
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[92%] sm:w-[520px] bg-white dark:bg-gray-900 rounded-xl shadow-soft-lg p-5 sm:p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">세션 완료</h2>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">총 진행 시간: <span className="font-semibold">{durationLabel}</span></p>

        <div className="mt-6">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">이번 세션은 얼마나 도움이 되었나요? <span className="text-red-500">*</span></label>
          <div className="mt-3 flex gap-2" role="radiogroup" aria-label="세션 만족도">
            {Array.from({ length: 5 }).map((_, i) => (
              <button
                key={i}
                onClick={() => setRating(i + 1)}
                aria-label={`${i+1}점`}
                className={`w-12 h-12 rounded-lg border-2 text-sm font-semibold transition-all ${
                  rating === i + 1
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400'
                    : 'border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:border-primary-300'
                }`}
              >
                {i+1}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-5">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300" htmlFor="feedback-note">
            추가 의견 (선택)
          </label>
          <textarea
            id="feedback-note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="이번 세션에서 어떤 점이 좋았나요? 또는 개선할 점이 있나요?"
            className="mt-2 w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm p-3 text-gray-800 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            rows={3}
          />
        </div>

        {error && (
          <div className="mt-4 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm">
            {error}
          </div>
        )}

        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={handleClose}
            disabled={isSubmitting}
            className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 text-sm font-medium bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
          >
            닫기
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-primary-600 hover:bg-primary-700 text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? '제출 중...' : '제출'}
          </button>
        </div>
      </div>
    </div>
  );
}
