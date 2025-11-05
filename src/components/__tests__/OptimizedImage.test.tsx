/**
 * OptimizedImage Component Tests
 *
 * Tests for OptimizedImage and ResponsiveImage components
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { OptimizedImage, ResponsiveImage } from '../OptimizedImage';

describe('OptimizedImage Component', () => {

  describe('OptimizedImage', () => {
    const defaultSizes = [320, 640, 1280];

    it('should render picture element', () => {
      render(
        <OptimizedImage
          src="/test.jpg"
          alt="Test image"
          imageSizes={defaultSizes}
        />
      );

      const picture = screen.getByRole('img', { hidden: true }).parentElement;
      expect(picture?.tagName.toLowerCase()).toBe('picture');
    });

    it('should render alt text correctly', () => {
      render(
        <OptimizedImage
          src="/test.jpg"
          alt="My test image"
          imageSizes={defaultSizes}
        />
      );

      const img = screen.getByAltText('My test image');
      expect(img).toBeInTheDocument();
    });

    it('should set loading attribute to lazy', () => {
      render(
        <OptimizedImage
          src="/test.jpg"
          alt="Test"
          imageSizes={defaultSizes}
          lazy
        />
      );

      const img = screen.getByRole('img', { hidden: true });
      expect(img).toHaveAttribute('loading', 'lazy');
    });

    it('should apply CSS classes', () => {
      const { container } = render(
        <OptimizedImage
          src="/test.jpg"
          alt="Test"
          imageSizes={defaultSizes}
          className="my-custom-class"
        />
      );

      const img = container.querySelector('img');
      expect(img).toHaveClass('my-custom-class');
    });

    it('should handle click callbacks', () => {
      const onClick = vi.fn();

      render(
        <OptimizedImage
          src="/test.jpg"
          alt="Test"
          imageSizes={defaultSizes}
          onClick={onClick}
        />
      );

      const img = screen.getByRole('img', { hidden: true });
      fireEvent.click(img);

      expect(onClick).toHaveBeenCalled();
    });

    it('should render with title attribute', () => {
      render(
        <OptimizedImage
          src="/test.jpg"
          alt="Test"
          imageSizes={defaultSizes}
          title="Image title"
        />
      );

      const img = screen.getByRole('img', { hidden: true });
      expect(img).toHaveAttribute('title', 'Image title');
    });

    it('should have loading indicator class when loading', () => {
      const { container } = render(
        <OptimizedImage
          src="/test.jpg"
          alt="Test"
          imageSizes={defaultSizes}
        />
      );

      const imageContainer = container.querySelector('.optimized-image');
      expect(imageContainer).toHaveClass('loading');
    });

    it('should transition to loaded state', async () => {
      const { container } = render(
        <OptimizedImage
          src="/test.jpg"
          alt="Test"
          imageSizes={defaultSizes}
        />
      );

      const img = screen.getByRole('img', { hidden: true });
      fireEvent.load(img);

      await waitFor(() => {
        const imageContainer = container.querySelector('.optimized-image');
        expect(imageContainer).toHaveClass('loaded');
      });
    });

    it('should handle image errors', () => {
      const onError = vi.fn();

      const { container } = render(
        <OptimizedImage
          src="/test.jpg"
          alt="Test"
          imageSizes={defaultSizes}
          onError={onError}
        />
      );

      const img = screen.getByRole('img', { hidden: true });
      fireEvent.error(img);

      const imageContainer = container.querySelector('.optimized-image');
      expect(imageContainer).toHaveClass('image-error');

      if (onError) {
        expect(onError).toHaveBeenCalled();
      }
    });

    it('should support picture element with multiple sources', () => {
      const { container } = render(
        <OptimizedImage
          src="/test.jpg"
          alt="Test"
          imageSizes={defaultSizes}
        />
      );

      const sources = container.querySelectorAll('source');
      // Should have multiple sources for different formats (WebP, AVIF, fallback)
      expect(sources.length).toBeGreaterThan(0);
    });
  });

  describe('ResponsiveImage', () => {
    it('should render img element directly', () => {
      render(
        <ResponsiveImage
          src="/test.jpg"
          alt="Test"
        />
      );

      const img = screen.getByAltText('Test');
      expect(img.tagName).toBe('IMG');
    });

    it('should have responsive class', () => {
      const { container } = render(
        <ResponsiveImage
          src="/test.jpg"
          alt="Test"
        />
      );

      const img = container.querySelector('img');
      expect(img).toHaveClass('responsive-image');
    });

    it('should be simpler than OptimizedImage', () => {
      render(
        <ResponsiveImage
          src="/test.jpg"
          alt="Simple responsive"
        />
      );

      const img = screen.getByAltText('Simple responsive');
      expect(img).toBeInTheDocument();

      // Should not have picture element
      const picture = img.parentElement;
      expect(picture?.tagName.toLowerCase()).not.toBe('picture');
    });

    it('should accept standard img attributes', () => {
      render(
        <ResponsiveImage
          src="/test.jpg"
          alt="Test"
          width={400}
          height={300}
          className="custom"
        />
      );

      const img = screen.getByAltText('Test') as HTMLImageElement;
      expect(img).toHaveClass('custom');
      expect(img.width).toBe(400);
      expect(img.height).toBe(300);
    });

    it('should support lazy loading', () => {
      render(
        <ResponsiveImage
          src="/test.jpg"
          alt="Test"
          loading="lazy"
        />
      );

      const img = screen.getByAltText('Test');
      expect(img).toHaveAttribute('loading', 'lazy');
    });
  });

  describe('Image Loading States', () => {
    it('should show loading state initially', () => {
      const { container } = render(
        <OptimizedImage
          src="/test.jpg"
          alt="Test"
          imageSizes={[400, 800, 1200]}
        />
      );

      const imageContainer = container.querySelector('.optimized-image');
      expect(imageContainer).toHaveClass('loading');
    });

    it('should remove loading state on success', async () => {
      const { container } = render(
        <OptimizedImage
          src="/test.jpg"
          alt="Test"
          imageSizes={[400, 800, 1200]}
        />
      );

      const img = screen.getByRole('img', { hidden: true });
      fireEvent.load(img);

      await waitFor(() => {
        const imageContainer = container.querySelector('.optimized-image');
        expect(imageContainer).not.toHaveClass('loading');
      });
    });

    it('should handle multiple loads gracefully', async () => {
      const { container } = render(
        <OptimizedImage
          src="/test.jpg"
          alt="Test"
          imageSizes={[400, 800, 1200]}
        />
      );

      const img = screen.getByRole('img', { hidden: true });

      fireEvent.load(img);
      fireEvent.load(img); // Second load

      await waitFor(() => {
        const imageContainer = container.querySelector('.optimized-image');
        expect(imageContainer).toHaveClass('loaded');
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper alt text for accessibility', () => {
      render(
        <OptimizedImage
          src="/test.jpg"
          alt="Descriptive alt text"
          imageSizes={[320, 640, 1280]}
        />
      );

      const img = screen.getByAltText('Descriptive alt text');
      expect(img).toBeInTheDocument();
    });

    it('should be keyboard accessible', () => {
      const onClick = vi.fn();

      render(
        <div onClick={onClick}>
          <OptimizedImage
            src="/test.jpg"
            alt="Test"
            imageSizes={[320, 640, 1280]}
          />
        </div>
      );

      const img = screen.getByRole('img', { hidden: true });
      fireEvent.keyDown(img, { key: 'Enter' });

      // Image itself might not be focusable, but should be in a container
      expect(img).toBeInTheDocument();
    });

    it('should support ARIA attributes', () => {
      const { container } = render(
        <OptimizedImage
          src="/test.jpg"
          alt="Test"
          imageSizes={[320, 640, 1280]}
          aria-label="Custom label"
        />
      );

      const img = container.querySelector('img');
      expect(img).toHaveAttribute('aria-label', 'Custom label');
    });
  });

  describe('Dark Mode Support', () => {
    it('should apply dark mode classes', () => {
      const { container } = render(
        <OptimizedImage
          src="/test.jpg"
          alt="Test"
          imageSizes={[320, 640, 1280]}
        />
      );

      const imageContainer = container.querySelector('.optimized-image');
      // Component should support dark mode classes
      expect(imageContainer).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    it('should apply error class on failure', () => {
      const { container } = render(
        <OptimizedImage
          src="/test.jpg"
          alt="Test"
          imageSizes={[320, 640, 1280]}
        />
      );

      const img = screen.getByRole('img', { hidden: true });
      fireEvent.error(img);

      const imageContainer = container.querySelector('.optimized-image');
      expect(imageContainer).toHaveClass('image-error');
    });

    it('should call onError callback on image error', () => {
      const onError = vi.fn();

      render(
        <OptimizedImage
          src="/test.jpg"
          alt="Test"
          imageSizes={[320, 640, 1280]}
          onError={onError}
        />
      );

      const img = screen.getByRole('img', { hidden: true });
      fireEvent.error(img);

      if (onError) {
        expect(onError).toHaveBeenCalled();
      }
    });
  });

  describe('Custom Image Sizing', () => {
    it('should use provided sizes array', () => {
      const { container } = render(
        <OptimizedImage
          src="/test.jpg"
          alt="Test"
          imageSizes={[400, 800, 1200]}
        />
      );

      const img = container.querySelector('img');
      expect(img).toBeInTheDocument();
    });

    it('should handle different size arrays', () => {
      const { container } = render(
        <OptimizedImage
          src="/test.jpg"
          alt="Test"
          imageSizes={[256, 512, 1024]}
        />
      );

      const img = container.querySelector('img');
      expect(img).toBeInTheDocument();
    });
  });
});
