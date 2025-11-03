import { useState, useMemo } from 'react';
import { useTimelineStore } from '../../stores/timelineStore';
import type { TimelineCard as TimelineCardType } from '../../types/session';
import TimelineCard from './TimelineCard';

interface TimelineGridProps {
  onCardSelected?: (card: TimelineCardType) => void;
}

type SortOption = 'chronological' | 'score-high' | 'score-low' | 'sentiment';

/**
 * Timeline Grid Component (Phase 9-4)
 *
 * 수집된 모든 타임라인 카드를 그리드로 표시합니다.
 * 정렬, 필터링, 상세 보기 기능을 제공합니다.
 */
export default function TimelineGrid({ onCardSelected }: TimelineGridProps) {
  const [selectedCardIndex, setSelectedCardIndex] = useState<number | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>('chronological');
  const [filterSentiment, setFilterSentiment] = useState<'all' | 'positive' | 'negative' | 'neutral'>('all');

  const cards = useTimelineStore((s) => s.cards);

  // Sort and filter cards
  const displayCards = useMemo(() => {
    let filtered = [...cards];

    // Filter by sentiment
    if (filterSentiment !== 'all') {
      filtered = filtered.filter((card) => {
        if (filterSentiment === 'positive') return card.sentiment === 'positive';
        if (filterSentiment === 'negative') return card.sentiment === 'negative';
        if (filterSentiment === 'neutral') return card.sentiment === 'neutral';
        return true;
      });
    }

    // Sort
    if (sortBy === 'chronological') {
      return filtered.sort((a, b) => a.minuteIndex - b.minuteIndex);
    } else if (sortBy === 'score-high') {
      return filtered.sort((a, b) => b.combinedScore - a.combinedScore);
    } else if (sortBy === 'score-low') {
      return filtered.sort((a, b) => a.combinedScore - b.combinedScore);
    } else if (sortBy === 'sentiment') {
      const sentimentOrder = { positive: 0, neutral: 1, negative: 2 };
      return filtered.sort((a, b) => {
        const aOrder = sentimentOrder[a.sentiment || 'neutral'];
        const bOrder = sentimentOrder[b.sentiment || 'neutral'];
        return aOrder - bOrder;
      });
    }

    return filtered;
  }, [cards, sortBy, filterSentiment]);

  const stats = useMemo(() => {
    if (displayCards.length === 0) {
      return { avg: 0, max: 0, min: 0, total: 0 };
    }
    const scores = displayCards.map((c) => c.combinedScore);
    return {
      avg: scores.reduce((a, b) => a + b) / scores.length,
      max: Math.max(...scores),
      min: Math.min(...scores),
      total: displayCards.length,
    };
  }, [displayCards]);

  const handleCardClick = (card: TimelineCardType) => {
    setSelectedCardIndex(card.minuteIndex);
    if (onCardSelected) {
      onCardSelected(card);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <div className="bg-white dark:bg-slate-700 rounded-lg border border-gray-200 dark:border-gray-600 p-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          📊 타임라인 카드 분석
        </h2>

        {/* Stats Summary */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded">
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">총 카드</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {stats.total}
            </p>
          </div>
          <div className="p-3 bg-blue-50 dark:bg-blue-900/30 rounded">
            <p className="text-xs text-blue-600 dark:text-blue-300 mb-1">평균</p>
            <p className="text-2xl font-bold text-blue-700 dark:text-blue-200">
              {stats.avg.toFixed(1)}
            </p>
          </div>
          <div className="p-3 bg-green-50 dark:bg-green-900/30 rounded">
            <p className="text-xs text-green-600 dark:text-green-300 mb-1">최고</p>
            <p className="text-2xl font-bold text-green-700 dark:text-green-200">
              {stats.max.toFixed(1)}
            </p>
          </div>
          <div className="p-3 bg-red-50 dark:bg-red-900/30 rounded">
            <p className="text-xs text-red-600 dark:text-red-300 mb-1">최저</p>
            <p className="text-2xl font-bold text-red-700 dark:text-red-200">
              {stats.min.toFixed(1)}
            </p>
          </div>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap gap-4">
          {/* Sort */}
          <div className="flex-1 min-w-[200px]">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-2">
              정렬
            </label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-600 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="chronological">⏱️ 시간순</option>
              <option value="score-high">⬇️ 높은 점수순</option>
              <option value="score-low">⬆️ 낮은 점수순</option>
              <option value="sentiment">😊 감정순</option>
            </select>
          </div>

          {/* Filter */}
          <div className="flex-1 min-w-[200px]">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-2">
              감정 필터
            </label>
            <select
              value={filterSentiment}
              onChange={(e) => setFilterSentiment(e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-600 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">모두 보기</option>
              <option value="positive">😊 긍정적</option>
              <option value="neutral">😐 중립적</option>
              <option value="negative">😟 부정적</option>
            </select>
          </div>
        </div>
      </div>

      {/* Cards Grid */}
      {displayCards.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {displayCards.map((card) => (
            <TimelineCard
              key={card.minuteIndex}
              card={card}
              isActive={selectedCardIndex === card.minuteIndex}
              onClick={() => handleCardClick(card)}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-gray-50 dark:bg-gray-900/30 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-700">
          <p className="text-gray-600 dark:text-gray-400">
            {cards.length === 0
              ? '수집된 타임라인 카드가 없습니다.'
              : '필터 조건에 맞는 카드가 없습니다.'}
          </p>
        </div>
      )}

      {/* Selected Card Detail */}
      {selectedCardIndex !== null && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-800 rounded-lg p-6 max-w-md w-full max-h-96 overflow-y-auto">
            {cards
              .filter((c) => c.minuteIndex === selectedCardIndex)
              .map((card) => (
                <div key={card.minuteIndex} className="space-y-4">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                    {card.minuteIndex + 1}분 상세 정보
                  </h3>

                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">종합 점수</p>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex-1 h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-blue-500"
                            style={{ width: `${card.combinedScore}%` }}
                          />
                        </div>
                        <span className="font-bold text-gray-900 dark:text-white">
                          {card.combinedScore.toFixed(1)}/100
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <p className="text-xs text-gray-600 dark:text-gray-400">얼굴</p>
                        <p className="font-bold text-gray-900 dark:text-white">
                          {card.facialScore.toFixed(1)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600 dark:text-gray-400">음성</p>
                        <p className="font-bold text-gray-900 dark:text-white">
                          {card.vadScore.toFixed(1)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600 dark:text-gray-400">텍스트</p>
                        <p className="font-bold text-gray-900 dark:text-white">
                          {card.textScore.toFixed(1)}
                        </p>
                      </div>
                    </div>

                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">감정</p>
                      <p className="font-bold text-gray-900 dark:text-white">
                        {card.sentiment === 'positive'
                          ? '😊 긍정적'
                          : card.sentiment === 'negative'
                            ? '😟 부정적'
                            : '😐 중립적'}
                      </p>
                    </div>

                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">신뢰도</p>
                      <p className="font-bold text-gray-900 dark:text-white">
                        {(card.confidence * 100).toFixed(1)}%
                      </p>
                    </div>

                    {card.keywords.length > 0 && (
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                          주요 키워드
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {card.keywords.map((keyword, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded"
                            >
                              {keyword}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => setSelectedCardIndex(null)}
                    className="w-full mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition"
                  >
                    닫기
                  </button>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
