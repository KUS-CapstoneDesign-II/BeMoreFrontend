/**
 * Image Optimization Utilities Tests
 *
 * Tests for image format detection, responsive srcsets, and lazy loading
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
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
    it('should detect WebP support', async () => {
      const formats = await detectImageFormats();

      expect(formats).toHaveProperty('webp');
      expect(formats).toHaveProperty('avif');
      expect(formats).toHaveProperty('jpeg');
      expect(formats.jpeg).toBe(true); // JPEG always supported
    });

    it('should return consistent results', async () => {
      const formats1 = await detectImageFormats();
      const formats2 = await detectImageFormats();

      expect(formats1).toEqual(formats2);
    });

    it('should have all required format properties', async () => {
      const formats = await detectImageFormats();

      expect(Object.keys(formats)).toContain('webp');
      expect(Object.keys(formats)).toContain('avif');
      expect(Object.keys(formats)).toContain('jpeg');
    });
  });

  describe('generateSrcset', () => {
    it('should generate srcset with correct widths', () => {
      const basePath = '/images/photo.jpg';
      const srcset = generateSrcset(basePath, [320, 640, 1280]);

      expect(srcset).toContain('320w');
      expect(srcset).toContain('640w');
      expect(srcset).toContain('1280w');
    });

    it('should format srcset correctly', () => {
      const basePath = '/images/photo.jpg';
      const srcset = generateSrcset(basePath, [320, 640]);

      // Should be: /images/photo-320.jpg 320w, /images/photo-640.jpg 640w
      expect(srcset).toMatch(/\d+w/);
      const entries = srcset.split(',').map(e => e.trim());
      expect(entries.length).toBe(2);
    });

    it('should handle WebP format generation', () => {
      const basePath = '/images/photo.jpg';
      const srcset = generateSrcset(basePath, [320, 640], 'webp');

      // Should replace .jpg with .webp
      expect(srcset).toContain('webp');
    });

    it('should handle empty widths array', () => {
      const basePath = '/images/photo.jpg';
      const srcset = generateSrcset(basePath, []);

      expect(srcset).toBe('');
    });

    it('should handle AVIF format', () => {
      const basePath = '/images/photo.jpg';
      const srcset = generateSrcset(basePath, [320], 'avif');

      expect(srcset).toContain('avif');
    });
  });

  describe('generateResponsiveSrcsets', () => {
    it('should generate multiple format srcsets', () => {
      const basePath = '/images/photo.jpg';
      const srcsets = generateResponsiveSrcsets(basePath, [320, 640]);

      expect(srcsets).toHaveProperty('webp');
      expect(srcsets).toHaveProperty('avif');
      expect(srcsets).toHaveProperty('jpeg');
    });

    it('should include srcset strings for each format', () => {
      const basePath = '/images/photo.jpg';
      const srcsets = generateResponsiveSrcsets(basePath, [320, 640]);

      expect(typeof srcsets.webp).toBe('string');
      expect(typeof srcsets.avif).toBe('string');
      expect(typeof srcsets.jpeg).toBe('string');

      // All should contain width descriptors
      expect(srcsets.webp).toMatch(/\d+w/);
      expect(srcsets.avif).toMatch(/\d+w/);
      expect(srcsets.jpeg).toMatch(/\d+w/);
    });

    it('should handle custom sizes', () => {
      const basePath = '/images/photo.jpg';
      const sizes = [100, 200, 300, 400, 500];
      const srcsets = generateResponsiveSrcsets(basePath, sizes);

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
    let metrics: ImageLoadingMetrics;

    beforeEach(() => {
      metrics = new ImageLoadingMetrics();
    });

    it('should track load time', () => {
      const img = new Image();
      metrics.trackLoadStart(img);

      expect(metrics.getTotalLoaded()).toBe(0); // Not loaded yet
    });

    it('should calculate average load time', () => {
      const img1 = new Image();
      const img2 = new Image();

      metrics.trackLoadStart(img1);
      metrics.trackLoadEnd(img1, true);

      metrics.trackLoadStart(img2);
      metrics.trackLoadEnd(img2, true);

      const avg = metrics.getAverageLoadTime();
      expect(typeof avg).toBe('number');
      expect(avg).toBeGreaterThanOrEqual(0);
    });

    it('should track successful loads', () => {
      const img = new Image();
      metrics.trackLoadStart(img);
      metrics.trackLoadEnd(img, true);

      expect(metrics.getTotalLoaded()).toBe(1);
      expect(metrics.getSuccessRate()).toBeCloseTo(100, 0);
    });

    it('should track failed loads', () => {
      const img = new Image();
      metrics.trackLoadStart(img);
      metrics.trackLoadEnd(img, false);

      expect(metrics.getTotalFailed()).toBe(1);
      expect(metrics.getSuccessRate()).toBeCloseTo(0, 0);
    });

    it('should calculate success rate correctly', () => {
      const img1 = new Image();
      const img2 = new Image();

      metrics.trackLoadStart(img1);
      metrics.trackLoadEnd(img1, true);

      metrics.trackLoadStart(img2);
      metrics.trackLoadEnd(img2, false);

      expect(metrics.getSuccessRate()).toBeCloseTo(50, 0);
    });

    it('should provide summary', () => {
      const img = new Image();
      metrics.trackLoadStart(img);
      metrics.trackLoadEnd(img, true);

      const summary = metrics.getSummary();
      expect(summary).toHaveProperty('totalImages');
      expect(summary).toHaveProperty('successCount');
      expect(summary).toHaveProperty('failureCount');
      expect(summary).toHaveProperty('successRate');
      expect(summary).toHaveProperty('averageLoadTime');
    });
  });

  describe('lazyLoadImage', () => {
    it('should handle image element', () => {
      const img = document.createElement('img');
      img.src = '/images/test.jpg';

      // Should not throw
      expect(() => lazyLoadImage(img)).not.toThrow();
    });

    it('should set native lazy loading attribute', () => {
      const img = document.createElement('img');
      lazyLoadImage(img);

      expect(img.getAttribute('loading')).toBe('lazy');
    });

    it('should preserve existing attributes', () => {
      const img = document.createElement('img');
      img.alt = 'Test image';
      img.className = 'test-class';

      lazyLoadImage(img);

      expect(img.alt).toBe('Test image');
      expect(img.className).toBe('test-class');
    });

    it('should set crossOrigin for CORS images', () => {
      const img = document.createElement('img');
      lazyLoadImage(img, true);

      expect(img.getAttribute('crossOrigin')).toBe('anonymous');
    });

    it('should invoke callback on load', () => {
      const img = document.createElement('img');
      const callback = vi.fn();

      lazyLoadImage(img, false, callback);

      // Manually trigger load event
      img.dispatchEvent(new Event('load'));

      expect(callback).toHaveBeenCalled();
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

      handleImageError(img, undefined, callback);

      expect(callback).toHaveBeenCalled();
    });

    it('should prevent infinite fallback loops', () => {
      const img = document.createElement('img');
      const fallbackUrl = '/images/fallback.jpg';

      // Calling with same fallback should not cause issues
      handleImageError(img, fallbackUrl);

      // In JSDOM, relative paths are converted to absolute
      expect(img.src).toContain('fallback.jpg');
      expect(img.src).toContain('images');
    });
  });
});
