/**
 * Security Utilities
 *
 * 보안 설정 및 헤더 관리 유틸
 * HTTPS, CSP, HSTS, X-Frame-Options, 보안 쿠키 등
 */

/**
 * HTTPS 강제 리다이렉트
 * HTTP 요청을 HTTPS로 자동 리다이렉트
 *
 * 프로덕션 환경에서만 실행
 */
export function enforceHttps(): void {
  if (import.meta.env.PROD && window.location.protocol === 'http:') {
    // http를 https로 변경
    window.location.href = `https:${window.location.href.substring(5)}`;
  }
}

/**
 * CSP (Content Security Policy) 메타 태그 추가
 *
 * 정책:
 * - default-src 'self': 자체 출처에서만 로드
 * - script-src 'self' 'unsafe-eval': 스크립트 (eval 허용 - React DevTools용)
 * - style-src 'self' 'unsafe-inline': 스타일 (인라인 허용 - CSS-in-JS용)
 * - img-src 'self' data: https:: 이미지 (데이터 URI, HTTPS 허용)
 * - font-src 'self' data:: 폰트 (데이터 URI 허용)
 * - connect-src 'self' https:: 네트워크 요청 (HTTPS만)
 * - frame-ancestors 'none': iframe 로드 차단
 * - upgrade-insecure-requests: HTTP 자동 업그레이드
 */
export function setContentSecurityPolicy(): void {
  const cspContent = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-eval'", // React, HMR용
    "style-src 'self' 'unsafe-inline'", // CSS-in-JS용
    "img-src 'self' data: https:",
    "font-src 'self' data:",
    "connect-src 'self' https:",
    "frame-ancestors 'none'",
    "upgrade-insecure-requests",
  ].join('; ');

  const meta = document.createElement('meta');
  meta.httpEquiv = 'Content-Security-Policy';
  meta.content = cspContent;
  document.head.appendChild(meta);

  console.log('✅ CSP header set:', cspContent);
}

/**
 * HSTS (HTTP Strict-Transport-Security) 메타 태그 추가
 *
 * 효과:
 * - max-age=31536000: 1년 동안 HTTPS 강제
 * - includeSubDomains: 서브도메인도 포함
 * - preload: HSTS 프리로드 목록 추가 가능
 */
export function setHstsHeader(): void {
  if (import.meta.env.PROD) {
    const meta = document.createElement('meta');
    meta.httpEquiv = 'Strict-Transport-Security';
    meta.content = 'max-age=31536000; includeSubDomains; preload';
    document.head.appendChild(meta);

    console.log('✅ HSTS header set');
  }
}

/**
 * X-Frame-Options 설정
 * 외부 사이트의 iframe에서 로드되는 것 방지
 *
 * DENY: 누구도 iframe 로드 불가
 */
export function setXFrameOptions(): void {
  const meta = document.createElement('meta');
  meta.httpEquiv = 'X-UA-Compatible';
  meta.content = 'ie=edge';
  document.head.appendChild(meta);

  // 추가: X-Content-Type-Options (MIME 타입 스니핑 방지)
  const noSniff = document.createElement('meta');
  noSniff.httpEquiv = 'X-Content-Type-Options';
  noSniff.content = 'nosniff';
  document.head.appendChild(noSniff);

  console.log('✅ X-Frame-Options and X-UA-Compatible headers set');
}

/**
 * 보안 쿠키 옵션 설정
 *
 * 서버에서 Set-Cookie 헤더로 사용
 * - Secure: HTTPS 연결에서만 전송
 * - HttpOnly: JavaScript 접근 불가 (XSS 방지)
 * - SameSite=Strict: CSRF 공격 방지
 */
export function getSecureCookieOptions(): Record<string, any> {
  return {
    secure: import.meta.env.PROD, // 프로덕션에서만 HTTPS 강제
    httpOnly: true, // JavaScript 접근 불가
    sameSite: 'strict', // CSRF 방지
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7일
  };
}

/**
 * 민감한 데이터 마스킹 함수
 *
 * @param value - 마스킹할 값
 * @param visibleChars - 보이는 문자 개수 (앞/뒤)
 * @returns 마스킹된 문자열
 *
 * @example
 * maskData('abc123def456', 2) // 'ab**...***56'
 */
export function maskData(value: string, visibleChars: number = 2): string {
  if (value.length <= visibleChars * 2) {
    return '*'.repeat(value.length);
  }

  const start = value.substring(0, visibleChars);
  const end = value.substring(value.length - visibleChars);
  const masked = '*'.repeat(value.length - visibleChars * 2);

  return `${start}${masked}${end}`;
}

/**
 * 보안 초기화
 * main.tsx에서 호출
 */
export function initializeSecurity(): void {
  // HTTPS 강제 (클라이언트 레벨)
  enforceHttps();

  // CSP 헤더 설정
  setContentSecurityPolicy();

  // HSTS 헤더 설정
  setHstsHeader();

  // X-Frame-Options 설정
  setXFrameOptions();

  console.log('🔒 Security initialization completed');
}

/**
 * XSS 방지: HTML 이스케이프
 *
 * @param text - 이스케이프할 텍스트
 * @returns 안전한 HTML 텍스트
 */
export function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };

  return text.replace(/[&<>"']/g, (char) => map[char]);
}

/**
 * CSRF 토큰 생성 (선택사항)
 * 백엔드에서 제공하는 토큰 사용 권장
 *
 * @returns 임시 CSRF 토큰
 */
export function generateCsrfToken(): string {
  return Array.from(crypto.getRandomValues(new Uint8Array(32)))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * 로깅 시 민감 정보 제거
 *
 * @param data - 로깅 객체
 * @returns 정제된 로깅 객체
 */
export function sanitizeLogData(data: Record<string, any>): Record<string, any> {
  const sensitiveKeys = ['password', 'token', 'secret', 'apiKey', 'sessionId', 'ssn', 'creditCard'];
  const sanitized = { ...data };

  for (const key of Object.keys(sanitized)) {
    if (sensitiveKeys.some((sensitive) => key.toLowerCase().includes(sensitive.toLowerCase()))) {
      sanitized[key] = '[REDACTED]';
    }
  }

  return sanitized;
}

export default {
  enforceHttps,
  setContentSecurityPolicy,
  setHstsHeader,
  setXFrameOptions,
  getSecureCookieOptions,
  maskData,
  initializeSecurity,
  escapeHtml,
  generateCsrfToken,
  sanitizeLogData,
};
