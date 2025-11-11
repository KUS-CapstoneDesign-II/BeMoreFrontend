/**
 * Permission Error Card Component
 *
 * 사용자 친화적 권한 오류 처리 UI
 * - 부드러운 시각적 디자인 (빨간색 경고 대신 친절한 안내)
 * - 브라우저별 맞춤 가이드 제공
 * - 명확한 액션 버튼 (재시도 / 나중에 하기)
 */

import { useState } from 'react';
import { detectBrowser, getBrowserDisplayName } from '../../utils/browserDetect';
import { BrowserPermissionGuide } from './BrowserPermissionGuide';
import { Button } from '../primitives/Button';

export interface PermissionErrorCardProps {
  type: 'camera' | 'microphone';
  onRetry: () => void;
  onSkip?: () => void;
}

export function PermissionErrorCard({
  type,
  onRetry,
  onSkip,
}: PermissionErrorCardProps) {
  const [isGuideOpen, setIsGuideOpen] = useState(true);
  const browser = detectBrowser();
  const browserName = getBrowserDisplayName(browser);

  const deviceName = type === 'camera' ? '카메라' : '마이크';
  const deviceIcon = type === 'camera' ? '📷' : '🎤';

  return (
    <div className="max-w-md mx-auto p-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm">
      {/* Header with Icon */}
      <div className="flex items-center gap-3 mb-4">
        <div className="text-4xl">{deviceIcon}</div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {deviceName} 접근이 필요합니다
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            브라우저 설정에서 권한을 허용해주세요
          </p>
        </div>
      </div>

      {/* Browser-specific Guide (Accordion) */}
      <div className="mb-6">
        <button
          onClick={() => setIsGuideOpen(!isGuideOpen)}
          className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
          aria-expanded={isGuideOpen}
        >
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {browserName}에서 허용하는 방법
          </span>
          <span className="text-gray-500 dark:text-gray-400 transform transition-transform" style={{ transform: isGuideOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}>
            ▼
          </span>
        </button>

        {isGuideOpen && (
          <div className="mt-2 px-4 py-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <BrowserPermissionGuide browser={browser} type={type} />
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <Button
          onClick={onRetry}
          size="md"
          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
        >
          다시 시도
        </Button>
        {onSkip && (
          <Button
            onClick={onSkip}
            variant="secondary"
            size="md"
            className="flex-1"
          >
            나중에 하기
          </Button>
        )}
      </div>

      {/* Additional Help */}
      <p className="mt-4 text-xs text-center text-gray-500 dark:text-gray-400">
        💡 권한을 허용하지 않으면 일부 기능을 사용할 수 없습니다
      </p>
    </div>
  );
}
