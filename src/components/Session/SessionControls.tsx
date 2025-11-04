import { Button } from '../ui/Button';
import type { SessionStatus } from '../../types';

interface SessionControlsProps {
  status: SessionStatus;
  onPause?: () => void;
  onResume?: () => void;
  onEnd?: () => void;
  className?: string;
}

/**
 * SessionControls 컴포넌트
 *
 * 세션 제어 버튼(일시정지, 재개, 종료)을 제공합니다.
 */
export function SessionControls({
  status,
  onPause,
  onResume,
  onEnd,
  className = ''
}: SessionControlsProps) {
  const isPaused = status === 'paused';
  const isActive = status === 'active';

  const pauseIcon = (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
    </svg>
  );

  const resumeIcon = (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
    </svg>
  );

  const endIcon = (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z" clipRule="evenodd" />
    </svg>
  );

  return (
    <div
      className={`flex items-center justify-center space-x-3 ${className}`}
      role="toolbar"
      aria-label="세션 제어"
    >
      {isActive && (
        <Button
          variant="warning"
          icon={pauseIcon}
          label="일시정지"
          onClick={onPause}
          aria-label="세션 일시정지"
          className="animate-fade-in"
        />
      )}

      {isPaused && (
        <Button
          variant="success"
          icon={resumeIcon}
          label="재개"
          onClick={onResume}
          aria-label="세션 재개"
          className="animate-scale-in"
        />
      )}

      {isActive && (
        <Button
          variant="danger"
          icon={endIcon}
          label="종료"
          onClick={onEnd}
          aria-label="세션 종료"
          className="animate-fade-in"
        />
      )}

      {/* 상태 표시 */}
      <div
        className="ml-4 px-4 py-2 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg shadow-inner-soft animate-fade-in"
        role="status"
        aria-live="polite"
        aria-label={`세션 상태: ${isActive ? '진행 중' : isPaused ? '일시정지' : '종료됨'}`}
      >
        <div className="flex items-center space-x-2">
          <div
            className={`w-2.5 h-2.5 rounded-full ${
              isActive ? 'bg-green-500 animate-pulse shadow-lg shadow-green-300' :
              isPaused ? 'bg-yellow-500 shadow-lg shadow-yellow-300' :
              'bg-gray-400'
            }`}
            aria-hidden="true"
          ></div>
          <span className="text-sm font-semibold text-gray-700">
            {isActive ? '진행 중' : isPaused ? '일시정지' : '종료됨'}
          </span>
        </div>
      </div>
    </div>
  );
}
