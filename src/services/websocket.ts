import type { WSMessage } from '../types';

// =====================================
// WebSocket Manager
// =====================================

export type WSMessageHandler = (message: WSMessage) => void;
export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'error';

export interface ReconnectOptions {
  maxRetries?: number;
  retryDelay?: number;
  maxRetryDelay?: number;
}

export class ReconnectingWebSocket {
  private ws: WebSocket | null = null;
  private url: string;
  private name: string;
  private messageHandlers: Set<WSMessageHandler> = new Set();
  private shouldReconnect = true;
  private retryCount = 0;
  private retryDelay: number;
  private maxRetries: number;
  private maxRetryDelay: number;
  private onStatusChange?: (status: ConnectionStatus) => void;
  private heartbeatTimer: number | null = null;
  private lastActivityAt = 0;
  private visibilityHandler?: () => void;
  private onlineHandler?: () => void;

  constructor(
    url: string,
    name: string,
    options: ReconnectOptions = {},
    onStatusChange?: (status: ConnectionStatus) => void
  ) {
    this.url = url;
    this.name = name;
    this.retryDelay = options.retryDelay || 1000; // 1초
    this.maxRetries = options.maxRetries || 5;
    this.maxRetryDelay = options.maxRetryDelay || 30000; // 30초
    this.onStatusChange = onStatusChange;
  }

  /**
   * WebSocket 연결
   */
  connect(): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      console.log(`✅ ${this.name} already connected`);
      return;
    }

    // 오프라인이면 온라인 이벤트까지 대기
    if (typeof navigator !== 'undefined' && navigator.onLine === false) {
      console.log(`🌐 Offline detected. ${this.name} will wait for online event.`);
      this.onStatusChange?.('disconnected');
      this.registerOnlineListener();
      return;
    }

    console.log(`🔌 ${this.name} connecting to ${this.url}...`);
    this.onStatusChange?.('connecting');

    try {
      this.ws = new WebSocket(this.url);

      this.ws.onopen = () => {
        console.log(`✅ ${this.name} connected`);
        this.retryCount = 0;
        this.retryDelay = 1000; // 재연결 성공 시 리셋
        this.onStatusChange?.('connected');
        this.lastActivityAt = Date.now();
        this.startHeartbeat();
        this.registerVisibilityListener();
      };

      this.ws.onmessage = (event) => {
        try {
          const message: WSMessage = JSON.parse(event.data);
          this.messageHandlers.forEach((handler) => handler(message));
          this.lastActivityAt = Date.now();
        } catch (error) {
          console.error(`❌ ${this.name} message parse error:`, error);
        }
      };

      this.ws.onclose = () => {
        console.log(`🔌 ${this.name} disconnected`);
        this.onStatusChange?.('disconnected');
        this.stopHeartbeat();
        this.unregisterVisibilityListener();

        if (this.shouldReconnect) {
          this.reconnect();
        }
      };

      this.ws.onerror = (error) => {
        console.error(`❌ ${this.name} error:`, error);
        this.onStatusChange?.('error');
      };
    } catch (error) {
      console.error(`❌ ${this.name} connection failed:`, error);
      this.onStatusChange?.('error');
      this.reconnect();
    }
  }

  /**
   * 재연결 시도
   */
  private reconnect(): void {
    if (this.retryCount >= this.maxRetries) {
      console.error(`🚨 ${this.name} max retries reached (${this.maxRetries})`);
      this.onStatusChange?.('error');
      return;
    }

    if (typeof navigator !== 'undefined' && navigator.onLine === false) {
      console.log(`🌐 Offline. ${this.name} will reconnect when back online.`);
      this.registerOnlineListener();
      return;
    }

    this.retryCount++;
    console.log(`🔄 ${this.name} reconnecting... (${this.retryCount}/${this.maxRetries})`);

    setTimeout(() => {
      this.connect();
    }, this.retryDelay);

    // Exponential backoff
    this.retryDelay = Math.min(this.retryDelay * 2, this.maxRetryDelay);
  }

  /**
   * 메시지 전송
   */
  send(data: any): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      const message = typeof data === 'string' ? data : JSON.stringify(data);
      this.ws.send(message);
      console.log(`📤 ${this.name} sent:`, data);
    } else {
      console.warn(`⚠️ ${this.name} is not connected. Cannot send message.`);
    }
  }

  /**
   * 메시지 핸들러 등록
   */
  onMessage(handler: WSMessageHandler): () => void {
    this.messageHandlers.add(handler);

    // 핸들러 제거 함수 반환
    return () => {
      this.messageHandlers.delete(handler);
    };
  }

  /**
   * 연결 종료
   */
  close(): void {
    this.shouldReconnect = false;
    this.ws?.close();
    this.ws = null;
    this.messageHandlers.clear();
    console.log(`🔌 ${this.name} closed`);
    this.stopHeartbeat();
    this.unregisterVisibilityListener();
  }

  /**
   * 연결 상태 확인
   */
  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  /**
   * 연결 상태 가져오기
   */
  getReadyState(): number | null {
    return this.ws?.readyState ?? null;
  }
}

