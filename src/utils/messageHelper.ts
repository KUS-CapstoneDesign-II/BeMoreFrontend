/**
 * Message Helper Utility
 *
 * Jakob의 법칙: 사용자는 일관된 패턴을 선호합니다
 * - 에러/경고/정보 메시지의 통일된 시각적 패턴
 * - 예측 가능한 메시지 구조와 액션
 */

export type MessageSeverity = 'error' | 'warning' | 'info' | 'success';

export interface MessageStyle {
  bgClass: string;
  borderClass: string;
  textClass: string;
  icon: string;
}

/**
 * 메시지 심각도별 일관된 스타일 반환
 */
export function getMessageStyle(severity: MessageSeverity): MessageStyle {
  switch (severity) {
    case 'error':
      return {
        bgClass: 'bg-red-50 dark:bg-red-900/20',
        borderClass: 'border-red-200 dark:border-red-700',
        textClass: 'text-red-700 dark:text-red-300',
        icon: '❌',
      };
    case 'warning':
      return {
        bgClass: 'bg-yellow-50 dark:bg-yellow-900/20',
        borderClass: 'border-yellow-200 dark:border-yellow-700',
        textClass: 'text-yellow-700 dark:text-yellow-300',
        icon: '⚠️',
      };
    case 'info':
      return {
        bgClass: 'bg-blue-50 dark:bg-blue-900/20',
        borderClass: 'border-blue-200 dark:border-blue-700',
        textClass: 'text-blue-700 dark:text-blue-300',
        icon: '💡',
      };
    case 'success':
      return {
        bgClass: 'bg-green-50 dark:bg-green-900/20',
        borderClass: 'border-green-200 dark:border-green-700',
        textClass: 'text-green-700 dark:text-green-300',
        icon: '✅',
      };
  }
}

/**
 * 일관된 에러 메시지 텍스트 생성
 */
export const ERROR_MESSAGES = {
  // 권한 관련
  CAMERA_PERMISSION_DENIED: '카메라 권한이 거부되었습니다',
  MICROPHONE_PERMISSION_DENIED: '마이크 권한이 거부되었습니다',
  CAMERA_NOT_SUPPORTED: '카메라를 지원하지 않는 브라우저입니다',
  MICROPHONE_NOT_SUPPORTED: '마이크를 지원하지 않는 브라우저입니다',

  // 기기 점검 관련
  CAMERA_CHECK_FAILED: '카메라 점검 실패',
  MICROPHONE_CHECK_FAILED: '마이크 점검 실패',
  DEVICE_CHECK_FAILED: '기기 점검에 실패했습니다',

  // 네트워크 관련
  NETWORK_ERROR: '네트워크 연결에 문제가 발생했습니다',
  REQUEST_FAILED: '요청이 실패했습니다',

  // 세션 관련
  SESSION_START_FAILED: '세션 시작에 실패했습니다',
  SESSION_END_FAILED: '세션 종료 중 오류가 발생했습니다',

  // 일반
  UNKNOWN_ERROR: '알 수 없는 오류가 발생했습니다',
  GENERIC_ERROR: '오류가 발생했습니다',
} as const;

/**
 * 일관된 버튼 텍스트
 */
export const ACTION_TEXTS = {
  RETRY: '다시 시도',
  SKIP: '건너뛰기',
  CLOSE: '닫기',
  CONTINUE: '계속',
  CANCEL: '취소',
  CONFIRM: '확인',
} as const;
