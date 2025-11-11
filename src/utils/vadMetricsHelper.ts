/**
 * VAD Metrics Helper - User-Friendly Display
 *
 * Jakob의 법칙 적용: 사용자가 익숙한 표현으로 기술 지표를 변환
 * 기술적 수치(0-100%, RMS, frequency) → 일상적 언어(잘 들려요, 보통, 조금 더 크게)
 */

import type { VadState } from '../types/session';

/**
 * 음성 레벨 범위 정의
 */
export const AUDIO_LEVEL_RANGES = {
  SILENT: { min: 0, max: 10 },
  VERY_LOW: { min: 10, max: 25 },
  LOW: { min: 25, max: 40 },
  MODERATE: { min: 40, max: 60 },
  GOOD: { min: 60, max: 80 },
  HIGH: { min: 80, max: 100 },
} as const;

/**
 * 음성 레벨 분류
 */
export type AudioLevelCategory = 'silent' | 'very_low' | 'low' | 'moderate' | 'good' | 'high';

/**
 * 음성 레벨을 카테고리로 분류
 */
export function categorizeAudioLevel(level: number): AudioLevelCategory {
  if (level <= AUDIO_LEVEL_RANGES.SILENT.max) return 'silent';
  if (level <= AUDIO_LEVEL_RANGES.VERY_LOW.max) return 'very_low';
  if (level <= AUDIO_LEVEL_RANGES.LOW.max) return 'low';
  if (level <= AUDIO_LEVEL_RANGES.MODERATE.max) return 'moderate';
  if (level <= AUDIO_LEVEL_RANGES.GOOD.max) return 'good';
  return 'high';
}

/**
 * 음성 레벨을 사용자 친화적 텍스트로 변환
 */
export function getAudioLevelText(level: number): string {
  const category = categorizeAudioLevel(level);

  const textMap: Record<AudioLevelCategory, string> = {
    silent: '조용함',
    very_low: '매우 작음',
    low: '작음',
    moderate: '보통',
    good: '적정',
    high: '큼',
  };

  return textMap[category];
}

/**
 * 음성 레벨에 대한 이모지 아이콘
 */
export function getAudioLevelIcon(level: number): string {
  const category = categorizeAudioLevel(level);

  const iconMap: Record<AudioLevelCategory, string> = {
    silent: '🔇',
    very_low: '🔉',
    low: '🔉',
    moderate: '🔊',
    good: '📢',
    high: '📢',
  };

  return iconMap[category];
}

/**
 * VAD 상태를 사용자 친화적 텍스트로 변환
 */
export function getVadStateText(vadState: VadState, audioLevel: number): string {
  if (vadState === 'voice') {
    // 음성 감지 상태에서 레벨에 따라 다른 메시지
    const category = categorizeAudioLevel(audioLevel);

    const textMap: Record<AudioLevelCategory, string> = {
      silent: '음성 감지 중...',
      very_low: '잘 들려요 (조금 더 크게)',
      low: '잘 들려요',
      moderate: '잘 들려요',
      good: '또렷하게 들려요',
      high: '매우 또렷하게 들려요',
    };

    return textMap[category];
  } else {
    // 침묵 상태
    return '대기 중';
  }
}

/**
 * VAD 상태에 대한 이모지 아이콘
 */
export function getVadStateIcon(vadState: VadState, audioLevel: number): string {
  if (vadState === 'voice') {
    const category = categorizeAudioLevel(audioLevel);

    const iconMap: Record<AudioLevelCategory, string> = {
      silent: '🎤',
      very_low: '🗣️',
      low: '🗣️',
      moderate: '🗣️',
      good: '✨',
      high: '✨',
    };

    return iconMap[category];
  } else {
    return '⏸️';
  }
}

/**
 * 음성 레벨 개선을 위한 사용자 가이드 메시지
 */
export function getAudioLevelGuidance(level: number, vadState: VadState): string {
  const category = categorizeAudioLevel(level);

  // 음성 감지 상태일 때
  if (vadState === 'voice') {
    const guidanceMap: Record<AudioLevelCategory, string> = {
      silent: '마이크가 제대로 작동하는지 확인해주세요',
      very_low: '조금 더 크게 말씀해주세요',
      low: '편안한 크기로 말씀하고 계세요',
      moderate: '완벽해요! 이대로 계속해주세요',
      good: '완벽해요! 이대로 계속해주세요',
      high: '너무 크지 않도록 주의해주세요',
    };

    return guidanceMap[category];
  }

  // 침묵 상태일 때
  return '편안하게 말씀해주세요';
}

/**
 * 음성 레벨 상태에 따른 색상 클래스
 */
export function getAudioLevelColorClass(level: number): string {
  const category = categorizeAudioLevel(level);

  const colorMap: Record<AudioLevelCategory, string> = {
    silent: 'text-gray-500 dark:text-gray-400',
    very_low: 'text-orange-600 dark:text-orange-400',
    low: 'text-yellow-600 dark:text-yellow-400',
    moderate: 'text-green-600 dark:text-green-400',
    good: 'text-green-600 dark:text-green-400',
    high: 'text-blue-600 dark:text-blue-400',
  };

  return colorMap[category];
}

/**
 * 음성 레벨 배경 색상 클래스
 */
export function getAudioLevelBgClass(level: number): string {
  const category = categorizeAudioLevel(level);

  const bgMap: Record<AudioLevelCategory, string> = {
    silent: 'bg-gray-100 dark:bg-gray-800',
    very_low: 'bg-orange-50 dark:bg-orange-900/20',
    low: 'bg-yellow-50 dark:bg-yellow-900/20',
    moderate: 'bg-green-50 dark:bg-green-900/20',
    good: 'bg-green-50 dark:bg-green-900/20',
    high: 'bg-blue-50 dark:bg-blue-900/20',
  };

  return bgMap[category];
}

/**
 * 종합 VAD 상태 요약 (ActiveSessionView 등에서 사용)
 */
export interface VadStatusSummary {
  text: string;
  icon: string;
  colorClass: string;
  bgClass: string;
  guidance: string;
  levelText: string;
  levelIcon: string;
}

/**
 * 종합 VAD 상태 정보 생성
 */
export function getVadStatusSummary(audioLevel: number, vadState: VadState): VadStatusSummary {
  return {
    text: getVadStateText(vadState, audioLevel),
    icon: getVadStateIcon(vadState, audioLevel),
    colorClass: getAudioLevelColorClass(audioLevel),
    bgClass: getAudioLevelBgClass(audioLevel),
    guidance: getAudioLevelGuidance(audioLevel, vadState),
    levelText: getAudioLevelText(audioLevel),
    levelIcon: getAudioLevelIcon(audioLevel),
  };
}
