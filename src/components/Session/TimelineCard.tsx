import { useMemo } from 'react';
import type { TimelineCard as TimelineCardType } from '../../types/session';

interface TimelineCardProps {
  card: TimelineCardType;
  isActive?: boolean;
  onClick?: () => void;
}

/**
 * Timeline Card Component (Phase 9-4)
 *
 * 1분 단위의 수집된 메트릭을 카드로 표시합니다.
 * 점수, 감정, 키워드, 신뢰도를 시각화합니다.
 */
export default function TimelineCard({
  card,
  isActive = false,
  onClick,
}: TimelineCardProps) {
  const emotionEmoji = useMemo(() => {
    switch (card.sentiment) {
      case 'positive':
        return '😊';
      case 'negative':
        return '😟';
      default:
        return '😐';
    }
  }, [card.sentiment]);

  const getScoreColorClass = (score: number) => {
    if (score >= 75) return 'bg-green-500 dark:bg-green-600';
    if (score >= 50) return 'bg-yellow-500 dark:bg-yellow-600';
    return 'bg-red-500 dark:bg-red-600';
  };

  return (
    <div
      onClick={onClick}
      className={`p-4 rounded-lg border-2 transition cursor-pointer ${
        isActive
          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 shadow-lg'
          : 'border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600'
      }`}
    >
      {/* Header: Minute + Score */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold text-gray-900 dark:text-white">
          {card.minuteIndex + 1}분
        </h3>
        <div className="flex items-center gap-2">
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {card.combinedScore.toFixed(1)}
          </div>
          <div className={`w-12 h-12 rounded-full ${getScoreColorClass(card.combinedScore)} flex items-center justify-center`}>
            <span className="text-white font-bold text-sm">
              {card.combinedScore >= 75 ? '✅' : card.combinedScore >= 50 ? '⚠️' : '❌'}
            </span>
          </div>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-3 gap-2 mb-3">
        {/* Facial Score */}
        <div className="p-2 bg-gray-50 dark:bg-gray-800 rounded">
          <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">얼굴</p>
          <p className="font-bold text-sm text-gray-900 dark:text-white">
            {card.facialScore.toFixed(0)}
          </p>
        </div>

        {/* VAD Score */}
        <div className="p-2 bg-gray-50 dark:bg-gray-800 rounded">
          <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">음성</p>
          <p className="font-bold text-sm text-gray-900 dark:text-white">
            {card.vadScore.toFixed(0)}
          </p>
        </div>

        {/* Text Score */}
        <div className="p-2 bg-gray-50 dark:bg-gray-800 rounded">
          <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">텍스트</p>
          <p className="font-bold text-sm text-gray-900 dark:text-white">
            {card.textScore.toFixed(0)}
          </p>
        </div>
      </div>

      {/* Sentiment + Confidence */}
      <div className="flex items-center justify-between mb-3 pb-3 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{emotionEmoji}</span>
          <div>
            <p className="text-xs text-gray-600 dark:text-gray-400">감정</p>
            <p className="text-sm font-semibold text-gray-900 dark:text-white capitalize">
              {card.sentiment === 'positive'
                ? '긍정적'
                : card.sentiment === 'negative'
                  ? '부정적'
                  : '중립적'}
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-600 dark:text-gray-400">신뢰도</p>
          <p className="text-sm font-semibold text-gray-900 dark:text-white">
            {(card.confidence * 100).toFixed(0)}%
          </p>
        </div>
      </div>

      {/* Keywords */}
      {card.keywords.length > 0 && (
        <div>
          <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">주요 키워드</p>
          <div className="flex flex-wrap gap-1">
            {card.keywords.slice(0, 3).map((keyword, idx) => (
              <span
                key={idx}
                className="px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded"
              >
                {keyword}
              </span>
            ))}
            {card.keywords.length > 3 && (
              <span className="px-2 py-1 text-xs text-gray-600 dark:text-gray-400">
                +{card.keywords.length - 3}개
              </span>
            )}
          </div>
        </div>
      )}

      {/* Duration */}
      <div className="text-xs text-gray-500 dark:text-gray-400 mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
        ⏱️ {Math.round(card.durationMs / 1000)}초
      </div>
    </div>
  );
}
