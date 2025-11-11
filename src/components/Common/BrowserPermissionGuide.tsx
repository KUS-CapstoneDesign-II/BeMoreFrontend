/**
 * Browser Permission Guide Component
 *
 * 브라우저별 카메라/마이크 권한 설정 가이드
 */

import type { BrowserType } from '../../utils/browserDetect';

export interface BrowserPermissionGuideProps {
  browser: BrowserType;
  type: 'camera' | 'microphone';
}

export function BrowserPermissionGuide({ browser, type }: BrowserPermissionGuideProps) {
  const deviceName = type === 'camera' ? '카메라' : '마이크';

  const guides: Record<BrowserType, React.ReactElement> = {
    Chrome: (
      <div className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
        <p className="font-medium mb-2">Chrome에서 {deviceName} 권한 허용하기:</p>
        <ol className="list-decimal list-inside space-y-1.5 ml-2">
          <li>주소창 왼쪽의 <strong>자물쇠 아이콘 🔒</strong>을 클릭하세요</li>
          <li><strong>"{deviceName}"</strong> 항목을 찾으세요</li>
          <li>드롭다운에서 <strong>"허용"</strong>을 선택하세요</li>
          <li>페이지를 <strong>새로고침</strong>하고 "다시 시도"를 클릭하세요</li>
        </ol>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-3">
          또는 Chrome 설정 → 개인정보 및 보안 → 사이트 설정 → {deviceName}에서 설정할 수 있습니다
        </p>
      </div>
    ),

    Safari: (
      <div className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
        <p className="font-medium mb-2">Safari에서 {deviceName} 권한 허용하기:</p>
        <ol className="list-decimal list-inside space-y-1.5 ml-2">
          <li>메뉴바에서 <strong>Safari → 설정</strong>을 클릭하세요</li>
          <li><strong>웹 사이트</strong> 탭을 선택하세요</li>
          <li>왼쪽에서 <strong>"{deviceName}"</strong>을 클릭하세요</li>
          <li>현재 사이트를 찾아 <strong>"허용"</strong>으로 변경하세요</li>
          <li>설정을 닫고 "다시 시도"를 클릭하세요</li>
        </ol>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-3">
          macOS Sonoma 이상: 시스템 설정 → 개인정보 및 보안에서도 확인 필요
        </p>
      </div>
    ),

    Firefox: (
      <div className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
        <p className="font-medium mb-2">Firefox에서 {deviceName} 권한 허용하기:</p>
        <ol className="list-decimal list-inside space-y-1.5 ml-2">
          <li>주소창 왼쪽의 <strong>자물쇠 아이콘 🔒</strong>을 클릭하세요</li>
          <li><strong>"연결 정보 보기"</strong>를 클릭하세요</li>
          <li><strong>"권한"</strong> 탭으로 이동하세요</li>
          <li><strong>"{deviceName} 사용"</strong> 항목에서 "차단" 해제 후 "허용"을 선택하세요</li>
          <li>페이지를 <strong>새로고침</strong>하고 "다시 시도"를 클릭하세요</li>
        </ol>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-3">
          또는 설정 → 개인정보 및 보안 → 권한에서 설정할 수 있습니다
        </p>
      </div>
    ),

    Edge: (
      <div className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
        <p className="font-medium mb-2">Edge에서 {deviceName} 권한 허용하기:</p>
        <ol className="list-decimal list-inside space-y-1.5 ml-2">
          <li>주소창 왼쪽의 <strong>자물쇠 아이콘 🔒</strong>을 클릭하세요</li>
          <li><strong>"이 사이트의 권한"</strong>을 클릭하세요</li>
          <li><strong>"{deviceName}"</strong> 항목을 찾으세요</li>
          <li>드롭다운에서 <strong>"허용"</strong>을 선택하세요</li>
          <li>페이지를 <strong>새로고침</strong>하고 "다시 시도"를 클릭하세요</li>
        </ol>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-3">
          또는 Edge 설정 → 쿠키 및 사이트 권한 → {deviceName}에서 설정할 수 있습니다
        </p>
      </div>
    ),

    Unknown: (
      <div className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
        <p className="font-medium mb-2">브라우저에서 {deviceName} 권한 허용하기:</p>
        <ol className="list-decimal list-inside space-y-1.5 ml-2">
          <li>주소창 근처의 <strong>자물쇠 아이콘 🔒</strong> 또는 <strong>설정 아이콘 ⚙️</strong>을 찾아 클릭하세요</li>
          <li><strong>사이트 설정</strong> 또는 <strong>권한</strong> 메뉴로 이동하세요</li>
          <li><strong>"{deviceName}"</strong> 항목을 찾으세요</li>
          <li><strong>"허용"</strong> 또는 <strong>"Allow"</strong>로 변경하세요</li>
          <li>페이지를 <strong>새로고침</strong>하고 "다시 시도"를 클릭하세요</li>
        </ol>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-3">
          💡 브라우저마다 설정 위치가 다를 수 있습니다. 브라우저의 도움말을 참조하세요.
        </p>
      </div>
    ),
  };

  return guides[browser] || guides.Unknown;
}
