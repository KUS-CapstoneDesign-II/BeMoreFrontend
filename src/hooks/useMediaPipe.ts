import { useEffect, useRef, useState, useCallback } from 'react';
// Use dynamic import inside effect to avoid SSR/bundle shape issues
import type { Results } from '@mediapipe/face_mesh';
// Camera is a UMD module that exports to global scope; we'll import it dynamically
import type { Camera } from '@mediapipe/camera_utils';

interface UseMediaPipeOptions {
  videoElement: HTMLVideoElement | null;
  onResults?: (results: Results) => void;
  maxNumFaces?: number;
  minDetectionConfidence?: number;
  minTrackingConfidence?: number;
}

export type CameraState =
  | 'idle'
  | 'requesting-permission'
  | 'permission-denied'
  | 'connecting'
  | 'connected'
  | 'error';

interface UseMediaPipeReturn {
  isReady: boolean;
  isProcessing: boolean;
  cameraState: CameraState;
  error: string | null;
  landmarks: Results | null;
  startCamera: () => Promise<void>;
  stopCamera: () => void;
  retryCamera: () => Promise<void>;
}

/**
 * useMediaPipe 훅
 *
 * MediaPipe Face Mesh를 사용하여 얼굴 랜드마크 468개 포인트를 감지합니다.
 *
 * @example
 * ```tsx
 * const videoRef = useRef<HTMLVideoElement>(null);
 *
 * const { isReady, landmarks, startCamera, stopCamera } = useMediaPipe({
 *   videoElement: videoRef.current,
 *   onResults: (results) => {
 *     if (results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0) {
 *       const landmarks = results.multiFaceLandmarks[0];
 *       // landmarks: 468개의 {x, y, z} 포인트
 *       sendToBackend(landmarks);
 *     }
 *   }
 * });
 *
 * useEffect(() => {
 *   startCamera();
 *   return () => stopCamera();
 * }, []);
 * ```
 */
