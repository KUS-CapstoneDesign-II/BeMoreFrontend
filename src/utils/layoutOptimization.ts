/**
 * Layout Shift 방지 최적화
 *
 * CLS (Cumulative Layout Shift) 개선을 위한 유틸리티
 * - 이미지 dimensions 자동 설정
 * - 광고/플레이스홀더 공간 예약
 * - 폰트 로딩 최적화
 */

// 이미지 dimension 스타일 생성
export function getImageDimensions(width: number, height: number): React.CSSProperties {
  const aspectRatio = width / height;

  return {
    aspectRatio: `${aspectRatio}`,
    width: '100%',
    height: 'auto',
    display: 'block'
  };
}

// 반응형 이미지 컨테이너 스타일
export function getImageContainerStyles(width: number, height: number) {
  const aspectRatio = (height / width) * 100;

  return {
    container: {
      position: 'relative' as const,
      width: '100%',
      paddingBottom: `${aspectRatio}%`,
      backgroundColor: '#f3f4f6',
      borderRadius: '0.5rem',
      overflow: 'hidden'
    },
    image: {
      position: 'absolute' as const,
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      objectFit: 'cover' as const
    }
  };
}

// 비디오 요소 aspect ratio 스타일
export function getVideoContainerStyles(width: number, height: number) {
  const aspectRatio = (height / width) * 100;

  return {
    position: 'relative' as const,
    width: '100%',
    paddingBottom: `${aspectRatio}%`,
    backgroundColor: '#000'
  };
}

// 스켈레톤 로더를 위한 공간 예약
export function getSkeletonSpace(width: number, height: number): React.CSSProperties {
  return {
    width: '100%',
    maxWidth: `${width}px`,
    aspectRatio: `${width} / ${height}`,
    backgroundColor: '#e5e7eb',
    borderRadius: '0.5rem',
    animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
  };
}

// 텍스트 공간 예약
export function getTextSpace(fontSize: string, lineHeight: number = 1.5): React.CSSProperties {
  return {
    fontSize,
    lineHeight,
    minHeight: `calc(${lineHeight} * 1em)`,
    display: 'block'
  };
}

// 광고/플레이스홀더 공간 예약
export function getAdSpace(width: number, height: number): React.CSSProperties {
  return {
    width: `${width}px`,
    height: `${height}px`,
    backgroundColor: '#f3f4f6',
    borderRadius: '0.375rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#9ca3af',
    fontSize: '0.875rem'
  };
}

// 컨테이너 공간 예약
export function getReservedSpace(width: string | number, height: string | number): React.CSSProperties {
  return {
    width: typeof width === 'number' ? `${width}px` : width,
    height: typeof height === 'number' ? `${height}px` : height,
    backgroundColor: '#f3f4f6',
    borderRadius: '0.375rem'
  };
}

// 입력 필드 높이 안정화
export function getStableInputHeight(height: string): React.CSSProperties {
  return {
    height,
    minHeight: height,
    boxSizing: 'border-box',
    display: 'block'
  };
}

// 버튼 높이 안정화
export function getStableButtonHeight(height: string): React.CSSProperties {
  return {
    height,
    minHeight: height,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxSizing: 'border-box'
  };
}

// 모달/다이얼로그 스크롤 방지
export function preventLayoutShift(): void {
  const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;

  document.documentElement.style.overflow = 'hidden';
  document.documentElement.style.paddingRight = `${scrollbarWidth}px`;
}

export function restoreLayoutShift(): void {
  document.documentElement.style.overflow = '';
  document.documentElement.style.paddingRight = '';
}

// Critical CSS 추가
export function addCriticalStyles(css: string): void {
  const style = document.createElement('style');
  style.type = 'text/css';
  style.textContent = css;
  document.head.appendChild(style);
}

// 성능 모니터링 마커
export function markPerformance(name: string): void {
  if ('performance' in window && 'mark' in performance) {
    performance.mark(name);
  }
}

export function measurePerformance(startMark: string, endMark: string): number {
  if ('performance' in window && 'measure' in performance) {
    try {
      performance.measure(endMark, startMark);
      const measure = performance.getEntriesByName(endMark)[0] as PerformanceMeasure;
      return measure.duration;
    } catch {
      return 0;
    }
  }
  return 0;
}

export default {
  getImageDimensions,
  getImageContainerStyles,
  getVideoContainerStyles,
  getSkeletonSpace,
  getTextSpace,
  getAdSpace,
  getReservedSpace,
  getStableInputHeight,
  getStableButtonHeight,
  preventLayoutShift,
  restoreLayoutShift,
  addCriticalStyles,
  markPerformance,
  measurePerformance
};
