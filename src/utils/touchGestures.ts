/**
 * Touch Gesture Utilities
 *
 * Optimized touch event handling for mobile devices
 * Supports: tap, double-tap, long-press, swipe, pinch
 */

import React from 'react';

export interface TouchPoint {
  x: number;
  y: number;
  timestamp: number;
}

export interface GestureCallbacks {
  onTap?: (point: TouchPoint) => void;
  onDoubleTap?: (point: TouchPoint) => void;
  onLongPress?: (point: TouchPoint) => void;
  onSwipeLeft?: (distance: number) => void;
  onSwipeRight?: (distance: number) => void;
  onSwipeUp?: (distance: number) => void;
  onSwipeDown?: (distance: number) => void;
  onPinch?: (scale: number) => void;
}

/**
 * Touch gesture detector
 * Handles multiple touch interactions with debouncing
 */
export class TouchGestureDetector {
  private element: HTMLElement;
  private callbacks: GestureCallbacks;
  private touchStartPoint: TouchPoint | null = null;
  private longPressTimer: ReturnType<typeof setTimeout> | null = null;
  private lastTapTime = 0;
  private lastTapPoint: TouchPoint | null = null;
  private doubleTapDelay = 300; // ms
  private longPressDuration = 500; // ms
  private swipeThreshold = 50; // px
  private pinchStartDistance = 0;

  constructor(element: HTMLElement, callbacks: GestureCallbacks = {}) {
    this.element = element;
    this.callbacks = callbacks;
    this.attachListeners();
  }

  private attachListeners(): void {
    // Passive listeners for better performance
    this.element.addEventListener('touchstart', this.handleTouchStart.bind(this), {
      passive: false,
    });
    this.element.addEventListener('touchmove', this.handleTouchMove.bind(this), {
      passive: false,
    });
    this.element.addEventListener('touchend', this.handleTouchEnd.bind(this), {
      passive: false,
    });

    // Prevent double-tap zoom on iOS
    this.element.addEventListener('touchend', (e) => {
      if (e.touches.length === 0) {
        e.preventDefault();
      }
    }, false);
  }

  private handleTouchStart(event: TouchEvent): void {
    const touch = event.touches[0];
    if (!touch) return;

    this.touchStartPoint = {
      x: touch.clientX,
      y: touch.clientY,
      timestamp: Date.now(),
    };

    // Detect long press
    this.longPressTimer = setTimeout(() => {
      if (this.touchStartPoint && this.callbacks.onLongPress) {
        this.callbacks.onLongPress(this.touchStartPoint);
      }
    }, this.longPressDuration);

    // Detect pinch start
    if (event.touches.length === 2) {
      const touch1 = event.touches[0];
      const touch2 = event.touches[1];
      this.pinchStartDistance = this.getDistance(
        { x: touch1.clientX, y: touch1.clientY },
        { x: touch2.clientX, y: touch2.clientY }
      );
    }
  }

  private handleTouchMove(event: TouchEvent): void {
    // Clear long press timer on move
    if (this.longPressTimer) {
      clearTimeout(this.longPressTimer);
      this.longPressTimer = null;
    }

    // Handle pinch
    if (event.touches.length === 2) {
      const touch1 = event.touches[0];
      const touch2 = event.touches[1];
      const currentDistance = this.getDistance(
        { x: touch1.clientX, y: touch1.clientY },
        { x: touch2.clientX, y: touch2.clientY }
      );

      if (this.callbacks.onPinch && this.pinchStartDistance > 0) {
        const scale = currentDistance / this.pinchStartDistance;
        this.callbacks.onPinch(scale);
      }
    }
  }

  private handleTouchEnd(event: TouchEvent): void {
    // Clear long press timer
    if (this.longPressTimer) {
      clearTimeout(this.longPressTimer);
      this.longPressTimer = null;
    }

    if (!this.touchStartPoint) return;

    const endPoint: TouchPoint = {
      x: event.changedTouches[0]?.clientX || this.touchStartPoint.x,
      y: event.changedTouches[0]?.clientY || this.touchStartPoint.y,
      timestamp: Date.now(),
    };

    const distance = this.getDistance(this.touchStartPoint, endPoint);
    const duration = endPoint.timestamp - this.touchStartPoint.timestamp;

    // Detect tap (short touch with minimal movement)
    if (distance < this.swipeThreshold && duration < 200) {
      this.detectTap(this.touchStartPoint);
    } else if (distance >= this.swipeThreshold && duration < 300) {
      // Detect swipe
      this.detectSwipe(this.touchStartPoint, endPoint);
    }

    this.touchStartPoint = null;
    this.pinchStartDistance = 0;
  }

