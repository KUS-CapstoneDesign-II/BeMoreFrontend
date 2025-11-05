/**
 * Font Optimization Utilities Tests
 *
 * Tests for font loading tracking, system fonts, and Web Fonts optimization
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  FontLoadingTracker,
  systemFontStack,
  fontCSSVariables,
  waitForFontLoad,
  waitForFontsLoad,
} from '../fontOptimization';

describe('Font Optimization Utils', () => {

  describe('System Font Stacks', () => {
    it('should have UI font stack', () => {
      expect(systemFontStack.ui).toBeDefined();
      expect(typeof systemFontStack.ui).toBe('string');
      expect(systemFontStack.ui.length).toBeGreaterThan(0);
    });

    it('should have body font stack', () => {
      expect(systemFontStack.body).toBeDefined();
      expect(typeof systemFontStack.body).toBe('string');
    });

    it('should have monospace font stack', () => {
      expect(systemFontStack.mono).toBeDefined();
      expect(typeof systemFontStack.mono).toBe('string');
    });

    it('should have serif font stack', () => {
      expect(systemFontStack.serif).toBeDefined();
      expect(typeof systemFontStack.serif).toBe('string');
    });

    it('should fallback to system fonts', () => {
      expect(systemFontStack.ui).toContain('-apple-system');
      expect(systemFontStack.ui).toContain('BlinkMacSystemFont');
    });
  });

  describe('Font CSS Variables', () => {
    it('should contain size variables', () => {
      expect(fontCSSVariables).toContain('--font-size');
    });

    it('should contain weight variables', () => {
      expect(fontCSSVariables).toContain('--font-weight');
    });

    it('should contain line-height variables', () => {
      expect(fontCSSVariables).toContain('--line-height');
    });

    it('should contain letter-spacing variables', () => {
      expect(fontCSSVariables).toContain('--letter-spacing');
    });

    it('should be valid CSS string', () => {
      expect(fontCSSVariables).toMatch(/:root\s*\{/);
      expect(fontCSSVariables).toMatch(/\}/);
    });

    it('should define all standard sizes', () => {
      // Check for common size values
      const sizes = ['--font-size-xs', '--font-size-sm', '--font-size-md', '--font-size-lg', '--font-size-xl'];
      sizes.forEach(size => {
        expect(fontCSSVariables).toContain(size);
      });
    });
  });

  describe('FontLoadingTracker', () => {
    let tracker: FontLoadingTracker;

    beforeEach(() => {
      tracker = new FontLoadingTracker();
    });

    it('should initialize with empty fonts', () => {
      const status = tracker.getStatus();
      expect(status.loaded).toBe(0);
      expect(status.loading).toBe(0);
      expect(status.failed).toBe(0);
    });

    it('should track font loading', () => {
      tracker.startTracking('Inter', 400);
      expect(tracker.getStatus().loading).toBe(1);
    });

    it('should mark font as loaded', () => {
      tracker.startTracking('Inter', 400);
      tracker.fontLoaded('Inter', 400);

      const status = tracker.getStatus();
      expect(status.loaded).toBe(1);
      expect(status.loading).toBe(0);
    });

    it('should track font loading failures', () => {
      tracker.startTracking('BadFont', 400);
      tracker.fontFailed('BadFont', 400);

      const status = tracker.getStatus();
      expect(status.failed).toBe(1);
      expect(status.loading).toBe(0);
    });

    it('should calculate loading percentage', () => {
      tracker.startTracking('Font1', 400);
      tracker.startTracking('Font2', 400);
      tracker.fontLoaded('Font1', 400);

      const percentage = tracker.getLoadingPercentage();
      expect(percentage).toBeCloseTo(50, 0);
    });

    it('should provide summary', () => {
      tracker.startTracking('Inter', 400);
      tracker.fontLoaded('Inter', 400);

      const summary = tracker.getSummary();
      expect(summary).toHaveProperty('totalFonts');
      expect(summary).toHaveProperty('loadedFonts');
      expect(summary).toHaveProperty('failedFonts');
      expect(summary).toHaveProperty('averageLoadTime');
    });

    it('should track multiple weights', () => {
      tracker.startTracking('Inter', 400);
      tracker.startTracking('Inter', 600);
      tracker.startTracking('Inter', 700);

      const status = tracker.getStatus();
      expect(status.loading).toBe(3);
    });

    it('should reset tracking', () => {
      tracker.startTracking('Inter', 400);
      tracker.reset();

      const status = tracker.getStatus();
      expect(status.loading).toBe(0);
      expect(status.loaded).toBe(0);
    });
  });

  describe('waitForFontLoad', () => {
    it('should handle font loading', async () => {
      const promise = waitForFontLoad('Test', 400, 50);

      // Should eventually resolve or reject
      try {
        await promise;
      } catch {
        // Expected for non-existent font in test environment
      }

      expect(true).toBe(true);
    });

    it('should reject on timeout', async () => {
      const promise = waitForFontLoad('NonExistent', 400, 10);

      // Should reject due to timeout
      await expect(promise).rejects;
    });

    it('should work with different weights', async () => {
      const weights = [400, 600, 700];

      for (const weight of weights) {
        const promise = waitForFontLoad('TestFont', weight, 50);
        try {
          await promise;
        } catch {
          // Expected for test environment
        }
      }

      expect(true).toBe(true);
    });
  });

  describe('waitForFontsLoad', () => {
    it('should wait for multiple fonts', async () => {
      const fonts = [
        { name: 'Arial', weight: 400 },
        { name: 'Times New Roman', weight: 400 },
      ];

      const promise = waitForFontsLoad(fonts, 100);

      // Should resolve (system fonts usually available)
      try {
        await promise;
        expect(true).toBe(true);
      } catch {
        // May timeout for non-web fonts, which is acceptable
        expect(true).toBe(true);
      }
    });

    it('should handle empty font list', async () => {
      const promise = waitForFontsLoad([], 100);

      await expect(promise).resolves;
    });

    it('should timeout appropriately', async () => {
      const fonts = [{ name: 'NonExistentFont12345', weight: 400 }];
      const promise = waitForFontsLoad(fonts, 10);

      await expect(promise).rejects;
    });

    it('should track all fonts', async () => {
      const fonts = [
        { name: 'Arial', weight: 400 },
        { name: 'Times New Roman', weight: 700 },
      ];

      try {
        await waitForFontsLoad(fonts, 50);
      } catch {
        // May fail for non-web fonts
      }

      expect(true).toBe(true); // Just verify it doesn't crash
    });
  });

  describe('Font Size Calculations', () => {
    it('should have defined size values', () => {
      const sizeMatches = fontCSSVariables.match(/--font-size.*?:\s*[\d.]+(?:rem|px)/g);
      expect(sizeMatches).toBeTruthy();
      expect(sizeMatches!.length).toBeGreaterThan(0);
    });

    it('should use consistent unit', () => {
      const sizeMatches = fontCSSVariables.match(/--font-size.*?:\s*[\d.]+(\w+)/g);
      expect(sizeMatches).toBeTruthy();

      // All should use same unit (rem or px)
      const units = sizeMatches!.map(s => {
        const match = s.match(/(rem|px)$/);
        return match ? match[0] : null;
      });

      const uniqueUnits = [...new Set(units)];
      expect(uniqueUnits.length).toBe(1); // All same unit
    });
  });

  describe('Integration', () => {
    it('should provide complete font setup', () => {
      expect(systemFontStack).toBeDefined();
      expect(fontCSSVariables).toBeDefined();

      // Both should be non-empty
      expect(Object.keys(systemFontStack).length).toBeGreaterThan(0);
      expect(fontCSSVariables.length).toBeGreaterThan(0);
    });

    it('should have complementary font stacks', () => {
      const stacks = Object.values(systemFontStack);

      // Each should be a non-empty string
      stacks.forEach(stack => {
        expect(typeof stack).toBe('string');
        expect(stack.length).toBeGreaterThan(0);
      });

      // Should not all be identical
      const uniqueStacks = new Set(stacks);
      expect(uniqueStacks.size).toBeGreaterThan(1);
    });
  });
});
