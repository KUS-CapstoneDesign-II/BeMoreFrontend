import React from 'react';

/**
 * Progress Component
 *
 * Linear and circular progress indicators with customizable appearance
 * - Linear progress for sequential operations
 * - Circular progress for indeterminate/percentage-based progress
 * - Dark mode support
 * - Accessibility compliant (aria-valuenow, aria-valuemax)
 */

interface ProgressBarProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Progress percentage (0-100) */
  value: number;
  /** Maximum value (default: 100) */
  max?: number;
  /** Show percentage text */
  showLabel?: boolean;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Color variant */
  variant?: 'primary' | 'success' | 'warning' | 'danger';
  /** Animated (indeterminate progress) */
  animated?: boolean;
}

/**
 * Linear Progress Bar Component
 *
 * @example
 * ```tsx
 * <ProgressBar value={75} showLabel />
 * <ProgressBar value={100} variant="success" />
 * <ProgressBar animated size="lg" />
 * ```
 */
export function ProgressBar({
  value,
  max = 100,
  showLabel = false,
  size = 'md',
  variant = 'primary',
  animated = false,
  className = '',
  ...props
}: ProgressBarProps) {
  const percentage = Math.min((value / max) * 100, 100);

  const sizeClasses = {
    sm: 'h-1',
    md: 'h-2',
    lg: 'h-3'
  };

  const variantClasses = {
    primary: 'bg-blue-500 dark:bg-blue-400',
    success: 'bg-emerald-500 dark:bg-emerald-400',
    warning: 'bg-amber-500 dark:bg-amber-400',
    danger: 'bg-red-500 dark:bg-red-400'
  };

  return (
    <div className={`w-full ${className}`} {...props}>
      {showLabel && (
        <div className="flex justify-between mb-1">
          <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
            Progress
          </span>
          <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
            {Math.round(percentage)}%
          </span>
        </div>
      )}
      <div
        className={`w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden ${sizeClasses[size]}`}
        role="progressbar"
        aria-valuenow={Math.round(percentage)}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className={`${variantClasses[variant]} ${sizeClasses[size]} rounded-full transition-all duration-300 ${
            animated ? 'animate-pulse' : ''
          }`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

interface CircularProgressProps extends React.SVGAttributes<SVGSVGElement> {
  /** Progress percentage (0-100) */
  value: number;
  /** Circle size in pixels */
  size?: number;
  /** Stroke width */
  strokeWidth?: number;
  /** Show percentage text */
  showLabel?: boolean;
  /** Color variant */
  variant?: 'primary' | 'success' | 'warning' | 'danger';
  /** Animated (indeterminate progress) */
  animated?: boolean;
}

/**
 * Circular Progress Component
 *
 * @example
 * ```tsx
 * <CircularProgress value={75} showLabel />
 * <CircularProgress value={100} variant="success" size={100} />
 * <CircularProgress animated size={80} />
 * ```
 */
export function CircularProgress({
  value,
  size = 80,
  strokeWidth = 4,
  showLabel = false,
  variant = 'primary',
  animated = false,
  className = ''
}: CircularProgressProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;

  const variantColors = {
    primary: '#3b82f6',
    success: '#10b981',
    warning: '#f59e0b',
    danger: '#ef4444'
  };

  return (
    <div className={`inline-flex flex-col items-center ${className}`}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        role="progressbar"
        aria-valuenow={Math.round(value)}
        aria-valuemin={0}
        aria-valuemax={100}
        className={animated ? 'animate-spin' : ''}
      >
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-gray-200 dark:text-gray-700"
        />

        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={variantColors[variant]}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-300"
          style={{
            transform: 'rotate(-90deg)',
            transformOrigin: `${size / 2}px ${size / 2}px`
          }}
        />
      </svg>

      {showLabel && (
        <span className="text-xs font-medium text-gray-700 dark:text-gray-300 mt-2">
          {Math.round(value)}%
        </span>
      )}
    </div>
  );
}

interface ProgressRingProps {
  /** Ring size in pixels */
  size?: number;
  /** Stroke width */
  strokeWidth?: number;
  /** Color variant */
  variant?: 'primary' | 'success' | 'warning' | 'danger';
}

/**
 * Indeterminate Progress Ring
 * Animated spinner-style progress indicator
 *
 * @example
 * ```tsx
 * <ProgressRing variant="primary" />
 * <ProgressRing size={60} />
 * ```
 */
export function ProgressRing({
  size = 48,
  strokeWidth = 4,
  variant = 'primary'
}: ProgressRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  const variantColors = {
    primary: '#3b82f6',
    success: '#10b981',
    warning: '#f59e0b',
    danger: '#ef4444'
  };

  return (
    <div className="inline-flex items-center justify-center">
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        role="status"
        aria-label="Loading"
        className="animate-spin"
      >
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-gray-200 dark:text-gray-700"
        />

        {/* Animated progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={variantColors[variant]}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference * 0.25}
          strokeDashoffset={0}
          strokeLinecap="round"
          style={{
            transform: 'rotate(-90deg)',
            transformOrigin: `${size / 2}px ${size / 2}px`
          }}
        />
      </svg>
    </div>
  );
}

export default {
  ProgressBar,
  CircularProgress,
  ProgressRing
};
