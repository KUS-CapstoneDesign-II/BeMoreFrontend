import { useState, useCallback, useRef } from 'react';
import type { EmotionData, EmotionType } from '../types';

interface UseEmotionOptions {
  maxHistory?: number; // 최대 감정 히스토리 개수 (기본값: 1000)
  onEmotionChange?: (emotion: EmotionData) => void;
}

interface EmotionStats {
  dominantEmotion: EmotionType | null;
  emotionCounts: Record<EmotionType, number>;
  averageDuration: number;
  totalChanges: number;
}

interface UseEmotionReturn {
  currentEmotion: EmotionData | null;
  emotionHistory: EmotionData[];
  stats: EmotionStats;
  addEmotion: (emotion: EmotionData) => void;
  clearHistory: () => void;
  getEmotionsByTimeRange: (startTime: number, endTime: number) => EmotionData[];
  getEmotionPercentages: () => Record<EmotionType, number>;
}

/**
 * useEmotion 훅
 *
 * 실시간 감정 데이터를 추적하고 히스토리를 관리합니다.
 * WebSocket으로 받은 감정 업데이트를 저장하고 통계를 제공합니다.
 *
 * @example
 * ```tsx
 * const { currentEmotion, emotionHistory, stats, addEmotion } = useEmotion({
 *   maxHistory: 1000,
 *   onEmotionChange: (emotion) => {
 *     console.log('새로운 감정:', emotion.emotion);
 *   }
 * });
 *
 * // WebSocket 메시지 수신 시
 * useWebSocket({
 *   onSessionMessage: (message) => {
 *     if (message.type === 'emotion_update') {
 *       addEmotion(message.data);
 *     }
 *   }
 * });
 *
 * // 통계 확인
 * console.log('가장 많이 나타난 감정:', stats.dominantEmotion);
 * console.log('감정 변화 횟수:', stats.totalChanges);
 * ```
 */
export function useEmotion(options: UseEmotionOptions = {}): UseEmotionReturn {
  const { maxHistory = 1000, onEmotionChange } = options;

  const [currentEmotion, setCurrentEmotion] = useState<EmotionData | null>(null);
  const [emotionHistory, setEmotionHistory] = useState<EmotionData[]>([]);
  const emotionCountsRef = useRef<Record<EmotionType, number>>({
    happy: 0,
    sad: 0,
    angry: 0,
    anxious: 0,
    neutral: 0,
    surprised: 0,
    disgusted: 0,
    fearful: 0,
  });

  // 감정 추가
  const addEmotion = useCallback(
    (emotion: EmotionData) => {
      setCurrentEmotion(emotion);

      setEmotionHistory((prev) => {
        const newHistory = [...prev, emotion];

        // 최대 히스토리 개수 제한
        if (newHistory.length > maxHistory) {
          const removed = newHistory.shift();
          if (removed) {
            emotionCountsRef.current[removed.emotion] = Math.max(
              0,
              emotionCountsRef.current[removed.emotion] - 1
            );
          }
        }

        return newHistory;
      });

      // 감정 카운트 증가
      emotionCountsRef.current[emotion.emotion] += 1;

      // 콜백 호출
      onEmotionChange?.(emotion);
    },
    [maxHistory, onEmotionChange]
  );

  // 히스토리 초기화
  const clearHistory = useCallback(() => {
    setCurrentEmotion(null);
    setEmotionHistory([]);
    emotionCountsRef.current = {
      happy: 0,
      sad: 0,
      angry: 0,
      anxious: 0,
      neutral: 0,
      surprised: 0,
      disgusted: 0,
      fearful: 0,
    };
  }, []);

  // 시간 범위로 감정 필터링
  const getEmotionsByTimeRange = useCallback(
    (startTime: number, endTime: number): EmotionData[] => {
      return emotionHistory.filter(
        (emotion) => emotion.timestamp >= startTime && emotion.timestamp <= endTime
      );
    },
    [emotionHistory]
  );

  // 감정 비율 계산
  const getEmotionPercentages = useCallback((): Record<EmotionType, number> => {
    const total = emotionHistory.length;
    if (total === 0) {
      return {
        happy: 0,
        sad: 0,
        angry: 0,
        anxious: 0,
        neutral: 0,
        surprised: 0,
        disgusted: 0,
        fearful: 0,
      };
    }

    const percentages: Record<EmotionType, number> = {} as Record<EmotionType, number>;
    Object.entries(emotionCountsRef.current).forEach(([emotion, count]) => {
      percentages[emotion as EmotionType] = Math.round((count / total) * 100);
    });

    return percentages;
  }, [emotionHistory.length]);

  // 통계 계산
  const stats: EmotionStats = {
    dominantEmotion:
      emotionHistory.length > 0
        ? (Object.entries(emotionCountsRef.current).reduce((max, [emotion, count]) =>
            count > max[1] ? [emotion, count] : max
          )[0] as EmotionType)
        : null,
    emotionCounts: { ...emotionCountsRef.current },
    averageDuration:
      emotionHistory.length > 1
        ? (emotionHistory[emotionHistory.length - 1].timestamp - emotionHistory[0].timestamp) /
          emotionHistory.length
        : 0,
    totalChanges: emotionHistory.length,
  };

  return {
    currentEmotion,
    emotionHistory,
    stats,
    addEmotion,
    clearHistory,
    getEmotionsByTimeRange,
    getEmotionPercentages,
  };
}
