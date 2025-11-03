import { useState, useEffect } from 'react';
import { useSessionStore } from '../../stores/sessionStore';
import { useTimelineStore } from '../../stores/timelineStore';
import { sessionAPI } from '../../services/api';
import { Logger } from '../../config/env';
import TimelineGrid from './TimelineGrid';
import SessionHighlights from './SessionHighlights';

interface ReportPageProps {
  sessionId: string;
  onFeedbackSubmitted?: () => void;
  onClose?: () => void;
}

/**
 * Report Page (Phase 9-3)
 *
 * 세션 완료 후 보고서와 피드백을 표시합니다:
 * - 세션 통계 (총 시간, 카드 수 등)
 * - 타임라인 분석 (감정 분포, 주요 키워드)
 * - 사용자 피드백 (평점, 코멘트)
 * - 다음 세션 예약
 */
export default function ReportPage({
  sessionId,
  onFeedbackSubmitted,
  onClose,
}: ReportPageProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [feedbackRating, setFeedbackRating] = useState(0);
  const [feedbackNotes, setFeedbackNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const sessionState = useSessionStore((s) => ({
    session: s.session,
    totalDuration: s.totalDuration,
    minuteIndex: s.minuteIndex,
    updateFeedback: s.updateFeedback,
  }));

  const timelineStats = useTimelineStore((s) => s.getStatistics());
  const timelineSummary = useTimelineStore((s) => s.getSummary());

  // Load report data
  useEffect(() => {
    const loadReport = async () => {
      try {
        Logger.info('📊 Loading session report', { sessionId });
        // Report loading would happen here if we had the endpoint
        setIsLoading(false);
      } catch (error) {
        Logger.error('❌ Failed to load report', error);
        setIsLoading(false);
      }
    };

    loadReport();
  }, [sessionId]);

  const handleSubmitFeedback = async () => {
    if (feedbackRating === 0) {
      setSubmitError('평점을 선택해주세요');
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      Logger.info('📝 Submitting feedback', {
        sessionId,
        rating: feedbackRating,
        notesLength: feedbackNotes.length,
      });

      // Submit feedback via API
      await sessionAPI.submitFeedback(sessionId, {
        rating: feedbackRating,
        note: feedbackNotes || undefined,
      });

      // Update session store
      sessionState.updateFeedback({
        rating: feedbackRating,
        notes: feedbackNotes,
      });

      setSubmitSuccess(true);
      Logger.info('✅ Feedback submitted successfully');

      if (onFeedbackSubmitted) {
        setTimeout(onFeedbackSubmitted, 1500);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      Logger.error('❌ Failed to submit feedback', message);
      setSubmitError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-slate-900">
        <div className="text-center">
          <div className="animate-spin text-4xl mb-4">⏳</div>
          <p className="text-gray-600 dark:text-gray-400">보고서를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  const durationMinutes = Math.floor(sessionState.totalDuration / 60000);
  const feedbackSubmitted = submitSuccess;

  return (
    <div className="w-full min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 dark:from-slate-900 dark:to-slate-800 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="mb-4 text-6xl animate-bounce">🎉</div>
          <h1 className="text-3xl font-bold text-green-700 dark:text-green-400 mb-2">
            세션이 완료되었습니다!
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            세션 ID: <span className="font-mono">{sessionId}</span>
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Session Statistics */}
          <div className="lg:col-span-2 space-y-6">
            {/* Session Highlights */}
            <SessionHighlights />

            {/* Overview Stats */}
            <div className="grid grid-cols-3 gap-4">
              <div className="p-4 bg-white dark:bg-slate-700 rounded-lg border border-green-200 dark:border-green-700">
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">세션 시간</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {durationMinutes}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">분</p>
              </div>

              <div className="p-4 bg-white dark:bg-slate-700 rounded-lg border border-green-200 dark:border-green-700">
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">카드 수집</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {timelineStats.totalCards}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">개</p>
              </div>

              <div className="p-4 bg-white dark:bg-slate-700 rounded-lg border border-green-200 dark:border-green-700">
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">평균 점수</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {timelineStats.averageScore.toFixed(1)}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">/100</p>
              </div>
            </div>

            {/* Detailed Statistics */}
            <div className="p-6 bg-white dark:bg-slate-700 rounded-lg border border-gray-200 dark:border-gray-600">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">📊 세션 분석</h2>

              {/* Score Range */}
              <div className="mb-6">
                <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">점수 범위</p>
                <div className="flex items-center justify-between text-sm">
                  <span>최저: {timelineStats.minScore.toFixed(1)}</span>
                  <span className="text-gray-600 dark:text-gray-400">
                    — 평균: {timelineStats.averageScore.toFixed(1)} —
                  </span>
                  <span>최고: {timelineStats.maxScore.toFixed(1)}</span>
                </div>
              </div>

              {/* Emotion Distribution */}
              <div>
                <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">감정 분포</p>
                <div className="space-y-2">
                  {Object.entries(timelineStats.emotionDistribution).map(([emotion, count]) => {
                    const total = timelineStats.totalCards;
                    const percent = total > 0 ? (count as number / total) * 100 : 0;
                    const emotionLabel =
                      emotion === 'positive'
                        ? '😊 긍정적'
                        : emotion === 'negative'
                          ? '😟 부정적'
                          : '😐 중립적';

                    return (
                      <div key={emotion}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-gray-700 dark:text-gray-300">{emotionLabel}</span>
                          <span className="font-medium text-gray-900 dark:text-white">
                            {count as number}개 ({percent.toFixed(1)}%)
                          </span>
                        </div>
                        <div className="w-full h-2 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                          <div
                            className={`h-full transition-all ${
                              emotion === 'positive'
                                ? 'bg-green-500'
                                : emotion === 'negative'
                                  ? 'bg-red-500'
                                  : 'bg-yellow-500'
                            }`}
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Key Insights */}
            <div className="p-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg">
              <h2 className="text-lg font-bold text-blue-900 dark:text-blue-300 mb-4">💡 주요 인사이트</h2>
              <p className="text-blue-800 dark:text-blue-200 whitespace-pre-wrap">
                {timelineSummary}
              </p>
            </div>

            {/* Timeline Grid */}
            <TimelineGrid />

            {/* Top Keywords */}
            {Object.keys(timelineStats.keywordFrequency).length > 0 && (
              <div className="p-6 bg-white dark:bg-slate-700 rounded-lg border border-gray-200 dark:border-gray-600">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">🏷️ 주요 키워드</h2>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(timelineStats.keywordFrequency).map(([keyword, count]) => (
                    <span
                      key={keyword}
                      className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-sm font-medium"
                    >
                      {keyword} <span className="ml-1 opacity-75">({count as number})</span>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Feedback Sidebar */}
          <div>
            <div className="sticky top-4 p-6 bg-white dark:bg-slate-700 rounded-lg border border-gray-200 dark:border-gray-600 shadow-lg">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                {feedbackSubmitted ? '✅ 피드백 완료' : '📝 피드백'}
              </h2>

              {!feedbackSubmitted ? (
                <div className="space-y-4">
                  {/* Rating */}
                  <div>
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      이 세션은 어땠나요?
                    </p>
                    <div className="flex gap-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          onClick={() => setFeedbackRating(star)}
                          className={`text-2xl transition transform hover:scale-110 ${
                            feedbackRating >= star ? 'text-yellow-400' : 'text-gray-300 dark:text-gray-600'
                          }`}
                        >
                          ⭐
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Notes */}
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-2">
                      코멘트 (선택)
                    </label>
                    <textarea
                      value={feedbackNotes}
                      onChange={(e) => setFeedbackNotes(e.target.value)}
                      placeholder="세션에 대한 피드백을 작성해주세요..."
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-slate-600 text-gray-900 dark:text-white resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                      rows={4}
                    />
                  </div>

                  {/* Error */}
                  {submitError && (
                    <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded text-red-700 dark:text-red-300 text-sm">
                      {submitError}
                    </div>
                  )}

                  {/* Submit Button */}
                  <button
                    onClick={handleSubmitFeedback}
                    disabled={isSubmitting || feedbackRating === 0}
                    className={`w-full px-4 py-3 rounded-lg font-bold transition ${
                      isSubmitting || feedbackRating === 0
                        ? 'bg-gray-400 cursor-not-allowed opacity-50'
                        : 'bg-blue-600 hover:bg-blue-700 text-white cursor-pointer'
                    }`}
                  >
                    {isSubmitting ? '⏳ 제출 중...' : '📤 피드백 제출'}
                  </button>
                </div>
              ) : (
                <div className="text-center py-6">
                  <div className="text-4xl mb-3">🙏</div>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    소중한 피드백을 주셨습니다!
                  </p>
                  <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg mb-4">
                    <p className="text-sm text-yellow-800 dark:text-yellow-200">
                      ⭐ {feedbackRating}/5점
                    </p>
                  </div>
                  <button
                    onClick={onClose}
                    className="w-full px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-900 dark:text-white rounded-lg font-medium hover:bg-gray-300 dark:hover:bg-gray-500 transition"
                  >
                    닫기
                  </button>
                </div>
              )}

              {/* Info */}
              <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-600">
                <p className="text-xs text-gray-600 dark:text-gray-400 text-center">
                  다음 세션을 예약하시려면 대시보드로 이동하세요.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
