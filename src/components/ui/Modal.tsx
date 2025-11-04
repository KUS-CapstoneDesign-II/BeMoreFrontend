import type { ReactNode } from 'react';

interface ModalProps {
  children: ReactNode;
  isOpen: boolean;
  onClose?: () => void;
  title?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  animated?: boolean;
  className?: string;
}

const sizeConfig = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl'
};

export function Modal({
  children,
  isOpen,
  onClose,
  title,
  size = 'md',
  animated = true,
  className = ''
}: ModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className={`fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 ${animated ? 'animate-fade-in' : ''}`}
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onClick={onClose}
    >
      <div
        className={`
          bg-white dark:bg-gray-900 rounded-2xl shadow-soft-lg
          ${sizeConfig[size]} w-full p-6 sm:p-8
          ${animated ? 'animate-scale-in' : ''}
          ${className}
        `}
        onClick={(e) => e.stopPropagation()}
      >
        {title && (
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-4">
            {title}
          </h2>
        )}
        {children}
      </div>
    </div>
  );
}
