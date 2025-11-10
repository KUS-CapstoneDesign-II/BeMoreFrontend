import { Logger } from '../config/env';
import { sessionAPI } from '../services/api';

/**
 * 배치 전송 매니저 (Phase 9-6)
 *
 * 목표: 네트워크 효율성 극대화
 * - 여러 개의 메트릭을 모았다가 한 번에 전송
 * - 전송 실패 시 자동 재시도
 * - 메모리 효율성을 위해 주기적으로 플러시
 */

/**
 * 배치 아이템 (타임라인 카드)
 */
export interface BatchItem {
  minuteIndex: number;
  facialScore: number;
  vadScore: number;
  textScore: number;
  combinedScore: number;
  keywords: string[];
  sentiment?: 'positive' | 'neutral' | 'negative';
  confidence: number;
  timestamp: Date;
  durationMs: number;
}

/**
 * 배치 전송 옵션
 */
export interface BatchManagerConfig {
  maxBatchSize?: number; // 배치 최대 크기 (기본값: 10)
  flushIntervalMs?: number; // 자동 플러시 간격 (기본값: 60000ms = 1분)
  enableAutoFlush?: boolean; // 자동 플러시 활성화 (기본값: true)
}

/**
 * 배치 전송 통계
 */
export interface BatchStats {
  totalItems: number; // 수집된 총 아이템
  totalBatches: number; // 전송한 총 배치
  failedBatches: number; // 실패한 배치
  pendingItems: number; // 대기 중인 아이템
  avgBatchSize: number; // 평균 배치 크기
  avgTransmissionTime: number; // 평균 전송 시간 (ms)
}

/**
 * 배치 매니저 클래스
 *
 * 예시:
 * ```
 * const batchMgr = new BatchManager(sessionId, { maxBatchSize: 5 });
 *
 * // 아이템 추가
 * batchMgr.addItem(timelineCard);
 *
 * // 자동 또는 수동 플러시
 * await batchMgr.flush(); // 즉시 전송
 *
 * // 통계 조회
 * const stats = batchMgr.getStats();
 * ```
 */
export class BatchManager {
  private sessionId: string;
  private maxBatchSize: number;
  private flushIntervalMs: number;
  private enableAutoFlush: boolean;
  private batch: BatchItem[] = [];
  private flushTimer: ReturnType<typeof setInterval> | null = null;
  private totalItems: number = 0;
  private totalBatches: number = 0;
  private failedBatches: number = 0;
  private transmissionTimes: number[] = [];
  private maxHistorySize: number = 100;
  private isFlashing: boolean = false;

  constructor(
    sessionId: string,
    config: BatchManagerConfig = {}
  ) {
    this.sessionId = sessionId;
    this.maxBatchSize = config.maxBatchSize || 10;
    this.flushIntervalMs = config.flushIntervalMs || 60000; // 1분
    this.enableAutoFlush = config.enableAutoFlush !== false;

    // 자동 플러시 시작
    if (this.enableAutoFlush) {
      this.startAutoFlush();
    }

    Logger.info('📦 Batch Manager initialized', {
      sessionId,
      maxBatchSize: this.maxBatchSize,
      flushIntervalMs: this.flushIntervalMs,
    });
  }

  /**
   * 아이템 추가
   */
  addItem(item: BatchItem): void {
    this.batch.push(item);
    this.totalItems++;

    // 배치가 가득 차면 즉시 플러시
    if (this.batch.length >= this.maxBatchSize) {
      this.flush().catch((error) => {
        Logger.error('❌ Auto-flush failed', error);
      });
    }
  }

  /**
   * 여러 아이템 추가
   */
  addItems(items: BatchItem[]): void {
    for (const item of items) {
      this.addItem(item);
    }
  }

