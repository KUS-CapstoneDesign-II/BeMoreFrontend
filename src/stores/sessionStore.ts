import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { sessionAPI } from '../services/api';
import type { Session, SessionStatus } from '../types';
import { Logger } from '../config/env';

interface SessionState {
  // Legacy state (preserve)
  session: Session | null;
  isLoading: boolean;
  error: string | null;

  // New lightweight state for quick checks
  sessionId: string | null;
  isSessionActive: boolean;

  // Phase 9: Timeline data
  startedAt: Date | null;
  endedAt: Date | null;
  minuteIndex: number;
  totalDuration: number; // ms

  // Phase 9: User feedback
  userFeedback?: {
    rating: number;
    notes: string;
  };

  // Actions (existing)
  setSession: (session: Session) => void;
  updateStatus: (status: SessionStatus) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  clearSession: () => void;

  // New actions
  startSession: (userId: string, counselorId: string) => Promise<string | null>;
  endSession: () => Promise<void>;

  // Phase 9 actions
  setMinuteIndex: (index: number) => void;
  incrementMinuteIndex: () => void;
  updateFeedback: (feedback: { rating: number; notes: string }) => void;
}

/**
 * Session Store
 *
 * 세션 상태를 전역으로 관리합니다.
 * Phase 9: Timeline 기능 추가
 */
export const useSessionStore = create<SessionState>()(
  subscribeWithSelector((set, get) => ({
    session: null,
    isLoading: false,
    error: null,

    sessionId: null,
    isSessionActive: false,

    // Phase 9
    startedAt: null,
    endedAt: null,
    minuteIndex: 0,
    totalDuration: 0,

    setSession: (session) => set({ session, error: null }),

    updateStatus: (status) =>
      set((state) => ({
        session: state.session ? { ...state.session, status } : null,
        isSessionActive: status === 'active',
      })),

    setLoading: (isLoading) => set({ isLoading }),

    setError: (error) => set({ error }),

    clearSession: () =>
      set({
        session: null,
        sessionId: null,
        isSessionActive: false,
        error: null,
        isLoading: false,
        startedAt: null,
        endedAt: null,
        minuteIndex: 0,
        totalDuration: 0,
        userFeedback: undefined,
      }),

    startSession: async (userId: string, counselorId: string) => {
      set({ isLoading: true, error: null });
      try {
        const response = await sessionAPI.start(userId, counselorId);
        const newId = response.sessionId;
        set({
          sessionId: newId,
          isSessionActive: true,
          startedAt: new Date(),
          endedAt: null,
          minuteIndex: 0,
          totalDuration: 0,
        });
        Logger.info('✅ Session started', { sessionId: newId });
        return newId;
      } catch (err) {
        const message = err instanceof Error ? err.message : '세션 시작 실패';
        Logger.error('❌ Failed to start session', message);
        set({ error: message, sessionId: null, isSessionActive: false });
        return null;
      } finally {
        set({ isLoading: false });
      }
    },

    endSession: async () => {
      const currentId = get().sessionId;
      if (!currentId) return;
      set({ isLoading: true, error: null });
      try {
        await sessionAPI.end(currentId);
        const startedAt = get().startedAt;
        const duration = startedAt ? Date.now() - startedAt.getTime() : 0;
        set({
          sessionId: null,
          isSessionActive: false,
          endedAt: new Date(),
          totalDuration: duration,
        });
        Logger.info('✅ Session ended', { sessionId: currentId, duration });
      } catch (err) {
        const message = err instanceof Error ? err.message : '세션 종료 실패';
        Logger.error('❌ Failed to end session', message);
        set({ error: message });
      } finally {
        set({ isLoading: false });
      }
    },

    // Phase 9 actions
    setMinuteIndex: (index) => {
      set({ minuteIndex: index });
      Logger.debug('Minute index updated', { minuteIndex: index });
    },

    incrementMinuteIndex: () => {
      const current = get().minuteIndex;
      set({ minuteIndex: current + 1 });
      Logger.debug('Minute index incremented', { minuteIndex: current + 1 });
    },

    updateFeedback: (feedback) => {
      set({ userFeedback: feedback });
      Logger.info('User feedback updated', feedback);
    },
  }))
);
