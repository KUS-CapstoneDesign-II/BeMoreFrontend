/**
 * Browser Permission Guide
 * Phase 9: 브라우저별 카메라/마이크 권한 설정 안내
 */

export interface PermissionGuide {
  title: string;
  description: string;
  steps: string[];
  icon: string;
}

/**
 * 각 브라우저별 카메라/마이크 권한 설정 가이드
 */
export const cameraPermissionGuides: Record<string, PermissionGuide> = {
  Chrome: {
    title: 'Chrome - 카메라 권한 설정',
    description: 'Chrome에서 카메라 접근 권한을 허용하려면:',
    steps: [
      '주소창 왼쪽의 "🔒 자물쇠" 아이콘 클릭',
      '"권한" 메뉴 열기',
      '"카메라" 항목 찾기',
      '"허용" 선택',
      '페이지 새로고침 (F5)',
    ],
    icon: '🌐',
  },
  Firefox: {
    title: 'Firefox - 카메라 권한 설정',
    description: 'Firefox에서 카메라 접근 권한을 허용하려면:',
    steps: [
      '주소창 왼쪽의 "🔒 자물쇠" 아이콘 클릭',
      '"사이트 정보" 선택',
      '"권한" 탭 클릭',
      '"카메라" 섹션에서 "허용" 선택',
      '페이지 새로고침',
    ],
    icon: '🦊',
  },
  Safari: {
    title: 'Safari - 카메라 권한 설정',
    description: 'Safari에서 카메라 접근 권한을 허용하려면:',
    steps: [
      '상단 메뉴 "Safari" 클릭',
      '"환경설정" 선택',
      '"웹사이트" 탭 클릭',
      '왼쪽 메뉴에서 "카메라" 선택',
      '현재 사이트를 "허용" 으로 설정',
      '페이지 새로고침',
    ],
    icon: '🧭',
  },
  Edge: {
    title: 'Edge - 카메라 권한 설정',
    description: 'Microsoft Edge에서 카메라 접근 권한을 허용하려면:',
    steps: [
      '주소창 왼쪽의 "🔒 자물쇠" 아이콘 클릭',
      '"권한" 섹션 찾기',
      '"카메라" 항목 클릭',
      '"허용" 선택',
      '페이지 새로고침',
    ],
    icon: '🌊',
  },
};

export const microphonePermissionGuides: Record<string, PermissionGuide> = {
  Chrome: {
    title: 'Chrome - 마이크 권한 설정',
    description: 'Chrome에서 마이크 접근 권한을 허용하려면:',
    steps: [
      '주소창 왼쪽의 "🔒 자물쇠" 아이콘 클릭',
      '"권한" 메뉴 열기',
      '"마이크" 항목 찾기',
      '"허용" 선택',
      '페이지 새로고침 (F5)',
    ],
    icon: '🌐',
  },
  Firefox: {
    title: 'Firefox - 마이크 권한 설정',
    description: 'Firefox에서 마이크 접근 권한을 허용하려면:',
    steps: [
      '주소창 왼쪽의 "🔒 자물쇠" 아이콘 클릭',
      '"사이트 정보" 선택',
      '"권한" 탭 클릭',
      '"마이크" 섹션에서 "허용" 선택',
      '페이지 새로고침',
    ],
    icon: '🦊',
  },
  Safari: {
    title: 'Safari - 마이크 권한 설정',
    description: 'Safari에서 마이크 접근 권한을 허용하려면:',
    steps: [
      '상단 메뉴 "Safari" 클릭',
      '"환경설정" 선택',
      '"웹사이트" 탭 클릭',
      '왼쪽 메뉴에서 "마이크" 선택',
      '현재 사이트를 "허용" 으로 설정',
      '페이지 새로고침',
    ],
    icon: '🧭',
  },
  Edge: {
    title: 'Edge - 마이크 권한 설정',
    description: 'Microsoft Edge에서 마이크 접근 권한을 허용하려면:',
    steps: [
      '주소창 왼쪽의 "🔒 자물쇠" 아이콘 클릭',
      '"권한" 섹션 찾기',
      '"마이크" 항목 클릭',
      '"허용" 선택',
      '페이지 새로고침',
    ],
    icon: '🌊',
  },
};

/**
 * 현재 브라우저 감지
 */
export function detectBrowser(): string {
  const ua = navigator.userAgent;

  if (ua.includes('Edge')) return 'Edge';
  if (ua.includes('Chrome')) return 'Chrome';
  if (ua.includes('Safari')) return 'Safari';
  if (ua.includes('Firefox')) return 'Firefox';

  return 'Unknown';
}

/**
 * 해당 브라우저의 권한 가이드 가져오기
 */
export function getCameraGuideForBrowser(browser?: string): PermissionGuide {
  const b = browser || detectBrowser();
  return cameraPermissionGuides[b] || cameraPermissionGuides.Chrome;
}

export function getMicrophoneGuideForBrowser(browser?: string): PermissionGuide {
  const b = browser || detectBrowser();
  return microphonePermissionGuides[b] || microphonePermissionGuides.Chrome;
}

/**
 * 권한 거부 시 대체 안내 메시지
 */
export function getPermissionDeniedMessage(type: 'camera' | 'microphone'): string {
  const guide = type === 'camera'
    ? getCameraGuideForBrowser()
    : getMicrophoneGuideForBrowser();

  return `
${guide.icon} ${guide.title}

${guide.description}

${guide.steps.map((step, i) => `${i + 1}. ${step}`).join('\n')}

계속 진행할 수 없으면 "권한 다시 설정" 버튼을 클릭하거나 브라우저를 재시작하세요.
  `.trim();
}

/**
 * HTTPS/WSS 필요성 안내
 */
export function getHttpsRequiredMessage(): string {
  return `
🔒 보안 연결 필요

카메라와 마이크 접근은 HTTPS/WSS 보안 연결이 필요합니다.

현재 연결:
- ${window.location.protocol === 'https:' ? '✅ HTTPS' : '❌ HTTP (불안전)'}
- ${window.location.protocol === 'https:' ? '✅ WSS 가능' : '❌ WS 만 가능'}

해결 방법:
1. HTTPS 주소로 접속하세요
2. 로컬 테스트의 경우 localhost:443 또는 localhost:5173 사용

기술 정보:
- getUserMedia() API는 보안 컨텍스트(HTTPS)에서만 작동합니다
- WSS는 로컬호스트 또는 HTTPS 환경에서만 사용 가능합니다
  `.trim();
}

/**
 * 카메라/마이크 테스트 가능 여부 확인
 */
export async function canAccessDevices(): Promise<boolean> {
  if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') {
    return false;
  }

  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: false,
      audio: false,
    });

    stream.getTracks().forEach(track => track.stop());
    return true;
  } catch {
    return false;
  }
}
