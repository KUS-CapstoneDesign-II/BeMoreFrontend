import { create } from 'zustand';
import { sessionAPI } from '../services/api';
import type { Session, SessionStatus } from '../types';

interface SessionState {
  // Legacy state (preserve)
  session: Session | null;
  isLoading: boolean;
  error: string | null;

  // New lightweight state for quick checks
  sessionId: string | null;
  isSessionActive: boolean;

  // Actions (existing)
  setSession: (session: Session) => void;
  updateStatus: (status: SessionStatus) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  clearSession: () => void;

  // New actions
  startSession: (userId: string, counselorId: string) => Promise<string | null>;
  endSession: () => Promise<void>;
}

/**
 * Session Store
 *
 * 세션 상태를 전역으로 관리합니다.
 */
export const useSessionStore = create<SessionState>((set, get) => ({
  session: null,
  isLoading: false,
  error: null,

  sessionId: null,
  isSessionActive: false,

  setSession: (session) => set({ session, error: null }),

  updateStatus: (status) =>
    set((state) => ({
      session: state.session ? { ...state.session, status } : null,
      isSessionActive: status === 'active',
    })),

  setLoading: (isLoading) => set({ isLoading }),

  setError: (error) => set({ error }),

  clearSession: () => set({ session: null, sessionId: null, isSessionActive: false, error: null, isLoading: false }),

  startSession: async (userId: string, counselorId: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await sessionAPI.start(userId, counselorId);
      const newId = response.sessionId;
      set({ sessionId: newId, isSessionActive: true });
      return newId;
    } catch (err) {
      const message = err instanceof Error ? err.message : '세션 시작 실패';
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
    } catch (err) {
      const message = err instanceof Error ? err.message : '세션 종료 실패';
      set({ error: message });
    } finally {
      set({ sessionId: null, isSessionActive: false, isLoading: false });
    }
  },
}));
