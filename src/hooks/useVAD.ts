import { useEffect, useRef, useState, useCallback } from 'react';

interface UseVADOptions {
  threshold?: number; // 음성 감지 임계값 (0-255, 기본값: 30)
  smoothingTimeConstant?: number; // 스무딩 계수 (0-1, 기본값: 0.8)
  minSpeechDuration?: number; // 최소 발화 지속 시간 (ms, 기본값: 300)
  minSilenceDuration?: number; // 최소 침묵 지속 시간 (ms, 기본값: 500)
  onSpeechStart?: () => void;
  onSpeechEnd?: () => void;
  onVolumeChange?: (volume: number) => void;
}

interface VADMetrics {
  isSpeaking: boolean;
  volume: number;
  speechDuration: number;
  silenceDuration: number;
  speechCount: number;
  totalSpeechTime: number;
  totalSilenceTime: number;
}

interface UseVADReturn {
  isListening: boolean;
  metrics: VADMetrics;
  error: string | null;
  startListening: () => Promise<void>;
  stopListening: () => void;
  resetMetrics: () => void;
}

/**
 * useVAD 훅
 *
 * Web Audio API를 사용하여 음성 활동을 감지합니다.
 * 말하기/침묵 상태를 구분하고 메트릭을 수집합니다.
 *
 * @example
 * ```tsx
 * const { isListening, metrics, startListening, stopListening } = useVAD({
 *   threshold: 30,
 *   onSpeechStart: () => console.log('말하기 시작'),
 *   onSpeechEnd: () => console.log('말하기 종료'),
 *   onVolumeChange: (volume) => console.log('볼륨:', volume)
 * });
 *
 * // 음성 감지 시작
 * useEffect(() => {
 *   startListening();
 *   return () => stopListening();
 * }, []);
 *
 * // 메트릭 확인
 * console.log('발화 횟수:', metrics.speechCount);
 * console.log('전체 발화 시간:', metrics.totalSpeechTime);
 * ```
 */
