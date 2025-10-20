interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'rectangular' | 'circular';
  width?: string;
  height?: string;
  animation?: boolean;
}

/**
 * Skeleton 컴포넌트
 *
 * 로딩 중에 표시되는 스켈레톤 UI 컴포넌트입니다.
 */
export function Skeleton({
  className = '',
  variant = 'rectangular',
  width,
  height,
  animation = true
}: SkeletonProps) {
  const baseClasses = 'bg-gray-200';
  const animationClasses = animation ? 'animate-pulse' : '';

  const variantClasses = {
    text: 'h-4 rounded',
    rectangular: 'rounded-lg',
    circular: 'rounded-full'
  };

  const style = {
    width: width || (variant === 'circular' ? '40px' : '100%'),
    height: height || (variant === 'text' ? '1em' : variant === 'circular' ? '40px' : '100px')
  };

  return (
    <div
      className={`${baseClasses} ${variantClasses[variant]} ${animationClasses} ${className}`}
      style={style}
      role="status"
      aria-label="로딩 중"
    >
      <span className="sr-only">로딩 중...</span>
    </div>
  );
}

/**
 * VideoFeedSkeleton 컴포넌트
 *
 * VideoFeed 컴포넌트의 로딩 스켈레톤입니다.
 */
export function VideoFeedSkeleton() {
  return (
    <div className="relative w-full aspect-video bg-gray-900 rounded-lg overflow-hidden">
      <Skeleton className="w-full h-full" variant="rectangular" />
      <div className="absolute top-4 right-4">
        <Skeleton variant="circular" width="48px" height="48px" />
      </div>
    </div>
  );
}

/**
 * EmotionCardSkeleton 컴포넌트
 *
 * EmotionCard 컴포넌트의 로딩 스켈레톤입니다.
 */
export function EmotionCardSkeleton() {
  return (
    <div className="p-4 rounded-lg bg-gray-50 border border-gray-200">
      <div className="flex items-center justify-between mb-3">
        <Skeleton variant="circular" width="40px" height="40px" />
        <Skeleton width="60px" height="24px" />
      </div>
      <Skeleton className="mb-2" width="70%" height="20px" />
      <Skeleton width="100%" height="8px" />
    </div>
  );
}

/**
 * AIChatSkeleton 컴포넌트
 *
 * AIChat 컴포넌트의 로딩 스켈레톤입니다.
 */
export function AIChatSkeleton() {
  return (
    <div className="flex flex-col h-full bg-white rounded-lg border border-gray-200 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-gray-200">
        <div className="flex items-center space-x-2">
          <Skeleton variant="circular" width="32px" height="32px" />
          <div>
            <Skeleton width="80px" height="16px" className="mb-1" />
            <Skeleton width="60px" height="12px" />
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 p-4 space-y-3">
        <div className="flex justify-start">
          <Skeleton width="60%" height="40px" className="rounded-lg" />
        </div>
        <div className="flex justify-end">
          <Skeleton width="50%" height="40px" className="rounded-lg" />
        </div>
        <div className="flex justify-start">
          <Skeleton width="70%" height="40px" className="rounded-lg" />
        </div>
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-gray-200 bg-gray-50">
        <Skeleton width="120px" height="16px" className="mx-auto" />
      </div>
    </div>
  );
}

/**
 * VADMonitorSkeleton 컴포넌트
 *
 * VADMonitor 컴포넌트의 로딩 스켈레톤입니다.
 */
export function VADMonitorSkeleton() {
  return (
    <div className="p-4 rounded-lg bg-white border border-gray-200 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <Skeleton width="120px" height="16px" />
        <Skeleton variant="circular" width="8px" height="8px" />
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 gap-3 mb-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-gray-50 p-2 rounded">
            <Skeleton width="60px" height="12px" className="mb-1" />
            <Skeleton width="40px" height="24px" />
          </div>
        ))}
      </div>

      {/* Speech Burst Count */}
      <div className="mb-3 p-2 bg-gray-50 rounded">
        <Skeleton width="60px" height="12px" className="mb-1" />
        <Skeleton width="40px" height="24px" />
      </div>

      {/* Summary */}
      <div className="pt-3 border-t border-gray-200">
        <Skeleton width="60px" height="12px" className="mb-1" />
        <Skeleton width="100%" height="16px" />
      </div>

      {/* Progress Bar */}
      <div className="mt-3">
        <Skeleton width="100%" height="8px" className="rounded-full" />
      </div>
    </div>
  );
}

/**
 * STTSubtitleSkeleton 컴포넌트
 *
 * STTSubtitle 컴포넌트의 로딩 스켈레톤입니다.
 */
export function STTSubtitleSkeleton() {
  return (
    <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2">
      <Skeleton
        width="200px"
        height="32px"
        className="rounded-lg bg-gray-700"
      />
    </div>
  );
}
