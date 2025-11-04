import type { ReactNode } from 'react';

interface MetricCardProps {
  label: string;
  value: string | number;
  color: 'blue' | 'gray' | 'purple' | 'red' | 'green' | 'amber' | 'orange' | 'indigo';
  icon?: ReactNode;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  ariaLabel?: string;
}

const colorConfig: Record<string, { bg: string; text: string }> = {
  blue: { bg: 'bg-blue-50 dark:bg-blue-900/20', text: 'text-blue-600 dark:text-blue-400' },
  gray: { bg: 'bg-gray-50 dark:bg-gray-900/20', text: 'text-gray-600 dark:text-gray-400' },
  purple: { bg: 'bg-purple-50 dark:bg-purple-900/20', text: 'text-purple-600 dark:text-purple-400' },
  red: { bg: 'bg-red-50 dark:bg-red-900/20', text: 'text-red-600 dark:text-red-400' },
  green: { bg: 'bg-green-50 dark:bg-green-900/20', text: 'text-green-600 dark:text-green-400' },
  amber: { bg: 'bg-amber-50 dark:bg-amber-900/20', text: 'text-amber-600 dark:text-amber-400' },
  orange: { bg: 'bg-orange-50 dark:bg-orange-900/20', text: 'text-orange-600 dark:text-orange-400' },
  indigo: { bg: 'bg-indigo-50 dark:bg-indigo-900/20', text: 'text-indigo-600 dark:text-indigo-400' }
};

const sizeConfig = {
  sm: { label: 'text-xs', value: 'text-base', padding: 'p-2' },
  md: { label: 'text-sm', value: 'text-lg', padding: 'p-3' },
  lg: { label: 'text-base', value: 'text-2xl', padding: 'p-4' }
};

export function MetricCard({
  label,
  value,
  color,
  icon,
  size = 'md',
  className = '',
  ariaLabel
}: MetricCardProps) {
  const { bg, text } = colorConfig[color] || colorConfig.blue;
  const { label: labelSize, value: valueSize, padding } = sizeConfig[size];

  return (
    <div
      className={`${bg} ${padding} rounded-lg transition-all duration-200 ${className}`}
      aria-label={ariaLabel}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1">
          <div className={`text-gray-600 dark:text-gray-400 mb-1 ${labelSize}`}>{label}</div>
          <div className={`${text} font-bold ${valueSize}`}>{value}</div>
        </div>
        {icon && <div className="flex-shrink-0">{icon}</div>}
      </div>
    </div>
  );
}
