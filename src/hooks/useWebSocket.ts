import { useEffect, useRef, useState, useCallback } from 'react';
import { WebSocketManager } from '../services/websocket';
import type {
  WebSocketChannels,
  WSMessageHandler,
  ConnectionStatus,
} from '../services/websocket';
import type { WSMessage } from '../types';

interface UseWebSocketOptions {
  onLandmarksMessage?: WSMessageHandler;
  onVoiceMessage?: WSMessageHandler;
  onSessionMessage?: WSMessageHandler;
  onStatusChange?: (channel: string, status: ConnectionStatus) => void;
}

interface UseWebSocketReturn {
  channels: WebSocketChannels | null;
  isConnected: boolean;
  connectionStatus: Record<string, ConnectionStatus>;
  connect: (wsUrls: { landmarks: string; voice: string; session: string }) => void;
  disconnect: () => void;
  suppressReconnect: () => void;
  sendToLandmarks: (message: WSMessage) => void;
  sendToVoice: (message: WSMessage) => void;
  sendToSession: (message: WSMessage) => void;
  landmarksWs: WebSocket | null;
}

/**
 * useWebSocket 훅
 *
 * 3개 채널(landmarks, voice, session) WebSocket 연결을 관리합니다.
 *
 * @example
 * ```tsx
 * const { channels, isConnected, connect, sendToVoice } = useWebSocket({
 *   onVoiceMessage: (message) => {
 *     if (message.type === 'stt_received') {
 *       console.log('STT:', message.data.text);
 *     }
 *   }
 * });
 *
 * // 세션 시작 후 연결
 * useEffect(() => {
 *   if (wsUrls) {
 *     connect(wsUrls);
 *   }
 * }, [wsUrls]);
 * ```
 */
