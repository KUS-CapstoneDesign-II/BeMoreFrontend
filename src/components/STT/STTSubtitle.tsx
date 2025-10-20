import { useState, useEffect } from 'react';

interface STTSubtitleProps {
  text: string;
  className?: string;
  displayDuration?: number; // 자막 표시 지속 시간 (ms, 기본값: 3000)
}

/**
 * STTSubtitle 컴포넌트
 *
 * 유튜브 스타일의 실시간 자막을 표시합니다.
 */
export function STTSubtitle({
  text,
  className = '',
  displayDuration = 3000
}: STTSubtitleProps) {
  const [displayText, setDisplayText] = useState('');
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (text) {
      setDisplayText(text);
      setIsVisible(true);

      // 일정 시간 후 페이드 아웃
      const timer = setTimeout(() => {
        setIsVisible(false);
      }, displayDuration);

      return () => clearTimeout(timer);
    }
  }, [text, displayDuration]);

  if (!displayText) return null;

  return (
    <div
      className={`
        absolute bottom-20 left-1/2 transform -translate-x-1/2
        bg-black bg-opacity-80 text-white px-4 py-2 rounded-lg
        text-sm md:text-base font-medium
        max-w-[80%] text-center
        transition-opacity duration-300
        ${isVisible ? 'opacity-100' : 'opacity-0'}
        ${className}
      `}
    >
      {displayText}
    </div>
  );
}
