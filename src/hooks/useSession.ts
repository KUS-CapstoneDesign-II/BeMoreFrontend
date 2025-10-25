import { useState, useCallback, useRef } from 'react';
import { sessionAPI } from '../services/api';
import type { SessionStatus, SessionStartResponse } from '../types';

export interface UseSessionReturn {
  sessionId: string | null;
  status: SessionStatus;
  wsUrls: SessionStartResponse['wsUrls'] | null;
  error: string | null;
  isLoading: boolean;
  startSession: (userId: string, counselorId: string) => Promise<void>;
  pauseSession: () => Promise<void>;
  resumeSession: () => Promise<void>;
  endSession: () => Promise<void>;
  landmarksWebSocket: WebSocket | undefined;
}

export function useSession(): UseSessionReturn {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [status, setStatus] = useState<SessionStatus>('initializing');
  const [wsUrls, setWsUrls] = useState<SessionStartResponse['wsUrls'] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // WebSocket 참조 - synchronous access
  const websocketsRef = useRef<{
    landmarks?: WebSocket;
    voice?: WebSocket;
    session?: WebSocket;
  }>({});

  /**
   * 세션 시작
   */
  const startSession = useCallback(async (userId: string, counselorId: string) => {
    setIsLoading(true);
    setError(null);

    try {
      console.log('🚀 Starting session...', { userId, counselorId });
      const response = await sessionAPI.start(userId, counselorId);

      setSessionId(response.sessionId);
      setWsUrls(response.wsUrls);
      setStatus('active');

      // WebSocket 연결 생성
      if (response.wsUrls?.landmarks) {
        console.log('[useSession] 🔌 Creating landmarks WebSocket:', response.wsUrls.landmarks);
        const landmarksWs = new WebSocket(response.wsUrls.landmarks);

        landmarksWs.onopen = () => {
          console.log('[useSession] ✅ Landmarks WebSocket 연결됨 (OPEN)', {
            url: response.wsUrls.landmarks,
            readyState: landmarksWs.readyState,
            expected: WebSocket.OPEN,
          });
          websocketsRef.current.landmarks = landmarksWs;
        };

        landmarksWs.onclose = () => {
          console.log('[useSession] ❌ Landmarks WebSocket 종료됨 (CLOSED)');
          websocketsRef.current.landmarks = undefined;
        };

        landmarksWs.onerror = (error) => {
          console.error('[useSession] ❌ Landmarks WebSocket 에러:', error);
        };

        landmarksWs.onmessage = (event) => {
          console.log('[useSession] 📨 Landmarks WebSocket 메시지:', event.data);
        };

        // 연결 대기를 위해 약간의 시간 필요
        websocketsRef.current.landmarks = landmarksWs;
      }

      console.log('✅ Session started:', response.sessionId);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to start session';
      setError(errorMessage);
      setStatus('ended');
      console.error('❌ Session start failed:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * 세션 일시정지
   */
  const pauseSession = useCallback(async () => {
    if (!sessionId) {
      console.warn('⚠️ No active session to pause');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      console.log('⏸️ Pausing session:', sessionId);
      await sessionAPI.pause(sessionId);
      setStatus('paused');
      console.log('✅ Session paused');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to pause session';
      setError(errorMessage);
      console.error('❌ Session pause failed:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [sessionId]);

  /**
   * 세션 재개
   */
  const resumeSession = useCallback(async () => {
    if (!sessionId) {
      console.warn('⚠️ No session to resume');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      console.log('▶️ Resuming session:', sessionId);
      await sessionAPI.resume(sessionId);
      setStatus('active');
      console.log('✅ Session resumed');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to resume session';
      setError(errorMessage);
      console.error('❌ Session resume failed:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [sessionId]);

  /**
   * 세션 종료
   */
  const endSession = useCallback(async () => {
    if (!sessionId) {
      console.warn('⚠️ No session to end');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      console.log('🛑 Ending session:', sessionId);

      // WebSocket 종료
      if (websocketsRef.current.landmarks?.readyState === WebSocket.OPEN) {
        websocketsRef.current.landmarks.close();
        console.log('[useSession] ✅ Landmarks WebSocket 종료 요청');
      }

      await sessionAPI.end(sessionId);
      setStatus('ended');
      console.log('✅ Session ended');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to end session';
      setError(errorMessage);
      console.error('❌ Session end failed:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [sessionId]);

  return {
    sessionId,
    status,
    wsUrls,
    error,
    isLoading,
    startSession,
    pauseSession,
    resumeSession,
    endSession,
    landmarksWebSocket: websocketsRef.current.landmarks,
  };
}