  private detectTap(startPoint: TouchPoint): void {
    const now = Date.now();
    const isDoubleTap =
      this.lastTapPoint &&
      now - this.lastTapTime < this.doubleTapDelay &&
      this.getDistance(startPoint, this.lastTapPoint) < this.swipeThreshold;

    if (isDoubleTap && this.callbacks.onDoubleTap) {
      this.callbacks.onDoubleTap(startPoint);
      this.lastTapTime = 0; // Reset to prevent triple-tap
    } else if (this.callbacks.onTap) {
      this.callbacks.onTap(startPoint);
      this.lastTapTime = now;
      this.lastTapPoint = startPoint;
    }
  }

  private detectSwipe(startPoint: TouchPoint, endPoint: TouchPoint): void {
    const deltaX = endPoint.x - startPoint.x;
    const deltaY = endPoint.y - startPoint.y;
    const absDeltaX = Math.abs(deltaX);
    const absDeltaY = Math.abs(deltaY);

    // Determine primary swipe direction
    if (absDeltaX > absDeltaY) {
      // Horizontal swipe
      if (deltaX > this.swipeThreshold && this.callbacks.onSwipeRight) {
        this.callbacks.onSwipeRight(absDeltaX);
      } else if (deltaX < -this.swipeThreshold && this.callbacks.onSwipeLeft) {
        this.callbacks.onSwipeLeft(absDeltaX);
      }
    } else {
      // Vertical swipe
      if (deltaY > this.swipeThreshold && this.callbacks.onSwipeDown) {
        this.callbacks.onSwipeDown(absDeltaY);
      } else if (deltaY < -this.swipeThreshold && this.callbacks.onSwipeUp) {
        this.callbacks.onSwipeUp(absDeltaY);
      }
    }
  }

  private getDistance(point1: { x: number; y: number }, point2: { x: number; y: number }): number {
    const dx = point2.x - point1.x;
    const dy = point2.y - point1.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  /**
   * Clean up event listeners
   */
  public destroy(): void {
    this.element.removeEventListener('touchstart', this.handleTouchStart.bind(this));
    this.element.removeEventListener('touchmove', this.handleTouchMove.bind(this));
    this.element.removeEventListener('touchend', this.handleTouchEnd.bind(this));

    if (this.longPressTimer) {
      clearTimeout(this.longPressTimer);
    }
  }
}

/**
 * React Hook for touch gesture detection
 */
export function useTouchGestures(
  ref: React.RefObject<HTMLElement>,
  callbacks: GestureCallbacks
): void {
  React.useEffect(() => {
    if (!ref.current) return;

    const detector = new TouchGestureDetector(ref.current, callbacks);

    return () => {
      detector.destroy();
    };
  }, [ref, callbacks]);
}

/**
 * Utility function to prevent iOS zoom on double-tap
 */
export function disableIOSZoom(element: HTMLElement): void {
  element.addEventListener('touchstart', (e) => {
    if (e.touches.length > 1) {
      e.preventDefault();
    }
  }, { passive: false });

  let lastTouchEnd = 0;
  element.addEventListener('touchend', (e) => {
    const now = Date.now();
    if (now - lastTouchEnd <= 300) {
      e.preventDefault();
    }
    lastTouchEnd = now;
  }, false);
}

/**
 * Utility function to enable haptic feedback
 */
export function triggerHaptic(pattern: 'light' | 'medium' | 'heavy' = 'medium'): void {
  if (!navigator.vibrate) return;

  const patterns: Record<string, number | number[]> = {
    light: 10,
    medium: 20,
    heavy: 30,
  };

  navigator.vibrate(patterns[pattern] || 20);
}

/**
 * Gesture detection configuration
 */
export const GESTURE_CONFIG = {
  DOUBLE_TAP_DELAY: 300,
  LONG_PRESS_DURATION: 500,
  SWIPE_THRESHOLD: 50,
  MIN_SWIPE_DURATION: 300,
  MAX_SWIPE_DURATION: 1000,
} as const;
