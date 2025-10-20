import type { EmotionType } from '../../types';

interface EmotionCardProps {
  emotion: EmotionType | null;
  confidence?: number;
  className?: string;
}

const emotionConfig: Record<EmotionType, {  label: string;
  icon: string;
  color: string;
  bgColor: string;
}> = {
  happy: {
    label: '행복',
    icon: '😊',
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-50 border-yellow-200'
  },
  sad: {
    label: '슬픔',
    icon: '😢',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50 border-blue-200'
  },
  angry: {
    label: '화남',
    icon: '😠',
    color: 'text-red-600',
    bgColor: 'bg-red-50 border-red-200'
  },
  anxious: {
    label: '불안',
    icon: '😰',
    color: 'text-purple-600',
    bgColor: 'bg-purple-50 border-purple-200'
  },
  neutral: {
    label: '중립',
    icon: '😐',
    color: 'text-gray-600',
    bgColor: 'bg-gray-50 border-gray-200'
  },
  surprised: {
    label: '놀람',
    icon: '😲',
    color: 'text-orange-600',
    bgColor: 'bg-orange-50 border-orange-200'
  },
  disgusted: {
    label: '혐오',
    icon: '🤢',
    color: 'text-green-600',
    bgColor: 'bg-green-50 border-green-200'
  },
  fearful: {
    label: '두려움',
    icon: '😨',
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-50 border-indigo-200'
  }
};

/**
 * EmotionCard 컴포넌트
 *
 * 현재 감지된 감정을 카드 형태로 표시합니다.
 */
export function EmotionCard({ emotion, confidence, className = '' }: EmotionCardProps) {
  if (!emotion) {
    return (
      <div
        className={`p-4 rounded-lg border-2 bg-gray-50 border-gray-200 ${className}`}
        role="status"
        aria-live="polite"
        aria-label="감정 분석 중"
      >
        <div className="text-center">
          <div className="text-4xl mb-2" aria-hidden="true">❓</div>
          <div className="text-sm text-gray-500 font-medium">감정 분석 중...</div>
        </div>
      </div>
    );
  }

  const config = emotionConfig[emotion];
  const confidencePercent = confidence !== undefined ? Math.round(confidence * 100) : null;
  const ariaLabel = `현재 감정: ${config.label}${confidencePercent !== null ? `, 신뢰도 ${confidencePercent}퍼센트` : ''}`;

  return (
    <div
      className={`
        p-4 rounded-lg border-2
        ${config.bgColor}
        transition-all duration-300
        animate-pulse-slow
        ${className}
      `}
      role="status"
      aria-live="polite"
      aria-label={ariaLabel}
    >
      <div className="text-center">
        {/* 이모티콘 */}
        <div className="text-5xl mb-3" aria-hidden="true">{config.icon}</div>

        {/* 감정 라벨 */}
        <div className={`text-lg font-bold ${config.color} mb-1`}>
          {config.label}
        </div>

        {/* 신뢰도 (선택적) */}
        {confidencePercent !== null && (
          <div className="text-xs text-gray-600">
            신뢰도: {confidencePercent}%
          </div>
        )}
      </div>
    </div>
  );
}
