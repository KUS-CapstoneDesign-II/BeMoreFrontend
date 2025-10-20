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
  const isEnded = status === 'ended';

  return (
    <div className={`flex items-center justify-center space-x-3 ${className}`}>
      {/* 일시정지/재개 버튼 */}
      {isActive && (
        <button
          onClick={onPause}
          className="
            flex items-center space-x-2 px-6 py-3
            bg-yellow-500 hover:bg-yellow-600
            text-white font-medium rounded-lg
            transition shadow-md hover:shadow-lg
            active:scale-95
          "
          title="세션 일시정지"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <span>일시정지</span>
        </button>
      )}

      {isPaused && (
        <button
          onClick={onResume}
          className="
            flex items-center space-x-2 px-6 py-3
            bg-green-500 hover:bg-green-600
            text-white font-medium rounded-lg
            transition shadow-md hover:shadow-lg
            active:scale-95
          "
          title="세션 재개"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
          </svg>
          <span>재개</span>
        </button>
      )}

      {/* 종료 버튼 */}
      {!isEnded && (
        <button
          onClick={onEnd}
          className="
            flex items-center space-x-2 px-6 py-3
            bg-red-500 hover:bg-red-600
            text-white font-medium rounded-lg
            transition shadow-md hover:shadow-lg
            active:scale-95
          "
          title="세션 종료"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z" clipRule="evenodd" />
          </svg>
          <span>종료</span>
        </button>
      )}

      {/* 상태 표시 */}
      <div className="ml-4 px-4 py-2 bg-gray-100 rounded-lg">
        <div className="flex items-center space-x-2">
          <div className={`w-2 h-2 rounded-full ${
            isActive ? 'bg-green-500 animate-pulse' :
            isPaused ? 'bg-yellow-500' :
            'bg-gray-400'
          }`}></div>
          <span className="text-sm font-medium text-gray-700">
            {isActive ? '진행 중' : isPaused ? '일시정지' : '종료됨'}
          </span>
        </div>
      </div>
    </div>
  );
}
