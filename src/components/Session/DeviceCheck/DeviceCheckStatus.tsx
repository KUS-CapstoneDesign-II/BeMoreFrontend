import { } from 'react';

interface StatusState {
  camera: {
    available: boolean;
    permission: 'granted' | 'denied' | 'prompt';
    hasError: boolean;
  };
  microphone: {
    available: boolean;
    permission: 'granted' | 'denied' | 'prompt';
    hasError: boolean;
  };
  network: {
    isGood: boolean;
  };
  isChecking: boolean;
}

interface DeviceCheckStatusProps {
  state: StatusState;
  isLoading?: boolean;
}

/**
 * Device Check Status Overview
 *
 * 모든 기기 점검 상태를 한눈에 보여주는 컴포넌트
 */
export default function DeviceCheckStatus({ state, isLoading = false }: DeviceCheckStatusProps) {
  const getDeviceStatus = (
    _available: boolean,
    permission: 'granted' | 'denied' | 'prompt',
    hasError: boolean
  ): { icon: string; text: string; color: string } => {
    if (hasError || permission === 'denied') {
      return { icon: '❌', text: '거부됨', color: 'red' };
    }
    if (permission === 'granted') {
      return { icon: '✅', text: '준비됨', color: 'green' };
    }
    if (permission === 'prompt') {
      return { icon: '⚠️', text: '확인 필요', color: 'yellow' };
    }
    return { icon: '❓', text: '불명', color: 'gray' };
  };

  const cameraStatus = getDeviceStatus(state.camera.available, state.camera.permission, state.camera.hasError);
  const micStatus = getDeviceStatus(state.microphone.available, state.microphone.permission, state.microphone.hasError);
  const networkStatus = {
    icon: state.network.isGood ? '✅' : '⚠️',
    text: state.network.isGood ? '양호' : '확인 필요',
    color: state.network.isGood ? 'green' : 'yellow',
  };

  const allReady =
    state.camera.permission === 'granted' &&
    state.microphone.permission === 'granted' &&
    state.network.isGood &&
    !state.isChecking;

  const getColorClass = (color: string) => {
    switch (color) {
      case 'green':
        return 'bg-green-100 dark:bg-green-900/30 border-green-200 dark:border-green-700';
      case 'red':
        return 'bg-red-100 dark:bg-red-900/30 border-red-200 dark:border-red-700';
      case 'yellow':
        return 'bg-yellow-100 dark:bg-yellow-900/30 border-yellow-200 dark:border-yellow-700';
      default:
        return 'bg-gray-100 dark:bg-gray-900/30 border-gray-200 dark:border-gray-700';
    }
  };

  const getTextColorClass = (color: string) => {
    switch (color) {
      case 'green':
        return 'text-green-700 dark:text-green-300';
      case 'red':
        return 'text-red-700 dark:text-red-300';
      case 'yellow':
        return 'text-yellow-700 dark:text-yellow-300';
      default:
        return 'text-gray-700 dark:text-gray-300';
    }
  };

  return (
    <div>
      {/* Overall Status */}
      <div
        className={`mb-6 p-4 rounded-lg border-2 ${
          isLoading
            ? 'bg-gray-50 dark:bg-gray-900/30 border-gray-300 dark:border-gray-600'
            : allReady
              ? 'bg-green-50 dark:bg-green-900/30 border-green-300 dark:border-green-600'
              : 'bg-yellow-50 dark:bg-yellow-900/30 border-yellow-300 dark:border-yellow-600'
        }`}
      >
        <div className="flex items-center justify-center text-center">
          {isLoading ? (
            <>
              <span className="text-3xl mr-3 animate-spin">⏳</span>
              <div>
                <p className="text-lg font-bold text-gray-900 dark:text-white">기기 확인 중...</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  잠시만 기다려주세요. 카메라, 마이크, 네트워크를 확인하고 있습니다.
                </p>
              </div>
            </>
          ) : allReady ? (
            <>
              <span className="text-3xl mr-3">🎉</span>
              <div>
                <p className="text-lg font-bold text-green-700 dark:text-green-300">모든 기기가 준비되었습니다!</p>
                <p className="text-sm text-green-600 dark:text-green-400">
                  이제 세션을 시작할 수 있습니다.
                </p>
              </div>
            </>
          ) : (
            <>
              <span className="text-3xl mr-3">⚠️</span>
              <div>
                <p className="text-lg font-bold text-yellow-700 dark:text-yellow-300">일부 기기 확인이 필요합니다</p>
                <p className="text-sm text-yellow-600 dark:text-yellow-400">
                  아래에서 각 기기를 확인하고 권한을 허용해주세요.
                </p>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Device Status Cards */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {/* Camera */}
        <div className={`p-4 rounded-lg border-2 ${getColorClass(cameraStatus.color)}`}>
          <p className="text-center mb-2">
            <span className="text-2xl">{cameraStatus.icon}</span>
          </p>
          <h4 className={`text-sm font-bold text-center ${getTextColorClass(cameraStatus.color)}`}>
            카메라
          </h4>
          <p className="text-xs text-center text-gray-600 dark:text-gray-400 mt-1">
            {cameraStatus.text}
          </p>
        </div>

        {/* Microphone */}
        <div className={`p-4 rounded-lg border-2 ${getColorClass(micStatus.color)}`}>
          <p className="text-center mb-2">
            <span className="text-2xl">{micStatus.icon}</span>
          </p>
          <h4 className={`text-sm font-bold text-center ${getTextColorClass(micStatus.color)}`}>
            마이크
          </h4>
          <p className="text-xs text-center text-gray-600 dark:text-gray-400 mt-1">
            {micStatus.text}
          </p>
        </div>

        {/* Network */}
        <div className={`p-4 rounded-lg border-2 ${getColorClass(networkStatus.color)}`}>
          <p className="text-center mb-2">
            <span className="text-2xl">{networkStatus.icon}</span>
          </p>
          <h4 className={`text-sm font-bold text-center ${getTextColorClass(networkStatus.color)}`}>
            네트워크
          </h4>
          <p className="text-xs text-center text-gray-600 dark:text-gray-400 mt-1">
            {networkStatus.text}
          </p>
        </div>
      </div>

      {/* Status Legend */}
      <div className="flex gap-4 justify-center text-xs text-gray-600 dark:text-gray-400">
        <div className="flex items-center gap-1">
          <span>✅ = 준비됨</span>
        </div>
        <div className="flex items-center gap-1">
          <span>⚠️ = 확인 필요</span>
        </div>
        <div className="flex items-center gap-1">
          <span>❌ = 거부됨</span>
        </div>
      </div>
    </div>
  );
}