  /**
   * 배치 전송 (플러시)
   */
  async flush(): Promise<{ success: boolean; count: number }> {
    // 이미 플러시 중이거나 아이템이 없으면 스킵
    if (this.isFlashing || this.batch.length === 0) {
      return { success: true, count: 0 };
    }

    this.isFlashing = true;

    try {
      const itemsToSend = [...this.batch];
      const startTime = performance.now();

      Logger.info(`📤 Flushing batch (${itemsToSend.length} items)`, {
        sessionId: this.sessionId,
      });

      // 배치 전송 API 호출
      const result = await sessionAPI.batchTick(
        this.sessionId,
        itemsToSend as unknown as import('../types/session').TimelineCard[]
      );

      const transmissionTime = performance.now() - startTime;
      this.transmissionTimes.push(transmissionTime);
      if (this.transmissionTimes.length > this.maxHistorySize) {
        this.transmissionTimes.shift();
      }

      // 전송 성공 시 배치 초기화
      this.batch = [];
      this.totalBatches++;

      Logger.info('✅ Batch sent successfully', {
        sessionId: this.sessionId,
        itemCount: result.count,
        timeMs: Math.round(transmissionTime),
      });

      return { success: true, count: result.count };
    } catch (error) {
      this.failedBatches++;
      const message = error instanceof Error ? error.message : String(error);

      Logger.error('❌ Batch transmission failed', {
        sessionId: this.sessionId,
        itemCount: this.batch.length,
        error: message,
      });

      return { success: false, count: this.batch.length };
    } finally {
      this.isFlashing = false;
    }
  }

  /**
   * 자동 플러시 시작
   */
  private startAutoFlush(): void {
    this.flushTimer = setInterval(async () => {
      if (this.batch.length > 0) {
        try {
          await this.flush();
        } catch (error) {
          Logger.error('❌ Auto-flush error', error);
        }
      }
    }, this.flushIntervalMs);
  }

  /**
   * 자동 플러시 중지
   */
  stopAutoFlush(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }
  }

  /**
   * 정리 (세션 종료 시 호출)
   */
  async cleanup(): Promise<void> {
    this.stopAutoFlush();

    // 남은 아이템 전송
    if (this.batch.length > 0) {
      Logger.info('🧹 Flushing remaining items on cleanup', {
        itemCount: this.batch.length,
      });
      await this.flush();
    }
  }

  /**
   * 통계 조회
   */
  getStats(): BatchStats {
    const avgBatchSize =
      this.totalBatches > 0
        ? (this.totalItems - this.batch.length) / this.totalBatches
        : 0;
    const avgTransmissionTime =
      this.transmissionTimes.length > 0
        ? this.transmissionTimes.reduce((a, b) => a + b, 0) /
          this.transmissionTimes.length
        : 0;

    return {
      totalItems: this.totalItems,
      totalBatches: this.totalBatches,
      failedBatches: this.failedBatches,
      pendingItems: this.batch.length,
      avgBatchSize: Math.round(avgBatchSize * 100) / 100,
      avgTransmissionTime: Math.round(avgTransmissionTime * 100) / 100,
    };
  }

  /**
   * 현재 배치 크기
   */
  getBatchSize(): number {
    return this.batch.length;
  }

  /**
   * 배치 비우기 (테스트용)
   */
  clear(): void {
    this.batch = [];
    Logger.debug('🧹 Batch cleared');
  }

  /**
   * 통계 초기화
   */
  resetStats(): void {
    this.totalItems = 0;
    this.totalBatches = 0;
    this.failedBatches = 0;
    this.transmissionTimes = [];
  }
}

/**
 * 배치 매니저 팩토리
 * 세션별 배치 매니저 생성 및 관리
 */
export class BatchManagerFactory {
  private managers = new Map<string, BatchManager>();

  /**
   * 배치 매니저 생성 또는 조회
   */
  getOrCreate(
    sessionId: string,
    config?: BatchManagerConfig
  ): BatchManager {
    if (!this.managers.has(sessionId)) {
      const manager = new BatchManager(sessionId, config);
      this.managers.set(sessionId, manager);
    }

    return this.managers.get(sessionId)!;
  }

  /**
   * 배치 매니저 삭제
   */
  async destroy(sessionId: string): Promise<void> {
    const manager = this.managers.get(sessionId);
    if (manager) {
      await manager.cleanup();
      this.managers.delete(sessionId);
    }
  }

  /**
   * 모든 배치 매니저 정리
   */
  async destroyAll(): Promise<void> {
    const promises = Array.from(this.managers.keys()).map((sessionId) =>
      this.destroy(sessionId)
    );
    await Promise.all(promises);
  }

  /**
   * 모든 매니저의 통계
   */
  getAllStats(): Record<string, BatchStats> {
    const stats: Record<string, BatchStats> = {};
    for (const [sessionId, manager] of this.managers) {
      stats[sessionId] = manager.getStats();
    }
    return stats;
  }
}

/**
 * 싱글톤 배치 매니저 팩토리
 */
export const batchManagerFactory = new BatchManagerFactory();
