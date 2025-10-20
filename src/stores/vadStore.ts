import { create } from 'zustand';
import type { VADMetrics } from '../types';

interface VADState {
  metrics: VADMetrics | null;
  isListening: boolean;

  // Actions
  updateMetrics: (metrics: VADMetrics) => void;
  setListening: (isListening: boolean) => void;
  resetMetrics: () => void;
}

/**
 * VAD Store
 *
 * 음성 활동 감지(VAD) 메트릭을 전역으로 관리합니다.
 *
 * @example
 * ```tsx
 * import { useVADStore } from '@/stores/vadStore';
 *
 * function VADMonitor() {
 *   const { metrics, isListening, updateMetrics } = useVADStore();
 *
 *   useEffect(() => {
 *     // WebSocket에서 VAD 메트릭 수신 시
 *     const vadMetrics: VADMetrics = {
 *       speechRatio: 0.65,
 *       pauseRatio: 0.35,
 *       averagePauseDuration: 1500,
 *       longestPause: 3000,
 *       speechBurstCount: 10,
 *       averageSpeechBurst: 2500,
 *       pauseCount: 8,
 *       summary: '정상적인 발화 패턴'
 *     };
 *     updateMetrics(vadMetrics);
 *   }, []);
 *
 *   return (
 *     <div>
 *       <p>발화 비율: {metrics?.speechRatio}%</p>
 *       <p>상태: {isListening ? '듣는 중' : '중지'}</p>
 *     </div>
 *   );
 * }
 * ```
 */
export const useVADStore = create<VADState>((set) => ({
  metrics: null,
  isListening: false,

  updateMetrics: (metrics) => set({ metrics }),

  setListening: (isListening) => set({ isListening }),

  resetMetrics: () =>
    set({
      metrics: null,
      isListening: false,
    }),
}));
