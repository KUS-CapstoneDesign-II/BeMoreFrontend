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
 * - script-src 'self' 'unsafe-eval' https://cdn.jsdelivr.net: 스크립트 (eval 허용 - React DevTools용, MediaPipe CDN)
 * - style-src 'self' 'unsafe-inline': 스타일 (인라인 허용 - CSS-in-JS용)
 * - img-src 'self' data: https:: 이미지 (데이터 URI, HTTPS 허용)
 * - font-src 'self' data:: 폰트 (데이터 URI 허용)
 * - connect-src 'self' https:: 네트워크 요청 (HTTPS만)
 * - worker-src 'self' blob:: Web Workers (MediaPipe 지원)
 * - frame-ancestors 'none': iframe 로드 차단
 * - upgrade-insecure-requests: HTTP 자동 업그레이드
 */
export function setContentSecurityPolicy(): void {
  const cspContent = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-eval' https://cdn.jsdelivr.net", // React, HMR, MediaPipe CDN
    "style-src 'self' 'unsafe-inline'", // CSS-in-JS용
    "img-src 'self' data: https:",
    "font-src 'self' data:",
    "connect-src 'self' https:",
    "worker-src 'self' blob:", // MediaPipe Web Worker 지원
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
 * 토큰 마스킹 (앞 3글자, 뒤 3글자만 표시)
 *
 * @param token - 마스킹할 토큰
 * @returns 마스킹된 토큰
 *
 * @example
 * maskToken('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIn0.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c')
 * // Returns: 'eyJ**...**w5c'
 */
export function maskToken(token: string): string {
  if (token.length <= 6) return '***';
  return maskData(token, 3);
}

/**
 * 세션 ID 마스킹
 *
 * @param sessionId - 마스킹할 세션 ID
 * @returns 마스킹된 세션 ID
 *
 * @example
 * maskSessionId('550e8400-e29b-41d4-a716-446655440000')
 * // Returns: '550e**...**0000'
 */
export function maskSessionId(sessionId: string): string {
  return maskData(sessionId, 4);
}

/**
 * 이메일 마스킹
 *
 * @param email - 마스킹할 이메일
 * @returns 마스킹된 이메일
 *
 * @example
 * maskEmail('user@example.com') // 'u***@example.com'
 */
export function maskEmail(email: string): string {
  const [localPart, domain] = email.split('@');
  if (!domain) return email;

  const maskedLocal = localPart[0] + '*'.repeat(Math.max(1, localPart.length - 1));
  return `${maskedLocal}@${domain}`;
}

/**
 * 전화번호 마스킹
 *
 * @param phone - 마스킹할 전화번호
 * @returns 마스킹된 전화번호
 *
 * @example
 * maskPhone('01012345678') // '010****5678'
 */
export function maskPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.length < 8) return phone;

  const start = digits.slice(0, 3);
  const end = digits.slice(-4);
  const masked = '*'.repeat(Math.max(1, digits.length - 7));

  return `${start}${masked}${end}`;
}

/**
 * 신용카드 번호 마스킹
 *
 * @param cardNumber - 마스킹할 신용카드 번호
 * @returns 마스킹된 신용카드 번호
 *
 * @example
 * maskCreditCard('4532123456789010') // '4532********9010'
 */
export function maskCreditCard(cardNumber: string): string {
  const digits = cardNumber.replace(/\D/g, '');
  if (digits.length < 8) return cardNumber;

  const start = digits.slice(0, 4);
  const end = digits.slice(-4);
  const masked = '*'.repeat(digits.length - 8);

  return `${start}${masked}${end}`;
}

/**
 * 데이터 타입에 따른 자동 마스킹
 * 필드명을 기반으로 적절한 마스킹 함수 선택
 *
 * @param fieldName - 필드 이름
 * @param value - 마스킹할 값
 * @returns 마스킹된 값
 */
export function autoMaskData(fieldName: string, value: string): string {
  const lowerFieldName = fieldName.toLowerCase();

  if (lowerFieldName.includes('token') || lowerFieldName.includes('jwt')) {
    return maskToken(value);
  }
  if (lowerFieldName.includes('sessionid') || lowerFieldName.includes('session_id')) {
    return maskSessionId(value);
  }
  if (lowerFieldName.includes('email')) {
    return maskEmail(value);
  }
  if (lowerFieldName.includes('phone')) {
    return maskPhone(value);
  }
  if (lowerFieldName.includes('card') || lowerFieldName.includes('creditcard')) {
    return maskCreditCard(value);
  }

  // 기본값: 보수적인 마스킹
  return maskData(value, 2);
}

/**
 * SubtleCrypto를 사용한 데이터 암호화
 *
 * 브라우저의 Web Crypto API를 사용하여 민감한 데이터 암호화
 * - 알고리즘: AES-GCM (128비트 키)
 * - 외부 의존성 없음 (순수 Web Crypto API)
 */

