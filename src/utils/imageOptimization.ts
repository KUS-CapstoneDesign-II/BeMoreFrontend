/**
 * Image Optimization Utilities
 *
 * 이미지 최적화 관련 유틸리티
 * - WebP/AVIF 포맷 지원 감지
 * - Responsive srcset 생성
 * - 이미지 로딩 성능 모니터링
 * - Lazy loading 최적화
 */

/**
 * 브라우저 이미지 포맷 지원 여부 감지
 */
export interface ImageFormatSupport {
  webp: boolean;
  avif: boolean;
  png: boolean;
}

let cachedFormatSupport: ImageFormatSupport | null = null;

/**
 * 브라우저가 지원하는 이미지 포맷 감지
 *
 * @returns 각 포맷 지원 여부
 *
 * @example
 * ```typescript
 * const support = detectImageFormats();
 * if (support.webp) {
 *   // WebP 포맷 사용 가능
 * }
 * ```
 */
export async function detectImageFormats(): Promise<ImageFormatSupport> {
  // 캐시 확인
  if (cachedFormatSupport) {
    return cachedFormatSupport;
  }

  const support: ImageFormatSupport = {
    webp: await supportsFormat('image/webp'),
    avif: await supportsFormat('image/avif'),
    png: true, // 모든 브라우저가 PNG 지원
  };

  cachedFormatSupport = support;
  return support;
}

/**
 * 특정 이미지 포맷 지원 여부 확인
 *
 * @param mimeType - MIME 타입 (예: 'image/webp')
 * @returns 지원 여부
 */
async function supportsFormat(mimeType: string): Promise<boolean> {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;

    try {
      const dataUrl = canvas.toDataURL(mimeType);
      // dataURL이 MIME 타입을 포함하면 지원함
      resolve(dataUrl.includes(mimeType));
    } catch {
      resolve(false);
    }
  });
}

/**
 * Responsive 이미지 srcset 생성
 *
 * @param basePath - 이미지 기본 경로 (예: '/images/photo')
 * @param extension - 파일 확장자 (예: 'jpg')
 * @param sizes - 생성할 이미지 크기 배열 (예: [320, 640, 1280])
 * @returns srcset 문자열
 *
 * @example
 * ```typescript
 * const srcset = generateSrcset('/images/photo', 'jpg', [320, 640, 1280]);
 * // Returns: '/images/photo-320.jpg 320w, /images/photo-640.jpg 640w, /images/photo-1280.jpg 1280w'
 * ```
 */
export function generateSrcset(
  basePath: string,
  extension: string,
  sizes: number[] = [320, 640, 1024, 1280]
): string {
  return sizes
    .sort((a, b) => a - b)
    .map((size) => `${basePath}-${size}.${extension} ${size}w`)
    .join(', ');
}

/**
 * WebP/AVIF srcset 생성 (폴백 지원)
 *
 * @param basePath - 이미지 기본 경로
 * @param extension - 원본 파일 확장자 (예: 'jpg')
 * @param sizes - 생성할 이미지 크기 배열
 * @returns WebP, AVIF, 원본 확장자의 srcset 객체
 *
 * @example
 * ```typescript
 * const srcsets = generateResponsiveSrcsets('/images/photo', 'jpg');
 * // Returns: {
 * //   avif: '/images/photo-320.avif 320w, ...',
 * //   webp: '/images/photo-320.webp 320w, ...',
 * //   original: '/images/photo-320.jpg 320w, ...'
 * // }
 * ```
 */
export function generateResponsiveSrcsets(
  basePath: string,
  extension: string,
  sizes: number[] = [320, 640, 1024, 1280]
) {
  return {
    avif: generateSrcset(basePath, 'avif', sizes),
    webp: generateSrcset(basePath, 'webp', sizes),
    original: generateSrcset(basePath, extension, sizes),
  };
}

/**
 * 이미지 로딩 성능 측정
 */
export class ImageLoadingMetrics {
  private startTime: number = 0;
  private endTime: number = 0;
  private imageUrl: string = '';

  /**
   * 이미지 로딩 시작 기록
   *
   * @param url - 이미지 URL
   */
  startMeasure(url: string): void {
    this.imageUrl = url;
    this.startTime = performance.now();
    this.endTime = this.startTime; // 초기화: 측정이 시작된 순간부터
  }

  /**
   * 이미지 로딩 완료 기록
   */
  endMeasure(): void {
    this.endTime = performance.now();
  }

  /**
   * 로딩 시간 (ms) 반환
   */
  getDuration(): number {
    // endTime이 설정되지 않았으면 0 반환
    return this.endTime >= this.startTime ? this.endTime - this.startTime : 0;
  }

  /**
   * 로딩 정보 반환
   */
  getMetrics() {
    return {
      imageUrl: this.imageUrl,
      duration: this.getDuration(),
      timestamp: this.startTime,
    };
  }
}

/**
 * 이미지 네이티브 lazy loading 여부 확인
 *
 * @returns 브라우저가 lazy loading 지원 여부
 */
