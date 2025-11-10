import React, { type ReactNode } from 'react';

export type ButtonVariant = 'primary' | 'success' | 'warning' | 'danger' | 'secondary' | 'ghost' | 'neutral';
export type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  icon?: ReactNode;
  label?: string;
  fullWidth?: boolean;
}

const variantConfig: Record<ButtonVariant, {
  gradient: string;
  ring: string;
  text: string;
}> = {
  primary: {
    gradient: 'from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 dark:from-blue-600 dark:to-blue-700',
    ring: 'focus:ring-blue-400',
    text: 'text-white'
  },
  success: {
    gradient: 'from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 dark:from-emerald-600 dark:to-emerald-700',
    ring: 'focus:ring-emerald-400',
    text: 'text-white'
  },
  warning: {
    gradient: 'from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 dark:from-amber-600 dark:to-amber-700',
    ring: 'focus:ring-amber-400',
    text: 'text-white'
  },
  danger: {
    gradient: 'from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 dark:from-red-600 dark:to-rose-700',
    ring: 'focus:ring-red-400',
    text: 'text-white'
  },
  secondary: {
    gradient: 'bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600',
    ring: 'focus:ring-gray-400',
    text: 'text-gray-700 dark:text-gray-200'
  },
  neutral: {
    gradient: 'bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700',
    ring: 'focus:ring-gray-400',
    text: 'text-gray-700 dark:text-gray-200'
  },
  ghost: {
    gradient: 'hover:bg-gray-100 dark:hover:bg-gray-700',
    ring: 'focus:ring-gray-400',
    text: 'text-gray-600 dark:text-gray-300'
  }
};

/**
 * Unified Button component combining best features from Common and ui
 *
 * Features:
 * - 7 variants: primary, success, warning, danger, secondary, neutral, ghost
 * - 3 sizes: sm, md, lg
 * - Loading state with SVG spinner
 * - Icon support
 * - Full width option
 * - Accessibility: min-height 44px (WCAG touch target)
 * - Dark mode support
 * - forwardRef for ref passing
 */
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({
    variant = 'primary',
    size = 'md',
    isLoading = false,
    icon,
    label,
    fullWidth = false,
    className = '',
    disabled,
    children,
    ...props
  }, ref) => {
    const config = variantConfig[variant];

    const sizeClasses = {
      sm: 'px-3 py-2 text-sm min-h-[36px]',
      md: 'px-6 py-3 text-base min-h-[44px]',
      lg: 'px-8 py-4 text-lg min-h-[48px]'
    }[size];

    const baseClasses = variant === 'secondary' || variant === 'neutral' || variant === 'ghost'
      ? config.gradient
      : `bg-gradient-to-r ${config.gradient}`;

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={`
          flex items-center justify-center gap-2
          ${sizeClasses}
          ${baseClasses}
          ${config.text}
          font-semibold rounded-lg
          transition-all duration-200 shadow-soft hover:shadow-soft-lg
          focus:outline-none focus:ring-2 ${config.ring} focus:ring-offset-2
          active:scale-95 transform
          disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100
          ${fullWidth ? 'w-full' : ''}
          ${className}
        `}
        {...props}
      >
        {icon && !isLoading && <span className="flex-shrink-0">{icon}</span>}
        {isLoading && (
          <svg
            className="w-4 h-4 animate-spin flex-shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        <span>{label || children}</span>
      </button>
    );
  }
);

Button.displayName = 'Button';
