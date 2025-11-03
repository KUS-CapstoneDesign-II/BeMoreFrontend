import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { BatchManager, BatchManagerFactory, BatchItem } from '../batchManager';

// Mock the API
vi.mock('../../services/api', () => ({
  sessionAPI: {
    batchTick: vi.fn().mockResolvedValue({ count: 1 }),
  },
}));

describe('BatchManager', () => {
  let manager: BatchManager;
  const sessionId = 'test-session-123';

  const createMockBatchItem = (index: number): BatchItem => ({
    minuteIndex: index,
    facialScore: 0.5 + index * 0.05,
    vadScore: 0.6 + index * 0.05,
    textScore: 0.7 + index * 0.05,
    combinedScore: 0.65 + index * 0.05,
    keywords: [`keyword_${index}`],
    sentiment: 'neutral',
    confidence: 0.9,
    timestamp: new Date(),
    durationMs: 1000,
  });

  beforeEach(() => {
    manager = new BatchManager(sessionId, { maxBatchSize: 5, flushIntervalMs: 1000 });
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    manager.stopAutoFlush();
  });

  describe('constructor', () => {
    it('should initialize with default config', () => {
      const m = new BatchManager(sessionId);
      expect(m.getBatchSize()).toBe(0);
    });

    it('should initialize with custom config', () => {
      const m = new BatchManager(sessionId, { maxBatchSize: 10, flushIntervalMs: 2000 });
      expect(m.getBatchSize()).toBe(0);
    });

    it('should start auto-flush by default', () => {
      const m = new BatchManager(sessionId, { enableAutoFlush: true });
      expect(m.getBatchSize()).toBe(0);
      m.stopAutoFlush();
    });

    it('should not start auto-flush when disabled', () => {
      const m = new BatchManager(sessionId, { enableAutoFlush: false });
      expect(m.getBatchSize()).toBe(0);
    });
  });

  describe('addItem', () => {
    it('should add item to batch', () => {
      const item = createMockBatchItem(0);
      manager.addItem(item);
      expect(manager.getBatchSize()).toBe(1);
    });

    it('should add multiple items', () => {
      for (let i = 0; i < 3; i++) {
        manager.addItem(createMockBatchItem(i));
      }
      expect(manager.getBatchSize()).toBe(3);
    });

    it('should auto-flush when maxBatchSize reached', async () => {
      for (let i = 0; i < 5; i++) {
        manager.addItem(createMockBatchItem(i));
      }
      // Should trigger flush
      await vi.runAllTimersAsync();
      // Batch should be cleared after flush
      expect(manager.getBatchSize()).toBe(0);
    });
  });

  describe('addItems', () => {
    it('should add multiple items at once', () => {
      const items = [createMockBatchItem(0), createMockBatchItem(1), createMockBatchItem(2)];
      manager.addItems(items);
      expect(manager.getBatchSize()).toBe(3);
    });

    it('should trigger flush if total exceeds maxBatchSize', async () => {
      const items = Array.from({ length: 5 }, (_, i) => createMockBatchItem(i));
      manager.addItems(items);
      await vi.runAllTimersAsync();
      expect(manager.getBatchSize()).toBe(0);
    });
  });

  describe('flush', () => {
    it('should do nothing if batch is empty', async () => {
      const result = await manager.flush();
      expect(result.success).toBe(true);
      expect(result.count).toBe(0);
    });

    it('should send batch and clear it', async () => {
      manager.addItem(createMockBatchItem(0));
      manager.addItem(createMockBatchItem(1));
      const result = await manager.flush();
      expect(result.success).toBe(true);
      expect(manager.getBatchSize()).toBe(0);
    });

    it('should not flush while already flushing', async () => {
      manager.addItem(createMockBatchItem(0));
      // Start first flush without awaiting
      const flush1 = manager.flush();
      // Try to flush while first is pending
      const flush2 = manager.flush();
      const result = await flush2;
      expect(result.count).toBe(0); // Second flush should return 0
      await flush1;
    });

    it('should track transmission time', async () => {
      manager.addItem(createMockBatchItem(0));
      await manager.flush();
      const stats = manager.getStats();
      expect(stats.avgTransmissionTime).toBeGreaterThanOrEqual(0);
    });
  });

  describe('cleanup', () => {
    it('should stop auto-flush and flush remaining items', async () => {
      manager.addItem(createMockBatchItem(0));
      manager.addItem(createMockBatchItem(1));
      await manager.cleanup();
      expect(manager.getBatchSize()).toBe(0);
    });

    it('should not error if batch is empty', async () => {
      await expect(manager.cleanup()).resolves.not.toThrow();
    });
  });

  describe('getStats', () => {
    it('should return initial stats', () => {
      const stats = manager.getStats();
      expect(stats.totalItems).toBe(0);
      expect(stats.totalBatches).toBe(0);
      expect(stats.failedBatches).toBe(0);
      expect(stats.pendingItems).toBe(0);
      expect(stats.avgBatchSize).toBe(0);
    });

    it('should update stats after adding items', () => {
      manager.addItem(createMockBatchItem(0));
      manager.addItem(createMockBatchItem(1));
      const stats = manager.getStats();
      expect(stats.totalItems).toBe(2);
      expect(stats.pendingItems).toBe(2);
    });

    it('should calculate avgBatchSize correctly', async () => {
      for (let i = 0; i < 5; i++) {
        manager.addItem(createMockBatchItem(i));
      }
      await manager.flush();
      const stats = manager.getStats();
      expect(stats.avgBatchSize).toBe(5);
    });
  });

  describe('getBatchSize', () => {
    it('should return current batch size', () => {
      expect(manager.getBatchSize()).toBe(0);
      manager.addItem(createMockBatchItem(0));
      expect(manager.getBatchSize()).toBe(1);
    });
  });

  describe('clear', () => {
    it('should clear all items in batch', () => {
      manager.addItem(createMockBatchItem(0));
      manager.addItem(createMockBatchItem(1));
      manager.clear();
      expect(manager.getBatchSize()).toBe(0);
    });
  });

  describe('resetStats', () => {
    it('should reset all statistics', async () => {
      manager.addItem(createMockBatchItem(0));
      await manager.flush();
      manager.resetStats();
      const stats = manager.getStats();
      expect(stats.totalItems).toBe(0);
      expect(stats.totalBatches).toBe(0);
      expect(stats.failedBatches).toBe(0);
    });
  });
});

