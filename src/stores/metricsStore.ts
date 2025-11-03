import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import type { VadState } from '../types/session';
import { Logger } from '../config/env';

interface MetricsState {
  // Real-time metrics
  fps: number;
  audioLevel: number;
  vadState: VadState;
  networkLatency: number;
  queueLength: number;

  // Error tracking
  errors: Array<{
    id: string;
    timestamp: Date;
    message: string;
    severity: 'low' | 'medium' | 'high';
    retryCount: number;
  }>;
  lastErrorTimestamp: number | null;

  // Actions
  setFps: (fps: number) => void;
  setAudioLevel: (level: number) => void;
  setVadState: (state: VadState) => void;
  setNetworkLatency: (ms: number) => void;
  setQueueLength: (length: number) => void;
  addError: (message: string, severity: 'low' | 'medium' | 'high') => void;
  clearErrors: () => void;
  removeError: (id: string) => void;
  reset: () => void;

  // Derived metrics
  getAverageMetrics: () => { fps: number; audioLevel: number; networkLatency: number };
  getHealthStatus: () => 'healthy' | 'warning' | 'error';
}

/**
 * Metrics Store
 *
 * 실시간 세션 메트릭을 관리합니다:
 * - FPS (영상 캡처 프레임율)
 * - 오디오 레벨 및 음성 활동 감지(VAD)
 * - 네트워크 지연 시간
 * - 배치 큐 길이
 * - 에러 추적 및 재시도 카운트
 */
export const useMetricsStore = create<MetricsState>()(
  subscribeWithSelector((set, get) => ({
    // Initialize metrics
    fps: 0,
    audioLevel: 0,
    vadState: 'silence',
    networkLatency: 0,
    queueLength: 0,

    errors: [],
    lastErrorTimestamp: null,

    // FPS tracking (frames per second)
    setFps: (fps) => {
      set({ fps });
      if (fps < 12) {
        Logger.warn('⚠️ FPS below target (12+)', { fps });
      }
    },

    // Audio level tracking (0-100)
    setAudioLevel: (level) => {
      set({ audioLevel: Math.max(0, Math.min(100, level)) });
    },

    // Voice Activity Detection state
    setVadState: (state) => {
      set({ vadState: state });
      Logger.debug('VAD state changed', { state });
    },

    // Network latency tracking (milliseconds)
    setNetworkLatency: (ms) => {
      set({ networkLatency: ms });
      if (ms > 3000) {
        Logger.warn('⚠️ Network latency high', { ms });
      }
    },

    // Queue length tracking (for batch transmission)
    setQueueLength: (length) => {
      set({ queueLength: length });
    },

    // Error tracking with automatic ID generation
    addError: (message, severity) => {
      const id = `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const error = {
        id,
        timestamp: new Date(),
        message,
        severity,
        retryCount: 0,
      };

      set((state) => ({
        errors: [...state.errors, error],
        lastErrorTimestamp: Date.now(),
      }));

      Logger.error(`[${severity.toUpperCase()}] ${message}`, { errorId: id });
    },

    // Remove specific error by ID
    removeError: (id) => {
      set((state) => ({
        errors: state.errors.filter((e) => e.id !== id),
      }));
    },

    // Clear all errors
    clearErrors: () => {
      set({ errors: [], lastErrorTimestamp: null });
      Logger.info('✅ All errors cleared');
    },

    // Reset all metrics to initial state
    reset: () => {
      set({
        fps: 0,
        audioLevel: 0,
        vadState: 'silence',
        networkLatency: 0,
        queueLength: 0,
        errors: [],
        lastErrorTimestamp: null,
      });
      Logger.info('✅ Metrics reset');
    },

    // Derived: Get average metrics (useful for performance analysis)
    getAverageMetrics: () => {
      const state = get();
      return {
        fps: state.fps,
        audioLevel: state.audioLevel,
        networkLatency: state.networkLatency,
      };
    },

    // Derived: Get overall health status based on metrics
    getHealthStatus: () => {
      const state = get();

      // Check for critical errors
      if (state.errors.some((e) => e.severity === 'high')) {
        return 'error';
      }

      // Check for warning conditions
      if (
        state.fps < 12 || // Below 12 FPS
        state.networkLatency > 3000 || // Over 3 seconds
        state.queueLength > 30 || // Queue backed up
        state.errors.some((e) => e.severity === 'medium')
      ) {
        return 'warning';
      }

      return 'healthy';
    },
  }))
);

/**
 * Helper hook to get current metrics as a stable object
 * Useful to avoid unnecessary re-renders in components
 */
export const useCurrentMetrics = () => {
  return useMetricsStore((state) => ({
    fps: state.fps,
    audioLevel: state.audioLevel,
    vadState: state.vadState,
    networkLatency: state.networkLatency,
    queueLength: state.queueLength,
    errorCount: state.errors.length,
    healthStatus: state.getHealthStatus(),
  }));
};

/**
 * Helper hook to get only error information
 */
export const useMetricsErrors = () => {
  return useMetricsStore((state) => ({
    errors: state.errors,
    lastErrorTimestamp: state.lastErrorTimestamp,
    errorCount: state.errors.length,
    hasHighSeverityError: state.errors.some((e) => e.severity === 'high'),
  }));
};
