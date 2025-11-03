import { describe, it, expect, beforeEach } from 'vitest';
import {
  selectOptimalFormat,
  supportsWebP,
  CompressionTracker,
} from '../imageCompression';

describe('Image Compression Utilities', () => {
  describe('selectOptimalFormat', () => {
    it.skip(
      'should return webp or jpeg (requires browser Image API)',
      { timeout: 10000 },
      async () => {
        const format = await selectOptimalFormat();
        expect(['webp', 'jpeg']).toContain(format);
      }
    );

    it.skip(
      'should not throw error (requires browser Image API)',
      { timeout: 10000 },
      async () => {
        await expect(selectOptimalFormat()).resolves.not.toThrow();
      }
    );
  });

  describe('supportsWebP', () => {
    it.skip(
      'should return boolean (requires browser Image API)',
      { timeout: 10000 },
      async () => {
        const result = await supportsWebP();
        expect(typeof result).toBe('boolean');
      }
    );

    it.skip(
      'should not throw error (requires browser Image API)',
      { timeout: 10000 },
      async () => {
        await expect(supportsWebP()).resolves.not.toThrow();
      }
    );
  });
});

describe('CompressionTracker', () => {
  let tracker: CompressionTracker;

  beforeEach(() => {
    tracker = new CompressionTracker();
  });

  describe('record', () => {
    it('should record compression result', () => {
      const result = {
        originalSize: 1000,
        compressedSize: 500,
        compressionRatio: 50,
        format: 'jpeg',
        quality: 0.7,
      };
      tracker.record(result);
      const stats = tracker.getStats();
      expect(stats.totalImages).toBe(1);
    });

    it('should maintain max history', () => {
      for (let i = 0; i < 150; i++) {
        tracker.record({
          originalSize: 1000 + i,
          compressedSize: 500 + i,
          compressionRatio: 50,
          format: 'jpeg',
          quality: 0.7,
        });
      }
      const stats = tracker.getStats();
      expect(stats.totalImages).toBeLessThanOrEqual(100);
    });
  });

  describe('getStats', () => {
    it('should return stats for no data', () => {
      const stats = tracker.getStats();
      expect(stats.totalImages).toBe(0);
      expect(stats.totalOriginalSize).toBe(0);
      expect(stats.totalCompressedSize).toBe(0);
      expect(stats.avgCompressionRatio).toBe(0);
      expect(stats.savedBytes).toBe(0);
    });

    it('should calculate stats correctly', () => {
      tracker.record({
        originalSize: 1000,
        compressedSize: 500,
        compressionRatio: 50,
        format: 'jpeg',
        quality: 0.7,
      });
      tracker.record({
        originalSize: 2000,
        compressedSize: 1000,
        compressionRatio: 50,
        format: 'jpeg',
        quality: 0.7,
      });
      const stats = tracker.getStats();
      expect(stats.totalImages).toBe(2);
      expect(stats.totalOriginalSize).toBe(3000);
      expect(stats.totalCompressedSize).toBe(1500);
      expect(stats.avgCompressionRatio).toBe(50);
      expect(stats.savedBytes).toBe(1500);
    });

    it('should handle varying compression ratios', () => {
      tracker.record({
        originalSize: 1000,
        compressedSize: 750,
        compressionRatio: 25,
        format: 'jpeg',
        quality: 0.7,
      });
      tracker.record({
        originalSize: 1000,
        compressedSize: 500,
        compressionRatio: 50,
        format: 'webp',
        quality: 0.7,
      });
      const stats = tracker.getStats();
      expect(stats.totalImages).toBe(2);
      expect(stats.avgCompressionRatio).toBe(37.5);
    });

    it('should ensure saved bytes are not negative', () => {
      tracker.record({
        originalSize: 1000,
        compressedSize: 2000,
        compressionRatio: -100,
        format: 'jpeg',
        quality: 0.7,
      });
      const stats = tracker.getStats();
      expect(stats.savedBytes).toBeGreaterThanOrEqual(0);
    });
  });

  describe('reset', () => {
    it('should clear all records', () => {
      tracker.record({
        originalSize: 1000,
        compressedSize: 500,
        compressionRatio: 50,
        format: 'jpeg',
        quality: 0.7,
      });
      tracker.reset();
      const stats = tracker.getStats();
      expect(stats.totalImages).toBe(0);
    });
  });
});
