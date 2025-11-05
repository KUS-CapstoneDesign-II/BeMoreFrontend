import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { SessionStatus } from '../types';
import { encryptedStorage } from '../utils/security';

/**
 * SessionContext
 *
 * 세션 상태 관리를 중앙화하는 Context
 * 모든 세션 관련 상태를 하나의 장소에서 관리
 *
 * 상태 분류:
 * - 세션 식별: sessionId, sessionStatus, sessionStartAt
 * - 로딩 상태: isLoading, isWaitingForSessionEnd
 * - 에러 처리: error
 * - UI 피드백: showSummary, userClosedSummary
 */

interface SessionContextType {
  // 세션 식별 정보
  sessionId: string | null;
  sessionStatus: SessionStatus;
  sessionStartAt: number | null;

  // 로딩 상태
  isLoading: boolean;
  isWaitingForSessionEnd: boolean;

  // 에러 처리
  error: string | null;

  // UI 상태
  showSummary: boolean;
  userClosedSummary: boolean;

  // 액션 함수들
  setSessionId: (id: string | null) => void;
  setSessionStatus: (status: SessionStatus) => void;
  setSessionStartAt: (timestamp: number | null) => void;
  setIsLoading: (loading: boolean) => void;
  setIsWaitingForSessionEnd: (waiting: boolean) => void;
  setError: (error: string | null) => void;
  setShowSummary: (show: boolean) => void;
  setUserClosedSummary: (closed: boolean) => void;

  // 편의 함수들
  startSession: (id: string, startTime: number) => void;
  endSession: () => void;
  resetSession: () => void;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

interface SessionContextProviderProps {
  children: ReactNode;
}

/**
 * 암호화된 토큰 저장/읽기 유틸리티
 */
const tokenStorage = {
  async setToken(token: string): Promise<void> {
    try {
      await encryptedStorage.setItem('bemore_session_token', token);
    } catch (error) {
      console.error('❌ Failed to store session token securely:', error);
    }
  },

  async getToken(): Promise<string | null> {
    try {
      return await encryptedStorage.getItem('bemore_session_token');
    } catch (error) {
      console.error('❌ Failed to retrieve session token:', error);
      return null;
    }
  },

  clearToken(): void {
    encryptedStorage.removeItem('bemore_session_token');
  },
};

export function SessionContextProvider({ children }: SessionContextProviderProps) {
  // 세션 식별 정보
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [sessionStatus, setSessionStatus] = useState<SessionStatus>('ended');
  const [sessionStartAt, setSessionStartAt] = useState<number | null>(null);

  // 로딩 상태
  const [isLoading, setIsLoading] = useState(false);
  const [isWaitingForSessionEnd, setIsWaitingForSessionEnd] = useState(false);

  // 에러 처리
  const [error, setError] = useState<string | null>(null);

  // UI 상태
  const [showSummary, setShowSummary] = useState(false);
  const [userClosedSummary, setUserClosedSummary] = useState(false);

  /**
   * 초기화: 암호화된 토큰 복원
   */
  useEffect(() => {
    const loadEncryptedToken = async () => {
      try {
        const token = await tokenStorage.getToken();
        if (token) {
          // 토큰이 존재하면 기존 세션 복원
          // (실제 API 호출이나 검증은 별도 로직에서 처리)
          console.log('✅ Session token loaded from encrypted storage');
        }
      } catch (err) {
        console.error('⚠️ Failed to load encrypted token on initialization:', err);
      }
    };

    loadEncryptedToken();
  }, []);

  /**
   * startSession
   * 새 세션 시작
   *
   * @param id - 세션 ID
   * @param startTime - 시작 타임스탬프
   */
  const startSession = useCallback((id: string, startTime: number) => {
    setSessionId(id);
    setSessionStatus('active');
    setSessionStartAt(startTime);
    setIsLoading(false);
    setError(null);
    setShowSummary(false);
    setUserClosedSummary(false);
    setIsWaitingForSessionEnd(false);
  }, []);

  /**
   * endSession
   * 현재 세션 종료
   */
  const endSession = useCallback(() => {
    setSessionStatus('ended');
    setIsWaitingForSessionEnd(true);
  }, []);

  /**
   * resetSession
   * 세션 상태 완전히 초기화
   * 세션 결과 확인 후 대시보드로 돌아갈 때 호출
   * 암호화된 토큰도 함께 삭제
   */
  const resetSession = useCallback(() => {
    // 암호화된 토큰 삭제
    tokenStorage.clearToken();

    // 세션 상태 초기화
    setSessionId(null);
    setSessionStatus('ended');
    setSessionStartAt(null);
    setIsLoading(false);
    setIsWaitingForSessionEnd(false);
    setError(null);
    setShowSummary(false);
    setUserClosedSummary(false);
  }, []);

  const value: SessionContextType = {
    // 읽기 전용 상태
    sessionId,
    sessionStatus,
    sessionStartAt,
    isLoading,
    isWaitingForSessionEnd,
    error,
    showSummary,
    userClosedSummary,

    // 상태 업데이트 함수
    setSessionId,
    setSessionStatus,
    setSessionStartAt,
    setIsLoading,
    setIsWaitingForSessionEnd,
    setError,
    setShowSummary,
    setUserClosedSummary,

    // 편의 함수
    startSession,
    endSession,
    resetSession,
  };

  return (
    <SessionContext.Provider value={value}>
      {children}
    </SessionContext.Provider>
  );
}

/**
 * useSession
 * SessionContext 사용 hook
 *
 * @throws {Error} SessionContextProvider 없이 사용 시
 *
 * @example
 * ```tsx
 * const { sessionId, sessionStatus, startSession } = useSession();
 * ```
 */
export function useSession(): SessionContextType {
  const context = useContext(SessionContext);

  if (context === undefined) {
    throw new Error(
      '❌ useSession must be used within <SessionContextProvider>. ' +
      'Make sure your component is wrapped with SessionContextProvider in main.tsx'
    );
  }

  return context;
}

export default SessionContext;
