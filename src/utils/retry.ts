import { Logger } from '../config/env';

/**
 * 재시도 옵션
 */
export interface RetryOptions {
  maxAttempts?: number;
  initialDelayMs?: number;
  maxDelayMs?: number;
  backoffMultiplier?: number;
  shouldRetry?: (error: any, attempt: number) => boolean;
}

/**
 * 재시도 결과
 */
export interface RetryResult<T> {
  success: boolean;
  data?: T;
  error?: any;
  attempts: number;
  lastError?: string;
}

/**
 * Exponential backoff를 사용한 자동 재시도 로직
 *
 * 예시:
 * ```
 * const result = await retryWithBackoff(() => fetchData(), {
 *   maxAttempts: 3,
 *   initialDelayMs: 1000,
 * });
 * ```
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<RetryResult<T>> {
  const {
    maxAttempts = 3,
    initialDelayMs = 1000,
    maxDelayMs = 30000,
    backoffMultiplier = 2,
    shouldRetry = isRetryableError,
  } = options;

  let lastError: any;
  let lastErrorMessage = '';

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const data = await fn();
      if (attempt > 1) {
        Logger.info(`✅ 재시도 성공 (${attempt}번째 시도)`, { data });
      }
      return {
        success: true,
        data,
        attempts: attempt,
      };
    } catch (error) {
      lastError = error;
      lastErrorMessage =
        error instanceof Error ? error.message : String(error);

      // 마지막 시도이거나 재시도하지 않기로 판단된 경우
      if (attempt === maxAttempts || !shouldRetry(error, attempt)) {
        Logger.error(`❌ 모든 재시도 실패 (${attempt}/${maxAttempts})`, {
          error: lastErrorMessage,
        });
        return {
          success: false,
          error: lastError,
          attempts: attempt,
          lastError: lastErrorMessage,
        };
      }

      // 대기 시간 계산 (exponential backoff)
      const delayMs = Math.min(
        initialDelayMs * Math.pow(backoffMultiplier, attempt - 1),
        maxDelayMs
      );

      // 지터 추가 (0~20% 랜덤)
      const jitter = delayMs * 0.2 * Math.random();
      const actualDelayMs = delayMs + jitter;

      Logger.warn(
        `⚠️ 재시도 예정 (${attempt}/${maxAttempts - 1}) - ${Math.round(actualDelayMs)}ms 후`,
        {
          error: lastErrorMessage,
        }
      );

      // 대기
      await new Promise((resolve) => setTimeout(resolve, actualDelayMs));
    }
  }

  // 이 코드는 도달할 수 없지만, TypeScript를 위해 필요
  return {
    success: false,
    error: lastError,
    attempts: maxAttempts,
    lastError: lastErrorMessage,
  };
}

/**
 * 네트워크 오류 판별 함수
 * 재시도 가능한 오류인지 확인
 */
export function isRetryableError(error: any, attempt: number): boolean {
  // 최대 시도 횟수 초과
  if (attempt >= 3) {
    return false;
  }

  // Axios 에러 확인
  if (error.response) {
    const status = error.response.status;

    // 재시도하면 안 되는 상태 코드
    if (
      status === 400 || // Bad Request
      status === 401 || // Unauthorized
      status === 403 || // Forbidden
      status === 404    // Not Found
    ) {
      return false;
    }

    // 재시도 가능한 상태 코드
    if (
      status === 408 || // Request Timeout
      status === 429 || // Too Many Requests
      status === 500 || // Internal Server Error
      status === 502 || // Bad Gateway
      status === 503 || // Service Unavailable
      status === 504    // Gateway Timeout
    ) {
      return true;
    }
  }

  // 네트워크 에러 (CORS, 네트워크 타임아웃 등)
  if (
    error.code === 'ERR_NETWORK' ||
    error.code === 'ECONNABORTED' ||
    error.message === 'Network Error' ||
    error.message?.includes('timeout')
  ) {
    return true;
  }

  // 기타 에러는 재시도 하지 않음
  return false;
}

/**
 * 재시도 상태 표시용 메시지 생성
 */
export function getRetryMessage(
  attempts: number,
  maxAttempts: number,
  delayMs: number
): string {
  const delaySec = Math.ceil(delayMs / 1000);
  return `${attempts}/${maxAttempts}번 재시도 중... ${delaySec}초 후 재시도`;
}

/**
 * Request ID를 이용한 중복 제거
 * 같은 요청이 여러 번 전송되는 것을 방지
 */
export class RequestDeduplicator {
  private pendingRequests = new Map<string, Promise<any>>();

  /**
   * 중복 제거된 요청 실행
   */
  async executeOnce<T>(
    requestId: string,
    fn: () => Promise<T>
  ): Promise<T> {
    // 이미 진행 중인 요청이 있으면 그것을 반환
    if (this.pendingRequests.has(requestId)) {
      Logger.debug('📌 중복 요청 제거:', { requestId });
      return this.pendingRequests.get(requestId)!;
    }

    // 새로운 요청 실행
    const promise = fn()
      .then((result) => {
        this.pendingRequests.delete(requestId);
        return result;
      })
      .catch((error) => {
        this.pendingRequests.delete(requestId);
        throw error;
      });

    this.pendingRequests.set(requestId, promise);
    return promise;
  }

  /**
   * 요청 취소 (메모리 정리)
   */
  clear(requestId?: string): void {
    if (requestId) {
      this.pendingRequests.delete(requestId);
    } else {
      this.pendingRequests.clear();
    }
  }

  /**
   * 진행 중인 요청 개수
   */
  getPendingCount(): number {
    return this.pendingRequests.size;
  }
}

/**
 * 싱글톤 요청 중복 제거기
 */
export const requestDeduplicator = new RequestDeduplicator();
