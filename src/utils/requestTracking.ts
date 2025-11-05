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
 * URL 파라미터에서 민감한 정보 마스킹
 */
export function sanitizeUrlForLogging(url: string): string {
  try {
    const parsed = new URL(url, 'http://localhost');

    // 민감한 파라미터 마스크
    const sensitiveParams = ['token', 'apiKey', 'secret', 'password', 'sessionId', 'userId', 'email', 'phone'];
    const params = new URLSearchParams(parsed.search);

    for (const key of params.keys()) {
      if (sensitiveParams.some((sensitive) => key.toLowerCase().includes(sensitive.toLowerCase()))) {
        const value = params.get(key);
        // 각 필드에 맞는 마스킹 적용
        if (value && value.length > 0) {
          if (key.toLowerCase().includes('token')) {
            params.set(key, value.slice(0, 3) + '***' + value.slice(-3));
          } else if (key.toLowerCase().includes('email')) {
            const [local, domain] = value.split('@');
            if (domain) {
              params.set(key, local[0] + '***@' + domain);
            }
          } else {
            params.set(key, '[REDACTED]');
          }
        }
      }
    }

    parsed.search = params.toString();
    return parsed.toString();
  } catch {
    return url;
  }
}

/**
 * 요청/응답 데이터에서 민감한 정보 마스킹
 *
 * @param data - 마스킹할 데이터 객체
 * @param depth - 재귀 깊이 (순환 참조 방지)
 * @returns 마스킹된 데이터
 */
export function maskSensitiveDataInObject(
  data: Record<string, any>,
  depth: number = 0
): Record<string, any> {
  if (depth > 3) return data; // 깊은 중첩 방지

  const sensitiveKeyPatterns = [
    'token', 'jwt', 'secret', 'apikey', 'password',
    'sessionid', 'session_id', 'userid', 'user_id',
    'email', 'phone', 'creditcard', 'ssn'
  ];

  const masked = { ...data };

  for (const [key, value] of Object.entries(masked)) {
    const keyLower = key.toLowerCase();

    if (typeof value === 'string' && value.length > 0) {
      // 민감한 키 패턴 확인
      const isSensitive = sensitiveKeyPatterns.some((pattern) =>
        keyLower.includes(pattern)
      );

      if (isSensitive) {
        // 값의 타입에 따라 마스킹
        if (keyLower.includes('token') || keyLower.includes('jwt')) {
          masked[key] = value.slice(0, 3) + '***' + value.slice(-3);
        } else if (keyLower.includes('email')) {
          const [local, domain] = value.split('@');
          masked[key] = domain ? `${local[0]}***@${domain}` : '[REDACTED]';
        } else if (keyLower.includes('phone')) {
          const digits = value.replace(/\D/g, '');
          if (digits.length >= 8) {
            masked[key] = digits.slice(0, 3) + '****' + digits.slice(-4);
          } else {
            masked[key] = '[REDACTED]';
          }
        } else {
          masked[key] = '[REDACTED]';
        }
      }
    } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      // 재귀적으로 중첩 객체 처리
      masked[key] = maskSensitiveDataInObject(value, depth + 1);
    }
  }

  return masked;
}

/**
 * CSRF 토큰 관리
 */
let cachedCsrfToken: string | null = null;
const CSRF_STORAGE_KEY = 'bemore_csrf_token';
const CSRF_COOKIE_NAME = 'csrf-token';

export function generateCsrfToken(): string {
  return Array.from(crypto.getRandomValues(new Uint8Array(32)))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export function getCsrfToken(): string {
  if (cachedCsrfToken) {
    return cachedCsrfToken;
  }

  try {
    // localStorage에서 CSRF 토큰 읽기
    const stored = localStorage.getItem(CSRF_STORAGE_KEY);
    if (stored) {
      cachedCsrfToken = stored;
      return stored;
    }

    // 쿠키에서 읽기 시도
    const cookieValue = getCookie(CSRF_COOKIE_NAME);
    if (cookieValue) {
      localStorage.setItem(CSRF_STORAGE_KEY, cookieValue);
      cachedCsrfToken = cookieValue;
      return cookieValue;
    }

    // 새 토큰 생성
    const newToken = generateCsrfToken();
    localStorage.setItem(CSRF_STORAGE_KEY, newToken);
    cachedCsrfToken = newToken;
    return newToken;
  } catch {
    // localStorage 사용 불가능시 메모리 기반
    if (!cachedCsrfToken) {
      cachedCsrfToken = generateCsrfToken();
    }
    return cachedCsrfToken;
  }
}

export function setCsrfToken(token: string): void {
  cachedCsrfToken = token;
  try {
    localStorage.setItem(CSRF_STORAGE_KEY, token);
  } catch {}
}

/**
 * 쿠키에서 값 읽기
 */
export function getCookie(name: string): string | null {
  if (typeof document === 'undefined') {
    return null;
  }

  const nameEQ = name + '=';
  const cookies = document.cookie.split(';');

  for (const cookie of cookies) {
    const trimmed = cookie.trim();
    if (trimmed.startsWith(nameEQ)) {
      return decodeURIComponent(trimmed.substring(nameEQ.length));
    }
  }

  return null;
}

export default {
  generateRequestId,
  getClientVersion,
  getDeviceId,
  parseRateLimitHeaders,
  timestampTracker,
  generateSecurityHeaders,
  sanitizeUrlForLogging,
  maskSensitiveDataInObject,
  generateCsrfToken,
  getCsrfToken,
  setCsrfToken,
  getCookie,
};
