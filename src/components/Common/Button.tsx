import React from 'react';

export type ButtonVariant = 'primary' | 'success' | 'warning' | 'danger' | 'neutral';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  isLoading?: boolean;
  icon?: React.ReactNode;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    'bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 focus:ring-blue-400 dark:from-blue-600 dark:to-blue-700',
  success:
    'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white hover:from-emerald-600 hover:to-emerald-700 focus:ring-emerald-400 dark:from-emerald-600 dark:to-emerald-700',
  warning:
    'bg-gradient-to-r from-amber-500 to-amber-600 text-white hover:from-amber-600 hover:to-amber-700 focus:ring-amber-400 dark:from-amber-600 dark:to-amber-700',
  danger:
    'bg-gradient-to-r from-red-500 to-rose-600 text-white hover:from-red-600 hover:to-rose-700 focus:ring-red-400 dark:from-red-600 dark:to-rose-700',
  neutral:
    'bg-gray-100 text-gray-700 hover:bg-gray-200 focus:ring-gray-400 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700 dark:focus:ring-gray-600',
};

/**
 * 🎨 Unified Button component with multiple variants
 * - Primary: Blue gradient (CTA)
 * - Success: Emerald gradient (Positive action)
 * - Warning: Amber gradient (Cautious action)
 * - Danger: Red/Rose gradient (Destructive action)
 * - Neutral: Gray (Secondary action)
 */
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', isLoading = false, icon, className = '', disabled, ...props }, ref) => {
    const baseStyles =
      'px-4 py-2.5 sm:px-6 sm:py-3 min-h-[44px] rounded-lg font-medium shadow-soft hover:shadow-soft-lg transition-all active:scale-95 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';

    const variantStyle = variantStyles[variant];

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={`${baseStyles} ${variantStyle} ${className}`}
        {...props}
      >
        <div className="flex items-center justify-center gap-2">
          {icon && !isLoading && icon}
          {isLoading && <span className="inline-block animate-spin">⏳</span>}
          {props.children}
        </div>
      </button>
    );
  }
);

Button.displayName = 'Button';
