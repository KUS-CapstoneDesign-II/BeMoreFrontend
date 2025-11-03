import { describe, it, expect, beforeEach } from 'vitest';
import {
  LRUCache,
  MemoryPool,
  MemoryTracker,
  PrivateDataStore,
  formatBytes,
} from '../memoryOptimization';

describe('LRUCache', () => {
  let cache: LRUCache<string, number>;

  beforeEach(() => {
    cache = new LRUCache<string, number>(3);
  });

  describe('get', () => {
    it('should return undefined for non-existent key', () => {
      expect(cache.get('non-existent')).toBeUndefined();
    });

    it('should return value for existing key', () => {
      cache.set('key1', 100);
      expect(cache.get('key1')).toBe(100);
    });

    it('should mark accessed key as recently used', () => {
      cache.set('key1', 100);
      cache.set('key2', 200);
      cache.set('key3', 300);
      cache.get('key1'); // Mark key1 as recent
      cache.set('key4', 400); // Should evict key2, not key1
      expect(cache.has('key1')).toBe(true);
      expect(cache.has('key2')).toBe(false);
    });
  });

  describe('set', () => {
    it('should add new key-value pair', () => {
      cache.set('key1', 100);
      expect(cache.get('key1')).toBe(100);
    });

    it('should update existing key-value pair', () => {
      cache.set('key1', 100);
      cache.set('key1', 200);
      expect(cache.get('key1')).toBe(200);
      expect(cache.size()).toBe(1);
    });

    it('should evict least recently used when max size exceeded', () => {
      cache.set('key1', 100);
      cache.set('key2', 200);
      cache.set('key3', 300);
      cache.set('key4', 400); // Should evict key1
      expect(cache.has('key1')).toBe(false);
      expect(cache.has('key4')).toBe(true);
      expect(cache.size()).toBe(3);
    });

    it('should handle updating key and maintaining max size', () => {
      cache.set('key1', 100);
      cache.set('key2', 200);
      cache.set('key3', 300);
      cache.set('key1', 150); // Update key1
      expect(cache.size()).toBe(3);
      expect(cache.get('key1')).toBe(150);
    });
  });

  describe('has', () => {
    it('should return false for non-existent key', () => {
      expect(cache.has('non-existent')).toBe(false);
    });

    it('should return true for existing key', () => {
      cache.set('key1', 100);
      expect(cache.has('key1')).toBe(true);
    });
  });

  describe('delete', () => {
    it('should remove key from cache', () => {
      cache.set('key1', 100);
      cache.delete('key1');
      expect(cache.has('key1')).toBe(false);
    });

    it('should return true when key exists', () => {
      cache.set('key1', 100);
      expect(cache.delete('key1')).toBe(true);
    });

    it('should return false when key does not exist', () => {
      expect(cache.delete('non-existent')).toBe(false);
    });
  });

  describe('clear', () => {
    it('should remove all entries', () => {
      cache.set('key1', 100);
      cache.set('key2', 200);
      cache.clear();
      expect(cache.size()).toBe(0);
      expect(cache.has('key1')).toBe(false);
    });
  });

  describe('size', () => {
    it('should return 0 for empty cache', () => {
      expect(cache.size()).toBe(0);
    });

    it('should return current number of entries', () => {
      cache.set('key1', 100);
      expect(cache.size()).toBe(1);
      cache.set('key2', 200);
      expect(cache.size()).toBe(2);
    });
  });

  describe('entries', () => {
    it('should return array of [key, value] pairs', () => {
      cache.set('key1', 100);
      cache.set('key2', 200);
      const entries = cache.entries();
      expect(entries.length).toBe(2);
      expect(entries).toContainEqual(['key1', 100]);
      expect(entries).toContainEqual(['key2', 200]);
    });

    it('should return empty array for empty cache', () => {
      expect(cache.entries()).toEqual([]);
    });
  });
});

