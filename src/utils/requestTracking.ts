/**
 * Request Tracking Utilities
 *
 * API 요청 추적, ID 생성, 보안 헤더 관리
 * - 모든 요청에 고유 ID 할당
 * - 클라이언트 버전 추적
 * - 기기 ID 생성
 * - Rate limiting 모니터링
 */

/**
 * 고유한 요청 ID 생성
 * Format: {timestamp}-{random}-{counter}
 * Example: 1731234567890-abc123-001
 */
let requestCounter = 0;
export function generateRequestId(prefix: string = 'req'): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  const counter = (requestCounter++).toString().padStart(3, '0');

  return `${prefix}_${timestamp}_${random}_${counter}`;
}

/**
 * 클라이언트 버전 반환
 * package.json의 version 또는 환경 변수에서 읽음
 */
export function getClientVersion(): string {
  // Try to get version from package.json (build time)
  if (typeof import.meta.env.VITE_APP_VERSION !== 'undefined') {
    return import.meta.env.VITE_APP_VERSION as string;
  }

  // Fallback to package.json version or default
  return '1.0.0';
}

/**
 * 기기 ID 생성 및 캐싱
 * localStorage에 저장하여 세션 간 일관성 유지
 */
let cachedDeviceId: string | null = null;

export function getDeviceId(): string {
  if (cachedDeviceId) {
    return cachedDeviceId;
  }

  try {
    // 저장된 기기 ID 확인
    const stored = localStorage.getItem('bemore_device_id');
    if (stored) {
      cachedDeviceId = stored;
      return stored;
    }

    // 새 기기 ID 생성
    const newDeviceId = generateRequestId('device');
    localStorage.setItem('bemore_device_id', newDeviceId);
    cachedDeviceId = newDeviceId;
    return newDeviceId;
  } catch {
    // localStorage 사용 불가능 시 메모리 기반 생성
    if (!cachedDeviceId) {
      cachedDeviceId = generateRequestId('device');
    }
    return cachedDeviceId;
  }
}

/**
 * Rate limiting 헤더 파싱
 */
export interface RateLimitInfo {
  limit: number | null;
  remaining: number | null;
  reset: number | null;
}

export function parseRateLimitHeaders(headers: Record<string, any>): RateLimitInfo {
  return {
    limit: headers['x-ratelimit-limit'] ? parseInt(headers['x-ratelimit-limit'], 10) : null,
    remaining: headers['x-ratelimit-remaining'] ? parseInt(headers['x-ratelimit-remaining'], 10) : null,
    reset: headers['x-ratelimit-reset'] ? parseInt(headers['x-ratelimit-reset'], 10) : null,
  };
}

/**
 * 요청 타임스탬프 추적
 */
export class RequestTimestampTracker {
  private timestamps: Map<string, { start: number; end?: number; duration?: number }> = new Map();

  startRequest(requestId: string): void {
    this.timestamps.set(requestId, { start: Date.now() });
  }

  endRequest(requestId: string): number {
    const entry = this.timestamps.get(requestId);
    if (!entry) return 0;

    const duration = Date.now() - entry.start;
    entry.end = Date.now();
    entry.duration = duration;

    return duration;
  }

  getMetrics(requestId: string): { start: number; end?: number; duration?: number } | undefined {
    return this.timestamps.get(requestId);
  }

  clear(): void {
    // 오래된 항목 제거 (5분 이상 전)
    const now = Date.now();
    const maxAge = 5 * 60 * 1000;

    for (const [key, entry] of this.timestamps.entries()) {
      if (now - entry.start > maxAge) {
        this.timestamps.delete(key);
      }
    }
  }
}

export const timestampTracker = new RequestTimestampTracker();

/**
 * 요청 보안 헤더 생성
 */
export interface SecurityHeaders {
  'X-Request-ID': string;
  'X-Client-Version': string;
  'X-Device-ID': string;
  'X-Timestamp': string;
}

export function generateSecurityHeaders(requestId?: string): SecurityHeaders {
  return {
    'X-Request-ID': requestId || generateRequestId(),
    'X-Client-Version': getClientVersion(),
    'X-Device-ID': getDeviceId(),
    'X-Timestamp': Date.now().toString(),
  };
}

/**
 * 민감한 데이터 로깅 방지
 */
export function sanitizeUrlForLogging(url: string): string {
  try {
    const parsed = new URL(url, 'http://localhost');

    // 민감한 파라미터 마스크
    const sensitiveParams = ['token', 'apiKey', 'secret', 'password', 'sessionId', 'userId'];
    const params = new URLSearchParams(parsed.search);

    for (const key of params.keys()) {
      if (sensitiveParams.some((sensitive) => key.toLowerCase().includes(sensitive.toLowerCase()))) {
        params.set(key, '[REDACTED]');
      }
    }

    parsed.search = params.toString();
    return parsed.toString();
  } catch {
    return url;
  }
}

export default {
  generateRequestId,
  getClientVersion,
  getDeviceId,
  parseRateLimitHeaders,
  timestampTracker,
  generateSecurityHeaders,
  sanitizeUrlForLogging,
};
