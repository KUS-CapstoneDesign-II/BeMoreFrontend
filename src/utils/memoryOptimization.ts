import { Logger } from '../config/env';

/**
 * 메모리 최적화 유틸리티 (Phase 9-6)
 *
 * 목표: 메모리 효율성 극대화
 * - 캐시 관리 (LRU Cache)
 * - 메모리 누수 방지
 * - 대용량 데이터 처리
 */

/**
 * LRU (Least Recently Used) 캐시
 *
 * 자주 사용되는 데이터를 메모리에 유지하면서
 * 크기 제한을 초과하면 가장 오래된 항목 제거
 */
export class LRUCache<K, V> {
  private maxSize: number;
  private cache = new Map<K, V>();
  private accessOrder: K[] = [];

  constructor(maxSize: number = 100) {
    this.maxSize = maxSize;
  }

  /**
   * 값 조회
   */
  get(key: K): V | undefined {
    if (!this.cache.has(key)) {
      return undefined;
    }

    // 접근 순서 업데이트 (최근 사용으로 이동)
    this.accessOrder = this.accessOrder.filter((k) => k !== key);
    this.accessOrder.push(key);

    return this.cache.get(key);
  }

  /**
   * 값 설정
   */
  set(key: K, value: V): void {
    // 이미 존재하면 업데이트
    if (this.cache.has(key)) {
      this.accessOrder = this.accessOrder.filter((k) => k !== key);
    }

    // 새 항목 추가
    this.cache.set(key, value);
    this.accessOrder.push(key);

    // 크기 제한 초과 시 가장 오래된 항목 제거
    if (this.cache.size > this.maxSize) {
      const oldestKey = this.accessOrder.shift();
      if (oldestKey !== undefined) {
        this.cache.delete(oldestKey);
      }
    }
  }

  /**
   * 값 존재 여부
   */
  has(key: K): boolean {
    return this.cache.has(key);
  }

  /**
   * 값 삭제
   */
  delete(key: K): boolean {
    this.accessOrder = this.accessOrder.filter((k) => k !== key);
    return this.cache.delete(key);
  }

  /**
   * 캐시 초기화
   */
  clear(): void {
    this.cache.clear();
    this.accessOrder = [];
  }

  /**
   * 캐시 크기
   */
  size(): number {
    return this.cache.size;
  }

  /**
   * 모든 항목 조회
   */
  entries(): Array<[K, V]> {
    return Array.from(this.cache.entries());
  }
}

/**
 * 메모리 풀 (Object Pool)
 *
 * 자주 생성/삭제되는 객체를 재사용하여 메모리 할당/해제 오버헤드 감소
 *
 * 예시:
 * ```
 * const pool = new MemoryPool(
 *   () => ({ x: 0, y: 0 }),
 *   100
 * );
 *
 * const point = pool.acquire();
 * point.x = 10;
 * point.y = 20;
 * // 사용...
 * pool.release(point);
 * ```
 */
export class MemoryPool<T> {
  private factory: () => T;
  private available: T[] = [];
  private maxSize: number;
  private createdCount: number = 0;
  private acquiredCount: number = 0;

  constructor(
    factory: () => T,
    maxSize: number = 50
  ) {
    this.factory = factory;
    this.maxSize = maxSize;

    // 초기 객체 생성
    for (let i = 0; i < Math.min(10, maxSize); i++) {
      this.available.push(factory());
    }
    this.createdCount = Math.min(10, maxSize);
  }

  /**
   * 객체 획득
   */
  acquire(): T {
    let obj: T;

    if (this.available.length > 0) {
      obj = this.available.pop()!;
    } else if (this.createdCount < this.maxSize) {
      obj = this.factory();
      this.createdCount++;
    } else {
      // 풀이 가득 찬 경우 새 객체 생성 (경고)
      Logger.warn('⚠️ Memory pool exhausted, creating new object', {
        poolSize: this.maxSize,
        createdCount: this.createdCount,
      });
      obj = this.factory();
    }

    this.acquiredCount++;
    return obj;
  }

  /**
   * 객체 반환
   */
  release(obj: T): void {
    if (this.available.length < this.maxSize) {
      this.available.push(obj);
    }
  }

  /**
   * 풀 통계
   */
  getStats(): {
    available: number;
    created: number;
    acquired: number;
    maxSize: number;
  } {
    return {
      available: this.available.length,
      created: this.createdCount,
      acquired: this.acquiredCount,
      maxSize: this.maxSize,
    };
  }

  /**
   * 풀 초기화
   */
  clear(): void {
    this.available = [];
    this.createdCount = 0;
    this.acquiredCount = 0;
  }
}

