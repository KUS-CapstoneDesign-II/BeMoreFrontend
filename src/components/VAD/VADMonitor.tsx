import { MetricCard } from '../ui/MetricCard';
import type { VADMetrics } from '../../types';

interface VADMonitorProps {
  metrics: VADMetrics | null;
  className?: string;
}

/**
 * VADMonitor 컴포넌트
 *
 * 음성 활동 감지(VAD) 메트릭을 시각적으로 표시합니다.
 */
export function VADMonitor({ metrics, className = '' }: VADMonitorProps) {
  if (!metrics) {
    return (
      <div
        className={`p-4 rounded-lg bg-gray-100 ${className}`}
        role="status"
        aria-label="VAD 대기 중"
      >
        <div className="text-sm text-gray-500">VAD 대기 중...</div>
      </div>
    );
  }

  const {
    speechRatio,
    pauseRatio,
    averagePauseDuration,
    longestPause,
    speechBurstCount,
    summary
  } = metrics;

  return (
    <div
      className={`p-4 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm ${className}`}
      role="region"
      aria-label="음성 활동 분석"
    >
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">음성 활동 분석</h3>
        <div className="flex items-center space-x-1">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" aria-hidden="true"></div>
          <span className="text-xs text-gray-500 dark:text-gray-400" role="status">실시간</span>
        </div>
      </div>

      {/* 메트릭 그리드 */}
      <div className="grid grid-cols-2 gap-3 mb-3" role="group" aria-label="음성 메트릭">
        <MetricCard
          label="발화 비율"
          value={`${Math.round(speechRatio * 100)}%`}
          color="blue"
          size="sm"
          ariaLabel={`발화 비율 ${Math.round(speechRatio * 100)}퍼센트`}
        />

        <MetricCard
          label="침묵 비율"
          value={`${Math.round(pauseRatio * 100)}%`}
          color="gray"
          size="sm"
          ariaLabel={`침묵 비율 ${Math.round(pauseRatio * 100)}퍼센트`}
        />

        <MetricCard
          label="평균 침묵"
          value={`${(averagePauseDuration / 1000).toFixed(1)}s`}
          color="purple"
          size="sm"
          ariaLabel={`평균 침묵 시간 ${(averagePauseDuration / 1000).toFixed(1)}초`}
        />

        <MetricCard
          label="최장 침묵"
          value={`${(longestPause / 1000).toFixed(1)}s`}
          color="red"
          size="sm"
          ariaLabel={`최장 침묵 시간 ${(longestPause / 1000).toFixed(1)}초`}
        />
      </div>

      {/* 발화 횟수 */}
      <div className="mb-3">
        <MetricCard
          label="발화 횟수"
          value={`${speechBurstCount}회`}
          color="green"
          size="sm"
          ariaLabel={`발화 횟수 ${speechBurstCount}회`}
        />
      </div>

      {/* 요약 */}
      <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
        <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">분석 요약</div>
        <div className="text-sm text-gray-700 dark:text-gray-300" role="status" aria-live="polite">
          {summary}
        </div>
      </div>

      {/* 발화/침묵 비율 바 */}
      <div className="mt-3" role="img" aria-label={`발화 ${Math.round(speechRatio * 100)}퍼센트, 침묵 ${Math.round(pauseRatio * 100)}퍼센트`}>
        <div className="flex h-2 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700">
          <div
            className="bg-blue-500 transition-all duration-300"
            style={{ width: `${speechRatio * 100}%` }}
            aria-hidden="true"
          ></div>
          <div
            className="bg-gray-400 dark:bg-gray-600 transition-all duration-300"
            style={{ width: `${pauseRatio * 100}%` }}
            aria-hidden="true"
          ></div>
        </div>
        <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
          <span>발화</span>
          <span>침묵</span>
        </div>
      </div>
    </div>
  );
}
