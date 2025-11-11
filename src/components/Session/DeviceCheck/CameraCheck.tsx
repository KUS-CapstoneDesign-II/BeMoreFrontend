import { useRef, useEffect, useState } from 'react';
import { Logger } from '../../../config/env';
import { PermissionErrorCard } from '../../Common/PermissionErrorCard';
import { getMessageStyle, ERROR_MESSAGES } from '../../../utils/messageHelper';

interface CameraCheckProps {
  available: boolean;
  permission: 'granted' | 'denied' | 'prompt';
  hasError: boolean;
  errorMessage?: string;
  onPermissionRequested?: (granted: boolean) => void;
}

/**
 * Camera Check Component
 *
 * 카메라 사용 가능 여부 확인 및 권한 요청
 */
export default function CameraCheck({
  available,
  permission,
  hasError,
  errorMessage,
  onPermissionRequested,
}: CameraCheckProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [previewActive, setPreviewActive] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState(permission);
  const [showPermissionError, setShowPermissionError] = useState(false);

  useEffect(() => {
    setPermissionStatus(permission);
  }, [permission]);

  const requestPermission = async () => {
    try {
      Logger.info('🎥 Requesting camera permission');

      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error(ERROR_MESSAGES.CAMERA_NOT_SUPPORTED);
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user',
        },
        audio: false, // Only video for camera check
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setPreviewActive(true);
        setPermissionStatus('granted');
        onPermissionRequested?.(true);
        Logger.info('✅ Camera permission granted');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      Logger.error('❌ Camera permission denied', message);
      setPermissionStatus('denied');
      setPreviewActive(false);
      onPermissionRequested?.(false);

      // Show friendly error card
      setShowPermissionError(true);
    }
  };

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach((track) => track.stop());
      videoRef.current.srcObject = null;
      setPreviewActive(false);
      Logger.info('📹 Camera stopped');
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
          {getStatusIcon()} 카메라
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

      {/* Permission Error Card - 친화적 오류 처리 */}
      {showPermissionError && permissionStatus === 'denied' && (
        <div className="mb-4">
          <PermissionErrorCard
            type="camera"
            onRetry={() => {
              setShowPermissionError(false);
              requestPermission();
            }}
            onSkip={() => setShowPermissionError(false)}
          />
        </div>
      )}

      {/* Generic Error Message (fallback) */}
      {errorMessage && !showPermissionError && (() => {
        const style = getMessageStyle('error');
        return (
          <div className={`mb-4 p-3 ${style.bgClass} border ${style.borderClass} rounded-lg`}>
            <p className={`${style.textClass} text-sm font-medium`}>
              {style.icon} {errorMessage}
            </p>
          </div>
        );
      })()}

      {/* Video Preview */}
      {available && !showPermissionError && (
        <div className="mb-4">
          {previewActive ? (
            <div className="bg-black rounded-lg overflow-hidden">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="w-full"
                style={{ maxHeight: '300px' }}
              />
            </div>
          ) : (
            <div className="bg-gray-100 dark:bg-gray-900 rounded-lg flex items-center justify-center aspect-video">
              <p className="text-gray-500 dark:text-gray-400 text-center">
                📹 카메라 미리보기
                <br />
                <span className="text-sm">권한을 허용하면 미리보기가 표시됩니다</span>
              </p>
            </div>
          )}
        </div>
      )}

      {/* Action Buttons */}
      {available && !showPermissionError && (
        <div className="flex gap-2">
          {permissionStatus !== 'granted' ? (
            <button
              onClick={requestPermission}
              className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition min-h-[44px]"
            >
              🎥 권한 요청
            </button>
          ) : (
            <button
              onClick={stopCamera}
              className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition min-h-[44px]"
            >
              🛑 카메라 중지
            </button>
          )}
        </div>
      )}

      {!available && (() => {
        const style = getMessageStyle('warning');
        return (
          <div className={`p-3 ${style.bgClass} border ${style.borderClass} rounded-lg`}>
            <p className={`${style.textClass} text-sm font-medium`}>
              {style.icon} {ERROR_MESSAGES.CAMERA_NOT_SUPPORTED}
            </p>
          </div>
        );
      })()}
    </div>
  );
}
