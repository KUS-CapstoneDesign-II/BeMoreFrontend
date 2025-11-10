import type { ApiError } from '../types/auth';

// ============================================================================
// Error Message Mapping
// ============================================================================

const ERROR_MESSAGES: Record<string, string> = {
  // Authentication Errors
  INVALID_CREDENTIALS: '이메일 또는 비밀번호가 올바르지 않습니다.',
  USER_NOT_FOUND: '사용자를 찾을 수 없습니다.',
  EMAIL_ALREADY_EXISTS: '이미 사용 중인 이메일입니다.',
  INVALID_TOKEN: '인증 토큰이 유효하지 않습니다. 다시 로그인해주세요.',
  TOKEN_EXPIRED: '세션이 만료되었습니다. 다시 로그인해주세요.',
  UNAUTHORIZED: '인증이 필요합니다.',

  // Validation Errors
  INVALID_EMAIL: '유효하지 않은 이메일 형식입니다.',
  INVALID_PASSWORD: '비밀번호는 최소 8자 이상이어야 합니다.',
  INVALID_USERNAME: '사용자명을 입력해주세요.',
  PASSWORD_TOO_WEAK: '비밀번호는 영문, 숫자, 특수문자를 포함해야 합니다.',

  // Server Errors
  INTERNAL_SERVER_ERROR: '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
  SERVICE_UNAVAILABLE: '서비스를 일시적으로 사용할 수 없습니다.',
  NETWORK_ERROR: '네트워크 연결을 확인해주세요.',

  // Rate Limiting
  TOO_MANY_REQUESTS: '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.',

  // Default
  UNKNOWN_ERROR: '알 수 없는 오류가 발생했습니다.',
};

// ============================================================================
// Error Handler Functions
// ============================================================================

/**
 * API 오류 응답을 사용자 친화적인 메시지로 변환
 */
export function getErrorMessage(error: ApiError | Error | unknown): string {
  // ApiError 타입인 경우
  if (isApiError(error)) {
    const code = error.error.code;
    const messageFromCode = ERROR_MESSAGES[code];
    return messageFromCode ?? error.error.message ?? ERROR_MESSAGES.UNKNOWN_ERROR;
  }

  // Error 객체인 경우
  if (error instanceof Error) {
    // 네트워크 오류
    if (error.message.includes('Failed to fetch') || error.message.includes('Network')) {
      return ERROR_MESSAGES.NETWORK_ERROR;
    }
    return error.message;
  }

  // 알 수 없는 오류
  return ERROR_MESSAGES.UNKNOWN_ERROR;
}

/**
 * HTTP 상태 코드에 따른 오류 메시지 반환
 */
export function getHttpErrorMessage(status: number): string {
  switch (status) {
    case 400:
      return '잘못된 요청입니다.';
    case 401:
      return ERROR_MESSAGES.UNAUTHORIZED ?? ERROR_MESSAGES.UNKNOWN_ERROR;
    case 403:
      return '접근 권한이 없습니다.';
    case 404:
      return '요청한 리소스를 찾을 수 없습니다.';
    case 409:
      return '이미 존재하는 데이터입니다.';
    case 429:
      return ERROR_MESSAGES.TOO_MANY_REQUESTS ?? ERROR_MESSAGES.UNKNOWN_ERROR;
    case 500:
      return ERROR_MESSAGES.INTERNAL_SERVER_ERROR ?? ERROR_MESSAGES.UNKNOWN_ERROR;
    case 503:
      return ERROR_MESSAGES.SERVICE_UNAVAILABLE ?? ERROR_MESSAGES.UNKNOWN_ERROR;
    default:
      return ERROR_MESSAGES.UNKNOWN_ERROR ?? '알 수 없는 오류가 발생했습니다.';
  }
}

/**
 * ApiError 타입 가드
 */
export function isApiError(error: unknown): error is ApiError {
  if (typeof error !== 'object' || error === null) {
    return false;
  }

  if (!('success' in error) || error.success !== false || !('error' in error)) {
    return false;
  }

  const errorObj = (error as { error: unknown }).error;
  return (
    typeof errorObj === 'object' &&
    errorObj !== null &&
    'code' in errorObj &&
    'message' in errorObj
  );
}

/**
 * 오류를 콘솔에 로깅 (개발 환경에서만)
 */
export function logError(error: unknown, context?: string): void {
  if (import.meta.env.DEV) {
    console.error(`[Error${context ? ` - ${context}` : ''}]:`, error);
  }
}

/**
 * 폼 유효성 검사 오류 처리
 */
export interface ValidationError {
  field: string;
  message: string;
}

export function getValidationErrors(error: ApiError): ValidationError[] {
  if (error.error.details && Array.isArray(error.error.details)) {
    return error.error.details.map((detail: unknown) => {
      const detailObj = detail as { field?: string; message?: string };
      return {
        field: detailObj.field ?? 'unknown',
        message: detailObj.message ?? ERROR_MESSAGES.UNKNOWN_ERROR ?? '알 수 없는 오류',
      };
    });
  }
  return [];
}

/**
 * 이메일 유효성 검사
 */
export function validateEmail(email: string): string | null {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email) {
    return '이메일을 입력해주세요.';
  }
  if (!emailRegex.test(email)) {
    return ERROR_MESSAGES.INVALID_EMAIL ?? '유효하지 않은 이메일 형식입니다.';
  }
  return null;
}

/**
 * 비밀번호 유효성 검사
 */
export function validatePassword(password: string): string | null {
  if (!password) {
    return '비밀번호를 입력해주세요.';
  }
  if (password.length < 8) {
    return ERROR_MESSAGES.INVALID_PASSWORD ?? '비밀번호는 최소 8자 이상이어야 합니다.';
  }
  // 영문, 숫자, 특수문자 중 2가지 이상 포함
  const hasLetter = /[a-zA-Z]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  const validCombinations = [hasLetter, hasNumber, hasSpecial].filter(Boolean).length;

  if (validCombinations < 2) {
    return ERROR_MESSAGES.PASSWORD_TOO_WEAK ?? '비밀번호는 영문, 숫자, 특수문자를 포함해야 합니다.';
  }
  return null;
}

/**
 * 사용자명 유효성 검사
 */
export function validateUsername(username: string): string | null {
  if (!username || username.trim().length === 0) {
    return ERROR_MESSAGES.INVALID_USERNAME ?? '사용자명을 입력해주세요.';
  }
  if (username.trim().length < 2) {
    return '사용자명은 최소 2자 이상이어야 합니다.';
  }
  if (username.trim().length > 50) {
    return '사용자명은 최대 50자까지 입력 가능합니다.';
  }
  return null;
}

/**
 * 이름 유효성 검사 (하위 호환성을 위해 유지)
 * @deprecated validateUsername을 사용하세요
 */
export function validateName(name: string): string | null {
  return validateUsername(name);
}
