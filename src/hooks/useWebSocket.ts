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
  const [channels, setChannels] = useState<WebSocketChannels | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<Record<string, ConnectionStatus>>({
    landmarks: 'disconnected',
    voice: 'disconnected',
    session: 'disconnected',
  });
  const [landmarksWs, setLandmarksWs] = useState<WebSocket | null>(null);

  // 전체 연결 상태 계산
  const isConnected = Object.values(connectionStatus).every((status) => status === 'connected');


  // WebSocket 연결
  const connect = useCallback(
    (wsUrls: { landmarks: string; voice: string; session: string }) => {
      if (managerRef.current) {
        console.warn('⚠️ WebSocket already connected. Disconnecting first...');
        managerRef.current.disconnectAll();
      }

      managerRef.current = new WebSocketManager();

      // 먼저 connect 호출하여 channels를 받음
      let newChannelsRef: WebSocketChannels | null = null;

      const newChannels = managerRef.current.connect(wsUrls, (channel: string, status: ConnectionStatus) => {
        if (import.meta.env.DEV) {
          console.log(`[WebSocket] Status change: ${channel} = ${status}`);
        }
        setConnectionStatus((prev) => ({ ...prev, [channel]: status }));

        // Landmarks WebSocket이 connected 상태가 되면 즉시 설정 시도
        if (channel === 'landmarks' && status === 'connected') {
          if (import.meta.env.DEV) {
            console.log('[WebSocket] Trying to set landmarksWs immediately...');
          }

          // 최신 newChannels 참조 사용
          const rawWs = newChannelsRef?.landmarks?.getRawWebSocket?.();

          if (import.meta.env.DEV) {
            console.log('[WebSocket] rawWs:', !!rawWs, 'readyState:', rawWs?.readyState);
          }

          if (rawWs?.readyState === WebSocket.OPEN) {
            setLandmarksWs(rawWs);
            if (import.meta.env.DEV) {
              console.log('[WebSocket] 📡 Landmarks WebSocket 설정됨 (immediate)');
            }
          } else {
            // 폴링으로 다시 시도
            if (import.meta.env.DEV) {
              console.log('[WebSocket] ⚠️ rawWs not OPEN yet, will retry via polling');
            }
            let retries = 0;
            const pollInterval = setInterval(() => {
              retries++;
              const retryWs = newChannelsRef?.landmarks?.getRawWebSocket?.();
              if (retryWs?.readyState === WebSocket.OPEN) {
                setLandmarksWs(retryWs);
                if (import.meta.env.DEV) {
                  console.log('[WebSocket] 📡 Landmarks WebSocket 설정됨 (polling, attempt ' + retries + ')');
                }
                clearInterval(pollInterval);
              } else if (retries > 100) {
                clearInterval(pollInterval);
                if (import.meta.env.DEV) {
                  console.error('[WebSocket] ❌ Failed to set landmarksWs after 100 retries');
                }
              }
            }, 50);
          }
        }

        onStatusChange?.(channel, status);
      });

      newChannelsRef = newChannels;
      setChannels(newChannels);

      // 메시지 핸들러 등록
      if (onLandmarksMessage) {
        newChannels.landmarks.onMessage(onLandmarksMessage);
      }
      if (onVoiceMessage) {
        newChannels.voice.onMessage(onVoiceMessage);
      }
      if (onSessionMessage) {
        newChannels.session.onMessage(onSessionMessage);
      }

      console.log('[WebSocket] ✅ useWebSocket: Channel initialization started');
      console.log('[WebSocket] 🔌 Landmarks URL:', wsUrls.landmarks);
      console.log('[WebSocket] 🔌 Voice URL:', wsUrls.voice);
      console.log('[WebSocket] 🔌 Session URL:', wsUrls.session);
    },
    [onLandmarksMessage, onVoiceMessage, onSessionMessage, onStatusChange]
  );

  // WebSocket 연결 해제
  const disconnect = useCallback(() => {
    if (managerRef.current) {
      managerRef.current.disconnectAll();
      managerRef.current = null;
      setChannels(null);
      setConnectionStatus({
        landmarks: 'disconnected',
        voice: 'disconnected',
        session: 'disconnected',
      });
      console.log('✅ WebSocket 연결 해제 완료');
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
    sendToLandmarks,
    sendToVoice,
    sendToSession,
    // Landmarks WebSocket이 OPEN 상태일 때만 반환
    landmarksWs,
  };
}
