import { useState } from 'react';
import { useI18n } from '../../contexts/I18nContext';
import { useToast } from '../../contexts/ToastContext';

export interface SessionData {
  sessionId: string;
  startTime: Date;
  endTime: Date;
  duration: number; // minutes
  messageCount: number;
  averageResponseTime: number; // seconds
  emotions: {
    happy: number;
    sad: number;
    anxious: number;
    neutral: number;
    [key: string]: number;
  };
  mainEmotion: string;
  userFeedback?: {
    rating: number;
    note?: string;
  };
  aiInsights: string[];
}

interface SessionSummaryReportProps {
  isOpen: boolean;
  onClose: () => void;
  sessionData?: SessionData;
  onScheduleNextSession?: (date: Date) => void;
  onDownloadPDF?: () => void;
}

export function SessionSummaryReport({
  isOpen,
  onClose,
  sessionData,
  onScheduleNextSession,
  onDownloadPDF,
}: SessionSummaryReportProps) {
  const { t } = useI18n();
  const { addToast } = useToast();

  const [rating, setRating] = useState(0);
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showScheduling, setShowScheduling] = useState(false);

  if (!isOpen || !sessionData) return null;

  // 감정 이모지 맵
  const emotionEmojis: { [key: string]: string } = {
    happy: '😊',
    sad: '😢',
    anxious: '😰',
    neutral: '😐',
    angry: '😠',
    excited: '🤩',
  };

  // 감정 레이블
  const emotionLabels: { [key: string]: string } = {
    happy: t('emotion.happy') || '행복',
    sad: t('emotion.sad') || '슬픔',
    anxious: t('emotion.anxious') || '불안',
    neutral: t('emotion.neutral') || '중립',
    angry: t('emotion.angry') || '분노',
    excited: t('emotion.excited') || '흥분',
  };

  // 시간 포맷팅
  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}시간 ${mins}분`;
    }
    return `${mins}분`;
  };

  // 날짜 포맷팅
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  // 감정 데이터 정렬
  const sortedEmotions = Object.entries(sessionData.emotions)
    .filter(([, value]) => value > 0)
    .sort((a, b) => b[1] - a[1]);

  // 피드백 제출
  const handleSubmitFeedback = async () => {
    if (rating === 0) {
      addToast(t('validation.required') || '평점을 선택해주세요', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      // TODO: API 호출 - 피드백 저장
      console.log('Submitting feedback:', { rating, note });
      addToast(t('common.feedbackSubmitted') || '피드백이 저장되었습니다', 'success');
      setRating(0);
      setNote('');
    } catch {
      addToast(t('common.feedbackFailed') || '피드백 저장 실패', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // PDF 다운로드
  const handleDownloadPDF = async () => {
    try {
      // TODO: jsPDF 또는 html2canvas 사용하여 PDF 생성
      console.log('Downloading PDF for session:', sessionData.sessionId);
      if (onDownloadPDF) {
        onDownloadPDF();
      }
      addToast(t('common.pdfDownloading') || 'PDF를 다운로드 중입니다', 'success');
    } catch {
      addToast(t('common.pdfFailed') || 'PDF 다운로드 실패', 'error');
    }
  };

  // 다음 세션 예약
  const handleScheduleSession = async () => {
    // TODO: 날짜 선택 후 예약
    console.log('Scheduling next session');
    if (onScheduleNextSession) {
      onScheduleNextSession(new Date(Date.now() + 3 * 24 * 60 * 60 * 1000));
    }
    addToast(t('common.sessionScheduled') || '세션이 예약되었습니다', 'success');
    setShowScheduling(false);
  };

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label="세션 요약">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[95%] sm:w-[90%] max-w-2xl max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-900 rounded-2xl shadow-2xl">
        {/* 헤더 */}
        <div className="sticky top-0 bg-gradient-to-r from-primary-500 to-primary-600 text-white p-6 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">{t('session.summary.title') || '세션 요약'}</h2>
              <p className="text-primary-100 text-sm mt-1">
                {formatDate(sessionData.startTime)}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:bg-primary-700 rounded-lg p-2 transition-colors"
              aria-label="닫기"
            >
              ✕
            </button>
          </div>
        </div>

        {/* 콘텐츠 */}
        <div className="p-6 space-y-6">
          {/* 기본 통계 */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {t('session.summary.duration') || '진행 시간'}
              </p>
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-2">
                {formatDuration(sessionData.duration)}
              </p>
            </div>

            <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {t('session.summary.messages') || '메시지 수'}
              </p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-2">
                {sessionData.messageCount}개
              </p>
            </div>

            <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {t('session.summary.avgResponseTime') || '평균 응답 시간'}
              </p>
              <p className="text-2xl font-bold text-purple-600 dark:text-purple-400 mt-2">
                {sessionData.averageResponseTime.toFixed(1)}초
              </p>
            </div>

            <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {t('session.summary.mainEmotion') || '주요 감정'}
              </p>
              <p className="text-2xl font-bold text-orange-600 dark:text-orange-400 mt-2">
                {emotionEmojis[sessionData.mainEmotion] || '😐'}
                <span className="text-lg ml-1">
                  {emotionLabels[sessionData.mainEmotion] || sessionData.mainEmotion}
                </span>
              </p>
            </div>
          </div>

          {/* 감정 분포 */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              📊 {t('session.summary.emotionDistribution') || '감정 분포'}
            </h3>

            <div className="space-y-3">
              {sortedEmotions.map(([emotion, percentage]) => (
                <div key={emotion}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {emotionEmojis[emotion]} {emotionLabels[emotion] || emotion}
                    </span>
                    <span className="text-sm font-semibold text-gray-600 dark:text-gray-400">
                      {Math.round(percentage)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-full transition-all ${
                        emotion === 'happy'
                          ? 'bg-green-500'
                          : emotion === 'sad'
                            ? 'bg-blue-500'
                            : emotion === 'anxious'
                              ? 'bg-red-500'
                              : 'bg-gray-400'
                      }`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* AI 인사이트 */}
          {sessionData.aiInsights.length > 0 && (
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg p-6 border border-blue-200 dark:border-blue-800">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                💡 {t('session.summary.aiInsights') || 'AI 인사이트'}
              </h3>

              <ul className="space-y-3">
                {sessionData.aiInsights.map((insight, index) => (
                  <li key={index} className="flex gap-3">
                    <span className="text-blue-500 flex-shrink-0">✓</span>
                    <span className="text-sm text-gray-700 dark:text-gray-300">{insight}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* 피드백 섹션 */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              📝 {t('session.summary.feedback') || '피드백'}
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  {t('session.summary.howWasSession') || '이번 세션은 어떠셨나요?'}
                  <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-2" role="radiogroup">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setRating(i + 1)}
                      className={`w-10 h-10 rounded-lg border-2 font-semibold text-sm transition-all ${
                        rating === i + 1
                          ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400'
                          : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-primary-300'
                      }`}
                      aria-label={`${i + 1}점`}
                    >
                      {i + 1}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label htmlFor="feedback-note" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('session.summary.additionalComments') || '추가 의견 (선택)'}
                </label>
                <textarea
                  id="feedback-note"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder={t('session.summary.feedbackPlaceholder') || '이번 세션에서 좋았던 점이나 개선할 점을 알려주세요'}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  rows={3}
                />
              </div>

              <button
                onClick={handleSubmitFeedback}
                disabled={isSubmitting}
                className="w-full px-4 py-2 bg-primary-500 hover:bg-primary-600 disabled:opacity-50 text-white rounded-lg font-medium transition-colors"
              >
                {isSubmitting ? t('common.submitting') || '제출 중...' : t('common.submitFeedback') || '피드백 제출'}
              </button>
            </div>
          </div>

          {/* 액션 버튼 */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              🎯 {t('session.summary.nextSteps') || '다음 단계'}
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                onClick={handleDownloadPDF}
                className="flex items-center justify-center gap-2 px-4 py-3 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/40 text-blue-600 dark:text-blue-400 rounded-lg font-medium transition-colors border border-blue-200 dark:border-blue-800"
              >
                📥 {t('session.summary.downloadPDF') || 'PDF 다운로드'}
              </button>

              {!showScheduling ? (
                <button
                  onClick={() => setShowScheduling(true)}
                  className="flex items-center justify-center gap-2 px-4 py-3 bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/40 text-green-600 dark:text-green-400 rounded-lg font-medium transition-colors border border-green-200 dark:border-green-800"
                >
                  📅 {t('session.summary.scheduleNext') || '다음 세션 예약'}
                </button>
              ) : (
                <button
                  onClick={handleScheduleSession}
                  className="flex items-center justify-center gap-2 px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
                >
                  ✓ {t('session.summary.scheduleConfirm') || '예약 확인'}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* 푸터 */}
        <div className="sticky bottom-0 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-4 rounded-b-2xl flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-lg font-medium transition-colors"
          >
            {t('common.close') || '닫기'}
          </button>
        </div>
      </div>
    </div>
  );
}
