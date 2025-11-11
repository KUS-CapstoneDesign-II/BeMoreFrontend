/**
 * Feature Flags Configuration
 *
 * 프로덕션 환경에서 특정 기능의 활성화 여부를 제어합니다.
 * 백엔드 준비가 완료되지 않은 기능을 안전하게 비활성화할 수 있습니다.
 */

/**
 * Feature Flags
 *
 * 백엔드 엔드포인트가 준비되지 않은 경우 false로 설정하세요.
 */
export const FEATURE_FLAGS = {
  /**
   * Analytics 엔드포인트 활성화 여부
   *
   * - true: /api/analytics/vitals, /api/analytics/alert 호출 활성화
   * - false: Analytics 호출 비활성화 (404 에러 방지)
   *
   * 백엔드에서 엔드포인트 구현 완료 시 true로 변경하세요.
   */
  ANALYTICS_ENABLED: false,

  /**
   * 성능 모니터링 활성화 여부
   *
   * - true: Web Vitals 수집 및 로컬 로깅
   * - false: 성능 모니터링 완전 비활성화
   */
  PERFORMANCE_MONITORING: true,

  /**
   * 로컬 에러 로깅 활성화 여부
   *
   * - true: 콘솔에 에러 로그 출력
   * - false: 에러 로그 비활성화
   */
  ERROR_REPORTING: true,
} as const;

/**
 * 환경별 Feature Flag 오버라이드
 *
 * .env 파일의 VITE_ANALYTICS_ENABLED 값으로 ANALYTICS_ENABLED를 오버라이드할 수 있습니다.
 */
export function getAnalyticsEnabled(): boolean {
  // 환경 변수가 명시적으로 설정되어 있으면 그 값을 사용
  if (import.meta.env.VITE_ANALYTICS_ENABLED !== undefined) {
    return import.meta.env.VITE_ANALYTICS_ENABLED === 'true';
  }

  // 환경 변수가 없으면 기본 Feature Flag 사용
  return FEATURE_FLAGS.ANALYTICS_ENABLED;
}

/**
 * 디버그 정보 출력 (개발 환경)
 */
if (import.meta.env.DEV && typeof window !== 'undefined') {
  console.log('🚩 Feature Flags:', {
    ANALYTICS_ENABLED: getAnalyticsEnabled(),
    PERFORMANCE_MONITORING: FEATURE_FLAGS.PERFORMANCE_MONITORING,
    ERROR_REPORTING: FEATURE_FLAGS.ERROR_REPORTING,
  });
}
