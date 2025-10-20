import { useRef, useEffect } from 'react';
import { useMediaPipe } from '../../hooks/useMediaPipe';
import type { Results } from '@mediapipe/face_mesh';

interface VideoFeedProps {
  onLandmarks?: (results: Results) => void;
  className?: string;
}

/**
 * VideoFeed 컴포넌트
 *
 * 카메라 스트림을 표시하고 MediaPipe로 얼굴 랜드마크를 감지합니다.
 */
export function VideoFeed({ onLandmarks, className = '' }: VideoFeedProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const { isReady, isProcessing, error, landmarks, startCamera, stopCamera } = useMediaPipe({
    videoElement: videoRef.current,
    onResults: (results) => {
      onLandmarks?.(results);
      drawLandmarks(results);
    },
  });

  // 카메라 시작
  useEffect(() => {
    if (isReady) {
      startCamera();
    }
    return () => {
      stopCamera();
    };
  }, [isReady, startCamera, stopCamera]);

  // 랜드마크 그리기
  const drawLandmarks = (results: Results) => {
    if (!canvasRef.current || !videoRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 캔버스 크기 설정
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;

    // 캔버스 클리어
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 얼굴 랜드마크 그리기
    if (results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0) {
      const landmarks = results.multiFaceLandmarks[0];

      // 랜드마크 포인트 그리기
      ctx.fillStyle = '#00FF00';
      landmarks.forEach((landmark) => {
        const x = landmark.x * canvas.width;
        const y = landmark.y * canvas.height;
        ctx.beginPath();
        ctx.arc(x, y, 1, 0, 2 * Math.PI);
        ctx.fill();
      });

      // 얼굴 윤곽 그리기 (선택적)
      ctx.strokeStyle = '#00FF00';
      ctx.lineWidth = 1;

      // 얼굴 윤곽선 (FACEMESH_FACE_OVAL)
      const faceOval = [
        10, 338, 297, 332, 284, 251, 389, 356, 454, 323, 361, 288,
        397, 365, 379, 378, 400, 377, 152, 148, 176, 149, 150, 136,
        172, 58, 132, 93, 234, 127, 162, 21, 54, 103, 67, 109
      ];

      ctx.beginPath();
      faceOval.forEach((index, i) => {
        const point = landmarks[index];
        const x = point.x * canvas.width;
        const y = point.y * canvas.height;
        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      });
      ctx.closePath();
      ctx.stroke();
    }
  };

  return (
    <div className={`relative ${className}`}>
      {/* 비디오 스트림 */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="w-full h-full object-cover rounded-lg"
      />

      {/* 랜드마크 오버레이 캔버스 */}
      <canvas
        ref={canvasRef}
        className="absolute top-0 left-0 w-full h-full pointer-events-none"
      />

      {/* 로딩 상태 */}
      {!isProcessing && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900 bg-opacity-50 rounded-lg">
          <div className="text-center text-white">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
            <p className="text-sm">{isReady ? '카메라 시작 중...' : 'MediaPipe 로딩 중...'}</p>
          </div>
        </div>
      )}

      {/* 에러 표시 */}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-red-500 bg-opacity-90 rounded-lg">
          <div className="text-center text-white p-4">
            <svg className="w-12 h-12 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <p className="text-sm font-medium">카메라 오류</p>
            <p className="text-xs mt-2">{error}</p>
          </div>
        </div>
      )}

      {/* 상태 표시 */}
      {isProcessing && !error && landmarks && (
        <div className="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-1 rounded">
          ● 감지 중
        </div>
      )}
    </div>
  );
}
