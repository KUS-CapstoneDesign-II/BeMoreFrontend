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

    if (import.meta.env.DEV) {
      console.log(`[ReconnectingWebSocket Constructor] ${this.name}: onStatusChange is ${onStatusChange ? 'DEFINED ✅' : 'UNDEFINED ❌'}`);
      console.log(`[ReconnectingWebSocket Constructor] ${this.name}: this.onStatusChange = ${this.onStatusChange ? 'SET ✅' : 'NOT SET ❌'}`);

      // Log the callback function itself to verify it's the wrapper
      if (onStatusChange) {
        console.log(`[ReconnectingWebSocket Constructor] ${this.name}: Callback toString:`, onStatusChange.toString().substring(0, 100));
      }
    }
  }

  // =============================
  // Internal helpers
  // =============================

  private startHeartbeat(): void {
    this.stopHeartbeat();
    const isHidden = typeof document !== 'undefined' && document.visibilityState === 'hidden';
    const interval = isHidden ? HEARTBEAT_INTERVAL_HIDDEN_MS : HEARTBEAT_INTERVAL_VISIBLE_MS;
    this.heartbeatTimer = setInterval(() => {
      try {
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
  }

  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  private registerVisibilityListener(): void {
    this.visibilityHandler = () => {
      this.startHeartbeat();
    };
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', this.visibilityHandler);
    }
  }

  private unregisterVisibilityListener(): void {
    if (this.visibilityHandler && typeof document !== 'undefined') {
      document.removeEventListener('visibilitychange', this.visibilityHandler);
      this.visibilityHandler = undefined;
    }
  }

  private registerOnlineListener(): void {
    this.onlineHandler = () => {
      if (typeof navigator !== 'undefined' && navigator.onLine) {
        console.log(`🌐 Back online. Reconnecting ${this.name}...`);
        window.removeEventListener('online', this.onlineHandler!);
        this.onlineHandler = undefined;
        this.reconnect();
      }
    };
    window.addEventListener('online', this.onlineHandler);
  }

  /**
   * WebSocket 연결
   */
  connect(): void {
    console.log(`\n[ReconnectingWebSocket.connect] ${this.name} - START`);

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

    console.log(`[WebSocket] ${this.name} connecting to ${this.url}...`);
    console.log(`[WebSocket] ${this.name} - About to call onStatusChange('connecting')...`);
    this.onStatusChange?.('connecting');
    console.log(`[WebSocket] ${this.name} - CALLED onStatusChange('connecting') ✅`);

    try {
      this.ws = new WebSocket(this.url);

      this.ws.onopen = () => {
        console.log(`\n[WebSocket.onopen] 🟢 ${this.name} CONNECTED (readyState: OPEN)`);
        console.log(`[WebSocket.onopen] ${this.name}: About to call this.onStatusChange...`);
        console.log(`[WebSocket.onopen] ${this.name}: this.onStatusChange = ${this.onStatusChange ? 'EXISTS ✅' : 'UNDEFINED ❌'}`);

        this.retryCount = 0;
        this.retryDelay = 1000; // 재연결 성공 시 리셋

        if (this.onStatusChange) {
          console.log(`[WebSocket.onopen] ${this.name}: CALLING onStatusChange('connected')...`);

          // CRITICAL: Log the callback function name to verify it's the wrapper
          const cbName = this.onStatusChange.name || 'anonymous';
          const cbStart = this.onStatusChange.toString().substring(0, 80);
          console.log(`[WebSocket.onopen] ${this.name}: Callback name = "${cbName}"`);
          console.log(`[WebSocket.onopen] ${this.name}: Callback start = "${cbStart}"`);

          this.onStatusChange('connected');
          console.log(`[WebSocket.onopen] ${this.name}: CALLED onStatusChange('connected') successfully ✅`);
        } else {
          console.error(`[WebSocket.onopen] ${this.name}: FAILED - this.onStatusChange is undefined ❌`);
        }

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
          console.error(`[WebSocket] ❌ ${this.name} message parse error:`, error);
        }
      };

      this.ws.onclose = () => {
        console.log(`[WebSocket] 🔌 ${this.name} disconnected`);
        this.onStatusChange?.('disconnected');
        this.stopHeartbeat();
        this.unregisterVisibilityListener();

        if (this.shouldReconnect) {
          this.reconnect();
        }
      };

      this.ws.onerror = (event) => {
        // Error handled via onclose/reconnect
        console.error(`[WebSocket] ❌ ${this.name} error:`, event);
        this.onStatusChange?.('error');
      };
    } catch (error) {
      console.error(`[WebSocket] ❌ ${this.name} connection failed:`, error);
      this.onStatusChange?.('error');
      this.reconnect();
    }
  }

  /**
   * 재연결 시도
   */
  private reconnect(): void {
    if (this.retryCount >= this.maxRetries) {
      console.error(`[WebSocket] 🚨 ${this.name} max retries reached (${this.maxRetries})`);
      this.onStatusChange?.('error');
      return;
    }

    if (typeof navigator !== 'undefined' && navigator.onLine === false) {
      console.log(`[WebSocket] 🌐 Offline. ${this.name} will reconnect when back online.`);
      this.registerOnlineListener();
      return;
    }

    this.retryCount++;
    console.log(`[WebSocket] 🔄 ${this.name} reconnecting... (${this.retryCount}/${this.maxRetries})`);

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

  /**
   * 원본 WebSocket 인스턴스 가져오기
   * (직접 send를 호출해야 할 때 사용)
   */
  getRawWebSocket(): WebSocket | null {
    if (this.ws?.readyState === WebSocket.OPEN) {
      return this.ws;
    }
    if (import.meta.env.DEV) {
      const readyStateMap: Record<number, string> = {
        0: 'CONNECTING',
        1: 'OPEN',
        2: 'CLOSING',
        3: 'CLOSED',
      };
      const status = this.ws?.readyState ?? 'null';
      const statusName = typeof status === 'number' ? readyStateMap[status] : 'null';
      console.warn(`[WebSocket] ${this.name} getRawWebSocket() - status: ${statusName} (${status})`);
    }
    return this.ws;
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
    console.log('\n========== 🚀 WebSocketManager.connect() CALLED ==========');
    console.log('[WebSocket] Initializing 3 channels (landmarks, voice, session)...');
    console.log(`[WebSocketManager.connect] onStatusChange is ${onStatusChange ? 'DEFINED ✅' : 'UNDEFINED ❌'}`);

    if (import.meta.env.DEV && !onStatusChange) {
      console.warn('[WebSocket] ⚠️ onStatusChange callback is undefined!');
    }

    if (import.meta.env.DEV) {
      console.log('[WebSocketManager.connect] Creating wrapper callbacks...');
      console.log(`[WebSocketManager.connect] onStatusChange is ${onStatusChange ? 'DEFINED ✅' : 'UNDEFINED ❌'}`);
      if (onStatusChange) {
        console.log('[WebSocketManager.connect] onStatusChange.toString():', onStatusChange.toString().substring(0, 150));
      }
    }

    // CRITICAL FIX: Explicitly capture onStatusChange to ensure it's not undefined in closure
    const landmarksCallback = onStatusChange
      ? (status: ConnectionStatus) => {
          console.log('[WebSocket] 🟢 Landmarks status callback WRAPPER called with status:', status);
          onStatusChange('landmarks', status);
        }
      : undefined;

    const voiceCallback = onStatusChange
      ? (status: ConnectionStatus) => {
          console.log('[WebSocket] 🔵 Voice status callback WRAPPER called with status:', status);
          onStatusChange('voice', status);
        }
      : undefined;

    const sessionCallback = onStatusChange
      ? (status: ConnectionStatus) => {
          console.log('[WebSocket] 🟡 Session status callback WRAPPER called with status:', status);
          onStatusChange('session', status);
        }
      : undefined;

    this.channels = {
      landmarks: new ReconnectingWebSocket(wsUrls.landmarks, 'Landmarks', {}, landmarksCallback),
      voice: new ReconnectingWebSocket(wsUrls.voice, 'Voice', {}, voiceCallback),
      session: new ReconnectingWebSocket(wsUrls.session, 'Session', {}, sessionCallback),
    };

    // 모든 채널 연결
    console.log('[WebSocket] Connecting landmarks...');
    this.channels.landmarks.connect();
    console.log('[WebSocket] Connecting voice...');
    this.channels.voice.connect();
    console.log('[WebSocket] Connecting session...');
    this.channels.session.connect();

    console.log('✅ WebSocketManager.connect() COMPLETED - All 3 channels initiated');
    console.log('========== 🚀 END WebSocketManager.connect() ==========\n');

    return this.channels;
  }

  /**
   * 모든 WebSocket 채널 종료
   */
  closeAll(): void {
    if (this.channels) {
      Object.values(this.channels).forEach((ws) => ws.close());
      this.channels = null;
      console.log('[WebSocket] All 3 channels closed');
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

// Heartbeat intervals
const HEARTBEAT_INTERVAL_VISIBLE_MS = 15000;
const HEARTBEAT_INTERVAL_HIDDEN_MS = 30000;
const HEARTBEAT_STALE_THRESHOLD_MS = 45000;

export default WebSocketManager;
