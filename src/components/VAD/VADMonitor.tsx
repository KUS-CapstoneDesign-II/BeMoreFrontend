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
      <div className={`p-4 rounded-lg bg-gray-100 ${className}`}>
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
    <div className={`p-4 rounded-lg bg-white border border-gray-200 shadow-sm ${className}`}>
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-700">음성 활동 분석</h3>
        <div className="flex items-center space-x-1">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-xs text-gray-500">실시간</span>
        </div>
      </div>

      {/* 메트릭 그리드 */}
      <div className="grid grid-cols-2 gap-3 mb-3">
        {/* 발화 비율 */}
        <div className="bg-blue-50 p-2 rounded">
          <div className="text-xs text-gray-600 mb-1">발화 비율</div>
          <div className="text-lg font-bold text-blue-600">
            {Math.round(speechRatio * 100)}%
          </div>
        </div>

        {/* 침묵 비율 */}
        <div className="bg-gray-50 p-2 rounded">
          <div className="text-xs text-gray-600 mb-1">침묵 비율</div>
          <div className="text-lg font-bold text-gray-600">
            {Math.round(pauseRatio * 100)}%
          </div>
        </div>

        {/* 평균 침묵 시간 */}
        <div className="bg-purple-50 p-2 rounded">
          <div className="text-xs text-gray-600 mb-1">평균 침묵</div>
          <div className="text-lg font-bold text-purple-600">
            {(averagePauseDuration / 1000).toFixed(1)}s
          </div>
        </div>

        {/* 최장 침묵 시간 */}
        <div className="bg-red-50 p-2 rounded">
          <div className="text-xs text-gray-600 mb-1">최장 침묵</div>
          <div className="text-lg font-bold text-red-600">
            {(longestPause / 1000).toFixed(1)}s
          </div>
        </div>
      </div>

      {/* 발화 횟수 */}
      <div className="mb-3 p-2 bg-green-50 rounded">
        <div className="text-xs text-gray-600 mb-1">발화 횟수</div>
        <div className="text-lg font-bold text-green-600">{speechBurstCount}회</div>
      </div>

      {/* 요약 */}
      <div className="pt-3 border-t border-gray-200">
        <div className="text-xs text-gray-500 mb-1">분석 요약</div>
        <div className="text-sm text-gray-700">{summary}</div>
      </div>

      {/* 발화/침묵 비율 바 */}
      <div className="mt-3">
        <div className="flex h-2 rounded-full overflow-hidden">
          <div
            className="bg-blue-500 transition-all duration-300"
            style={{ width: `${speechRatio * 100}%` }}
          ></div>
          <div
            className="bg-gray-300 transition-all duration-300"
            style={{ width: `${pauseRatio * 100}%` }}
          ></div>
        </div>
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>발화</span>
          <span>침묵</span>
        </div>
      </div>
    </div>
  );
}