describe('MemoryPool', () => {
  interface Point {
    x: number;
    y: number;
  }

  let pool: MemoryPool<Point>;

  beforeEach(() => {
    pool = new MemoryPool<Point>(() => ({ x: 0, y: 0 }), 3);
  });

  describe('constructor', () => {
    it('should create initial objects', () => {
      const stats = pool.getStats();
      expect(stats.available).toBeGreaterThan(0);
      expect(stats.created).toBeGreaterThan(0);
    });
  });

  describe('acquire', () => {
    it('should return object from pool', () => {
      const obj = pool.acquire();
      expect(obj).toBeDefined();
      expect(obj.x).toBe(0);
      expect(obj.y).toBe(0);
    });

    it('should reuse released objects', () => {
      const obj1 = pool.acquire();
      obj1.x = 10;
      obj1.y = 20;
      pool.release(obj1);
      const obj2 = pool.acquire();
      expect(obj2.x).toBe(10);
      expect(obj2.y).toBe(20);
    });

    it('should increment acquired count', () => {
      const stats1 = pool.getStats();
      pool.acquire();
      const stats2 = pool.getStats();
      expect(stats2.acquired).toBeGreaterThan(stats1.acquired);
    });
  });

  describe('release', () => {
    it('should add object back to available pool', () => {
      const obj = pool.acquire();
      const statsBefore = pool.getStats();
      pool.release(obj);
      const statsAfter = pool.getStats();
      expect(statsAfter.available).toBeGreaterThan(statsBefore.available);
    });

    it('should not exceed max pool size', () => {
      const obj1 = pool.acquire();
      const obj2 = pool.acquire();
      pool.release(obj1);
      pool.release(obj2);
      pool.release({ x: 100, y: 200 }); // Extra object
      const stats = pool.getStats();
      expect(stats.available).toBeLessThanOrEqual(3);
    });
  });

  describe('getStats', () => {
    it('should return pool statistics', () => {
      const stats = pool.getStats();
      expect(stats.available).toBeGreaterThanOrEqual(0);
      expect(stats.created).toBeGreaterThanOrEqual(0);
      expect(stats.acquired).toBeGreaterThanOrEqual(0);
      expect(stats.maxSize).toBe(3);
    });
  });

  describe('clear', () => {
    it('should reset pool state', () => {
      pool.acquire();
      pool.acquire();
      pool.clear();
      const stats = pool.getStats();
      expect(stats.available).toBe(0);
      expect(stats.created).toBe(0);
      expect(stats.acquired).toBe(0);
    });
  });
});

describe('MemoryTracker', () => {
  let tracker: MemoryTracker;

  beforeEach(() => {
    tracker = new MemoryTracker();
  });

  describe('snapshot', () => {
    it('should record memory snapshot', () => {
      tracker.snapshot();
      const snapshots = tracker.getSnapshots();
      expect(snapshots.length).toBe(1);
    });

    it('should maintain max history size', () => {
      for (let i = 0; i < 70; i++) {
        tracker.snapshot();
      }
      const snapshots = tracker.getSnapshots();
      expect(snapshots.length).toBeLessThanOrEqual(60);
    });

    it('should record timestamp', () => {
      const before = Date.now();
      tracker.snapshot();
      const after = Date.now();
      const snapshots = tracker.getSnapshots();
      expect(snapshots[0].timestamp).toBeGreaterThanOrEqual(before);
      expect(snapshots[0].timestamp).toBeLessThanOrEqual(after);
    });
  });

  describe('analyze', () => {
    it('should return analysis for empty snapshots', () => {
      const analysis = tracker.analyze();
      expect(analysis.minUsedHeap).toBe(0);
      expect(analysis.maxUsedHeap).toBe(0);
      expect(analysis.avgUsedHeap).toBe(0);
      expect(analysis.isHealthy).toBe(true);
    });

    it('should calculate statistics correctly', () => {
      tracker.snapshot();
      tracker.snapshot();
      tracker.snapshot();
      const analysis = tracker.analyze();
      expect(analysis.minUsedHeap).toBeGreaterThanOrEqual(0);
      expect(analysis.maxUsedHeap).toBeGreaterThanOrEqual(analysis.minUsedHeap);
      expect(analysis.avgUsedHeap).toBeGreaterThanOrEqual(0);
    });

    it('should detect memory health', () => {
      tracker.snapshot();
      const analysis = tracker.analyze();
      expect(typeof analysis.isHealthy).toBe('boolean');
    });
  });

  describe('reset', () => {
    it('should clear all snapshots', () => {
      tracker.snapshot();
      tracker.snapshot();
      tracker.reset();
      expect(tracker.getSnapshots().length).toBe(0);
    });
  });

  describe('getSnapshots', () => {
    it('should return copy of snapshots array', () => {
      tracker.snapshot();
      const snapshots1 = tracker.getSnapshots();
      const snapshots2 = tracker.getSnapshots();
      expect(snapshots1).not.toBe(snapshots2);
      expect(snapshots1).toEqual(snapshots2);
    });
  });
});

