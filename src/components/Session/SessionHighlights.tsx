import { useMemo } from 'react';
import { useTimelineStore } from '../../stores/timelineStore';

/**
 * Session Highlights Component (Phase 9-4)
 *
 * 세션 중 가장 주목할 만한 순간들을 표시합니다:
 * - 최고조의 순간
 * - 최저조의 순간
 * - 감정 변화
 * - 주요 전환점
 */
export default function SessionHighlights() {
  const cards = useTimelineStore((s) => s.cards);

  const highlights = useMemo(() => {
    if (cards.length === 0) {
      return { peak: null, valley: null, turnarounds: [], trends: [] };
    }

    const scores = cards.map((c) => c.combinedScore);

    // Peak moment
    const maxScore = Math.max(...scores);
    const peakCard = cards.find((c) => c.combinedScore === maxScore);

    // Valley moment
    const minScore = Math.min(...scores);
    const valleyCard = cards.find((c) => c.combinedScore === minScore);

    // Turnarounds (big score changes)
    const turnarounds = [];
    for (let i = 1; i < cards.length; i++) {
      const change = Math.abs(cards[i].combinedScore - cards[i - 1].combinedScore);
      if (change > 20) {
        turnarounds.push({
          minute: cards[i].minuteIndex,
          from: cards[i - 1].combinedScore,
          to: cards[i].combinedScore,
          change,
        });
      }
    }

    // Trends (improving or declining)
    const firstHalf = cards.slice(0, Math.floor(cards.length / 2));
    const secondHalf = cards.slice(Math.floor(cards.length / 2));
    const firstHalfAvg = firstHalf.reduce((a, b) => a + b.combinedScore, 0) / firstHalf.length;
    const secondHalfAvg = secondHalf.reduce((a, b) => a + b.combinedScore, 0) / secondHalf.length;
    const trend = secondHalfAvg > firstHalfAvg ? 'improving' : 'declining';

    return { peak: peakCard, valley: valleyCard, turnarounds, trend };
  }, [cards]);

  if (cards.length === 0) {
    return null;
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
        ⭐ 세션 하이라이트
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Peak Moment */}
        {highlights.peak && (
          <div className="p-6 bg-gradient-to-br from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20 border-2 border-yellow-300 dark:border-yellow-700 rounded-lg">
            <h3 className="text-lg font-bold text-yellow-900 dark:text-yellow-300 mb-3">
              🔝 최고조의 순간
            </h3>
            <div className="space-y-2">
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                {highlights.peak.minuteIndex + 1}분에 최고 점수 기록
              </p>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-bold text-yellow-700 dark:text-yellow-400">
                  {highlights.peak.combinedScore.toFixed(1)}
                </span>
                <span className="text-xl text-yellow-600 dark:text-yellow-500">/100</span>
              </div>
              <div className="flex gap-2 mt-3">
                <span className="px-2 py-1 text-xs bg-yellow-200 dark:bg-yellow-900/50 text-yellow-800 dark:text-yellow-300 rounded">
                  {highlights.peak.sentiment === 'positive'
                    ? '😊 긍정적'
                    : highlights.peak.sentiment === 'negative'
                      ? '😟 부정적'
                      : '😐 중립적'}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Valley Moment */}
        {highlights.valley && (
          <div className="p-6 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 border-2 border-blue-300 dark:border-blue-700 rounded-lg">
            <h3 className="text-lg font-bold text-blue-900 dark:text-blue-300 mb-3">
              🔻 낮은 순간
            </h3>
            <div className="space-y-2">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                {highlights.valley.minuteIndex + 1}분에 낮은 점수 기록
              </p>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-bold text-blue-700 dark:text-blue-400">
                  {highlights.valley.combinedScore.toFixed(1)}
                </span>
                <span className="text-xl text-blue-600 dark:text-blue-500">/100</span>
              </div>
              <div className="flex gap-2 mt-3">
                <span className="px-2 py-1 text-xs bg-blue-200 dark:bg-blue-900/50 text-blue-800 dark:text-blue-300 rounded">
                  💭 주의 필요
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Trend */}
      <div className="p-6 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border-2 border-purple-300 dark:border-purple-700 rounded-lg">
        <h3 className="text-lg font-bold text-purple-900 dark:text-purple-300 mb-3">
          📈 전체 흐름
        </h3>
        <div className="flex items-center gap-4">
          <div className="text-4xl">
            {highlights.trend === 'improving' ? '📈' : '📉'}
          </div>
          <div>
            <p className="text-sm text-purple-800 dark:text-purple-200 mb-1">
              세션이 {highlights.trend === 'improving' ? '개선되는' : '악화되는'} 추세입니다
            </p>
            <p className="text-xs text-purple-700 dark:text-purple-400">
              {highlights.trend === 'improving'
                ? '👏 점점 더 좋아지고 있네요!'
                : '💪 마지막 부분에 집중이 필요합니다.'}
            </p>
          </div>
        </div>
      </div>

      {/* Turnarounds */}
      {highlights.turnarounds.length > 0 && (
        <div className="p-6 bg-white dark:bg-slate-700 border-2 border-gray-200 dark:border-gray-600 rounded-lg">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
            🔄 변화의 순간 ({highlights.turnarounds.length}회)
          </h3>
          <div className="space-y-3">
            {highlights.turnarounds.map((turnaround, idx) => (
              <div
                key={idx}
                className="p-3 bg-gray-50 dark:bg-gray-800 rounded flex items-center justify-between"
              >
                <div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">
                    {turnaround.minute + 1}분
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    {turnaround.from.toFixed(1)} → {turnaround.to.toFixed(1)}
                  </p>
                </div>
                <div className="text-right">
                  <span
                    className={`text-lg font-bold ${
                      turnaround.to > turnaround.from
                        ? 'text-green-600 dark:text-green-400'
                        : 'text-red-600 dark:text-red-400'
                    }`}
                  >
                    {turnaround.to > turnaround.from ? '+' : '-'}
                    {turnaround.change.toFixed(1)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
