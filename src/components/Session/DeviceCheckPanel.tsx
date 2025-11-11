import { useState, useEffect } from 'react';
import { useMetricsStore } from '../../stores/metricsStore';
import { sessionAPI } from '../../services/api';
import { Logger } from '../../config/env';
import CameraCheck from './DeviceCheck/CameraCheck';
import MicrophoneCheck from './DeviceCheck/MicrophoneCheck';
import NetworkCheck from './DeviceCheck/NetworkCheck';
import DeviceCheckStatus from './DeviceCheck/DeviceCheckStatus';
import { getMessageStyle, ERROR_MESSAGES } from '../../utils/messageHelper';

interface DeviceCheckState {
  camera: {
    available: boolean;
    permission: 'granted' | 'denied' | 'prompt';
    hasError: boolean;
    errorMessage?: string;
  };
  microphone: {
    available: boolean;
    permission: 'granted' | 'denied' | 'prompt';
    hasError: boolean;
    errorMessage?: string;
  };
  network: {
    latency: number;
    bandwidth: number;
    isGood: boolean;
  };
  isChecking: boolean;
  canProceed: boolean;
}

interface DeviceCheckPanelProps {
  onComplete?: (status: DeviceCheckState) => void;
  onSkip?: () => void;
  showSkipButton?: boolean;
}

/**
 * Device Check Panel (Phase 9)
 *
 * 세션 시작 전 카메라, 마이크, 네트워크를 점검합니다.
 * - 카메라 권한 및 사용 가능 여부
 * - 마이크 권한 및 음성 활동 감지(VAD)
 * - 네트워크 지연 시간 및 대역폭
 * - 각 장치별 권한 가이드 표시
 */
export default function DeviceCheckPanel({
  onComplete,
  onSkip,
  showSkipButton = false,
}: DeviceCheckPanelProps) {
  const [state, setState] = useState<DeviceCheckState>({
    camera: { available: false, permission: 'prompt', hasError: false },
    microphone: { available: false, permission: 'prompt', hasError: false },
    network: { latency: 0, bandwidth: 0, isGood: false },
    isChecking: true,
    canProceed: false,
  });

  const addError = useMetricsStore((s) => s.addError);

  // Phase 1: Initial device check from API
  useEffect(() => {
    const checkDevices = async () => {
      try {
        Logger.info('🔍 Starting device check');
        const result = await sessionAPI.checkDevices();

        setState((prev) => ({
          ...prev,
          camera: {
            available: result.camera.available,
            permission: result.camera.permission,
            hasError: result.camera.permission === 'denied',
            errorMessage:
              result.camera.permission === 'denied' ? ERROR_MESSAGES.CAMERA_PERMISSION_DENIED : undefined,
          },
          microphone: {
            available: result.microphone.available,
            permission: result.microphone.permission,
            hasError: result.microphone.permission === 'denied',
            errorMessage:
              result.microphone.permission === 'denied' ? ERROR_MESSAGES.MICROPHONE_PERMISSION_DENIED : undefined,
          },
          network: {
            latency: result.network.latency,
            bandwidth: result.network.bandwidth,
            isGood: result.network.latency < 3000 && result.network.bandwidth > 1,
          },
          isChecking: false,
        }));

        Logger.info('✅ Device check completed', {
          camera: result.camera.permission,
          microphone: result.microphone.permission,
          latency: result.network.latency,
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Device check failed';
        Logger.error('❌ Device check failed', message);
        addError(message, 'high');

        setState((prev) => ({
          ...prev,
          isChecking: false,
          camera: { ...prev.camera, hasError: true, errorMessage: ERROR_MESSAGES.CAMERA_CHECK_FAILED },
          microphone: { ...prev.microphone, hasError: true, errorMessage: ERROR_MESSAGES.MICROPHONE_CHECK_FAILED },
        }));
      }
    };

    checkDevices();
  }, [addError]);

  // Phase 2: Determine if we can proceed
  useEffect(() => {
    const can =
      !state.isChecking &&
      (state.camera.permission === 'granted' || state.camera.permission === 'prompt') &&
      (state.microphone.permission === 'granted' || state.microphone.permission === 'prompt') &&
      state.network.isGood;

    setState((prev) => ({ ...prev, canProceed: can }));
  }, [state.camera.permission, state.microphone.permission, state.network.isGood, state.isChecking]);

  const handleCameraPermissionRequested = (granted: boolean) => {
    setState((prev) => ({
      ...prev,
      camera: {
        ...prev.camera,
        permission: granted ? 'granted' : 'denied',
        hasError: !granted,
      },
    }));
  };

  const handleMicrophonePermissionRequested = (granted: boolean) => {
    setState((prev) => ({
      ...prev,
      microphone: {
        ...prev.microphone,
        permission: granted ? 'granted' : 'denied',
        hasError: !granted,
      },
    }));
  };

  const handleProceed = () => {
    if (state.canProceed && onComplete) {
      Logger.info('✅ Proceeding with session (device check passed)');
      onComplete(state);
    }
  };

  const handleSkip = () => {
    Logger.warn('⚠️ Device check skipped by user');
    if (onSkip) onSkip();
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-6 bg-white dark:bg-slate-800 rounded-lg shadow-lg">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          🔧 기기 점검
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          세션을 시작하기 전에 카메라, 마이크, 네트워크를 확인합니다.
        </p>
      </div>

      {/* Device Check Status */}
      <div className="mb-8">
        <DeviceCheckStatus state={state} isLoading={state.isChecking} />
      </div>

      {/* Device Check Sections */}
      <div className="space-y-6">
        {/* Camera Check */}
        <CameraCheck
          available={state.camera.available}
          permission={state.camera.permission}
          hasError={state.camera.hasError}
          errorMessage={state.camera.errorMessage}
          onPermissionRequested={handleCameraPermissionRequested}
        />

        {/* Microphone Check */}
        <MicrophoneCheck
          available={state.microphone.available}
          permission={state.microphone.permission}
          hasError={state.microphone.hasError}
          errorMessage={state.microphone.errorMessage}
          onPermissionRequested={handleMicrophonePermissionRequested}
        />

        {/* Network Check */}
        <NetworkCheck
          latency={state.network.latency}
          bandwidth={state.network.bandwidth}
          isGood={state.network.isGood}
        />
      </div>

      {/* Action Buttons */}
      <div className="mt-8 flex gap-4">
        <button
          onClick={handleProceed}
          disabled={!state.canProceed || state.isChecking}
          className={`flex-1 px-6 py-3 rounded-lg font-semibold text-white transition ${
            state.canProceed && !state.isChecking
              ? 'bg-blue-600 hover:bg-blue-700 cursor-pointer'
              : 'bg-gray-400 cursor-not-allowed opacity-50'
          }`}
        >
          {state.isChecking ? '🔄 확인 중...' : '✅ 계속 진행'}
        </button>

        {showSkipButton && (
          <button
            onClick={handleSkip}
            disabled={state.isChecking}
            className="flex-1 px-6 py-3 rounded-lg font-semibold border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700 transition"
          >
            ⏭️ 건너뛰기
          </button>
        )}
      </div>

      {/* Info Message */}
      {(state.camera.hasError || state.microphone.hasError) && (() => {
        const style = getMessageStyle('info');
        return (
          <div className={`mt-6 p-4 ${style.bgClass} border ${style.borderClass} rounded-lg`}>
            <p className={`text-sm ${style.textClass} font-medium`}>
              {style.icon} 권한이 거부된 경우, 브라우저 설정에서 권한을 변경하거나 페이지를 새로고침하세요.
            </p>
          </div>
        );
      })()}
    </div>
  );
}
