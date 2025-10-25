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

  // Landmarks WebSocket을 connectionStatus 변경 시 업데이트
  // (channels는 초기 설정 후 변경되지 않으므로 connectionStatus를 감시)
  useEffect(() => {
    if (!channels) {
      if (import.meta.env.DEV) {
        console.log('[useEffect] ❌ channels is null, returning');
      }
      return;
    }

    if (import.meta.env.DEV) {
      console.log('[useEffect] Landmarks connectionStatus changed:', connectionStatus.landmarks);
    }

    const trySetLandmarks = () => {
      const rawWs = channels.landmarks?.getRawWebSocket();

      if (import.meta.env.DEV && rawWs) {
        console.log('[polling] readyState:', rawWs.readyState, 'OPEN=', WebSocket.OPEN);
      }

      if (rawWs?.readyState === WebSocket.OPEN) {
        setLandmarksWs(rawWs);
        if (import.meta.env.DEV) {
          console.log('[WebSocket] 📡 Landmarks WebSocket 업데이트 - READY');
        }
        return true;
      }
      return false;
    };

    // 즉시 한 번 시도
    if (trySetLandmarks()) {
      return;
    }

    // 아직 준비되지 않았으면 계속 폴링
    const interval = setInterval(() => {
      if (trySetLandmarks()) {
        clearInterval(interval);
      }
    }, 50);

    return () => clearInterval(interval);
  }, [channels, connectionStatus.landmarks]);

  // WebSocket 연결
  const connect = useCallback(
    (wsUrls: { landmarks: string; voice: string; session: string }) => {
      if (managerRef.current) {
        console.warn('⚠️ WebSocket already connected. Disconnecting first...');
        managerRef.current.disconnectAll();
      }

      managerRef.current = new WebSocketManager();

      const handleStatusChange = (channel: string, status: ConnectionStatus) => {
        setConnectionStatus((prev) => ({ ...prev, [channel]: status }));
        onStatusChange?.(channel, status);
      };

      const newChannels = managerRef.current.connect(wsUrls, handleStatusChange);
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
