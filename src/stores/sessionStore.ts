import { create } from 'zustand';
import type { Session, SessionStatus } from '../types';

interface SessionState {
  session: Session | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  setSession: (session: Session) => void;
  updateStatus: (status: SessionStatus) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  clearSession: () => void;
}

/**
 * Session Store
 *
 * 세션 상태를 전역으로 관리합니다.
 *
 * @example
 * ```tsx
 * import { useSessionStore } from '@/stores/sessionStore';
 *
 * function SessionInfo() {
 *   const { session, updateStatus } = useSessionStore();
 *
 *   return (
 *     <div>
 *       <p>세션 ID: {session?.sessionId}</p>
 *       <p>상태: {session?.status}</p>
 *       <button onClick={() => updateStatus('paused')}>일시정지</button>
 *     </div>
 *   );
 * }
 * ```
 */
export const useSessionStore = create<SessionState>((set) => ({
  session: null,
  isLoading: false,
  error: null,

  setSession: (session) => set({ session, error: null }),

  updateStatus: (status) =>
    set((state) => ({
      session: state.session ? { ...state.session, status } : null,
    })),

  setLoading: (isLoading) => set({ isLoading }),

  setError: (error) => set({ error }),

  clearSession: () => set({ session: null, error: null, isLoading: false }),
}));