export function supportsNativeLazyLoading(): boolean {
  return 'loading' in HTMLImageElement.prototype;
}

/**
 * 이미지 Intersection Observer를 이용한 lazy loading
 *
 * @param imageElement - 로드할 이미지 엘리먼트
 * @param options - Intersection Observer 옵션
 * @returns cleanup 함수
 *
 * @example
 * ```typescript
 * const img = document.querySelector('img');
 * const cleanup = lazyLoadImage(img, { threshold: 0.1 });
 * // 정리: cleanup();
 * ```
 */
export function lazyLoadImage(
  imageElement: HTMLImageElement,
  options?: IntersectionObserverInit
): () => void {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const img = entry.target as HTMLImageElement;

        // data-src에서 실제 src로 로드
        if (img.dataset.src) {
          img.src = img.dataset.src;
        }

        // srcset 로드
        if (img.dataset.srcset) {
          img.srcset = img.dataset.srcset;
        }

        // 로드 완료 후 옵저버 제거
        observer.unobserve(img);
        img.classList.add('loaded');
      }
    });
  }, {
    threshold: 0.1,
    rootMargin: '50px',
    ...options,
  });

  observer.observe(imageElement);

  // cleanup 함수 반환
  return () => {
    observer.unobserve(imageElement);
    observer.disconnect();
  };
}

/**
 * 여러 이미지에 lazy loading 적용
 *
 * @param selector - 이미지 선택자 (예: 'img[data-src]')
 * @param options - Intersection Observer 옵션
 * @returns cleanup 함수
 */
export function applyLazyLoadingToImages(
  selector: string = 'img[data-src]',
  options?: IntersectionObserverInit
): () => void {
  const images = document.querySelectorAll<HTMLImageElement>(selector);
  const cleanups: Array<() => void> = [];

  images.forEach((img) => {
    cleanups.push(lazyLoadImage(img, options));
  });

  // 모든 cleanup 함수를 호출하는 함수 반환
  return () => {
    cleanups.forEach((cleanup) => cleanup());
  };
}

/**
 * 이미지 로딩 에러 처리
 *
 * @param imageElement - 이미지 엘리먼트
 * @param fallbackSrc - 폴백 이미지 경로 (선택사항)
 * @param callback - 에러 처리 후 실행할 콜백 (선택사항)
 */
export function handleImageError(
  imageElement: HTMLImageElement,
  fallbackSrc?: string,
  callback?: () => void
): void {
  // 즉시 error 클래스 추가
  imageElement.classList.add('image-error');

  // fallbackSrc가 제공되면 설정
  if (fallbackSrc) {
    imageElement.src = fallbackSrc;
    console.warn(
      `Failed to load image: ${imageElement.src}, using fallback: ${fallbackSrc}`
    );
  }

  // 콜백 실행
  if (callback) {
    callback();
  }

  // onerror 핸들러도 설정 (자동 에러 처리)
  imageElement.onerror = () => {
    imageElement.classList.add('image-error');
    if (fallbackSrc) {
      imageElement.src = fallbackSrc;
      console.warn(`Failed to load image: ${imageElement.src}, using fallback: ${fallbackSrc}`);
    }
    if (callback) {
      callback();
    }
  };
}

/**
 * 이미지 미리 로드 (prefetch)
 *
 * @param urls - 미리 로드할 이미지 URL 배열
 */
export function prefetchImages(urls: string[]): void {
  urls.forEach((url) => {
    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.as = 'image';
    link.href = url;
    document.head.appendChild(link);
  });
}

/**
 * 이미지 성능 정보 로깅
 *
 * @param imageUrl - 이미지 URL
 * @param loadTime - 로딩 시간 (ms)
 * @param format - 이미지 포맷
 */
export function logImagePerformance(
  imageUrl: string,
  loadTime: number,
  format: string
): void {
  if (import.meta.env.DEV) {
    console.log(`📸 Image Performance: ${imageUrl}`, {
      format,
      loadTime: `${loadTime.toFixed(2)}ms`,
      timestamp: new Date().toISOString(),
    });
  }
}

/**
 * 이미지 최적화 설정
 */
export const imageOptimizationConfig = {
  // 기본 반응형 이미지 크기
  defaultSizes: [320, 640, 1024, 1280],

  // Lazy loading 기본 옵션
  lazyLoadingOptions: {
    threshold: 0.1,
    rootMargin: '50px',
  },

  // 이미지 포맷 우선순위
  formatPriority: ['avif', 'webp', 'png', 'jpg'],

  // 이미지 로딩 타임아웃 (ms)
  loadingTimeout: 10000,

  // 최대 이미지 크기 (bytes)
  maxImageSize: 5 * 1024 * 1024, // 5MB
};

export default {
  detectImageFormats,
  generateSrcset,
  generateResponsiveSrcsets,
  ImageLoadingMetrics,
  supportsNativeLazyLoading,
  lazyLoadImage,
  applyLazyLoadingToImages,
  handleImageError,
  prefetchImages,
  logImagePerformance,
  imageOptimizationConfig,
};
