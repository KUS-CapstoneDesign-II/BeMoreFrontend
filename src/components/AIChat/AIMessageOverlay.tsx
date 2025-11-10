import { useEffect, useState } from 'react';

interface AIMessageOverlayProps {
  message: string;
  role: 'user' | 'ai';
  isStreaming: boolean;
  isVisible: boolean;
  isSpeaking: boolean;
}

/**
 * AI 메시지 오버레이 컴포넌트
 *
 * 비디오 위에 자막처럼 표시되는 AI/사용자 메시지
 * - 사용자 메시지: 3초 표시 후 자동 사라짐
 * - AI 메시지: TTS 재생 시간 동안 표시
 * - 스트리밍 방식으로 실시간 업데이트
 */
export function AIMessageOverlay({
  message,
  role,
  isStreaming,
  isVisible,
  isSpeaking,
}: AIMessageOverlayProps) {
  const [showOverlay, setShowOverlay] = useState(false);
  const [fadeOut, setFadeOut] = useState(false);

  // 표시/숨김 로직
  useEffect(() => {
    if (isVisible && message) {
      setShowOverlay(true);
      setFadeOut(false);
    } else if (!isVisible) {
      // 페이드아웃 애니메이션 후 숨김
      setFadeOut(true);
      const timer = setTimeout(() => {
        setShowOverlay(false);
        setFadeOut(false);
      }, 300); // 0.3초 페이드아웃
      return () => clearTimeout(timer);
    }
  }, [isVisible, message]);

  // 렌더링하지 않을 조건
  if (!showOverlay || !message) {
    return null;
  }

  // 역할별 스타일
  const roleStyles = {
    user: {
      bg: 'bg-blue-600/90',
      text: 'text-white',
      label: '사용자',
    },
    ai: {
      bg: 'bg-slate-700/90',
      text: 'text-white',
      label: 'AI 상담사',
    },
  };

  const currentStyle = roleStyles[role];

  return (
    <div
      className={`absolute top-4 left-1/2 transform -translate-x-1/2 z-20
        max-w-[90%] md:max-w-[80%] lg:max-w-[70%]
        transition-opacity duration-300 ease-in-out
        ${fadeOut ? 'opacity-0' : 'opacity-100'}`}
      role="status"
      aria-live="polite"
      aria-label={`${currentStyle.label} 메시지`}
    >
      <div
        className={`${currentStyle.bg} ${currentStyle.text}
          px-4 py-3 rounded-lg shadow-2xl
          backdrop-blur-md border border-white/10
          animate-fade-in`}
      >
        {/* 역할 라벨 */}
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-semibold opacity-80">
            {currentStyle.label}
          </span>
          {isStreaming && (
            <span className="flex items-center gap-1 text-xs opacity-70">
              <span className="animate-pulse">●</span>
              <span>응답 생성 중</span>
            </span>
          )}
          {isSpeaking && !isStreaming && (
            <span className="flex items-center gap-1 text-xs opacity-70">
              <span className="animate-pulse">🔊</span>
              <span>재생 중</span>
            </span>
          )}
        </div>

        {/* 메시지 내용 */}
        <div className="text-sm md:text-base leading-relaxed whitespace-pre-wrap break-words">
          {message}
        </div>
      </div>
    </div>
  );
}
