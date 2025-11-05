/**
 * Performance Reporting Tests
 *
 * Tests for performance metrics collection, reporting, and analysis
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PerformanceReportingManager } from '../performanceReporting';
import type { VitalsMetric } from '../webVitals';

describe('PerformanceReportingManager', () => {

  let manager: PerformanceReportingManager;

  beforeEach(() => {
    manager = new PerformanceReportingManager();
  });

  describe('Initialization', () => {
    it('should initialize with default thresholds', () => {
      const summary = manager.getSummary();

      expect(summary).toHaveProperty('totalMetrics');
      expect(summary).toHaveProperty('goodMetrics');
      expect(summary).toHaveProperty('improvementNeeded');
      expect(summary).toHaveProperty('poorMetrics');
    });

    it('should allow custom thresholds', () => {
      const customManager = new PerformanceReportingManager({
        LCP: { warning: 3000, critical: 5000 },
      });

      expect(customManager).toBeDefined();
    });

    it('should initialize with empty metrics', () => {
      const summary = manager.getSummary();

      expect(summary.totalMetrics).toBe(0);
      expect(summary.goodMetrics).toBe(0);
      expect(summary.improvementNeeded).toBe(0);
      expect(summary.poorMetrics).toBe(0);
    });
  });

  describe('Recording Metrics', () => {
    it('should record a metric', () => {
      const metric: VitalsMetric = {
        name: 'LCP',
        value: 2000,
        rating: 'good',
        delta: 0,
        id: 'test-1',
      };

      manager.recordMetric(metric);

      const summary = manager.getSummary();
      expect(summary.totalMetrics).toBe(1);
    });

    it('should record multiple metrics', () => {
      const metrics: VitalsMetric[] = [
        { name: 'LCP', value: 2000, rating: 'good', delta: 0, id: 'test-1' },
        { name: 'FID', value: 50, rating: 'good', delta: 0, id: 'test-2' },
        { name: 'CLS', value: 0.05, rating: 'good', delta: 0, id: 'test-3' },
      ];

      metrics.forEach(m => manager.recordMetric(m));

      const summary = manager.getSummary();
      expect(summary.totalMetrics).toBe(3);
      expect(summary.goodMetrics).toBe(3);
    });

    it('should update existing metric', () => {
      const metric1: VitalsMetric = {
        name: 'LCP',
        value: 2000,
        rating: 'good',
        delta: 0,
        id: 'test-1',
      };

      const metric2: VitalsMetric = {
        name: 'LCP',
        value: 2200,
        rating: 'good',
        delta: 200,
        id: 'test-2',
      };

      manager.recordMetric(metric1);
      manager.recordMetric(metric2);

      const summary = manager.getSummary();
      expect(summary.totalMetrics).toBe(1); // Same metric name, updated
    });
  });

  describe('Threshold Checking', () => {
    it('should identify warning thresholds', () => {
      const metric: VitalsMetric = {
        name: 'LCP',
        value: 3000, // Between good and critical
        rating: 'needs-improvement',
        delta: 0,
        id: 'test-1',
      };

      // Should log warning
      const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      manager.recordMetric(metric);

      expect(spy).toHaveBeenCalled();
      spy.mockRestore();
    });

    it('should identify critical thresholds', () => {
      const metric: VitalsMetric = {
        name: 'LCP',
        value: 5000, // Above critical
        rating: 'poor',
        delta: 0,
        id: 'test-1',
      };

      const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      manager.recordMetric(metric);

      expect(spy).toHaveBeenCalled();
      spy.mockRestore();
    });

    it('should not warn for good metrics', () => {
      const metric: VitalsMetric = {
        name: 'LCP',
        value: 2000,
        rating: 'good',
        delta: 0,
        id: 'test-1',
      };

      const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      manager.recordMetric(metric);

      // Should not warn for good metrics
      expect(spy).not.toHaveBeenCalled();
      spy.mockRestore();
    });
  });

  describe('Report Generation', () => {
    it('should generate a report', () => {
      const metric: VitalsMetric = {
        name: 'LCP',
        value: 2000,
        rating: 'good',
        delta: 0,
        id: 'test-1',
      };

      manager.recordMetric(metric);
      const report = manager.generateReport();

      expect(report).toHaveProperty('timestamp');
      expect(report).toHaveProperty('url');
      expect(report).toHaveProperty('metrics');
      expect(report).toHaveProperty('navigation');
      expect(report).toHaveProperty('resources');
    });

    it('should include metrics in report', () => {
      const metric: VitalsMetric = {
        name: 'LCP',
        value: 2000,
        rating: 'good',
        delta: 0,
        id: 'test-1',
      };

      manager.recordMetric(metric);
      const report = manager.generateReport();

      expect(report.metrics).toHaveProperty('LCP');
      expect(report.metrics.LCP).toEqual(metric);
    });

    it('should include current URL in report', () => {
      manager.recordMetric({
        name: 'LCP',
        value: 2000,
        rating: 'good',
        delta: 0,
        id: 'test-1',
      });

      const report = manager.generateReport();

      expect(report.url).toBeDefined();
      expect(typeof report.url).toBe('string');
    });

    it('should have valid timestamp', () => {
      manager.recordMetric({
        name: 'LCP',
        value: 2000,
        rating: 'good',
        delta: 0,
        id: 'test-1',
      });

      const report = manager.generateReport();

      expect(report.timestamp).toBeGreaterThan(0);
      expect(report.timestamp).toBeLessThanOrEqual(Date.now() + 1000); // Allow 1s margin
    });
  });

  describe('Report Storage', () => {
    it('should store reports', () => {
      manager.recordMetric({
        name: 'LCP',
        value: 2000,
        rating: 'good',
        delta: 0,
        id: 'test-1',
      });

      manager.generateReport();
      const reports = manager.getReports(10);

      expect(reports.length).toBeGreaterThan(0);
    });

    it('should limit stored reports', () => {
      // Generate more than max reports
      for (let i = 0; i < 60; i++) {
        manager.recordMetric({
          name: 'LCP',
          value: 2000,
          rating: 'good',
          delta: 0,
          id: `test-${i}`,
        });
        manager.generateReport();
      }

      // Should keep max 50 reports
      const reports = manager.getReports(100);
      expect(reports.length).toBeLessThanOrEqual(50);
    });

    it('should return reports in reverse order', () => {
      for (let i = 0; i < 3; i++) {
        manager.recordMetric({
          name: 'LCP',
          value: 2000 + i * 100,
          rating: 'good',
          delta: 0,
          id: `test-${i}`,
        });
        manager.generateReport();
      }

      const reports = manager.getReports(3);
      expect(reports.length).toBe(3);

      // Most recent first
      expect(reports[0].timestamp).toBeGreaterThanOrEqual(reports[1].timestamp);
    });
  });

  describe('Summary Statistics', () => {
    it('should provide summary', () => {
      const metrics: VitalsMetric[] = [
        { name: 'LCP', value: 2000, rating: 'good', delta: 0, id: 'test-1' },
        { name: 'FID', value: 3000, rating: 'needs-improvement', delta: 0, id: 'test-2' },
        { name: 'CLS', value: 0.3, rating: 'poor', delta: 0, id: 'test-3' },
      ];

      metrics.forEach(m => manager.recordMetric(m));

      const summary = manager.getSummary();

      expect(summary.totalMetrics).toBe(3);
      expect(summary.goodMetrics).toBe(1);
      expect(summary.improvementNeeded).toBe(1);
      expect(summary.poorMetrics).toBe(1);
    });

    it('should calculate average rating', () => {
      const metrics: VitalsMetric[] = [
        { name: 'LCP', value: 2000, rating: 'good', delta: 0, id: 'test-1' },
        { name: 'FID', value: 2000, rating: 'good', delta: 0, id: 'test-2' },
      ];

      metrics.forEach(m => manager.recordMetric(m));

      const summary = manager.getSummary();

      expect(summary.averageRating).toBe('100.0');
    });

    it('should handle 0 metrics in summary', () => {
      const summary = manager.getSummary();

      expect(summary.averageRating).toBe('N/A');
    });
  });

  describe('Trend Analysis', () => {
    it('should analyze trend for metric', () => {
      // Add multiple reports with different LCP values
      const values = [2500, 2400, 2300, 2200, 2100];

      values.forEach((value, idx) => {
        manager.recordMetric({
          name: 'LCP',
          value,
          rating: 'good',
          delta: 0,
          id: `test-${idx}`,
        });
        manager.generateReport();
      });

      const trend = manager.analyzeTrend('LCP', 5);

      expect(trend).toHaveProperty('improving');
      expect(trend).toHaveProperty('average');
      expect(typeof trend.improving).toBe('boolean');
      expect(typeof trend.average).toBe('number');
    });

    it('should detect improving trend', () => {
      const values = [3000, 2800, 2600, 2400, 2200];

      values.forEach((value, idx) => {
        manager.recordMetric({
          name: 'LCP',
          value,
          rating: 'good',
          delta: 0,
          id: `test-${idx}`,
        });
        manager.generateReport();
      });

      const trend = manager.analyzeTrend('LCP', 5);

      expect(trend.improving).toBe(true);
    });

    it('should detect degrading trend', () => {
      const values = [2000, 2200, 2400, 2600, 2800];

      values.forEach((value, idx) => {
        manager.recordMetric({
          name: 'LCP',
          value,
          rating: 'good',
          delta: 0,
          id: `test-${idx}`,
        });
        manager.generateReport();
      });

      const trend = manager.analyzeTrend('LCP', 5);

      expect(trend.improving).toBe(false);
    });

    it('should calculate average in trend', () => {
      const values = [2000, 3000, 4000];

      values.forEach((value, idx) => {
        manager.recordMetric({
          name: 'LCP',
          value,
          rating: 'good',
          delta: 0,
          id: `test-${idx}`,
        });
        manager.generateReport();
      });

      const trend = manager.analyzeTrend('LCP', 3);

      expect(trend.average).toBe(3000);
    });

    it('should handle insufficient data', () => {
      manager.recordMetric({
        name: 'LCP',
        value: 2000,
        rating: 'good',
        delta: 0,
        id: 'test-1',
      });
      manager.generateReport();

      const trend = manager.analyzeTrend('LCP', 5);

      expect(trend.improving).toBe(false);
      expect(trend.average).toBe(0);
    });
  });

  describe('Data Export', () => {
    it('should export data as JSON', () => {
      manager.recordMetric({
        name: 'LCP',
        value: 2000,
        rating: 'good',
        delta: 0,
        id: 'test-1',
      });

      const json = manager.exportData();

      expect(typeof json).toBe('string');
      expect(() => JSON.parse(json)).not.toThrow();
    });

    it('should include reports in export', () => {
      manager.recordMetric({
        name: 'LCP',
        value: 2000,
        rating: 'good',
        delta: 0,
        id: 'test-1',
      });
      manager.generateReport();

      const json = manager.exportData();
      const data = JSON.parse(json);

      expect(data).toHaveProperty('reports');
      expect(Array.isArray(data.reports)).toBe(true);
    });

    it('should include summary in export', () => {
      manager.recordMetric({
        name: 'LCP',
        value: 2000,
        rating: 'good',
        delta: 0,
        id: 'test-1',
      });

      const json = manager.exportData();
      const data = JSON.parse(json);

      expect(data).toHaveProperty('summary');
      expect(data.summary).toHaveProperty('totalMetrics');
    });
  });

  describe('Clear/Reset', () => {
    it('should clear all data', () => {
      manager.recordMetric({
        name: 'LCP',
        value: 2000,
        rating: 'good',
        delta: 0,
        id: 'test-1',
      });

      manager.clear();

      const summary = manager.getSummary();
      expect(summary.totalMetrics).toBe(0);
    });

    it('should clear reports', () => {
      manager.recordMetric({
        name: 'LCP',
        value: 2000,
        rating: 'good',
        delta: 0,
        id: 'test-1',
      });
      manager.generateReport();

      manager.clear();

      const reports = manager.getReports();
      expect(reports.length).toBe(0);
    });

    it('should allow recording after clear', () => {
      manager.recordMetric({
        name: 'LCP',
        value: 2000,
        rating: 'good',
        delta: 0,
        id: 'test-1',
      });

      manager.clear();

      manager.recordMetric({
        name: 'FID',
        value: 50,
        rating: 'good',
        delta: 0,
        id: 'test-2',
      });

      const summary = manager.getSummary();
      expect(summary.totalMetrics).toBe(1);
    });
  });
});
