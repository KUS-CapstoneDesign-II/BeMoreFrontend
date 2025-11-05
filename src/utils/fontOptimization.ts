/**
 * Font Optimization Utilities
 *
 * 폰트 로딩 성능 최적화
 * - font-display: swap으로 FOUT 최소화
 * - 폴백 폰트 전략
 * - 폰트 로딩 성능 측정
 * - 시스템 폰트 사용 (preload 최소화)
 */

/**
 * 폰트 로딩 메트릭스
 */
export interface FontMetrics {
  fontName: string;
  startTime: number;
  loadTime: number;
  status: 'loading' | 'loaded' | 'failed';
}

/**
 * 폰트 로딩 성능 추적기
 */
export class FontLoadingTracker {
  private metrics: Map<string, FontMetrics> = new Map();

  /**
   * 폰트 로딩 시작
   */
  startTracking(fontName: string): void {
    this.metrics.set(fontName, {
      fontName,
      startTime: performance.now(),
      loadTime: 0,
      status: 'loading',
    });
  }

  /**
   * 폰트 로딩 완료 기록
   */
  recordLoad(fontName: string): void {
    const metric = this.metrics.get(fontName);
    if (metric) {
      metric.loadTime = performance.now() - metric.startTime;
      metric.status = 'loaded';
    }
  }

  /**
   * 폰트 로딩 실패 기록
   */
  recordError(fontName: string): void {
    const metric = this.metrics.get(fontName);
    if (metric) {
      metric.loadTime = performance.now() - metric.startTime;
      metric.status = 'failed';
    }
  }

  /**
   * 로딩 메트릭스 조회
   */
  getMetrics(fontName: string): FontMetrics | undefined {
    return this.metrics.get(fontName);
  }

  /**
   * 모든 메트릭스 조회
   */
  getAllMetrics(): FontMetrics[] {
    return Array.from(this.metrics.values());
  }

  /**
   * 평균 로딩 시간
   */
  getAverageLoadTime(): number {
    const loadedFonts = Array.from(this.metrics.values()).filter(
      (m) => m.status === 'loaded'
    );
    if (loadedFonts.length === 0) return 0;

    const total = loadedFonts.reduce((sum, m) => sum + m.loadTime, 0);
    return total / loadedFonts.length;
  }
}

export const fontLoadingTracker = new FontLoadingTracker();

/**
 * Google Fonts 최적화된 로딩 (font-display: swap)
 *
 * @param fontName - 폰트 이름 (예: 'Inter', 'Roboto')
 * @param weights - 필요한 폰트 가중치 (기본값: [400, 700])
 * @returns 최적화된 Google Fonts URL
 *
 * @example
 * ```typescript
 * const url = getGoogleFontsUrl('Inter', [400, 500, 600, 700]);
 * // Adds to document.head as <link>
 * ```
 */
export function getGoogleFontsUrl(fontName: string, weights: number[] = [400, 700]): string {
  const weightsQuery = weights.join(';');
  const encodedName = fontName.replace(/\s+/g, '+');

  return `https://fonts.googleapis.com/css2?family=${encodedName}:wght@${weightsQuery}&display=swap`;
}

/**
 * 시스템 폰트 스택 (성능 최적화)
 *
 * 웹 폰트 대신 시스템 폰트를 사용하여 로딩 시간 제거
 */
export const systemFontStack = {
  // UI 폰트 (깔끔하고 가독성 높음)
  ui: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',

  // 본문 폰트 (가독성 최적화)
  body: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Helvetica Neue", sans-serif',

  // 모노스페이스 폰트 (코드)
  mono: '"SF Mono", Monaco, "Cascadia Code", "Roboto Mono", Menlo, Courier, monospace',

  // 세리프 폰트 (문서)
  serif: 'Georgia, "Times New Roman", Times, serif',
};

/**
 * 최적화된 폰트 face 선언
 *
 * font-display: swap으로 FOUT 최소화
 * @param fontName - 폰트 이름
 * @param srcUrl - 폰트 파일 URL
 * @param weight - 폰트 가중치 (기본값: 400)
 * @param style - 폰트 스타일 (기본값: 'normal')
 * @returns CSS @font-face 규칙
 */
export function createOptimizedFontFace(
  fontName: string,
  srcUrl: string,
  weight: number = 400,
  style: string = 'normal'
): string {
  return `
    @font-face {
      font-family: '${fontName}';
      src: url('${srcUrl}') format('woff2');
      font-weight: ${weight};
      font-style: ${style};
      font-display: swap;
      margin-bottom: -10px;
    }
  `;
}