export function useWebSocket(options: UseWebSocketOptions = {}): UseWebSocketReturn {
  const {
    onLandmarksMessage,
    onVoiceMessage,
    onSessionMessage,
    onStatusChange,
  } = options;

  const managerRef = useRef<WebSocketManager | null>(null);
  const landmarksWsRef = useRef<WebSocket | null>(null);
  const [channels, setChannels] = useState<WebSocketChannels | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<Record<string, ConnectionStatus>>({
    landmarks: 'disconnected',
    voice: 'disconnected',
    session: 'disconnected',
  });
  // Trigger re-render when landmarksWs changes (for VideoFeed to receive updates)
  const [landmarksWs, setLandmarksWs] = useState<WebSocket | null>(null);

  // 전체 연결 상태 계산
  const isConnected = Object.values(connectionStatus).every((status) => status === 'connected');


  // WebSocket 연결
  const connect = useCallback(
    (wsUrls: { landmarks: string; voice: string; session: string }) => {
      console.log('[useWebSocket.connect] CALLED! wsUrls:', wsUrls);

      if (managerRef.current) {
        console.warn('⚠️ WebSocket already connected. Disconnecting first...');
        managerRef.current.disconnectAll();
      }

      managerRef.current = new WebSocketManager();
      console.log('[useWebSocket.connect] WebSocketManager created');

      // 먼저 connect 호출하여 channels를 받음
      const newChannels = managerRef.current.connect(wsUrls, (channel: string, status: ConnectionStatus) => {
        console.log(`[useWebSocket.callback] Status change: ${channel} = ${status}`);
        setConnectionStatus((prev) => ({ ...prev, [channel]: status }));

        // Landmarks WebSocket이 connected 상태가 되면 즉시 설정 시도
        if (channel === 'landmarks' && status === 'connected') {
          console.log('[useWebSocket.callback] 🎯 Landmarks CONNECTED callback triggered');
          console.log('[useWebSocket.callback] newChannels:', !!newChannels);
          console.log('[useWebSocket.callback] newChannels.landmarks:', !!newChannels?.landmarks);

          // newChannels 직접 사용 (closure에서 참조 가능)
          const rawWs = newChannels?.landmarks?.getRawWebSocket?.();

          console.log('[useWebSocket.callback] rawWs:', !!rawWs, 'readyState:', rawWs?.readyState, 'expected:', WebSocket.OPEN);

          if (rawWs?.readyState === WebSocket.OPEN) {
            console.log('[useWebSocket.callback] ✅ Setting landmarksWs with OPEN WebSocket');
            console.log('[useWebSocket.callback] rawWs object:', rawWs);
            console.log('[useWebSocket.callback] rawWs.readyState before setLandmarksWs:', rawWs.readyState);
            try {
              // Set both ref (immediate) and state (for re-render)
              landmarksWsRef.current = rawWs;
              console.log('[useWebSocket.callback] 🔴 BEFORE setLandmarksWs - checking setter function');
              console.log('[useWebSocket.callback] typeof setLandmarksWs:', typeof setLandmarksWs);
              setLandmarksWs(rawWs);
              console.log('[useWebSocket.callback] 🟢 AFTER setLandmarksWs - state update called');
              console.log('[useWebSocket.callback] 📡 Landmarks WebSocket 설정됨 (immediate) - SUCCESS');
              console.log('[useWebSocket.callback] ✅ BOTH ref and state updated with WebSocket');
            } catch (err) {
              console.error('[useWebSocket.callback] ❌ ERROR setting landmarksWs:', err);
            }
          } else {
            // 폴링으로 다시 시도
            console.log('[useWebSocket.callback] ⚠️ rawWs not OPEN (readyState=' + rawWs?.readyState + '), will retry via polling');
            let retries = 0;
            const pollInterval = setInterval(() => {
              retries++;
              const retryWs = newChannels?.landmarks?.getRawWebSocket?.();
              if (retryWs?.readyState === WebSocket.OPEN) {
                console.log('[useWebSocket.polling] ✅ Setting landmarksWs via polling (attempt ' + retries + ')');
                // Set both ref (immediate) and state (for re-render)
                landmarksWsRef.current = retryWs;
                setLandmarksWs(retryWs);
                console.log('[useWebSocket.polling] 📡 Landmarks WebSocket 설정됨 (polling)');
                console.log('[useWebSocket.polling] ✅ BOTH ref and state updated with WebSocket');
                clearInterval(pollInterval);
              } else if (retries > 100) {
                console.error('[useWebSocket.polling] ❌ Failed to set landmarksWs after 100 retries');
                clearInterval(pollInterval);
              }
            }, 50);
          }
        }

        onStatusChange?.(channel, status);
      });

      setChannels(newChannels);

      // 메시지 핸들러는 useEffect에서 관리됩니다 (중복 등록 방지)

      console.log('[WebSocket] ✅ useWebSocket: Channel initialization started');
      console.log('[WebSocket] 🔌 Landmarks URL:', wsUrls.landmarks);
      console.log('[WebSocket] 🔌 Voice URL:', wsUrls.voice);
      console.log('[WebSocket] 🔌 Session URL:', wsUrls.session);
    },
    [onStatusChange]
  );

  // WebSocket 연결 해제
  const disconnect = useCallback(() => {
    if (managerRef.current) {
      managerRef.current.disconnectAll();
      managerRef.current = null;
      setChannels(null);
      landmarksWsRef.current = null;
      setLandmarksWs(null);
      setConnectionStatus({
        landmarks: 'disconnected',
        voice: 'disconnected',
        session: 'disconnected',
      });
      console.log('✅ WebSocket 연결 해제 완료');
    }
  }, []);

  // 재연결 억제 (세션 종료 직전에 호출)
  const suppressReconnect = useCallback(() => {
    if (managerRef.current) {
      managerRef.current.suppressReconnectAll();
    }
  }, []);

  // 메시지 전송 함수들
  const sendToLandmarks = useCallback(
    (message: WSMessage) => {
      if (!channels?.landmarks) {
        console.error('❌ Landmarks channel not connected');
        return;
      }
      channels.landmarks.send(message);
    },
    [channels]
  );

  const sendToVoice = useCallback(
    (message: WSMessage) => {
      if (!channels?.voice) {
        console.error('❌ Voice channel not connected');
        return;
      }
      channels.voice.send(message);
    },
    [channels]
  );

  const sendToSession = useCallback(
    (message: WSMessage) => {
      if (!channels?.session) {
        console.error('❌ Session channel not connected');
        return;
      }
      channels.session.send(message);
    },
    [channels]
  );

  // 메시지 핸들러 등록 (중복 등록 방지)
  useEffect(() => {
    if (!channels) return;

    const cleanupFunctions: (() => void)[] = [];

    // 각 채널의 메시지 핸들러 등록 및 cleanup 함수 저장
    if (onLandmarksMessage) {
      const cleanup = channels.landmarks.onMessage(onLandmarksMessage);
      cleanupFunctions.push(cleanup);
      if (import.meta.env.DEV) {
        console.log('[useWebSocket] 🟢 Landmarks message handler registered');
      }
    }

    if (onVoiceMessage) {
      const cleanup = channels.voice.onMessage(onVoiceMessage);
      cleanupFunctions.push(cleanup);
      if (import.meta.env.DEV) {
        console.log('[useWebSocket] 🔵 Voice message handler registered');
      }
    }

    if (onSessionMessage) {
      const cleanup = channels.session.onMessage(onSessionMessage);
      cleanupFunctions.push(cleanup);
      if (import.meta.env.DEV) {
        console.log('[useWebSocket] 🟡 Session message handler registered');
      }
    }

    // Cleanup: 핸들러 제거
    return () => {
      cleanupFunctions.forEach((cleanup) => cleanup());
      if (import.meta.env.DEV) {
        console.log('[useWebSocket] 🧹 Message handlers cleaned up');
      }
    };
  }, [channels, onLandmarksMessage, onVoiceMessage, onSessionMessage]);

  // 컴포넌트 언마운트 시 연결 해제
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return {
    channels,
    isConnected,
    connectionStatus,
    connect,
    disconnect,
    suppressReconnect,
    sendToLandmarks,
    sendToVoice,
    sendToSession,
    // Landmarks WebSocket이 OPEN 상태일 때만 반환
    landmarksWs,
  };
}
