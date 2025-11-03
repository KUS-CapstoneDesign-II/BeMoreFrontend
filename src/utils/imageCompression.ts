import { Logger } from '../config/env';

/**
 * 이미지 압축 유틸리티 (Phase 9-6)
 *
 * 목표: 네트워크 효율성 극대화
 * - 캔버스 이미지 압축 (JPEG/WebP)
 * - 품질/크기 균형 조정
 * - 메모리 효율성 극대화
 */

/**
 * 이미지 압축 옵션
 */
export interface ImageCompressionConfig {
  quality?: number; // 압축 품질 (0.0 - 1.0, 기본값: 0.7)
  format?: 'jpeg' | 'webp' | 'png'; // 압축 형식 (기본값: 'jpeg')
  maxWidth?: number; // 최대 너비 (기본값: 1280)
  maxHeight?: number; // 최대 높이 (기본값: 720)
}

/**
 * 이미지 압축 결과
 */
export interface CompressionResult {
  originalSize: number; // 원본 크기 (bytes)
  compressedSize: number; // 압축된 크기 (bytes)
  compressionRatio: number; // 압축률 (%)
  format: string; // 압축 형식
  quality: number; // 압축 품질
}

/**
 * 캔버스를 이미지 Blob으로 압축
 *
 * 예시:
 * ```
 * const canvas = document.getElementById('video-canvas') as HTMLCanvasElement;
 * const blob = await compressCanvasImage(canvas, {
 *   quality: 0.7,
 *   format: 'jpeg',
 *   maxWidth: 640,
 * });
 * ```
 */
export async function compressCanvasImage(
  canvas: HTMLCanvasElement,
  config: ImageCompressionConfig = {}
): Promise<Blob> {
  const {
    quality = 0.7,
    format = 'jpeg',
    maxWidth = 1280,
    maxHeight = 720,
  } = config;

  try {
    // 캔버스 크기 조정이 필요한 경우
    let sourceCanvas = canvas;
    if (canvas.width > maxWidth || canvas.height > maxHeight) {
      sourceCanvas = resizeCanvas(canvas, maxWidth, maxHeight);
    }

    // 압축 형식에 따라 Blob 생성
    const mimeType = getMimeType(format);
    const blob = await canvasToBlob(sourceCanvas, mimeType, quality);

    const result = await analyzeCompression(canvas, blob, format, quality);

    Logger.debug('📦 Image compressed', {
      format,
      quality,
      originalSize: result.originalSize,
      compressedSize: result.compressedSize,
      ratio: `${result.compressionRatio.toFixed(1)}%`,
    });

    return blob;
  } catch (error) {
    Logger.error('❌ Image compression failed', error);
    throw error;
  }
}

/**
 * 캔버스 리사이징
 *
 * 원본 비율을 유지하면서 최대 크기로 조정
 */
function resizeCanvas(
  source: HTMLCanvasElement,
  maxWidth: number,
  maxHeight: number
): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('Failed to get canvas context');
  }

  // 비율 계산
  let width = source.width;
  let height = source.height;
  const aspectRatio = width / height;

  if (width > maxWidth) {
    width = maxWidth;
    height = Math.round(width / aspectRatio);
  }

  if (height > maxHeight) {
    height = maxHeight;
    width = Math.round(height * aspectRatio);
  }

  canvas.width = width;
  canvas.height = height;

  ctx.drawImage(source, 0, 0, width, height);

  return canvas;
}

/**
 * MIME 타입 결정
 */
function getMimeType(format: string): string {
  switch (format) {
    case 'webp':
      return 'image/webp';
    case 'png':
      return 'image/png';
    case 'jpeg':
    default:
      return 'image/jpeg';
  }
}

/**
 * Canvas를 Blob으로 변환
 */
function canvasToBlob(
  canvas: HTMLCanvasElement,
  mimeType: string,
  quality: number
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Failed to convert canvas to blob'));
        }
      },
      mimeType,
      quality
    );
  });
}

/**
 * 압축 분석
 */
async function analyzeCompression(
  originalCanvas: HTMLCanvasElement,
  compressedBlob: Blob,
  format: string,
  quality: number
): Promise<CompressionResult> {
  // 원본 크기 추정 (RGB 24-bit)
  const originalSize = originalCanvas.width * originalCanvas.height * 3;
  const compressedSize = compressedBlob.size;
  const compressionRatio = (1 - compressedSize / originalSize) * 100;

  return {
    originalSize,
    compressedSize,
    compressionRatio: Math.max(0, compressionRatio),
    format,
    quality,
  };
}

/**
 * WebP 지원 여부 확인
 */
export async function supportsWebP(): Promise<boolean> {
  return new Promise((resolve) => {
    const webP = new Image();
    webP.onload = () => resolve(true);
    webP.onerror = () => resolve(false);
    webP.src =
      'data:image/webp;base64,UklGRjoIAABXRUJQVlA4IC4IAAAQAQUANQEQABQCCQAAIAAAAAAJAAAA/4QAAAA=';
  });
}

/**
 * 최적 압축 형식 선택
 *
 * WebP 지원 여부를 확인하여 최적의 형식 선택
 */
export async function selectOptimalFormat(): Promise<'webp' | 'jpeg'> {
  try {
    const supportWebP = await supportsWebP();
    return supportWebP ? 'webp' : 'jpeg';
  } catch {
    return 'jpeg';
  }
}

/**
 * 이미지 압축 통계
 */
export interface CompressionStats {
  totalImages: number; // 압축한 총 이미지
  totalOriginalSize: number; // 총 원본 크기
  totalCompressedSize: number; // 총 압축된 크기
  avgCompressionRatio: number; // 평균 압축률
  savedBytes: number; // 절약된 바이트
}

/**
 * 이미지 압축 통계 추적기
 */
export class CompressionTracker {
  private stats: CompressionResult[] = [];
  private maxHistorySize: number = 100;

  /**
   * 압축 결과 기록
   */
  record(result: CompressionResult): void {
    this.stats.push(result);
    if (this.stats.length > this.maxHistorySize) {
      this.stats.shift();
    }
  }

  /**
   * 통계 조회
   */
  getStats(): CompressionStats {
    const totalImages = this.stats.length;
    const totalOriginalSize = this.stats.reduce(
      (sum, s) => sum + s.originalSize,
      0
    );
    const totalCompressedSize = this.stats.reduce(
      (sum, s) => sum + s.compressedSize,
      0
    );
    const savedBytes = totalOriginalSize - totalCompressedSize;
    const avgCompressionRatio =
      this.stats.length > 0
        ? this.stats.reduce((sum, s) => sum + s.compressionRatio, 0) /
          this.stats.length
        : 0;

    return {
      totalImages,
      totalOriginalSize,
      totalCompressedSize,
      avgCompressionRatio: Math.round(avgCompressionRatio * 100) / 100,
      savedBytes: Math.max(0, savedBytes),
    };
  }

  /**
   * 통계 초기화
   */
  reset(): void {
    this.stats = [];
  }
}

/**
 * 싱글톤 압축 추적기
 */
export const compressionTracker = new CompressionTracker();