export function useMediaPipe(options: UseMediaPipeOptions): UseMediaPipeReturn {
  const {
    videoElement,
    onResults,
    maxNumFaces = 1,
    minDetectionConfidence = 0.7,
    minTrackingConfidence = 0.7,
  } = options;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const faceMeshRef = useRef<any>(null);
  const cameraRef = useRef<Camera | null>(null);
  const initializingRef = useRef(false);

  const [isReady, setIsReady] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [cameraState, setCameraState] = useState<CameraState>('idle');
  const [error, setError] = useState<string | null>(null);
  const [landmarks, setLandmarks] = useState<Results | null>(null);

  // MediaPipe Face Mesh 초기화
  useEffect(() => {
    // 이미 초기화 중이면 중복 초기화 방지
    if (initializingRef.current || faceMeshRef.current) {
      return;
    }

    const initFaceMesh = async () => {
      initializingRef.current = true;
      try {
        setError(null);

        // 기존 인스턴스 정리
        if (faceMeshRef.current) {
          try {
            faceMeshRef.current.close();
          } catch {
            // ignore close errors
          }
          faceMeshRef.current = null;
        }

        // Resolve FaceMesh constructor with robust fallbacks (ESM -> UMD global)
        const resolveFaceMeshCtor = async (): Promise<unknown> => {
          try {
            const mp = await import('@mediapipe/face_mesh');
            const maybe: unknown = (mp as unknown as { FaceMesh?: unknown; default?: unknown }).FaceMesh || (mp as unknown as { default?: unknown }).default;
            const ctor = maybe as unknown;
            if (typeof ctor === 'function') return ctor;
          } catch {
            // ignore and try CDN fallback
          }

          // Fallback: load UMD build from CDN and access global
          await new Promise<void>((resolve, reject) => {
            const scriptId = 'mp-face-mesh-umd-script';
            if (document.getElementById(scriptId)) {
              resolve();
              return;
            }
            const script = document.createElement('script');
            script.id = scriptId;
            script.async = true;
            script.src = 'https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh@0.4.1633559619/face_mesh.js';
            script.onload = () => resolve();
            script.onerror = () => reject(new Error('Failed to load MediaPipe FaceMesh UMD script'));
            document.head.appendChild(script);
          });

          const globalCtor: unknown = (window as unknown as { FaceMesh?: unknown; faceMesh?: unknown; facemesh?: { FaceMesh?: unknown } }).FaceMesh
            || (window as unknown as { faceMesh?: unknown }).faceMesh
            || (window as unknown as { facemesh?: { FaceMesh?: unknown } }).facemesh?.FaceMesh;
          if (typeof globalCtor !== 'function') {
            throw new Error('FaceMesh constructor unavailable');
          }
          return globalCtor;
        };

        const FaceMeshCtor = await resolveFaceMeshCtor() as new (opts: { locateFile: (f: string) => string }) => {
          setOptions: (opts: Record<string, unknown>) => void;
          onResults: (cb: (r: Results) => void) => void;
          close: () => void;
          send: (arg: { image: HTMLVideoElement }) => Promise<void>;
        };
        const faceMesh = new FaceMeshCtor({
          locateFile: (file: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh@0.4.1633559619/${file}`,
        });

        // FaceMesh 설정
        faceMesh.setOptions({
          maxNumFaces,
          refineLandmarks: true, // 홍채 및 입술 랜드마크 포함 (478개)
          minDetectionConfidence,
          minTrackingConfidence,
        });

        // 결과 핸들러 등록
        faceMesh.onResults((results: Results) => {
          setLandmarks(results);
          onResults?.(results);
        });

        faceMeshRef.current = faceMesh;
        setIsReady(true);
        console.log('✅ MediaPipe Face Mesh 초기화 완료');
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'MediaPipe 초기화 실패';
        setError(errorMessage);
        console.error('❌ MediaPipe 초기화 오류:', err);
        faceMeshRef.current = null;
      } finally {
        initializingRef.current = false;
      }
    };

    initFaceMesh();

    return () => {
      if (faceMeshRef.current) {
        try {
          faceMeshRef.current.close();
        } catch {
          // ignore close errors
        }
        faceMeshRef.current = null;
      }
    };
  }, [maxNumFaces, minDetectionConfidence, minTrackingConfidence, onResults]);

  // 카메라 시작
  const startCamera = useCallback(async () => {
    if (!videoElement || !faceMeshRef.current) {
      setError('MediaPipe가 준비되지 않았습니다.');
      setCameraState('error');
      return;
    }

    try {
      setError(null);
      setCameraState('requesting-permission');

      // 카메라 권한 요청 및 스트림 시작
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user',
        },
        audio: false,
      });

      setCameraState('connecting');
      setIsProcessing(true);
      videoElement.srcObject = stream;

      // Load Camera from CDN (same approach as FaceMesh)
      await new Promise<void>((resolve, reject) => {
        const scriptId = 'mp-camera-utils-umd-script';
        if (document.getElementById(scriptId)) {
          resolve();
          return;
        }
        const script = document.createElement('script');
        script.id = scriptId;
        script.async = true;
        script.src = 'https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils@0.3.1675466862/camera_utils.js';
        script.onload = () => resolve();
        script.onerror = () => reject(new Error('Failed to load MediaPipe Camera Utils UMD script'));
        document.head.appendChild(script);
      });

      // Access Camera from global window object (set by UMD script)
      const CameraCtor = (window as unknown as { Camera?: unknown }).Camera;
      if (typeof CameraCtor !== 'function') {
        throw new Error('Camera constructor unavailable from global scope');
      }

      // Camera 유틸리티로 비디오 프레임 처리
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const camera = new (CameraCtor as any)(videoElement, {
        onFrame: async () => {
          if (faceMeshRef.current) {
            await faceMeshRef.current.send({ image: videoElement });
          }
        },
        width: 1280,
        height: 720,
      });

      await camera.start();
      cameraRef.current = camera;
      setCameraState('connected');

      console.log('✅ 카메라 시작 완료');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '카메라 시작 실패';
      setIsProcessing(false);
      console.error('❌ 카메라 오류:', err);

      // 권한 거부 또는 에러 상태 구분
      if (err instanceof Error && (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError')) {
        setCameraState('permission-denied');
        setError('카메라 권한이 필요합니다. 브라우저 설정에서 카메라 접근을 허용해주세요.');
      } else if (err instanceof Error && err.name === 'NotFoundError') {
        setCameraState('error');
        setError('카메라를 찾을 수 없습니다. 카메라가 연결되어 있는지 확인해주세요.');
      } else if (err instanceof Error && err.name === 'NotReadableError') {
        setCameraState('error');
        setError('카메라가 이미 다른 앱에서 사용 중입니다. 다른 앱을 종료하고 다시 시도해주세요.');
      } else {
        setCameraState('error');
        setError(errorMessage);
      }
    }
  }, [videoElement]);

  // 카메라 재시도
  const retryCamera = useCallback(async () => {
    setCameraState('idle');
    setError(null);
    await startCamera();
  }, [startCamera]);

  // 카메라 중지
  const stopCamera = useCallback(() => {
    // 카메라 스트림 중지
    if (cameraRef.current) {
      try {
        cameraRef.current.stop();
      } catch (err) {
        console.warn('경고: 카메라 중지 중 오류:', err);
      }
      cameraRef.current = null;
    }

    // 비디오 스트림 해제
    if (videoElement?.srcObject) {
      const stream = videoElement.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoElement.srcObject = null;
    }

    setIsProcessing(false);
    setCameraState('idle');
    setLandmarks(null);
    console.log('✅ 카메라 중지 완료');
  }, [videoElement]);

  // 컴포넌트 언마운트 시 정리
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  return {
    isReady,
    isProcessing,
    cameraState,
    error,
    landmarks,
    startCamera,
    stopCamera,
    retryCamera,
  };
}
