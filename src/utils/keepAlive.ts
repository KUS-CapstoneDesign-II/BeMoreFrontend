import { useRef, useEffect } from 'react';
import { Logger } from '../config/env';

/**
 * Keep-Alive Configuration
 * Prevents Render free tier auto-shutdown (1 hour inactivity)
 */
export interface KeepAliveConfig {
  intervalMs?: number;      // Interval between pings (default: 25 minutes)
  timeoutMs?: number;       // API request timeout (default: 5 seconds)
  maxRetries?: number;      // Max retry attempts (default: 3)
  enableLogging?: boolean;  // Enable detailed logging (default: true)
}

/**
 * Keep-Alive Statistics
 */
export interface KeepAliveStats {
  successCount: number;
  failureCount: number;
  lastPingTime: Date | null;
  successRate: number;
  isActive: boolean;
  uptime: number; // milliseconds
}

/**
 * Keep-Alive Manager
 *
 * Maintains backend connectivity by sending periodic health check pings.
 * Prevents Render free tier automatic shutdown after 1 hour of inactivity.
 *
 * Strategy:
 * - 25-minute interval (Render shuts down after 60 minutes of inactivity)
 * - Exponential backoff retry: 1s, 2s, 4s
 * - ±20% jitter to prevent thundering herd
 * - Graceful fallback on timeout or permanent failure
 *
 * Example:
 * ```
 * const keepAlive = new KeepAliveManager(sessionId, { intervalMs: 25 * 60 * 1000 });
 * keepAlive.start();
 * // ... later
 * keepAlive.stop();
 * const stats = keepAlive.getStats();
 * ```
 */
export class KeepAliveManager {
  private sessionId: string;
  private intervalMs: number;
  private timeoutMs: number;
  private maxRetries: number;
  private enableLogging: boolean;
  private timer: ReturnType<typeof setInterval> | null = null;
  private successCount: number = 0;
  private failureCount: number = 0;
  private lastPingTime: Date | null = null;
  private startTime: number = Date.now();

  constructor(sessionId: string, config: KeepAliveConfig = {}) {
    this.sessionId = sessionId;
    this.intervalMs = config.intervalMs ?? 25 * 60 * 1000; // 25 minutes default
    this.timeoutMs = config.timeoutMs ?? 5000; // 5 seconds default
    this.maxRetries = config.maxRetries ?? 3;
    this.enableLogging = config.enableLogging !== false;

    if (this.enableLogging) {
      Logger.info('🔄 KeepAliveManager initialized', {
        sessionId,
        interval: `${this.intervalMs / 60 / 1000} minutes`,
        timeout: `${this.timeoutMs}ms`,
        maxRetries: this.maxRetries
      });
    }
  }

  /**
   * Start the keep-alive mechanism
   */
  start(): void {
    if (this.timer) {
      Logger.warn('⚠️ KeepAliveManager already running');
      return;
    }

    if (this.enableLogging) {
      Logger.info('▶️ KeepAliveManager started', { sessionId: this.sessionId });
    }

    // Initial ping immediately
    this.ping(1).catch((error) => {
      Logger.error('❌ Initial keep-alive ping failed', { error: error.message });
    });

    // Set up recurring pings
    this.timer = setInterval(() => {
      this.ping(1).catch((error) => {
        Logger.error('❌ Keep-alive ping failed', { error: error.message });
      });
    }, this.intervalMs);
  }

  /**
   * Stop the keep-alive mechanism
   */
  stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;

