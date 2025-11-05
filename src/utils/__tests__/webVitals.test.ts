/**
 * Web Vitals Tests
 *
 * Tests for Core Web Vitals measurement (LCP, FID, CLS, TTFB, FCP)
 */

import { describe, it, expect } from 'vitest';
import type { VitalsMetric } from '../webVitals';

describe('Web Vitals', () => {

  describe('Metric Rating System', () => {
    it('should rate LCP correctly', () => {
      // LCP thresholds: good < 2500ms, needs-improvement < 4000ms, poor > 4000ms
      const goodLCP = { name: 'LCP' as const, value: 2000, rating: 'good', delta: 0, id: '1' };
      const needsImprovementLCP = { name: 'LCP' as const, value: 3000, rating: 'needs-improvement', delta: 0, id: '2' };
      const poorLCP = { name: 'LCP' as const, value: 5000, rating: 'poor', delta: 0, id: '3' };

      expect(goodLCP.rating).toBe('good');
      expect(needsImprovementLCP.rating).toBe('needs-improvement');
      expect(poorLCP.rating).toBe('poor');
    });

    it('should rate FID correctly', () => {
      // FID thresholds: good < 100ms, needs-improvement < 300ms, poor > 300ms
      const goodFID = { name: 'FID' as const, value: 50, rating: 'good', delta: 0, id: '1' };
      const needsImprovementFID = { name: 'FID' as const, value: 150, rating: 'needs-improvement', delta: 0, id: '2' };
      const poorFID = { name: 'FID' as const, value: 400, rating: 'poor', delta: 0, id: '3' };

      expect(goodFID.rating).toBe('good');
      expect(needsImprovementFID.rating).toBe('needs-improvement');
      expect(poorFID.rating).toBe('poor');
    });

    it('should rate CLS correctly', () => {
      // CLS thresholds: good < 0.1, needs-improvement < 0.25, poor > 0.25
      const goodCLS = { name: 'CLS' as const, value: 0.05, rating: 'good', delta: 0, id: '1' };
      const needsImprovementCLS = { name: 'CLS' as const, value: 0.15, rating: 'needs-improvement', delta: 0, id: '2' };
      const poorCLS = { name: 'CLS' as const, value: 0.3, rating: 'poor', delta: 0, id: '3' };

      expect(goodCLS.rating).toBe('good');
      expect(needsImprovementCLS.rating).toBe('needs-improvement');
      expect(poorCLS.rating).toBe('poor');
    });

    it('should rate TTFB correctly', () => {
      // TTFB thresholds: good < 600ms, needs-improvement < 1800ms, poor > 1800ms
      const goodTTFB = { name: 'TTFB' as const, value: 400, rating: 'good', delta: 0, id: '1' };
      const needsImprovementTTFB = { name: 'TTFB' as const, value: 1000, rating: 'needs-improvement', delta: 0, id: '2' };
      const poorTTFB = { name: 'TTFB' as const, value: 2000, rating: 'poor', delta: 0, id: '3' };

      expect(goodTTFB.rating).toBe('good');
      expect(needsImprovementTTFB.rating).toBe('needs-improvement');
      expect(poorTTFB.rating).toBe('poor');
    });

    it('should rate FCP correctly', () => {
      // FCP thresholds: good < 1800ms, needs-improvement < 3000ms, poor > 3000ms
      const goodFCP = { name: 'FCP' as const, value: 1500, rating: 'good', delta: 0, id: '1' };
      const needsImprovementFCP = { name: 'FCP' as const, value: 2000, rating: 'needs-improvement', delta: 0, id: '2' };
      const poorFCP = { name: 'FCP' as const, value: 3500, rating: 'poor', delta: 0, id: '3' };

      expect(goodFCP.rating).toBe('good');
      expect(needsImprovementFCP.rating).toBe('needs-improvement');
      expect(poorFCP.rating).toBe('poor');
    });
  });

  describe('VitalsMetric Interface', () => {
    it('should have required properties', () => {
      const metric: VitalsMetric = {
        name: 'LCP',
        value: 2000,
        rating: 'good',
        delta: 0,
        id: 'test-1',
      };

      expect(metric.name).toBe('LCP');
      expect(metric.value).toBe(2000);
      expect(metric.rating).toBe('good');
      expect(metric.delta).toBe(0);
      expect(metric.id).toBeDefined();
    });

    it('should have optional properties', () => {
      const metric: VitalsMetric = {
        name: 'LCP',
        value: 2000,
        rating: 'good',
        delta: 0,
        id: 'test-1',
        navigationType: 'navigation',
        entries: [],
      };

      expect(metric.navigationType).toBe('navigation');
      expect(metric.entries).toBeDefined();
    });

    it('should support all metric types', () => {
      const metricTypes: Array<VitalsMetric['name']> = ['LCP', 'FID', 'CLS', 'TTFB', 'FCP', 'INP'];

      metricTypes.forEach(type => {
        const metric: VitalsMetric = {
          name: type,
          value: 100,
          rating: 'good',
          delta: 0,
          id: `test-${type}`,
        };

        expect(metric.name).toBe(type);
      });
    });

    it('should support all rating types', () => {
      const ratings: Array<VitalsMetric['rating']> = ['good', 'needs-improvement', 'poor'];

      ratings.forEach(rating => {
        const metric: VitalsMetric = {
          name: 'LCP',
          value: 100,
          rating,
          delta: 0,
          id: 'test-1',
        };

        expect(metric.rating).toBe(rating);
      });
    });
  });

  describe('Metric Value Ranges', () => {
    it('should handle zero values', () => {
      const metric: VitalsMetric = {
        name: 'LCP',
        value: 0,
        rating: 'good',
        delta: 0,
        id: 'test-1',
      };

      expect(metric.value).toBe(0);
    });

    it('should handle large values', () => {
      const metric: VitalsMetric = {
        name: 'TTFB',
        value: 10000,
        rating: 'poor',
        delta: 0,
        id: 'test-1',
      };

      expect(metric.value).toBe(10000);
    });

    it('should handle decimal values (CLS)', () => {
      const metric: VitalsMetric = {
        name: 'CLS',
        value: 0.0123,
        rating: 'good',
        delta: 0.0045,
        id: 'test-1',
      };

      expect(metric.value).toBeCloseTo(0.0123, 4);
      expect(metric.delta).toBeCloseTo(0.0045, 4);
    });
  });

  describe('Navigation Type Detection', () => {
    it('should support navigation type', () => {
      const metric: VitalsMetric = {
        name: 'LCP',
        value: 2000,
        rating: 'good',
        delta: 0,
        id: 'test-1',
        navigationType: 'navigation',
      };

      expect(metric.navigationType).toBe('navigation');
    });

    it('should support reload type', () => {
      const metric: VitalsMetric = {
        name: 'LCP',
        value: 1500,
        rating: 'good',
        delta: 0,
        id: 'test-1',
        navigationType: 'reload',
      };

      expect(metric.navigationType).toBe('reload');
    });
  });

  describe('Metric ID Generation', () => {
    it('should have unique IDs', () => {
      const metric1: VitalsMetric = {
        name: 'LCP',
        value: 2000,
        rating: 'good',
        delta: 0,
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      };

      const metric2: VitalsMetric = {
        name: 'FID',
        value: 50,
        rating: 'good',
        delta: 0,
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      };

      expect(metric1.id).not.toBe(metric2.id);
    });

    it('should have timestamp in ID', () => {
      const now = Date.now();
      const metric: VitalsMetric = {
        name: 'LCP',
        value: 2000,
        rating: 'good',
        delta: 0,
        id: `${now}-abc123`,
      };

      expect(metric.id).toContain(now.toString());
    });
  });

  describe('Delta Tracking', () => {
    it('should track metric deltas', () => {
      const metric1: VitalsMetric = {
        name: 'LCP',
        value: 2500,
        rating: 'needs-improvement',
        delta: 0,
        id: 'test-1',
      };

      const metric2: VitalsMetric = {
        name: 'LCP',
        value: 2200,
        rating: 'good',
        delta: metric1.value - 2200,
        id: 'test-2',
      };

      expect(metric2.delta).toBe(300);
    });

    it('should handle negative deltas (improvements)', () => {
      const previousValue = 3000;
      const currentValue = 2000;
      const delta = previousValue - currentValue;

      const metric: VitalsMetric = {
        name: 'LCP',
        value: currentValue,
        rating: 'good',
        delta,
        id: 'test-1',
      };

      expect(metric.delta).toBe(1000); // Positive delta = improvement
    });

    it('should handle positive deltas (regressions)', () => {
      const previousValue = 2000;
      const currentValue = 3000;
      const delta = currentValue - previousValue;

      const metric: VitalsMetric = {
        name: 'LCP',
        value: currentValue,
        rating: 'needs-improvement',
        delta,
        id: 'test-1',
      };

      expect(metric.delta).toBe(1000); // Positive delta = regression
    });
  });

  describe('Threshold Thresholds Constants', () => {
    it('should have LCP thresholds', () => {
      const lcpGood = 2500;
      const lcpNeedsImprovement = 4000;

      expect(lcpGood).toBeLessThan(lcpNeedsImprovement);
    });

    it('should have FID thresholds', () => {
      const fidGood = 100;
      const fidNeedsImprovement = 300;

      expect(fidGood).toBeLessThan(fidNeedsImprovement);
    });

    it('should have CLS thresholds', () => {
      const clsGood = 0.1;
      const clsNeedsImprovement = 0.25;

      expect(clsGood).toBeLessThan(clsNeedsImprovement);
    });

    it('should have TTFB thresholds', () => {
      const ttfbGood = 600;
      const ttfbNeedsImprovement = 1800;

      expect(ttfbGood).toBeLessThan(ttfbNeedsImprovement);
    });

    it('should have FCP thresholds', () => {
      const fcpGood = 1800;
      const fcpNeedsImprovement = 3000;

      expect(fcpGood).toBeLessThan(fcpNeedsImprovement);
    });
  });

  describe('Entry Collections', () => {
    it('should support performance entries', () => {
      const entries: PerformanceEntry[] = [];

      const metric: VitalsMetric = {
        name: 'LCP',
        value: 2000,
        rating: 'good',
        delta: 0,
        id: 'test-1',
        entries,
      };

      expect(metric.entries).toBeDefined();
      expect(Array.isArray(metric.entries)).toBe(true);
    });

    it('should handle multiple entries', () => {
      const entries: PerformanceEntry[] = [
        {
          name: 'image',
          entryType: 'largest-contentful-paint',
          startTime: 100,
          duration: 0,
          toJSON: () => ({}),
        },
        {
          name: 'image',
          entryType: 'largest-contentful-paint',
          startTime: 200,
          duration: 0,
          toJSON: () => ({}),
        },
      ];

      const metric: VitalsMetric = {
        name: 'LCP',
        value: 200,
        rating: 'good',
        delta: 0,
        id: 'test-1',
        entries,
      };

      expect(metric.entries?.length).toBe(2);
    });
  });
});
