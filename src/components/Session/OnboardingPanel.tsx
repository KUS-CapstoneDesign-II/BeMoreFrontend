import { useState } from 'react';
import { useSessionStore } from '../../stores/sessionStore';
import { useMetricsStore } from '../../stores/metricsStore';
import { Logger } from '../../config/env';
import DeviceCheckPanel from './DeviceCheckPanel';

interface OnboardingPanelProps {
  userId: string;
  counselorId: string;
  onSessionStarted?: (sessionId: string) => void;
  onError?: (error: string) => void;
}

const ONBOARDING_STEPS = {
  DEVICE_CHECK: 'device_check',
  SESSION_INIT: 'session_init',
  READY: 'ready',
} as const;

type OnboardingStep = (typeof ONBOARDING_STEPS)[keyof typeof ONBOARDING_STEPS];

/**
 * Onboarding Panel (Phase 9-3)
 *
 * 기기 점검부터 세션 시작까지의 흐름을 관리합니다:
 * 1. 기기 점검 (DeviceCheckPanel)
 * 2. 세션 초기화 (서버에서 sessionId 받기)
 * 3. 준비 완료 (세션 캡처 시작 대기)
 */
export default function OnboardingPanel({
  userId,
  counselorId,
  onSessionStarted,
  onError,
}: OnboardingPanelProps) {
  const [step, setStep] = useState<OnboardingStep>(ONBOARDING_STEPS.DEVICE_CHECK);
  const [error, setError] = useState<string | null>(null);

  const startSession = useSessionStore((s) => s.startSession);
  const resetMetrics = useMetricsStore((s) => s.reset);
  const addError = useMetricsStore((s) => s.addError);

  interface DeviceCheckState {
    camera: { permission: string };
    microphone: { permission: string };
    network?: { isGood: boolean };
  }

  const handleDeviceCheckComplete = async (deviceState: DeviceCheckState) => {
    Logger.info('✅ Device check completed, initializing session', {
      camera: deviceState.camera.permission,
      microphone: deviceState.microphone.permission,
    });

    setStep(ONBOARDING_STEPS.SESSION_INIT);
    setError(null);

    try {
      // Reset metrics for new session
      resetMetrics();

      // Start session via store (which calls API)
      const sessionId = await startSession(userId, counselorId);

      if (!sessionId) {
        throw new Error('세션 시작에 실패했습니다. 다시 시도해주세요.');
      }

      Logger.info('✅ Session started', { sessionId });
      setStep(ONBOARDING_STEPS.READY);

      // Callback
      if (onSessionStarted) {
        onSessionStarted(sessionId);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      Logger.error('❌ Session initialization failed', message);
      setError(message);
      addError(message, 'high');

      if (onError) {
        onError(message);
      }

      // Reset to device check to try again
      setStep(ONBOARDING_STEPS.DEVICE_CHECK);
    }
  };

  const handleDeviceCheckSkip = () => {
    Logger.warn('⚠️ Device check skipped');
    // Still proceed to session init even if devices skipped
    handleDeviceCheckComplete({
      camera: { permission: 'prompt' },
      microphone: { permission: 'prompt' },
      network: { isGood: false },
    });
  };

  const handleRetry = () => {
    setError(null);
    setStep(ONBOARDING_STEPS.DEVICE_CHECK);
  };

  return (
    <div className="w-full min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-slate-900 dark:to-slate-800 p-4">
      <div className="max-w-2xl mx-auto">
        {/* Progress Indicator (Miller의 법칙: 명확한 진행 상태) */}
        <div className="mb-8">
          {/* 진행 단계 텍스트 */}
          <div className="text-center mb-4">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
              진행 중: {['device_check', 'session_init', 'ready'].indexOf(step) + 1} / 3 단계
            </p>
          </div>

          {/* 진행 바 */}
          <div className="flex items-center justify-between mb-4">
            {[
              { step: ONBOARDING_STEPS.DEVICE_CHECK, label: '기기 점검' },
              { step: ONBOARDING_STEPS.SESSION_INIT, label: '세션 초기화' },
              { step: ONBOARDING_STEPS.READY, label: '준비 완료' },
            ].map((item, idx) => (
              <div key={item.step} className="flex items-center flex-1">
                <div className="flex flex-col items-center flex-1">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition mb-2 ${
                      step === item.step
                        ? 'bg-blue-600 text-white shadow-lg'
                        : ['device_check', 'session_init', 'ready'].indexOf(step) >
                            ['device_check', 'session_init', 'ready'].indexOf(item.step)
                          ? 'bg-green-500 text-white'
                          : 'bg-gray-300 dark:bg-gray-600 text-gray-600 dark:text-gray-400'
                    }`}
                  >
                    {['device_check', 'session_init', 'ready'].indexOf(step) >
                    ['device_check', 'session_init', 'ready'].indexOf(item.step)
                      ? '✅'
                      : idx + 1}
                  </div>
                  <span className="text-xs font-medium text-gray-700 dark:text-gray-300 text-center">
                    {item.label}
                  </span>
                </div>
                {idx < 2 && (
                  <div
                    className={`h-1 w-full transition ${
                      ['device_check', 'session_init', 'ready'].indexOf(step) >
                      ['device_check', 'session_init', 'ready'].indexOf(item.step)
                        ? 'bg-green-500'
                        : 'bg-gray-300 dark:bg-gray-600'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl p-8">
          {step === ONBOARDING_STEPS.DEVICE_CHECK && (
            <DeviceCheckPanel
              onComplete={handleDeviceCheckComplete}
              onSkip={handleDeviceCheckSkip}
              showSkipButton={true}
            />
          )}

          {step === ONBOARDING_STEPS.SESSION_INIT && (
            <div className="text-center py-12">
              <div className="mb-6 flex justify-center">
                <div className="animate-spin">
                  <span className="text-5xl">⚙️</span>
                </div>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                세션 초기화 중...
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-8">
                서버에서 세션을 설정하고 있습니다. 잠시만 기다려주세요.
              </p>

              {error && (
                <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg">
                  <p className="text-red-700 dark:text-red-300 font-medium mb-4">{error}</p>
                  <button
                    onClick={handleRetry}
                    className="px-6 py-2 min-h-[44px] bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
                  >
                    🔄 다시 시도
                  </button>
                </div>
              )}

              <div className="flex justify-center gap-2">
                <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" />
                <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
              </div>
            </div>
          )}

          {step === ONBOARDING_STEPS.READY && (
            <div className="text-center py-12">
              <div className="mb-6 text-6xl animate-bounce">🎉</div>
              <h2 className="text-2xl font-bold text-green-700 dark:text-green-400 mb-3">
                모든 준비가 완료되었습니다!
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-8">
                이제 상담 세션을 시작할 수 있습니다. 준비가 되면 아래 버튼을 클릭하세요.
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-500">
                시스템이 자동으로 다음 단계로 전환됩니다...
              </p>
            </div>
          )}
        </div>

        {/* Footer Info */}
        <div className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
          <p>BeMore 상담 세션 • 안전하고 개인정보 보호됨</p>
        </div>
      </div>
    </div>
  );
}
