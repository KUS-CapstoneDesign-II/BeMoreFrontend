import { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../primitives';
import { DeviceTestStep } from './DeviceTestStep';
import { PermissionHelpModal } from './PermissionHelpModal';

interface OnboardingStep {
  title: string;
  description: string;
  icon: string;
  details: string[];
}

interface OnboardingProps {
  onComplete: () => void;
  onSkip?: () => void;
}

const onboardingSteps: OnboardingStep[] = [
  {
    title: '환영합니다!',
    icon: '👋',
    description: 'BeMore는 AI 기반 심리 상담 시스템입니다',
    details: [
      '실시간 감정 인식으로 내 상태를 파악해요',
      'AI 상담사가 24시간 함께 합니다',
      '모든 대화는 안전하게 보호됩니다'
    ]
  },
  {
    title: '카메라 권한',
    icon: '📹',
    description: '얼굴 표정 분석을 위해 카메라 권한이 필요해요',
    details: [
      '468개의 얼굴 랜드마크를 분석합니다',
      '실시간으로 8가지 감정을 감지해요',
      '개인정보는 서버에 저장되지 않습니다'
    ]
  },
  {
    title: '시작할 준비 완료!',
    icon: '🚀',
    description: '이제 AI 상담사와 대화를 시작할 수 있어요',
    details: [
      '세션 시작 버튼을 눌러주세요',
      '편안한 자세로 화면을 바라봐주세요',
      '자연스럽게 이야기하시면 됩니다'
    ]
  }
];

/**
 * Onboarding 컴포넌트
 *
 * 첫 방문자를 위한 3단계 온보딩 플로우를 제공합니다.
 */
export function Onboarding({ onComplete, onSkip }: OnboardingProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [helpOpen, setHelpOpen] = useState(false);
  const step = onboardingSteps[currentStep];
  const isLastStep = currentStep === onboardingSteps.length - 1;

  const handleNext = () => {
    if (isLastStep) {
      onComplete();
    } else {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    setCurrentStep((prev) => Math.max(0, prev - 1));
  };

  return (
    <>
      <Modal
        isOpen={true}
        title={step.title}
        size="lg"
        className="text-center"
      >
        {/* 상단: 아이콘 */}
        <div className="mb-6">
          <div
            className="text-6xl sm:text-7xl mb-4 animate-bounce-subtle"
            role="img"
            aria-label={step.title}
          >
            {step.icon}
          </div>
          <p className="text-base sm:text-lg text-gray-600 dark:text-gray-400">
            {step.description}
          </p>
        </div>

        {/* 중앙: 세부 내용 */}
        <div className="mb-6 space-y-3">
          {currentStep === 1 ? (
            <DeviceTestStep onOpenHelp={() => setHelpOpen(true)} />
          ) : (
            step.details.map((detail, index) => (
              <div
                key={index}
                className="flex items-start space-x-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg animate-fade-in-up"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div
                  className="flex-shrink-0 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold"
                  aria-hidden="true"
                >
                  {index + 1}
                </div>
                <p className="text-sm sm:text-base text-gray-700 dark:text-gray-300 flex-1">
                  {detail}
                </p>
              </div>
            ))
          )}
        </div>

        {/* 하단: 진행 표시 및 버튼 */}
        <div className="space-y-4">
          {/* 진행 표시 점 */}
          <div className="flex justify-center space-x-2" role="group" aria-label="온보딩 진행 상태">
            {onboardingSteps.map((_, index) => (
              <div
                key={index}
                className={`
                  w-2 h-2 rounded-full transition-all duration-300
                  ${index === currentStep
                    ? 'bg-blue-500 w-8'
                    : index < currentStep
                    ? 'bg-blue-300 dark:bg-blue-600'
                    : 'bg-gray-300 dark:bg-gray-600'
                  }
                `}
                aria-label={`${index === currentStep ? '현재' : index < currentStep ? '완료' : '미완료'} 단계 ${index + 1}`}
                aria-current={index === currentStep ? 'step' : undefined}
              ></div>
            ))}
          </div>

          {/* 버튼 그룹 */}
          <div className="flex items-center justify-between gap-3">
            <Button
              variant="ghost"
              label={currentStep === 0 ? '건너뛰기' : '이전'}
              onClick={currentStep === 0 ? onSkip : handlePrev}
              aria-label={currentStep === 0 ? '온보딩 건너뛰기' : '이전 단계'}
            />

            <Button
              variant="primary"
              label={isLastStep ? '시작하기' : '다음'}
              onClick={handleNext}
              fullWidth
              className="flex-1"
              aria-label={isLastStep ? '온보딩 완료하고 시작하기' : '다음 단계'}
            />
          </div>
        </div>
      </Modal>
      <PermissionHelpModal isOpen={helpOpen} onClose={() => setHelpOpen(false)} />
    </>
  );
}
