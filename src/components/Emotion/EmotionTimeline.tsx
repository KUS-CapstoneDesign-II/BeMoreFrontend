import { useState, useEffect } from 'react';
import type { EmotionType } from '../../types';

interface EmotionEntry {
  emotion: EmotionType;
  timestamp: number;
  frameCount: number;
  sttSnippet?: string;
}

interface EmotionTimelineProps {
  emotions: EmotionEntry[];
  className?: string;
}

const emotionColors: Record<EmotionType, string> = {
  happy: 'border-l-amber-500 bg-amber-50',
  sad: 'border-l-blue-500 bg-blue-50',
  angry: 'border-l-red-500 bg-red-50',
  anxious: 'border-l-purple-500 bg-purple-50',
  neutral: 'border-l-gray-500 bg-gray-50',
  surprised: 'border-l-orange-500 bg-orange-50',
  disgusted: 'border-l-green-500 bg-green-50',
  fearful: 'border-l-indigo-500 bg-indigo-50'
};

const emotionEmojis: Record<EmotionType, string> = {
  happy: '🙂',
  sad: '😢',
  angry: '😠',
  anxious: '😰',
  neutral: '😐',
  surprised: '😲',
  disgusted: '🤢',
  fearful: '😨'
};

const emotionLabels: Record<EmotionType, string> = {
  happy: '행복',
  sad: '슬픔',
  angry: '화남',
  anxious: '불안',
  neutral: '중립',
  surprised: '놀람',
  disgusted: '혐오',
  fearful: '두려움'
};

/**
 * EmotionTimeline 컴포넌트
 *
 * 세션 중에 감지된 감정들의 시간 순서대로 표시하는 타임라인입니다.
 * 각 감정은 감지된 시간, 프레임 수, STT 스니펫과 함께 표시됩니다.
 */
export function EmotionTimeline({ emotions, className = '' }: EmotionTimelineProps) {
  const [displayEmotions, setDisplayEmotions] = useState<EmotionEntry[]>([]);

  // 감정이 추가될 때 애니메이션과 함께 표시
  useEffect(() => {
    if (emotions.length > displayEmotions.length) {
      // 새로운 감정이 추가됨
      setTimeout(() => {
        setDisplayEmotions(emotions);
      }, 50);
    } else if (emotions.length < displayEmotions.length) {
      // 리셋됨
      setDisplayEmotions(emotions);
    }
  }, [emotions, displayEmotions.length]);

  if (displayEmotions.length === 0) {
    return (
      <div
        className={`
          p-4 rounded-lg border-2 border-dashed border-gray-300 bg-gray-50
          text-center text-gray-500 text-sm
          ${className}
        `}
      >
        감정이 감지되면 타임라인에 표시됩니다
      </div>
    );
  }

  return (
    <div
      className={`
        space-y-3
        max-h-64 overflow-y-auto
        pr-2
        ${className}
      `}
      role="region"
      aria-label="감정 타임라인"
    >
      {displayEmotions.map((entry, idx) => {
        const color = emotionColors[entry.emotion];
        const emoji = emotionEmojis[entry.emotion];
        const label = emotionLabels[entry.emotion];
        const timeString = new Date(entry.timestamp).toLocaleTimeString('ko-KR', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        });

        return (
          <div
            key={`${entry.timestamp}-${idx}`}
            className={`
              p-3 rounded-lg border-l-4 transition-all duration-300
              animate-slide-in-left
              ${color}
            `}
            role="listitem"
            aria-label={`${label} 감정 감지 - ${timeString} - ${entry.frameCount}프레임`}
          >
            <div className="flex items-start gap-3">
              {/* 이모티콘 */}
              <div className="text-2xl flex-shrink-0 mt-0.5">
                {emoji}
              </div>

              {/* 정보 */}
              <div className="flex-1 min-w-0">
                {/* 감정 이름과 시간 */}
                <div className="flex items-center justify-between gap-2">
                  <h4 className="font-semibold text-gray-800">
                    {label}
                  </h4>
                  <time className="text-xs text-gray-500 flex-shrink-0">
                    {timeString}
                  </time>
                </div>

                {/* 프레임 수 */}
                <div className="text-xs text-gray-600 mt-1">
                  📹 {entry.frameCount}개 프레임
                </div>

                {/* STT 스니펫 (있으면) */}
                {entry.sttSnippet && (
                  <div className="text-xs text-gray-600 mt-2 italic text-gray-500 truncate">
                    💬 "{entry.sttSnippet}"
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}

      <style>{`
        @keyframes slide-in-left {
          from {
            opacity: 0;
            transform: translateX(-10px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        .animate-slide-in-left {
          animation: slide-in-left 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
