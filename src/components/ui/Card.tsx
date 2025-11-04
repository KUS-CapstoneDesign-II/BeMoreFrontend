import type { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  bgColor?: string;
  borderColor?: string;
  animate?: string;
  role?: string;
  ariaLabel?: string;
  ariaLive?: 'polite' | 'assertive' | 'off';
}

export function Card({
  children,
  className = '',
  bgColor = 'bg-white dark:bg-gray-800',
  borderColor = 'border-gray-200 dark:border-gray-700',
  animate = '',
  role,
  ariaLabel,
  ariaLive
}: CardProps) {
  return (
    <div
      className={`
        p-5 rounded-xl border-2 shadow-soft
        ${bgColor}
        border-${borderColor}
        transition-all duration-300 ease-smooth
        hover:shadow-soft-lg hover:scale-[1.02]
        ${animate}
        ${className}
      `}
      role={role}
      aria-label={ariaLabel}
      aria-live={ariaLive}
    >
      {children}
    </div>
  );
}
