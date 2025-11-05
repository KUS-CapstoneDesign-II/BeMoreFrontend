/**
 * WebSocket Client with common features:
 * - Health check (ping/pong)
 * - Exponential backoff reconnection
 * - Topic resubscription
 * - Network online/offline event handling
 * - Message queue during disconnection
 */

export interface WSClientOptions {
  url: string;
  maxReconnectAttempts?: number;
  initialReconnectDelay?: number;
  maxReconnectDelay?: number;
  heartbeatInterval?: number;
  heartbeatTimeout?: number;
}

export interface WSMessage {
  type: string;
  data?: unknown;
  [key: string]: unknown;
}

export type WSMessageHandler = (message: WSMessage) => void;

export class WSClient {
  private ws: WebSocket | null = null;
  private url: string;
  private maxReconnectAttempts: number;
  private initialReconnectDelay: number;
  private maxReconnectDelay: number;
  private heartbeatInterval: number;
  private heartbeatTimeout: number;

  private reconnectAttempts: number = 0;
  private reconnectDelay: number;
  private reconnectTimeoutId: ReturnType<typeof setTimeout> | null = null;
  private heartbeatTimeoutId: ReturnType<typeof setTimeout> | null = null;
  private heartbeatIntervalId: ReturnType<typeof setInterval> | null = null;

  private messageHandlers: Map<string, Set<WSMessageHandler>> = new Map();
  private messageQueue: WSMessage[] = [];
  private isConnecting: boolean = false;
  private subscriptions: Set<string> = new Set();

  private connectionStatusCallback: ((status: 'connected' | 'disconnected' | 'reconnecting') => void) | null = null;

  constructor(options: WSClientOptions) {
    this.url = options.url;
    this.maxReconnectAttempts = options.maxReconnectAttempts ?? 10;
    this.initialReconnectDelay = options.initialReconnectDelay ?? 1000;
    this.maxReconnectDelay = options.maxReconnectDelay ?? 60000;
    this.heartbeatInterval = options.heartbeatInterval ?? 30000;
    this.heartbeatTimeout = options.heartbeatTimeout ?? 5000;

    this.reconnectDelay = this.initialReconnectDelay;

    // Network status listeners
    window.addEventListener('online', () => this.onNetworkOnline());
    window.addEventListener('offline', () => this.onNetworkOffline());
  }

