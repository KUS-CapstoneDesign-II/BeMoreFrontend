import { create } from 'zustand';
import type { EmotionData, EmotionType } from '../types';

interface EmotionState {
  currentEmotion: EmotionData | null;
  emotionHistory: EmotionData[];
  maxHistory: number;

  // Actions
  addEmotion: (emotion: EmotionData) => void;
  clearHistory: () => void;
  setMaxHistory: (maxHistory: number) => void;

  // Computed
  getDominantEmotion: () => EmotionType | null;
  getEmotionCounts: () => Record<EmotionType, number>;
  getEmotionPercentages: () => Record<EmotionType, number>;
}

/**
 * Emotion Store
 *
 * 감정 데이터를 전역으로 관리합니다.
 *
 * @example
 * ```tsx
 * import { useEmotionStore } from '@/stores/emotionStore';
 *
 * function EmotionDisplay() {
 *   const { currentEmotion, emotionHistory, addEmotion } = useEmotionStore();
 *
 *   useEffect(() => {
 *     // WebSocket에서 감정 데이터 수신 시
 *     const emotion: EmotionData = {
 *       timestamp: Date.now(),
 *       emotion: 'happy',
 *       frameCount: 100,
 *       sttLength: 50
 *     };
 *     addEmotion(emotion);
 *   }, []);
 *
 *   return (
 *     <div>
 *       <p>현재 감정: {currentEmotion?.emotion}</p>
 *       <p>히스토리: {emotionHistory.length}개</p>
 *     </div>
 *   );
 * }
 * ```
 */
export const useEmotionStore = create<EmotionState>((set, get) => ({
  currentEmotion: null,
  emotionHistory: [],
  maxHistory: 1000,

  addEmotion: (emotion) =>
    set((state) => {
      const newHistory = [...state.emotionHistory, emotion];

      // 최대 히스토리 개수 제한
      if (newHistory.length > state.maxHistory) {
        newHistory.shift();
      }

      return {
        currentEmotion: emotion,
        emotionHistory: newHistory,
      };
    }),

  clearHistory: () =>
    set({
      currentEmotion: null,
      emotionHistory: [],
    }),

  setMaxHistory: (maxHistory) => set({ maxHistory }),

  getDominantEmotion: () => {
    const { emotionHistory } = get();
    if (emotionHistory.length === 0) return null;

    const counts = get().getEmotionCounts();
    const maxEmotion = Object.entries(counts).reduce((max, [emotion, count]) =>
      count > max[1] ? [emotion, count] : max
    )[0] as EmotionType;

    return maxEmotion;
  },

  getEmotionCounts: () => {
    const { emotionHistory } = get();
    const counts: Record<EmotionType, number> = {
      happy: 0,
      sad: 0,
      angry: 0,
      anxious: 0,
      neutral: 0,
      surprised: 0,
      disgusted: 0,
      fearful: 0,
    };

    emotionHistory.forEach((emotion) => {
      counts[emotion.emotion] += 1;
    });

    return counts;
  },

  getEmotionPercentages: () => {
    const { emotionHistory } = get();
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

    const counts = get().getEmotionCounts();
    const percentages: Record<EmotionType, number> = {} as Record<EmotionType, number>;

    Object.entries(counts).forEach(([emotion, count]) => {
      percentages[emotion as EmotionType] = Math.round((count / total) * 100);
    });

    return percentages;
  },
}));