/**
 * 메모리 사용량 추적기
 */
export class MemoryTracker {
  private snapshots: MemorySnapshot[] = [];
  private maxHistorySize: number = 60; // 최근 60개 스냅샷만 유지

  /**
   * 메모리 스냅샷 기록
   */
  snapshot(): void {
    const memoryStats = this.captureMemoryStats();
    this.snapshots.push({
      timestamp: Date.now(),
      ...memoryStats,
    });

    // 히스토리 크기 제한
    if (this.snapshots.length > this.maxHistorySize) {
      this.snapshots.shift();
    }
  }

  /**
   * 메모리 통계 캡처
   */
  private captureMemoryStats(): {
    usedJSHeapSize: number;
    totalJSHeapSize: number;
    jsHeapSizeLimit: number;
  } {
    if (
      (performance as any).memory &&
      typeof (performance as any).memory === 'object' &&
      'usedJSHeapSize' in (performance as any).memory
    ) {
      return {
        usedJSHeapSize: (performance as any).memory.usedJSHeapSize,
        totalJSHeapSize: (performance as any).memory.totalJSHeapSize,
        jsHeapSizeLimit: (performance as any).memory.jsHeapSizeLimit,
      };
    }

    return {
      usedJSHeapSize: 0,
      totalJSHeapSize: 0,
      jsHeapSizeLimit: 0,
    };
  }

  /**
   * 메모리 사용량 분석
   */
  analyze(): MemoryAnalysis {
    if (this.snapshots.length === 0) {
      return {
        minUsedHeap: 0,
        maxUsedHeap: 0,
        avgUsedHeap: 0,
        currentUsedHeap: 0,
        memoryGrowth: 0,
        isHealthy: true,
      };
    }

    const usedHeaps = this.snapshots.map((s) => s.usedJSHeapSize);
    const minUsedHeap = Math.min(...usedHeaps);
    const maxUsedHeap = Math.max(...usedHeaps);
    const avgUsedHeap =
      usedHeaps.reduce((a, b) => a + b, 0) / usedHeaps.length;
    const currentUsedHeap = usedHeaps[usedHeaps.length - 1];

    const memoryGrowth =
      this.snapshots.length > 1
        ? currentUsedHeap - this.snapshots[0].usedJSHeapSize
        : 0;

    // 메모리 누수 감지: 지속적인 증가
    const recentGrowth =
      this.snapshots.length > 10
        ? currentUsedHeap - this.snapshots[this.snapshots.length - 10].usedJSHeapSize
        : 0;

    const isHealthy = recentGrowth < 5_000_000; // 5MB 미만 증가는 정상

    return {
      minUsedHeap,
      maxUsedHeap,
      avgUsedHeap,
      currentUsedHeap,
      memoryGrowth,
      isHealthy,
    };
  }

  /**
   * 추적 초기화
   */
  reset(): void {
    this.snapshots = [];
  }

  /**
   * 모든 스냅샷 조회
   */
  getSnapshots(): MemorySnapshot[] {
    return [...this.snapshots];
  }
}

/**
 * 메모리 스냅샷
 */
interface MemorySnapshot {
  timestamp: number;
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
}

/**
 * 메모리 분석 결과
 */
interface MemoryAnalysis {
  minUsedHeap: number; // 최소 사용 힙
  maxUsedHeap: number; // 최대 사용 힙
  avgUsedHeap: number; // 평균 사용 힙
  currentUsedHeap: number; // 현재 사용 힙
  memoryGrowth: number; // 메모리 증가량
  isHealthy: boolean; // 메모리 상태 정상 여부
}

/**
 * 싱글톤 메모리 추적기
 */
export const memoryTracker = new MemoryTracker();

/**
 * 바이트 단위 변환 함수
 */
export function formatBytes(bytes: number, decimals: number = 2): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

/**
 * WeakMap을 사용한 프라이빗 데이터 저장소
 *
 * 가비지 컬렉션을 방해하지 않으면서 프라이빗 데이터 저장
 */
export class PrivateDataStore<T extends object, D> {
  private data = new WeakMap<T, D>();

  /**
   * 데이터 설정
   */
  set(obj: T, data: D): void {
    this.data.set(obj, data);
  }

  /**
   * 데이터 조회
   */
  get(obj: T): D | undefined {
    return this.data.get(obj);
  }

  /**
   * 데이터 존재 여부
   */
  has(obj: T): boolean {
    return this.data.has(obj);
  }

  /**
   * 데이터 삭제
   */
  delete(obj: T): boolean {
    return this.data.delete(obj);
  }
}
