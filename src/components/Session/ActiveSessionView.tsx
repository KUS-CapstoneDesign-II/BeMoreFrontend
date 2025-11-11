import { useEffect, useState } from 'react';
import { useSessionStore } from '../../stores/sessionStore';
import { useMetricsStore } from '../../stores/metricsStore';
import { useTimelineStore } from '../../stores/timelineStore';
import { Logger } from '../../config/env';
import { useToast } from '../../contexts/ToastContext';
import { getVadStatusSummary } from '../../utils/vadMetricsHelper';

interface ActiveSessionViewProps {
  sessionId: string;
  onSessionEnded?: () => void;
  maxDuration?: number; // milliseconds
}

/**
 * Active Session View (Phase 9-3)
 *
 * 진행 중인 세션을 표시합니다:
 * - 경과 시간 표시
 * - 실시간 메트릭 (FPS, 오디오 레벨, 네트워크 지연)
 * - 타임라인 카드 진행 상황
 * - 세션 종료 버튼
 */
export default function ActiveSessionView({
  sessionId,
  onSessionEnded,
  maxDuration = 30 * 60 * 1000, // 30 minutes default
}: ActiveSessionViewProps) {
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isEnding, setIsEnding] = useState(false);
  const [showQuitConfirm, setShowQuitConfirm] = useState(false);
  const [endSessionError, setEndSessionError] = useState<string | null>(null);

  const { addToast } = useToast();

  const sessionState = useSessionStore((s) => ({
    minuteIndex: s.minuteIndex,
    incrementMinuteIndex: s.incrementMinuteIndex,
    endSession: s.endSession,
  }));

  const metricsState = useMetricsStore((s) => ({
    fps: s.fps,
    audioLevel: s.audioLevel,
    vadState: s.vadState,
    networkLatency: s.networkLatency,
    queueLength: s.queueLength,
    getHealthStatus: s.getHealthStatus,
  }));

  const timelineCards = useTimelineStore((s) => s.cards);

  // Timer for elapsed time
  useEffect(() => {
    const interval = setInterval(() => {
      setElapsedTime((prev) => prev + 1000);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Minute-based progression
  useEffect(() => {
    const minuteTimer = setInterval(() => {
      sessionState.incrementMinuteIndex();
      Logger.info('⏱️ Minute incremented', { minuteIndex: sessionState.minuteIndex + 1 });
    }, 60 * 1000);

    return () => clearInterval(minuteTimer);
  }, [sessionState]);

  const handleEndSession = async () => {
    setIsEnding(true);
    setEndSessionError(null);

    // Show background retry notification (persistent)
    addToast('🔄 세션 종료 중... (자동 재시도 진행)', 'info', 0);

    try {
      Logger.info('🛑 Ending session', { sessionId, duration: elapsedTime });
      await sessionState.endSession();

      Logger.info('✅ Session ended successfully');

      // Show success toast
      addToast('✅ 세션이 정상 종료되었습니다', 'success', 3000);

      if (onSessionEnded) {
        onSessionEnded();
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '세션 종료 중 오류가 발생했습니다';
      Logger.error('❌ Failed to end session', error);
      setEndSessionError(errorMessage);
      setIsEnding(false);

      // Show error toast
      addToast(`❌ 세션 종료 실패: ${errorMessage}`, 'error', 5000);
    }
  };

  const formatTime = (ms: number) => {
    const seconds = Math.floor((ms / 1000) % 60);
    const minutes = Math.floor((ms / (1000 * 60)) % 60);
    const hours = Math.floor((ms / (1000 * 60 * 60)) % 24);

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const getHealthColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300';
      case 'warning':
        return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300';
      case 'error':
        return 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300';
      default:
        return 'bg-gray-100 dark:bg-gray-900/30 text-gray-700 dark:text-gray-300';
    }
  };

  const healthStatus = metricsState.getHealthStatus();
  const progressPercent = (elapsedTime / maxDuration) * 100;

  return (
    <div className="w-full h-full bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                🎤 상담 세션 진행 중
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Session ID: <span className="font-mono text-sm">{sessionId}</span>
              </p>
            </div>
            <div className="text-right">
              <div className="text-5xl font-bold text-blue-600 dark:text-blue-400 font-mono">
                {formatTime(elapsedTime)}
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">경과 시간</p>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 transition-all duration-300"
              style={{ width: `${Math.min(progressPercent, 100)}%` }}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Health Status */}
            <div className={`p-6 rounded-lg border-2 border-transparent ${getHealthColor(healthStatus)}`}>
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold">
                    {healthStatus === 'healthy'
                      ? '✅ 시스템 정상'
                      : healthStatus === 'warning'
                        ? '⚠️ 주의 필요'
                        : '❌ 에러 발생'}
                  </h2>
                  <p className="text-sm mt-1 opacity-80">
                    {healthStatus === 'healthy'
                      ? '모든 시스템이 정상 작동 중입니다.'
                      : healthStatus === 'warning'
                        ? '일부 지표가 권장 범위를 벗어났습니다.'
                        : '시스템 오류가 감지되었습니다.'}
                  </p>
                </div>
              </div>
            </div>

            {/* Real-time Metrics */}
            <div className="grid grid-cols-2 gap-4">
              {/* FPS */}
              <div className="p-4 bg-white dark:bg-slate-700 rounded-lg border border-gray-200 dark:border-gray-600">
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">FPS</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {metricsState.fps.toFixed(1)}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {metricsState.fps >= 15 ? '✅ 최적' : metricsState.fps >= 12 ? '⚠️ 보통' : '❌ 저조'}
                </p>
              </div>

              {/* Voice Status (User-Friendly) */}
              <div className="p-4 bg-white dark:bg-slate-700 rounded-lg border border-gray-200 dark:border-gray-600">
                {(() => {
                  const vadStatus = getVadStatusSummary(metricsState.audioLevel, metricsState.vadState);
                  return (
                    <>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">목소리</p>
                      <div className="flex items-center gap-2 mb-2">
                        <div className="flex-1 h-3 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-green-500 via-yellow-500 to-red-500 transition-all"
                            style={{ width: `${metricsState.audioLevel}%` }}
                          />
                        </div>
                        <p className={`text-sm font-bold w-14 text-right ${vadStatus.colorClass}`}>
                          {vadStatus.levelIcon} {vadStatus.levelText}
                        </p>
                      </div>
                      <p className={`text-xs font-medium ${vadStatus.colorClass}`}>
                        {vadStatus.icon} {vadStatus.text}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {vadStatus.guidance}
                      </p>
                    </>
                  );
                })()}
              </div>

              {/* Network Latency */}
              <div className="p-4 bg-white dark:bg-slate-700 rounded-lg border border-gray-200 dark:border-gray-600">
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">네트워크 지연</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {metricsState.networkLatency.toFixed(0)}
                  <span className="text-sm ml-1">ms</span>
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {metricsState.networkLatency < 100
                    ? '✅ 우수'
                    : metricsState.networkLatency < 300
                      ? '⚠️ 보통'
                      : '❌ 불량'}
                </p>
              </div>

              {/* Queue Length */}
              <div className="p-4 bg-white dark:bg-slate-700 rounded-lg border border-gray-200 dark:border-gray-600">
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">대기 중인 데이터</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {metricsState.queueLength}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {metricsState.queueLength === 0
                    ? '✅ 정상'
                    : metricsState.queueLength < 10
                      ? '⚠️ 축적'
                      : '❌ 적체'}
                </p>
              </div>
            </div>

            {/* Timeline Cards Progress */}
            <div className="p-4 bg-white dark:bg-slate-700 rounded-lg border border-gray-200 dark:border-gray-600">
              <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-3">
                📊 타임라인 카드: {timelineCards.length}개 수집됨
              </h3>
              <div className="flex flex-wrap gap-2">
                {Array.from({ length: sessionState.minuteIndex + 1 }).map((_, idx) => {
                  const card = timelineCards.find((c) => c.minuteIndex === idx);
                  return (
                    <div
                      key={idx}
                      className={`px-3 py-2 rounded-lg text-xs font-medium transition ${
                        card
                          ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                          : idx === sessionState.minuteIndex
                            ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 animate-pulse'
                            : 'bg-gray-100 dark:bg-gray-900/30 text-gray-600 dark:text-gray-400'
                      }`}
                      title={card ? `점수: ${card.combinedScore.toFixed(1)}` : 'Minute ' + idx}
                    >
                      {idx + 1}분
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Sidebar - Actions */}
          <div className="space-y-4">
            {/* Session Info */}
            <div className="p-4 bg-white dark:bg-slate-700 rounded-lg border border-gray-200 dark:border-gray-600">
              <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-3">📋 세션 정보</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">현재 분:</span>
                  <span className="font-bold text-gray-900 dark:text-white">
                    {sessionState.minuteIndex + 1}분
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">카드 수집:</span>
                  <span className="font-bold text-gray-900 dark:text-white">
                    {timelineCards.length}개
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">상태:</span>
                  <span className="font-bold text-green-600 dark:text-green-400">진행 중</span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <button
              onClick={() => setShowQuitConfirm(true)}
              disabled={isEnding}
              className={`w-full px-4 py-3 rounded-lg font-bold transition ${
                isEnding
                  ? 'bg-gray-400 cursor-not-allowed opacity-50'
                  : 'bg-red-600 hover:bg-red-700 text-white cursor-pointer'
              }`}
            >
              {isEnding ? '⏳ 종료 중...' : '🛑 세션 종료'}
            </button>

            {/* Confirmation Dialog */}
            {showQuitConfirm && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                <div className="bg-white dark:bg-slate-800 rounded-lg p-6 max-w-sm">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3">
                    ⚠️ 세션을 종료하시겠습니까?
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-6">
                    현재까지 수집된 데이터({timelineCards.length}분)가 저장됩니다.
                  </p>

                  {/* Error Message Display */}
                  {endSessionError && (
                    <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg">
                      <p className="text-sm text-red-800 dark:text-red-200">
                        <span className="font-bold">❌ 오류: </span>
                        {endSessionError}
                      </p>
                      <p className="text-xs text-red-700 dark:text-red-300 mt-2">
                        자동 재시도가 백그라운드에서 진행 중입니다. 계속 진행을 눌러 팝업을 닫을 수 있습니다.
                      </p>
                    </div>
                  )}

                  <div className="flex gap-3">
                    <button
                      onClick={() => {
                        // Only close popup, keep error state if retry is ongoing
                        setShowQuitConfirm(false);
                        // Don't clear error if isEnding is true (background retry in progress)
                        if (!isEnding) {
                          setEndSessionError(null);
                        }
                      }}
                      disabled={isEnding && !endSessionError} // Disable if ending without error
                      className={`flex-1 px-4 py-2 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium transition ${
                        isEnding && !endSessionError
                          ? 'opacity-50 cursor-not-allowed'
                          : 'hover:bg-gray-50 dark:hover:bg-gray-900/30'
                      }`}
                    >
                      {isEnding ? '백그라운드 진행 중...' : '계속 진행'}
                    </button>
                    <button
                      onClick={handleEndSession}
                      disabled={isEnding && !endSessionError} // Enable retry if error exists
                      className={`flex-1 px-4 py-2 bg-red-600 text-white rounded-lg font-medium transition ${
                        isEnding && !endSessionError
                          ? 'opacity-50 cursor-not-allowed'
                          : 'hover:bg-red-700'
                      }`}
                    >
                      {isEnding && !endSessionError
                        ? '⏳ 종료 중...'
                        : endSessionError
                          ? '🔄 다시 시도'
                          : '종료 확인'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Tips */}
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg">
              <h4 className="text-xs font-bold text-blue-900 dark:text-blue-300 mb-2">💡 팁</h4>
              <ul className="text-xs text-blue-800 dark:text-blue-200 space-y-1">
                <li>• 조용한 환경 유지</li>
                <li>• 카메라를 마주 보기</li>
                <li>• 안정적인 네트워크 확인</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
