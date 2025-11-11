/**
 * Session End Progress Modal Component
 *
 * 세션 종료 대기 시각화
 * - 단계별 진행 상태 표시 (1/5, 2/5, ...)
 * - 진행률 표시 (20%, 40%, ...)
 * - 예상 남은 시간 표시
 * - Peak-End Rule 적용: 마지막 인상을 긍정적으로
 */

import { useState, useEffect } from 'react';

export interface SessionEndProgressModalProps {
  isOpen: boolean;
}

interface ProgressStep {
  id: number;
  label: string;
  estimatedDuration: number; // 예상 소요 시간 (ms)
}

const PROGRESS_STEPS: ProgressStep[] = [
  { id: 1, label: '세션 데이터 저장', estimatedDuration: 2000 },
  { id: 2, label: '감정 분석 진행', estimatedDuration: 5000 },
  { id: 3, label: '대화 내용 분석', estimatedDuration: 8000 },
  { id: 4, label: '종합 리포트 생성', estimatedDuration: 10000 },
  { id: 5, label: '결과 최적화', estimatedDuration: 5000 },
];

const TOTAL_DURATION = PROGRESS_STEPS.reduce((sum, step) => sum + step.estimatedDuration, 0);

export function SessionEndProgressModal({ isOpen }: SessionEndProgressModalProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [progress, setProgress] = useState(0);
  const [remainingTime, setRemainingTime] = useState(TOTAL_DURATION);

  useEffect(() => {
    if (!isOpen) {
      // 모달이 닫혀있으면 초기화
      setCurrentStep(1);
      setProgress(0);
      setRemainingTime(TOTAL_DURATION);
      return;
    }

    // 모달이 열리면 진행 시작
    const startTime = Date.now();

    const interval = setInterval(() => {
      const now = Date.now();
      const totalElapsed = now - startTime;

      // 현재 단계 결정
      let cumulativeTime = 0;
      let foundStep = 1;
      for (const step of PROGRESS_STEPS) {
        cumulativeTime += step.estimatedDuration;
        if (totalElapsed < cumulativeTime) {
          foundStep = step.id;
          break;
        }
      }

      // 최대 5단계까지
      if (totalElapsed >= TOTAL_DURATION) {
        foundStep = PROGRESS_STEPS.length;
      }

      setCurrentStep(foundStep);

      // 진행률 계산 (0-100%)
      const progressPercent = Math.min(100, (totalElapsed / TOTAL_DURATION) * 100);
      setProgress(progressPercent);

      // 남은 시간 계산
      const remaining = Math.max(0, TOTAL_DURATION - totalElapsed);
      setRemainingTime(remaining);

      // 완료 시 타이머 정리
      if (totalElapsed >= TOTAL_DURATION) {
        clearInterval(interval);
      }
    }, 100); // 100ms마다 업데이트

    return () => clearInterval(interval);
  }, [isOpen]);

  if (!isOpen) return null;

  const totalSteps = PROGRESS_STEPS.length;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-label="세션 종료 진행 중"
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40" />

      {/* Modal Content */}
      <div className="relative bg-white dark:bg-gray-900 rounded-xl shadow-soft-lg p-8 max-w-md w-full mx-4">
        <div className="flex flex-col items-center">
          {/* 스피너 */}
          <div className="mb-6">
            <div className="relative w-16 h-16">
              <div className="absolute inset-0 border-4 border-primary-200 dark:border-primary-900 rounded-full" />
              <div className="absolute inset-0 border-4 border-transparent border-t-primary-500 dark:border-t-primary-400 rounded-full animate-spin" />
            </div>
          </div>

          {/* 제목 */}
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            세션 결과 분석 중...
          </h3>

          {/* 단계 표시 (1/5) */}
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            {currentStep}/{totalSteps} 단계
          </p>

          {/* 진행률 바 */}
          <div className="w-full mb-6">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs text-gray-600 dark:text-gray-400">진행률</span>
              <span className="text-xs font-medium text-primary-600 dark:text-primary-400">
                {Math.round(progress)}%
              </span>
            </div>
            <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-primary-500 to-primary-600 transition-all duration-300 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* 현재 단계 세부 정보 */}
          <div className="w-full space-y-2">
            {PROGRESS_STEPS.map((step) => (
              <div
                key={step.id}
                className={`flex items-center justify-between p-2 rounded-lg transition-all ${
                  step.id === currentStep
                    ? 'bg-primary-50 dark:bg-primary-900/20'
                    : step.id < currentStep
                    ? 'bg-green-50 dark:bg-green-900/20'
                    : 'bg-gray-50 dark:bg-gray-800/50'
                }`}
              >
                <div className="flex items-center gap-2">
                  {/* 상태 아이콘 */}
                  {step.id < currentStep ? (
                    <span className="text-green-600 dark:text-green-400">✓</span>
                  ) : step.id === currentStep ? (
                    <span className="inline-block w-2 h-2 bg-primary-500 rounded-full animate-pulse" />
                  ) : (
                    <span className="inline-block w-2 h-2 bg-gray-300 dark:bg-gray-600 rounded-full" />
                  )}

                  {/* 단계 라벨 */}
                  <span
                    className={`text-sm ${
                      step.id === currentStep
                        ? 'font-medium text-primary-700 dark:text-primary-300'
                        : step.id < currentStep
                        ? 'text-gray-600 dark:text-gray-400'
                        : 'text-gray-500 dark:text-gray-500'
                    }`}
                  >
                    {step.label}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* 예상 남은 시간 */}
          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              예상 남은 시간: <span className="font-medium">{Math.ceil(remainingTime / 1000)}초</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
