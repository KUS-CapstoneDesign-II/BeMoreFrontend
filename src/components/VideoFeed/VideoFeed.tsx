import { useRef, useEffect, useCallback } from 'react';
import { useMediaPipe } from '../../hooks/useMediaPipe';
import type { Results } from '@mediapipe/face_mesh';

interface VideoFeedProps {
  onLandmarks?: (results: Results) => void;
  className?: string;
  /** When this value changes, the component will attempt to (re)start the camera */
  startTrigger?: string | number | null;
  /** WebSocket for sending landmarks data */
  landmarksWebSocket?: WebSocket | null;
}

/**
 * VideoFeed 컴포넌트
 *
 * 카메라 스트림을 표시하고 MediaPipe로 얼굴 랜드마크를 감지합니다.
 * 감지된 랜드마크는 WebSocket을 통해 백엔드로 전송됩니다 (3프레임마다 1회).
 */
export function VideoFeed({
  onLandmarks,
  className = '',
  startTrigger = null,
  landmarksWebSocket = null
}: VideoFeedProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameCountRef = useRef(0);

  // 랜드마크 그리기 (메인 스레드에서만 실행 - Worker 제거)
  const drawLandmarks = useCallback((results: Results) => {
    if (!canvasRef.current || !videoRef.current) return;

    const canvas = canvasRef.current;
    const points = (results?.multiFaceLandmarks && Array.isArray(results.multiFaceLandmarks))
      ? (results.multiFaceLandmarks[0] as unknown as Array<{ x: number; y: number }>)
      : ([] as Array<{ x: number; y: number }>);
    const width = videoRef.current.videoWidth;
    const height = videoRef.current.videoHeight;

    // Canvas drawing on main thread
    try {
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      canvas.width = width;
      canvas.height = height;

      // Apply horizontal flip to match video element
      ctx.scale(-1, 1);
      ctx.translate(-width, 0);

      ctx.clearRect(0, 0, width, height);
      if (points && points.length) {
        ctx.fillStyle = '#00FF00';
        for (let i = 0; i < points.length; i++) {
          const p = points[i];
          const x = p.x * width;
          const y = p.y * height;
          ctx.beginPath();
          ctx.arc(x, y, 1, 0, Math.PI * 2);
          ctx.fill();
        }
        const faceOval = [10,338,297,332,284,251,389,356,454,323,361,288,397,365,379,378,400,377,152,148,176,149,150,136,172,58,132,93,234,127,162,21,54,103,67,109];
        ctx.strokeStyle = '#00FF00';
        ctx.lineWidth = 1;
        ctx.beginPath();
        for (let i = 0; i < faceOval.length; i++) {
          const idx = faceOval[i];
          const p = points[idx];
          if (!p) continue;
          const x = p.x * width;
          const y = p.y * height;
          if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.stroke();
      }
    } catch (err) {
      console.warn('Canvas drawing error:', err);
    }
  }, []);

  // Step 3: MediaPipe에서 받은 랜드마크를 백엔드로 전송 (3프레임마다 1회)
  const sendLandmarks = useCallback((landmarks: unknown) => {
    if (!landmarksWebSocket) {
      if (frameCountRef.current % 30 === 0) {
        console.warn('⚠️ landmarksWebSocket is null');
      }
      return;
    }

    if (landmarksWebSocket.readyState !== WebSocket.OPEN) {
      if (frameCountRef.current % 30 === 0) {
        console.warn(`⚠️ Landmarks WebSocket 상태: ${landmarksWebSocket.readyState} (OPEN=${WebSocket.OPEN}, CONNECTING=${WebSocket.CONNECTING})`);
      }
      return;
    }

    try {
      const message = {
        type: 'landmarks',
        data: landmarks,
        timestamp: Date.now(),
      };
      landmarksWebSocket.send(JSON.stringify(message));

      // 매 30프레임마다만 로그 출력 (과도한 콘솔 스팸 방지)
      if (frameCountRef.current % 30 === 0) {
        const landmarksArray = Array.isArray(landmarks) ? landmarks : [];
        console.log(`📤 Landmarks 전송 (${landmarksArray.length}개 포인트, 프레임: ${frameCountRef.current})`);
      }
    } catch (error) {
      console.error('❌ 랜드마크 전송 실패:', error);
    }
  }, [landmarksWebSocket]);

  // Memoize onResults callback to prevent infinite initialization loops
  // This callback must be stable across renders to avoid triggering useMediaPipe's useEffect
  const handleResults = useCallback((results: Results) => {
    onLandmarks?.(results);
    drawLandmarks(results);

    // Step 3: 3프레임마다 1회 랜드마크 전송 (throttle)
    frameCountRef.current += 1;
    if (frameCountRef.current % 3 === 0 && results.multiFaceLandmarks?.length) {
      sendLandmarks(results.multiFaceLandmarks[0]);
    }
  }, [onLandmarks, drawLandmarks, sendLandmarks]);

  const { isReady, isProcessing, cameraState, error, landmarks, startCamera, stopCamera, retryCamera } = useMediaPipe({
    videoElement: videoRef.current,
    onResults: handleResults,
  });

  // 카메라 시작: 준비되었거나 startTrigger가 변경될 때 시도
  useEffect(() => {
    if (isReady) {
      // startTrigger가 변경될 때마다 이전 카메라 중지 후 재시작
      startCamera().catch(err => {
        console.error('카메라 시작 실패:', err);
      });
    }
    return () => {
      stopCamera();
    };
  }, [isReady, startCamera, stopCamera, startTrigger]);

  return (
    <div className={`relative ${className}`} role="region" aria-label="실시간 영상 분석">
      {/* 비디오 스트림 */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="w-full h-full object-cover rounded-lg transform -scale-x-100"
        aria-label="사용자 카메라 영상"
      />

      {/* 랜드마크 오버레이 캔버스 */}
      <canvas
        ref={canvasRef}
        className="absolute top-0 left-0 w-full h-full pointer-events-none"
        aria-hidden="true"
      />

      {/* 로딩 상태 */}
      {!isProcessing && !error && (
        <div
          className="absolute inset-0 flex items-center justify-center bg-gray-900 bg-opacity-50 rounded-lg"
          role="status"
          aria-live="polite"
        >
          <div className="text-center text-white">
            <div
              className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"
              aria-hidden="true"
            ></div>
            <p className="text-sm">
              {cameraState === 'requesting-permission' && '카메라 권한 요청 중...'}
              {cameraState === 'connecting' && '카메라 연결 중...'}
              {cameraState === 'idle' && isReady && '카메라 시작 중...'}
              {!isReady && 'MediaPipe 로딩 중...'}
            </p>
          </div>
        </div>
      )}

      {/* 에러 표시 */}
      {error && (
        <div
          className="absolute inset-0 flex items-center justify-center bg-red-500 bg-opacity-90 rounded-lg"
          role="alert"
          aria-live="assertive"
        >
          <div className="text-center text-white p-6 max-w-md">
            <svg
              className="w-16 h-16 mx-auto mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              {cameraState === 'permission-denied' ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              )}
            </svg>
            <p className="text-lg font-semibold mb-2">
              {cameraState === 'permission-denied' ? '카메라 권한 필요' : '카메라 오류'}
            </p>
            <p className="text-sm mb-4">{error}</p>

            {cameraState === 'permission-denied' && (
              <div className="text-xs bg-white bg-opacity-20 rounded p-3 mb-4 text-left">
                <p className="font-semibold mb-1">해결 방법:</p>
                <ol className="list-decimal list-inside space-y-1">
                  <li>브라우저 주소창의 카메라 아이콘 클릭</li>
                  <li>"항상 허용" 선택</li>
                  <li>페이지 새로고침</li>
                </ol>
              </div>
            )}

            <button
              onClick={retryCamera}
              className="
                px-6 py-2 min-h-[44px]
                bg-white text-red-600 font-medium rounded-lg
                hover:bg-gray-100 transition
                focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-red-500
              "
              aria-label="카메라 다시 시도"
            >
              다시 시도
            </button>
          </div>
        </div>
      )}

      {/* 상태 표시 */}
      {isProcessing && !error && landmarks && (
        <div
          className="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-1 rounded"
          role="status"
          aria-label="얼굴 감지 중"
        >
          <span aria-hidden="true">● </span>감지 중
        </div>
      )}
    </div>
  );
}