describe('BatchManagerFactory', () => {
  let factory: BatchManagerFactory;

  beforeEach(() => {
    factory = new BatchManagerFactory();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('getOrCreate', () => {
    it('should create new manager for session', () => {
      const manager = factory.getOrCreate('session-1');
      expect(manager).toBeDefined();
    });

    it('should return same manager for same session ID', () => {
      const manager1 = factory.getOrCreate('session-1');
      const manager2 = factory.getOrCreate('session-1');
      expect(manager1).toBe(manager2);
    });

    it('should create different managers for different sessions', () => {
      const manager1 = factory.getOrCreate('session-1');
      const manager2 = factory.getOrCreate('session-2');
      expect(manager1).not.toBe(manager2);
    });

    it('should accept custom config', () => {
      const manager = factory.getOrCreate('session-1', { maxBatchSize: 20 });
      expect(manager).toBeDefined();
    });
  });

  describe('destroy', () => {
    it('should cleanup manager for session', async () => {
      const manager = factory.getOrCreate('session-1');
      await factory.destroy('session-1');
      // New request should create fresh manager
      const newManager = factory.getOrCreate('session-1');
      expect(newManager).not.toBe(manager);
    });

    it('should not error if session does not exist', async () => {
      await expect(factory.destroy('non-existent')).resolves.not.toThrow();
    });
  });

  describe('destroyAll', () => {
    it('should cleanup all managers', async () => {
      factory.getOrCreate('session-1');
      factory.getOrCreate('session-2');
      factory.getOrCreate('session-3');
      await factory.destroyAll();
      // All managers should be recreated as new
      const stats = factory.getAllStats();
      expect(Object.keys(stats).length).toBe(0);
    });
  });

  describe('getAllStats', () => {
    it('should return stats for all sessions', () => {
      factory.getOrCreate('session-1');
      factory.getOrCreate('session-2');
      const allStats = factory.getAllStats();
      expect(Object.keys(allStats).length).toBe(2);
      expect(allStats['session-1']).toBeDefined();
      expect(allStats['session-2']).toBeDefined();
    });

    it('should return empty object if no sessions', () => {
      const allStats = factory.getAllStats();
      expect(Object.keys(allStats).length).toBe(0);
    });
  });
});
