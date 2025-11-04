import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  noBorder?: boolean;
  noShadow?: boolean;
}

/**
 * 🎨 Base Card component - Unified styling
 * Used as building block for all card-based UI elements
 */
export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className = '', noBorder = false, noShadow = false, ...props }, ref) => {
    const borderClass = noBorder ? '' : 'border border-gray-200 dark:border-gray-700';
    const shadowClass = noShadow ? '' : 'shadow-soft';

    return (
      <div
        ref={ref}
        className={`bg-white dark:bg-gray-900 rounded-xl ${borderClass} ${shadowClass} ${className}`}
        {...props}
      />
    );
  }
);

Card.displayName = 'Card';

// ─────────────────────────────────────

type MetricColor = 'blue' | 'gray' | 'violet' | 'red' | 'emerald';

interface MetricCardProps {
  label: string;
  value: string;
  color?: MetricColor;
  icon?: React.ReactNode;
  subtext?: string;
}

const colorStyles: Record<MetricColor, { bg: string; text: string }> = {
  blue: {
    bg: 'bg-blue-50 dark:bg-blue-900/20',
    text: 'text-blue-600 dark:text-blue-400',
  },
  gray: {
    bg: 'bg-gray-50 dark:bg-gray-800',
    text: 'text-gray-600 dark:text-gray-300',
  },
  violet: {
    bg: 'bg-violet-50 dark:bg-violet-900/20',
    text: 'text-violet-600 dark:text-violet-400',
  },
  red: {
    bg: 'bg-red-50 dark:bg-red-900/20',
    text: 'text-red-600 dark:text-red-400',
  },
  emerald: {
    bg: 'bg-emerald-50 dark:bg-emerald-900/20',
    text: 'text-emerald-600 dark:text-emerald-400',
  },
};

/**
 * 🎨 MetricCard - Display single metric with icon, value, and label
 * - Colored background based on metric type
 * - Icon support for visual cues
 * - Responsive text sizing
 */
export const MetricCard: React.FC<MetricCardProps> = ({
  label,
  value,
  color = 'gray',
  icon,
  subtext,
}) => {
  const { bg, text } = colorStyles[color];

  return (
    <div className={`p-4 rounded-lg ${bg} transition-all hover:shadow-soft`}>
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">
          {label}
        </div>
        {icon && <div className="text-lg flex-shrink-0">{icon}</div>}
      </div>
      <div className={`text-2xl font-bold ${text}`}>{value}</div>
      {subtext && <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{subtext}</div>}
    </div>
  );
};

// ─────────────────────────────────────

interface StatBoxProps {
  label: string;
  value: string | number;
  unit?: string;
  trend?: 'up' | 'down' | 'neutral';
}

/**
 * 🎨 StatBox - Compact stat display with optional trend indicator
 */
export const StatBox: React.FC<StatBoxProps> = ({ label, value, unit, trend }) => {
  const trendColor =
    trend === 'up' ? 'text-emerald-600 dark:text-emerald-400' : trend === 'down' ? 'text-red-600 dark:text-red-400' : '';
  const trendIcon = trend === 'up' ? '↑' : trend === 'down' ? '↓' : '';

  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs font-medium text-gray-600 dark:text-gray-400">{label}</span>
      <div className="flex items-baseline gap-1">
        <span className="text-lg font-semibold text-gray-900 dark:text-gray-100">{value}</span>
        {unit && <span className="text-xs text-gray-500 dark:text-gray-400">{unit}</span>}
        {trendIcon && <span className={`text-sm ml-1 ${trendColor}`}>{trendIcon}</span>}
      </div>
    </div>
  );
};