/**
 * 폰트 로딩 완료 감지
 *
 * @param fontName - 폰트 이름 (예: 'Inter')
 * @returns 로딩 완료 Promise
 *
 * @example
 * ```typescript
 * await waitForFontLoad('Inter');
 * // 폰트가 로드될 때까지 대기
 * ```
 */
export async function waitForFontLoad(fontName: string): Promise<void> {
  if (!('fonts' in document)) {
    // FontFaceSet API 미지원
    return;
  }

  try {
    fontLoadingTracker.startTracking(fontName);

    // @ts-expect-error - FontFaceSet API not fully typed
    await document.fonts.load(`1em '${fontName}'`);

    fontLoadingTracker.recordLoad(fontName);
  } catch (error) {
    fontLoadingTracker.recordError(fontName);
    console.warn(`Failed to load font: ${fontName}`, error);
  }
}

/**
 * 여러 폰트 동시 로드
 *
 * @param fontNames - 폰트 이름 배열
 * @returns 모든 폰트 로드 완료 Promise
 */
export async function waitForFontsLoad(fontNames: string[]): Promise<void[]> {
  return Promise.all(fontNames.map((name) => waitForFontLoad(name)));
}

/**
 * Google Fonts 링크 추가 (head에)
 *
 * @param fontName - 폰트 이름
 * @param weights - 폰트 가중치
 */
export function addGoogleFontsLink(
  fontName: string,
  weights: number[] = [400, 700]
): HTMLLinkElement {
  const url = getGoogleFontsUrl(fontName, weights);

  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = url;

  document.head.appendChild(link);

  fontLoadingTracker.startTracking(fontName);

  // 폰트 로드 완료 감지
  link.onload = () => {
    fontLoadingTracker.recordLoad(fontName);
    logFontPerformance(fontName, fontLoadingTracker.getMetrics(fontName));
  };

  link.onerror = () => {
    fontLoadingTracker.recordError(fontName);
    console.warn(`Failed to load font: ${fontName}`);
  };

  return link;
}

/**
 * 폰트 성능 로깅
 *
 * @param fontName - 폰트 이름
 * @param metrics - 폰트 메트릭스
 */
export function logFontPerformance(fontName: string, metrics?: FontMetrics): void {
  if (import.meta.env.DEV && metrics) {
    console.log(`📝 Font Performance: ${fontName}`, {
      status: metrics.status,
      loadTime: `${metrics.loadTime.toFixed(2)}ms`,
      timestamp: new Date(metrics.startTime).toISOString(),
    });
  }
}

/**
 * CSS 변수를 이용한 폰트 정의
 *
 * 런타임에 폰트 패밀리 변경 가능
 */
export const fontCSSVariables = `
  :root {
    /* UI Fonts */
    --font-ui: ${systemFontStack.ui};
    --font-body: ${systemFontStack.body};
    --font-mono: ${systemFontStack.mono};
    --font-serif: ${systemFontStack.serif};

    /* Font Sizes */
    --font-size-xs: 0.75rem;
    --font-size-sm: 0.875rem;
    --font-size-base: 1rem;
    --font-size-lg: 1.125rem;
    --font-size-xl: 1.25rem;
    --font-size-2xl: 1.5rem;
    --font-size-3xl: 1.875rem;
    --font-size-4xl: 2.25rem;

    /* Line Heights */
    --line-height-tight: 1.25;
    --line-height-snug: 1.375;
    --line-height-normal: 1.5;
    --line-height-relaxed: 1.625;
    --line-height-loose: 2;

    /* Font Weights */
    --font-weight-light: 300;
    --font-weight-normal: 400;
    --font-weight-medium: 500;
    --font-weight-semibold: 600;
    --font-weight-bold: 700;
    --font-weight-extrabold: 800;

    /* Letter Spacing */
    --letter-spacing-tighter: -0.05em;
    --letter-spacing-tight: -0.025em;
    --letter-spacing-normal: 0em;
    --letter-spacing-wide: 0.025em;
    --letter-spacing-wider: 0.05em;
  }
`;

/**
 * 폰트 최적화 설정
 */
export const fontOptimizationConfig = {
  // 우선 로드할 폰트
  priorityFonts: [],

  // 지연 로드 폰트
  deferredFonts: [],

  // 시스템 폰트 사용 (기본값: true)
  useSystemFonts: true,

  // 폰트 미리 로드
  preloadFonts: [] as string[],

  // 최대 로딩 대기 시간 (ms)
  maxWaitTime: 3000,
};

export default {
  FontLoadingTracker,
  fontLoadingTracker,
  getGoogleFontsUrl,
  systemFontStack,
  createOptimizedFontFace,
  waitForFontLoad,
  waitForFontsLoad,
  addGoogleFontsLink,
  logFontPerformance,
  fontCSSVariables,
  fontOptimizationConfig,
};
