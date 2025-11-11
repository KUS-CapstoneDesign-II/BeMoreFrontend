import { maskSessionId } from '../../utils/security';
import { sanitizeUrlForLogging, maskSensitiveDataInObject } from '../../utils/requestTracking';
import { ERROR_MESSAGES } from '../../utils/messageHelper';
import type { CORSErrorDetails } from './types';
import type { AxiosError } from 'axios';

/**
 * CORS 오류 감지 및 분류
 */
export function detectCORSError(error: unknown): CORSErrorDetails {
  // Type guard for error object
  if (typeof error !== 'object' || error === null) {
    return { isCORS: false };
  }

  const axiosError = error as Partial<AxiosError>;
  const message = axiosError.message || '';
  const statusCode = axiosError.response?.status;

  // 프리플라이트 실패 (preflight CORS error)
  if (statusCode === 0 && message.includes('Failed to fetch')) {
    return { isCORS: true, details: 'preflight-failed' };
  }

  // 응답은 받았지만 CORS 헤더 문제
  if (statusCode === 403 || statusCode === 401) {
    const corsHeader = axiosError.response?.headers?.['access-control-allow-origin'];
    if (!corsHeader) {
      return { isCORS: true, details: 'missing-cors-header' };
    }
  }

  return { isCORS: false };
}

/**
 * API 에러 로깅
 */
export function logApiError(
  error: unknown,
  requestId: string | undefined,
  serverReqId: string | undefined
): void {
  // Type guard for error object
  if (typeof error !== 'object' || error === null) {
    console.error('❌ API Error: Unknown error type');
    return;
  }

  const axiosError = error as Partial<AxiosError>;
  let errorMsg = axiosError.message || 'Unknown error';

  // 요청 ID 마스킹
  const trackedReqId = requestId || serverReqId;
  const maskedReqId = trackedReqId ? maskSessionId(trackedReqId) : 'unknown';

  if (trackedReqId) {
    errorMsg = `${errorMsg} [${maskedReqId}]`;
  }

  // 상세 에러 로깅
  const isTimeout = axiosError.code === 'ECONNABORTED' || (axiosError.message || '').includes('timeout');
  const statusCode = axiosError.response?.status || 'unknown';
  const sanitizedUrl = sanitizeUrlForLogging(axiosError.config?.url || 'unknown');

  // 에러 응답 데이터 마스킹
  const errorData = axiosError.response?.data;
  const maskedErrorData =
    typeof errorData === 'object' && errorData
      ? maskSensitiveDataInObject(errorData as Record<string, unknown>)
      : errorData;

  // CORS 오류 감지
  const corsError = detectCORSError(error);
  let corsDetails = '';
  if (corsError.isCORS) {
    corsDetails =
      corsError.details === 'preflight-failed'
        ? ' (CORS preflight failed - check backend CORS headers)'
        : ' (CORS header missing or invalid)';
    errorMsg = `${axiosError.message || 'Unknown error'} - CORS Configuration Error${corsDetails}`;
  }

  // 에러 로깅 (환경별)
  if (import.meta.env.DEV) {
    if (isTimeout) {
      console.warn(`⏱️ API Timeout [${maskedReqId}]: ${sanitizedUrl}`, {
        error: errorMsg,
        errorData: maskedErrorData,
      });
    } else if (corsError.isCORS) {
      console.error(`🔒 CORS Error [${maskedReqId}]: ${sanitizedUrl}`, {
        error: errorMsg,
        details: corsError.details,
        errorData: maskedErrorData,
        suggestion: 'Backend needs to include x-request-id in Access-Control-Allow-Headers',
      });
    } else {
      console.error(`❌ API Error [${maskedReqId}] (${statusCode}): ${sanitizedUrl}`, {
        error: errorMsg,
        errorData: maskedErrorData,
      });
    }
  } else {
    // 프로덕션 환경: 간단한 메시지만 로깅
    if (isTimeout) {
      console.warn(`⏱️ API Timeout [${maskedReqId}]: ${sanitizedUrl}`);
    } else if (corsError.isCORS) {
      console.error(
        `🔒 CORS Error [${maskedReqId}]: ${sanitizedUrl} - Backend CORS configuration needed`
      );
    } else {
      console.error(`❌ API Error [${maskedReqId}] (${statusCode}): ${sanitizedUrl}`);
    }
  }
}

/**
 * 사용자 친화적 에러 메시지 생성
 * CORS, 타임아웃, 서버 에러 등을 감지하여 적절한 메시지 반환
 */
export function getUserFriendlyErrorMessage(error: unknown): string {
  // Type guard for error object
  if (typeof error !== 'object' || error === null) {
    return ERROR_MESSAGES.UNKNOWN_ERROR;
  }

  const axiosError = error as Partial<AxiosError>;

  // 1. CORS 에러 감지
  const corsError = detectCORSError(error);
  if (corsError.isCORS) {
    return ERROR_MESSAGES.CORS_ERROR;
  }

  // 2. 타임아웃 에러 감지
  const isTimeout =
    axiosError.code === 'ECONNABORTED' ||
    (axiosError.message || '').toLowerCase().includes('timeout');
  if (isTimeout) {
    return ERROR_MESSAGES.TIMEOUT_ERROR;
  }

  // 3. 네트워크 연결 실패 (TypeError with "Failed to fetch" or "Network Error")
  const isNetworkError =
    (axiosError.message || '').includes('Network Error') ||
    (axiosError.message || '').includes('Failed to fetch') ||
    axiosError.code === 'ERR_NETWORK';
  if (isNetworkError) {
    return ERROR_MESSAGES.SERVER_CONNECTION_FAILED;
  }

  // 4. HTTP 상태 코드별 메시지
  const statusCode = axiosError.response?.status;
  if (statusCode) {
    // 5xx: 서버 에러
    if (statusCode >= 500) {
      return ERROR_MESSAGES.SERVER_ERROR;
    }

    // 4xx: 클라이언트 에러 (백엔드 응답 메시지가 있으면 사용)
    const serverMessage = (axiosError.response?.data as { error?: { message?: string } })?.error
      ?.message;
    if (serverMessage && typeof serverMessage === 'string') {
      return serverMessage; // 백엔드가 제공한 사용자 친화적 메시지 사용
    }
  }

  // 5. 기본 에러 메시지
  return ERROR_MESSAGES.REQUEST_FAILED;
}
