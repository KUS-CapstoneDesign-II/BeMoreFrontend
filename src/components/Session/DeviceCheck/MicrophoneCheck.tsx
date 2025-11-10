import { useRef, useEffect, useState, useCallback } from 'react';
import { useMetricsStore } from '../../../stores/metricsStore';
import { Logger } from '../../../config/env';

interface PermissionGuide {
  title: string;
  steps: string[];
  icon?: string;
}

interface MicrophoneCheckProps {
  available: boolean;
  permission: 'granted' | 'denied' | 'prompt';
  hasError: boolean;
  errorMessage?: string;
  onPermissionRequested?: (granted: boolean) => void;
  guide?: PermissionGuide;
}

/**
 * Microphone Check Component
 *
 * 마이크 권한 및 음성 활동 감지(VAD) 확인
 * 실시간 음성 레벨 표시
 */
export default function MicrophoneCheck({
  available,
  permission,
  hasError,
  errorMessage,
  onPermissionRequested,
  guide,
}: MicrophoneCheckProps) {
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const [permissionStatus, setPermissionStatus] = useState(permission);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [showGuide, setShowGuide] = useState(false);

  const setAudioLevelMetric = useMetricsStore((s) => s.setAudioLevel);

  useEffect(() => {
    setPermissionStatus(permission);
  }, [permission]);

  const stopMonitoring = useCallback(() => {
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    analyserRef.current = null;
    setIsMonitoring(false);
    setAudioLevel(0);
    setAudioLevelMetric(0);
    Logger.info('📹 Microphone monitoring stopped');
  }, [setAudioLevelMetric]);

  // Cleanup audio monitoring
  useEffect(() => {
    return () => {
      if (isMonitoring) {
        stopMonitoring();
      }
    };
  }, [isMonitoring, stopMonitoring]);

  const requestPermission = async () => {
    try {
      Logger.info('🎤 Requesting microphone permission');

      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error('마이크를 지원하지 않는 브라우저입니다');
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: false,
        },
        video: false,
      });

      setPermissionStatus('granted');
      onPermissionRequested?.(true);

      // Start monitoring audio levels
      startMonitoring(stream);

      Logger.info('✅ Microphone permission granted');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      Logger.error('❌ Microphone permission denied', message);
      setPermissionStatus('denied');
      setIsMonitoring(false);
      onPermissionRequested?.(false);

      if (guide && permission === 'prompt') {
        setShowGuide(true);
      }
    }
  };

  const startMonitoring = (stream: MediaStream) => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const analyser = audioContext.createAnalyser();
      const source = audioContext.createMediaStreamSource(stream);

      source.connect(analyser);
      analyser.fftSize = 256;

      audioContextRef.current = audioContext;
      analyserRef.current = analyser;

      setIsMonitoring(true);

      // Monitor audio levels
      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      const monitor = () => {
        if (!analyserRef.current) return;

        analyserRef.current.getByteFrequencyData(dataArray);

        // Calculate RMS (Root Mean Square) for audio level
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i] * dataArray[i];
        }
        const rms = Math.sqrt(sum / dataArray.length);

        // Convert to 0-100 scale
        const level = Math.min(100, (rms / 128) * 100);
        setAudioLevel(level);
        setAudioLevelMetric(level);

        if (isMonitoring) {
          requestAnimationFrame(monitor);
        }
      };

      monitor();
      Logger.info('🎤 Audio monitoring started');
    } catch (error) {
      Logger.error('❌ Audio monitoring setup failed', error);
      setIsMonitoring(false);
    }
  };

  const getStatusIcon = () => {
    if (hasError || permissionStatus === 'denied') return '❌';
    if (permissionStatus === 'granted') return '✅';
    return '❓';
  };

  return (
    <div className="p-4 border-2 border-gray-200 dark:border-gray-700 rounded-lg">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          {getStatusIcon()} 마이크
        </h3>
        <span
          className={`text-sm px-3 py-1 rounded-full font-medium
            ${
              permissionStatus === 'granted'
                ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                : permissionStatus === 'denied'
                  ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                  : 'bg-gray-100 dark:bg-gray-900/30 text-gray-700 dark:text-gray-300'
            }
          `}
        >
          {permissionStatus === 'granted'
            ? '사용 가능'
            : permissionStatus === 'denied'
              ? '거부됨'
              : '확인 필요'}
        </span>
      </div>

      {/* Error Message */}
      {errorMessage && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded text-red-700 dark:text-red-300 text-sm">
          {errorMessage}
        </div>
      )}

      {/* Audio Level Meter */}
      {isMonitoring && (
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              음성 레벨
            </label>
            <span className="text-sm text-gray-600 dark:text-gray-400">{Math.round(audioLevel)}%</span>
          </div>
          <div className="w-full h-8 bg-gray-200 dark:bg-gray-700 rounded-lg overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-green-500 via-yellow-500 to-red-500 transition-all duration-100"
              style={{ width: `${audioLevel}%` }}
            />
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
            {audioLevel > 30 ? '✅ 음성이 감지되었습니다' : '🔇 말씀해주세요...'}
          </p>
        </div>
      )}

      {/* Permission Guide */}
      {showGuide && guide && (
        <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded">
          <h4 className="font-semibold text-blue-900 dark:text-blue-300 mb-2">{guide.title}</h4>
          <ol className="list-decimal list-inside space-y-1 text-sm text-blue-800 dark:text-blue-200">
            {guide.steps.map((step, idx) => (
              <li key={idx}>{step}</li>
            ))}
          </ol>
        </div>
      )}

      {/* Action Buttons */}
      {available && (
        <div className="flex gap-2">
          {permissionStatus !== 'granted' ? (
            <button
              onClick={requestPermission}
              className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition"
            >
              🎤 권한 요청
            </button>
          ) : (
            <button
              onClick={stopMonitoring}
              className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition"
            >
              🛑 모니터링 중지
            </button>
          )}

          {!available && (
            <button
              onClick={() => setShowGuide(!showGuide)}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-gray-900/30 transition"
            >
              {showGuide ? '📖 가이드 숨기기' : '📖 가이드 보기'}
            </button>
          )}
        </div>
      )}

      {!available && (
        <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded text-yellow-700 dark:text-yellow-300 text-sm">
          ⚠️ 이 브라우저에서는 마이크를 지원하지 않습니다.
        </div>
      )}
    </div>
  );
}
