import type { SessionStatus } from '../../types';

import { useSessionStore } from '../../stores/sessionStore';

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
  const isEnded = status === 'ended';

  const { isSessionActive, startSession, endSession } = useSessionStore();

  return (
    <div
      className={`flex items-center justify-center space-x-3 ${className}`}
      role="toolbar"
      aria-label="세션 제어"
    >
      {/* 일시정지/재개 버튼 */}
      {isActive && (
        <button
          onClick={onPause}
          className="
            flex items-center space-x-2 px-6 py-3 min-h-[44px]
            bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-600 hover:to-amber-600
            text-white font-semibold rounded-lg
            transition-all duration-200 shadow-soft hover:shadow-soft-lg
            focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:ring-offset-2
            active:scale-95 transform
            animate-fade-in
          "
          aria-label="세션 일시정지"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <span>일시정지</span>
        </button>
      )}

      {isPaused && (
        <button
          onClick={onResume}
          className="
            flex items-center space-x-2 px-6 py-3 min-h-[44px]
            bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600
            text-white font-semibold rounded-lg
            transition-all duration-200 shadow-soft hover:shadow-soft-lg
            focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-offset-2
            active:scale-95 transform
            animate-scale-in
          "
          aria-label="세션 재개"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
          </svg>
          <span>재개</span>
        </button>
      )}

      {/* 시작/종료 버튼 */}
      {!isEnded && (
        <>
          {!isSessionActive ? (
            <button
              onClick={() => startSession('frontend_user_001', 'ai_counselor_001')}
              className="
                flex items-center space-x-2 px-6 py-3 min-h-[44px]
                bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700
                text-white font-semibold rounded-lg
                transition-all duration-200 shadow-soft hover:shadow-soft-lg
                focus:outline-none focus:ring-2 focus:ring-primary-400 focus:ring-offset-2
                active:scale-95 transform
                animate-fade-in
              "
              aria-label="세션 시작"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM7 10l6-3v6l-6-3z" clipRule="evenodd" />
              </svg>
              <span>세션 시작</span>
            </button>
          ) : (
            <button
              onClick={() => endSession()}
              className="
                flex items-center space-x-2 px-6 py-3 min-h-[44px]
                bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600
                text-white font-semibold rounded-lg
                transition-all duration-200 shadow-soft hover:shadow-soft-lg
                focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-2
                active:scale-95 transform
                animate-fade-in
              "
              aria-label="세션 종료"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z" clipRule="evenodd" />
              </svg>
              <span>종료</span>
            </button>
          )}
        </>
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
