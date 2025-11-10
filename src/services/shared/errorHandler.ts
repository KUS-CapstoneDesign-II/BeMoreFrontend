import { maskSessionId } from '../../utils/security';
import { sanitizeUrlForLogging, maskSensitiveDataInObject } from '../../utils/requestTracking';
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