describe('PrivateDataStore', () => {
  interface TestObject {
    id: string;
  }

  interface PrivateData {
    secret: string;
    value: number;
  }

  let store: PrivateDataStore<TestObject, PrivateData>;
  let obj: TestObject;

  beforeEach(() => {
    store = new PrivateDataStore<TestObject, PrivateData>();
    obj = { id: 'test-1' };
  });

  describe('set and get', () => {
    it('should store and retrieve private data', () => {
      const data: PrivateData = { secret: 'secret-value', value: 42 };
      store.set(obj, data);
      expect(store.get(obj)).toEqual(data);
    });

    it('should return undefined for object without data', () => {
      const otherObj = { id: 'test-2' };
      expect(store.get(otherObj)).toBeUndefined();
    });

    it('should update existing data', () => {
      const data1: PrivateData = { secret: 'value1', value: 1 };
      const data2: PrivateData = { secret: 'value2', value: 2 };
      store.set(obj, data1);
      store.set(obj, data2);
      expect(store.get(obj)).toEqual(data2);
    });
  });

  describe('has', () => {
    it('should return true if data exists', () => {
      const data: PrivateData = { secret: 'test', value: 1 };
      store.set(obj, data);
      expect(store.has(obj)).toBe(true);
    });

    it('should return false if no data', () => {
      expect(store.has(obj)).toBe(false);
    });
  });

  describe('delete', () => {
    it('should remove stored data', () => {
      const data: PrivateData = { secret: 'test', value: 1 };
      store.set(obj, data);
      store.delete(obj);
      expect(store.get(obj)).toBeUndefined();
    });

    it('should return true when data exists', () => {
      const data: PrivateData = { secret: 'test', value: 1 };
      store.set(obj, data);
      expect(store.delete(obj)).toBe(true);
    });

    it('should return false when no data', () => {
      expect(store.delete(obj)).toBe(false);
    });
  });
});

describe('formatBytes', () => {
  it('should format 0 bytes', () => {
    expect(formatBytes(0)).toBe('0 Bytes');
  });

  it('should format bytes', () => {
    expect(formatBytes(1024)).toBe('1 KB');
  });

  it('should format kilobytes', () => {
    expect(formatBytes(1024 * 100)).toBe('100 KB');
  });

  it('should format megabytes', () => {
    expect(formatBytes(1024 * 1024)).toBe('1 MB');
  });

  it('should format gigabytes', () => {
    expect(formatBytes(1024 * 1024 * 1024)).toBe('1 GB');
  });

  it('should support custom decimal places', () => {
    const result = formatBytes(1536, 1);
    expect(result).toContain('1.5');
  });

  it('should handle large numbers', () => {
    const result = formatBytes(1024 * 1024 * 1024 * 5);
    expect(result).toContain('GB');
  });
});