// =====================================
// WebSocket Manager (3개 채널 관리)
// =====================================

export interface WebSocketChannels {
  landmarks: ReconnectingWebSocket;
  voice: ReconnectingWebSocket;
  session: ReconnectingWebSocket;
}

export class WebSocketManager {
  private channels: WebSocketChannels | null = null;

  /**
   * WebSocket 채널 초기화 및 연결
   */
  connect(
    wsUrls: { landmarks: string; voice: string; session: string },
    onStatusChange?: (channel: keyof WebSocketChannels, status: ConnectionStatus) => void
  ): WebSocketChannels {
    console.log('🔌 Initializing WebSocket channels...');

    this.channels = {
      landmarks: new ReconnectingWebSocket(
        wsUrls.landmarks,
        'Landmarks',
        {},
        (status) => onStatusChange?.('landmarks', status)
      ),
      voice: new ReconnectingWebSocket(
        wsUrls.voice,
        'Voice',
        {},
        (status) => onStatusChange?.('voice', status)
      ),
      session: new ReconnectingWebSocket(
        wsUrls.session,
        'Session',
        {},
        (status) => onStatusChange?.('session', status)
      ),
    };

    // 모든 채널 연결
    Object.values(this.channels).forEach((ws) => ws.connect());

    return this.channels;
  }

  /**
   * 모든 WebSocket 채널 종료
   */
  closeAll(): void {
    if (this.channels) {
      Object.values(this.channels).forEach((ws) => ws.close());
      this.channels = null;
      console.log('🔌 All WebSocket channels closed');
    }
  }

  /**
   * 모든 WebSocket 채널 종료 (별칭)
   */
  disconnectAll(): void {
    this.closeAll();
  }

  /**
   * 채널 가져오기
   */
  getChannels(): WebSocketChannels | null {
    return this.channels;
  }
}

// =============================
// Helpers
// =============================

const HEARTBEAT_INTERVAL_VISIBLE_MS = 15000;
const HEARTBEAT_INTERVAL_HIDDEN_MS = 30000;
const HEARTBEAT_STALE_THRESHOLD_MS = 45000; // 활동 없으면 재연결 유도

ReconnectingWebSocket.prototype['startHeartbeat'] = function startHeartbeat(this: ReconnectingWebSocket) {
  this.stopHeartbeat();
  const isHidden = typeof document !== 'undefined' && document.visibilityState === 'hidden';
  const interval = isHidden ? HEARTBEAT_INTERVAL_HIDDEN_MS : HEARTBEAT_INTERVAL_VISIBLE_MS;
  this.heartbeatTimer = setInterval(() => {
    try {
      // 활동 확인: 최근 메시지 없으면 연결 재시도
      if (Date.now() - this.lastActivityAt > HEARTBEAT_STALE_THRESHOLD_MS) {
        console.warn(`❤️‍🩹 Heartbeat stale for ${this.name}. Forcing reconnect.`);
        this.ws?.close();
        return;
      }
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({ type: 'ping' }));
      }
    } catch {}
  }, interval) as unknown as number;
};

ReconnectingWebSocket.prototype['stopHeartbeat'] = function stopHeartbeat(this: ReconnectingWebSocket) {
  if (this.heartbeatTimer) {
    clearInterval(this.heartbeatTimer);
    this.heartbeatTimer = null;
  }
};

ReconnectingWebSocket.prototype['registerVisibilityListener'] = function registerVisibilityListener(this: ReconnectingWebSocket) {
  this.visibilityHandler = () => {
    // 가시성 변경 시 하트비트 주기를 조정
    this.startHeartbeat();
  };
  if (typeof document !== 'undefined') {
    document.addEventListener('visibilitychange', this.visibilityHandler);
  }
};

ReconnectingWebSocket.prototype['unregisterVisibilityListener'] = function unregisterVisibilityListener(this: ReconnectingWebSocket) {
  if (this.visibilityHandler && typeof document !== 'undefined') {
    document.removeEventListener('visibilitychange', this.visibilityHandler);
    this.visibilityHandler = undefined;
  }
};

ReconnectingWebSocket.prototype['registerOnlineListener'] = function registerOnlineListener(this: ReconnectingWebSocket) {
  this.onlineHandler = () => {
    if (typeof navigator !== 'undefined' && navigator.onLine) {
      console.log(`🌐 Back online. Reconnecting ${this.name}...`);
      window.removeEventListener('online', this.onlineHandler!);
      this.onlineHandler = undefined;
      this.reconnect();
    }
  };
  window.addEventListener('online', this.onlineHandler);
};

export default WebSocketManager;
