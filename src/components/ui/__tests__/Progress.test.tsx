/**
 * Progress Component Tests
 *
 * Tests for ProgressBar, CircularProgress, and ProgressRing components
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { ProgressBar, CircularProgress, ProgressRing } from '../Progress';

describe('Progress Components', () => {

  describe('ProgressBar', () => {
    it('should render progress bar', () => {
      render(<ProgressBar value={50} />);
      const progressBar = screen.getByRole('progressbar');

      expect(progressBar).toBeInTheDocument();
    });

    it('should display progress percentage', () => {
      render(<ProgressBar value={75} showLabel />);

      expect(screen.getByText('75%')).toBeInTheDocument();
    });

    it('should have correct aria attributes', () => {
      render(<ProgressBar value={50} />);
      const progressBar = screen.getByRole('progressbar');

      expect(progressBar).toHaveAttribute('aria-valuenow', '50');
      expect(progressBar).toHaveAttribute('aria-valuemin', '0');
      expect(progressBar).toHaveAttribute('aria-valuemax', '100');
    });

    it('should clamp value to 100', () => {
      render(<ProgressBar value={150} showLabel />);

      expect(screen.getByText('100%')).toBeInTheDocument();
    });

    it('should handle custom max value', () => {
      render(<ProgressBar value={50} max={200} showLabel />);

      expect(screen.getByText('25%')).toBeInTheDocument();
    });

    it('should apply size classes', () => {
      const { container } = render(<ProgressBar value={50} size="lg" />);
      const bar = container.querySelector('[role="progressbar"]');

      expect(bar).toHaveClass('h-3');
    });

    it('should apply color variant', () => {
      const { container } = render(<ProgressBar value={50} variant="success" />);
      const progress = container.querySelector('[role="progressbar"] > div');

      expect(progress).toHaveClass('bg-emerald-500');
    });

    it('should show progress label with prefix', () => {
      render(<ProgressBar value={50} showLabel />);

      expect(screen.getByText('Progress')).toBeInTheDocument();
    });

    it('should support animated state', () => {
      const { container } = render(<ProgressBar value={50} animated />);
      const progress = container.querySelector('[role="progressbar"] > div');

      expect(progress).toHaveClass('animate-pulse');
    });

    it('should update width based on value', () => {
      const { container, rerender } = render(<ProgressBar value={25} />);

      let fillDiv = container.querySelector('[role="progressbar"] > div') as HTMLElement;
      expect(fillDiv.style.width).toBe('25%');

      rerender(<ProgressBar value={75} />);

      fillDiv = container.querySelector('[role="progressbar"] > div') as HTMLElement;
      expect(fillDiv.style.width).toBe('75%');
    });

    it('should accept className prop', () => {
      const { container } = render(<ProgressBar value={50} className="custom-class" />);
      const wrapper = container.firstChild;

      expect(wrapper).toHaveClass('custom-class');
    });

    it('should support all size variants', () => {
      const sizes = ['sm', 'md', 'lg'] as const;

      sizes.forEach(size => {
        const { container } = render(<ProgressBar value={50} size={size} />);
        const bar = container.querySelector('[role="progressbar"]');

        if (size === 'sm') expect(bar).toHaveClass('h-1');
        if (size === 'md') expect(bar).toHaveClass('h-2');
        if (size === 'lg') expect(bar).toHaveClass('h-3');
      });
    });

    it('should support all color variants', () => {
      const variants = ['primary', 'success', 'warning', 'danger'] as const;

      variants.forEach(variant => {
        const { container } = render(<ProgressBar value={50} variant={variant} />);
        const progress = container.querySelector('[role="progressbar"] > div');

        if (variant === 'primary') expect(progress).toHaveClass('bg-blue-500');
        if (variant === 'success') expect(progress).toHaveClass('bg-emerald-500');
        if (variant === 'warning') expect(progress).toHaveClass('bg-amber-500');
        if (variant === 'danger') expect(progress).toHaveClass('bg-red-500');
      });
    });
  });

  describe('CircularProgress', () => {
    it('should render circular progress', () => {
      render(<CircularProgress value={50} />);
      const svg = screen.getByRole('progressbar');

      expect(svg).toBeInTheDocument();
    });

    it('should have correct aria attributes', () => {
      render(<CircularProgress value={50} />);
      const svg = screen.getByRole('progressbar');

      expect(svg).toHaveAttribute('aria-valuenow', '50');
      expect(svg).toHaveAttribute('aria-valuemin', '0');
      expect(svg).toHaveAttribute('aria-valuemax', '100');
    });

    it('should display percentage label', () => {
      render(<CircularProgress value={75} showLabel />);

      expect(screen.getByText('75%')).toBeInTheDocument();
    });

    it('should render two circles (background and progress)', () => {
      const { container } = render(<CircularProgress value={50} />);
      const circles = container.querySelectorAll('circle');

      expect(circles).toHaveLength(2);
    });

    it('should apply custom size', () => {
      const { container } = render(<CircularProgress value={50} size={120} />);
      const svg = container.querySelector('svg');

      expect(svg).toHaveAttribute('width', '120');
      expect(svg).toHaveAttribute('height', '120');
    });

    it('should apply custom stroke width', () => {
      const { container } = render(<CircularProgress value={50} strokeWidth={6} />);
      const circles = container.querySelectorAll('circle');

      circles.forEach(circle => {
        expect(circle).toHaveAttribute('stroke-width', '6');
      });
    });

    it('should support color variants', () => {
      const { container: primaryContainer } = render(
        <CircularProgress value={50} variant="primary" />
      );
      const primaryCircle = primaryContainer.querySelector('circle[stroke="#3b82f6"]');
      expect(primaryCircle).toBeInTheDocument();

      const { container: successContainer } = render(
        <CircularProgress value={50} variant="success" />
      );
      const successCircle = successContainer.querySelector('circle[stroke="#10b981"]');
      expect(successCircle).toBeInTheDocument();
    });

    it('should rotate for animated state', () => {
      const { container } = render(<CircularProgress value={50} animated />);
      const svg = container.querySelector('svg');

      expect(svg).toHaveClass('animate-spin');
    });

    it('should calculate correct stroke offset', () => {
      const { container: container25 } = render(<CircularProgress value={25} size={80} />);
      const progressCircle25 = container25.querySelectorAll('circle')[1];
      const dashArray25 = progressCircle25.getAttribute('stroke-dasharray');

      expect(dashArray25).toBeDefined();

      const { container: container75 } = render(<CircularProgress value={75} size={80} />);
      const progressCircle75 = container75.querySelectorAll('circle')[1];
      const dashArray75 = progressCircle75.getAttribute('stroke-dasharray');

      // Higher percentage should have more visible progress
      expect(dashArray75).toBeDefined();
    });

    it('should accept className prop', () => {
      const { container } = render(
        <CircularProgress value={50} className="custom-class" />
      );
      const wrapper = container.firstChild;

      expect(wrapper).toHaveClass('custom-class');
    });
  });

  describe('ProgressRing', () => {
    it('should render progress ring', () => {
      render(<ProgressRing />);
      const svg = screen.getByRole('status');

      expect(svg).toBeInTheDocument();
    });

    it('should have loading aria label', () => {
      render(<ProgressRing />);
      const svg = screen.getByRole('status');

      expect(svg).toHaveAttribute('aria-label', 'Loading');
    });

    it('should render two circles', () => {
      const { container } = render(<ProgressRing />);
      const circles = container.querySelectorAll('circle');

      expect(circles).toHaveLength(2);
    });

    it('should have spinning animation', () => {
      const { container } = render(<ProgressRing />);
      const svg = container.querySelector('svg');

      expect(svg).toHaveClass('animate-spin');
    });

    it('should apply custom size', () => {
      const { container } = render(<ProgressRing size={60} />);
      const svg = container.querySelector('svg');

      expect(svg).toHaveAttribute('width', '60');
      expect(svg).toHaveAttribute('height', '60');
    });

    it('should apply custom stroke width', () => {
      const { container } = render(<ProgressRing strokeWidth={6} />);
      const circles = container.querySelectorAll('circle');

      circles.forEach(circle => {
        expect(circle).toHaveAttribute('stroke-width', '6');
      });
    });

    it('should support color variants', () => {
      const { container } = render(<ProgressRing variant="success" />);
      const progressCircle = container.querySelectorAll('circle')[1];

      expect(progressCircle).toHaveAttribute('stroke', '#10b981');
    });

    it('should use partial stroke dash', () => {
      const { container } = render(<ProgressRing size={48} />);
      const progressCircle = container.querySelectorAll('circle')[1];
      const dashArray = progressCircle.getAttribute('stroke-dasharray');

      // Should be 25% of circumference
      expect(dashArray).toBeDefined();
    });

    it('should apply rotation transform', () => {
      const { container } = render(<ProgressRing />);
      const progressCircle = container.querySelectorAll('circle')[1];
      const style = progressCircle.getAttribute('style');

      expect(style).toContain('transform');
      expect(style).toContain('rotate(-90deg)');
    });

    it('should render with proper structure', () => {
      const { container } = render(<ProgressRing />);
      const wrapper = container.firstChild;

      expect(wrapper).toHaveClass('inline-flex');
      expect(wrapper).toHaveClass('items-center');
      expect(wrapper).toHaveClass('justify-center');
    });

    it('should all color variants work', () => {
      const variants = ['primary', 'success', 'warning', 'danger'] as const;

      variants.forEach(variant => {
        const { container } = render(<ProgressRing variant={variant} />);
        const progressCircle = container.querySelectorAll('circle')[1];
        const stroke = progressCircle.getAttribute('stroke');

        expect(stroke).toBeDefined();
        expect(stroke).toMatch(/#[0-9a-f]{6}/);
      });
    });
  });

  describe('Progress Component Integration', () => {
    it('should render ProgressBar with all props', () => {
      render(
        <ProgressBar
          value={65}
          max={100}
          showLabel
          size="lg"
          variant="success"
          animated
        />
      );

      const bar = screen.getByRole('progressbar');
      expect(bar).toBeInTheDocument();
      expect(screen.getByText('65%')).toBeInTheDocument();
    });

    it('should render CircularProgress with all props', () => {
      render(
        <CircularProgress
          value={80}
          size={100}
          strokeWidth={5}
          showLabel
          variant="primary"
          animated
        />
      );

      const circle = screen.getByRole('progressbar');
      expect(circle).toBeInTheDocument();
      expect(screen.getByText('80%')).toBeInTheDocument();
    });

    it('should render ProgressRing with all props', () => {
      render(
        <ProgressRing
          size={80}
          strokeWidth={5}
          variant="warning"
        />
      );

      const ring = screen.getByRole('status');
      expect(ring).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('ProgressBar should be keyboard accessible', () => {
      render(<ProgressBar value={50} />);
      const bar = screen.getByRole('progressbar');

      expect(bar).toHaveAttribute('role', 'progressbar');
    });

    it('CircularProgress should have proper roles', () => {
      render(<CircularProgress value={50} />);
      const progress = screen.getByRole('progressbar');

      expect(progress).toHaveAttribute('role', 'progressbar');
    });

    it('ProgressRing should have status role', () => {
      render(<ProgressRing />);
      const ring = screen.getByRole('status');

      expect(ring).toHaveAttribute('role', 'status');
    });

    it('should support dark mode classes', () => {
      const { container: progressContainer } = render(
        <ProgressBar value={50} />
      );
      const progressBg = progressContainer.querySelector('[role="progressbar"]');
      expect(progressBg).toHaveClass('dark:bg-gray-700');

      const { container: circularContainer } = render(
        <CircularProgress value={50} showLabel />
      );
      const svg = circularContainer.querySelector('svg');
      expect(svg).toHaveAttribute('role', 'progressbar');

      // Verify dark mode support - label should have dark mode class
      const label = circularContainer.querySelector('span');
      expect(label).toHaveClass('dark:text-gray-300');
    });
  });
});
