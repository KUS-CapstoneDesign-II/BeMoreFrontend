/**
 * 프레임 샘플링 유틸리티 (Phase 9-6)
 *
 * 목표: 높은 프레임 레이트에서 필요한 프레임만 샘플링하여 성능 최적화
 * - 카메라/비디오 프레임 처리: 15fps → 5fps로 감소
 * - 메트릭 수집: 매초 → 필요할 때만
 * - 렌더링: 필요한 경우만 업데이트
 */

/**
 * 프레임 샘플러 설정
 */
export interface FrameSamplerConfig {
  targetFps?: number; // 목표 FPS (기본값: 5)
  maxFps?: number; // 최대 허용 FPS (기본값: 30)
}

/**
 * 프레임 샘플링 통계
 */
export interface FrameStats {
  totalFrames: number; // 처리된 총 프레임
  sampledFrames: number; // 샘플링된 프레임
  droppedFrames: number; // 제외된 프레임
  samplingRate: number; // 샘플링 비율 (%)
  avgFrameTime: number; // 평균 프레임 처리 시간 (ms)
}

/**
 * 프레임 샘플러 클래스
 *
 * 예시:
 * ```
 * const sampler = new FrameSampler({ targetFps: 5 });
 *
 * function onCameraFrame(frame) {
 *   if (sampler.shouldProcess()) {
 *     // 프레임 처리 (메트릭 수집, 분석 등)
 *     processFrame(frame);
 *     sampler.recordProcessing(processingTimeMs);
 *   }
 * }
 * ```
 */
export class FrameSampler {
  private targetFps: number;
  private frameInterval: number; // ms between frames
  private lastProcessTime: number = 0;
  private totalFrames: number = 0;
  private sampledFrames: number = 0;
  private frameTimes: number[] = [];
  private maxHistorySize: number = 100;

  constructor(config: FrameSamplerConfig = {}) {
    this.targetFps = config.targetFps || 5;

    // 프레임 간격 계산 (ms)
    // targetFps: 5 → frameInterval: 200ms
    // targetFps: 10 → frameInterval: 100ms
    this.frameInterval = 1000 / this.targetFps;
  }

  /**
   * 프레임을 처리해야 하는지 판별
   */
  shouldProcess(): boolean {
    const now = performance.now();
    const timeSinceLastProcess = now - this.lastProcessTime;

    // 충분한 시간이 경과했는지 확인
    if (timeSinceLastProcess >= this.frameInterval) {
      this.totalFrames++;
      return true;
    }

    this.totalFrames++;
    return false;
  }

  /**
   * 프레임 처리 완료 기록
   */
  recordProcessing(processingTimeMs: number): void {
    this.lastProcessTime = performance.now();
    this.sampledFrames++;

    // 처리 시간 기록 (최근 100개만 유지)
    this.frameTimes.push(processingTimeMs);
    if (this.frameTimes.length > this.maxHistorySize) {
      this.frameTimes.shift();
    }
  }

  /**
   * 통계 조회
   */
  getStats(): FrameStats {
    const droppedFrames = this.totalFrames - this.sampledFrames;
    const samplingRate =
      this.totalFrames > 0
        ? (this.sampledFrames / this.totalFrames) * 100
        : 0;
    const avgFrameTime =
      this.frameTimes.length > 0
        ? this.frameTimes.reduce((a, b) => a + b, 0) / this.frameTimes.length
        : 0;

    return {
      totalFrames: this.totalFrames,
      sampledFrames: this.sampledFrames,
      droppedFrames,
      samplingRate: Math.round(samplingRate * 100) / 100,
      avgFrameTime: Math.round(avgFrameTime * 100) / 100,
    };
  }

  /**
   * 통계 초기화
   */
  reset(): void {
    this.lastProcessTime = 0;
    this.totalFrames = 0;
    this.sampledFrames = 0;
    this.frameTimes = [];
  }
}

/**
 * 적응형 프레임 샘플러
 *
 * 네트워크 상태나 CPU 부하에 따라 자동으로 프레임 레이트 조정
 */
export class AdaptiveFrameSampler extends FrameSampler {
  private cpuLoadThreshold: number = 80; // CPU 부하 임계값 (%)
  private networkLatencyThreshold: number = 500; // 네트워크 지연 임계값 (ms)
  private minFps: number = 2; // 최소 FPS
  private maxFps: number = 15; // 최대 FPS
  private currentFps: number;

  constructor(initialFps: number = 5) {
    super({ targetFps: initialFps });
    this.currentFps = initialFps;
  }

  /**
   * CPU 부하에 따라 FPS 조정
   */
  adjustByResourceUsage(
    cpuLoad: number,
    networkLatency: number
  ): { fpsAdjusted: boolean; newFps: number } {
    const oldFps = this.currentFps;

    // CPU 부하가 높으면 FPS 감소
    if (cpuLoad > this.cpuLoadThreshold) {
      this.currentFps = Math.max(this.minFps, this.currentFps - 1);
    }
    // 네트워크 지연이 크면 FPS 감소
    else if (networkLatency > this.networkLatencyThreshold) {
      this.currentFps = Math.max(this.minFps, this.currentFps - 1);
    }
    // 리소스 여유가 있으면 FPS 증가
    else if (cpuLoad < 50 && networkLatency < 200) {
      this.currentFps = Math.min(this.maxFps, this.currentFps + 1);
    }

    const fpsAdjusted = oldFps !== this.currentFps;

    if (fpsAdjusted) {
      // 새로운 설정으로 샘플러 재초기화
      const newSampler = new FrameSampler({ targetFps: this.currentFps });
      Object.assign(this, newSampler);
    }

    return {
      fpsAdjusted,
      newFps: this.currentFps,
    };
  }

  /**
   * 현재 FPS 조회
   */
  getCurrentFps(): number {
    return this.currentFps;
  }
}

/**
 * 싱글톤 프레임 샘플러 인스턴스
 * 카메라 프레임 처리용 (기본 5fps)
 */
export const cameraSampler = new AdaptiveFrameSampler(5);

/**
 * 싱글톤 프레임 샘플러 인스턴스
 * 메트릭 수집용 (기본 1fps → 1초마다)
 */
export const metricsSampler = new AdaptiveFrameSampler(1);
