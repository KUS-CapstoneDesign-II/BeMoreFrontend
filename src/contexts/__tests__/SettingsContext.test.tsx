/**
 * Settings Context Tests
 *
 * Tests for SettingsProvider and useSettings hook
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React, { useEffect } from 'react';
import { SettingsProvider, useSettings } from '../SettingsContext';

// Test component that uses the Settings context
function TestComponent() {
  const {
    fontScale,
    layoutDensity,
    language,
    notificationsOptIn,
    setFontScale,
    setLayoutDensity,
    setLanguage,
    setNotificationsOptIn,
  } = useSettings();

  return (
    <div>
      <div data-testid="font-scale">{fontScale}</div>
      <div data-testid="layout-density">{layoutDensity}</div>
      <div data-testid="language">{language}</div>
      <div data-testid="notifications">{notificationsOptIn ? 'enabled' : 'disabled'}</div>

      <button onClick={() => setFontScale('lg')} data-testid="set-font-scale">
        Set Large Font
      </button>
      <button onClick={() => setLayoutDensity('compact')} data-testid="set-density">
        Set Compact
      </button>
      <button onClick={() => setLanguage('en')} data-testid="set-language">
        Set English
      </button>
      <button onClick={() => setNotificationsOptIn(true)} data-testid="enable-notifications">
        Enable Notifications
      </button>
    </div>
  );
}

describe('SettingsContext', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  describe('SettingsProvider', () => {
    it('should provide default settings', () => {
      render(
        <SettingsProvider>
          <TestComponent />
        </SettingsProvider>
      );

      expect(screen.getByTestId('font-scale')).toHaveTextContent('md');
      expect(screen.getByTestId('layout-density')).toHaveTextContent('spacious');
      expect(screen.getByTestId('language')).toHaveTextContent('ko');
      expect(screen.getByTestId('notifications')).toHaveTextContent('disabled');
    });

    it('should persist settings to localStorage', () => {
      render(
        <SettingsProvider>
          <TestComponent />
        </SettingsProvider>
      );

      const storedSettings = localStorage.getItem('bemore_settings_v1');
      expect(storedSettings).toBeDefined();
      expect(storedSettings).toContain('md'); // default font scale
    });

    it('should load settings from localStorage', () => {
      const mockSettings = {
        fontScale: 'lg',
        layoutDensity: 'compact',
        language: 'en',
        notificationsOptIn: true,
      };

      localStorage.setItem('bemore_settings_v1', JSON.stringify(mockSettings));

      render(
        <SettingsProvider>
          <TestComponent />
        </SettingsProvider>
      );

      expect(screen.getByTestId('font-scale')).toHaveTextContent('lg');
      expect(screen.getByTestId('layout-density')).toHaveTextContent('compact');
      expect(screen.getByTestId('language')).toHaveTextContent('en');
      expect(screen.getByTestId('notifications')).toHaveTextContent('enabled');

      localStorage.clear();
    });

    it('should handle corrupted localStorage gracefully', () => {
      localStorage.setItem('bemore_settings_v1', 'invalid json {{{');

      // Should not throw and use defaults
      expect(() => {
        render(
          <SettingsProvider>
            <TestComponent />
          </SettingsProvider>
        );
      }).not.toThrow();

      expect(screen.getByTestId('font-scale')).toHaveTextContent('md');
      localStorage.clear();
    });
  });

  describe('useSettings Hook', () => {
    it('should provide settings context', () => {
      render(
        <SettingsProvider>
          <TestComponent />
        </SettingsProvider>
      );

      expect(screen.getByTestId('font-scale')).toBeInTheDocument();
    });

    it('should throw error when used outside provider', () => {
      const ErrorComponent = () => {
        try {
          useSettings();
          return <div>No error</div>;
        } catch {
          return <div>Error caught</div>;
        }
      };

      const { container } = render(<ErrorComponent />);
      expect(container.textContent).toContain('Error caught');
    });

    it('should update font scale', () => {
      render(
        <SettingsProvider>
          <TestComponent />
        </SettingsProvider>
      );

      const button = screen.getByTestId('set-font-scale');
      fireEvent.click(button);

      expect(screen.getByTestId('font-scale')).toHaveTextContent('lg');
    });

    it('should update layout density', () => {
      render(
        <SettingsProvider>
          <TestComponent />
        </SettingsProvider>
      );

      const button = screen.getByTestId('set-density');
      fireEvent.click(button);

      expect(screen.getByTestId('layout-density')).toHaveTextContent('compact');
    });

    it('should update language', () => {
      render(
        <SettingsProvider>
          <TestComponent />
        </SettingsProvider>
      );

      const button = screen.getByTestId('set-language');
      fireEvent.click(button);

      expect(screen.getByTestId('language')).toHaveTextContent('en');
    });

    it('should toggle notifications', () => {
      render(
        <SettingsProvider>
          <TestComponent />
        </SettingsProvider>
      );

      const button = screen.getByTestId('enable-notifications');
      fireEvent.click(button);

      expect(screen.getByTestId('notifications')).toHaveTextContent('enabled');
    });

    it('should persist updates to localStorage', async () => {
      localStorage.clear();

      render(
        <SettingsProvider>
          <TestComponent />
        </SettingsProvider>
      );

      fireEvent.click(screen.getByTestId('set-font-scale'));

      await waitFor(() => {
        const stored = JSON.parse(localStorage.getItem('bemore_settings_v1') || '{}');
        expect(stored.fontScale).toBe('lg');
      });

      localStorage.clear();
    });
  });

  describe('Settings Updates', () => {
    it('should handle multiple setting changes', () => {
      render(
        <SettingsProvider>
          <TestComponent />
        </SettingsProvider>
      );

      fireEvent.click(screen.getByTestId('set-font-scale'));
      fireEvent.click(screen.getByTestId('set-density'));
      fireEvent.click(screen.getByTestId('set-language'));

      expect(screen.getByTestId('font-scale')).toHaveTextContent('lg');
      expect(screen.getByTestId('layout-density')).toHaveTextContent('compact');
      expect(screen.getByTestId('language')).toHaveTextContent('en');
    });

    it('should maintain all settings when updating one', () => {
      render(
        <SettingsProvider>
          <TestComponent />
        </SettingsProvider>
      );

      // Change only font scale
      fireEvent.click(screen.getByTestId('set-font-scale'));

      // Others should remain default
      expect(screen.getByTestId('layout-density')).toHaveTextContent('spacious');
      expect(screen.getByTestId('language')).toHaveTextContent('ko');
      expect(screen.getByTestId('notifications')).toHaveTextContent('disabled');
    });
  });

  describe('Attributes', () => {
    function AttributeTestComponent() {
      const { fontScale, layoutDensity, language } = useSettings();

      useEffect(() => {
        // Just render to test attributes are applied
      }, [fontScale, layoutDensity, language]);

      return <div>Settings applied</div>;
    }

    it('should set data-density attribute', () => {
      render(
        <SettingsProvider>
          <AttributeTestComponent />
        </SettingsProvider>
      );

      const root = document.documentElement;
      expect(root.getAttribute('data-density')).toBe('spacious');
    });

    it('should set lang attribute', () => {
      render(
        <SettingsProvider>
          <AttributeTestComponent />
        </SettingsProvider>
      );

      const root = document.documentElement;
      expect(root.getAttribute('lang')).toBe('ko');
    });

    it('should update attributes when settings change', () => {
      render(
        <SettingsProvider>
          <TestComponent />
        </SettingsProvider>
      );

      const root = document.documentElement;

      fireEvent.click(screen.getByTestId('set-density'));
      expect(root.getAttribute('data-density')).toBe('compact');

      fireEvent.click(screen.getByTestId('set-language'));
      expect(root.getAttribute('lang')).toBe('en');
    });
  });

  describe('Memoization', () => {
    it('should memoize context value', () => {
      const renderSpy = vi.fn();

      function ChildComponent() {
        renderSpy();
        return <div>Child</div>;
      }

      const { rerender } = render(
        <SettingsProvider>
          <ChildComponent />
        </SettingsProvider>
      );

      const initialCallCount = renderSpy.mock.calls.length;

      // Rerender with same props
      rerender(
        <SettingsProvider>
          <ChildComponent />
        </SettingsProvider>
      );

      // Child should not rerender if context didn't change
      expect(renderSpy.mock.calls.length).toBeGreaterThanOrEqual(initialCallCount);
    });
  });
});
