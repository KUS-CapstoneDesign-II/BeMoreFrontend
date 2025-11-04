import React from 'react';

interface TagPillProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'type'> {
  active?: boolean;
  variant?: 'default' | 'colored';
  icon?: React.ReactNode;
}

/**
 * 🎨 TagPill - Filter/label button component
 * - Active state with blue highlight
 * - Smooth transitions on state change
 * - Accessible with proper ARIA attributes
 */
export const TagPill = React.forwardRef<HTMLButtonElement, TagPillProps>(
  ({ active = false, icon, className = '', children, ...props }, ref) => {
    const activeClass = active
      ? 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800'
      : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700 dark:hover:bg-gray-700';

    return (
      <button
        ref={ref}
        type="button"
        role="switch"
        aria-pressed={active}
        className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-all ${activeClass} ${className}`}
        {...props}
      >
        <span className="flex items-center gap-2">
          {icon && <span className="flex-shrink-0">{icon}</span>}
          {children}
        </span>
      </button>
    );
  }
);

TagPill.displayName = 'TagPill';

// ─────────────────────────────────────

export interface FilterBarProps {
  filters: Array<{
    id: string;
    label: string;
    icon?: React.ReactNode;
  }>;
  activeFilter: string;
  onFilterChange: (id: string) => void;
  className?: string;
}

/**
 * 🎨 FilterBar - Group of TagPills for filtering
 * Common pattern in SessionResult for filtering markers/bookmarks
 */
export const FilterBar: React.FC<FilterBarProps> = ({ filters, activeFilter, onFilterChange, className = '' }) => {
  return (
    <div className={`flex flex-wrap gap-2 items-center ${className}`}>
      {filters.map((filter) => (
        <TagPill
          key={filter.id}
          active={activeFilter === filter.id}
          onClick={() => onFilterChange(filter.id)}
          icon={filter.icon}
        >
          {filter.label}
        </TagPill>
      ))}
    </div>
  );
};
