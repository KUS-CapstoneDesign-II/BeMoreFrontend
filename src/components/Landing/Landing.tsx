interface LandingProps {
  onStart: () => void;
}

export function Landing({ onStart }: LandingProps) {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 sm:py-14 text-center">
      <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">당신의 마음을 더 잘 이해하는 시간</h2>
      <p className="mt-3 text-sm sm:text-base text-gray-600 dark:text-gray-300">BeMore는 표정과 목소리의 변화를 토대로 당신의 감정 상태를 함께 살펴봅니다.</p>
      <div className="mt-6">
        <button
          onClick={onStart}
          className="px-6 py-3 min-h-[44px] bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white font-semibold rounded-lg shadow-soft hover:shadow-soft-lg transition-all text-sm focus:outline-none focus:ring-2 focus:ring-primary-400 active:scale-95 transform"
          aria-label="세션 시작"
        >지금 시작하기</button>
      </div>
      <div className="mt-6 text-xs text-gray-500 dark:text-gray-400">카메라와 마이크 권한이 필요합니다. 언제든지 해제할 수 있습니다.</div>
    </div>
  );
}
