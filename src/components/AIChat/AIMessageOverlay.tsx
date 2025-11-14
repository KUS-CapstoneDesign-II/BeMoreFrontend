import { useEffect, useState } from 'react';
import type { Emotion } from '../../types/ai-chat';

interface AIMessageOverlayProps {
  message: string;
  role: 'user' | 'ai';
  isStreaming: boolean;
  isVisible: boolean;
  isSpeaking: boolean;
  emotion?: Emotion;
  error?: string;
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
  emotion,
  error,
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

  // 감정 라벨 매핑
  const emotionLabels: Record<Emotion, string> = {
    happy: '행복',
    sad: '슬픔',
    angry: '분노',
    anxious: '불안',
    neutral: '중립',
    surprised: '놀람',
    disgusted: '혐오',
    fearful: '두려움',
  };

  // 역할별 스타일
  const roleStyles = {
    user: {
      bg: 'bg-blue-600/90',
      text: 'text-white',
      label: '사용자',
    },
    ai: {
      bg: error ? 'bg-red-600/90' : 'bg-slate-700/90',
      text: 'text-white',
      label: error ? '오류' : 'AI 상담사',
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
          {role === 'user' && emotion && (
            <span className="px-2 py-0.5 bg-white/20 rounded-full text-xs">
              {emotionLabels[emotion]}
            </span>
          )}
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
          {error || message}
        </div>

        {/* 에러 메시지 안내 */}
        {error && (
          <div className="mt-2 text-xs opacity-80">
            💡 세션이 만료되었을 수 있습니다. 페이지를 새로고침해주세요.
          </div>
        )}
      </div>
    </div>
  );
}