export function useVAD(options: UseVADOptions = {}): UseVADReturn {
  const {
    threshold = 30,
    smoothingTimeConstant = 0.8,
    minSpeechDuration = 300,
    minSilenceDuration = 500,
    onSpeechStart,
    onSpeechEnd,
    onVolumeChange,
  } = options;

  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  const speechStartTimeRef = useRef<number | null>(null);
  const silenceStartTimeRef = useRef<number | null>(null);
  const lastStateRef = useRef<boolean>(false); // 이전 발화 상태

  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [metrics, setMetrics] = useState<VADMetrics>({
    isSpeaking: false,
    volume: 0,
    speechDuration: 0,
    silenceDuration: 0,
    speechCount: 0,
    totalSpeechTime: 0,
    totalSilenceTime: 0,
  });

  // 볼륨 분석 및 VAD 로직
  const analyzeAudio = useCallback(() => {
    if (!analyserRef.current || !audioContextRef.current) return;

    // AudioContext 상태 확인
    if (audioContextRef.current.state === 'suspended') {
      console.warn('⚠️ AudioContext suspended, skipping analysis');
      // 다음 프레임에 다시 시도
      animationFrameRef.current = requestAnimationFrame(analyzeAudio);
      return;
    }

    if (audioContextRef.current.state === 'closed') {
      console.error('❌ AudioContext closed, cannot analyze');
      return;
    }

    const analyser = analyserRef.current;
    const dataArray = new Uint8Array(analyser.frequencyBinCount);
    analyser.getByteFrequencyData(dataArray);

    // 평균 볼륨 계산
    const average = dataArray.reduce((sum, value) => sum + value, 0) / dataArray.length;

    // 음성 활동 감지
    const isSpeaking = average > threshold;
    const now = Date.now();

    // 상태 변화 감지
    if (isSpeaking && !lastStateRef.current) {
      // 침묵 → 발화
      if (silenceStartTimeRef.current) {
        const silenceDuration = now - silenceStartTimeRef.current;
        if (silenceDuration >= minSilenceDuration) {
          speechStartTimeRef.current = now;
          silenceStartTimeRef.current = null;
          onSpeechStart?.();
        }
      } else {
        speechStartTimeRef.current = now;
        onSpeechStart?.();
      }
    } else if (!isSpeaking && lastStateRef.current) {
      // 발화 → 침묵
      if (speechStartTimeRef.current) {
        const speechDuration = now - speechStartTimeRef.current;
        if (speechDuration >= minSpeechDuration) {
          silenceStartTimeRef.current = now;

          setMetrics((prev) => ({
            ...prev,
            speechCount: prev.speechCount + 1,
            totalSpeechTime: prev.totalSpeechTime + speechDuration,
          }));

          speechStartTimeRef.current = null;
          onSpeechEnd?.();
        }
      } else {
        silenceStartTimeRef.current = now;
        onSpeechEnd?.();
      }
    }

    // 현재 발화/침묵 지속 시간 계산
    let currentSpeechDuration = 0;
    let currentSilenceDuration = 0;

    if (isSpeaking && speechStartTimeRef.current) {
      currentSpeechDuration = now - speechStartTimeRef.current;
    } else if (!isSpeaking && silenceStartTimeRef.current) {
      currentSilenceDuration = now - silenceStartTimeRef.current;
    }

    // 메트릭 업데이트
    setMetrics((prev) => ({
      ...prev,
      isSpeaking,
      volume: Math.round(average),
      speechDuration: currentSpeechDuration,
      silenceDuration: currentSilenceDuration,
    }));

    onVolumeChange?.(Math.round(average));
    lastStateRef.current = isSpeaking;

    // 다음 프레임 예약
    animationFrameRef.current = requestAnimationFrame(analyzeAudio);
  }, [threshold, minSpeechDuration, minSilenceDuration, onSpeechStart, onSpeechEnd, onVolumeChange]);

  // 음성 감지 시작
  const startListening = useCallback(async () => {
    try {
      setError(null);

      // 마이크 권한 요청
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // Web Audio API 설정
      const audioContext = new AudioContext();
      const analyser = audioContext.createAnalyser();
      const source = audioContext.createMediaStreamSource(stream);

      analyser.fftSize = 2048;
      analyser.smoothingTimeConstant = smoothingTimeConstant;
      source.connect(analyser);

      audioContextRef.current = audioContext;
      analyserRef.current = analyser;

      // 분석 시작
      setIsListening(true);
      silenceStartTimeRef.current = Date.now();
      analyzeAudio();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'VAD 시작 실패';
      setError(errorMessage);

      if (errorMessage.includes('Permission denied')) {
        setError('마이크 권한이 필요합니다. 브라우저 설정에서 마이크 접근을 허용해주세요.');
      }
    }
  }, [smoothingTimeConstant, analyzeAudio]);

  // 음성 감지 중지
  const stopListening = useCallback(() => {
    // 애니메이션 프레임 취소
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    // 오디오 컨텍스트 종료
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    // 마이크 스트림 해제
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    analyserRef.current = null;
    speechStartTimeRef.current = null;
    silenceStartTimeRef.current = null;
    lastStateRef.current = false;

    setIsListening(false);
  }, []);

  // 메트릭 초기화
  const resetMetrics = useCallback(() => {
    setMetrics({
      isSpeaking: false,
      volume: 0,
      speechDuration: 0,
      silenceDuration: 0,
      speechCount: 0,
      totalSpeechTime: 0,
      totalSilenceTime: 0,
    });
    speechStartTimeRef.current = null;
    silenceStartTimeRef.current = null;
    lastStateRef.current = false;
  }, []);

  // AudioContext 생명주기 관리 (탭 포그라운드/백그라운드)
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (!audioContextRef.current) return;

      if (document.visibilityState === 'visible') {
        // 탭이 포그라운드로 전환됨
        if (audioContextRef.current.state === 'suspended') {
          try {
            await audioContextRef.current.resume();
            console.log('✅ AudioContext resumed after tab visible');

            // 분석이 활성화되어 있었다면 재시작
            if (isListening && !animationFrameRef.current) {
              analyzeAudio();
            }
          } catch (err) {
            console.error('❌ Failed to resume AudioContext', err);
            setError('오디오 컨텍스트 재개 실패');
          }
        }
      } else {
        // 탭이 백그라운드로 전환됨
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
          animationFrameRef.current = null;
          console.log('⏸️ Audio analysis paused (tab hidden)');
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isListening, analyzeAudio]);

  // 컴포넌트 언마운트 시 정리
  useEffect(() => {
    return () => {
      stopListening();
    };
  }, [stopListening]);

  return {
    isListening,
    metrics,
    error,
    startListening,
    stopListening,
    resetMetrics,
  };
}
