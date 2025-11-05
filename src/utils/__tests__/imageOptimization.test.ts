/**
 * Image Optimization Utilities Tests
 *
 * Tests for image format detection, responsive srcsets, and lazy loading
 */

import { describe, it, expect, vi } from 'vitest';
import {
  detectImageFormats,
  generateSrcset,
  generateResponsiveSrcsets,
  lazyLoadImage,
  handleImageError,
  ImageLoadingMetrics,
} from '../imageOptimization';

describe('Image Optimization Utils', () => {

  describe('detectImageFormats', () => {
    it('should detect image format support', async () => {
      const formats = await detectImageFormats();

      expect(formats).toHaveProperty('webp');
      expect(formats).toHaveProperty('avif');
      expect(formats).toHaveProperty('png');
      expect(typeof formats.webp).toBe('boolean');
    });

    it('should return consistent results', async () => {
      const formats1 = await detectImageFormats();
      const formats2 = await detectImageFormats();

      expect(formats1).toEqual(formats2);
    });
  });

  describe('generateSrcset', () => {
    it('should generate srcset with correct widths', () => {
      const basePath = '/images/photo';
      const srcset = generateSrcset(basePath, 'jpg', [320, 640, 1280]);

      expect(srcset).toContain('320w');
      expect(srcset).toContain('640w');
      expect(srcset).toContain('1280w');
    });

    it('should format srcset correctly', () => {
      const basePath = '/images/photo';
      const srcset = generateSrcset(basePath, 'jpg', [320, 640]);

      // Should be: /images/photo-320.jpg 320w, /images/photo-640.jpg 640w
      expect(srcset).toMatch(/\d+w/);
      const entries = srcset.split(',').map(e => e.trim());
      expect(entries.length).toBe(2);
    });

    it('should handle WebP format generation', () => {
      const basePath = '/images/photo';
      const srcset = generateSrcset(basePath, 'webp', [320, 640]);

      // Should include webp extension
      expect(srcset).toContain('webp');
      expect(srcset).toContain('320w');
    });

    it('should handle empty widths array', () => {
      const basePath = '/images/photo';
      const srcset = generateSrcset(basePath, 'jpg', []);

      expect(srcset).toBe('');
    });

    it('should handle AVIF format', () => {
      const basePath = '/images/photo';
      const srcset = generateSrcset(basePath, 'avif', [320]);

      expect(srcset).toContain('avif');
      expect(srcset).toContain('320w');
    });

    it('should use default sizes when not provided', () => {
      const basePath = '/images/photo';
      const srcset = generateSrcset(basePath, 'jpg');

      // Should use default sizes [320, 640, 1024, 1280]
      expect(srcset).toContain('320w');
      expect(srcset).toContain('1024w');
    });
  });

  describe('generateResponsiveSrcsets', () => {
    it('should generate multiple format srcsets', () => {
      const basePath = '/images/photo';
      const srcsets = generateResponsiveSrcsets(basePath, 'jpg', [320, 640]);

      expect(srcsets).toHaveProperty('webp');
      expect(srcsets).toHaveProperty('avif');
      expect(srcsets).toHaveProperty('original');
    });

    it('should include srcset strings for each format', () => {
      const basePath = '/images/photo';
      const srcsets = generateResponsiveSrcsets(basePath, 'jpg', [320, 640]);

      expect(typeof srcsets.webp).toBe('string');
      expect(typeof srcsets.avif).toBe('string');
      expect(typeof srcsets.original).toBe('string');

      // All should contain width descriptors
      expect(srcsets.webp).toMatch(/\d+w/);
      expect(srcsets.avif).toMatch(/\d+w/);
      expect(srcsets.original).toMatch(/\d+w/);
    });

    it('should handle custom sizes', () => {
      const basePath = '/images/photo';
      const sizes = [100, 200, 300];
      const srcsets = generateResponsiveSrcsets(basePath, 'jpg', sizes);

      // Check that all widths are present in at least one format
      sizes.forEach(size => {
        const hasWidth = Object.values(srcsets).some(srcset =>
          srcset.includes(`${size}w`)
        );
        expect(hasWidth).toBe(true);
      });
    });
  });

  describe('ImageLoadingMetrics', () => {
    it('should track load time', () => {
      const metrics = new ImageLoadingMetrics();
      metrics.startMeasure('http://example.com/image.jpg');

      expect(metrics.getDuration()).toBeGreaterThanOrEqual(0);
    });

    it('should calculate duration', () => {
      const metrics = new ImageLoadingMetrics();
      metrics.startMeasure('http://example.com/image.jpg');
      metrics.endMeasure();

      const duration = metrics.getDuration();
      expect(duration).toBeGreaterThanOrEqual(0);
    });

    it('should provide metrics', () => {
      const metrics = new ImageLoadingMetrics();
      metrics.startMeasure('http://example.com/image.jpg');
      metrics.endMeasure();

      const data = metrics.getMetrics();
      expect(data).toHaveProperty('imageUrl');
      expect(data).toHaveProperty('duration');
      expect(data).toHaveProperty('timestamp');
      expect(data.imageUrl).toBe('http://example.com/image.jpg');
    });
  });

  describe('lazyLoadImage', () => {
    it('should handle image element', () => {
      const img = document.createElement('img');
      img.src = '/images/test.jpg';

      // Should not throw
      expect(() => lazyLoadImage(img)).not.toThrow();
    });

    it('should return cleanup function', () => {
      const img = document.createElement('img');
      const cleanup = lazyLoadImage(img);

      expect(typeof cleanup).toBe('function');
    });

    it('should setup intersection observer', () => {
      const img = document.createElement('img');
      img.dataset.src = '/images/test.jpg';

      const cleanup = lazyLoadImage(img);
      expect(cleanup).toBeDefined();
      cleanup();
    });
  });

  describe('handleImageError', () => {
    it('should set fallback image', () => {
      const img = document.createElement('img');
      const fallbackSrc = '/images/fallback.jpg';

      handleImageError(img, fallbackSrc);

      expect(img.src).toBe(fallbackSrc);
    });

    it('should add error class', () => {
      const img = document.createElement('img');
      handleImageError(img);

      expect(img.classList.contains('image-error')).toBe(true);
    });

    it('should invoke callback if provided', () => {
      const img = document.createElement('img');
      const callback = vi.fn();

      handleImageError(img, '/images/fallback.jpg', callback);

      expect(callback).toHaveBeenCalled();
    });

    it('should handle missing fallback gracefully', () => {
      const img = document.createElement('img');
      img.src = 'http://example.com/image.jpg';

      // Should not throw when called with undefined fallback
      expect(() => handleImageError(img)).not.toThrow();
      expect(img.classList.contains('image-error')).toBe(true);
    });
  });
});