      if (this.enableLogging) {
        Logger.info('⏹️ KeepAliveManager stopped', {
          sessionId: this.sessionId,
          stats: this.getStats()
        });
      }
    }
  }

  /**
   * Send a keep-alive ping with exponential backoff retry
   * @param attempt Current attempt number (1-based)
   * @returns Promise<boolean> Success status
   */
  async ping(attempt: number = 1): Promise<boolean> {
    try {
      // Call health check endpoint with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs);

      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/health`, {
        method: 'GET',
        signal: controller.signal,
        headers: { 'Content-Type': 'application/json' }
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        this.successCount++;
        this.lastPingTime = new Date();

        if (this.enableLogging && attempt > 1) {
          Logger.debug('✅ Keep-alive ping successful (after retry)', {
            sessionId: this.sessionId,
            attempt,
            timestamp: this.lastPingTime.toISOString()
          });
        } else if (this.enableLogging) {
          Logger.debug('✅ Keep-alive ping successful', {
            sessionId: this.sessionId,
            timestamp: this.lastPingTime.toISOString()
          });
        }

        return true;
      } else {
        throw new Error(`HTTP ${response.status}`);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);

      // If not the last attempt, retry with backoff
      if (attempt < this.maxRetries) {
        const delayMs = Math.pow(2, attempt - 1) * 1000; // 1s, 2s, 4s
        const jitter = delayMs * 0.2 * Math.random(); // ±20% jitter
        const actualDelayMs = delayMs + jitter;

        if (this.enableLogging) {
          Logger.warn(`⚠️ Keep-alive ping retry scheduled (${attempt}/${this.maxRetries - 1})`, {
            sessionId: this.sessionId,
            error: errorMessage,
            retryAfter: `${Math.round(actualDelayMs)}ms`
          });
        }

        // Schedule retry with backoff
        await new Promise((resolve) => setTimeout(resolve, actualDelayMs));
        return this.ping(attempt + 1);
      } else {
        // Max retries exceeded
        this.failureCount++;

        Logger.error(`❌ Keep-alive ping failed after ${this.maxRetries} attempts`, {
          sessionId: this.sessionId,
          error: errorMessage,
          lastAttempt: attempt
        });

        return false;
      }
    }
  }

  /**
   * Get current statistics
   */
  getStats(): KeepAliveStats {
    const total = this.successCount + this.failureCount;
    const successRate = total > 0
      ? (this.successCount / total * 100)
      : 0;

    return {
      successCount: this.successCount,
      failureCount: this.failureCount,
      lastPingTime: this.lastPingTime,
      successRate: Math.round(successRate * 100) / 100,
      isActive: this.timer !== null,
      uptime: Date.now() - this.startTime
    };
  }

  /**
   * Reset statistics
   */
  resetStats(): void {
    this.successCount = 0;
    this.failureCount = 0;
    this.lastPingTime = null;
    this.startTime = Date.now();
  }

  /**
   * Check if keep-alive is active
   */
  isActive(): boolean {
    return this.timer !== null;
  }
}

/**
 * React Hook for Keep-Alive
 *
 * Usage:
 * ```
 * const sessionId = useSelector((state) => state.session.id);
 * useKeepAlive(!!sessionId);
 * ```
 */
export function useKeepAlive(enabled: boolean, sessionId?: string): void {
  const manager = useRef<KeepAliveManager | null>(null);
  const _sessionId = sessionId || '';

  useEffect(() => {
    if (enabled && _sessionId && !manager.current) {
      // Create and start manager
      manager.current = new KeepAliveManager(_sessionId, {
        intervalMs: 25 * 60 * 1000, // 25 minutes
        timeoutMs: 5000,
        maxRetries: 3,
        enableLogging: true
      });

      manager.current.start();

      Logger.info('🔄 Keep-Alive hook activated', { sessionId: _sessionId });

      return () => {
        // Cleanup on unmount or when disabled
        if (manager.current) {
          manager.current.stop();
          manager.current = null;
        }
      };
    } else if (!enabled && manager.current) {
      // Stop if disabled
      manager.current.stop();
      manager.current = null;
    }
  }, [enabled, _sessionId]);
}

/**
 * Singleton Keep-Alive Manager for global use
 */
let globalKeepAliveManager: KeepAliveManager | null = null;

/**
 * Initialize global keep-alive manager
 */
export function initializeGlobalKeepAlive(sessionId: string, config?: KeepAliveConfig): KeepAliveManager {
  if (globalKeepAliveManager) {
    globalKeepAliveManager.stop();
  }

  globalKeepAliveManager = new KeepAliveManager(sessionId, config);
  globalKeepAliveManager.start();

  Logger.info('🌍 Global keep-alive initialized', { sessionId });

  return globalKeepAliveManager;
}

/**
 * Stop global keep-alive manager
 */
export function stopGlobalKeepAlive(): void {
  if (globalKeepAliveManager) {
    globalKeepAliveManager.stop();
    globalKeepAliveManager = null;
    Logger.info('🌍 Global keep-alive stopped');
  }
}

/**
 * Get global keep-alive manager
 */
export function getGlobalKeepAlive(): KeepAliveManager | null {
  return globalKeepAliveManager;
}

/**
 * Get global keep-alive statistics
 */
export function getGlobalKeepAliveStats(): KeepAliveStats | null {
  return globalKeepAliveManager ? globalKeepAliveManager.getStats() : null;
}
