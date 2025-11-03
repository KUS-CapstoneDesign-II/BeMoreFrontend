import { useRef, useEffect, useState } from 'react';
import { Logger } from '../../../config/env';

interface PermissionGuide {
  title: string;
  steps: string[];
  icon?: string;
}

interface CameraCheckProps {
  available: boolean;
  permission: 'granted' | 'denied' | 'prompt';
  hasError: boolean;
  errorMessage?: string;
  onPermissionRequested?: (granted: boolean) => void;
  guide?: PermissionGuide;
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
  guide,
}: CameraCheckProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [previewActive, setPreviewActive] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState(permission);
  const [showGuide, setShowGuide] = useState(false);

  useEffect(() => {
    setPermissionStatus(permission);
  }, [permission]);

  const requestPermission = async () => {
    try {
      Logger.info('🎥 Requesting camera permission');

      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error('카메라를 지원하지 않는 브라우저입니다');
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

      // Show guide if available
      if (guide && permission === 'prompt') {
        setShowGuide(true);
      }
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

      {/* Error Message */}
      {errorMessage && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded text-red-700 dark:text-red-300 text-sm">
          {errorMessage}
        </div>
      )}

      {/* Video Preview */}
      {available && (
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
              🎥 권한 요청
            </button>
          ) : (
            <button
              onClick={stopCamera}
              className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition"
            >
              🛑 카메라 중지
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
          ⚠️ 이 브라우저에서는 카메라를 지원하지 않습니다.
        </div>
      )}
    </div>
  );
}
