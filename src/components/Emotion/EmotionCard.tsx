import { useEffect, useState } from 'react';
import { Card } from '../ui/Card';
import type { EmotionType } from '../../types';

interface EmotionCardProps {
  emotion: EmotionType | null;
  confidence?: number;
  className?: string;
  lastUpdatedAt?: number | null;
  updateCount?: number;
}

const emotionConfig: Record<EmotionType, {
  label: string;
  icon: string;
  color: string;
  bgColor: string;
  progressColor: string;
  animation: string;
  message: string;
}> = {
  happy: {
    label: '행복',
    icon: '😊',
    color: 'text-amber-600',
    bgColor: 'bg-amber-50 border-amber-200',
    progressColor: 'bg-amber-600',
    animation: 'animate-bounce-subtle',
    message: '긍정적인 에너지가 느껴지네요!'
  },
  sad: {
    label: '슬픔',
    icon: '😢',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50 border-blue-200',
    progressColor: 'bg-blue-600',
    animation: 'animate-fade-in-up',
    message: '힘든 시간을 겪고 계시는군요.'
  },
  angry: {
    label: '화남',
    icon: '😠',
    color: 'text-red-500',
    bgColor: 'bg-red-50 border-red-200',
    progressColor: 'bg-red-500',
    animation: 'animate-scale-in',
    message: '감정이 격해진 상태입니다.'
  },
  anxious: {
    label: '불안',
    icon: '😰',
    color: 'text-purple-600',
    bgColor: 'bg-purple-50 border-purple-200',
    progressColor: 'bg-purple-600',
    animation: 'animate-fade-in',
    message: '불안함을 느끼고 계시는군요.'
  },
  neutral: {
    label: '중립',
    icon: '😐',
    color: 'text-gray-600',
    bgColor: 'bg-gray-50 border-gray-200',
    progressColor: 'bg-gray-600',
    animation: 'animate-fade-in',
    message: '안정적인 상태입니다.'
  },
  surprised: {
    label: '놀람',
    icon: '😲',
    color: 'text-orange-600',
    bgColor: 'bg-orange-50 border-orange-200',
    progressColor: 'bg-orange-600',
    animation: 'animate-scale-in',
    message: '놀라운 일이 있었나요?'
  },
  disgusted: {
    label: '혐오',
    icon: '🤢',
    color: 'text-green-600',
    bgColor: 'bg-green-50 border-green-200',
    progressColor: 'bg-green-600',
    animation: 'animate-fade-in-up',
    message: '불편함을 느끼고 계시네요.'
  },
  fearful: {
    label: '두려움',
    icon: '😨',
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-50 border-indigo-200',
    progressColor: 'bg-indigo-600',
    animation: 'animate-fade-in',
    message: '두려움이 느껴지는 상황입니다.'
  }
};

/**
 * EmotionCard 컴포넌트
 *
 * 현재 감지된 감정을 카드 형태로 표시합니다.
 */
export function EmotionCard({
  emotion,
  confidence,
  className = '',
  lastUpdatedAt,
  updateCount = 0
}: EmotionCardProps) {
  // 마지막 업데이트 이후 경과 시간 계산
  const [elapsedTime, setElapsedTime] = useState(0);

  useEffect(() => {
    if (!lastUpdatedAt) return;

    const updateElapsed = () => {
      const now = Date.now();
      const diff = Math.floor((now - lastUpdatedAt) / 1000);
      setElapsedTime(diff);
    };

    updateElapsed();
    const interval = setInterval(updateElapsed, 1000);
    return () => clearInterval(interval);
  }, [lastUpdatedAt]);

  if (!emotion) {
    return (
      <Card
        className={className}
        role="status"
        ariaLabel="감정 분석 중"
        ariaLive="polite"
      >
        <div className="text-center">
          <div className="text-4xl mb-2 animate-pulse" aria-hidden="true">❓</div>
          <div className="text-sm text-gray-500 font-medium">감정 분석 중...</div>
          {updateCount > 0 && (
            <div className="text-xs text-gray-400 mt-2">
              분석 완료: {updateCount}회 ({elapsedTime}초 경과)
            </div>
          )}
        </div>
      </Card>
    );
  }

  const config = emotionConfig[emotion];
  if (!config) {
    return (
      <Card
        className={className}
        role="status"
        ariaLabel="감정 분석 오류"
        ariaLive="polite"
      >
        <div className="text-center">
          <div className="text-4xl mb-2" aria-hidden="true">⚠️</div>
          <div className="text-sm text-gray-500 font-medium">알 수 없는 감정</div>
        </div>
      </Card>
    );
  }

  const confidencePercent = confidence !== undefined ? Math.round(confidence * 100) : null;
  const ariaLabel = `현재 감정: ${config.label}${confidencePercent !== null ? `, 신뢰도 ${confidencePercent}퍼센트` : ''}`;

  return (
    <Card
      bgColor={config.bgColor}
      className={`${config.animation} ${className}`}
      role="status"
      ariaLabel={ariaLabel}
      ariaLive="polite"
    >
      <div className="text-center">
        {/* 이모티콘 */}
        <div className="text-6xl mb-4 animate-pulse-slow" aria-hidden="true">
          {config.icon}
        </div>

        {/* 감정 라벨 */}
        <div className={`text-xl font-bold ${config.color} mb-2`}>
          {config.label}
        </div>

        {/* 감정 메시지 */}
        <p className="text-sm text-gray-600 mb-3 leading-relaxed">
          {config.message}
        </p>

        {/* 업데이트 정보 */}
        {lastUpdatedAt && (
          <div className="text-xs text-gray-500 mt-3 pt-3 border-t border-gray-200">
            <span>마지막 업데이트: {elapsedTime}초 전</span>
            {updateCount > 0 && <span> • 총 {updateCount}회</span>}
          </div>
        )}

        {/* 신뢰도 바 */}
        {confidencePercent !== null && (
          <div className="space-y-1 mt-3">
            <div className="flex justify-between text-xs text-gray-500">
              <span>신뢰도</span>
              <span className="font-semibold">{confidencePercent}%</span>
            </div>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className={`h-full ${config.progressColor} transition-all duration-500 ease-out`}
                style={{ width: `${confidencePercent}%` }}
              />
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
