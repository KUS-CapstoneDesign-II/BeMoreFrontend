import React, { type ReactNode } from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  noBorder?: boolean;
  noShadow?: boolean;
  bgColor?: string;
  borderColor?: string;
  animate?: string;
  hoverEffect?: boolean;
  ariaLabel?: string;
  ariaLive?: 'polite' | 'assertive' | 'off';
}

/**
 * Unified Card component combining best features from Common and ui
 *
 * Features:
 * - Flexible styling: noBorder, noShadow, custom colors
 * - Hover effects (optional scale animation)
 * - Accessibility: ARIA attributes support
 * - Dark mode support
 * - forwardRef for ref passing
 * - Animation support
 */
export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({
    children,
    className = '',
    noBorder = false,
    noShadow = false,
    bgColor = 'bg-white dark:bg-gray-900',
    borderColor = 'border-gray-200 dark:border-gray-700',
    animate = '',
    hoverEffect = false,
    role,
    ariaLabel,
    ariaLive,
    ...props
  }, ref) => {
    const borderClass = noBorder ? '' : `border ${borderColor}`;
    const shadowClass = noShadow ? '' : 'shadow-soft';
    const hoverClass = hoverEffect ? 'hover:shadow-soft-lg hover:scale-[1.02]' : '';

    return (
      <div
        ref={ref}
        className={`
          ${bgColor}
          rounded-xl
          ${borderClass}
          ${shadowClass}
          ${hoverClass}
          ${animate}
          transition-all duration-300 ease-smooth
          ${className}
        `}
        role={role}
        aria-label={ariaLabel}
        aria-live={ariaLive}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';