  /**
   * Connect to WebSocket server
   */
  public connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        resolve();
        return;
      }

      if (this.isConnecting) {
        reject(new Error('Connection already in progress'));
        return;
      }

      this.isConnecting = true;

      try {
        this.ws = new WebSocket(this.url);

        this.ws.onopen = () => {
          this.isConnecting = false;
          this.reconnectAttempts = 0;
          this.reconnectDelay = this.initialReconnectDelay;
          this.startHeartbeat();
          this.flushMessageQueue();
          this.resubscribeTopics();
          this.notifyStatusChange('connected');
          resolve();
        };

        this.ws.onmessage = (event) => {
          this.handleMessage(event.data);
        };

        this.ws.onerror = (error) => {
          console.error('WebSocket error:', error);
          this.notifyStatusChange('disconnected');
          reject(error);
        };

        this.ws.onclose = () => {
          this.isConnecting = false;
          this.stopHeartbeat();
          this.notifyStatusChange('disconnected');
          this.scheduleReconnect();
        };
      } catch (error) {
        this.isConnecting = false;
        reject(error);
      }
    });
  }

  /**
   * Disconnect from WebSocket server
   */
  public disconnect(): void {
    if (this.reconnectTimeoutId) {
      clearTimeout(this.reconnectTimeoutId);
      this.reconnectTimeoutId = null;
    }
    this.stopHeartbeat();
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.subscriptions.clear();
    this.messageQueue = [];
  }

  /**
   * Send message to server
   */
  public send(message: WSMessage): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      // Queue message for later delivery
      this.messageQueue.push(message);
    }
  }

  /**
   * Subscribe to message type
   */
  public subscribe(type: string, handler: WSMessageHandler): () => void {
    if (!this.messageHandlers.has(type)) {
      this.messageHandlers.set(type, new Set());
    }
    this.messageHandlers.get(type)!.add(handler);
    this.subscriptions.add(type);

    // Unsubscribe function
    return () => {
      const handlers = this.messageHandlers.get(type);
      if (handlers) {
        handlers.delete(handler);
      }
    };
  }

  /**
   * Get connection status
   */
  public isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  /**
   * Set connection status callback
   */
  public onStatusChange(callback: (status: 'connected' | 'disconnected' | 'reconnecting') => void): void {
    this.connectionStatusCallback = callback;
  }

  // ========== Private Methods ==========

  private handleMessage(data: string): void {
    try {
      const message = JSON.parse(data) as WSMessage;
      const { type } = message;

      // Handle ping/pong for heartbeat
      if (type === 'ping') {
        this.send({ type: 'pong' });
        return;
      }

      if (type === 'pong') {
        this.clearHeartbeatTimeout();
        return;
      }

      // Route message to subscribers
      const handlers = this.messageHandlers.get(type);
      if (handlers) {
        handlers.forEach((handler) => {
          try {
            handler(message);
          } catch (error) {
            console.error(`Error in message handler for type ${type}:`, error);
          }
        });
      }
    } catch (error) {
      console.error('Failed to parse WebSocket message:', error);
    }
  }

  private scheduleReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnect attempts reached');
      return;
    }

    this.reconnectAttempts += 1;
    this.notifyStatusChange('reconnecting');

    const jitter = Math.random() * 1000;
    const delay = Math.min(
      this.reconnectDelay + jitter,
      this.maxReconnectDelay
    );

    this.reconnectTimeoutId = setTimeout(() => {
      this.connect().catch((error) => {
        console.error('Reconnection failed:', error);
      });
    }, delay);

    // Exponential backoff
    this.reconnectDelay = Math.min(
      this.reconnectDelay * 2,
      this.maxReconnectDelay
    );
  }

  private startHeartbeat(): void {
    this.heartbeatIntervalId = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.send({ type: 'ping' });
        this.setHeartbeatTimeout();
      }
    }, this.heartbeatInterval);
  }

  private stopHeartbeat(): void {
    if (this.heartbeatIntervalId) {
      clearInterval(this.heartbeatIntervalId);
      this.heartbeatIntervalId = null;
    }
    this.clearHeartbeatTimeout();
  }

  private setHeartbeatTimeout(): void {
    this.clearHeartbeatTimeout();
    this.heartbeatTimeoutId = setTimeout(() => {
      console.warn('Heartbeat timeout, closing connection');
      if (this.ws) {
        this.ws.close();
      }
    }, this.heartbeatTimeout);
  }

  private clearHeartbeatTimeout(): void {
    if (this.heartbeatTimeoutId) {
      clearTimeout(this.heartbeatTimeoutId);
      this.heartbeatTimeoutId = null;
    }
  }

  private flushMessageQueue(): void {
    while (this.messageQueue.length > 0) {
      const message = this.messageQueue.shift();
      if (message) {
        this.send(message);
      }
    }
  }

  private resubscribeTopics(): void {
    this.subscriptions.forEach((topic) => {
      this.send({ type: 'subscribe', topic });
    });
  }

  private onNetworkOnline(): void {
    console.log('Network online detected');
    if (!this.isConnected()) {
      this.connect().catch((error) => {
        console.error('Failed to reconnect after network online:', error);
      });
    }
  }

  private onNetworkOffline(): void {
    console.log('Network offline detected');
    this.notifyStatusChange('disconnected');
  }

  private notifyStatusChange(status: 'connected' | 'disconnected' | 'reconnecting'): void {
    if (this.connectionStatusCallback) {
      this.connectionStatusCallback(status);
    }
  }
}
