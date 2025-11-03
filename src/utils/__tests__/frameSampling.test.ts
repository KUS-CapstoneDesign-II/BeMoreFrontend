import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { FrameSampler, AdaptiveFrameSampler } from '../frameSampling';

describe('FrameSampler', () => {
  let sampler: FrameSampler;

  beforeEach(() => {
    sampler = new FrameSampler({ targetFps: 5 });
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('constructor', () => {
    it('should initialize with default config', () => {
      const s = new FrameSampler();
      expect(s.getStats().totalFrames).toBe(0);
      expect(s.getStats().sampledFrames).toBe(0);
    });

    it('should calculate frameInterval correctly', () => {
      const s = new FrameSampler({ targetFps: 10 });
      expect(s.getStats().totalFrames).toBe(0);
      // frameInterval = 1000 / 10 = 100ms
    });
  });

  describe('shouldProcess', () => {
    it('should return true on first call', () => {
      expect(sampler.shouldProcess()).toBe(true);
    });

    it('should return false if not enough time elapsed', () => {
      vi.useRealTimers();
      sampler.shouldProcess();
      sampler.recordProcessing(10);
      expect(sampler.shouldProcess()).toBe(false);
      vi.useFakeTimers();
    });

    it('should return true after frameInterval elapsed', { timeout: 300 }, async () => {
      vi.useRealTimers();
      sampler.shouldProcess();
      sampler.recordProcessing(10);
      // Wait for frameInterval to pass (200ms for 5fps)
      await new Promise(resolve => setTimeout(resolve, 210));
      expect(sampler.shouldProcess()).toBe(true);
      vi.useFakeTimers();
    });

    it('should increment totalFrames', () => {
      sampler.shouldProcess();
      expect(sampler.getStats().totalFrames).toBe(1);
      sampler.shouldProcess();
      expect(sampler.getStats().totalFrames).toBe(2);
    });
  });

  describe('recordProcessing', () => {
    it('should increment sampledFrames', () => {
      sampler.recordProcessing(10);
      expect(sampler.getStats().sampledFrames).toBe(1);
      sampler.recordProcessing(20);
      expect(sampler.getStats().sampledFrames).toBe(2);
    });

    it('should update lastProcessTime', () => {
      sampler.recordProcessing(10);
      const stats1 = sampler.getStats();
      vi.advanceTimersByTime(100);
      sampler.recordProcessing(10);
      const stats2 = sampler.getStats();
      expect(stats2.sampledFrames).toBeGreaterThan(stats1.sampledFrames);
    });

    it('should track processing times with max history limit', () => {
      for (let i = 0; i < 150; i++) {
        sampler.recordProcessing(10 + i);
      }
      // Should only keep last 100
      const stats = sampler.getStats();
      expect(stats.avgFrameTime).toBeGreaterThan(0);
    });
  });

  describe('getStats', () => {
    it('should calculate droppedFrames correctly', () => {
      sampler.shouldProcess();
      sampler.recordProcessing(10);
      sampler.shouldProcess();
      sampler.shouldProcess(); // Dropped
      const stats = sampler.getStats();
      expect(stats.totalFrames).toBe(3);
      expect(stats.sampledFrames).toBe(1);
      expect(stats.droppedFrames).toBe(2);
    });

    it('should calculate samplingRate correctly', () => {
      sampler.shouldProcess();
      sampler.recordProcessing(10);
      sampler.shouldProcess();
      const stats = sampler.getStats();
      expect(stats.samplingRate).toBe(50); // 1 sampled / 2 total = 50%
    });

    it('should calculate avgFrameTime correctly', () => {
      sampler.recordProcessing(10);
      sampler.recordProcessing(20);
      sampler.recordProcessing(30);
      const stats = sampler.getStats();
      expect(stats.avgFrameTime).toBe(20); // (10+20+30)/3 = 20
    });

    it('should handle zero processing times', () => {
      const stats = sampler.getStats();
      expect(stats.samplingRate).toBe(0);
      expect(stats.avgFrameTime).toBe(0);
    });
  });

  describe('reset', () => {
    it('should reset all statistics', () => {
      sampler.shouldProcess();
      sampler.recordProcessing(10);
      sampler.reset();
      const stats = sampler.getStats();
      expect(stats.totalFrames).toBe(0);
      expect(stats.sampledFrames).toBe(0);
      expect(stats.droppedFrames).toBe(0);
      expect(stats.avgFrameTime).toBe(0);
    });
  });
});

describe('AdaptiveFrameSampler', () => {
  let sampler: AdaptiveFrameSampler;

  beforeEach(() => {
    sampler = new AdaptiveFrameSampler(5);
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('constructor', () => {
    it('should initialize with provided FPS', () => {
      const s = new AdaptiveFrameSampler(10);
      expect(s.getCurrentFps()).toBe(10);
    });

    it('should default to 5 FPS', () => {
      expect(sampler.getCurrentFps()).toBe(5);
    });
  });

  describe('adjustByResourceUsage', () => {
    it('should decrease FPS when CPU load is high', () => {
      const result = sampler.adjustByResourceUsage(85, 400); // CPU > 80%
      expect(result.fpsAdjusted).toBe(true);
      expect(result.newFps).toBeLessThan(5);
    });

    it('should decrease FPS when network latency is high', () => {
      const result = sampler.adjustByResourceUsage(60, 550); // Latency > 500ms
      expect(result.fpsAdjusted).toBe(true);
      expect(result.newFps).toBeLessThan(5);
    });

    it('should increase FPS when resources are available', () => {
      sampler.adjustByResourceUsage(85, 400); // Lower FPS first
      const result = sampler.adjustByResourceUsage(40, 100); // Low load
      expect(result.newFps).toBeGreaterThan(2);
    });

    it('should not go below minFps', () => {
      sampler.adjustByResourceUsage(90, 600);
      sampler.adjustByResourceUsage(90, 600);
      sampler.adjustByResourceUsage(90, 600);
      sampler.adjustByResourceUsage(90, 600);
      expect(sampler.getCurrentFps()).toBeGreaterThanOrEqual(2);
    });

    it('should not exceed maxFps', () => {
      sampler.adjustByResourceUsage(40, 100);
      sampler.adjustByResourceUsage(40, 100);
      sampler.adjustByResourceUsage(40, 100);
      sampler.adjustByResourceUsage(40, 100);
      expect(sampler.getCurrentFps()).toBeLessThanOrEqual(15);
    });

    it('should not adjust when resources are balanced', () => {
      const result = sampler.adjustByResourceUsage(70, 300);
      expect(result.fpsAdjusted).toBe(false);
      expect(result.newFps).toBe(5);
    });
  });

  describe('getCurrentFps', () => {
    it('should return current FPS', () => {
      expect(sampler.getCurrentFps()).toBe(5);
      sampler.adjustByResourceUsage(85, 400);
      expect(sampler.getCurrentFps()).toBeLessThan(5);
    });
  });
});
