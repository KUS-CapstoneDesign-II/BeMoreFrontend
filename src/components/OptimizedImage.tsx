import { useEffect, useRef, useState } from 'react';
import type { ImgHTMLAttributes, ReactNode } from 'react';
import {
  detectImageFormats,
  generateResponsiveSrcsets,
  generateSrcset,
  supportsNativeLazyLoading,
  lazyLoadImage,
  handleImageError,
  logImagePerformance,
  ImageLoadingMetrics,
} from '../utils/imageOptimization';
import './OptimizedImage.css';

/**
 * OptimizedImage Props
 *
 * @property src - 이미지 기본 경로 (확장자 제외)
 *                 예: '/images/photo'
 * @property originalFormat - 원본 이미지 포맷 (기본값: 'jpg')
 * @property alt - 이미지 대체 텍스트
 * @property imageSizes - 반응형 이미지 크기 배열
 * @property fallbackSrc - 로딩 실패 시 폴백 이미지
 * @property lazy - lazy loading 활성화 여부
 * @property onImageLoad - 이미지 로드 완료 콜백
 */
interface OptimizedImageProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'src' | 'onLoad' | 'sizes'> {
  src: string;
  originalFormat?: string;
  alt: string;
  imageSizes?: number[];
  fallbackSrc?: string;
  lazy?: boolean;
  onImageLoad?: (metrics: { duration: number }) => void;
  children?: ReactNode;
}

/**
 * OptimizedImage Component
 *
 * WebP/AVIF 포맷 자동 감지 및 반응형 이미지 제공
 * - 브라우저 지원도에 따라 최적의 포맷 선택
 * - Responsive srcset 자동 생성
 * - Lazy loading 지원
 * - 이미지 로딩 성능 측정
 *
 * @example
 * ```tsx
 * // 기본 사용
 * <OptimizedImage
 *   src="/images/photo"
 *   alt="사진 설명"
 *   lazy
 * />
 *
 * // 커스텀 크기
 * <OptimizedImage
 *   src="/images/photo"
 *   alt="사진"
 *   originalFormat="png"
 *   sizes={[320, 640, 1024]}
 *   lazy
 *   onLoad={(metrics) => console.log(`로드 시간: ${metrics.duration}ms`)}
 * />
 * ```
 */
export function OptimizedImage({
  src,
  originalFormat = 'jpg',
  alt,
  imageSizes,
  fallbackSrc = '/images/placeholder.png',
  lazy = true,
  onImageLoad,
  className,
  ...imgProps
}: OptimizedImageProps) {
  const imgRef = useRef<HTMLImageElement>(null);
  const [formatSupport, setFormatSupport] = useState<{
    webp: boolean;
    avif: boolean;
  }>({
    webp: false,
    avif: false,
  });
  const [isLoading, setIsLoading] = useState(true);
  const metricsRef = useRef(new ImageLoadingMetrics());

  /**
   * 이미지 포맷 감지 및 srcset 설정
   */
  useEffect(() => {
    const initializeImage = async () => {
      // 포맷 지원도 감지
      const support = await detectImageFormats();
      setFormatSupport({
        webp: support.webp,
        avif: support.avif,
      });

      // Responsive srcset 생성
      const srcsets = generateResponsiveSrcsets(src, originalFormat, imageSizes || [320, 640, 1024, 1280]);

      if (imgRef.current) {
        metricsRef.current.startMeasure(src);

        // 지원하는 최적의 포맷으로 srcset 설정
        if (support.avif) {
          // AVIF가 최고의 압축률 제공
          if (supportsNativeLazyLoading() && lazy) {
            imgRef.current.loading = 'lazy';
          }
          imgRef.current.srcset = srcsets.avif;
        } else if (support.webp) {
          // WebP가 AVIF 다음으로 좋음
          if (supportsNativeLazyLoading() && lazy) {
            imgRef.current.loading = 'lazy';
          }
          imgRef.current.srcset = srcsets.webp;
        } else {
          // 원본 포맷 사용
          if (supportsNativeLazyLoading() && lazy) {
            imgRef.current.loading = 'lazy';
          }
          imgRef.current.srcset = srcsets.original;
        }

        // 폴백 이미지 설정
        if (fallbackSrc) {
          handleImageError(imgRef.current, fallbackSrc);
        }

        // 네이티브 lazy loading을 지원하지 않으면 Intersection Observer 사용
        if (lazy && !supportsNativeLazyLoading()) {
          const cleanup = lazyLoadImage(imgRef.current);
          return () => cleanup();
        }
      }
    };

    initializeImage();
  }, [src, originalFormat, imageSizes, fallbackSrc, lazy]);

  /**
   * 이미지 로드 완료 핸들러
   */
  const handleLoadComplete = () => {
    metricsRef.current.endMeasure();
    setIsLoading(false);

    // 성능 로깅
    const metrics = metricsRef.current.getMetrics();
    logImagePerformance(metrics.imageUrl, metrics.duration, originalFormat);

    // 콜백 실행
    if (onImageLoad) {
      onImageLoad({ duration: metrics.duration });
    }
  };

  return (
    <picture>
      {/* AVIF 포맷 (최고 효율) */}
      {formatSupport.avif && (
        <source
          srcSet={generateResponsiveSrcsets(src, originalFormat, imageSizes || [320, 640, 1024, 1280]).avif}
          type="image/avif"
        />
      )}

      {/* WebP 포맷 (좋은 효율) */}
      {formatSupport.webp && (
        <source
          srcSet={generateResponsiveSrcsets(src, originalFormat, imageSizes || [320, 640, 1024, 1280]).webp}
          type="image/webp"
        />
      )}

      {/* 폴백: 원본 포맷 */}
      <img
        ref={imgRef}
        src={src}
        alt={alt}
        className={`optimized-image ${isLoading ? 'loading' : 'loaded'} ${className || ''}`}
        onLoad={handleLoadComplete}
        {...imgProps}
      />
    </picture>
  );
}

/**
 * Simple Responsive Image Component
 *
 * 간단한 반응형 이미지 (WebP/AVIF 없이)
 */
interface ResponsiveImageProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'src' | 'sizes'> {
  src: string;
  alt: string;
  imageSizes?: number[];
}

export function ResponsiveImage({
  src,
  alt,
  imageSizes,
  className,
  ...imgProps
}: ResponsiveImageProps) {
  return (
    <img
      src={src}
      srcSet={generateSrcset(src, 'jpg', imageSizes || [320, 640, 1024, 1280])}
      alt={alt}
      className={`responsive-image ${className || ''}`}
      {...imgProps}
    />
  );
}

export default OptimizedImage;
