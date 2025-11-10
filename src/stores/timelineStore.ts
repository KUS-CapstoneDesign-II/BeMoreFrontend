import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import type { TimelineCard } from '../types/session';
import { Logger } from '../config/env';

interface TimelineState {
  // Cards array (1 card per minute)
  cards: TimelineCard[];

  // Timeline statistics
  totalCards: number;
  totalDuration: number; // ms
  averageScore: number; // 0-100

  // Actions
  addCard: (card: TimelineCard) => void;
  updateCard: (minuteIndex: number, updates: Partial<TimelineCard>) => void;
  removeCard: (minuteIndex: number) => void;
  clearTimeline: () => void;

  // Derived statistics
  getCardByMinute: (minuteIndex: number) => TimelineCard | undefined;
  getStatistics: () => {
    totalCards: number;
    averageScore: number;
    maxScore: number;
    minScore: number;
    emotionDistribution: Record<string, number>;
    keywordFrequency: Record<string, number>;
  };
  getSummary: () => string;
}

/**
 * Timeline Store
 *
 * 세션 중 1분 단위로 생성되는 타임라인 카드를 관리합니다:
 * - 각 카드는 1분의 주요 메트릭을 집계
 * - 감정 분포, 키워드 빈도 계산
 * - 세션 종료 후 최종 보고서 생성에 사용
 */
export const useTimelineStore = create<TimelineState>()(
  subscribeWithSelector((set, get) => ({
    cards: [],
    totalCards: 0,
    totalDuration: 0,
    averageScore: 0,

    // Add a new timeline card (typically called every minute)
    addCard: (card) => {
      set((state) => {
        const newCards = [...state.cards, card];
        const newAverageScore =
          newCards.reduce((sum, c) => sum + c.combinedScore, 0) / newCards.length;
        const newTotalDuration = card.minuteIndex * 60 * 1000 + card.durationMs;

        Logger.info('✅ Timeline card added', {
          minuteIndex: card.minuteIndex,
          score: card.combinedScore,
        });

        return {
          cards: newCards,
          totalCards: newCards.length,
          totalDuration: newTotalDuration,
          averageScore: newAverageScore,
        };
      });
    },

    // Update existing card (for late corrections or additional data)
    updateCard: (minuteIndex, updates) => {
      set((state) => {
        const cardIndex = state.cards.findIndex((c) => c.minuteIndex === minuteIndex);
        if (cardIndex === -1) {
          Logger.warn('❌ Card not found for minute', { minuteIndex });
          return state;
        }

        const updatedCards = [...state.cards];
        const existingCard = updatedCards[cardIndex];
        if (!existingCard) {
          Logger.warn('❌ Card at index not found', { cardIndex });
          return state;
        }
        updatedCards[cardIndex] = { ...existingCard, ...updates };

        const newAverageScore =
          updatedCards.reduce((sum, c) => sum + c.combinedScore, 0) / updatedCards.length;

        Logger.debug('Card updated', { minuteIndex });

        return {
          cards: updatedCards,
          averageScore: newAverageScore,
        };
      });
    },

    // Remove a card (for error recovery)
    removeCard: (minuteIndex) => {
      set((state) => {
        const newCards = state.cards.filter((c) => c.minuteIndex !== minuteIndex);
        if (newCards.length === state.cards.length) {
          Logger.warn('❌ Card not found to remove', { minuteIndex });
          return state;
        }

        const newAverageScore =
          newCards.length > 0
            ? newCards.reduce((sum, c) => sum + c.combinedScore, 0) / newCards.length
            : 0;

        Logger.info('✅ Timeline card removed', { minuteIndex });

        return {
          cards: newCards,
          totalCards: newCards.length,
          averageScore: newAverageScore,
        };
      });
    },

    // Clear entire timeline (on session end)
    clearTimeline: () => {
      set({
        cards: [],
        totalCards: 0,
        totalDuration: 0,
        averageScore: 0,
      });
      Logger.info('✅ Timeline cleared');
    },

    // Get card by minute index
    getCardByMinute: (minuteIndex) => {
      const state = get();
      return state.cards.find((c) => c.minuteIndex === minuteIndex);
    },

    // Calculate comprehensive statistics
    getStatistics: () => {
      const state = get();
      const { cards } = state;

      if (cards.length === 0) {
        return {
          totalCards: 0,
          averageScore: 0,
          maxScore: 0,
          minScore: 0,
          emotionDistribution: {},
          keywordFrequency: {},
        };
      }

      // Calculate score statistics
      const scores = cards.map((c) => c.combinedScore);
      const maxScore = Math.max(...scores);
      const minScore = Math.min(...scores);

      // Calculate emotion distribution
      const emotionDistribution: Record<string, number> = {
        positive: 0,
        neutral: 0,
        negative: 0,
      };
      cards.forEach((card) => {
        if (card.sentiment) {
          emotionDistribution[card.sentiment] =
            (emotionDistribution[card.sentiment] || 0) + 1;
        }
      });

      // Calculate keyword frequency
      const keywordFrequency: Record<string, number> = {};
      cards.forEach((card) => {
        card.keywords.forEach((keyword) => {
          keywordFrequency[keyword] = (keywordFrequency[keyword] || 0) + 1;
        });
      });

      // Sort keywords by frequency (top 20)
      const sortedKeywords = Object.fromEntries(
        Object.entries(keywordFrequency)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 20)
      );

      Logger.debug('Statistics calculated', {
        totalCards: cards.length,
        averageScore: state.averageScore.toFixed(2),
        maxScore,
        minScore,
      });

      return {
        totalCards: cards.length,
        averageScore: state.averageScore,
        maxScore,
        minScore,
        emotionDistribution,
        keywordFrequency: sortedKeywords,
      };
    },

    // Get human-readable summary
    getSummary: () => {
      const state = get();
      const stats = state.getStatistics();

      if (stats.totalCards === 0) {
        return '아직 수집된 데이터가 없습니다.';
      }

      const duration = Math.floor(state.totalDuration / 60000);
      const emotionKey = Object.entries(stats.emotionDistribution).reduce((a, b) =>
        a[1] > b[1] ? a : b
      );
      const topKeywords = Object.keys(stats.keywordFrequency).slice(0, 3).join(', ');

      return `
        총 ${stats.totalCards}분간 수집됨 (${duration}분 경과)
        평균 점수: ${stats.averageScore.toFixed(1)}/100
        주요 감정: ${emotionKey[0]}
        상위 키워드: ${topKeywords || '데이터 수집 중'}
      `.trim();
    },
  }))
);

/**
 * Helper hook to get timeline cards and statistics
 */
export const useTimelineCards = () => {
  return useTimelineStore((state) => ({
    cards: state.cards,
    totalCards: state.totalCards,
    averageScore: state.averageScore,
  }));
};

/**
 * Helper hook to get timeline statistics for display
 */
export const useTimelineStatistics = () => {
  return useTimelineStore((state) => {
    const stats = state.getStatistics();
    return {
      ...stats,
      summary: state.getSummary(),
    };
  });
};
