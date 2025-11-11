/**
 * Browser Detection Utility
 *
 * 사용자 브라우저를 감지하여 적절한 권한 가이드를 제공
 */

export type BrowserType = 'Chrome' | 'Safari' | 'Firefox' | 'Edge' | 'Unknown';

/**
 * 현재 브라우저 타입을 감지
 */
export function detectBrowser(): BrowserType {
  const userAgent = navigator.userAgent;

  // Edge (Chromium-based) 감지
  if (userAgent.includes('Edg/') || userAgent.includes('Edge/')) {
    return 'Edge';
  }

  // Chrome 감지 (Edge 이후에 체크해야 함)
  if (userAgent.includes('Chrome') && !userAgent.includes('Edg')) {
    return 'Chrome';
  }

  // Safari 감지
  if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) {
    return 'Safari';
  }

  // Firefox 감지
  if (userAgent.includes('Firefox')) {
    return 'Firefox';
  }

  return 'Unknown';
}

/**
 * 브라우저 이름을 한글로 변환
 */
export function getBrowserDisplayName(browser: BrowserType): string {
  const names: Record<BrowserType, string> = {
    Chrome: '크롬',
    Safari: '사파리',
    Firefox: '파이어폭스',
    Edge: '엣지',
    Unknown: '브라우저',
  };

  return names[browser];
}

/**
 * 브라우저가 미디어 디바이스를 지원하는지 확인
 */
export function isMediaDeviceSupported(): boolean {
  return !!(
    navigator.mediaDevices &&
    navigator.mediaDevices.getUserMedia
  );
}