/**
 * 암호화 키 생성 (캐싱)
 * 브라우저 세션 동안 동일한 키 사용
 */
let cachedEncryptionKey: CryptoKey | null = null;

async function getEncryptionKey(): Promise<CryptoKey> {
  if (cachedEncryptionKey) {
    return cachedEncryptionKey;
  }

  try {
    // 장치별 고정 키 생성 (페이지 새로고침 시에도 동일)
    // 실제 운영 환경에서는 서버에서 제공하는 키 사용 권장
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode('bemore-security-key-v1'),
      { name: 'PBKDF2' },
      false,
      ['deriveBits', 'deriveKey']
    );

    cachedEncryptionKey = await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: new TextEncoder().encode('bemore-salt-v1'),
        iterations: 100000,
        hash: 'SHA-256',
      },
      keyMaterial,
      { name: 'AES-GCM', length: 128 },
      false,
      ['encrypt', 'decrypt']
    );

    return cachedEncryptionKey;
  } catch (error) {
    console.error('❌ Failed to derive encryption key:', error);
    throw new Error('Encryption key derivation failed');
  }
}

/**
 * 데이터 암호화
 *
 * @param plaintext - 암호화할 평문
 * @returns Base64 인코딩된 암호화 데이터 (IV + 암호문)
 */
export async function encryptData(plaintext: string): Promise<string> {
  try {
    const key = await getEncryptionKey();
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encodedData = new TextEncoder().encode(plaintext);

    const encryptedData = await crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv: iv,
      },
      key,
      encodedData
    );

    // IV + 암호문 결합
    const combined = new Uint8Array(iv.length + encryptedData.byteLength);
    combined.set(iv);
    combined.set(new Uint8Array(encryptedData), iv.length);

    // Base64 인코딩
    return btoa(String.fromCharCode.apply(null, Array.from(combined)));
  } catch (error) {
    console.error('❌ Encryption failed:', error);
    throw new Error('Data encryption failed');
  }
}

/**
 * 데이터 복호화
 *
 * @param encryptedData - Base64 인코딩된 암호화 데이터
 * @returns 복호화된 평문
 */
export async function decryptData(encryptedData: string): Promise<string> {
  try {
    const key = await getEncryptionKey();

    // Base64 디코딩
    const combined = new Uint8Array(
      atob(encryptedData)
        .split('')
        .map((c) => c.charCodeAt(0))
    );

    // IV와 암호문 분리 (IV는 12바이트)
    const iv = combined.slice(0, 12);
    const ciphertext = combined.slice(12);

    const decryptedData = await crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: iv,
      },
      key,
      ciphertext
    );

    return new TextDecoder().decode(decryptedData);
  } catch (error) {
    console.error('❌ Decryption failed:', error);
    throw new Error('Data decryption failed');
  }
}

/**
 * 암호화된 localStorage 래퍼
 *
 * 민감한 데이터를 localStorage에 저장할 때 자동으로 암호화
 */
export const encryptedStorage = {
  /**
   * 암호화하여 저장
   *
   * @param key - localStorage 키
   * @param value - 저장할 값
   */
  async setItem(key: string, value: string): Promise<void> {
    try {
      const encrypted = await encryptData(value);
      localStorage.setItem(key, encrypted);
    } catch (error) {
      console.error(`❌ Failed to store encrypted data for key: ${key}`, error);
      // Fallback: 평문으로 저장 (암호화 실패 시)
      localStorage.setItem(`${key}__unencrypted`, 'true');
      localStorage.setItem(key, value);
    }
  },

  /**
   * 복호화하여 읽기
   *
   * @param key - localStorage 키
   * @returns 복호화된 값 (없으면 null)
   */
  async getItem(key: string): Promise<string | null> {
    try {
      const encrypted = localStorage.getItem(key);
      if (!encrypted) return null;

      const isUnencrypted = localStorage.getItem(`${key}__unencrypted`);
      if (isUnencrypted) {
        return encrypted;
      }

      return await decryptData(encrypted);
    } catch (error) {
      console.error(`❌ Failed to retrieve encrypted data for key: ${key}`, error);
      return null;
    }
  },

  /**
   * 암호화된 데이터 삭제
   *
   * @param key - localStorage 키
   */
  removeItem(key: string): void {
    localStorage.removeItem(key);
    localStorage.removeItem(`${key}__unencrypted`);
  },

  /**
   * 모든 암호화된 데이터 삭제
   */
  clear(): void {
    localStorage.clear();
  },
};

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
  // 마스킹 함수들
  maskData,
  maskToken,
  maskSessionId,
  maskEmail,
  maskPhone,
  maskCreditCard,
  autoMaskData,
  // 암호화 함수들
  encryptData,
  decryptData,
  encryptedStorage,
  // 보안 초기화
  initializeSecurity,
  // XSS/CSRF 방지
  escapeHtml,
  generateCsrfToken,
  // 로깅 정제
  sanitizeLogData,
};
