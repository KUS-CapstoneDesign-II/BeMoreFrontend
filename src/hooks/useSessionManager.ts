import { useCallback, useRef, useState } from 'react';

export interface SessionData {
  sessionId: string;
  wsUrls: {
    landmarks: string;
    voice: string;
    session: string;
  };
  startedAt: number;
  status: 'active' | 'paused' | 'ended';
}

interface UseSessionManagerReturn {
  sessionData: SessionData | null;
  isLoading: boolean;
  error: string | null;
  createSession: (userId: string, counselorId: string) => Promise<SessionData>;
  endSession: () => Promise<void>;
}

/**
 * useSessionManager 훅
 *
 * 상담 세션의 생성, 관리, 종료를 담당합니다.
 * 세션 생성 시 백엔드로부터 WebSocket URLs를 받아 반환합니다.
 *
 * @example
 * ```tsx
 * const { sessionData, createSession, endSession } = useSessionManager();
 *
 * // 카메라 시작 시 세션 생성
 * const handleCameraStart = async () => {
 *   const session = await createSession('user_123', 'counselor_456');
 *   console.log('WebSocket URLs:', session.wsUrls);
 * };
 *
 * // 세션 종료
 * const handleSessionEnd = async () => {
 *   await endSession();
 * };
 * ```
 */
export function useSessionManager(): UseSessionManagerReturn {
  const [sessionData, setSessionData] = useState<SessionData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const apiUrlRef = useRef(
    (import.meta.env.VITE_API_URL as string) ||
    (import.meta.env.VITE_API_BASE_URL as string) ||
    'http://localhost:8000'
  );

  /**
   * Step 1: 백엔드에 세션 생성 요청
   * POST /api/session/start → sessionId, wsUrls 받음
   */
  const createSession = useCallback(
    async (userId: string, counselorId: string): Promise<SessionData> => {
      try {
        setIsLoading(true);
        setError(null);

        console.log('📋 세션 생성 요청:', { userId, counselorId });

        const response = await fetch(`${apiUrlRef.current}/api/session/start`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId,
            counselorId,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData?.error?.message || `세션 생성 실패: ${response.status}`);
        }

        const data = await response.json();
        const newSessionData: SessionData = data.data;

        setSessionData(newSessionData);
        console.log('✅ 세션 생성 성공:', newSessionData.sessionId);
        console.log('📡 WebSocket URLs:', newSessionData.wsUrls);

        return newSessionData;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : '세션 생성 실패';
        setError(errorMessage);
        console.error('❌ 세션 생성 에러:', errorMessage);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  /**
   * 세션 종료
   * POST /api/session/:id/end
   */
  const endSession = useCallback(async () => {
    if (!sessionData?.sessionId) {
      console.warn('⚠️ 활성 세션이 없습니다.');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      console.log('📋 세션 종료 요청:', sessionData.sessionId);

      const response = await fetch(`${apiUrlRef.current}/api/session/${sessionData.sessionId}/end`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        throw new Error(`세션 종료 실패: ${response.status}`);
      }

      setSessionData(null);
      console.log('✅ 세션 종료 완료');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '세션 종료 실패';
      setError(errorMessage);
      console.error('❌ 세션 종료 에러:', errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [sessionData?.sessionId]);

  return {
    sessionData,
    isLoading,
    error,
    createSession,
    endSession,
  };
}
